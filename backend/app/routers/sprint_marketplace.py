from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.sprint_marketplace_store import (
    add_message,
    create_listing,
    create_request,
    get_listings,
    get_orders,
    get_requests,
    resolve_request,
    update_order,
)

router = APIRouter(tags=["sprint-marketplace"])


class ListingCreate(BaseModel):
    cropName: str = ""
    quantity: float = 0
    unit: str = "kg"
    pricePerUnit: float = 0
    ownerName: str = ""
    location: str = ""
    description: str = ""
    image: str = ""
    listing_type: str = "crop"
    ownerRole: str = "owner"


class RequestCreate(BaseModel):
    listingId: str
    traderName: str = ""
    quantity: float = Field(gt=0)
    offeredPrice: float = Field(gt=0)


class RequestResolve(BaseModel):
    action: str


class MessageCreate(BaseModel):
    sender: str = "trader"
    senderName: str = ""
    text: str = ""
    offeredPrice: Optional[float] = None


class OrderUpdate(BaseModel):
    status: str


@router.get("/api/listings")
def read_listings() -> dict:
    return {"listings": get_listings()}


@router.post("/api/listings", status_code=status.HTTP_201_CREATED)
def post_listing(payload: ListingCreate) -> dict:
    try:
        listing = create_listing(payload.model_dump())
        return {"listing": listing}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc


@router.get("/api/requests")
def read_requests() -> dict:
    return {"requests": get_requests()}


@router.post("/api/requests", status_code=status.HTTP_201_CREATED)
def post_request(payload: RequestCreate) -> dict:
    try:
        request = create_request(payload.model_dump())
        return {"request": request}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc


@router.patch("/api/requests/{request_id}")
def patch_request(request_id: str, payload: RequestResolve) -> dict:
    try:
        request = resolve_request(request_id, payload.action)
        return {"request": request}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc


@router.post("/api/requests/{request_id}/messages")
def post_message(request_id: str, payload: MessageCreate) -> dict:
    try:
        request = add_message(request_id, payload.model_dump())
        return {"request": request}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc


@router.get("/api/orders")
def read_orders() -> dict:
    return {"orders": get_orders()}


@router.patch("/api/orders/{order_id}")
def patch_order(order_id: str, payload: OrderUpdate) -> dict:
    try:
        order = update_order(order_id, payload.status)
        return {"order": order}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
