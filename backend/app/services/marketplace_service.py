import base64
import re
import uuid as uuid_lib
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.marketplace import (
    MarketplaceListing,
    MarketplaceListingStatus,
    MarketplaceOrder,
    MarketplaceOrderStatus,
)
from app.schemas.marketplace import (
    MarketplaceListingCreate,
    MarketplaceListingUpdate,
    MarketplaceNegotiationCreate,
    MarketplaceOrderCreate,
    MarketplaceOrderStatusUpdate,
)


# Listing images arrive as base64 data URIs; store them as files under
# backend/uploads/ and keep only the URL in the DB (served via /uploads mount).
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


def _store_image(image: Optional[str]) -> Optional[str]:
    if not image or not image.startswith("data:image/"):
        return image  # already a URL (or empty) — leave untouched
    m = re.match(r"data:image/(\w+);base64,(.+)", image, re.DOTALL)
    if not m:
        return image
    ext = "jpg" if m.group(1).lower() in ("jpeg", "jpg") else m.group(1).lower()
    UPLOAD_DIR.mkdir(exist_ok=True)
    filename = f"{uuid_lib.uuid4().hex}.{ext}"
    (UPLOAD_DIR / filename).write_bytes(base64.b64decode(m.group(2)))
    return f"/uploads/{filename}"


def create_listing(db: Session, listing_in: MarketplaceListingCreate, owner_id: int) -> MarketplaceListing:
    listing = MarketplaceListing(
        owner_id=owner_id,
        crop_name=listing_in.crop_name,
        crop_type=listing_in.crop_type,
        quantity=listing_in.quantity,
        unit=listing_in.unit,
        price_per_unit=listing_in.price_per_unit,
        description=listing_in.description,
        location=listing_in.location,
        image=_store_image(listing_in.image),
        listing_type=listing_in.listing_type,
        status=listing_in.status,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


def get_listing(db: Session, listing_id: UUID) -> MarketplaceListing | None:
    return db.execute(select(MarketplaceListing).where(MarketplaceListing.id == listing_id)).scalar_one_or_none()


def get_listing_for_owner(db: Session, listing_id: UUID, owner_id: int) -> MarketplaceListing | None:
    return db.execute(
        select(MarketplaceListing).where(MarketplaceListing.id == listing_id, MarketplaceListing.owner_id == owner_id)
    ).scalar_one_or_none()


def list_active_listings(
    db: Session,
    *,
    search: Optional[str] = None,
    crop_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    district: Optional[str] = None,
) -> list[MarketplaceListing]:
    q = select(MarketplaceListing).where(MarketplaceListing.status == MarketplaceListingStatus.ACTIVE)
    if search:
        q = q.where(MarketplaceListing.crop_name.ilike(f"%{search}%"))
    if crop_type:
        q = q.where(MarketplaceListing.crop_type.ilike(f"%{crop_type}%"))
    if min_price is not None:
        q = q.where(MarketplaceListing.price_per_unit >= min_price)
    if max_price is not None:
        q = q.where(MarketplaceListing.price_per_unit <= max_price)
    if district:
        q = q.where(MarketplaceListing.location.ilike(f"%{district}%"))
    return db.execute(q.order_by(MarketplaceListing.created_at.desc())).scalars().all()


def list_owner_listings(db: Session, owner_id: int) -> list[MarketplaceListing]:
    return db.execute(
        select(MarketplaceListing)
        .where(MarketplaceListing.owner_id == owner_id)
        .order_by(MarketplaceListing.created_at.desc())
    ).scalars().all()


def update_listing(db: Session, listing: MarketplaceListing, listing_in: MarketplaceListingUpdate) -> MarketplaceListing:
    for field in listing_in.model_fields_set:
        value = getattr(listing_in, field)
        if field == "image":
            value = _store_image(value)
        setattr(listing, field, value)
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


def delete_listing(db: Session, listing: MarketplaceListing) -> None:
    db.delete(listing)
    db.commit()


def create_order(db: Session, order_in: MarketplaceOrderCreate, buyer_id: int) -> MarketplaceOrder:
    listing = get_listing(db, order_in.listing_id)
    if listing is None:
        raise ValueError("Listing not found")
    if listing.status != MarketplaceListingStatus.ACTIVE:
        raise ValueError("Listing is not available")
    if order_in.requested_quantity > listing.quantity:
        raise ValueError(f"Requested quantity exceeds available stock ({listing.quantity} {listing.unit} left)")

    # Deduct quantity immediately so concurrent orders cannot over-commit stock
    listing.quantity -= order_in.requested_quantity
    if listing.quantity <= 0:
        listing.status = MarketplaceListingStatus.SOLD
    db.add(listing)

    order = MarketplaceOrder(
        listing_id=listing.id,
        buyer_id=buyer_id,
        seller_id=listing.owner_id,
        requested_quantity=order_in.requested_quantity,
        proposed_price=order_in.proposed_price,
        buyer_note=order_in.buyer_note,
        status=MarketplaceOrderStatus.PENDING,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def get_order(db: Session, order_id: UUID) -> MarketplaceOrder | None:
    return db.execute(select(MarketplaceOrder).where(MarketplaceOrder.id == order_id)).scalar_one_or_none()


PENDING_ORDER_MAX_AGE_DAYS = 7


def expire_stale_pending_orders(db: Session) -> None:
    """A Pending order left untouched for too long locks the seller's stock
    indefinitely if the buyer never follows up. Rather than running a
    scheduler, lazily auto-cancel stale ones (restoring stock) whenever
    orders are listed - cheap and self-healing since it runs on every read."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=PENDING_ORDER_MAX_AGE_DAYS)
    stale = db.execute(
        select(MarketplaceOrder).where(
            MarketplaceOrder.status == MarketplaceOrderStatus.PENDING,
            MarketplaceOrder.created_at < cutoff,
        )
    ).scalars().all()
    if not stale:
        return
    for order in stale:
        order.status = MarketplaceOrderStatus.CANCELLED
        order.seller_note = ((order.seller_note + " ") if order.seller_note else "") + \
            f"[Auto-cancelled: no response within {PENDING_ORDER_MAX_AGE_DAYS} days]"
        order.listing.quantity += order.requested_quantity
        if order.listing.status != MarketplaceListingStatus.ACTIVE:
            order.listing.status = MarketplaceListingStatus.ACTIVE
        db.add(order)
        db.add(order.listing)
    db.commit()


def list_orders_for_user(db: Session, user_id: int) -> list[MarketplaceOrder]:
    expire_stale_pending_orders(db)
    return db.execute(
        select(MarketplaceOrder)
        .where((MarketplaceOrder.buyer_id == user_id) | (MarketplaceOrder.seller_id == user_id))
        .order_by(MarketplaceOrder.created_at.desc())
    ).scalars().all()


def update_order_status(
    db: Session,
    order: MarketplaceOrder,
    payload: MarketplaceOrderStatusUpdate,
) -> MarketplaceOrder:
    current_status = order.status
    new_status = payload.status

    allowed_transitions = {
        MarketplaceOrderStatus.PENDING: {MarketplaceOrderStatus.CONFIRMED, MarketplaceOrderStatus.REJECTED, MarketplaceOrderStatus.CANCELLED},
        MarketplaceOrderStatus.CONFIRMED: {MarketplaceOrderStatus.DELIVERED, MarketplaceOrderStatus.CANCELLED},
        MarketplaceOrderStatus.DELIVERED: {MarketplaceOrderStatus.COMPLETED},
    }

    if new_status != current_status and new_status not in allowed_transitions.get(current_status, set()):
        raise ValueError("Invalid status transition")

    order.status = new_status
    if payload.seller_note is not None:
        order.seller_note = payload.seller_note
    if payload.counter_offer_price is not None:
        order.counter_offer_price = payload.counter_offer_price

    if new_status == MarketplaceOrderStatus.CONFIRMED:
        order.accepted_at = datetime.now(timezone.utc)
        # Precedence: explicit counter in this request > counter stored during
        # negotiation > buyer's proposed price > listing price. The buyer can
        # still cancel a Confirmed order if they disagree with the counter.
        order.agreed_price = (
            payload.counter_offer_price
            or order.counter_offer_price
            or order.proposed_price
            or order.listing.price_per_unit
        )
        # Quantity was already deducted at order-placement; no listing status change needed
    elif new_status == MarketplaceOrderStatus.REJECTED:
        # Restore the deducted quantity and re-activate the listing if it was marked sold
        order.listing.quantity += order.requested_quantity
        if order.listing.status != MarketplaceListingStatus.ACTIVE:
            order.listing.status = MarketplaceListingStatus.ACTIVE
        db.add(order.listing)
    elif new_status == MarketplaceOrderStatus.DELIVERED:
        order.delivered_at = datetime.now(timezone.utc)
    elif new_status == MarketplaceOrderStatus.COMPLETED:
        order.completed_at = datetime.now(timezone.utc)
        # Mark the listing SOLD only if no stock remains; otherwise it stays active
        if order.listing.quantity <= 0:
            order.listing.status = MarketplaceListingStatus.SOLD
    elif new_status == MarketplaceOrderStatus.CANCELLED:
        # Restore quantity for any cancellation (Pending or Confirmed)
        order.listing.quantity += order.requested_quantity
        if order.listing.status != MarketplaceListingStatus.ACTIVE:
            order.listing.status = MarketplaceListingStatus.ACTIVE
        db.add(order.listing)

    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def add_negotiation(
    db: Session,
    order: MarketplaceOrder,
    message: MarketplaceNegotiationCreate,
    sender_role: str,
) -> MarketplaceOrder:
    if sender_role == "Trader":
        order.buyer_note = message.message
        if message.proposed_price is not None:
            order.proposed_price = message.proposed_price
    else:
        order.seller_note = message.message
        if message.proposed_price is not None:
            order.counter_offer_price = message.proposed_price
    db.add(order)
    db.commit()
    db.refresh(order)
    return order
