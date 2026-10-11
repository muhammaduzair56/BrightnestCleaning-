"""Request and response contracts for the BrightNest API."""
from __future__ import annotations

from datetime import date, datetime, time
from typing import Annotated, Literal, Union

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
    "Bin cleaning",
    "Small one-off jobs",
    "Tailored / other request",
}

PROPERTY_DETAIL_SERVICE_TYPES = {
    "Regular home cleaning",
    "Deep cleaning",
    "End of tenancy",
    "Move-in / move-out",
    "Post-renovation",
    "Airbnb / short-term rental",
}


def normalize_optional_text(value: object) -> object:
    if isinstance(value, str):
        return value.strip() or None
    return value


class AdditionalDetailModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class BinTypeDetail(AdditionalDetailModel):
    type_or_colour: str | None = Field(default=None, max_length=80)

    @field_validator("type_or_colour", mode="before")
    @classmethod
    def normalize_type_or_colour(cls, value: object) -> object:
        return normalize_optional_text(value)


class BinCleaningDetails(AdditionalDetailModel):
    number_of_bins: int = Field(default=1, ge=1, le=50)
    bins: list[BinTypeDetail] | None = Field(default=None, max_length=50)
    collection_day: str | None = Field(default=None, max_length=32)
    frequency: Literal["One-off", "Recurring"] = "One-off"
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("collection_day", "notes", mode="before")
    @classmethod
    def normalize_bin_text(cls, value: object) -> object:
        return normalize_optional_text(value)

    @model_validator(mode="after")
    def ensure_one_type_entry_per_bin(self) -> "BinCleaningDetails":
        if not self.bins:
            self.bins = [BinTypeDetail() for _ in range(self.number_of_bins)]
        elif len(self.bins) != self.number_of_bins:
            raise ValueError("Provide one bin type/colour entry for each bin")
        return self


class KitchenDeepCleaningDetails(AdditionalDetailModel):
    service: Literal["Kitchen deep cleaning"]
    kitchen_requirements: str | None = Field(default=None, max_length=1000)

    @field_validator("kitchen_requirements", mode="before")
    @classmethod
    def normalize_requirements(cls, value: object) -> object:
        return normalize_optional_text(value)


class SingleOvenCleaningDetails(AdditionalDetailModel):
    service: Literal["Single oven cleaning"]
    quantity: int = Field(default=1, ge=1, le=20)


class DoubleOvenCleaningDetails(AdditionalDetailModel):
    service: Literal["Double oven cleaning"]
    quantity: int = Field(default=1, ge=1, le=20)


class FridgeFreezerCleaningDetails(AdditionalDetailModel):
    service: Literal["Fridge/freezer cleaning"]
    appliance_type: Literal["Fridge", "Freezer", "Fridge/freezer"] | None = None
    quantity: int = Field(default=1, ge=1, le=20)


class InsideWindowCleaningDetails(AdditionalDetailModel):
    service: Literal["Inside window cleaning"]
    number_of_windows: int = Field(default=1, ge=1, le=100)
    side: Literal["Inside", "Outside", "Both"] = "Inside"


class CarpetRugCleaningDetails(AdditionalDetailModel):
    service: Literal["Carpet/rug cleaning"]
    number_of_rooms: int | None = Field(default=None, ge=1, le=100)
    number_of_items: int | None = Field(default=None, ge=1, le=100)
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("description", mode="before")
    @classmethod
    def normalize_description(cls, value: object) -> object:
        return normalize_optional_text(value)


class SofaUpholsteryCleaningDetails(AdditionalDetailModel):
    service: Literal["Sofa/upholstery cleaning"]
    upholstery_type: Literal["Sofa", "Armchair", "Other"] = "Sofa"
    number_of_seats: int | None = Field(default=None, ge=1, le=100)
    other_description: str | None = Field(default=None, max_length=1000)

    @field_validator("other_description", mode="before")
    @classmethod
    def normalize_other_description(cls, value: object) -> object:
        return normalize_optional_text(value)


class MattressCleaningDetails(AdditionalDetailModel):
    service: Literal["Mattress cleaning"]
    quantity: int = Field(default=1, ge=1, le=20)
    size: Literal["Single", "Double", "King", "Super king", "Other"] | None = None


class WashingMachineCleaningDetails(AdditionalDetailModel):
    service: Literal["Washing machine cleaning"]
    quantity: int = Field(default=1, ge=1, le=20)
    appliance_type: Literal["Front-loader", "Top-loader", "Washer-dryer", "Other"] | None = None


class OtherCleaningDetails(AdditionalDetailModel):
    service: Literal["Other"]
    description: str = Field(min_length=1, max_length=1000)

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, value: object) -> object:
        normalized = normalize_optional_text(value)
        if normalized is None:
            raise ValueError("A description is required for Other")
        return normalized


AdditionalCleaningItem = Annotated[
    Union[
        KitchenDeepCleaningDetails,
        SingleOvenCleaningDetails,
        DoubleOvenCleaningDetails,
        FridgeFreezerCleaningDetails,
        InsideWindowCleaningDetails,
        CarpetRugCleaningDetails,
        SofaUpholsteryCleaningDetails,
        MattressCleaningDetails,
        WashingMachineCleaningDetails,
        OtherCleaningDetails,
    ],
    Field(discriminator="service"),
]


class AdditionalServicesRequest(AdditionalDetailModel):
    bin_cleaning: BinCleaningDetails | None = None
    items: list[AdditionalCleaningItem] = Field(default_factory=list, max_length=10)

    @model_validator(mode="after")
    def reject_duplicate_services(self) -> "AdditionalServicesRequest":
        labels = [item.service for item in self.items]
        if len(labels) != len(set(labels)):
            raise ValueError("An additional cleaning service can only be selected once")
        return self


class BookingCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    customer_email: EmailStr
    customer_phone: str | None = Field(default=None, max_length=32)
    postcode: str = Field(min_length=3, max_length=16)
    service_type: str = Field(min_length=3, max_length=80)
    frequency: Literal["One-off visit", "Weekly", "Fortnightly", "Monthly"]
    preferred_date: date
    preferred_time: time
    bedrooms: int = Field(default=1, ge=0, le=50)
    bathrooms: int = Field(default=1, ge=0, le=30)
    bin_cleaning: bool = False
    additional_services: AdditionalServicesRequest | None = None
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

    @model_validator(mode="after")
    def validate_booking_details(self) -> "BookingCreate":
        if self.service_type in PROPERTY_DETAIL_SERVICE_TYPES and (self.bedrooms < 1 or self.bathrooms < 1):
            raise ValueError("Bedrooms and bathrooms are required for this property cleaning service")
        if self.additional_services is not None:
            if self.service_type == "Bin cleaning" and self.additional_services.bin_cleaning is None:
                raise ValueError("Bin Cleaning details are required when it is the main service")
            self.bin_cleaning = self.service_type == "Bin cleaning" or self.additional_services.bin_cleaning is not None
        elif self.service_type == "Bin cleaning":
            # Older clients do not send structured details, but the legacy flag remains accurate.
            self.bin_cleaning = True
        return self


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
    bedrooms: int
    bathrooms: int
    bin_cleaning: bool
    additional_services: AdditionalServicesRequest
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

    @field_validator("additional_services", mode="before")
    @classmethod
    def normalize_legacy_additional_services(cls, value: object) -> object:
        return {"bin_cleaning": None, "items": []} if value is None else value


class BookingListResponse(BaseModel):
    items: list[BookingRead]
    page: int
    page_size: int
    total: int


class BookingAccepted(BaseModel):
    booking_id: str
    message: str


class AvailabilitySlot(BaseModel):
    value: str
    label: str
    description: str
    available: bool


class BookingAvailabilityResponse(BaseModel):
    date: date
    slots: list[AvailabilitySlot]


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


class AdminAnalyticsMonth(BaseModel):
    month: str
    label: str
    bookings: int
    completed: int
    cancelled: int
    cancellation_rate: float
    revenue_pence: int


class AdminAnalyticsResponse(BaseModel):
    bookings_this_month: int
    completed_this_month: int
    cancelled_this_month: int
    revenue_pence_this_month: int
    average_booking_total_pence: int | None
    months: list[AdminAnalyticsMonth]


class AdminNotificationRead(BaseModel):
    id: str
    action: str
    booking_id: str | None
    booking_customer_name: str | None
    booking_service_type: str | None
    metadata: dict[str, object] | None
    created_at: datetime


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
