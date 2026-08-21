import os
from datetime import datetime, timezone
from io import BytesIO

import pytest
from pypdf import PdfReader

os.environ["DATABASE_URL"] = "postgresql://test:test@localhost/test?sslmode=require"
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-local-validation-only"
os.environ["ADMIN_NOTIFICATION_EMAIL"] = "bookings@brightnest-cleaning.co.uk"
os.environ["EMAIL_FROM"] = "BrightNest <bookings@brightnest-cleaning.co.uk>"
os.environ["APP_ENV"] = "test"
os.environ["TRUSTED_HOSTS"] = "testserver,localhost,127.0.0.1"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.cache import cache
from app.database import Base, get_db
from app.main import app
from app.models import AdminUser, Booking, BookingStatus, PaymentStatus
from app.schemas import BookingCreate, BookingUpdate
from app.security import create_access_token, decode_token, hash_password


def test_health_endpoint_returns_operational_status():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "brightnest-api"}


def test_access_token_has_expected_claims():
    token = create_access_token("admin-123")
    decoded = decode_token(token, "access")
    assert decoded["sub"] == "admin-123"
    assert decoded["type"] == "access"


def test_booking_contract_rejects_unknown_service_type():
    payload = {
        "customer_name": "Test Customer",
        "customer_email": "customer@example.test",
        "postcode": "B1 1AA",
        "service_type": "Unsupported service",
        "frequency": "One-off visit",
        "preferred_date": "2030-01-01",
        "preferred_time": "10:00:00",
    }
    try:
        BookingCreate.model_validate(payload)
    except ValueError as exc:
        assert "Unsupported service type" in str(exc)
    else:
        raise AssertionError("Unsupported service type should fail validation")


def test_booking_creation_and_admin_status_update(monkeypatch, tmp_path):
    database_path = tmp_path / "brightnest-test.sqlite"
    engine = create_engine(f"sqlite:///{database_path}")
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_db():
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    async def skip_email_delivery(booking_id: str):
        return None

    session = TestSession()
    session.add(AdminUser(email="admin@brightnest-cleaning.co.uk", password_hash=hash_password("StrongAdminPass123")))
    session.commit()
    session.close()
    app.dependency_overrides[get_db] = override_db
    monkeypatch.setattr("app.routers.bookings.notify_new_booking", skip_email_delivery)
    cache._local.clear()
    cache._local_limits.clear()
    client = TestClient(app)
    try:
        booking_response = client.post(
            "/api/v1/bookings",
            json={
                "customer_name": "Amina Khan",
                "customer_email": "amina@example.co.uk",
                "postcode": "B1 1AA",
                "service_type": "Deep cleaning",
                "frequency": "One-off visit",
                "preferred_date": "2030-01-01",
                "preferred_time": "10:30:00",
                "privacy_consent": True,
                "notes": "Please call on arrival.",
            },
        )
        assert booking_response.status_code == 201
        booking_id = booking_response.json()["booking_id"]

        login_response = client.post(
            "/api/v1/admin/auth/login",
            json={"email": "admin@brightnest-cleaning.co.uk", "password": "StrongAdminPass123"},
        )
        assert login_response.status_code == 200
        access_token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        list_response = client.get("/api/v1/admin/bookings", headers=headers)
        assert list_response.status_code == 200
        assert list_response.json()["total"] == 1

        update_response = client.patch(
            f"/api/v1/admin/bookings/{booking_id}",
            headers=headers,
            json={"status": "contacted", "admin_notes": "Call customer this afternoon."},
        )
        assert update_response.status_code == 200
        assert update_response.json()["status"] == "contacted"
        assert update_response.json()["admin_notes"] == "Call customer this afternoon."
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_public_booking_endpoint_applies_rate_limit_before_database_work():
    client = TestClient(app)
    invalid_payload = {"customer_name": "x"}
    responses = [client.post("/api/v1/bookings", json=invalid_payload) for _ in range(9)]
    assert responses[-1].status_code == 429
    assert responses[-1].headers["Retry-After"]


def test_customer_magic_link_exchange_returns_scoped_bookings(monkeypatch, tmp_path):
    from urllib.parse import parse_qs, urlparse

    database_path = tmp_path / "brightnest-customer-test.sqlite"
    engine = create_engine(f"sqlite:///{database_path}")
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_db():
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    async def skip_booking_email(booking_id: str):
        return None

    captured = {}

    async def capture_magic_link(email: str, raw_token: str):
        captured["email"] = email
        captured["raw_token"] = raw_token

    async def skip_change_request_email(change_request_id: str):
        return None

    app.dependency_overrides[get_db] = override_db
    monkeypatch.setattr("app.routers.bookings.notify_new_booking", skip_booking_email)
    monkeypatch.setattr("app.routers.customer.send_customer_magic_link", capture_magic_link)
    monkeypatch.setattr("app.routers.customer.notify_customer_change_request", skip_change_request_email)
    cache._local.clear()
    cache._local_limits.clear()
    client = TestClient(app)
    try:
        booking_response = client.post(
            "/api/v1/bookings",
            json={
                "customer_name": "Amina Khan",
                "customer_email": "amina@example.co.uk",
                "postcode": "B1 1AA",
                "service_type": "Deep cleaning",
                "frequency": "One-off visit",
                "preferred_date": "2030-01-01",
                "preferred_time": "10:30:00",
                "privacy_consent": True,
            },
        )
        assert booking_response.status_code == 201
        second_booking_response = client.post(
            "/api/v1/bookings",
            json={
                "customer_name": "Amina Khan",
                "customer_email": "amina@example.co.uk",
                "postcode": "B1 1AA",
                "service_type": "Oven cleaning",
                "frequency": "One-off visit",
                "preferred_date": "2030-01-02",
                "preferred_time": "14:00:00",
                "privacy_consent": True,
            },
        )
        assert second_booking_response.status_code == 201

        access_request = client.post("/api/v1/customer/access/request", json={"email": "amina@example.co.uk"})
        assert access_request.status_code == 202
        assert captured["email"] == "amina@example.co.uk"
        raw_token = captured["raw_token"]

        exchange_response = client.post("/api/v1/customer/access/exchange", json={"token": raw_token})
        assert exchange_response.status_code == 200
        customer_token = exchange_response.json()["access_token"]

        bookings_response = client.get(
            "/api/v1/customer/bookings",
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        assert bookings_response.status_code == 200
        body = bookings_response.json()
        assert body["customer_email"] == "amina@example.co.uk"
        assert len(body["upcoming"]) == 2
        assert body["upcoming"][0]["service_type"] == "Deep cleaning"
        assert body["past"] == []

        first_booking_id = booking_response.json()["booking_id"]
        second_booking_id = second_booking_response.json()["booking_id"]
        headers = {"Authorization": f"Bearer {customer_token}"}
        reschedule_response = client.post(
            f"/api/v1/customer/bookings/{first_booking_id}/change-requests",
            headers=headers,
            json={"request_type": "reschedule", "requested_date": "2030-01-03", "requested_time": "11:30:00", "message": "Thursday would suit us better."},
        )
        assert reschedule_response.status_code == 201
        assert reschedule_response.json()["status"] == "requested"

        cancellation_response = client.post(
            f"/api/v1/customer/bookings/{second_booking_id}/change-requests",
            headers=headers,
            json={"request_type": "cancel", "message": "Please cancel this visit."},
        )
        assert cancellation_response.status_code == 201

        duplicate_response = client.post(
            f"/api/v1/customer/bookings/{first_booking_id}/change-requests",
            headers=headers,
            json={"request_type": "cancel"},
        )
        assert duplicate_response.status_code == 409

        refreshed_body = client.get("/api/v1/customer/bookings", headers=headers).json()
        assert refreshed_body["upcoming"][0]["change_request"]["request_type"] == "reschedule"
        assert refreshed_body["upcoming"][1]["change_request"]["request_type"] == "cancel"

        with TestSession() as session:
            completed_booking = session.get(Booking, first_booking_id)
            completed_booking.status = BookingStatus.COMPLETED
            completed_booking.currency = "GBP"
            completed_booking.subtotal_pence = 12000
            completed_booking.tax_rate_basis_points = 2000
            completed_booking.tax_pence = 2400
            completed_booking.total_pence = 14400
            completed_booking.payment_status = PaymentStatus.PAID
            completed_booking.payment_provider = "Stripe"
            completed_booking.payment_reference = "pi_test_123"
            completed_booking.paid_at = datetime(2030, 1, 3, 12, 0, tzinfo=timezone.utc)
            session.commit()

        receipt_response = client.get(f"/api/v1/customer/bookings/{first_booking_id}/receipt", headers=headers)
        assert receipt_response.status_code == 200
        assert receipt_response.headers["content-type"].startswith("application/pdf")
        assert "attachment" in receipt_response.headers["content-disposition"]
        assert receipt_response.content.startswith(b"%PDF")
        receipt_text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(receipt_response.content)).pages)
        assert "BrightNest" in receipt_text
        assert "GBP 144.00" in receipt_text
        assert "Stripe" in receipt_text
        assert "pi_test_123" in receipt_text

        unavailable_receipt_response = client.get(f"/api/v1/customer/bookings/{second_booking_id}/receipt", headers=headers)
        assert unavailable_receipt_response.status_code == 409
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_booking_update_rejects_inconsistent_financial_totals():
    with pytest.raises(ValueError, match="Total must equal subtotal plus tax"):
        BookingUpdate(subtotal_pence=1000, tax_pence=200, total_pence=1500)


def test_booking_update_rejects_partial_financial_totals():
    with pytest.raises(ValueError, match="required together"):
        BookingUpdate(total_pence=1500)


def test_customer_access_request_does_not_disclose_unknown_email(monkeypatch, tmp_path):
    database_path = tmp_path / "brightnest-unknown-customer-test.sqlite"
    engine = create_engine(f"sqlite:///{database_path}")
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_db():
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    async def fail_if_email_sent(email: str, raw_token: str):
        raise AssertionError("No email should be sent for an unknown customer")

    app.dependency_overrides[get_db] = override_db
    monkeypatch.setattr("app.routers.customer.send_customer_magic_link", fail_if_email_sent)
    cache._local.clear()
    cache._local_limits.clear()
    client = TestClient(app)
    try:
        response = client.post("/api/v1/customer/access/request", json={"email": "unknown@example.co.uk"})
        assert response.status_code == 202
        assert "If we have booking requests" in response.json()["message"]
        assert "unknown@example.co.uk" not in response.text
    finally:
        app.dependency_overrides.clear()
        cache._local.clear()
        cache._local_limits.clear()
        engine.dispose()
