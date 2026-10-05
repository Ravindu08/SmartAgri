from datetime import datetime
from typing import Optional

import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    roles: Optional[list[str]] = None
    is_verified: bool = Field(default=False)
    is_suspended: bool = False
    created_at: datetime
    profile_image: Optional[str] = None
    phone_number: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    profile_image: Optional[str] = None
    phone_number: Optional[str] = Field(default=None, max_length=20)

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value):
        """Digits with an optional leading + and the usual separators; 7 to 15 digits."""
        if value is None or not value.strip():
            return None
        value = value.strip()
        digits = re.sub(r"\D", "", value)
        if not re.fullmatch(r"\+?[0-9][0-9 ()\-]*", value) or not 7 <= len(digits) <= 15:
            raise ValueError("Enter a valid phone number, for example +94 77 123 4567")
        return value


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=255)


