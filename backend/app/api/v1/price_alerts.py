from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, SessionDep
from app.schemas.product import PriceAlertCreate, PriceAlertRead, PriceAlertUpdate
from app.services.product_service import create_price_alert, list_price_alerts, update_price_alert

router = APIRouter(prefix="/price-alerts", tags=["price-alerts"])


@router.get("", response_model=list[PriceAlertRead])
async def alerts_index(session: SessionDep, user: CurrentUser) -> list[PriceAlertRead]:
    return await list_price_alerts(session, user)


@router.post("", response_model=PriceAlertRead)
async def alerts_create(payload: PriceAlertCreate, session: SessionDep, user: CurrentUser) -> PriceAlertRead:
    return await create_price_alert(session, user, payload.product_id, payload.threshold_price, payload.retailers)


@router.patch("/{alert_id}", response_model=PriceAlertRead)
async def alerts_patch(alert_id: UUID, payload: PriceAlertUpdate, session: SessionDep, user: CurrentUser) -> PriceAlertRead:
    alert = await update_price_alert(
        session,
        user,
        alert_id,
        threshold_price=payload.threshold_price,
        retailers=payload.retailers,
        is_active=payload.is_active,
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Price alert not found")
    return alert


@router.delete("/{alert_id}")
async def alerts_delete(alert_id: UUID, session: SessionDep, user: CurrentUser) -> dict:
    alert = await update_price_alert(session, user, alert_id, is_active=False)
    if not alert:
        raise HTTPException(status_code=404, detail="Price alert not found")
    return {"status": "disabled", "id": str(alert.id)}
