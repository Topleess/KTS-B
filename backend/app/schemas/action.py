from datetime import datetime
from uuid import UUID

from app.schemas.common import ApiModel


class ActionPreviewRequest(ApiModel):
    action_type: str
    payload: dict


class ActionRead(ApiModel):
    id: UUID
    action_type: str
    status: str
    preview: dict
    payload: dict
    created_at: datetime
    expires_at: datetime | None
    confirmed_at: datetime | None


class ActionReceipt(ApiModel):
    action: ActionRead
    receipt: dict


class ActionRejectRequest(ApiModel):
    reason: str = ""
