import asyncio
import os

from pydantic import SecretStr

os.environ["DATABASE_URL"] = "postgresql://test:test@localhost/test?sslmode=require"
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-local-validation-only"
os.environ["ADMIN_NOTIFICATION_EMAIL"] = "bookings@brightnest-cleaning.co.uk"
os.environ["EMAIL_FROM"] = "BrightNest <bookings@brightnest-cleaning.co.uk>"
os.environ["APP_ENV"] = "test"
os.environ["TRUSTED_HOSTS"] = "testserver,localhost,127.0.0.1"

from app import notifications


def test_customer_magic_link_uses_supported_resend_send(monkeypatch):
    sent = {}

    def fake_send(params, options=None):
        sent["params"] = params
        sent["options"] = options
        return {"id": "email-test"}

    monkeypatch.setattr(notifications.resend.Emails, "send", fake_send)
    monkeypatch.setattr(notifications.settings, "resend_api_key", SecretStr("re_test_key"))

    delivered = asyncio.run(notifications.send_customer_magic_link("customer@example.test", "token-that-is-long-enough-for-testing"))

    assert delivered is True
    assert sent["params"]["to"] == ["customer@example.test"]
    assert sent["options"]["idempotency_key"].startswith("customer-magic-link/")
