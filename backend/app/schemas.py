"""Request and response contracts for the BrightNest API."""
from __future__ import annotations

from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models import BookingStatus

SERVICE_TYPES = {
    "Regular home cleaning",
    "Deep cleaning",
    "End of tenancy",
    "Move-in / move-out",
    "Post-renovation",
    "Airbnb / short-term rental",
    "Office & commercial",
    "Window cleaning",
    "Oven cleaning",
    "Carpet cleaning",
    "Rug cleaning",
    "Sofa / upholstery",
    "Rubbish / waste removal",
    "Small one-off jobs",
    "Tailored / other request",
}


class BookingCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    customer_email: EmailStr
    customer_phone: str | None = Field(default=None, max_length=32)
    postcode: str = Field(min_length=3, max_length=16)
    service_type: str = Field(min_length=3, max_length=80)
    frequency: Literal["One-off visit", "Weekly", "Fortnightly", "Monthly"]
    preferred_date: date
    preferred_time: time
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("customer_name", "postcode", "service_type", "customer_phone", "notes", mode="before")
    @classmethod
    def normalize_text(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value

    @field_validator("customer_phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is None:
            return value
        digits = "".join(character for character in value if character.isdigit())
        if not 10 <= len(digits) <= 16:
            raise ValueError("Enter a valid phone number")
        return value

    @field_validator("service_type")
    @classmethod
    def validate_service(cls, value: str) -> str:
        if value not in SERVICE_TYPES:
            raise ValueError("Unsupported service type")
        return value


class BookingUpdate(BaseModel):
    status: BookingStatus | None = None
    admin_notes: str | None = Field(default=None, max_length=4000)

    @field_validator("admin_notes", mode="before")
    @classmethod
    def normalize_notes(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value


class BookingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: str | None
    postcode: str
    service_type: str
    frequency: str
    preferred_date: date
    preferred_time: time
    notes: str | None
    status: BookingStatus
    admin_notes: str | None
    email_status: str
    created_at: datetime
    updated_at: datetime


class BookingListResponse(BaseModel):
    items: list[BookingRead]
    page: int
    page_size: int
    total: int


class BookingAccepted(BaseModel):
    booking_id: str
    message: str


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=20, max_length=4096)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int


class AdminProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    role: str
    last_login_at: datetime | None


class DashboardResponse(BaseModel):
    total: int
    new: int
    contacted: int
    confirmed: int
    completed: int
    cancelled: int
