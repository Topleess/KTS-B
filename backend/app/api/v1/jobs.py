from secrets import compare_digest

from fastapi import APIRouter, HTTPException, Request

from app.api.deps import SessionDep
from app.core.config import settings
from app.services.worker_service import (
    run_all_workers,
    run_price_collection,
    run_environment_events,
    run_notification_dispatch,
    run_observation_followups,
    run_price_alerts,
    run_product_low_events,
    run_routine_notifications,
)

router = APIRouter(prefix="/jobs", tags=["jobs"])


def ensure_jobs_allowed(request: Request) -> None:
    if settings.app_env != "production":
        return
    if not settings.jobs_admin_token:
        raise HTTPException(status_code=403, detail="Manual job endpoints are disabled in production")
    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not compare_digest(token, settings.jobs_admin_token):
        raise HTTPException(status_code=403, detail="Invalid jobs admin token")


@router.post("/run")
async def run_all(request: Request, session: SessionDep) -> dict:
    ensure_jobs_allowed(request)
    return await run_all_workers(session)


@router.post("/price-alerts")
async def run_price_alert_job(request: Request, session: SessionDep) -> dict:
    ensure_jobs_allowed(request)
    return await run_price_alerts(session)


@router.post("/price-collection")
async def run_price_collection_job(request: Request, session: SessionDep) -> dict:
    ensure_jobs_allowed(request)
    return await run_price_collection(session)


@router.post("/product-low")
async def run_product_low_job(request: Request, session: SessionDep) -> dict:
    ensure_jobs_allowed(request)
    return await run_product_low_events(session)


@router.post("/environment-events")
async def run_environment_job(request: Request, session: SessionDep) -> dict:
    ensure_jobs_allowed(request)
    return await run_environment_events(session)


@router.post("/routine-notifications")
async def run_routine_job(request: Request, session: SessionDep) -> dict:
    ensure_jobs_allowed(request)
    return await run_routine_notifications(session)


@router.post("/observation-followups")
async def run_observation_followup_job(request: Request, session: SessionDep) -> dict:
    ensure_jobs_allowed(request)
    return await run_observation_followups(session)


@router.post("/notifications")
async def run_notification_job(request: Request, session: SessionDep) -> dict:
    ensure_jobs_allowed(request)
    return await run_notification_dispatch(session)
