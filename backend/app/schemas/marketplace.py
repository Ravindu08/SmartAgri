from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.marketplace import MarketplaceListingStatus, MarketplaceOrderStatus


class MarketplaceListingBase(BaseModel):
    crop_name: str = Field(min_length=1, max_length=255)
    crop_type: str = Field(default="General", max_length=128)
    quantity: float = Field(gt=0)
    unit: str = Field(min_length=1, max_length=32)
    price_per_unit: float = Field(gt=0)
    description: Optional[str] = Field(default=None, max_length=2000)
    location: Optional[str] = Field(default=None, max_length=255)
    image: Optional[str] = None
    listing_type: str = Field(default="crop", max_length=32)
    status: MarketplaceListingStatus = MarketplaceListingStatus.ACTIVE


class MarketplaceListingCreate(MarketplaceListingBase):
    pass


class MarketplaceListingUpdate(BaseModel):
    crop_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    crop_type: Optional[str] = Field(default=None, max_length=128)
    quantity: Optional[float] = Field(default=None, gt=0)
    unit: Optional[str] = Field(default=None, min_length=1, max_length=32)
    price_per_unit: Optional[float] = Field(default=None, gt=0)
    description: Optional[str] = Field(default=None, max_length=2000)
    location: Optional[str] = Field(default=None, max_length=255)
    image: Optional[str] = None
    listing_type: Optional[str] = Field(default=None, max_length=32)
    status: Optional[MarketplaceListingStatus] = None


class MarketplaceListingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: int
    owner_name: str
    owner_phone: Optional[str] = None
    crop_name: str
    crop_type: str
    quantity: float
    unit: str
    price_per_unit: float
    description: Optional[str] = None
    location: Optional[str] = None
    image: Optional[str] = None
    listing_type: str = "crop"
    status: MarketplaceListingStatus
    created_at: datetime
    updated_at: datetime
    # Aggregated from the ratings table in the listings endpoints
    seller_rating: Optional[float] = None
    seller_rating_count: int = 0


class MarketplaceOrderCreate(BaseModel):
    listing_id: UUID
    requested_quantity: float = Field(gt=0)
    proposed_price: Optional[float] = Field(default=None, gt=0)
    buyer_note: Optional[str] = Field(default=None, max_length=2000)


class MarketplaceOrderStatusUpdate(BaseModel):
    status: MarketplaceOrderStatus
    seller_note: Optional[str] = Field(default=None, max_length=2000)
    counter_offer_price: Optional[float] = Field(default=None, gt=0)


class MarketplaceNegotiationCreate(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    proposed_price: Optional[float] = Field(default=None, gt=0)


class MarketplaceOrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    listing_id: UUID
    listing_name: str
    buyer_id: int
    buyer_name: str
    buyer_phone: Optional[str] = None
    seller_id: int
    seller_name: str
    seller_phone: Optional[str] = None
    requested_quantity: float
    proposed_price: Optional[float] = None
    agreed_price: Optional[float] = None
    buyer_note: Optional[str] = None
    seller_note: Optional[str] = None
    counter_offer_price: Optional[float] = None
    status: MarketplaceOrderStatus
    created_at: datetime
    updated_at: datetime
    accepted_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
