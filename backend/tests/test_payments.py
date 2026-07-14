"""
SmartAgri payment tests — run with: pytest backend/tests/test_payments.py -v
Requires the conftest.py in this directory to run first (sets env + patches dotenv).
"""
import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base
from app.core.security import hash_password
from app.models.marketplace import MarketplaceListing, MarketplaceOrder, MarketplaceOrderStatus, OrderPaymentStatus
from app.models.payment import Payment, PaymentStatus
from app.models.user import User, UserRole
from app.schemas.marketplace import MarketplaceOrderStatusUpdate
from app.services.marketplace_service import update_order_status
from app.services.payment_service import simulate_payment

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


# ── Simulated payment ──────────────────────────────────────────────────────────

def test_simulate_payment_marks_order_paid():
    db = TestingSessionLocal()
    order = _make_order(db, payment_status=OrderPaymentStatus.UNPAID)

    payment = simulate_payment(db, order)

    assert payment.status == PaymentStatus.PAID
    assert payment.amount == order.agreed_price * order.requested_quantity
    assert order.payment_status == OrderPaymentStatus.PAID
    assert order.paid_at is not None

    count = db.execute(select(func.count()).select_from(Payment).where(Payment.order_id == order.id)).scalar()
    assert count == 1
    db.close()


def test_simulate_payment_rejects_if_already_paid():
    db = TestingSessionLocal()
    order = _make_order(db, payment_status=OrderPaymentStatus.UNPAID)
    simulate_payment(db, order)

    with pytest.raises(ValueError, match="already paid"):
        simulate_payment(db, order)
    db.close()
