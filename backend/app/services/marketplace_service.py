from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.marketplace import (
    MarketplaceListing,
    MarketplaceListingStatus,
    MarketplaceNegotiationMessage,
    MarketplaceOrder,
    MarketplaceOrderStatus,
    OrderPaymentStatus,
)
from app.models.user import User
from app.schemas.marketplace import (
    MarketplaceListingCreate,
    MarketplaceListingUpdate,
    MarketplaceNegotiationCreate,
    MarketplaceOrderCreate,
    MarketplaceOrderStatusUpdate,
)
from app.utils.image_storage import store_image as _store_image


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
    # A suspended seller cannot answer requests, so their listings are not offered.
    q = (
        select(MarketplaceListing)
        .join(User, User.id == MarketplaceListing.owner_id)
        .where(MarketplaceListing.status == MarketplaceListingStatus.ACTIVE, User.is_suspended.is_(False))
    )
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


# The only listing columns that may be cleared; an explicit null for any other
# field is ignored rather than violating its NOT NULL constraint.
_NULLABLE_LISTING_FIELDS = {"description", "location", "image"}


def update_listing(db: Session, listing: MarketplaceListing, listing_in: MarketplaceListingUpdate) -> MarketplaceListing:
    for field in listing_in.model_fields_set:
        value = getattr(listing_in, field)
        if value is None and field not in _NULLABLE_LISTING_FIELDS:
            continue
        if field == "image":
            value = _store_image(value)
        setattr(listing, field, value)
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


def listing_has_orders(db: Session, listing_id: UUID) -> bool:
    return bool(db.execute(
        select(func.count(MarketplaceOrder.id)).where(MarketplaceOrder.listing_id == listing_id)
    ).scalar())


def delete_listing(db: Session, listing: MarketplaceListing) -> None:
    db.delete(listing)
    db.commit()


def create_order(db: Session, order_in: MarketplaceOrderCreate, buyer_id: int) -> MarketplaceOrder:
    # Row lock: two buyers ordering at the same moment would otherwise both
    # read the same quantity and oversell it.
    listing = db.execute(
        select(MarketplaceListing)
        .where(MarketplaceListing.id == order_in.listing_id)
        .with_for_update(of=MarketplaceListing)
    ).scalar_one_or_none()
    if listing is None:
        raise ValueError("Listing not found")
    if listing.status != MarketplaceListingStatus.ACTIVE or (listing.owner is not None and listing.owner.is_suspended):
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
    if order_in.buyer_note:
        # The note written with the request opens the negotiation thread;
        # otherwise the seller would never see it.
        db.flush()
        db.add(MarketplaceNegotiationMessage(
            order_id=order.id,
            sender_id=buyer_id,
            message=order_in.buyer_note,
            proposed_price=order_in.proposed_price,
        ))
    db.commit()
    db.refresh(order)
    return order


def get_order(db: Session, order_id: UUID, *, lock: bool = False) -> MarketplaceOrder | None:
    q = select(MarketplaceOrder).where(MarketplaceOrder.id == order_id)
    if lock:
        # Row lock for anything that changes status or payment: two requests
        # arriving together would otherwise both pass the same state check
        # (restoring stock twice, or recording two payments).
        q = q.with_for_update(of=MarketplaceOrder)
    return db.execute(q).scalar_one_or_none()


def restore_order_stock(db: Session, order: MarketplaceOrder) -> None:
    """Give an order's quantity back to its listing.

    Only a listing that was marked Sold because stock ran out goes back on
    sale. One the seller or an admin archived stays archived.
    """
    listing = order.listing
    if listing is None:
        return
    listing.quantity += order.requested_quantity
    if listing.status == MarketplaceListingStatus.SOLD:
        listing.status = MarketplaceListingStatus.ACTIVE
    db.add(listing)


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
        restore_order_stock(db, order)
        db.add(order)
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

    # A repeat of the current status is rejected too: letting it through would
    # re-run the side effects below (restoring stock again, re-pricing a paid order).
    if new_status == current_status:
        raise ValueError(f"Order is already {current_status.value}")
    if new_status not in allowed_transitions.get(current_status, set()):
        raise ValueError("Invalid status transition")

    if new_status == MarketplaceOrderStatus.CANCELLED and order.payment_status == OrderPaymentStatus.PAID:
        raise ValueError("A paid order cannot be cancelled")

    if new_status == MarketplaceOrderStatus.DELIVERED and order.payment_status != OrderPaymentStatus.PAID:
        raise ValueError("Payment required before order can be marked as delivered")

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
        restore_order_stock(db, order)
    elif new_status == MarketplaceOrderStatus.DELIVERED:
        order.delivered_at = datetime.now(timezone.utc)
    elif new_status == MarketplaceOrderStatus.COMPLETED:
        order.completed_at = datetime.now(timezone.utc)
        # Mark the listing SOLD only if no stock remains; otherwise it stays active
        if order.listing.quantity <= 0:
            order.listing.status = MarketplaceListingStatus.SOLD
    elif new_status == MarketplaceOrderStatus.CANCELLED:
        # Restore quantity for any cancellation (Pending or Confirmed)
        restore_order_stock(db, order)

    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def add_negotiation(
    db: Session,
    order: MarketplaceOrder,
    message: MarketplaceNegotiationCreate,
    sender_role: str,
    sender_id: int,
) -> MarketplaceOrder:
    if order.status not in (MarketplaceOrderStatus.PENDING, MarketplaceOrderStatus.CONFIRMED):
        raise ValueError("This order is closed, so no more notes can be added")
    # The price is fixed once the seller confirms; a later offer would change
    # what the order shows without changing what is charged.
    if message.proposed_price is not None and order.status != MarketplaceOrderStatus.PENDING:
        raise ValueError("The price can only be negotiated while the order is pending")

    # Denormalized "current offer" snapshot on the order — this is what
    # update_order_status reads when confirming, so it must stay in sync.
    if sender_role == "Trader":
        order.buyer_note = message.message
        if message.proposed_price is not None:
            order.proposed_price = message.proposed_price
    else:
        order.seller_note = message.message
        if message.proposed_price is not None:
            order.counter_offer_price = message.proposed_price
    db.add(order)

    # Immutable thread entry — never overwritten, so history survives.
    db.add(MarketplaceNegotiationMessage(
        order_id=order.id,
        sender_id=sender_id,
        message=message.message,
        proposed_price=message.proposed_price,
    ))
    db.commit()
    db.refresh(order)
    return order


def list_negotiation_messages(db: Session, order_id: UUID) -> list[MarketplaceNegotiationMessage]:
    return db.execute(
        select(MarketplaceNegotiationMessage)
        .where(MarketplaceNegotiationMessage.order_id == order_id)
        .order_by(MarketplaceNegotiationMessage.created_at.asc())
    ).scalars().all()
