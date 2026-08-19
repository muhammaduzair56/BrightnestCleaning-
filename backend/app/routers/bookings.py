"""Public booking creation and protected booking-management endpoints."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.cache import cache
from app.database import get_db
from app.models import AdminUser, AuditEvent, Booking, BookingStatus
from app.notifications import notify_new_booking
from app.schemas import BookingAccepted, BookingCreate, BookingListResponse, BookingRead, BookingUpdate, DashboardResponse
from app.security import get_current_admin

router = APIRouter(tags=["bookings"])


def _booking_read(booking: Booking) -> BookingRead:
    return BookingRead.model_validate(booking)


async def _invalidate_booking_cache() -> None:
    await cache.bump_booking_version()


@router.post("/bookings", response_model=BookingAccepted, status_code=status.HTTP_201_CREATED)
async def create_booking(payload: BookingCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> BookingAccepted:
    if payload.preferred_date < date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Preferred date must be today or later")
    booking = Booking(**payload.model_dump())
    try:
        db.add(booking)
        db.flush()
        db.add(AuditEvent(booking_id=booking.id, action="booking_created", metadata_json={"service_type": booking.service_type}))
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
