"""Customer-facing magic-link access and booking dashboard endpoints."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Booking, CustomerMagicLink
from app.notifications import send_customer_magic_link
from app.schemas import (
    CustomerAccessExchange,
    CustomerAccessRequest,
    CustomerAccessResponse,
    CustomerAccessTokenResponse,
    CustomerBookingRead,
    CustomerDashboardResponse,
)
from app.security import (
    create_customer_access_token,
    create_customer_magic_token,
    get_current_customer,
    hash_token_identifier,
)

router = APIRouter(prefix="/customer", tags=["customer"])
settings = get_settings()

_GENERIC_ACCESS_MESSAGE = "If we have booking requests for that email, a secure dashboard link will be sent shortly."


@router.post("/access/request", response_model=CustomerAccessResponse, status_code=status.HTTP_202_ACCEPTED)
async def request_customer_access(
    payload: CustomerAccessRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> CustomerAccessResponse:
    email = str(payload.email).lower()
    has_booking = db.scalar(select(Booking.id).where(func.lower(Booking.customer_email) == email).limit(1)) is not None
    if has_booking:
        raw_token, token_hash = create_customer_magic_token()
        now = datetime.now(timezone.utc)
        active_links = db.scalars(
            select(CustomerMagicLink).where(
                CustomerMagicLink.customer_email == email,
                CustomerMagicLink.used_at.is_(None),
                CustomerMagicLink.expires_at > now,
            )
        ).all()
        for link in active_links:
            link.used_at = now
        db.add(
            CustomerMagicLink(
                token_hash=token_hash,
                customer_email=email,
                expires_at=now + timedelta(minutes=settings.customer_magic_link_minutes),
            )
        )
        db.commit()
        background_tasks.add_task(send_customer_magic_link, email, raw_token)
    return CustomerAccessResponse(message=_GENERIC_ACCESS_MESSAGE)


@router.post("/access/exchange", response_model=CustomerAccessTokenResponse)
def exchange_customer_access(
    payload: CustomerAccessExchange,
    db: Session = Depends(get_db),
) -> CustomerAccessTokenResponse:
    now = datetime.now(timezone.utc)
    link = db.scalar(
        select(CustomerMagicLink).where(
            CustomerMagicLink.token_hash == hash_token_identifier(payload.token),
            CustomerMagicLink.used_at.is_(None),
            CustomerMagicLink.expires_at > now,
        )
    )
    if link is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="This dashboard link is invalid or has expired.")
    link.used_at = now
    db.commit()
    return CustomerAccessTokenResponse(
        access_token=create_customer_access_token(link.customer_email),
        expires_in=settings.customer_magic_link_minutes * 60,
    )


@router.get("/bookings", response_model=CustomerDashboardResponse)
def customer_bookings(
    customer_email: str = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerDashboardResponse:
    bookings = db.scalars(
        select(Booking)
        .where(func.lower(Booking.customer_email) == customer_email)
        .order_by(Booking.preferred_date.asc(), Booking.preferred_time.asc())
    ).all()
    upcoming: list[CustomerBookingRead] = []
    past: list[CustomerBookingRead] = []
    today = date.today()
    for booking in bookings:
        item = CustomerBookingRead.model_validate(booking)
        if booking.preferred_date >= today and booking.status.value not in {"completed", "cancelled"}:
            upcoming.append(item)
        else:
            past.append(item)
    past.sort(key=lambda item: (item.preferred_date, item.preferred_time), reverse=True)
    return CustomerDashboardResponse(customer_email=customer_email, upcoming=upcoming, past=past)
