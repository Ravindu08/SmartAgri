import os
import secrets

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import UserRegister


ALLOWED_REGISTRATION_ROLES = {UserRole.TRADER, UserRole.LAND_OWNER}

ROLE_REDIRECT_PATHS = {
    UserRole.ADMIN: "/admin/dashboard",
    UserRole.LAND_OWNER: "/landowner/dashboard",
    UserRole.TRADER: "/trader/dashboard",
    UserRole.VISITOR: "/marketplace",
}


def normalize_email(email: str) -> str:
    """E-mails are stored and compared in lower case, so "Name@x.com" and
    "name@x.com" are one account rather than a failed login or a duplicate."""
    return str(email).strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.execute(
        select(User).where(func.lower(User.email) == normalize_email(email))
    ).scalars().first()


def delete_user_and_data(db: Session, user: User) -> None:
    """Delete a user with everything they own. The caller commits.

    The users foreign keys on orders, listings and farms have no ON DELETE
    rule, so those rows are removed here first; crops, payments, ratings and
    negotiation messages then cascade in the database.
    """
    from app.models.cultivation import CultivationSession
    from app.models.farm import Farm
    from app.models.marketplace import (
        MarketplaceListing,
        MarketplaceOrder,
        MarketplaceOrderStatus,
        OrderPaymentStatus,
    )
    from app.services.marketplace_service import restore_order_stock

    # Stock this user was still holding as a buyer goes back to the sellers.
    held = db.execute(
        select(MarketplaceOrder).where(
            MarketplaceOrder.buyer_id == user.id,
            MarketplaceOrder.status.in_([MarketplaceOrderStatus.PENDING, MarketplaceOrderStatus.CONFIRMED]),
            MarketplaceOrder.payment_status == OrderPaymentStatus.UNPAID,
        )
    ).scalars().all()
    for order in held:
        restore_order_stock(db, order)
    db.flush()

    db.execute(delete(MarketplaceOrder).where(
        (MarketplaceOrder.buyer_id == user.id) | (MarketplaceOrder.seller_id == user.id)
    ))
    db.execute(delete(MarketplaceListing).where(MarketplaceListing.owner_id == user.id))
    db.execute(delete(Farm).where(Farm.owner_id == user.id))
    # CultivationSession.user_id is a plain string column, so nothing cascades to it.
    db.execute(delete(CultivationSession).where(CultivationSession.user_id == str(user.id)))
    db.delete(user)


def _otp_code() -> str:
    return f"{secrets.randbelow(1000000):06d}"


def create_user(db: Session, user_in: UserRegister) -> User:
    import os
    from datetime import datetime, timezone, timedelta
    valid_roles = [r for r in user_in.roles if r in ALLOWED_REGISTRATION_ROLES]
    if not valid_roles:
        raise ValueError("Only Trader and Land Owner accounts can register")

    primary_role = valid_roles[0]
    email_enabled = os.getenv("EMAIL_ENABLED", "true").lower() == "true"
    code = _otp_code() if email_enabled else None
    expires = datetime.now(timezone.utc) + timedelta(minutes=10) if email_enabled else None
    user = User(
        full_name=user_in.full_name,
        email=normalize_email(user_in.email),
        hashed_password=hash_password(user_in.password),
        role=primary_role,
        roles=[r.value for r in valid_roles],
        is_verified=not email_enabled,
        email_verification_token=code,
        email_code_expires=expires,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def generate_verification_token(db: Session, user: User) -> str:
    from datetime import datetime, timezone, timedelta
    code = _otp_code()
    user.email_verification_token = code
    user.email_code_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()
    return code


def generate_reset_token(db: Session, user: User) -> str:
    from datetime import datetime, timezone, timedelta
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()
    return token


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_redirect_path(user: User) -> str:
    if user.role == UserRole.ADMIN:
        return "/admin/dashboard"
    user_roles = user.roles or [user.role.value]
    if len(user_roles) > 1:
        return "/role-select"
    return ROLE_REDIRECT_PATHS.get(user.role, "/marketplace")


def ensure_admin_user(db: Session) -> User:
    admin_email = os.getenv("ADMIN_EMAIL", "admin@smartagri.lk")
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin@12345")
    admin_full_name = os.getenv("ADMIN_FULL_NAME", "System Administrator")

    user = get_user_by_email(db, admin_email)
    if user is not None:
        return user

    user = User(
        full_name=admin_full_name,
        email=admin_email,
        hashed_password=hash_password(admin_password),
        role=UserRole.ADMIN,
        roles=[UserRole.ADMIN.value],
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
