from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db, require_admin
from app.core.security import hash_password
from app.models.activity import Feedback, UserActivity
from app.models.farm import Farm
from app.models.marketplace import MarketplaceListing, MarketplaceListingStatus, MarketplaceOrder
from app.models.user import User, UserRole
from app.schemas.user import UserRead


router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Pydantic schemas (admin-local) ────────────────────────────────────────────

class AdminUserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "Land Owner"
    roles: Optional[list[str]] = None


class AdminUserPatch(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    roles: Optional[list[str]] = None
    is_suspended: Optional[bool] = None


class FeedbackCreate(BaseModel):
    type: str = "feedback"
    subject: str
    message: str


class FeedbackReply(BaseModel):
    reply: str


class ActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: Optional[int] = None
    actor_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime


class FeedbackRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: Optional[int] = None
    type: str
    subject: str
    message: str
    status: str
    admin_reply: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def log_activity(db: Session, *, user_id: int | None, actor_id: int | None,
                 action: str, entity_type: str | None = None, details: str | None = None) -> None:
    entry = UserActivity(
        user_id=user_id,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        details=details,
        created_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()


# ── User management ───────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserRead])
def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    suspended: Optional[bool] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[UserRead]:
    q = select(User)
    if search:
        like = f"%{search}%"
        q = q.where((User.full_name.ilike(like)) | (User.email.ilike(like)))
    if role:
        try:
            q = q.where(User.role == UserRole(role))
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Invalid role: {role}")
    if suspended is not None:
        q = q.where(User.is_suspended == suspended)
    q = q.order_by(User.created_at.desc())
    users = db.execute(q).scalars().all()
    return [UserRead.model_validate(u) for u in users]


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> UserRead:
    if db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    try:
        role_enum = UserRole(payload.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")

    roles_list = payload.roles or [payload.role]
    user = User(
        full_name=payload.full_name,
        email=str(payload.email),
        hashed_password=hash_password(payload.password),
        role=role_enum,
        roles=roles_list,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_activity(db, user_id=user.id, actor_id=admin.id, action="admin_create_user",
                 entity_type="user", details=f"Created {user.email}")
    return UserRead.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserRead)
def admin_patch_user(
    user_id: int,
    payload: AdminUserPatch,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> UserRead:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id and payload.is_suspended:
        raise HTTPException(status_code=400, detail="Cannot suspend yourself")

    changes = []
    if payload.full_name is not None:
        user.full_name = payload.full_name
        changes.append("name")
    if payload.email is not None:
        user.email = str(payload.email)
        changes.append("email")
    if payload.roles is not None:
        user.roles = payload.roles
        if payload.roles:
            try:
                user.role = UserRole(payload.roles[0])
            except ValueError:
                pass
        changes.append("roles")
    if payload.is_suspended is not None:
        user.is_suspended = payload.is_suspended
        changes.append("suspended" if payload.is_suspended else "unsuspended")

    db.commit()
    db.refresh(user)
    log_activity(db, user_id=user.id, actor_id=admin.id, action="admin_edit_user",
                 entity_type="user", details=", ".join(changes))
    return UserRead.model_validate(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    log_activity(db, user_id=None, actor_id=admin.id, action="admin_delete_user",
                 entity_type="user", details=f"Deleted {user.email}")
    # Remove FK-linked records that have no ON DELETE cascade
    db.execute(delete(MarketplaceOrder).where(
        (MarketplaceOrder.buyer_id == user.id) | (MarketplaceOrder.seller_id == user.id)
    ))
    db.execute(delete(MarketplaceListing).where(MarketplaceListing.owner_id == user.id))
    db.execute(delete(Farm).where(Farm.owner_id == user.id))
    db.delete(user)
    db.commit()


# ── Marketplace oversight ─────────────────────────────────────────────────────

@router.get("/marketplace/listings")
def admin_list_listings(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    listings = db.execute(select(MarketplaceListing).order_by(MarketplaceListing.created_at.desc())).scalars().all()
    return [
        {
            "id": str(l.id),
            "crop_name": l.crop_name,
            "crop_type": l.crop_type,
            "quantity": l.quantity,
            "unit": l.unit,
            "price_per_unit": l.price_per_unit,
            "status": l.status.value if hasattr(l.status, 'value') else l.status,
            "owner_id": l.owner_id,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in listings
    ]


@router.patch("/marketplace/listings/{listing_id}/archive", status_code=200)
def admin_archive_listing(
    listing_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    from uuid import UUID
    try:
        uid = UUID(listing_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid listing ID")
    listing = db.get(MarketplaceListing, uid)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing.status = MarketplaceListingStatus.ARCHIVED
    db.commit()
    log_activity(db, user_id=listing.owner_id, actor_id=admin.id, action="admin_archive_listing",
                 entity_type="listing", details=str(listing_id))
    return {"ok": True}


@router.get("/marketplace/orders")
def admin_list_orders(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    orders = db.execute(select(MarketplaceOrder).order_by(MarketplaceOrder.created_at.desc())).scalars().all()
    return [
        {
            "id": str(o.id),
            "listing_id": str(o.listing_id),
            "buyer_id": o.buyer_id,
            "seller_id": o.seller_id,
            "requested_quantity": o.requested_quantity,
            "agreed_price": o.agreed_price,
            "proposed_price": o.proposed_price,
            "status": o.status.value if hasattr(o.status, 'value') else o.status,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]


# ── Farm oversight ────────────────────────────────────────────────────────────

@router.get("/farms")
def admin_list_farms(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    farms = db.execute(select(Farm).order_by(Farm.created_at.desc())).scalars().all()
    return [
        {
            "id": str(f.id),
            "name": f.farm_name,
            "district": f.district,
            "size": f.farm_size,
            "size_unit": f.size_unit,
            "owner_id": f.owner_id,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in farms
    ]


# ── Activity log ──────────────────────────────────────────────────────────────

@router.get("/activity", response_model=list[ActivityRead])
def admin_list_activity(
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[ActivityRead]:
    rows = db.execute(
        select(UserActivity).order_by(UserActivity.created_at.desc()).limit(limit)
    ).scalars().all()
    return [ActivityRead.model_validate(r) for r in rows]


# ── Feedback ──────────────────────────────────────────────────────────────────

@router.get("/feedback", response_model=list[FeedbackRead])
def admin_list_feedback(
    feedback_status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[FeedbackRead]:
    q = select(Feedback).order_by(Feedback.created_at.desc())
    if feedback_status:
        q = q.where(Feedback.status == feedback_status)
    rows = db.execute(q).scalars().all()
    return [FeedbackRead.model_validate(r) for r in rows]


@router.post("/feedback/{feedback_id}/reply", response_model=FeedbackRead)
def admin_reply_feedback(
    feedback_id: int,
    payload: FeedbackReply,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> FeedbackRead:
    fb = db.get(Feedback, feedback_id)
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    fb.admin_reply = payload.reply
    fb.status = "resolved"
    fb.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(fb)
    return FeedbackRead.model_validate(fb)


# ── Feedback submission (any authenticated user) ──────────────────────────────

@router.post("/submit-feedback", status_code=status.HTTP_201_CREATED)
def submit_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fb = Feedback(
        user_id=current_user.id,
        type=payload.type,
        subject=payload.subject,
        message=payload.message,
        status="open",
        created_at=datetime.now(timezone.utc),
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return {"id": fb.id, "status": "submitted"}


# ── Reports ───────────────────────────────────────────────────────────────────

@router.get("/reports")
def admin_reports(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    all_non_admin = db.execute(select(User).where(User.role != UserRole.ADMIN)).scalars().all()
    total_users = len(all_non_admin)
    land_owners = sum(
        1 for u in all_non_admin
        if (u.roles and 'Land Owner' in u.roles) or (not u.roles and u.role == UserRole.LAND_OWNER)
    )
    traders = sum(
        1 for u in all_non_admin
        if (u.roles and 'Trader' in u.roles) or (not u.roles and u.role == UserRole.TRADER)
    )
    suspended = db.execute(select(func.count(User.id)).where(User.is_suspended == True)).scalar() or 0
    total_farms = db.execute(select(func.count(Farm.id))).scalar() or 0
    total_listings = db.execute(select(func.count(MarketplaceListing.id))).scalar() or 0
    total_orders = db.execute(select(func.count(MarketplaceOrder.id))).scalar() or 0
    open_feedback = db.execute(select(func.count(Feedback.id)).where(Feedback.status == "open")).scalar() or 0

    return {
        "users": {
            "total": total_users,
            "land_owners": land_owners,
            "traders": traders,
            "suspended": suspended,
        },
        "farms": {"total": total_farms},
        "marketplace": {
            "total_listings": total_listings,
            "total_orders": total_orders,
        },
        "feedback": {"open": open_feedback},
    }
