import uuid
import datetime
import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


INDIAN_MOBILE_REGEX = re.compile(r"^[6-9]\d{9}$")


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of farmer or officer")
    phone: str = Field(..., description="10-digit Indian mobile number")
    password: str = Field(..., min_length=8, description="Password with minimum 8 characters")
    email: Optional[str] = Field(None, max_length=255, description="Optional email address")
    preferred_language: str = Field("hi", description="Preferred language: 'hi' (Hindi) or 'en' (English)")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip().replace(" ", "").replace("-", "")
        if cleaned.startswith("+91"):
            cleaned = cleaned[3:]
        elif cleaned.startswith("0") and len(cleaned) == 11:
            cleaned = cleaned[1:]

        if not INDIAN_MOBILE_REGEX.match(cleaned):
            raise ValueError("Phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.")
        return cleaned

    @field_validator("preferred_language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        lang = v.lower().strip()
        if lang not in ("hi", "en"):
            raise ValueError("Preferred language must be either 'hi' (Hindi) or 'en' (English).")
        return lang


class LoginRequest(BaseModel):
    phone: str = Field(..., description="Registered 10-digit mobile number")
    password: str = Field(..., description="Password")

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, v: str) -> str:
        cleaned = v.strip().replace(" ", "").replace("-", "")
        if cleaned.startswith("+91"):
            cleaned = cleaned[3:]
        return cleaned


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    email: Optional[str] = None
    preferred_language: str
    role: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
