import asyncio
import os
from datetime import date, time

from pydantic import SecretStr

os.environ["DATABASE_URL"] = "postgresql://test:test@localhost/test?sslmode=require"
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-local-validation-only"
os.environ["ADMIN_NOTIFICATION_EMAIL"] = "bookings@brightnest-cleaning.co.uk"
os.environ["EMAIL_FROM"] = "BrightNest <bookings@brightnest-cleaning.co.uk>"
os.environ["APP_ENV"] = "test"
os.environ["TRUSTED_HOSTS"] = "testserver,localhost,127.0.0.1"
os.environ["SMTP_HOST"] = "smtp.example.test"
os.environ["SMTP_PORT"] = "587"
os.environ["SMTP_USERNAME"] = "smtp-user@example.test"
os.environ["SMTP_PASSWORD"] = "smtp-password-for-tests-only"

from app import notifications
from app.models import Booking


def test_customer_magic_link_uses_smtp_without_blocking_event_loop(monkeypatch):
    sent = {}

    def fake_send_email_sync(**kwargs):
        sent.update(kwargs)

    monkeypatch.setattr(notifications, "_send_email_sync", fake_send_email_sync)
    monkeypatch.setattr(notifications.settings, "smtp_host", "smtp.example.test")
    monkeypatch.setattr(notifications.settings, "smtp_username", "smtp-user@example.test")
    monkeypatch.setattr(notifications.settings, "smtp_password", SecretStr("smtp-password"))

    delivered = asyncio.run(
        notifications.send_customer_magic_link(
            "customer@example.test",
            "token-that-is-long-enough-for-testing",
        )
    )

    assert delivered is True
    assert sent["recipients"] == ["customer@example.test"]
    assert sent["subject"] == "Your BrightNest booking dashboard"
    assert "dashboard?token=" in sent["html"]


def test_internal_booking_email_includes_additional_services_and_escapes_free_text():
    booking = Booking(
        id="booking-reference-123",
        customer_name="Amina Khan",
        customer_email="amina@example.co.uk",
        customer_phone="07123456789",
        postcode="B1 1AA",
        service_type="Deep cleaning",
        frequency="One-off visit",
        preferred_date=date(2030, 1, 1),
        preferred_time=time(10, 30),
        notes="Existing notes stay separate.",
        additional_services={
            "bin_cleaning": {
                "number_of_bins": 2,
                "bins": [{"type_or_colour": "Green"}, {"type_or_colour": "<script>alert(1)</script>"}],
                "collection_day": "Tuesday",
                "frequency": "Recurring",
                "notes": "Use side gate",
            },
            "items": [
                {"service": "Single oven cleaning", "quantity": 2},
                {"service": "Other", "description": "<img src=x onerror=alert(1)>"},
            ],
        },
    )

    html = notifications._booking_email_html(booking)

    for expected in (
        "Additional Cleaning Services",
        "Bin cleaning",
        "Number of bins: 2",
        "Bin 1 type/colour: Green",
        "Bin 2 type/colour",
        "Tuesday",
        "Recurring",
        "Single oven cleaning",
        "Quantity: 2",
        "Other",
        "Existing notes stay separate.",
    ):
        assert expected in html
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in html
    assert "&lt;img src=x onerror=alert(1)&gt;" in html
    assert "<script>" not in html
    assert "<img src=x" not in html


def test_customer_magic_link_returns_false_when_smtp_delivery_fails(monkeypatch):
    def failing_send_email_sync(**kwargs):
        raise OSError("SMTP unavailable")

    monkeypatch.setattr(notifications, "_send_email_sync", failing_send_email_sync)
    monkeypatch.setattr(notifications.settings, "smtp_host", "smtp.example.test")
    monkeypatch.setattr(notifications.settings, "smtp_username", "smtp-user@example.test")
    monkeypatch.setattr(notifications.settings, "smtp_password", SecretStr("smtp-password"))

    delivered = asyncio.run(
        notifications.send_customer_magic_link(
            "customer@example.test",
            "token-that-is-long-enough-for-testing",
        )
    )

    assert delivered is False


def test_smtp_connection_falls_back_to_brevo_port_2525(monkeypatch):
    opened_ports = []

    class FakeClient:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        def starttls(self, context):
            return None

        def login(self, username, password):
            assert username == "smtp-user@example.test"
            assert password == "smtp-password"

        def send_message(self, message):
            assert message["To"] == "customer@example.test"

    def fake_smtp(host, port, timeout):
        opened_ports.append(port)
        if port == 587:
            raise TimeoutError("port blocked in test")
        return FakeClient()

    monkeypatch.setattr(notifications.smtplib, "SMTP", fake_smtp)
    monkeypatch.setattr(notifications.settings, "smtp_host", "smtp-relay.brevo.com")
    monkeypatch.setattr(notifications.settings, "smtp_port", 587)
    monkeypatch.setattr(notifications.settings, "smtp_timeout_seconds", 15)
    monkeypatch.setattr(notifications.settings, "smtp_username", "smtp-user@example.test")
    monkeypatch.setattr(notifications.settings, "smtp_password", SecretStr("smtp-password"))

    notifications._send_email_sync(
        recipients=["customer@example.test"],
        subject="Test",
        html="<p>Test</p>",
    )

    assert opened_ports == [587, 2525]


def test_smtp_timeout_is_configurable(monkeypatch):
    calls = []

    class FakeClient:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_value, traceback):
            return False

        def starttls(self, context):
            return None

        def login(self, username, password):
            return None

        def send_message(self, message):
            return None

    def fake_smtp(host, port, timeout):
        calls.append(timeout)
        return FakeClient()

    monkeypatch.setattr(notifications.smtplib, "SMTP", fake_smtp)
    monkeypatch.setattr(notifications.settings, "smtp_port", 2525)
    monkeypatch.setattr(notifications.settings, "smtp_timeout_seconds", 9)
    monkeypatch.setattr(notifications.settings, "smtp_host", "smtp-relay.brevo.com")
    monkeypatch.setattr(notifications.settings, "smtp_username", "smtp-user@example.test")
    monkeypatch.setattr(notifications.settings, "smtp_password", SecretStr("smtp-password"))

    notifications._send_email_sync(
        recipients=["customer@example.test"],
        subject="Test",
        html="<p>Test</p>",
    )

    assert calls == [9]
