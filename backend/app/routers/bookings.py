"""Public booking creation and protected booking-management endpoints."""
from __future__ import annotations

from datetime import date, datetime, timezone, timedelta, time
import hashlib
from calendar import monthrange

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.cache import cache
from app.config import get_settings
from app.database import get_db
from app.models import AdminUser, AuditEvent, Booking, BookingStatus, CustomerChangeRequest, CustomerChangeRequestStatus, ReferralCode, RecurringBookingPlan
from app.notifications import notify_customer_change_resolution, notify_new_booking
from app.schemas import AdminAnalyticsMonth, AdminAnalyticsResponse, AdminChangeRequestRead, AdminChangeRequestUpdate, AvailabilitySlot, BookingAccepted, BookingAvailabilityResponse, BookingCreate, BookingListResponse, BookingRead, BookingUpdate, DashboardResponse, ReferralCodeCheckRequest, ReferralCodeCheckResponse
from app.security import get_current_admin

router = APIRouter(tags=["bookings"])


TIME_SLOT_DEFINITIONS = (
    ("08:00", "8:00 am", "Early morning"),
    ("09:00", "9:00 am", "Morning"),
    ("10:00", "10:00 am", "Morning"),
    ("11:00", "11:00 am", "Late morning"),
    ("12:00", "12:00 pm", "Midday"),
    ("13:00", "1:00 pm", "Early afternoon"),
    ("14:00", "2:00 pm", "Afternoon"),
    ("15:00", "3:00 pm", "Afternoon"),
    ("16:00", "4:00 pm", "Late afternoon"),
    ("17:00", "5:00 pm", "Evening"),
)
ACTIVE_BOOKING_STATUSES = (BookingStatus.NEW, BookingStatus.CONTACTED, BookingStatus.CONFIRMED)


def _booking_read(booking: Booking) -> BookingRead:
    return BookingRead.model_validate(booking)


async def _invalidate_booking_cache() -> None:
    await cache.bump_booking_version()


def _lock_slot(db: Session, preferred_date: date, preferred_time: time) -> None:
    """Serialize competing submissions for the same slot on PostgreSQL."""
    bind = db.get_bind()
    if bind is None or bind.dialect.name != "postgresql":
        return
    lock_key = int.from_bytes(hashlib.sha256(f"{preferred_date.isoformat()}:{preferred_time.isoformat()}".encode()).digest()[:8], "big", signed=True)
    db.execute(select(func.pg_advisory_xact_lock(lock_key)))


def _slot_booking_count(db: Session, preferred_date: date, preferred_time: time) -> int:
    return int(db.scalar(select(func.count(Booking.id)).where(Booking.preferred_date == preferred_date, Booking.preferred_time == preferred_time, Booking.status.in_(ACTIVE_BOOKING_STATUSES))) or 0)


def _ensure_slot_available(db: Session, preferred_date: date, preferred_time: time) -> None:
    _lock_slot(db, preferred_date, preferred_time)
    if _slot_booking_count(db, preferred_date, preferred_time) >= get_settings().booking_slot_capacity:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That time has just been taken. Please choose another available slot.")


@router.get("/availability", response_model=BookingAvailabilityResponse)
def get_availability(preferred_date: date = Query(...), service_type: str | None = Query(default=None, min_length=1, max_length=120), db: Session = Depends(get_db)) -> BookingAvailabilityResponse:
    if preferred_date < date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Availability can only be checked for today or a future date")
    counts = dict(db.execute(select(Booking.preferred_time, func.count(Booking.id)).where(Booking.preferred_date == preferred_date, Booking.status.in_(ACTIVE_BOOKING_STATUSES)).group_by(Booking.preferred_time)).all())
    capacity = get_settings().booking_slot_capacity
    current_time = datetime.now().time()
    return BookingAvailabilityResponse(date=preferred_date, slots=[AvailabilitySlot(value=value, label=label, description=description, available=(preferred_date > date.today() or time.fromisoformat(value) > current_time) and counts.get(time.fromisoformat(value), 0) < capacity) for value, label, description in TIME_SLOT_DEFINITIONS])


@router.post("/referrals/check", response_model=ReferralCodeCheckResponse)
def check_referral_code(payload: ReferralCodeCheckRequest, db: Session = Depends(get_db)) -> ReferralCodeCheckResponse:
    code = payload.code.strip().upper()
    referral = db.scalar(select(ReferralCode).where(func.upper(ReferralCode.code) == code, ReferralCode.active.is_(True)))
    now = datetime.now(timezone.utc)
    valid = referral is not None and (referral.expires_at is None or referral.expires_at > now) and (referral.max_redemptions is None or referral.redemption_count < referral.max_redemptions)
    if not valid:
        return ReferralCodeCheckResponse(valid=False, code=code, message="This referral code is not currently available.")
    return ReferralCodeCheckResponse(valid=True, code=code, discount_percent=referral.discount_percent, message=f"Referral code applied: {referral.discount_percent}% off eligible services.")


@router.post("/bookings", response_model=BookingAccepted, status_code=status.HTTP_201_CREATED)
async def create_booking(payload: BookingCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> BookingAccepted:
    if payload.preferred_date < date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Preferred date must be today or later")
    if payload.preferred_date == date.today() and payload.preferred_time <= datetime.now().time():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Please choose a future time for today")
    _ensure_slot_available(db, payload.preferred_date, payload.preferred_time)
    booking = Booking(**payload.model_dump(exclude={"privacy_consent"}))
    try:
        db.add(booking)
        db.flush()
        db.add(AuditEvent(booking_id=booking.id, action="booking_created", metadata_json={"service_type": booking.service_type, "privacy_consent": True}))
        if booking.frequency != "One-off visit":
            interval_days = {"Weekly": 7, "Fortnightly": 14, "Monthly": 28}.get(booking.frequency, 0)
            if interval_days:
                db.add(RecurringBookingPlan(source_booking_id=booking.id, customer_email=booking.customer_email, frequency=booking.frequency, next_date=booking.preferred_date + timedelta(days=interval_days)))
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Booking service is temporarily unavailable") from exc
    await _invalidate_booking_cache()
    background_tasks.add_task(notify_new_booking, booking.id)
    return BookingAccepted(booking_id=booking.id, message="Your booking request has been received.")


@router.get("/admin/bookings", response_model=BookingListResponse)
async def list_bookings(
    status_filter: BookingStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
) -> BookingListResponse:
    version = await cache.get_booking_version()
    cache_key = f"bookings:list:{version}:{status_filter or 'all'}:{page}:{page_size}"
    cached = await cache.get_json(cache_key)
    if cached:
        return BookingListResponse.model_validate(cached)
    statement = select(Booking).options(selectinload(Booking.assigned_admin)).order_by(Booking.created_at.desc())
    count_statement = select(func.count()).select_from(Booking)
    if status_filter:
        statement = statement.where(Booking.status == status_filter)
        count_statement = count_statement.where(Booking.status == status_filter)
    total = db.scalar(count_statement) or 0
    bookings = db.scalars(statement.offset((page - 1) * page_size).limit(page_size)).all()
    response = BookingListResponse(items=[_booking_read(item) for item in bookings], page=page, page_size=page_size, total=total)
    await cache.set_json(cache_key, response.model_dump(mode="json"), ttl_seconds=30)
    return response


@router.get("/admin/bookings/{booking_id}", response_model=BookingRead)
def get_booking(booking_id: str, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)) -> BookingRead:
    booking = db.scalar(select(Booking).options(selectinload(Booking.assigned_admin)).where(Booking.id == booking_id))
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return _booking_read(booking)


@router.get("/admin/change-requests", response_model=list[AdminChangeRequestRead])
def list_change_requests(
    status_filter: CustomerChangeRequestStatus | None = Query(default=CustomerChangeRequestStatus.REQUESTED, alias="status"),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
) -> list[AdminChangeRequestRead]:
    requests = db.scalars(
        select(CustomerChangeRequest)
        .options(selectinload(CustomerChangeRequest.booking))
        .where(CustomerChangeRequest.status == status_filter)
        .order_by(CustomerChangeRequest.created_at.asc())
    ).all()
    return [
        AdminChangeRequestRead(
            id=request.id,
            booking_id=request.booking_id,
            customer_email=request.customer_email,
            customer_name=request.booking.customer_name,
            service_type=request.booking.service_type,
            current_date=request.booking.preferred_date,
            current_time=request.booking.preferred_time,
            booking_status=request.booking.status,
            request_type=request.request_type,
            requested_date=request.requested_date,
            requested_time=request.requested_time,
            message=request.message,
            status=request.status,
            created_at=request.created_at,
            reviewed_at=request.reviewed_at,
            resolved_at=request.resolved_at,
            resolution=request.resolution,
            resolution_note=request.resolution_note,
        )
        for request in requests
    ]


@router.patch("/admin/change-requests/{request_id}", response_model=AdminChangeRequestRead)
async def update_change_request(
    request_id: str,
    payload: AdminChangeRequestUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
) -> AdminChangeRequestRead:
    change_request = db.scalar(select(CustomerChangeRequest).options(selectinload(CustomerChangeRequest.booking)).where(CustomerChangeRequest.id == request_id))
    if change_request is None or change_request.booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Change request not found")
    if change_request.status is CustomerChangeRequestStatus.RESOLVED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This change request has already been resolved")
    now = datetime.now(timezone.utc)
    change_request.status = CustomerChangeRequestStatus.REVIEWED if payload.status == "reviewed" else CustomerChangeRequestStatus.RESOLVED
    change_request.reviewed_at = change_request.reviewed_at or now
    change_request.resolution = payload.resolution
    change_request.resolution_note = payload.resolution_note
    if payload.status == "resolved":
        change_request.resolved_at = now
        change_request.resolved_by_admin_id = admin.id
        if payload.resolution == "approved":
            if change_request.request_type.value == "cancel":
                change_request.booking.status = BookingStatus.CANCELLED
            elif change_request.requested_date is not None and change_request.requested_time is not None:
                change_request.booking.preferred_date = change_request.requested_date
                change_request.booking.preferred_time = change_request.requested_time
    db.add(AuditEvent(admin_id=admin.id, booking_id=change_request.booking_id, action="customer_change_request_updated", metadata_json={"request_id": request_id, "status": payload.status, "resolution": payload.resolution, "note": payload.resolution_note}))
    db.commit()
    db.refresh(change_request)
    background_tasks.add_task(notify_customer_change_resolution, change_request.id)
    request = change_request
    return AdminChangeRequestRead(
        id=request.id,
        booking_id=request.booking_id,
        customer_email=request.customer_email,
        customer_name=request.booking.customer_name,
        service_type=request.booking.service_type,
        current_date=request.booking.preferred_date,
        current_time=request.booking.preferred_time,
        booking_status=request.booking.status,
        request_type=request.request_type,
        requested_date=request.requested_date,
        requested_time=request.requested_time,
        message=request.message,
        status=request.status,
        created_at=request.created_at,
        reviewed_at=request.reviewed_at,
        resolved_at=request.resolved_at,
        resolution=request.resolution,
        resolution_note=request.resolution_note,
    )


@router.patch("/admin/bookings/{booking_id}", response_model=BookingRead)
async def update_booking(
    booking_id: str,
    payload: BookingUpdate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
) -> BookingRead:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(booking, key, value)
    booking.assigned_admin_id = admin.id
    db.add(AuditEvent(admin_id=admin.id, booking_id=booking.id, action="booking_updated", metadata_json=updates))
    db.commit()
    db.refresh(booking)
    await _invalidate_booking_cache()
    return _booking_read(booking)


@router.post("/admin/recurring/run", response_model=dict[str, int])
def run_recurring_bookings(db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)) -> dict[str, int]:
    today = date.today()
    plans = db.scalars(select(RecurringBookingPlan).where(RecurringBookingPlan.active.is_(True), RecurringBookingPlan.next_date <= today).order_by(RecurringBookingPlan.next_date.asc())).all()
    created = 0
    for plan in plans:
        source = db.get(Booking, plan.source_booking_id)
        if source is None or source.status is BookingStatus.CANCELLED:
            plan.active = False
            continue
        interval_days = {"Weekly": 7, "Fortnightly": 14, "Monthly": 28}.get(plan.frequency)
        if not interval_days:
            plan.active = False
            continue
        next_booking = Booking(customer_name=source.customer_name, customer_email=source.customer_email, customer_phone=source.customer_phone, postcode=source.postcode, service_type=source.service_type, frequency=source.frequency, preferred_date=plan.next_date, preferred_time=source.preferred_time, bedrooms=source.bedrooms, bathrooms=source.bathrooms, bin_cleaning=source.bin_cleaning, notes=source.notes, status=BookingStatus.NEW, currency=source.currency, payment_status=source.payment_status)
        db.add(next_booking)
        plan.last_generated_at = datetime.now(timezone.utc)
        plan.next_date = plan.next_date + timedelta(days=interval_days)
        created += 1
    db.commit()
    return {"created": created, "plans_checked": len(plans)}


def _shift_month(value: date, offset: int) -> date:
    absolute_month = (value.year * 12 + value.month - 1) + offset
    year, month_index = divmod(absolute_month, 12)
    return date(year, month_index + 1, 1)


@router.get("/admin/analytics", response_model=AdminAnalyticsResponse)
def analytics(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    service_type: str | None = Query(default=None, min_length=1, max_length=120),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
) -> AdminAnalyticsResponse:
    today = date.today()
    range_start = start_date or _shift_month(today.replace(day=1), -5)
    range_end = end_date or today
    if range_start > range_end:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Start date must be on or before end date")
    if (range_end - range_start).days > 731:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Analytics date range cannot exceed two years")
    filters = [Booking.preferred_date >= range_start, Booking.preferred_date <= range_end]
    if service_type:
        filters.append(Booking.service_type == service_type.strip())
    month_bookings = db.scalars(select(Booking).where(*filters)).all()
    completed = [booking for booking in month_bookings if booking.status is BookingStatus.COMPLETED]
    cancelled = [booking for booking in month_bookings if booking.status is BookingStatus.CANCELLED]
    totals = [booking.total_pence for booking in completed if booking.total_pence is not None]
    months: list[AdminAnalyticsMonth] = []
    cursor = _shift_month(range_start, 0)
    while cursor <= range_end:
        start = max(cursor, range_start)
        end = min(date(cursor.year, cursor.month, monthrange(cursor.year, cursor.month)[1]), range_end)
        bucket_filters = [Booking.preferred_date >= start, Booking.preferred_date <= end]
        if service_type:
            bucket_filters.append(Booking.service_type == service_type.strip())
        records = db.scalars(select(Booking).where(*bucket_filters)).all()
        completed_records = [record for record in records if record.status is BookingStatus.COMPLETED]
        cancelled_records = [record for record in records if record.status is BookingStatus.CANCELLED]
        recorded_totals = [record.total_pence for record in completed_records if record.total_pence is not None]
        months.append(AdminAnalyticsMonth(month=cursor.isoformat(), label=cursor.strftime("%b %Y"), bookings=len(records), completed=len(completed_records), cancelled=len(cancelled_records), cancellation_rate=round((len(cancelled_records) / len(records)) * 100, 1) if records else 0, revenue_pence=sum(recorded_totals)))
        cursor = _shift_month(cursor, 1)
    return AdminAnalyticsResponse(
        bookings_this_month=len(month_bookings),
        completed_this_month=len(completed),
        cancelled_this_month=len(cancelled),
        revenue_pence_this_month=sum(totals),
        average_booking_total_pence=round(sum(totals) / len(totals)) if totals else None,
        months=months,
    )


@router.get("/admin/dashboard", response_model=DashboardResponse)
async def dashboard(db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)) -> DashboardResponse:
    version = await cache.get_booking_version()
    cache_key = f"bookings:dashboard:{version}"
    cached = await cache.get_json(cache_key)
    if cached:
        return DashboardResponse.model_validate(cached)
    rows = db.execute(select(Booking.status, func.count()).group_by(Booking.status)).all()
    counts = {str(status.value if hasattr(status, 'value') else status): count for status, count in rows}
    response = DashboardResponse(
        total=sum(counts.values()),
        new=counts.get(BookingStatus.NEW.value, 0),
        contacted=counts.get(BookingStatus.CONTACTED.value, 0),
        confirmed=counts.get(BookingStatus.CONFIRMED.value, 0),
        completed=counts.get(BookingStatus.COMPLETED.value, 0),
        cancelled=counts.get(BookingStatus.CANCELLED.value, 0),
    )
    await cache.set_json(cache_key, response.model_dump(), ttl_seconds=45)
    return response
