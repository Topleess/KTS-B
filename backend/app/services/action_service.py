from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import Observation, PendingAction, PriceAlert, SkinProfile, User, UserProduct
from app.schemas.action import ActionPreviewRequest
from app.services.product_service import add_user_product
from app.services.profile_service import get_profile


def build_preview(action_type: str, payload: dict) -> dict:
    if action_type == "start_price_tracking":
        return {
            "title": "Отслеживать цену",
            "summary": f"Создам алерт ниже {payload.get('threshold_price', 'указанного порога')} ₽.",
            "requires_confirmation": True,
        }
    if action_type == "add_observation":
        return {
            "title": "Сохранить наблюдение",
            "summary": payload.get("notes") or "Добавлю ощущение кожи в дневник.",
            "requires_confirmation": True,
        }
    if action_type in {"update_budget", "update_goals"}:
        return {
            "title": "Обновить профиль",
            "summary": "Изменю настройки ухода и сохраню это в профиле.",
            "requires_confirmation": True,
        }
    if action_type == "add_owned_product":
        return {
            "title": "Добавить средство на полку",
            "summary": "Средство появится в разделе «Мои средства».",
            "requires_confirmation": True,
        }
    return {
        "title": "Подтвердить изменение",
        "summary": "Backend применит это действие только после подтверждения.",
        "requires_confirmation": True,
    }


def action_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(minutes=settings.pending_action_ttl_minutes)


def is_expired(action: PendingAction, now: datetime | None = None) -> bool:
    if action.status != "pending" or not action.expires_at:
        return False
    now = now or datetime.now(UTC)
    expires_at = action.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    return expires_at <= now


async def expire_action_if_needed(session: AsyncSession, action: PendingAction) -> bool:
    if not is_expired(action):
        return False
    action.status = "expired"
    await session.commit()
    await session.refresh(action)
    return True


async def expire_stale_actions(session: AsyncSession, user: User | None = None) -> int:
    query = select(PendingAction).where(PendingAction.status == "pending")
    if user:
        query = query.where(PendingAction.user_id == user.id)
    result = await session.scalars(query)
    expired = 0
    for action in result.all():
        if is_expired(action):
            action.status = "expired"
            expired += 1
    if expired:
        await session.commit()
    return expired


async def list_actions(session: AsyncSession, user: User, status: str | None = None, limit: int = 50) -> list[PendingAction]:
    await expire_stale_actions(session, user)
    query = select(PendingAction).where(PendingAction.user_id == user.id).order_by(PendingAction.created_at.desc()).limit(min(limit, 100))
    if status:
        query = query.where(PendingAction.status == status)
    return list((await session.scalars(query)).all())


async def action_summary(session: AsyncSession, user: User) -> dict:
    actions = await list_actions(session, user, limit=100)
    by_status: dict[str, int] = {}
    by_type: dict[str, int] = {}
    for action in actions:
        by_status[action.status] = by_status.get(action.status, 0) + 1
        by_type[action.action_type] = by_type.get(action.action_type, 0) + 1
    return {"total": len(actions), "by_status": by_status, "by_type": by_type}


async def preview_action(session: AsyncSession, user: User, payload: ActionPreviewRequest) -> PendingAction:
    action = PendingAction(
        user_id=user.id,
        action_type=payload.action_type,
        payload=payload.payload,
        preview=build_preview(payload.action_type, payload.payload),
        expires_at=action_expiry(),
    )
    session.add(action)
    await session.commit()
    await session.refresh(action)
    return action


async def confirm_action(session: AsyncSession, user: User, action_id: UUID) -> tuple[PendingAction, dict]:
    action = await session.get(PendingAction, action_id)
    if not action or action.user_id != user.id:
        raise HTTPException(status_code=404, detail="Action not found")
    if await expire_action_if_needed(session, action):
        raise HTTPException(status_code=409, detail="Action is expired")
    if action.status != "pending":
        raise HTTPException(status_code=409, detail="Action is already processed")

    receipt = await apply_action(session, user, action)
    action.status = "confirmed"
    action.confirmed_at = datetime.now(UTC)
    action.payload = {**(action.payload or {}), "_receipt": receipt}
    await session.commit()
    await session.refresh(action)
    return action, receipt


async def reject_action(session: AsyncSession, user: User, action_id: UUID, reason: str = "") -> PendingAction:
    action = await session.get(PendingAction, action_id)
    if not action or action.user_id != user.id:
        raise HTTPException(status_code=404, detail="Action not found")
    if await expire_action_if_needed(session, action):
        raise HTTPException(status_code=409, detail="Action is expired")
    if action.status != "pending":
        raise HTTPException(status_code=409, detail="Action is already processed")
    action.status = "rejected"
    action.payload = {**action.payload, "rejection_reason": reason}
    await session.commit()
    await session.refresh(action)
    return action


async def undo_action(session: AsyncSession, user: User, action_id: UUID) -> tuple[PendingAction, dict]:
    action = await session.get(PendingAction, action_id)
    if not action or action.user_id != user.id:
        raise HTTPException(status_code=404, detail="Action not found")
    if action.status != "confirmed":
        raise HTTPException(status_code=409, detail="Only confirmed actions can be undone")
    receipt = await rollback_action(session, user, action)
    action.status = "undone"
    await session.commit()
    await session.refresh(action)
    return action, receipt


async def rollback_action(session: AsyncSession, user: User, action: PendingAction) -> dict:
    receipt = (action.payload or {}).get("_receipt") or {}
    if action.action_type == "add_observation" and receipt.get("created") == "observation":
        observation = await session.get(Observation, UUID(receipt["id"]))
        if observation and observation.user_id == user.id:
            await session.delete(observation)
            await session.flush()
            return {"status": "undone", "removed": "observation", "id": receipt["id"]}

    if action.action_type == "start_price_tracking" and receipt.get("created") == "price_alert":
        alert = await session.get(PriceAlert, UUID(receipt["id"]))
        if alert and alert.user_id == user.id:
            alert.is_active = False
            await session.flush()
            return {"status": "undone", "disabled": "price_alert", "id": receipt["id"]}

    if action.action_type == "add_owned_product" and receipt.get("created") == "owned_product":
        owned = await session.get(UserProduct, UUID(receipt["id"]))
        previous = receipt.get("previous")
        if owned and owned.user_id == user.id:
            if previous:
                owned.status = previous.get("status", owned.status)
                owned.note = previous.get("note", owned.note)
                owned.amount_left_percent = previous.get("amount_left_percent")
                await session.flush()
                return {"status": "undone", "restored": "owned_product", "id": receipt["id"]}
            await session.delete(owned)
            await session.flush()
            return {"status": "undone", "removed": "owned_product", "id": receipt["id"]}

    if action.action_type == "update_budget" and receipt.get("updated") == "budget":
        profile = await get_profile(session, user)
        profile.budget_limit = receipt.get("previous_budget_limit")
        await session.flush()
        return {"status": "undone", "restored": "budget", "value": profile.budget_limit}

    if action.action_type == "update_goals" and receipt.get("updated") == "goals":
        profile = await get_profile(session, user)
        profile.goals = receipt.get("previous_goals") or []
        await session.flush()
        return {"status": "undone", "restored": "goals", "value": profile.goals}

    return {
        "status": "undone",
        "action_type": action.action_type,
        "note": "Undo marker saved; no reversible receipt was available.",
    }


async def apply_action(session: AsyncSession, user: User, action: PendingAction) -> dict:
    payload = action.payload
    if action.action_type == "add_observation":
        observation = Observation(
            user_id=user.id,
            product_id=UUID(payload["product_id"]) if payload.get("product_id") else None,
            feeling=payload.get("feeling", "после ухода"),
            severity=int(payload.get("severity", 0)),
            notes=payload.get("notes", ""),
            metrics=payload.get("metrics", {}),
        )
        session.add(observation)
        await session.flush()
        return {"status": "applied", "created": "observation", "id": str(observation.id), "next": "observations"}

    if action.action_type == "start_price_tracking":
        if "product_id" not in payload:
            raise HTTPException(status_code=422, detail="product_id is required for price tracking")
        alert = PriceAlert(
            user_id=user.id,
            product_id=UUID(payload["product_id"]),
            threshold_price=payload.get("threshold_price"),
            retailers=payload.get("retailers", []),
        )
        session.add(alert)
        await session.flush()
        return {"status": "applied", "created": "price_alert", "id": str(alert.id), "next": "prices"}

    if action.action_type == "update_budget":
        profile: SkinProfile = await get_profile(session, user)
        previous_budget_limit = profile.budget_limit
        profile.budget_limit = int(payload["budget_limit"])
        await session.flush()
        return {
            "status": "applied",
            "updated": "budget",
            "previous_budget_limit": previous_budget_limit,
            "next": "profile",
        }

    if action.action_type == "update_goals":
        profile = await get_profile(session, user)
        previous_goals = list(profile.goals or [])
        profile.goals = payload.get("goals", [])
        await session.flush()
        return {"status": "applied", "updated": "goals", "previous_goals": previous_goals, "next": "profile"}

    if action.action_type == "add_owned_product":
        existing_owned = await session.scalar(
            select(UserProduct).where(UserProduct.user_id == user.id, UserProduct.product_id == UUID(payload["product_id"]))
        )
        previous = None
        if existing_owned:
            previous = {
                "status": existing_owned.status,
                "note": existing_owned.note,
                "amount_left_percent": existing_owned.amount_left_percent,
            }
        owned = await add_user_product(
            session,
            user,
            UUID(payload["product_id"]),
            status=payload.get("status", "used"),
            note=payload.get("note", "Добавлено через подтверждённое действие"),
            amount_left_percent=payload.get("amount_left_percent"),
            commit=False,
        )
        return {"status": "applied", "created": "owned_product", "id": str(owned.id), "previous": previous, "next": "products"}

    return {"status": "applied", "action_type": action.action_type, "next": "refresh_related_surface"}
