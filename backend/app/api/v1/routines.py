from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, SessionDep
from app.schemas.routine import (
    CompleteStepRequest,
    RoutinePlanRead,
    RoutineProgressRead,
    RoutineQuestionnaireRequest,
    RoutineSessionCreate,
    RoutineSessionRead,
    RoutineStepCreate,
    RoutineStepRead,
    RoutineStepUpdate,
)
from app.services.routine_service import (
    complete_session,
    complete_step,
    create_routine_step,
    deactivate_routine_step,
    generate_routine_from_questionnaire,
    get_active_plan,
    get_current_session,
    get_or_start_current_session,
    get_progress,
    list_sessions,
    start_session,
    update_routine_step,
)

router = APIRouter(prefix="/routines", tags=["routines"])


@router.get("/active", response_model=RoutinePlanRead)
async def active_routine(session: SessionDep, user: CurrentUser) -> RoutinePlanRead:
    return await get_active_plan(session, user)


@router.post("/generate", response_model=RoutinePlanRead)
async def generate_routine(payload: RoutineQuestionnaireRequest, session: SessionDep, user: CurrentUser) -> RoutinePlanRead:
    return await generate_routine_from_questionnaire(session, user, payload)


@router.post("/steps", response_model=RoutineStepRead)
async def create_step(payload: RoutineStepCreate, session: SessionDep, user: CurrentUser) -> RoutineStepRead:
    return await create_routine_step(session, user, payload)


@router.patch("/steps/{step_id}", response_model=RoutineStepRead)
async def patch_step(step_id: UUID, payload: RoutineStepUpdate, session: SessionDep, user: CurrentUser) -> RoutineStepRead:
    return await update_routine_step(session, user, step_id, payload)


@router.delete("/steps/{step_id}", response_model=RoutineStepRead)
async def delete_step(step_id: UUID, session: SessionDep, user: CurrentUser) -> RoutineStepRead:
    return await deactivate_routine_step(session, user, step_id)


@router.post("/sessions", response_model=RoutineSessionRead)
async def create_session(payload: RoutineSessionCreate, session: SessionDep, user: CurrentUser) -> RoutineSessionRead:
    return await start_session(session, user, payload.period)


@router.get("/sessions", response_model=list[RoutineSessionRead])
async def history(session: SessionDep, user: CurrentUser, limit: int = Query(default=20, ge=1, le=100)) -> list[RoutineSessionRead]:
    return await list_sessions(session, user, limit)


@router.get("/sessions/current", response_model=RoutineSessionRead | None)
async def current_session(period: str, session: SessionDep, user: CurrentUser) -> RoutineSessionRead | None:
    return await get_current_session(session, user, period)


@router.post("/sessions/current", response_model=RoutineSessionRead)
async def start_current_session(payload: RoutineSessionCreate, session: SessionDep, user: CurrentUser) -> RoutineSessionRead:
    return await get_or_start_current_session(session, user, payload.period)


@router.get("/progress", response_model=RoutineProgressRead)
async def progress(period: str, session: SessionDep, user: CurrentUser) -> RoutineProgressRead:
    return await get_progress(session, user, period)


@router.post("/sessions/{session_id}/steps", response_model=RoutineSessionRead)
async def mark_step(session_id: UUID, payload: CompleteStepRequest, session: SessionDep, user: CurrentUser) -> RoutineSessionRead:
    return await complete_step(session, user, session_id, payload.step_id)


@router.post("/sessions/{session_id}/complete", response_model=RoutineSessionRead)
async def finish_session(session_id: UUID, session: SessionDep, user: CurrentUser) -> RoutineSessionRead:
    return await complete_session(session, user, session_id)
