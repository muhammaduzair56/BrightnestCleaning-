"""Request and response contracts for the BrightNest API."""
from __future__ import annotations

from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.config import get_settings
from app.coverage import is_postcode_covered, normalize_postcode
from app.models import BookingStatus, CustomerChangeRequestStatus, CustomerChangeRequestType, PaymentStatus

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
    privacy_consent: Literal[True]
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("customer_name", "postcode", "service_type", "customer_phone", "notes", mode="before")
    @classmethod
    def normalize_text(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value

    @field_validator("postcode")
    @classmethod
    def validate_coverage(cls, value: str) -> str:
        normalized = normalize_postcode(value)
        if not is_postcode_covered(normalized, get_settings().coverage_postcode_prefixes):
            raise ValueError("This postcode is outside BrightNest's current coverage area")
        return normalized

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
    currency: str | None = Field(default=None, min_length=3, max_length=3, pattern="^[A-Z]{3}$")
    subtotal_pence: int | None = Field(default=None, ge=0)
    tax_rate_basis_points: int | None = Field(default=None, ge=0, le=10000)
    tax_pence: int | None = Field(default=None, ge=0)
    total_pence: int | None = Field(default=None, ge=0)
    payment_status: PaymentStatus | None = None
    payment_provider: str | None = Field(default=None, max_length=32)
    payment_reference: str | None = Field(default=None, max_length=128)
    paid_at: datetime | None = None

    @model_validator(mode="after")
    def validate_financial_totals(self) -> "BookingUpdate":
        money_fields = (self.subtotal_pence, self.tax_pence, self.total_pence)
        if any(value is not None for value in money_fields):
            if any(value is None for value in money_fields):
                raise ValueError("Subtotal, tax, and total are required together")
            if self.total_pence != self.subtotal_pence + self.tax_pence:
                raise ValueError("Total must equal subtotal plus tax")
        return self

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
    currency: str
    subtotal_pence: int | None
    tax_rate_basis_points: int | None
    tax_pence: int | None
    total_pence: int | None
    payment_status: PaymentStatus
    payment_provider: str | None
    payment_reference: str | None
    paid_at: datetime | None
    privacy_consent_at: datetime
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


class CustomerAccessRequest(BaseModel):
    email: EmailStr


class CustomerAccessResponse(BaseModel):
    message: str


class CustomerAccessExchange(BaseModel):
    token: str = Field(min_length=20, max_length=4096)


class CustomerAccessTokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int


class CustomerChangeRequestCreate(BaseModel):
    request_type: CustomerChangeRequestType
    requested_date: date | None = None
    requested_time: time | None = None
    message: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_request_details(self) -> "CustomerChangeRequestCreate":
        if self.request_type is CustomerChangeRequestType.RESCHEDULE and (self.requested_date is None or self.requested_time is None):
            raise ValueError("A new date and time are required for a reschedule request")
        if self.requested_date is not None and self.requested_date < date.today():
            raise ValueError("The requested date must be today or later")
        return self


class CustomerChangeRequestRead(BaseModel):
    id: str
    booking_id: str
    customer_email: EmailStr
    request_type: CustomerChangeRequestType
    requested_date: date | None
    requested_time: time | None
    message: str | None
    status: CustomerChangeRequestStatus
    created_at: datetime
    reviewed_at: datetime | None
    resolved_at: datetime | None
    resolution: Literal["approved", "declined"] | None
    resolution_note: str | None

    model_config = ConfigDict(from_attributes=True)


class AdminChangeRequestRead(CustomerChangeRequestRead):
    customer_name: str
    service_type: str
    current_date: date
    current_time: time
    booking_status: BookingStatus


class AdminChangeRequestUpdate(BaseModel):
    status: Literal["reviewed", "resolved"]
    resolution: Literal["approved", "declined"] | None = None
    resolution_note: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_resolution(self) -> "AdminChangeRequestUpdate":
        if self.status == "resolved" and self.resolution is None:
            raise ValueError("A resolved request needs an approved or declined decision")
        return self


class CustomerChangeRequestResponse(BaseModel):
    id: str
    message: str
    status: CustomerChangeRequestStatus


class CustomerBookingRead(BaseModel):
    id: str
    service_type: str
    frequency: str
    preferred_date: date
    preferred_time: time
    status: BookingStatus
    created_at: datetime
    currency: str
    subtotal_pence: int | None
    tax_rate_basis_points: int | None
    tax_pence: int | None
    total_pence: int | None
    payment_status: PaymentStatus
    paid_at: datetime | None
    change_request: CustomerChangeRequestRead | None = None

    model_config = ConfigDict(from_attributes=True)


class CustomerDashboardResponse(BaseModel):
    customer_email: EmailStr
    upcoming: list[CustomerBookingRead]
    past: list[CustomerBookingRead]


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


class AdminAnalyticsResponse(BaseModel):
    bookings_this_month: int
    completed_this_month: int
    cancelled_this_month: int
    revenue_pence_this_month: int
    average_booking_total_pence: int | None


class ReferralCodeCheckRequest(BaseModel):
    code: str = Field(min_length=3, max_length=32)


class ReferralCodeCheckResponse(BaseModel):
    valid: bool
    code: str
    discount_percent: int = 0
    message: str


class CustomerDataRequestCreate(BaseModel):
    request_type: Literal["export", "delete"]


class CustomerDataRequestResponse(BaseModel):
    id: str
    request_type: Literal["export", "delete"]
    status: str
    message: str
