from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from uuid import UUID

from app.api.deps import CurrentUser, SessionDep
from app.models import AssistantMessage, AssistantThread
from app.schemas.assistant import AssistantRequest
from app.services.assistant_service import stream_assistant_session

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/stream")
async def assistant_stream(payload: AssistantRequest, session: SessionDep, user: CurrentUser) -> StreamingResponse:
    return StreamingResponse(stream_assistant_session(session, user, payload), media_type="text/event-stream")


@router.post("/messages")
async def assistant_messages(payload: AssistantRequest, session: SessionDep, user: CurrentUser) -> StreamingResponse:
    return await assistant_stream(payload, session, user)


@router.get("/threads/{thread_id}")
async def assistant_thread(thread_id: UUID, session: SessionDep, user: CurrentUser) -> dict:
    thread = await session.get(AssistantThread, thread_id)
    if not thread or thread.user_id != user.id:
        return {"id": str(thread_id), "surface": "unknown", "messages": []}
    result = await session.scalars(
        select(AssistantMessage).where(AssistantMessage.thread_id == thread_id).order_by(AssistantMessage.created_at.asc())
    )
    return {
        "id": str(thread.id),
        "surface": thread.surface,
        "context": thread.context,
        "messages": [
            {
                "id": str(message.id),
                "role": message.role,
                "content": message.content,
                "blocks": message.blocks,
                "created_at": message.created_at.isoformat(),
            }
            for message in result.all()
        ],
    }
