from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CareEvent, User


async def create_event_once(
    session: AsyncSession,
    user: User,
    event_type: str,
    title: str,
    body: str,
    payload: dict | None = None,
) -> CareEvent | None:
    existing = await session.scalar(
        select(CareEvent).where(
            CareEvent.user_id == user.id,
            CareEvent.event_type == event_type,
            CareEvent.title == title,
            CareEvent.is_read.is_(False),
        )
    )
    if existing:
        return None
    event = CareEvent(user_id=user.id, event_type=event_type, title=title, body=body, payload=payload or {})
    session.add(event)
    await session.flush()
    return event
