from datetime import datetime
from uuid import UUID

from app.schemas.common import ApiModel
from app.schemas.observation import ObservationRead


class ProductRead(ApiModel):
    id: UUID
    external_key: str | None
    brand: str
    name: str
    category: str
    description: str
    image_url: str | None
    actives: list[str]
    inci: str


class UserProductRead(ApiModel):
    id: UUID
    status: str
    note: str
    amount_left_percent: int | None
    product: ProductRead


class UserProductSummaryRead(ApiModel):
    total: int
    by_status: dict[str, int]
    low_amount_count: int
    tracked_count: int
    wishlist_count: int
    active_count: int


class UserProductCreate(ApiModel):
    product_id: UUID
    status: str = "used"
    note: str = ""
    amount_left_percent: int | None = None


class UserProductUpdate(ApiModel):
    status: str | None = None
    note: str | None = None
    amount_left_percent: int | None = None


class PriceOfferRead(ApiModel):
    id: UUID
    product_id: UUID
    retailer_id: str
    retailer_name: str
    price: int
    old_price: int | None
    discount_label: str | None
    stock_status: str
    url: str | None
    collected_at: datetime


class PriceSnapshotRead(ApiModel):
    id: UUID
    product_id: UUID
    retailer_id: str
    retailer_name: str
    price: int
    old_price: int | None
    discount_label: str | None
    stock_status: str
    url: str | None
    collected_at: datetime


class PriceSummaryRead(ApiModel):
    product_id: UUID
    best_offer: PriceOfferRead | None
    average_price: int | None
    min_price: int | None
    max_price: int | None
    offers_count: int
    history_count: int
    last_collected_at: datetime | None


class PriceAlertCreate(ApiModel):
    product_id: UUID
    threshold_price: int | None = None
    retailers: list[str] = []


class PriceAlertUpdate(ApiModel):
    threshold_price: int | None = None
    retailers: list[str] | None = None
    is_active: bool | None = None


class PriceAlertRead(ApiModel):
    id: UUID
    product_id: UUID
    threshold_price: int | None
    retailers: list[str]
    is_active: bool
    created_at: datetime
    product: ProductRead | None = None


class UserProductDetailRead(ApiModel):
    owned: UserProductRead
    price_summary: PriceSummaryRead
    active_price_alerts: list[PriceAlertRead]
    recent_observations: list[ObservationRead]
    next_action: str


class ProductCheckRequest(ApiModel):
    query: str
    inci: str | None = None


class ProductCheckObservationActionRequest(ApiModel):
    product_id: UUID | None = None
    notes: str = ""


class ProductCheckResponse(ApiModel):
    verdict: str
    summary: str
    reasons: list[str]
    cautions: list[str]
    useful_ingredients: list[str] = []
    neutral_ingredients: list[str] = []
    caution_ingredients: list[str] = []
    product: ProductRead | None = None


class RecommendationRead(ApiModel):
    product: ProductRead
    score: int
    reasons: list[str]
    best_offer: PriceOfferRead | None = None
    next_action: str


class UploadedPhotoRead(ApiModel):
    id: UUID
    photo_type: str
    storage_path: str
    consent_status: str
    created_at: datetime


class UploadedPhotoAccessRead(ApiModel):
    url: str
    expires_in_seconds: int
    access_type: str


class ScanIdentifyRequest(ApiModel):
    query: str = ""
    photo_id: UUID | None = None


class ScanCandidateRead(ApiModel):
    id: UUID
    query: str
    confidence: int
    status: str
    product: ProductRead | None
    created_at: datetime
