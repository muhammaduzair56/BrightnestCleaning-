"""Server-side Resend notifications for new booking requests."""
from __future__ import annotations

import logging
from html import escape

import resend
from resend.exceptions import ResendError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal
from app.models import Booking

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
