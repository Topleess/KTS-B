from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, JsonType


class RoutinePlan(Base):
    __tablename__ = "routine_plans"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="routine_plans")
    steps = relationship("RoutineStep", back_populates="routine_plan", cascade="all, delete-orphan", order_by="RoutineStep.sequence_order")


class RoutineStep(Base):
    __tablename__ = "routine_steps"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    routine_plan_id: Mapped[UUID] = mapped_column(ForeignKey("routine_plans.id", ondelete="CASCADE"), index=True)
    period: Mapped[str] = mapped_column(String(32))
    sequence_order: Mapped[int] = mapped_column(Integer)
    product_id: Mapped[UUID | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"))
    step_type: Mapped[str] = mapped_column(String(80))
    purpose: Mapped[str] = mapped_column(Text, default="")
    rationale: Mapped[str] = mapped_column(Text, default="")
    instructions: Mapped[str] = mapped_column(Text, default="")
    schedule_rule: Mapped[dict] = mapped_column(JsonType, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    routine_plan = relationship("RoutinePlan", back_populates="steps")
    product = relationship("Product")


class RoutineSession(Base):
    __tablename__ = "routine_sessions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    routine_plan_id: Mapped[UUID] = mapped_column(ForeignKey("routine_plans.id", ondelete="CASCADE"))
    period: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="started")
    completed_step_ids: Mapped[list[str]] = mapped_column(JsonType, default=list)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
