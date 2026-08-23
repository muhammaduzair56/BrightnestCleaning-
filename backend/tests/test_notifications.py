import asyncio
import os

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
