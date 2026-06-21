from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Float, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class MarketplaceListingStatus(str, Enum):
    ACTIVE = "Active"
    RESERVED = "Reserved"
    SOLD = "Sold"
    ARCHIVED = "Archived"


class MarketplaceOrderStatus(str, Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    DELIVERED = "Delivered"
    COMPLETED = "Completed"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"


class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        default=uuid4,
    )
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    crop_name: Mapped[str] = mapped_column(String(255), nullable=False)
    crop_type: Mapped[str] = mapped_column(String(128), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=False, default="kg")
    price_per_unit: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[MarketplaceListingStatus] = mapped_column(
        SAEnum(
            MarketplaceListingStatus,
            name="marketplace_listing_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=MarketplaceListingStatus.ACTIVE,
    )
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

    owner = relationship("User", foreign_keys=[owner_id], lazy="joined")

    @property
    def owner_name(self) -> str:
        return self.owner.full_name if self.owner is not None else ""


class MarketplaceOrder(Base):
    __tablename__ = "marketplace_orders"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        default=uuid4,
    )
    listing_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("marketplace_listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    buyer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    requested_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    proposed_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    agreed_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    buyer_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    seller_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    counter_offer_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[MarketplaceOrderStatus] = mapped_column(
        SAEnum(
            MarketplaceOrderStatus,
            name="marketplace_order_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=MarketplaceOrderStatus.PENDING,
    )
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
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    listing = relationship("MarketplaceListing", lazy="joined")
    buyer = relationship("User", foreign_keys=[buyer_id], lazy="joined")
    seller = relationship("User", foreign_keys=[seller_id], lazy="joined")

    @property
    def listing_name(self) -> str:
        return self.listing.crop_name if self.listing is not None else ""

    @property
    def buyer_name(self) -> str:
        return self.buyer.full_name if self.buyer is not None else ""

    @property
    def seller_name(self) -> str:
        return self.seller.full_name if self.seller is not None else ""
