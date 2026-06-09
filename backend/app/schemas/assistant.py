from uuid import UUID

from pydantic import Field

from app.schemas.common import ApiModel


class AssistantRequest(ApiModel):
    message: str
    surface: str = "care"
    thread_id: UUID | None = None
    context: dict = Field(default_factory=dict)


class MessageBlock(ApiModel):
    type: str
    text: str | None = None
    segments: list[dict] | None = None
    payload: dict | None = None


class AssistantResponse(ApiModel):
    thread_id: UUID
    blocks: list[MessageBlock]
