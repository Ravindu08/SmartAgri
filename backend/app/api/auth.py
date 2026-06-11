from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.core.security import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import AuthResponse, UserLogin, UserRegister
from app.schemas.user import PasswordChange, UserRead, UserUpdate
from app.services.auth import (
    authenticate_user,
    create_user,
    get_redirect_path,
    get_user_by_email,
)


router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister, db: Session = Depends(get_db)) -> AuthResponse:
    existing_user = get_user_by_email(db, payload.email)
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    if payload.role not in {UserRole.LAND_OWNER, UserRole.TRADER}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Trader and Land Owner users can register",
        )

    user = create_user(db, payload)

    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        redirect_to=get_redirect_path(user.role),
        user=UserRead.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)) -> AuthResponse:
    user = authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        redirect_to=get_redirect_path(user.role),
        user=UserRead.model_validate(user),
    )


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
        current_user.profile_image = payload.profile_image
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
    db.delete(current_user)
    db.commit()