from uuid import UUID

from pydantic import Field

from app.schemas.common import ApiModel


class SkinProfileRead(ApiModel):
    id: UUID
    skin_type: str
    sensitivity_level: str
    budget_limit: int | None
    goals: list[str]
    restrictions: dict
    preferred_retailers: list[str]
    location_mode: str
    manual_city: str | None


class SkinProfileUpdate(ApiModel):
    skin_type: str | None = None
    sensitivity_level: str | None = None
    budget_limit: int | None = Field(default=None, ge=0)
    goals: list[str] | None = None
    restrictions: dict | None = None
    preferred_retailers: list[str] | None = None
    location_mode: str | None = None
    manual_city: str | None = None
