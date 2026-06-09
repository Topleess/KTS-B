from app.core.config import settings


def validate_runtime_settings() -> None:
    if settings.app_env != "production":
        return
    errors: list[str] = []
    if settings.jwt_secret == "change-me-in-production" or len(settings.jwt_secret) < 32:
        errors.append("JWT_SECRET must be set to a strong production value")
    if settings.allow_dev_auth:
        errors.append("ALLOW_DEV_AUTH must be false in production")
    if not settings.telegram_bot_token:
        errors.append("TELEGRAM_BOT_TOKEN is required in production")
    if errors:
        raise RuntimeError("; ".join(errors))
