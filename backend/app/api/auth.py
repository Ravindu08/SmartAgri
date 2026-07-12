from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.auth import AuthResponse, UserLogin, UserRegister
from app.schemas.user import PasswordChange, UserRead, UserUpdate
from app.services.auth import (
    authenticate_user,
    create_user,
    generate_reset_token,
    generate_verification_token,
    get_redirect_path,
    get_user_by_email,
)
from app.services.email import send_password_reset_email, send_verification_email
from app.core.limiter import limiter
from app.utils.image_storage import ImageTooLargeError, InvalidImageError, store_image

router = APIRouter()


# ── Registration ─────────────────────────────────────────────────────────────

class RegisterResponse(BaseModel):
    message: str
    email: str


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register_user(request: Request, payload: UserRegister, db: Session = Depends(get_db)) -> RegisterResponse:
    existing_user = get_user_by_email(db, payload.email)
    if existing_user is not None:
        # Allow adding a new role to an existing verified account
        if not verify_password(payload.password, existing_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            )
        if not existing_user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered but not yet verified. Please check your inbox.",
            )
        current_roles = set(existing_user.roles or [existing_user.role.value])
        new_roles = [r for r in payload.roles if r not in current_roles and r in {UserRole.LAND_OWNER, UserRole.TRADER}]
        if not new_roles:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered with these roles",
            )
        existing_user.roles = sorted(current_roles | {r.value for r in new_roles})
        db.commit()
        db.refresh(existing_user)
        return RegisterResponse(
            message="Role added successfully. Please log in again.",
            email=existing_user.email,
        )

    valid_roles = [r for r in payload.roles if r in {UserRole.LAND_OWNER, UserRole.TRADER}]
    if not valid_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Trader and Land Owner users can register",
        )

    user = create_user(db, payload)
    if user.email_verification_token:
        send_verification_email(user.email, user.full_name, user.email_verification_token)
        return RegisterResponse(
            message="Account created. Please check your email to verify your account.",
            email=user.email,
        )
    # EMAIL_ENABLED=false — user is auto-verified, can log in immediately
    return RegisterResponse(
        message="Account created. You can now log in.",
        email=user.email,
    )


# ── Email verification ────────────────────────────────────────────────────────

@router.post("/resend-verification")
@limiter.limit("5/minute")
def resend_verification(request: Request, email: EmailStr, db: Session = Depends(get_db)):
    user = get_user_by_email(db, email)
    if user is None or user.is_verified:
        return {"message": "If that email is registered and unverified, a new code has been sent."}
    code = generate_verification_token(db, user)
    send_verification_email(user.email, user.full_name, code)
    return {"message": "If that email is registered and unverified, a new code has been sent."}


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str


@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if (
        user is None
        or user.is_verified
        or user.email_verification_token != payload.code.strip()
        or user.email_code_expires is None
        or datetime.now(timezone.utc) > user.email_code_expires
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )
    user.is_verified = True
    user.email_verification_token = None
    user.email_code_expires = None
    db.commit()
    return {"message": "Email verified successfully. You can now log in."}


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
def login_user(request: Request, payload: UserLogin, db: Session = Depends(get_db)) -> AuthResponse:
    user = authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_VERIFIED",
        )

    if user.is_suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support.",
        )

    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(data={"sub": user.email})
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        redirect_to=get_redirect_path(user),
        user=UserRead.model_validate(user),
    )


# ── Token refresh ────────────────────────────────────────────────────────────

class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


@router.post("/refresh", response_model=RefreshResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)) -> RefreshResponse:
    from jose import JWTError
    try:
        data = decode_token(payload.refresh_token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    if data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    email = data.get("sub")
    user = get_user_by_email(db, email) if email else None
    if user is None or user.is_suspended:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or suspended")

    new_access = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    new_refresh = create_refresh_token(data={"sub": user.email})
    return RefreshResponse(access_token=new_access, refresh_token=new_refresh)


# ── Forgot / reset password ───────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email)
    if user is not None and user.is_verified:
        token = generate_reset_token(db, user)
        send_password_reset_email(user.email, user.full_name, token)
    # Always return the same message to prevent email enumeration
    return {"message": "If that email belongs to a verified account, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters.",
        )

    user = db.execute(
        select(User).where(User.reset_token == payload.token)
    ).scalar_one_or_none()

    if user is None or user.reset_token_expires is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset link.",
        )

    if datetime.now(timezone.utc) > user.reset_token_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link has expired. Please request a new one.",
        )

    user.hashed_password = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return {"message": "Password reset successfully. You can now log in."}


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.put("/me", response_model=UserRead)
def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserRead:
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.email is not None and payload.email != current_user.email:
        if get_user_by_email(db, str(payload.email)) is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already in use")
        current_user.email = str(payload.email)
    if "profile_image" in payload.model_fields_set:
        try:
            current_user.profile_image = store_image(payload.profile_image)
        except ImageTooLargeError as exc:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(exc)) from exc
        except InvalidImageError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if "phone_number" in payload.model_fields_set:
        current_user.phone_number = payload.phone_number
    db.commit()
    db.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.put("/me/password", response_model=UserRead)
def change_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserRead:
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    db.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    from sqlalchemy import delete as sql_delete
    from app.models.marketplace import MarketplaceListing, MarketplaceOrder
    from app.models.farm import Farm
    from app.models.cultivation import CultivationSession

    # delete orders first (Rating.order_id has CASCADE so ratings go automatically)
    db.execute(sql_delete(MarketplaceOrder).where(
        (MarketplaceOrder.buyer_id == current_user.id) | (MarketplaceOrder.seller_id == current_user.id)
    ))
    # delete listings (no FK child constraints beyond orders already cleared)
    db.execute(sql_delete(MarketplaceListing).where(MarketplaceListing.owner_id == current_user.id))
    # delete farms (Crop.farm_id has CASCADE so crops go automatically)
    db.execute(sql_delete(Farm).where(Farm.owner_id == current_user.id))
    # delete cultivation sessions (user_id is a plain String column, no FK cascade)
    db.execute(sql_delete(CultivationSession).where(CultivationSession.user_id == str(current_user.id)))
    # delete user — Notification cascades, Feedback/UserActivity set NULL
    db.delete(current_user)
    db.commit()
