from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.marketplace import MarketplaceOrder, MarketplaceOrderStatus, OrderPaymentStatus
from app.models.payment import Payment, PaymentStatus

CURRENCY = "LKR"


def simulate_payment(db: Session, order: MarketplaceOrder) -> Payment:
    """No real payment gateway is wired up (see project notes) — this marks
    the order paid directly, synchronously, standing in for what a real
    gateway's webhook would eventually confirm. Everything downstream (the
    Confirmed->Delivered gate, the payments table, receipts) doesn't know or
    care that the payment was simulated rather than real."""
    if order.status != MarketplaceOrderStatus.CONFIRMED:
        raise ValueError("Order must be Confirmed before it can be paid")
    if order.payment_status == OrderPaymentStatus.PAID:
        raise ValueError("Order is already paid")

    # Server-computed total — never trust a client-supplied amount.
    amount = round((order.agreed_price or 0) * order.requested_quantity, 2)
    if amount <= 0:
        raise ValueError("Order has no agreed price to charge")

    payment = Payment(order_id=order.id, amount=amount, currency=CURRENCY, status=PaymentStatus.PAID)
    db.add(payment)
    order.payment_status = OrderPaymentStatus.PAID
    order.paid_at = datetime.now(timezone.utc)
    db.add(order)
    db.commit()
    db.refresh(payment)
    return payment
