import csv
import io
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db, require_admin
from app.core.security import hash_password
from app.models.activity import Feedback, UserActivity
from app.models.cultivation import CultivationSession, CultivationTask
from app.models.farm import Farm
from app.models.marketplace import MarketplaceListing, MarketplaceListingStatus, MarketplaceOrder
from app.models.user import User, UserRole
from app.schemas.user import UserRead
from app.services.auth import generate_verification_token
from app.services.email import send_verification_email


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
    type: str = Field(default="feedback", max_length=20)
    subject: str = Field(max_length=255)
    message: str = Field(max_length=5000)


class FeedbackReply(BaseModel):
    reply: str = Field(max_length=5000)


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


class BulkUserRow(BaseModel):
    full_name: str
    email: EmailStr


class BulkUserImport(BaseModel):
    users: list[BulkUserRow]
    default_password: str
    role: str = "Land Owner"


class BulkFarmRow(BaseModel):
    farmer_name: str
    email: EmailStr
    district: str
    farm_name: str
    soil_type: str
    size: float
    size_unit: str = "acres"
    irrigation_type: str = "Rain-fed"


class BulkFarmImport(BaseModel):
    farms: list[BulkFarmRow]
    default_password: str


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

@router.get("/users")
def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    suspended: Optional[bool] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    # Validate role before building query so we fail fast with a clean error
    role_val = None
    if role:
        try:
            role_val = UserRole(role).value
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Invalid role: {role}")

    q = select(User)
    if search:
        like = f"%{search}%"
        q = q.where((User.full_name.ilike(like)) | (User.email.ilike(like)))
    if suspended is not None:
        q = q.where(User.is_suspended == suspended)
    q = q.order_by(User.created_at.desc())
    users = db.execute(q).scalars().all()

    # Filter by role: check both the primary role column AND the roles JSON array
    # so dual-role users are included regardless of which role is their primary.
    if role_val:
        users = [u for u in users if role_val in (u.roles or [u.role.value])]

    rows = []
    for u in users:
        d = UserRead.model_validate(u).model_dump(mode="json")
        d["is_verified"] = bool(u.is_verified)  # force-include
        rows.append(d)
    return JSONResponse(rows)


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
        is_verified=True,
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
        existing = db.execute(
            select(User).where(User.email == str(payload.email), User.id != user.id)
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Email already in use")
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
    # CultivationSession.user_id is a plain String column (no FK cascade), delete manually
    db.execute(delete(CultivationSession).where(CultivationSession.user_id == str(user.id)))
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


@router.delete("/feedback/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    fb = db.get(Feedback, feedback_id)
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    db.delete(fb)
    db.commit()


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


# ── Resend verification ────────────────────────────────────────────────────────

@router.post("/users/{user_id}/resend-verification")
def admin_resend_verification(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="User is already verified")
    token = generate_verification_token(db, user)
    send_verification_email(user.email, user.full_name, token)
    log_activity(db, user_id=user.id, actor_id=admin.id, action="admin_resend_verification",
                 entity_type="user", details=user.email)
    return {"message": f"Verification email re-sent to {user.email}"}


# ── CSV Exports ────────────────────────────────────────────────────────────────

def _csv_response(rows: list[dict], filename: str) -> StreamingResponse:
    if not rows:
        content = ""
    else:
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
        content = buf.getvalue()
    return StreamingResponse(
        iter([content]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/users.csv")
def export_users_csv(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    users = db.execute(select(User).order_by(User.created_at.desc())).scalars().all()
    rows = [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role.value,
            "roles": ",".join(u.roles or []),
            "is_verified": u.is_verified,
            "is_suspended": u.is_suspended,
            "created_at": u.created_at.isoformat() if u.created_at else "",
        }
        for u in users
    ]
    return _csv_response(rows, "smartagri_users.csv")


@router.get("/export/orders.csv")
def export_orders_csv(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    orders = db.execute(select(MarketplaceOrder).order_by(MarketplaceOrder.created_at.desc())).scalars().all()
    rows = [
        {
            "id": str(o.id),
            "listing_name": o.listing_name,
            "buyer": o.buyer_name,
            "seller": o.seller_name,
            "quantity": o.requested_quantity,
            "agreed_price": o.agreed_price or o.proposed_price or "",
            "status": o.status.value,
            "created_at": o.created_at.isoformat() if o.created_at else "",
            "completed_at": o.completed_at.isoformat() if o.completed_at else "",
        }
        for o in orders
    ]
    return _csv_response(rows, "smartagri_orders.csv")


@router.get("/export/activity.csv")
def export_activity_csv(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    activities = db.execute(select(UserActivity).order_by(UserActivity.created_at.desc()).limit(5000)).scalars().all()
    rows = [
        {
            "id": a.id,
            "user_id": a.user_id,
            "actor_id": a.actor_id,
            "action": a.action,
            "entity_type": a.entity_type or "",
            "details": a.details or "",
            "created_at": a.created_at.isoformat() if a.created_at else "",
        }
        for a in activities
    ]
    return _csv_response(rows, "smartagri_activity.csv")


# ── Bulk user import ──────────────────────────────────────────────────────────

@router.post("/users/bulk", status_code=status.HTTP_201_CREATED)
def admin_bulk_create_users(
    payload: BulkUserImport,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    try:
        role_enum = UserRole(payload.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")

    created, skipped, errors = 0, 0, []
    for row in payload.users:
        email_str = str(row.email)
        if db.execute(select(User).where(User.email == email_str)).scalar_one_or_none():
            skipped += 1
            continue
        try:
            user = User(
                full_name=row.full_name,
                email=email_str,
                hashed_password=hash_password(payload.default_password),
                role=role_enum,
                roles=[payload.role],
                is_verified=True,
            )
            db.add(user)
            db.flush()
            created += 1
        except Exception as e:
            errors.append({"email": email_str, "error": str(e)})

    db.commit()
    log_activity(db, user_id=None, actor_id=admin.id, action="admin_bulk_import_users",
                 entity_type="user", details=f"created={created} skipped={skipped}")
    return {"created": created, "skipped": skipped, "errors": errors}


# ── Bulk farm + user import ───────────────────────────────────────────────────

@router.post("/farms/bulk", status_code=status.HTTP_201_CREATED)
def admin_bulk_import_farms(
    payload: BulkFarmImport,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    created_users, created_farms, skipped, errors = 0, 0, 0, []
    for row in payload.farms:
        email_str = str(row.email)
        try:
            user = db.execute(select(User).where(User.email == email_str)).scalar_one_or_none()
            if not user:
                user = User(
                    full_name=row.farmer_name,
                    email=email_str,
                    hashed_password=hash_password(payload.default_password),
                    role=UserRole.LAND_OWNER,
                    roles=["Land Owner"],
                    is_verified=True,
                )
                db.add(user)
                db.flush()
                created_users += 1
            else:
                skipped += 1

            farm = Farm(
                farm_name=row.farm_name,
                district=row.district,
                soil_type=row.soil_type,
                farm_size=row.size,
                size_unit=row.size_unit,
                irrigation_type=row.irrigation_type,
                owner_id=user.id,
                location=row.district,
                season="Maha",
            )
            db.add(farm)
            db.flush()
            created_farms += 1
        except Exception as e:
            errors.append({"email": email_str, "error": str(e)})

    db.commit()
    log_activity(db, user_id=None, actor_id=admin.id, action="admin_bulk_import_farms",
                 entity_type="farm", details=f"users={created_users} farms={created_farms} skipped={skipped}")
    return {"created_users": created_users, "created_farms": created_farms, "skipped": skipped, "errors": errors}


# ── Farm data export (for research) ──────────────────────────────────────────

@router.get("/export/farms.csv")
def export_farms_csv(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    farms = db.execute(select(Farm).order_by(Farm.created_at.desc())).scalars().all()
    rows = []
    for f in farms:
        owner = db.get(User, f.owner_id)
        sessions = db.execute(
            select(CultivationSession).where(CultivationSession.farm_id == f.id)
        ).unique().scalars().all()
        if sessions:
            for s in sessions:
                rows.append({
                    "farm_id": str(f.id),
                    "farm_name": f.farm_name,
                    "district": f.district or "",
                    "soil_type": f.soil_type or "",
                    "irrigation_type": f.irrigation_type or "",
                    "size": f.farm_size,
                    "size_unit": f.size_unit,
                    "season": f.season or "",
                    "owner_name": owner.full_name if owner else "",
                    "owner_email": owner.email if owner else "",
                    "crop": s.crop,
                    "cultivation_status": s.status,
                    "planting_date": s.planting_date or "",
                })
        else:
            rows.append({
                "farm_id": str(f.id),
                "farm_name": f.farm_name,
                "district": f.district or "",
                "soil_type": f.soil_type or "",
                "irrigation_type": f.irrigation_type or "",
                "size": f.farm_size,
                "size_unit": f.size_unit,
                "season": f.season or "",
                "owner_name": owner.full_name if owner else "",
                "owner_email": owner.email if owner else "",
                "crop": "",
                "cultivation_status": "",
                "planting_date": "",
            })
    return _csv_response(rows, "smartagri_farms.csv")


# ── Harvest forecast ──────────────────────────────────────────────────────────

@router.get("/harvest-forecast")
def admin_harvest_forecast(
    district: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = select(CultivationSession).where(CultivationSession.status == "active")
    if district:
        q = q.where(CultivationSession.district == district)
    sessions = db.execute(q).unique().scalars().all()

    results = []
    for session in sessions:
        tasks = db.execute(
            select(CultivationTask).where(CultivationTask.session_id == session.id)
        ).scalars().all()
        if not tasks:
            continue

        max_day = max((t.day for t in tasks), default=0)
        try:
            plant_dt = datetime.strptime(session.planting_date, "%Y-%m-%d").date()
            harvest_dt = plant_dt + timedelta(days=max_day)
            harvest_str = harvest_dt.isoformat()
        except (ValueError, TypeError):
            harvest_str = None

        farm = db.get(Farm, session.farm_id) if session.farm_id else None
        try:
            user = db.get(User, int(session.user_id)) if session.user_id else None
        except (ValueError, TypeError):
            user = None

        results.append({
            "session_id": str(session.id),
            "farm_name": farm.farm_name if farm else "—",
            "district": session.district or (farm.district if farm else "—") or "—",
            "crop": session.crop,
            "farmer_name": user.full_name if user else "—",
            "planting_date": session.planting_date or "",
            "estimated_harvest_date": harvest_str,
            "farm_size": farm.farm_size if farm else None,
            "size_unit": farm.size_unit if farm else "acres",
        })

    results.sort(key=lambda x: x["estimated_harvest_date"] or "9999-12-31")
    return results


@router.get("/export/harvest.csv")
def export_harvest_csv(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    data = admin_harvest_forecast(db=db, _=_)
    rows = [
        {
            "farm_name": r["farm_name"],
            "district": r["district"],
            "crop": r["crop"],
            "farmer_name": r["farmer_name"],
            "planting_date": r["planting_date"],
            "estimated_harvest_date": r["estimated_harvest_date"] or "",
            "farm_size": r["farm_size"] or "",
            "size_unit": r["size_unit"],
        }
        for r in data
    ]
    return _csv_response(rows, "smartagri_harvest_forecast.csv")
