from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.schemas.integration import IntegrationStatusItem, IntegrationsStatusRead


def item(name: str, status: str, mode: str, detail: str, *, required_for_production: bool = False) -> IntegrationStatusItem:
    return IntegrationStatusItem(
        name=name,
        status=status,
        mode=mode,
        detail=detail,
        required_for_production=required_for_production,
    )


def configured(value: str | None) -> bool:
    return bool(value and value.strip())


async def database_status(session: AsyncSession) -> IntegrationStatusItem:
    try:
        await session.execute(text("select 1"))
    except Exception as error:
        return item("database", "error", "sqlalchemy", str(error), required_for_production=True)
    return item("database", "configured", "sqlalchemy", "Database connection is ready.", required_for_production=True)


def telegram_auth_status() -> IntegrationStatusItem:
    if configured(settings.telegram_bot_token):
        return item("telegram_auth", "configured", "telegram_web_app", "Telegram initData validation is enabled.", required_for_production=True)
    return item("telegram_auth", "missing_config", "telegram_web_app", "TELEGRAM_BOT_TOKEN is not set.", required_for_production=True)


def telegram_notifications_status() -> IntegrationStatusItem:
    if not settings.telegram_notifications_enabled:
        return item("telegram_notifications", "disabled", "telegram_bot_api", "Telegram notification dispatch is disabled.")
    if configured(settings.telegram_bot_token):
        return item("telegram_notifications", "configured", "telegram_bot_api", "Telegram Bot API sending is enabled.")
    return item("telegram_notifications", "dry_run", "telegram_bot_api", "No bot token; notifications are recorded as dry-run deliveries.")


def openai_status() -> IntegrationStatusItem:
    if configured(settings.openai_api_key):
        return item("openai", "configured", settings.openai_model, "Assistant uses the OpenAI Responses API.")
    return item("openai", "fallback", settings.openai_model, "OPENAI_API_KEY is not set; assistant uses local deterministic proposals.")


def weather_status() -> IntegrationStatusItem:
    if settings.weather_provider == "disabled":
        return item("weather", "fallback", "disabled", "Weather provider disabled; static skincare context is used.")
    if settings.weather_provider == "open-meteo":
        return item("weather", "configured", "open-meteo", "Weather and UV context can be fetched from Open-Meteo.")
    return item("weather", "fallback", settings.weather_provider, "Unknown provider; service will use fallback context.")


def storage_status() -> IntegrationStatusItem:
    if settings.storage_backend == "local":
        return item("storage", "configured", "local", f"Uploads are stored under {settings.storage_local_root}.")
    if settings.storage_backend == "s3":
        missing = [
            name
            for name, value in {
                "STORAGE_BUCKET": settings.storage_bucket,
                "STORAGE_ACCESS_KEY": settings.storage_access_key,
                "STORAGE_SECRET_KEY": settings.storage_secret_key,
            }.items()
            if not configured(value)
        ]
        if missing:
            return item("storage", "missing_config", "s3", f"Missing required storage settings: {', '.join(missing)}.")
        return item("storage", "configured", "s3", "S3/Supabase-compatible private object storage is configured.")
    return item("storage", "missing_config", settings.storage_backend, "Unsupported storage backend.")


def price_sources_status() -> IntegrationStatusItem:
    if configured(settings.price_sources_url):
        return item("price_sources", "configured", "operator_json", "Price collection uses PRICE_SOURCES_URL.")
    return item("price_sources", "fallback", "static_seed", "No PRICE_SOURCES_URL; price collection uses built-in static seed data.")


def jobs_status() -> IntegrationStatusItem:
    if settings.app_env == "production" and not configured(settings.jobs_admin_token):
        return item("jobs", "missing_config", "scheduler", "JOBS_ADMIN_TOKEN is required for manual production job endpoints.")
    if configured(settings.jobs_admin_token):
        return item("jobs", "configured", "scheduler", "Manual job endpoints are protected by bearer token.")
    return item("jobs", "configured", "development", "Manual job endpoints are open only outside production.")


async def integrations_status(session: AsyncSession) -> IntegrationsStatusRead:
    integrations = [
        await database_status(session),
        telegram_auth_status(),
        telegram_notifications_status(),
        openai_status(),
        weather_status(),
        storage_status(),
        price_sources_status(),
        jobs_status(),
    ]
    blocking = [
        entry
        for entry in integrations
        if entry.status == "error" or (settings.app_env == "production" and entry.required_for_production and entry.status == "missing_config")
    ]
    degraded = [entry for entry in integrations if entry.status in {"fallback", "dry_run", "missing_config"} and entry not in blocking]
    overall_status = "ready"
    if blocking:
        overall_status = "blocked"
    elif degraded:
        overall_status = "degraded"
    return IntegrationsStatusRead(app_env=settings.app_env, overall_status=overall_status, integrations=integrations)
