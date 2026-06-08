import os

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import UserRegister


ALLOWED_REGISTRATION_ROLES = {UserRole.TRADER, UserRole.LAND_OWNER}

ROLE_REDIRECT_PATHS = {
    UserRole.ADMIN: "/dashboard/admin",
    UserRole.LAND_OWNER: "/dashboard/land-owner",
    UserRole.TRADER: "/dashboard/trader",
    UserRole.VISITOR: "/marketplace",
}


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()


def create_user(db: Session, user_in: UserRegister) -> User:
    if user_in.role not in ALLOWED_REGISTRATION_ROLES:
        raise ValueError("Only Trader and Land Owner accounts can register")

    user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_redirect_path(role: UserRole) -> str:
    return ROLE_REDIRECT_PATHS[role]


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
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user