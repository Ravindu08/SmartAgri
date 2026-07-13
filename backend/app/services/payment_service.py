import hashlib
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.payment_config import (
    get_frontend_url,
    get_notify_url,
    get_payhere_merchant_id,
    get_payhere_merchant_secret,
    is_sandbox_mode,
)
from app.models.marketplace import MarketplaceOrder, MarketplaceOrderStatus, OrderPaymentStatus
from app.models.payment import Payment, PaymentStatus

CURRENCY = "LKR"

# PayHere status_code -> our PaymentStatus (support.payhere.lk/api-&-mobile-sdk/checkout-api)
_STATUS_CODE_MAP = {
    "2": PaymentStatus.PAID,
    "0": PaymentStatus.INITIATED,   # still pending
    "-1": PaymentStatus.CANCELLED,
    "-2": PaymentStatus.FAILED,
    "-3": PaymentStatus.CHARGEDBACK,
}


def _md5_upper(value: str) -> str:
    return hashlib.md5(value.encode("utf-8")).hexdigest().upper()


def build_payhere_hash(merchant_id: str, order_id: str, amount: str, currency: str, merchant_secret: str) -> str:
    """hash = UPPER(MD5(merchant_id + order_id + amount + currency + UPPER(MD5(merchant_secret))))"""
    secret_hash = _md5_upper(merchant_secret)
    return _md5_upper(f"{merchant_id}{order_id}{amount}{currency}{secret_hash}")


def build_notify_signature(
    merchant_id: str, order_id: str, payhere_amount: str, payhere_currency: str, status_code: str, merchant_secret: str
) -> str:
    """md5sig = UPPER(MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + UPPER(MD5(merchant_secret))))"""
    secret_hash = _md5_upper(merchant_secret)
    return _md5_upper(f"{merchant_id}{order_id}{payhere_amount}{payhere_currency}{status_code}{secret_hash}")


def verify_notify_signature(payload: dict, merchant_secret: str) -> bool:
    expected = build_notify_signature(
        merchant_id=payload["merchant_id"],
        order_id=payload["order_id"],
        payhere_amount=payload["payhere_amount"],
        payhere_currency=payload["payhere_currency"],
        status_code=payload["status_code"],
        merchant_secret=merchant_secret,
    )
    return expected == payload.get("md5sig", "")


def init_payment(db: Session, order: MarketplaceOrder) -> tuple[Payment, dict]:
    if order.status != MarketplaceOrderStatus.CONFIRMED:
        raise ValueError("Order must be Confirmed before it can be paid")
    if order.payment_status == OrderPaymentStatus.PAID:
        raise ValueError("Order is already paid")

    # Server-computed total — never trust a client-supplied amount.
    amount = round((order.agreed_price or 0) * order.requested_quantity, 2)
    if amount <= 0:
        raise ValueError("Order has no agreed price to charge")

    # Idempotent: reuse an in-flight attempt instead of spawning a new row on
    # every call (repeated clicks, retries, or React effects re-firing in dev
    # all hit this). Only create a fresh row once the prior one has settled.
    existing = get_latest_payment_for_order(db, order.id)
    if existing is not None and existing.status == PaymentStatus.INITIATED:
        payment = existing
    else:
        payment = Payment(order_id=order.id, amount=amount, currency=CURRENCY, status=PaymentStatus.INITIATED)
        db.add(payment)
        db.commit()
        db.refresh(payment)

    merchant_id = get_payhere_merchant_id()
    merchant_secret = get_payhere_merchant_secret()
    amount_str = f"{amount:.2f}"
    payhere_order_id = str(payment.id)  # unique per attempt, not the marketplace order id
    frontend_url = get_frontend_url()

    buyer = order.buyer
    name_parts = (buyer.full_name or "").strip().split(" ", 1)
    first_name = name_parts[0] if name_parts and name_parts[0] else "Buyer"
    last_name = name_parts[1] if len(name_parts) > 1 else "-"

    payload = {
        "merchant_id": merchant_id,
        "order_id": payhere_order_id,
        "items": order.listing_name or "SmartAgri Marketplace Order",
        "amount": amount_str,
        "currency": CURRENCY,
        "hash": build_payhere_hash(merchant_id, payhere_order_id, amount_str, CURRENCY, merchant_secret),
        "first_name": first_name,
        "last_name": last_name,
        "email": buyer.email,
        "phone": buyer.phone_number or "",
        "address": "N/A",
        "city": order.listing.location or "Colombo",
        "country": "Sri Lanka",
        "return_url": f"{frontend_url}/trader/orders?payment=success",
        "cancel_url": f"{frontend_url}/trader/orders?payment=cancelled",
        "notify_url": get_notify_url(),
        "sandbox": is_sandbox_mode(),
    }
    return payment, payload


def get_payment(db: Session, payment_id: UUID) -> Payment | None:
    return db.execute(select(Payment).where(Payment.id == payment_id)).scalar_one_or_none()


def get_latest_payment_for_order(db: Session, order_id: UUID) -> Payment | None:
    return db.execute(
        select(Payment).where(Payment.order_id == order_id).order_by(Payment.created_at.desc())
    ).scalars().first()


def apply_notify(db: Session, payment: Payment, status_code: str, payhere_payment_id: str, raw_payload: str) -> Payment:
    payment.status = _STATUS_CODE_MAP.get(status_code, PaymentStatus.FAILED)
    payment.payhere_payment_id = payhere_payment_id
    payment.raw_notify_payload = raw_payload
    db.add(payment)

    if payment.status == PaymentStatus.PAID:
        order = payment.order
        order.payment_status = OrderPaymentStatus.PAID
        order.paid_at = datetime.now(timezone.utc)
        db.add(order)

    db.commit()
    db.refresh(payment)
    return payment
