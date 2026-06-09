from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, JsonType


class PriceOffer(Base):
    __tablename__ = "price_offers"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    retailer_id: Mapped[str] = mapped_column(String(80))
    retailer_name: Mapped[str] = mapped_column(String(160))
    price: Mapped[int] = mapped_column(Integer)
    old_price: Mapped[int | None] = mapped_column(Integer)
    discount_label: Mapped[str | None] = mapped_column(String(40))
    stock_status: Mapped[str] = mapped_column(String(120), default="unknown")
    url: Mapped[str | None] = mapped_column(String(500))
    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    product = relationship("Product")


class PriceSnapshot(Base):
    __tablename__ = "price_snapshots"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    retailer_id: Mapped[str] = mapped_column(String(80), index=True)
    retailer_name: Mapped[str] = mapped_column(String(160))
    price: Mapped[int] = mapped_column(Integer)
    old_price: Mapped[int | None] = mapped_column(Integer)
    discount_label: Mapped[str | None] = mapped_column(String(40))
    stock_status: Mapped[str] = mapped_column(String(120), default="unknown")
    url: Mapped[str | None] = mapped_column(String(500))
    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    product = relationship("Product")


class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    threshold_price: Mapped[int | None] = mapped_column(Integer)
    retailers: Mapped[list[str]] = mapped_column(JsonType, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product")
