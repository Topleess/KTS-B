from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import ApiModel
from app.schemas.product import ProductRead


class RoutineStepRead(ApiModel):
    id: UUID
    period: str
    sequence_order: int
    step_type: str
    purpose: str
    rationale: str
    instructions: str
    schedule_rule: dict
    is_active: bool
    product: ProductRead | None


class RoutineStepCreate(ApiModel):
    period: str
    sequence_order: int = Field(default=1, ge=1)
    step_type: str
    purpose: str = ""
    rationale: str = ""
    instructions: str = ""
    schedule_rule: dict = Field(default_factory=dict)
    product_id: UUID | None = None


class RoutineStepUpdate(ApiModel):
    period: str | None = None
    sequence_order: int | None = Field(default=None, ge=1)
    step_type: str | None = None
    purpose: str | None = None
    rationale: str | None = None
    instructions: str | None = None
    schedule_rule: dict | None = None
    product_id: UUID | None = None
    is_active: bool | None = None


class RoutinePlanRead(ApiModel):
    id: UUID
    version: int
    is_active: bool
    created_at: datetime
    steps: list[RoutineStepRead]


class RoutineSessionCreate(ApiModel):
    period: str


class RoutineSessionRead(ApiModel):
    id: UUID
    routine_plan_id: UUID
    period: str
    status: str
    completed_step_ids: list[str]
    started_at: datetime
    completed_at: datetime | None


class RoutineProgressRead(ApiModel):
    routine: RoutinePlanRead
    session: RoutineSessionRead | None
    period: str
    total_steps: int
    completed_steps: int
    completion_percent: int
    next_step: RoutineStepRead | None


class CompleteStepRequest(ApiModel):
    step_id: UUID


class QuestionnaireRestrictions(ApiModel):
    sensitivity: dict[str, bool] = Field(default_factory=dict)
    exclude: list[str] = Field(default_factory=list)


class RoutineQuestionnaireRequest(ApiModel):
    category: list[str] = Field(default_factory=list)
    focus: list[str] = Field(default_factory=list)
    skinType: str = ""
    restrictions: QuestionnaireRestrictions = Field(default_factory=QuestionnaireRestrictions)
    age: str = ""
    experience: str = ""
    budget: str = ""
    stores: list[str] = Field(default_factory=list)
