"""In-memory marketplace store for Sprint 4 demo API (/api/listings, /api/requests, /api/orders)."""

from __future__ import annotations

import time
import uuid
from typing import Literal

Role = Literal["owner", "trader"]
RequestStatus = Literal["pending", "accepted", "rejected"]
OrderStatus = Literal["pending", "confirmed", "delivered", "completed"]

_store: dict[str, list[dict]] = {
    "listings": [],
    "requests": [],
    "orders": [],
}


def _id() -> str:
    return str(uuid.uuid4())


def _now() -> int:
    return int(time.time() * 1000)


def seed_demo_data() -> None:
    if _store["listings"]:
        return

    _BASE = "http://localhost:5173/market_images"

    # ── Crop listings (Land Owner: Induwara Ihalavithana) ─────────────────
    _store["listings"].append({
        "id": _id(),
        "cropName": "Fresh Tomatoes",
        "quantity": 120,
        "unit": "kg",
        "pricePerUnit": 160,
        "ownerName": "Induwara Ihalavithana",
        "location": "Dambulla",
        "description": "Grade A tomatoes, freshly harvested. Firm, bright red, suitable for local markets and export.",
        "status": "available",
        "listing_type": "crop",
        "ownerRole": "owner",
        "image": f"{_BASE}/tomatoes.jpg",
        "createdAt": _now(),
    })
    _store["listings"].append({
        "id": _id(),
        "cropName": "Fresh Carrots",
        "quantity": 200,
        "unit": "kg",
        "pricePerUnit": 180,
        "ownerName": "Induwara Ihalavithana",
        "location": "Nuwara Eliya",
        "description": "Freshly harvested hill-country carrots. Large, clean, and well-sorted. Ideal for domestic and export.",
        "status": "available",
        "listing_type": "crop",
        "ownerRole": "owner",
        "image": f"{_BASE}/carrots.jpg",
        "createdAt": _now(),
    })
    _store["listings"].append({
        "id": _id(),
        "cropName": "Green Beans",
        "quantity": 100,
        "unit": "kg",
        "pricePerUnit": 220,
        "ownerName": "Induwara Ihalavithana",
        "location": "Kandy",
        "description": "Tender, freshly picked green beans. Suitable for supermarkets, restaurants, and export buyers.",
        "status": "available",
        "listing_type": "crop",
        "ownerRole": "owner",
        "image": f"{_BASE}/green-beans.jpg",
        "createdAt": _now(),
    })
    _store["listings"].append({
        "id": _id(),
        "cropName": "Potatoes",
        "quantity": 250,
        "unit": "kg",
        "pricePerUnit": 150,
        "ownerName": "Induwara Ihalavithana",
        "location": "Badulla",
        "description": "Fresh hill-country potatoes, clean and well-graded. Good for bulk buyers and wholesale.",
        "status": "available",
        "listing_type": "crop",
        "ownerRole": "owner",
        "image": f"{_BASE}/potatoes.jpg",
        "createdAt": _now(),
    })

    # ── Agricultural products (Trader: Induwara Ihalavithana) ─────────────
    _store["listings"].append({
        "id": _id(),
        "cropName": "Baurs Tomato Seeds — Thilina",
        "quantity": 50,
        "unit": "packet",
        "pricePerUnit": 75,
        "ownerName": "Induwara Ihalavithana",
        "location": "Colombo",
        "description": "Baurs Thilina variety commercial tomato seeds. 5g per packet. High germination rate, suitable for home and commercial cultivation.",
        "status": "available",
        "listing_type": "product",
        "ownerRole": "trader",
        "image": f"{_BASE}/tomato-seeds.jpg",
        "createdAt": _now(),
    })
    _store["listings"].append({
        "id": _id(),
        "cropName": "Baurs Vegetable & Crop Fertilizer",
        "quantity": 30,
        "unit": "box",
        "pricePerUnit": 1850,
        "ownerName": "Induwara Ihalavithana",
        "location": "Colombo",
        "description": "Baurs Home Garden Series vegetable and crop fertilizer. 2kg per box. Balanced N-P-K formula for healthy growth.",
        "status": "available",
        "listing_type": "product",
        "ownerRole": "trader",
        "image": f"{_BASE}/fertilizer.jpg",
        "createdAt": _now(),
    })
    _store["listings"].append({
        "id": _id(),
        "cropName": "Hayleys Profenophos 500ml",
        "quantity": 40,
        "unit": "bottle",
        "pricePerUnit": 1200,
        "ownerName": "Induwara Ihalavithana",
        "location": "Colombo",
        "description": "Hayleys Profenophos 500 EC insecticide. Effective broad-spectrum control of agricultural pests. 500ml per bottle.",
        "status": "available",
        "listing_type": "product",
        "ownerRole": "trader",
        "image": f"{_BASE}/profenophos.png",
        "createdAt": _now(),
    })


def get_listings() -> list[dict]:
    return list(_store["listings"])


def create_listing(payload: dict) -> dict:
    listing = {
        "id": _id(),
        "cropName": payload.get("cropName", ""),
        "quantity": float(payload.get("quantity", 0)),
        "unit": payload.get("unit", "kg"),
        "pricePerUnit": float(payload.get("pricePerUnit", 0)),
        "ownerName": payload.get("ownerName", ""),
        "location": payload.get("location", ""),
        "description": payload.get("description", ""),
        "image": payload.get("image", ""),
        "listing_type": payload.get("listing_type", "crop"),
        "ownerRole": payload.get("ownerRole", "owner"),
        "status": "available",
        "createdAt": _now(),
    }
    if not listing["cropName"] or listing["quantity"] <= 0 or listing["pricePerUnit"] <= 0:
        raise ValueError("Crop name, quantity and price are required.")
    _store["listings"].append(listing)
    return listing


def get_requests() -> list[dict]:
    return list(_store["requests"])


def _find_listing(listing_id: str) -> dict | None:
    return next((l for l in _store["listings"] if l["id"] == listing_id), None)


def _find_request(request_id: str) -> dict | None:
    return next((r for r in _store["requests"] if r["id"] == request_id), None)


def create_request(payload: dict) -> dict:
    listing = _find_listing(payload.get("listingId", ""))
    if listing is None:
        raise ValueError("Listing not found.")
    if listing["status"] != "available":
        raise ValueError("Listing is no longer available.")
    quantity = float(payload.get("quantity", 0))
    offered_price = float(payload.get("offeredPrice", 0))
    if quantity <= 0 or offered_price <= 0:
        raise ValueError("Enter a valid quantity and price.")
    if quantity > listing["quantity"]:
        raise ValueError(f"Only {listing['quantity']} {listing['unit']} available.")

    request = {
        "id": _id(),
        "listingId": listing["id"],
        "cropName": listing["cropName"],
        "unit": listing["unit"],
        "traderName": payload.get("traderName", ""),
        "ownerName": listing["ownerName"],
        "quantity": quantity,
        "offeredPrice": offered_price,
        "status": "pending",
        "messages": [],
        "createdAt": _now(),
    }
    _store["requests"].append(request)
    return request


def resolve_request(request_id: str, action: str) -> dict:
    request = _find_request(request_id)
    if request is None:
        raise ValueError("Request not found.")
    if request["status"] != "pending":
        raise ValueError("Request already resolved.")

    if action == "reject":
        request["status"] = "rejected"
        return request

    if action != "accept":
        raise ValueError("Invalid action.")

    request["status"] = "accepted"
    listing = _find_listing(request["listingId"])
    price = request["offeredPrice"]
    total = round(request["quantity"] * price, 2)
    now = _now()
    order = {
        "id": _id(),
        "requestId": request["id"],
        "listingId": request["listingId"],
        "cropName": request["cropName"],
        "unit": request["unit"],
        "traderName": request["traderName"],
        "ownerName": request["ownerName"],
        "quantity": request["quantity"],
        "pricePerUnit": price,
        "total": total,
        "status": "pending",
        "createdAt": now,
        "updatedAt": now,
        "history": [{"status": "pending", "at": now}],
    }
    _store["orders"].append(order)
    if listing is not None:
        listing["status"] = "sold"
    return request


def add_message(request_id: str, payload: dict) -> dict:
    request = _find_request(request_id)
    if request is None:
        raise ValueError("Request not found.")
    text = (payload.get("text") or "").strip()
    offered_price = payload.get("offeredPrice")
    if not text and offered_price is None:
        raise ValueError("Type a message or a counter price.")

    message = {
        "id": _id(),
        "sender": payload.get("sender", "trader"),
        "senderName": payload.get("senderName", ""),
        "text": text,
        "createdAt": _now(),
    }
    if offered_price is not None:
        message["offeredPrice"] = float(offered_price)
        request["offeredPrice"] = float(offered_price)
    request["messages"].append(message)
    return request


def get_orders() -> list[dict]:
    return list(_store["orders"])


def _find_order(order_id: str) -> dict | None:
    return next((o for o in _store["orders"] if o["id"] == order_id), None)


ORDER_FLOW: list[OrderStatus] = ["pending", "confirmed", "delivered", "completed"]


def update_order(order_id: str, status: str) -> dict:
    order = _find_order(order_id)
    if order is None:
        raise ValueError("Order not found.")
    if status not in ORDER_FLOW:
        raise ValueError("Invalid order status.")

    current_idx = ORDER_FLOW.index(order["status"])
    new_idx = ORDER_FLOW.index(status)
    if new_idx != current_idx + 1:
        raise ValueError("Orders must advance one step at a time.")

    now = _now()
    order["status"] = status
    order["updatedAt"] = now
    order["history"].append({"status": status, "at": now})
    return order
