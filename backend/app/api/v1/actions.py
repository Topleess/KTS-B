from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, SessionDep
from app.schemas.action import ActionPreviewRequest, ActionRead, ActionReceipt, ActionRejectRequest
from app.services.action_service import action_summary, confirm_action, list_actions, preview_action, reject_action, undo_action

router = APIRouter(prefix="/actions", tags=["actions"])


@router.get("", response_model=list[ActionRead])
async def actions_index(
    session: SessionDep,
    user: CurrentUser,
    status: str | None = Query(default=None, pattern="^(pending|confirmed|rejected|expired|undone)$"),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[ActionRead]:
    return await list_actions(session, user, status=status, limit=limit)


@router.get("/summary")
async def actions_summary(session: SessionDep, user: CurrentUser) -> dict:
    return await action_summary(session, user)


@router.post("/preview", response_model=ActionRead)
async def action_preview(payload: ActionPreviewRequest, session: SessionDep, user: CurrentUser) -> ActionRead:
    return await preview_action(session, user, payload)


@router.post("/{action_id}/confirm", response_model=ActionReceipt)
async def action_confirm(action_id: UUID, session: SessionDep, user: CurrentUser) -> ActionReceipt:
    action, receipt = await confirm_action(session, user, action_id)
    return ActionReceipt(action=action, receipt=receipt)


@router.post("/{action_id}/reject", response_model=ActionRead)
async def action_reject(action_id: UUID, payload: ActionRejectRequest, session: SessionDep, user: CurrentUser) -> ActionRead:
    return await reject_action(session, user, action_id, payload.reason)


@router.post("/{action_id}/undo", response_model=ActionReceipt)
async def action_undo(action_id: UUID, session: SessionDep, user: CurrentUser) -> ActionReceipt:
    action, receipt = await undo_action(session, user, action_id)
    return ActionReceipt(action=action, receipt=receipt)
