"""
SmartAgri payment tests — run with: pytest backend/tests/test_payments.py -v
Requires the conftest.py in this directory to run first (sets env + patches dotenv).
"""
import os

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base
from app.core.security import hash_password
from app.models.marketplace import MarketplaceListing, MarketplaceOrder, MarketplaceOrderStatus, OrderPaymentStatus
from app.models.payment import Payment
from app.models.user import User, UserRole
from app.schemas.marketplace import MarketplaceOrderStatusUpdate
from app.services.marketplace_service import update_order_status
from app.services.payment_service import build_notify_signature, build_payhere_hash, init_payment, verify_notify_signature

os.environ.setdefault("PAYHERE_MERCHANT_ID", "1211149")
os.environ.setdefault("PAYHERE_MERCHANT_SECRET", "test-secret")
os.environ.setdefault("PAYHERE_NOTIFY_URL", "https://example.test/api/payments/payhere/notify")

_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
Base.metadata.create_all(bind=_engine)


_order_seq = 0


def _make_order(db, *, payment_status: OrderPaymentStatus) -> MarketplaceOrder:
    global _order_seq
    _order_seq += 1
    seller = User(
        full_name="Seller Test", email=f"seller-{_order_seq}@smartagri.com",
        hashed_password=hash_password("Password123!"), role=UserRole.LAND_OWNER,
        roles=[UserRole.LAND_OWNER.value], is_verified=True, is_suspended=False,
    )
    buyer = User(
        full_name="Buyer Test", email=f"buyer-{_order_seq}@smartagri.com",
        hashed_password=hash_password("Password123!"), role=UserRole.TRADER,
        roles=[UserRole.TRADER.value], is_verified=True, is_suspended=False,
    )
    db.add_all([seller, buyer])
    db.commit()
    db.refresh(seller)
    db.refresh(buyer)

    listing = MarketplaceListing(
        owner_id=seller.id, crop_name="Test Rice", crop_type="Grain",
        quantity=100, unit="kg", price_per_unit=100,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    order = MarketplaceOrder(
        listing_id=listing.id, buyer_id=buyer.id, seller_id=seller.id,
        requested_quantity=10, proposed_price=100, agreed_price=100,
        status=MarketplaceOrderStatus.CONFIRMED, payment_status=payment_status,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


# ── Hash / signature ─────────────────────────────────────────────────────────

def test_build_payhere_hash_is_deterministic_uppercase_hex():
    h1 = build_payhere_hash("1211149", "order-1", "1000.00", "LKR", "secret123")
    h2 = build_payhere_hash("1211149", "order-1", "1000.00", "LKR", "secret123")
    assert h1 == h2
    assert h1 == h1.upper()
    assert len(h1) == 32
    int(h1, 16)  # valid hex


def test_build_payhere_hash_changes_with_amount():
    h1 = build_payhere_hash("1211149", "order-1", "1000.00", "LKR", "secret123")
    h2 = build_payhere_hash("1211149", "order-1", "2000.00", "LKR", "secret123")
    assert h1 != h2


def test_verify_notify_signature_valid():
    sig = build_notify_signature("1211149", "order-1", "1000.00", "LKR", "2", "secret123")
    payload = {
        "merchant_id": "1211149", "order_id": "order-1",
        "payhere_amount": "1000.00", "payhere_currency": "LKR",
        "status_code": "2", "md5sig": sig,
    }
    assert verify_notify_signature(payload, "secret123") is True


def test_verify_notify_signature_tampered_rejected():
    sig = build_notify_signature("1211149", "order-1", "1000.00", "LKR", "2", "secret123")
    payload = {
        "merchant_id": "1211149", "order_id": "order-1",
        "payhere_amount": "9999.00",  # attacker changes the amount, keeps old sig
        "payhere_currency": "LKR", "status_code": "2", "md5sig": sig,
    }
    assert verify_notify_signature(payload, "secret123") is False


# ── State-machine gate ────────────────────────────────────────────────────────

def test_delivered_blocked_when_unpaid():
    db = TestingSessionLocal()
    order = _make_order(db, payment_status=OrderPaymentStatus.UNPAID)
    with pytest.raises(ValueError, match="Payment required"):
        update_order_status(db, order, MarketplaceOrderStatusUpdate(status=MarketplaceOrderStatus.DELIVERED))
    db.close()


def test_delivered_allowed_when_paid():
    db = TestingSessionLocal()
    order = _make_order(db, payment_status=OrderPaymentStatus.PAID)
    updated = update_order_status(db, order, MarketplaceOrderStatusUpdate(status=MarketplaceOrderStatus.DELIVERED))
    assert updated.status == MarketplaceOrderStatus.DELIVERED
    assert updated.delivered_at is not None
    db.close()


def test_init_payment_is_idempotent_while_unsettled():
    """Regression test: repeated calls (double-clicks, retries, or React
    effects re-firing under StrictMode in dev) must not spawn a new Payment
    row each time — they should reuse the same in-flight (Initiated) one."""
    db = TestingSessionLocal()
    order = _make_order(db, payment_status=OrderPaymentStatus.UNPAID)

    payment1, payload1 = init_payment(db, order)
    payment2, payload2 = init_payment(db, order)

    assert payment1.id == payment2.id
    assert payload1["order_id"] == payload2["order_id"]

    count = db.execute(select(func.count()).select_from(Payment).where(Payment.order_id == order.id)).scalar()
    assert count == 1
    db.close()
