from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class CultivationSession(Base):
    __tablename__ = "cultivation_sessions"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False
    )
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    crop: Mapped[str] = mapped_column(String(255), nullable=False)
    crop_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("crops.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    farm_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("farms.id", ondelete="SET NULL"),
        nullable=True,
    )
    planting_date: Mapped[str] = mapped_column(String(16), nullable=False)
    district: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    tasks: Mapped[list["CultivationTask"]] = relationship(
        "CultivationTask",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="joined",
    )


class CultivationTask(Base):
    __tablename__ = "cultivation_tasks"

    id: Mapped[str] = mapped_column(String(128), primary_key=True, nullable=False)
    session_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("cultivation_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    why: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    day: Mapped[int] = mapped_column(Integer, nullable=False)
    scheduled_date: Mapped[str] = mapped_column(String(16), nullable=False)
    stage_id: Mapped[str] = mapped_column(String(64), nullable=False)
    stage_name: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")

    session: Mapped["CultivationSession"] = relationship(
        "CultivationSession", back_populates="tasks"
    )
