from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import ApiModel


class ObservationCreate(ApiModel):
    product_id: UUID | None = None
    feeling: str
    severity: int = Field(default=0, ge=0, le=10)
    notes: str = ""
    metrics: dict = Field(default_factory=dict)


class ObservationRead(ApiModel):
    id: UUID
    product_id: UUID | None
    feeling: str
    severity: int
    notes: str
    metrics: dict
    created_at: datetime
