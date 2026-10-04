from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.security import ALGORITHM, SECRET_KEY
from app.db.database import SessionLocal
from app.models.user import User, UserRole


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # A refresh token is signed with the same key, so without this check it
        # would pass as a 7-day access token.
        if payload.get("type") != "access":
            raise credentials_exception
        # sub is the user id, not the e-mail: an e-mail can change (and be
        # re-registered by someone else) while a token is still valid.
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError) as exc:
        raise credentials_exception from exc

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exception
    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended",
        )
    return user


def get_current_land_owner(
    current_user: User = Depends(get_current_user),
) -> User:
    user_roles = current_user.roles or [current_user.role.value]
    if UserRole.LAND_OWNER.value not in user_roles and current_user.role != UserRole.LAND_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Land Owner access required",
        )
    return current_user


def get_current_trader(
    current_user: User = Depends(get_current_user),
) -> User:
    user_roles = current_user.roles or [current_user.role.value]
    if UserRole.TRADER.value not in user_roles and current_user.role != UserRole.TRADER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trader access required",
        )
    return current_user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
