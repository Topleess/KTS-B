from uuid import UUID

from app.schemas.common import ApiModel


class TelegramAuthRequest(ApiModel):
    init_data: str


class AuthUser(ApiModel):
    id: UUID
    telegram_user_id: int | None
    telegram_username: str | None
    display_name: str | None


class AuthResponse(ApiModel):
    user: AuthUser
