from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.schemas.payment import PaymentSimulateResponse
from app.services.email import send_order_event_email
from app.services.marketplace_service import get_order
from app.services.notification_service import create_notification
from app.services.payment_service import simulate_payment

router = APIRouter(tags=["payments"])


@router.post("/api/marketplace/orders/{order_id}/payment/simulate", response_model=PaymentSimulateResponse)
def simulate_payment_endpoint(
    order_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentSimulateResponse:
    order = get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.buyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the buyer can pay for this order")
    try:
        payment = simulate_payment(db, order)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    create_notification(
        db,
        user_id=order.seller_id,
        type="payment_received",
        title=f"Payment received — {order.listing_name}",
        body=f"{order.buyer_name} has paid for this order. You can now mark it as delivered.",
        link="/marketplace",
    )
    db.commit()
    if order.seller and order.seller.email:
        try:
            send_order_event_email(order.seller.email, order.seller_name, "payment_received", order.listing_name, "/marketplace")
        except Exception:
            pass

    return PaymentSimulateResponse(
        status=payment.status.value,
        amount=float(payment.amount),
        currency=payment.currency,
        paid_at=order.paid_at,
    )
