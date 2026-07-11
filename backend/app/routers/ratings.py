from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.marketplace import MarketplaceOrder, MarketplaceOrderStatus
from app.models.rating import Rating
from app.models.user import User
from app.services.notification_service import create_notification

router = APIRouter(prefix="/ratings", tags=["ratings"])


class RatingCreate(BaseModel):
    score: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)


class RatingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: UUID
    rater_id: int
    ratee_id: int
    score: int
    comment: Optional[str] = None
    created_at: datetime


class AvgRating(BaseModel):
    user_id: int
    average_score: Optional[float] = None
    total_ratings: int


class ReviewRead(BaseModel):
    id: int
    score: int
    comment: Optional[str] = None
    created_at: datetime
    rater_name: str


@router.post("/orders/{order_id}", response_model=RatingRead, status_code=status.HTTP_201_CREATED)
def submit_rating(
    order_id: UUID,
    payload: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.execute(
        select(MarketplaceOrder).where(MarketplaceOrder.id == order_id)
    ).scalar_one_or_none()

    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status != MarketplaceOrderStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ratings can only be submitted for completed orders")
    # Only buyer can rate (rating the seller/trader)
    if order.buyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the buyer can rate this order")

    existing = db.execute(
        select(Rating).where(Rating.order_id == order_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This order has already been rated")

    rating = Rating(
        order_id=order_id,
        rater_id=current_user.id,
        ratee_id=order.seller_id,
        score=payload.score,
        comment=payload.comment,
    )
    db.add(rating)

    # Notify the ratee (seller)
    create_notification(
        db,
        user_id=order.seller_id,
        type="rating_received",
        title=f"You received a {payload.score}★ rating",
        body=payload.comment or "",
        link="/landowner/settings",
    )
    db.commit()
    db.refresh(rating)
    return rating


@router.get("/orders/{order_id}", response_model=Optional[RatingRead])
def get_order_rating(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rating = db.execute(
        select(Rating).where(Rating.order_id == order_id)
    ).scalar_one_or_none()
    return rating


@router.get("/users/{user_id}", response_model=AvgRating)
def get_user_avg_rating(
    user_id: int,
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(func.avg(Rating.score), func.count(Rating.id))
        .where(Rating.ratee_id == user_id)
    ).one()
    avg, total = result
    return AvgRating(
        user_id=user_id,
        average_score=round(float(avg), 1) if avg is not None else None,
        total_ratings=total or 0,
    )


@router.get("/users/{user_id}/reviews", response_model=list[ReviewRead])
def list_user_reviews(
    user_id: int,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Public review list (with comments) for a seller/trader — shown in the
    marketplace so buyers can see what past customers actually said, not just
    the average star count."""
    rows = db.execute(
        select(Rating, User.full_name)
        .join(User, User.id == Rating.rater_id)
        .where(Rating.ratee_id == user_id)
        .order_by(Rating.created_at.desc())
        .limit(min(limit, 50))
    ).all()
    return [
        ReviewRead(
            id=rating.id, score=rating.score, comment=rating.comment,
            created_at=rating.created_at, rater_name=rater_name,
        )
        for rating, rater_name in rows
    ]
