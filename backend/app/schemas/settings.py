from app.schemas.common import ApiModel


class ConsentItem(ApiModel):
    key: str
    status: str
    version: str
    updated_at: str | None = None


class ConsentsRead(ApiModel):
    consents: list[ConsentItem]


class ConsentUpdate(ApiModel):
    status: str
    version: str = "v0.1"


class PermissionsRead(ApiModel):
    camera: str
    geolocation: str
    skin_photos: str
    notifications: str


class PermissionsUpdate(ApiModel):
    camera: str | None = None
    geolocation: str | None = None
    skin_photos: str | None = None
    notifications: str | None = None


class NotificationSettingsRead(ApiModel):
    routine_reminders: bool
    uv_alerts: bool
    price_alerts: bool
    observation_followups: bool


class NotificationSettingsUpdate(ApiModel):
    routine_reminders: bool | None = None
    uv_alerts: bool | None = None
    price_alerts: bool | None = None
    observation_followups: bool | None = None
