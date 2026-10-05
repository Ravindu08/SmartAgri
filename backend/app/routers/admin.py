import csv
import io
import logging
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db, require_admin
from app.core.security import hash_password
from app.models.activity import Feedback, UserActivity
from app.models.cultivation import CultivationSession, CultivationTask
from app.models.farm import Farm
from app.schemas.farm import SriLankaDistrict
from app.models.marketplace import MarketplaceListing, MarketplaceListingStatus, MarketplaceOrder
from app.models.user import User, UserRole
from app.schemas.user import UserRead
from app.services.auth import delete_user_and_data, generate_verification_token, get_user_by_email, normalize_email
from app.services.email import send_feedback_reply_email, send_verification_email
from app.services.notification_service import create_notification


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Upper bound on rows a list endpoint returns in one call; page with ?offset=.
MAX_PAGE = 500


# ── Pydantic schemas (admin-local) ────────────────────────────────────────────

class AdminUserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=255)
    role: str = "Land Owner"
    roles: Optional[list[str]] = None


class AdminUserPatch(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    roles: Optional[list[str]] = None
    is_suspended: Optional[bool] = None


class FeedbackCreate(BaseModel):
    # Spaces alone are not a subject or a message.
    model_config = ConfigDict(str_strip_whitespace=True)
    type: Literal["feedback", "complaint", "bug"] = "feedback"
    subject: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1, max_length=5000)


class FeedbackReply(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    reply: str = Field(min_length=1, max_length=5000)


class ActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: Optional[int] = None
    actor_id: Optional[int] = None
    action: str
    entity_type: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None
    actor_name: Optional[str] = None


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
    # Who sent it; empty when the account has since been deleted.
    user_name: Optional[str] = None
    user_email: Optional[str] = None


class BulkUserRow(BaseModel):
    full_name: str
    email: EmailStr


class BulkUserImport(BaseModel):
    users: list[BulkUserRow]
    default_password: str = Field(min_length=8, max_length=255)
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
    default_password: str = Field(min_length=8, max_length=255)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _validated_roles(roles: list[str]) -> list[str]:
    """Role names as stored, without duplicates; 400 on anything that is not a role."""
    valid = {r.value for r in UserRole}
    bad = [r for r in roles if r not in valid]
    if bad:
        raise HTTPException(status_code=400, detail=f"Invalid role: {bad[0]}")
    unique = list(dict.fromkeys(roles))
    # Admin access is decided by the primary role alone, so an account listed
    # as "Admin" plus something else would look like an admin without being one.
    if UserRole.ADMIN.value in unique and len(unique) > 1:
        raise HTTPException(status_code=400, detail="Admin cannot be combined with another role")
    return unique


def _names_by_id(db: Session, ids) -> dict[int, str]:
    """Full names for a set of user ids, in one query."""
    ids = {i for i in ids if i is not None}
    if not ids:
        return {}
    return dict(db.execute(select(User.id, User.full_name).where(User.id.in_(ids))).all())


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
    limit: int = Query(MAX_PAGE, ge=1, le=MAX_PAGE),
    offset: int = Query(0, ge=0),
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
    # Paged after the role filter, which runs in Python (roles is a JSON column).
    users = users[offset:offset + limit]

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
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    try:
        role_enum = UserRole(payload.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")

    roles_list = _validated_roles(payload.roles) if payload.roles else [payload.role]
    # `role` is what the admin check reads, so it must agree with the list.
    if role_enum.value not in roles_list or UserRole.ADMIN.value in roles_list:
        role_enum = UserRole(roles_list[0])
    user = User(
        full_name=payload.full_name,
        email=normalize_email(payload.email),
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
        existing = get_user_by_email(db, payload.email)
        if existing and existing.id != user.id:
            raise HTTPException(status_code=409, detail="Email already in use")
        user.email = normalize_email(payload.email)
        changes.append("email")
    if payload.roles is not None:
        roles = _validated_roles(payload.roles)
        if not roles:
            raise HTTPException(status_code=400, detail="A user needs at least one role")
        # Dropping your own Admin role would lock the panel with nobody left to undo it.
        if user.id == admin.id and UserRole.ADMIN.value not in roles:
            raise HTTPException(status_code=400, detail="Cannot remove your own Admin role")
        user.roles = roles
        # Keep the primary role when it is still held; it decides admin access.
        if user.role.value not in roles:
            user.role = UserRole(roles[0])
        changes.append("roles")
    if payload.is_suspended is not None:
        user.is_suspended = payload.is_suspended
        changes.append("suspended" if payload.is_suspended else "unsuspended")

    db.commit()
    db.refresh(user)
    log_activity(db, user_id=user.id, actor_id=admin.id, action="admin_edit_user",
                 entity_type="user", details=f"{user.email}: {', '.join(changes) or 'no changes'}")
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
    delete_user_and_data(db, user)
    db.commit()


# ── Marketplace oversight ─────────────────────────────────────────────────────

@router.get("/marketplace/listings")
def admin_list_listings(
    limit: int = Query(MAX_PAGE, ge=1, le=MAX_PAGE),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    listings = db.execute(
        select(MarketplaceListing).order_by(MarketplaceListing.created_at.desc()).limit(limit).offset(offset)
    ).scalars().all()
    return [
        {
            "id": str(l.id),
            "crop_name": l.crop_name,
            "crop_type": l.crop_type,
            "quantity": l.quantity,
            "unit": l.unit,
            "price_per_unit": l.price_per_unit,
            "status": l.status.value if hasattr(l.status, 'value') else l.status,
            "listing_type": l.listing_type,
            "owner_id": l.owner_id,
            "owner_name": l.owner_name,
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
def admin_list_orders(
    limit: int = Query(MAX_PAGE, ge=1, le=MAX_PAGE),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    orders = db.execute(
        select(MarketplaceOrder).order_by(MarketplaceOrder.created_at.desc()).limit(limit).offset(offset)
    ).scalars().all()
    return [
        {
            "id": str(o.id),
            "listing_id": str(o.listing_id),
            "listing_name": o.listing_name,
            "buyer_id": o.buyer_id,
            "buyer_name": o.buyer_name,
            "seller_id": o.seller_id,
            "seller_name": o.seller_name,
            "requested_quantity": o.requested_quantity,
            "unit": o.unit,
            "payment_status": o.payment_status.value,
            "agreed_price": o.agreed_price,
            "proposed_price": o.proposed_price,
            "status": o.status.value if hasattr(o.status, 'value') else o.status,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]


# ── Farm oversight ────────────────────────────────────────────────────────────

@router.get("/farms")
def admin_list_farms(
    limit: int = Query(MAX_PAGE, ge=1, le=MAX_PAGE),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    farms = db.execute(
        select(Farm).order_by(Farm.created_at.desc()).limit(limit).offset(offset)
    ).scalars().all()
    owners = _names_by_id(db, {f.owner_id for f in farms})
    return [
        {
            "id": str(f.id),
            "name": f.farm_name,
            "district": f.district,
            "size": f.farm_size,
            "size_unit": f.size_unit,
            "owner_id": f.owner_id,
            "owner_name": owners.get(f.owner_id),
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in farms
    ]


# ── Activity log ──────────────────────────────────────────────────────────────

@router.get("/activity", response_model=list[ActivityRead])
def admin_list_activity(
    limit: int = Query(100, ge=1, le=MAX_PAGE),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[ActivityRead]:
    rows = db.execute(
        select(UserActivity).order_by(UserActivity.created_at.desc()).limit(limit)
    ).scalars().all()
    names = _names_by_id(db, {i for r in rows for i in (r.user_id, r.actor_id)})
    result = []
    for r in rows:
        item = ActivityRead.model_validate(r)
        item.user_name, item.actor_name = names.get(r.user_id), names.get(r.actor_id)
        result.append(item)
    return result


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
    senders = {
        u.id: u for u in db.execute(
            select(User).where(User.id.in_({r.user_id for r in rows if r.user_id}))
        ).scalars()
    } if rows else {}
    result = []
    for r in rows:
        item = FeedbackRead.model_validate(r)
        sender = senders.get(r.user_id)
        if sender is not None:
            item.user_name, item.user_email = sender.full_name, sender.email
        result.append(item)
    return result


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

    user = db.get(User, fb.user_id) if fb.user_id else None
    if user:
        create_notification(
            db,
            user_id=user.id,
            type="feedback_reply",
            title=f"Reply to your feedback — {fb.subject}",
            body=payload.reply,
        )

    db.commit()
    db.refresh(fb)

    if user and user.email:
        try:
            send_feedback_reply_email(user.email, user.full_name, fb.subject, payload.reply)
        except Exception:
            # The reply is already committed; a mail failure must not fail the
            # request, but swallowing it silently hides a broken mail server.
            logger.warning("feedback reply e-mail failed for feedback id=%s", fb.id, exc_info=True)

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
    try:
        send_verification_email(user.email, user.full_name, token)
    except Exception:
        logger.warning("verification e-mail failed for user id=%s", user.id, exc_info=True)
        raise HTTPException(status_code=502, detail="The verification e-mail could not be sent. Check the mail settings.")
    log_activity(db, user_id=user.id, actor_id=admin.id, action="admin_resend_verification",
                 entity_type="user", details=user.email)
    return {"message": f"Verification email re-sent to {user.email}"}


# ── CSV Exports ────────────────────────────────────────────────────────────────

def _csv_safe(value):
    """Stop a spreadsheet running user-entered text as a formula.

    Excel and Sheets evaluate a cell that starts with = + - or @, so a farm
    named "=HYPERLINK(...)" would execute when an admin opens the export. A
    leading quote makes the cell plain text.
    """
    if isinstance(value, str) and value[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + value
    return value


def _csv_response(rows: list[dict], filename: str) -> StreamingResponse:
    if not rows:
        content = ""
    else:
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows({k: _csv_safe(v) for k, v in row.items()} for row in rows)
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
        email_str = normalize_email(row.email)
        if get_user_by_email(db, email_str):
            skipped += 1
            continue
        try:
            # Savepoint per row: a bad row rolls back alone instead of leaving
            # the session unusable for every row after it.
            with db.begin_nested():
                db.add(User(
                    full_name=row.full_name,
                    email=email_str,
                    hashed_password=hash_password(payload.default_password),
                    role=role_enum,
                    roles=[payload.role],
                    is_verified=True,
                ))
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
    districts = {d.value.lower(): d.value for d in SriLankaDistrict}
    created_users, created_farms, skipped, errors = 0, 0, 0, []
    for row in payload.farms:
        email_str = normalize_email(row.email)
        # Checked per row, so one bad line is reported and the rest still import.
        district = districts.get(row.district.strip().lower())
        problem = (
            "Farm name is required" if not row.farm_name.strip()
            else "Farmer name is required" if not row.farmer_name.strip()
            else f"Unknown district: {row.district}" if district is None
            else "Farm size must be greater than 0" if not row.size > 0
            else None
        )
        if problem:
            errors.append({"email": email_str, "error": problem})
            continue
        try:
            # Savepoint per row: a bad row rolls back alone (its new user too)
            # instead of leaving the session unusable for every row after it.
            with db.begin_nested():
                user = get_user_by_email(db, email_str)
                is_new_user = user is None
                if is_new_user:
                    user = User(
                        full_name=row.farmer_name.strip(),
                        email=email_str,
                        hashed_password=hash_password(payload.default_password),
                        role=UserRole.LAND_OWNER,
                        roles=["Land Owner"],
                        is_verified=True,
                    )
                    db.add(user)
                    db.flush()

                db.add(Farm(
                    farm_name=row.farm_name.strip(),
                    district=district,
                    soil_type=row.soil_type.strip(),
                    farm_size=row.size,
                    size_unit=row.size_unit,
                    irrigation_type=row.irrigation_type,
                    owner_id=user.id,
                    location=district,
                    season="Maha",
                ))
                db.flush()
            # Counted only once the row's savepoint has been released.
            if is_new_user:
                created_users += 1
            else:
                skipped += 1
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
        # A session whose owner no longer exists is left-over data, not a harvest to plan for.
        if user is None:
            continue

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
