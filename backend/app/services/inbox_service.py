from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CareEvent, User


def event_status(event: CareEvent) -> str:
    payload_status = (event.payload or {}).get("status")
    if payload_status == "dismissed":
        return "dismissed"
    return "read" if event.is_read else "unread"


def event_to_dict(event: CareEvent) -> dict:
    return {
        "id": str(event.id),
        "event_type": event.event_type,
        "title": event.title,
        "body": event.body,
        "payload": event.payload,
        "is_read": event.is_read,
        "status": event_status(event),
        "created_at": event.created_at.isoformat(),
    }


async def list_user_events(
    session: AsyncSession,
    user: User,
    *,
    status: str | None = None,
    event_type: str | None = None,
    limit: int = 20,
) -> list[CareEvent]:
    result = await session.scalars(
        select(CareEvent).where(CareEvent.user_id == user.id).order_by(CareEvent.created_at.desc()).limit(min(limit, 100))
    )
    events = list(result.all())
    if event_type:
        events = [event for event in events if event.event_type == event_type]
    if status:
        events = [event for event in events if event_status(event) == status]
    return events


async def get_user_event(session: AsyncSession, user: User, event_id: UUID) -> CareEvent | None:
    event = await session.get(CareEvent, event_id)
    if not event or event.user_id != user.id:
        return None
    return event


async def mark_event_read(session: AsyncSession, event: CareEvent) -> CareEvent:
    event.is_read = True
    await session.commit()
    await session.refresh(event)
    return event


async def dismiss_event(session: AsyncSession, event: CareEvent) -> CareEvent:
    event.is_read = True
    event.payload = {**(event.payload or {}), "status": "dismissed"}
    await session.commit()
    await session.refresh(event)
    return event


async def mark_all_events_read(session: AsyncSession, user: User) -> dict:
    events = await session.scalars(select(CareEvent).where(CareEvent.user_id == user.id, CareEvent.is_read.is_(False)))
    updated = 0
    for event in events.all():
        event.is_read = True
        updated += 1
    await session.commit()
    return {"status": "read", "updated": updated}


async def dismiss_all_events(session: AsyncSession, user: User) -> dict:
    events = await session.scalars(select(CareEvent).where(CareEvent.user_id == user.id))
    updated = 0
    for event in events.all():
        if event_status(event) == "dismissed":
            continue
        event.is_read = True
        event.payload = {**(event.payload or {}), "status": "dismissed"}
        updated += 1
    await session.commit()
    return {"status": "dismissed", "updated": updated}


async def event_summary(session: AsyncSession, user: User) -> dict:
    total = await session.scalar(select(func.count()).select_from(CareEvent).where(CareEvent.user_id == user.id))
    events = await session.scalars(select(CareEvent).where(CareEvent.user_id == user.id))
    unread = 0
    dismissed = 0
    by_type: dict[str, int] = {}
    for event in events.all():
        status = event_status(event)
        unread += int(status == "unread")
        dismissed += int(status == "dismissed")
        by_type[event.event_type] = by_type.get(event.event_type, 0) + 1
    return {"total": total or 0, "unread": unread, "dismissed": dismissed, "by_type": by_type}
