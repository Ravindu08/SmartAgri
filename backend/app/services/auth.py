import os

from sqlalchemy import select
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


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()


def create_user(db: Session, user_in: UserRegister) -> User:
    valid_roles = [r for r in user_in.roles if r in ALLOWED_REGISTRATION_ROLES]
    if not valid_roles:
        raise ValueError("Only Trader and Land Owner accounts can register")

    primary_role = valid_roles[0]
    user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role=primary_role,
        roles=[r.value for r in valid_roles],
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
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
