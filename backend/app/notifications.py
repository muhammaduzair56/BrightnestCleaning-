"""Server-side Resend notifications for new booking requests."""
from __future__ import annotations

import logging
from html import escape
from urllib.parse import quote

import resend
from resend.exceptions import ResendError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal
from app.models import Booking, CustomerChangeRequest
from app.security import hash_token_identifier

logger = logging.getLogger("brightnest.notifications")
settings = get_settings()


def _booking_email_html(booking: Booking) -> str:
    rows = [
        ("Reference", booking.id),
        ("Customer", booking.customer_name),
        ("Email", booking.customer_email),
        ("Phone", booking.customer_phone or "Not provided"),
        ("Service", booking.service_type),
        ("Frequency", booking.frequency),
        ("Preferred date", str(booking.preferred_date)),
        ("Preferred time", booking.preferred_time.strftime("%H:%M")),
        ("Postcode", booking.postcode),
        ("Notes", booking.notes or "No additional notes"),
    ]
    rendered_rows = "".join(
        f"<tr><th style='text-align:left;padding:8px;border-bottom:1px solid #e5e7eb'>{escape(label)}</th>"
        f"<td style='padding:8px;border-bottom:1px solid #e5e7eb'>{escape(value)}</td></tr>"
        for label, value in rows
    )
    return f"<h2>New BrightNest booking request</h2><table style='border-collapse:collapse'>{rendered_rows}</table>"


async def notify_customer_change_request(change_request_id: str) -> None:
    """Alert the BrightNest team about a customer booking-change request."""
    session: Session = SessionLocal()
    try:
        change_request = session.get(CustomerChangeRequest, change_request_id)
        if change_request is None or change_request.booking is None:
            return
        if settings.resend_api_key is None:
            logger.warning("Change-request notification skipped because Resend is not configured request_id=%s", change_request_id)
            return
        booking = change_request.booking
        resend.api_key = settings.resend_api_key.get_secret_value()
        requested_visit = ""
        if change_request.requested_date is not None and change_request.requested_time is not None:
            requested_visit = f"<tr><th style='text-align:left;padding:8px;border-bottom:1px solid #e5e7eb'>Requested new visit</th><td style='padding:8px;border-bottom:1px solid #e5e7eb'>{escape(str(change_request.requested_date))} at {escape(change_request.requested_time.strftime('%H:%M'))}</td></tr>"
        rows = "".join([
            f"<tr><th style='text-align:left;padding:8px;border-bottom:1px solid #e5e7eb'>Request</th><td style='padding:8px;border-bottom:1px solid #e5e7eb'>{escape(change_request.request_type.value)}</td></tr>",
            f"<tr><th style='text-align:left;padding:8px;border-bottom:1px solid #e5e7eb'>Reference</th><td style='padding:8px;border-bottom:1px solid #e5e7eb'>{escape(booking.id)}</td></tr>",
            f"<tr><th style='text-align:left;padding:8px;border-bottom:1px solid #e5e7eb'>Customer</th><td style='padding:8px;border-bottom:1px solid #e5e7eb'>{escape(booking.customer_name)} ({escape(booking.customer_email)})</td></tr>",
            f"<tr><th style='text-align:left;padding:8px;border-bottom:1px solid #e5e7eb'>Current visit</th><td style='padding:8px;border-bottom:1px solid #e5e7eb'>{escape(str(booking.preferred_date))} at {escape(booking.preferred_time.strftime('%H:%M'))}</td></tr>",
            requested_visit,
            f"<tr><th style='text-align:left;padding:8px;border-bottom:1px solid #e5e7eb'>Message</th><td style='padding:8px;border-bottom:1px solid #e5e7eb'>{escape(change_request.message or 'No additional message')}</td></tr>",
        ])
        params: resend.Emails.SendParams = {
            "from": settings.email_from,
            "to": [str(settings.admin_notification_email)],
            "reply_to": booking.customer_email,
            "subject": f"Customer {change_request.request_type.value} request: {booking.service_type}",
            "html": f"<h2>BrightNest customer booking-change request</h2><table style='border-collapse:collapse'>{rows}</table>",
            "tags": [{"name": "booking_id", "value": booking.id}, {"name": "event", "value": "customer_change_requested"}],
        }
        options: resend.Emails.SendOptions = {"idempotency_key": f"customer-change-request/{change_request.id}"}
        await resend.Emails.send_async(params, options)
    except ResendError:
        logger.exception("Customer change-request notification failed request_id=%s", change_request_id)
    except Exception:
        logger.exception("Unexpected customer change-request notification failure request_id=%s", change_request_id)
    finally:
        session.close()


async def send_customer_magic_link(customer_email: str, raw_token: str) -> bool:
    """Send a customer dashboard link without exposing booking data in the URL."""
    if settings.resend_api_key is None:
        logger.warning("Customer magic link skipped because Resend is not configured email=%s", customer_email)
        return False
    resend.api_key = settings.resend_api_key.get_secret_value()
    link = f"{settings.frontend_base_url.rstrip('/')}/dashboard?token={quote(raw_token)}"
    html = (
        "<h2>Your BrightNest booking dashboard</h2>"
        "<p>Use the secure link below to view your upcoming and past booking requests.</p>"
        f"<p><a href=\"{escape(link)}\">Open my booking dashboard</a></p>"
        f"<p>This link expires in {settings.customer_magic_link_minutes} minutes and can only be used to access bookings for this email address.</p>"
    )
    params: resend.Emails.SendParams = {
        "from": settings.email_from,
        "to": [customer_email],
        "subject": "Your BrightNest booking dashboard",
        "html": html,
        "tags": [{"name": "event", "value": "customer_magic_link"}, {"name": "email_hash", "value": hash_token_identifier(customer_email.lower())}],
    }
    options: resend.Emails.SendOptions = {"idempotency_key": f"customer-magic-link/{hash_token_identifier(raw_token)}"}
    try:
        await resend.Emails.send_async(params, options)
        return True
    except ResendError:
        logger.exception("Customer magic-link delivery failed email=%s", customer_email)
        return False


async def notify_new_booking(booking_id: str) -> None:
    """Send an idempotent internal alert and store only delivery state, never credentials."""
    session: Session = SessionLocal()
    try:
        booking = session.get(Booking, booking_id)
        if booking is None:
            return
        if settings.resend_api_key is None:
            booking.email_status = "not_configured"
            session.commit()
            logger.warning("Booking notification skipped because Resend is not configured booking_id=%s", booking_id)
            return
        resend.api_key = settings.resend_api_key.get_secret_value()
        params: resend.Emails.SendParams = {
            "from": settings.email_from,
            "to": [str(settings.admin_notification_email)],
            "reply_to": booking.customer_email,
            "subject": f"New booking request: {booking.service_type}",
            "html": _booking_email_html(booking),
            "tags": [{"name": "booking_id", "value": booking.id}, {"name": "event", "value": "booking_created"}],
        }
        options: resend.Emails.SendOptions = {"idempotency_key": f"booking-created/{booking.id}"}
        await resend.Emails.send_async(params, options)
        booking.email_status = "sent"
        session.commit()
    except ResendError:
        session.rollback()
        logger.exception("Booking notification failed booking_id=%s", booking_id)
        if booking := session.get(Booking, booking_id):
            booking.email_status = "failed"
            session.commit()
    except Exception:
        session.rollback()
        logger.exception("Unexpected booking notification failure booking_id=%s", booking_id)
    finally:
        session.close()
