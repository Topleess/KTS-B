from datetime import date
from datetime import datetime

from app.schemas.common import ApiModel
from app.schemas.observation import ObservationRead
from app.schemas.product import UserProductRead
from app.schemas.routine import RoutinePlanRead


class EnvironmentContext(ApiModel):
    city: str
    temperature_c: int
    uv_index: int
    humidity_percent: int
    spf_hint: str
    source: str


class CareTodayRead(ApiModel):
    date: date
    greeting: str
    active_period: str
    environment: EnvironmentContext
    routine: RoutinePlanRead
    products_low: list[UserProductRead]
    recent_observations: list[ObservationRead]
    events: list[dict]


class CareTimelineAction(ApiModel):
    type: str
    label: str
    payload: dict


class CareTimelineItem(ApiModel):
    id: str
    item_type: str
    title: str
    body: str
    priority: int
    action: CareTimelineAction | None = None
    created_at: datetime | None = None
