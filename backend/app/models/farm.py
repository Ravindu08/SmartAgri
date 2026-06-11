from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        default=uuid4,
    )
    farm_name: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    district: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    farm_size: Mapped[float] = mapped_column(Float, nullable=False)
    size_unit: Mapped[str] = mapped_column(String(32), nullable=False, default="acres")
    soil_type: Mapped[str] = mapped_column(String(128), nullable=False)
    irrigation_type: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    cultivated_crops: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    season: Mapped[str] = mapped_column(String(16), nullable=False)
    image_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
