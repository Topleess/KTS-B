from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["development", "test", "production"] = "development"
    app_name: str = "Cosmeto API"
    api_prefix: str = "/api/v1"
    frontend_origin: str = "http://localhost:3000"

    database_url: str = "postgresql+asyncpg://cosmeto:cosmeto@localhost:5432/cosmeto"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = Field(default="change-me-in-production")
    jwt_algorithm: str = "HS256"
    jwt_ttl_minutes: int = 60 * 24 * 14
    pending_action_ttl_minutes: int = 60 * 24

    telegram_bot_token: str | None = None
    telegram_notifications_enabled: bool = True
    openai_api_key: str | None = None
    openai_model: str = "gpt-4.1-mini"
    weather_provider: str = "open-meteo"
    weather_timeout_seconds: float = 4.0
    price_sources_url: str | None = None

    jobs_scheduler_tick_seconds: float = 30.0
    job_price_collection_interval_seconds: int = 60 * 60
    job_price_alerts_interval_seconds: int = 5 * 60
    job_product_low_interval_seconds: int = 6 * 60 * 60
    job_environment_events_interval_seconds: int = 3 * 60 * 60
    job_routine_notifications_interval_seconds: int = 60 * 60
    job_observation_followups_interval_seconds: int = 60 * 60
    job_notification_dispatch_interval_seconds: int = 2 * 60
    jobs_admin_token: str | None = None

    storage_bucket: str | None = None
    storage_backend: str = "local"
    storage_local_root: str = "../.data/uploads"
    storage_endpoint: str | None = None
    storage_access_key: str | None = None
    storage_secret_key: str | None = None
    storage_public_base_url: str | None = None

    allow_dev_auth: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
