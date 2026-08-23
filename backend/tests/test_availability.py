import os
from datetime import date, time, timedelta

os.environ["DATABASE_URL"] = "postgresql://test:test@localhost/test?sslmode=require"
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-local-validation-only"
os.environ["ADMIN_NOTIFICATION_EMAIL"] = "bookings@brightnest-cleaning.co.uk"
os.environ["EMAIL_FROM"] = "BrightNest <bookings@brightnest-cleaning.co.uk>"
os.environ["APP_ENV"] = "test"
os.environ["TRUSTED_HOSTS"] = "testserver,localhost,127.0.0.1"

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models import Booking, BookingStatus
from app.routers.bookings import get_availability


def _make_session(tmp_path) -> Session:
    engine = create_engine(f"sqlite:///{tmp_path / 'availability.sqlite'}")
    Base.metadata.create_all(engine)
    return Session(engine)


def _booking(preferred_date: date, preferred_time: time, status: BookingStatus) -> Booking:
    return Booking(
        customer_name="Availability Test",
        customer_email="availability@example.test",
        customer_phone="07123456789",
        postcode="B1 1AA",
        service_type="Regular home cleaning",
        frequency="One-off visit",
        preferred_date=preferred_date,
        preferred_time=preferred_time,
        bedrooms=2,
        bathrooms=1,
        bin_cleaning=False,
        status=status,
    )


def test_active_booking_blocks_matching_availability_slot(tmp_path):
    session = _make_session(tmp_path)
    target_date = date.today() + timedelta(days=14)
    session.add(_booking(target_date, time(10, 0), BookingStatus.CONFIRMED))
    session.commit()

    response = get_availability(target_date, None, session)
    slots = {slot.value: slot for slot in response.slots}

    assert slots["10:00"].available is False
    assert slots["11:00"].available is True
    session.close()


def test_cancelled_booking_does_not_block_matching_availability_slot(tmp_path):
    session = _make_session(tmp_path)
    target_date = date.today() + timedelta(days=14)
    session.add(_booking(target_date, time(10, 0), BookingStatus.CANCELLED))
    session.commit()

    response = get_availability(target_date, None, session)
    slots = {slot.value: slot for slot in response.slots}

    assert slots["10:00"].available is True
    session.close()
