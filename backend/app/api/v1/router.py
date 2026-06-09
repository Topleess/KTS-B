from fastapi import APIRouter

from app.api.v1 import (
    actions,
    assistant,
    auth,
    care,
    events,
    integrations,
    jobs,
    observations,
    price_alerts,
    prices,
    products,
    profile,
    recommendations,
    routines,
    scanning,
)

api_router = APIRouter()
api_router.include_router(auth.me_router)
api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(care.router)
api_router.include_router(routines.router)
api_router.include_router(products.router)
api_router.include_router(scanning.router)
api_router.include_router(recommendations.router)
api_router.include_router(prices.router)
api_router.include_router(price_alerts.router)
api_router.include_router(observations.router)
api_router.include_router(events.router)
api_router.include_router(integrations.router)
api_router.include_router(jobs.router)
api_router.include_router(actions.router)
api_router.include_router(assistant.router)
