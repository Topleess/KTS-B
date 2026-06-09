from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, JsonType


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    skin_type: Mapped[str] = mapped_column(String(80), default="")
    sensitivity_level: Mapped[str] = mapped_column(String(80), default="normal")
    budget_limit: Mapped[int | None] = mapped_column(Integer)
    goals: Mapped[list[str]] = mapped_column(JsonType, default=list)
    restrictions: Mapped[dict] = mapped_column(JsonType, default=dict)
    preferred_retailers: Mapped[list[str]] = mapped_column(JsonType, default=list)
    location_mode: Mapped[str] = mapped_column(String(32), default="manual")
    manual_city: Mapped[str | None] = mapped_column(String(120))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="skin_profile")
