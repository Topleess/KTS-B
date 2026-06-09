from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.runtime import validate_runtime_settings
from app.schemas.common import HealthResponse, ReadinessResponse
from app.services.seed import ensure_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    _ = app
    validate_runtime_settings()
    if settings.app_env == "production":
        yield
        return
    else:
        try:
            async with SessionLocal() as session:
                await ensure_demo_data(session)
        except Exception:
            # Migrations may not have run yet; the explicit /auth/dev endpoint seeds after setup.
            pass
        yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origin_regex=r"https://.*\.(loca\.lt|trycloudflare\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service=settings.app_name, version="0.1.0")


@app.get("/ready", response_model=ReadinessResponse)
async def ready() -> ReadinessResponse:
    checks: dict[str, str] = {}
    async with SessionLocal() as session:
        await session.execute(text("select 1"))
    checks["database"] = "ok"
    return ReadinessResponse(status="ok", service=settings.app_name, version="0.1.0", checks=checks)


app.include_router(api_router, prefix=settings.api_prefix)
