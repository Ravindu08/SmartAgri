from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_land_owner, get_current_trader, get_current_user, get_db
from app.models.user import UserRole
from app.schemas.marketplace import (
    MarketplaceListingCreate,
    MarketplaceListingRead,
    MarketplaceListingUpdate,
    MarketplaceNegotiationCreate,
    MarketplaceOrderCreate,
    MarketplaceOrderRead,
    MarketplaceOrderStatusUpdate,
)
from app.services.marketplace_service import (
    add_negotiation,
    create_listing,
    create_order,
    delete_listing,
    get_listing,
    get_listing_for_owner,
    get_order,
    list_active_listings,
    list_orders_for_user,
    list_owner_listings,
    update_listing,
    update_order_status,
)


router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])


@router.get("/listings", response_model=list[MarketplaceListingRead])
def read_listings(db: Session = Depends(get_db)) -> list[MarketplaceListingRead]:
    return list_active_listings(db)


@router.get("/listings/me", response_model=list[MarketplaceListingRead])
def read_my_listings(
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> list[MarketplaceListingRead]:
    return list_owner_listings(db, owner_id=current_user.id)


@router.post("/listings", response_model=MarketplaceListingRead, status_code=status.HTTP_201_CREATED)
def create_listing_endpoint(
    payload: MarketplaceListingCreate,
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> MarketplaceListingRead:
    return create_listing(db, payload, owner_id=current_user.id)


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
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> MarketplaceListingRead:
    listing = get_listing_for_owner(db, listing_id, current_user.id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return update_listing(db, listing, payload)


@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing_endpoint(
    listing_id: UUID,
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> None:
    listing = get_listing_for_owner(db, listing_id, current_user.id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    delete_listing(db, listing)


@router.post("/orders", response_model=MarketplaceOrderRead, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(
    payload: MarketplaceOrderCreate,
    current_user=Depends(get_current_trader),
    db: Session = Depends(get_db),
) -> MarketplaceOrderRead:
    try:
        return create_order(db, payload, buyer_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


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
    current_user=Depends(get_current_land_owner),
    db: Session = Depends(get_db),
) -> MarketplaceOrderRead:
    order = get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the listing owner can update this order")
    try:
        return update_order_status(db, order, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


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
    sender_role = current_user.role.value
    return add_negotiation(db, order, payload, sender_role)


@router.get("/history", response_model=list[MarketplaceOrderRead])
def read_history(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MarketplaceOrderRead]:
    return list_orders_for_user(db, current_user.id)
