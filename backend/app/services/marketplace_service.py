from datetime import datetime, timezone
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
        image=listing_in.image,
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
        setattr(listing, field, getattr(listing_in, field))
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
        raise ValueError("Requested quantity exceeds available stock")

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


def list_orders_for_user(db: Session, user_id: int) -> list[MarketplaceOrder]:
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
        order.agreed_price = payload.counter_offer_price or order.proposed_price or order.listing.price_per_unit
        order.listing.status = MarketplaceListingStatus.RESERVED
    elif new_status == MarketplaceOrderStatus.REJECTED:
        order.listing.status = MarketplaceListingStatus.ACTIVE
    elif new_status == MarketplaceOrderStatus.DELIVERED:
        order.delivered_at = datetime.now(timezone.utc)
    elif new_status == MarketplaceOrderStatus.COMPLETED:
        order.completed_at = datetime.now(timezone.utc)
        order.listing.status = MarketplaceListingStatus.SOLD
    elif new_status == MarketplaceOrderStatus.CANCELLED:
        order.listing.status = MarketplaceListingStatus.ACTIVE

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
