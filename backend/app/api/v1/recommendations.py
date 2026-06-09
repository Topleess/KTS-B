from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, SessionDep
from app.schemas.action import ActionRead
from app.schemas.product import RecommendationRead
from app.services.product_service import get_recommendation, preview_recommendation_add_owned, preview_recommendation_price_tracking, list_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("", response_model=list[RecommendationRead])
async def recommendations_index(session: SessionDep, user: CurrentUser) -> list[RecommendationRead]:
    return await list_recommendations(session, user)


@router.get("/{product_id}", response_model=RecommendationRead)
async def recommendation_detail(product_id: UUID, session: SessionDep, user: CurrentUser) -> RecommendationRead:
    recommendation = await get_recommendation(session, user, product_id)
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return recommendation


@router.post("/{product_id}/actions/add-owned", response_model=ActionRead)
async def recommendation_add_owned_action(product_id: UUID, session: SessionDep, user: CurrentUser) -> ActionRead:
    action = await preview_recommendation_add_owned(session, user, product_id)
    if not action:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return action


@router.post("/{product_id}/actions/track-price", response_model=ActionRead)
async def recommendation_track_price_action(product_id: UUID, session: SessionDep, user: CurrentUser) -> ActionRead:
    action = await preview_recommendation_price_tracking(session, user, product_id)
    if not action:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return action
