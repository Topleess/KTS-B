from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, SessionDep
from app.schemas.action import ActionRead
from app.schemas.product import (
    ProductCheckRequest,
    ProductCheckObservationActionRequest,
    ProductCheckResponse,
    ProductRead,
    UserProductCreate,
    UserProductDetailRead,
    UserProductRead,
    UserProductSummaryRead,
    UserProductUpdate,
)
from app.services.product_service import (
    add_user_product,
    check_product,
    get_product,
    get_user_product_detail,
    list_products,
    list_user_products,
    preview_check_add_owned,
    preview_check_observation,
    preview_check_price_tracking,
    remove_user_product,
    summarize_user_products,
    update_user_product,
)

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
async def products_index(session: SessionDep) -> list[ProductRead]:
    return await list_products(session)


@router.get("/mine", response_model=list[UserProductRead])
async def my_products(session: SessionDep, user: CurrentUser) -> list[UserProductRead]:
    return await list_user_products(session, user)


@router.get("/owned", response_model=list[UserProductRead])
async def owned_products(session: SessionDep, user: CurrentUser) -> list[UserProductRead]:
    return await list_user_products(session, user)


@router.get("/owned/summary", response_model=UserProductSummaryRead)
async def owned_products_summary(session: SessionDep, user: CurrentUser) -> UserProductSummaryRead:
    return await summarize_user_products(session, user)


@router.get("/owned/{owned_id}", response_model=UserProductDetailRead)
async def owned_product_detail(owned_id: UUID, session: SessionDep, user: CurrentUser) -> UserProductDetailRead:
    detail = await get_user_product_detail(session, user, owned_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Owned product not found")
    return detail


@router.post("/owned", response_model=UserProductRead)
async def create_owned_product(payload: UserProductCreate, session: SessionDep, user: CurrentUser) -> UserProductRead:
    try:
        return await add_user_product(
            session,
            user,
            payload.product_id,
            status=payload.status,
            note=payload.note,
            amount_left_percent=payload.amount_left_percent,
        )
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.patch("/owned/{owned_id}", response_model=UserProductRead)
async def patch_owned_product(owned_id: UUID, payload: UserProductUpdate, session: SessionDep, user: CurrentUser) -> UserProductRead:
    owned = await update_user_product(
        session,
        user,
        owned_id,
        updates=payload.model_dump(exclude_unset=True),
    )
    if not owned:
        raise HTTPException(status_code=404, detail="Owned product not found")
    return owned


@router.delete("/owned/{owned_id}")
async def delete_owned_product(owned_id: UUID, session: SessionDep, user: CurrentUser) -> dict:
    removed = await remove_user_product(session, user, owned_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Owned product not found")
    return {"status": "deleted", "id": str(owned_id)}


@router.post("/check", response_model=ProductCheckResponse)
async def check(payload: ProductCheckRequest, session: SessionDep, user: CurrentUser) -> ProductCheckResponse:
    return await check_product(session, user, payload.query, payload.inci)


@router.post("/check/actions/add-owned/{product_id}", response_model=ActionRead)
async def check_add_owned_action(product_id: UUID, session: SessionDep, user: CurrentUser) -> ActionRead:
    action = await preview_check_add_owned(session, user, product_id)
    if not action:
        raise HTTPException(status_code=404, detail="Product not found")
    return action


@router.post("/check/actions/track-price/{product_id}", response_model=ActionRead)
async def check_track_price_action(product_id: UUID, session: SessionDep, user: CurrentUser) -> ActionRead:
    action = await preview_check_price_tracking(session, user, product_id)
    if not action:
        raise HTTPException(status_code=404, detail="Product not found")
    return action


@router.post("/check/actions/add-observation", response_model=ActionRead)
async def check_observation_action(
    payload: ProductCheckObservationActionRequest, session: SessionDep, user: CurrentUser
) -> ActionRead:
    return await preview_check_observation(session, user, payload.product_id, payload.notes)


@router.get("/{product_id}", response_model=ProductRead)
async def product_detail(product_id: UUID, session: SessionDep) -> ProductRead:
    product = await get_product(session, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
