from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.payment import PaymentStatus


class PaymentInitResponse(BaseModel):
    """The full PayHere checkout payload — everything the frontend needs to
    hand straight to payhere.startPayment(). The hash is computed server-side
    so the merchant secret never reaches the browser."""
    merchant_id: str
    order_id: str
    items: str
    amount: str
    currency: str
    hash: str
    first_name: str
    last_name: str
    email: str
    phone: str
    address: str
    city: str
    country: str
    return_url: str
    cancel_url: str
    notify_url: str
    sandbox: bool


class PaymentStatusRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    amount: float
    currency: str
    status: PaymentStatus
    created_at: datetime
    updated_at: datetime
