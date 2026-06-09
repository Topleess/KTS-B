from uuid import UUID

from fastapi import APIRouter

from app.api.deps import CurrentUser, SessionDep
from app.schemas.product import PriceOfferRead, PriceSnapshotRead, PriceSummaryRead
from app.services.product_service import get_price_summary, list_price_history, list_price_offers

router = APIRouter(prefix="/prices", tags=["prices"])


@router.get("/products/{product_id}", response_model=list[PriceOfferRead])
async def product_prices(product_id: UUID, session: SessionDep, user: CurrentUser) -> list[PriceOfferRead]:
    _ = user
    return await list_price_offers(session, product_id)


@router.get("/products/{product_id}/history", response_model=list[PriceSnapshotRead])
async def product_price_history(product_id: UUID, session: SessionDep, user: CurrentUser, limit: int = 100) -> list[PriceSnapshotRead]:
    _ = user
    return await list_price_history(session, product_id, limit=limit)


@router.get("/products/{product_id}/summary", response_model=PriceSummaryRead)
async def product_price_summary(product_id: UUID, session: SessionDep, user: CurrentUser) -> PriceSummaryRead:
    _ = user
    return await get_price_summary(session, product_id)


@router.get("/{product_id}", response_model=list[PriceOfferRead])
async def product_prices_alias(product_id: UUID, session: SessionDep, user: CurrentUser) -> list[PriceOfferRead]:
    return await product_prices(product_id, session, user)


@router.get("/{product_id}/history", response_model=list[PriceSnapshotRead])
async def product_price_history_alias(product_id: UUID, session: SessionDep, user: CurrentUser, limit: int = 100) -> list[PriceSnapshotRead]:
    return await product_price_history(product_id, session, user, limit=limit)


@router.get("/{product_id}/summary", response_model=PriceSummaryRead)
async def product_price_summary_alias(product_id: UUID, session: SessionDep, user: CurrentUser) -> PriceSummaryRead:
    return await product_price_summary(product_id, session, user)
