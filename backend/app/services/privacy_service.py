from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    AssistantMessage,
    AssistantThread,
    CareEvent,
    Observation,
    PendingAction,
    PriceAlert,
    RoutinePlan,
    RoutineSession,
    SkinProfile,
    UploadedPhoto,
    User,
    UserProduct,
)
from app.models.routine import RoutineStep
from app.models.product import ScanCandidate
from app.services.storage_service import delete_stored_object


def serialize(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, UUID):
        return str(value)
    return value


def model_to_dict(model, exclude: set[str] | None = None) -> dict:
    exclude = exclude or set()
    return {
        column.name: serialize(getattr(model, column.name))
        for column in model.__table__.columns
        if column.name not in exclude
    }


async def export_user_data(session: AsyncSession, user: User) -> dict:
    profile = await session.scalar(select(SkinProfile).where(SkinProfile.user_id == user.id))
    routine_plans = list((await session.scalars(select(RoutinePlan).where(RoutinePlan.user_id == user.id))).all())
    routine_plan_ids = [plan.id for plan in routine_plans]
    routine_steps = []
    if routine_plan_ids:
        routine_steps = list((await session.scalars(select(RoutineStep).where(RoutineStep.routine_plan_id.in_(routine_plan_ids)))).all())
    threads = list((await session.scalars(select(AssistantThread).where(AssistantThread.user_id == user.id))).all())
    thread_ids = [thread.id for thread in threads]
    messages = []
    if thread_ids:
        messages = list((await session.scalars(select(AssistantMessage).where(AssistantMessage.thread_id.in_(thread_ids)))).all())

    return {
        "exported_at": datetime.now(UTC).isoformat(),
        "user": model_to_dict(user),
        "profile": model_to_dict(profile) if profile else None,
        "routine_plans": [model_to_dict(item) for item in routine_plans],
        "routine_steps": [model_to_dict(item) for item in routine_steps],
        "routine_sessions": [model_to_dict(item) for item in (await session.scalars(select(RoutineSession).where(RoutineSession.user_id == user.id))).all()],
        "owned_products": [model_to_dict(item) for item in (await session.scalars(select(UserProduct).where(UserProduct.user_id == user.id))).all()],
        "observations": [model_to_dict(item) for item in (await session.scalars(select(Observation).where(Observation.user_id == user.id))).all()],
        "uploaded_photos": [model_to_dict(item) for item in (await session.scalars(select(UploadedPhoto).where(UploadedPhoto.user_id == user.id))).all()],
        "scan_candidates": [model_to_dict(item) for item in (await session.scalars(select(ScanCandidate).where(ScanCandidate.user_id == user.id))).all()],
        "price_alerts": [model_to_dict(item) for item in (await session.scalars(select(PriceAlert).where(PriceAlert.user_id == user.id))).all()],
        "events": [model_to_dict(item) for item in (await session.scalars(select(CareEvent).where(CareEvent.user_id == user.id))).all()],
        "assistant_threads": [model_to_dict(item) for item in threads],
        "assistant_messages": [model_to_dict(item) for item in messages],
        "pending_actions": [model_to_dict(item) for item in (await session.scalars(select(PendingAction).where(PendingAction.user_id == user.id))).all()],
    }


async def delete_user_account(session: AsyncSession, user: User) -> dict:
    photos = list((await session.scalars(select(UploadedPhoto).where(UploadedPhoto.user_id == user.id))).all())
    deleted_files = 0
    for photo in photos:
        deleted_files += int(delete_stored_object(photo.storage_path))

    threads = list((await session.scalars(select(AssistantThread).where(AssistantThread.user_id == user.id))).all())
    thread_ids = [thread.id for thread in threads]
    if thread_ids:
        await session.execute(delete(AssistantMessage).where(AssistantMessage.thread_id.in_(thread_ids)))
    routine_plans = list((await session.scalars(select(RoutinePlan).where(RoutinePlan.user_id == user.id))).all())
    plan_ids = [plan.id for plan in routine_plans]
    if plan_ids:
        await session.execute(delete(RoutineStep).where(RoutineStep.routine_plan_id.in_(plan_ids)))

    for model in [
        AssistantThread,
        PendingAction,
        CareEvent,
        Observation,
        PriceAlert,
        ScanCandidate,
        UploadedPhoto,
        UserProduct,
        RoutineSession,
        RoutinePlan,
        SkinProfile,
    ]:
        await session.execute(delete(model).where(model.user_id == user.id))
    await session.delete(user)
    await session.commit()
    return {"status": "deleted", "deleted_files": deleted_files}
