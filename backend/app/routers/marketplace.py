from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.marketplace import MarketplaceListing, MarketplaceListingStatus, MarketplaceOrderStatus
from app.models.rating import Rating
from app.schemas.marketplace import (
    MarketplaceListingCreate,
    MarketplaceListingRead,
    MarketplaceListingUpdate,
    MarketplaceNegotiationCreate,
    MarketplaceOrderCreate,
    MarketplaceOrderRead,
    MarketplaceOrderStatusUpdate,
    NegotiationMessageRead,
)
from app.services.email import send_order_event_email
from app.utils.image_storage import ImageTooLargeError, InvalidImageError
from app.services.marketplace_service import (
    add_negotiation,
    create_listing,
    create_order,
    delete_listing,
    get_listing,
    get_listing_for_owner,
    get_order,
    list_active_listings,
    list_negotiation_messages,
    list_orders_for_user,
    list_owner_listings,
    update_listing,
    update_order_status,
)
from app.services.notification_service import create_notification


router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])


def _attach_seller_ratings(db: Session, listings: list[MarketplaceListing]) -> list[MarketplaceListing]:
    """Annotate each listing with the seller's average rating (one grouped query)."""
    owner_ids = {l.owner_id for l in listings}
    stats: dict[int, tuple[float, int]] = {}
    if owner_ids:
        rows = db.execute(
            select(Rating.ratee_id, func.avg(Rating.score), func.count(Rating.id))
            .where(Rating.ratee_id.in_(owner_ids))
            .group_by(Rating.ratee_id)
        ).all()
        stats = {row[0]: (round(float(row[1]), 1), row[2]) for row in rows}
    for listing in listings:
        rating = stats.get(listing.owner_id)
        listing.seller_rating = rating[0] if rating else None
        listing.seller_rating_count = rating[1] if rating else 0
    return listings


@router.get("/listings", response_model=list[MarketplaceListingRead])
def read_listings(
    search: Optional[str] = Query(default=None, max_length=100),
    crop_type: Optional[str] = Query(default=None, max_length=128),
    min_price: Optional[float] = Query(default=None, ge=0),
    max_price: Optional[float] = Query(default=None, ge=0),
    district: Optional[str] = Query(default=None, max_length=128),
    db: Session = Depends(get_db),
) -> list[MarketplaceListingRead]:
    listings = list_active_listings(db, search=search, crop_type=crop_type, min_price=min_price, max_price=max_price, district=district)
    return _attach_seller_ratings(db, listings)


@router.get("/listings/me", response_model=list[MarketplaceListingRead])
def read_my_listings(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MarketplaceListingRead]:
    return list_owner_listings(db, owner_id=current_user.id)


@router.post("/listings", response_model=MarketplaceListingRead, status_code=status.HTTP_201_CREATED)
def create_listing_endpoint(
    payload: MarketplaceListingCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MarketplaceListingRead:
    try:
        return create_listing(db, payload, owner_id=current_user.id)
    except ImageTooLargeError as exc:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(exc)) from exc
    except InvalidImageError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/listings/{listing_id}", response_model=MarketplaceListingRead)
def read_listing(listing_id: UUID, db: Session = Depends(get_db)) -> MarketplaceListingRead:
    listing = get_listing(db, listing_id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return listing


@router.put("/listings/{listing_id}", response_model=MarketplaceListingRead)
def update_listing_endpoint(
    listing_id: UUID,
    payload: MarketplaceListingUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MarketplaceListingRead:
    listing = get_listing_for_owner(db, listing_id, current_user.id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    try:
        return update_listing(db, listing, payload)
    except ImageTooLargeError as exc:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(exc)) from exc
    except InvalidImageError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing_endpoint(
    listing_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    listing = get_listing_for_owner(db, listing_id, current_user.id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    delete_listing(db, listing)


@router.post("/orders", response_model=MarketplaceOrderRead, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(
    payload: MarketplaceOrderCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MarketplaceOrderRead:
    listing = get_listing(db, payload.listing_id)
    if listing and listing.owner_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot place an order on your own listing")
    try:
        order = create_order(db, payload, buyer_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    # Notify seller in-app + email
    create_notification(
        db,
        user_id=order.seller_id,
        type="order_created",
        title=f"New purchase request — {order.listing_name}",
        body=f"{order.buyer_name} wants to buy {order.requested_quantity} units.",
        link="/marketplace",
    )
    db.commit()
    if order.seller and order.seller.email:
        try:
            send_order_event_email(order.seller.email, order.seller_name, "order_created", order.listing_name, "/marketplace")
        except Exception:
            pass
    return order


@router.get("/orders", response_model=list[MarketplaceOrderRead])
def read_orders(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MarketplaceOrderRead]:
    return list_orders_for_user(db, current_user.id)


@router.put("/orders/{order_id}/status", response_model=MarketplaceOrderRead)
def update_order_status_endpoint(
    order_id: UUID,
    payload: MarketplaceOrderStatusUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MarketplaceOrderRead:
    order = get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.seller_id != current_user.id and order.buyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    # Only seller can confirm/reject/deliver; buyer can mark completed
    seller_only = {MarketplaceOrderStatus.CONFIRMED, MarketplaceOrderStatus.REJECTED, MarketplaceOrderStatus.DELIVERED}
    if payload.status in seller_only and order.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the seller can perform this action")
    if payload.status == MarketplaceOrderStatus.COMPLETED and order.buyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the buyer can confirm completion")
    try:
        updated = update_order_status(db, order, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    # Determine who to notify and with what event key
    new_status = payload.status
    event_map = {
        MarketplaceOrderStatus.CONFIRMED:  ("order_confirmed",  updated.buyer_id,  updated.buyer_name,  updated.buyer.email if updated.buyer else None),
        MarketplaceOrderStatus.REJECTED:   ("order_rejected",   updated.buyer_id,  updated.buyer_name,  updated.buyer.email if updated.buyer else None),
        MarketplaceOrderStatus.DELIVERED:  ("order_delivered",  updated.buyer_id,  updated.buyer_name,  updated.buyer.email if updated.buyer else None),
        MarketplaceOrderStatus.COMPLETED:  ("order_completed",  updated.seller_id, updated.seller_name, updated.seller.email if updated.seller else None),
    }
    if new_status in event_map:
        event_key, notify_user_id, notify_name, notify_email = event_map[new_status]
        label = new_status.value.replace("_", " ").title()
        notify_link = "/trader/orders" if notify_user_id == updated.buyer_id else "/marketplace"
        create_notification(
            db,
            user_id=notify_user_id,
            type=event_key,
            title=f"Order {label} — {updated.listing_name}",
            link=notify_link,
        )
        db.commit()
        if notify_email:
            try:
                send_order_event_email(notify_email, notify_name, event_key, updated.listing_name, notify_link)
            except Exception:
                pass

    return updated


@router.post("/orders/{order_id}/negotiation", response_model=MarketplaceOrderRead)
def add_negotiation_endpoint(
    order_id: UUID,
    payload: MarketplaceNegotiationCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MarketplaceOrderRead:
    order = get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if current_user.id not in {order.buyer_id, order.seller_id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot negotiate this order")
    sender_role = "Trader" if current_user.id == order.buyer_id else "Land Owner"
    return add_negotiation(db, order, payload, sender_role, sender_id=current_user.id)


@router.get("/orders/{order_id}/negotiation", response_model=list[NegotiationMessageRead])
def list_negotiation_endpoint(
    order_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NegotiationMessageRead]:
    order = get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if current_user.id not in {order.buyer_id, order.seller_id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view this negotiation")
    return list_negotiation_messages(db, order_id)


@router.get("/history", response_model=list[MarketplaceOrderRead])
def read_history(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MarketplaceOrderRead]:
    return list_orders_for_user(db, current_user.id)
