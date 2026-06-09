from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CareEvent, User
from app.schemas.care import CareTimelineAction, CareTimelineItem, CareTodayRead
from app.services.environment_service import get_environment_context
from app.services.inbox_service import event_status
from app.services.observation_service import list_observations
from app.services.product_service import list_user_products
from app.services.profile_service import get_profile
from app.services.routine_service import get_active_plan, get_progress


def active_period_for_now(now: datetime | None = None) -> str:
    hour = (now or datetime.now()).hour
    if hour >= 18:
        return "evening"
    if hour >= 12:
        return "day"
    return "morning"


def timeline_action(action_type: str, label: str, payload: dict) -> CareTimelineAction:
    return CareTimelineAction(type=action_type, label=label, payload=payload)


def event_action(event: CareEvent) -> CareTimelineAction | None:
    payload = event.payload or {}
    if event.event_type == "price_drop" and payload.get("product_id"):
        return timeline_action("open_price_comparison", "сравнить цены", {"product_id": payload["product_id"], "event_id": str(event.id)})
    if event.event_type == "product_low" and payload.get("product_id"):
        return timeline_action("open_product", "открыть средство", {"product_id": payload["product_id"], "event_id": str(event.id)})
    if event.event_type == "uv_high":
        return timeline_action("open_routine", "обновить SPF", {"mode": "spf_reapply", "event_id": str(event.id)})
    if event.event_type == "followup":
        return timeline_action("open_observation_form", "отметить ощущение", payload | {"event_id": str(event.id)})
    if event.event_type == "routine_time":
        return timeline_action("open_routine", "начать рутину", payload | {"event_id": str(event.id)})
    return None


async def build_care_today(session: AsyncSession, user: User) -> CareTodayRead:
    profile = await get_profile(session, user)
    routine = await get_active_plan(session, user)
    owned = await list_user_products(session, user)
    observations = await list_observations(session, user, limit=5)
    events = await session.scalars(
        select(CareEvent).where(CareEvent.user_id == user.id).order_by(CareEvent.created_at.desc()).limit(5)
    )
    environment = await get_environment_context(profile.manual_city)
    period = active_period_for_now()
    greeting = "Доброе утро. Вот твоя утренняя рутина."
    if period == "day":
        greeting = "Днём главное не забыть про SPF и комфорт кожи."
    if period == "evening":
        greeting = "Вечерний уход готов: мягко закрываем день."
    return CareTodayRead(
        date=date.today(),
        greeting=greeting,
        active_period=period,
        environment=environment,
        routine=routine,
        products_low=[item for item in owned if item.amount_left_percent is not None and item.amount_left_percent <= 20],
        recent_observations=observations,
        events=[
            {
                "id": str(event.id),
                "type": event.event_type,
                "title": event.title,
                "body": event.body,
                "payload": event.payload,
            }
            for event in events.all()
        ],
    )


async def build_care_timeline(session: AsyncSession, user: User, limit: int = 20) -> list[CareTimelineItem]:
    today = await build_care_today(session, user)
    progress = await get_progress(session, user, today.active_period)
    items: list[CareTimelineItem] = []

    next_step = progress["next_step"]
    routine_title = "Уход на сейчас"
    routine_body = "Рутина готова к запуску."
    routine_label = "начать рутину"
    if progress["session"]:
        routine_title = "Уход в процессе"
        routine_body = f"Выполнено {progress['completed_steps']} из {progress['total_steps']} шагов."
        routine_label = "продолжить"
    if progress["total_steps"] and progress["completed_steps"] == progress["total_steps"]:
        routine_title = "Уход завершён"
        routine_body = "Можно отметить ощущения кожи после ухода."
        routine_label = "отметить ощущение"
    elif next_step:
        routine_body = f"Следующий шаг: {next_step.purpose}."
    items.append(
        CareTimelineItem(
            id=f"routine-{today.active_period}",
            item_type="routine",
            title=routine_title,
            body=routine_body,
            priority=10,
            action=timeline_action(
                "open_observation_form" if routine_label == "отметить ощущение" else "open_routine",
                routine_label,
                {"period": today.active_period, "session_id": str(progress["session"].id) if progress["session"] else None},
            ),
        )
    )

    if today.environment.uv_index >= 6:
        items.append(
            CareTimelineItem(
                id="environment-uv",
                item_type="environment",
                title="SPF актуален сегодня",
                body=today.environment.spf_hint,
                priority=20,
                action=timeline_action("open_routine", "обновить SPF", {"mode": "spf_reapply", "uv_index": today.environment.uv_index}),
            )
        )

    for owned in today.products_low[:3]:
        items.append(
            CareTimelineItem(
                id=f"product-low-{owned.id}",
                item_type="product_low",
                title=f"{owned.product.name} заканчивается",
                body=f"Остаток примерно {owned.amount_left_percent}%. Можно проверить цену или замену.",
                priority=30,
                action=timeline_action("open_product", "открыть средство", {"owned_id": str(owned.id), "product_id": str(owned.product.id)}),
            )
        )

    events = await session.scalars(
        select(CareEvent).where(CareEvent.user_id == user.id).order_by(CareEvent.created_at.desc()).limit(10)
    )
    for event in events.all():
        if event_status(event) != "unread":
            continue
        items.append(
            CareTimelineItem(
                id=f"event-{event.id}",
                item_type=f"event:{event.event_type}",
                title=event.title,
                body=event.body,
                priority=40,
                action=event_action(event),
                created_at=event.created_at,
            )
        )

    for observation in today.recent_observations:
        if observation.severity < 2:
            continue
        items.append(
            CareTimelineItem(
                id=f"observation-{observation.id}",
                item_type="observation_followup",
                title="Проверить реакцию кожи",
                body=observation.notes or observation.feeling,
                priority=50,
                action=timeline_action(
                    "open_observation_form",
                    "добавить follow-up",
                    {"observation_id": str(observation.id), "product_id": str(observation.product_id) if observation.product_id else None},
                ),
                created_at=observation.created_at,
            )
        )

    return sorted(items, key=lambda item: (item.priority, item.created_at or datetime.min))[: min(limit, 50)]
