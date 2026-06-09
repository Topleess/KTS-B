from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, SessionDep
from app.schemas.care import CareTimelineItem, CareTodayRead
from app.services.care_service import build_care_timeline, build_care_today
from app.services.routine_service import get_active_plan

router = APIRouter(prefix="/care", tags=["care"])


@router.get("/today", response_model=CareTodayRead)
async def today(session: SessionDep, user: CurrentUser) -> CareTodayRead:
    return await build_care_today(session, user)


@router.get("/timeline", response_model=list[CareTimelineItem])
async def timeline(
    session: SessionDep, user: CurrentUser, limit: int = Query(default=20, ge=1, le=50)
) -> list[CareTimelineItem]:
    return await build_care_timeline(session, user, limit)


@router.get("/plan")
async def plan(session: SessionDep, user: CurrentUser):
    return await get_active_plan(session, user)
