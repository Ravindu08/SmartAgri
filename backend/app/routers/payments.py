from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.core.payment_config import PaymentConfigError, get_payhere_merchant_secret
from app.schemas.payment import PaymentInitResponse, PaymentStatusRead
from app.services.email import send_order_event_email
from app.services.marketplace_service import get_order
from app.services.notification_service import create_notification
from app.services.payment_service import (
    apply_notify,
    get_latest_payment_for_order,
    get_payment,
    init_payment,
    verify_notify_signature,
)

router = APIRouter(tags=["payments"])


@router.post("/api/marketplace/orders/{order_id}/payment/init", response_model=PaymentInitResponse)
def init_payment_endpoint(
    order_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentInitResponse:
    order = get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.buyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the buyer can pay for this order")
    try:
        _payment, payload = init_payment(db, order)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except PaymentConfigError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    return PaymentInitResponse(**payload)


@router.get("/api/marketplace/orders/{order_id}/payment", response_model=PaymentStatusRead)
def get_payment_status_endpoint(
    order_id: UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentStatusRead:
    order = get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if current_user.id not in {order.buyer_id, order.seller_id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    payment = get_latest_payment_for_order(db, order_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No payment found for this order")
    return payment


@router.post("/api/payments/payhere/notify")
async def payhere_notify_endpoint(request: Request, db: Session = Depends(get_db)) -> dict:
    # PayHere calls this server-to-server with no SmartAgri JWT — verify by
    # signature instead of Depends(get_current_user).
    form = await request.form()
    payload = dict(form)

    try:
        merchant_secret = get_payhere_merchant_secret()
    except PaymentConfigError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    if not verify_notify_signature(payload, merchant_secret):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    try:
        payment_id = UUID(payload["order_id"])  # we sent our Payment.id as PayHere's order_id
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown order_id") from exc

    payment = get_payment(db, payment_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    updated = apply_notify(db, payment, payload.get("status_code", ""), payload.get("payment_id", ""), str(payload))

    if updated.status.value == "Paid":
        order = updated.order
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

    return {"status": "ok"}
