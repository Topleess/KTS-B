from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.api.deps import CurrentUser, SessionDep
from app.services.inbox_service import (
    dismiss_all_events,
    dismiss_event,
    event_summary,
    event_to_dict,
    get_user_event,
    list_user_events,
    mark_all_events_read,
    mark_event_read,
)

router = APIRouter(prefix="/events", tags=["events"])


@router.get("")
async def events_index(
    session: SessionDep,
    user: CurrentUser,
    status: str | None = Query(default=None, pattern="^(unread|read|dismissed)$"),
    event_type: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
) -> list[dict]:
    events = await list_user_events(session, user, status=status, event_type=event_type, limit=limit)
    return [event_to_dict(event) for event in events]


@router.get("/summary")
async def events_summary(session: SessionDep, user: CurrentUser) -> dict:
    return await event_summary(session, user)


@router.patch("/read-all")
async def events_read_all(session: SessionDep, user: CurrentUser) -> dict:
    return await mark_all_events_read(session, user)


@router.patch("/dismiss-all")
async def events_dismiss_all(session: SessionDep, user: CurrentUser) -> dict:
    return await dismiss_all_events(session, user)


@router.patch("/{event_id}/read")
async def event_read(event_id: UUID, session: SessionDep, user: CurrentUser) -> dict:
    event = await get_user_event(session, user, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await mark_event_read(session, event)
    return {"status": "read", "id": str(event.id)}


@router.patch("/{event_id}/dismiss")
async def event_dismiss(event_id: UUID, session: SessionDep, user: CurrentUser) -> dict:
    event = await get_user_event(session, user, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await dismiss_event(session, event)
    return {"status": "dismissed", "id": str(event.id)}
