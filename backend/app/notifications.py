"""Server-side SMTP notifications for BrightNest booking workflows."""
from __future__ import annotations

import asyncio
import logging
import smtplib
import ssl
from email.message import EmailMessage
from html import escape
from urllib.parse import quote

from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal
from app.models import Booking, CustomerChangeRequest
from app.security import hash_token_identifier

logger = logging.getLogger("brightnest.notifications")
settings = get_settings()


def _smtp_is_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_username and settings.smtp_password)


def _send_email_sync(*, recipients: list[str], subject: str, html: str, reply_to: str | None = None) -> None:
    """Send one HTML email over authenticated SMTP in a worker thread."""
    if not _smtp_is_configured():
        raise RuntimeError("SMTP notification settings are incomplete")

    message = EmailMessage()
    message["From"] = settings.email_from
    message["To"] = ", ".join(recipients)
    message["Subject"] = subject
    if reply_to:
        message["Reply-To"] = reply_to
    message.set_content("Please view this message in an HTML-capable email client.")
    message.add_alternative(html, subtype="html")

    smtp_host = settings.smtp_host
    smtp_port = settings.smtp_port
    smtp_username = settings.smtp_username
    smtp_password = settings.smtp_password.get_secret_value()
    if smtp_port == 465:
        smtp_client: smtplib.SMTP = smtplib.SMTP_SSL(
            smtp_host,
            smtp_port,
            context=ssl.create_default_context(),
            timeout=30,
        )
    else:
        smtp_client = smtplib.SMTP(smtp_host, smtp_port, timeout=30)

    with smtp_client as client:
        if smtp_port != 465:
            client.starttls(context=ssl.create_default_context())
        client.login(smtp_username, smtp_password)
        client.send_message(message)


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
        f"<td style='padding:8px;border-bottom:1px solid #e5e7eb'>{escape(str(value))}</td></tr>"
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
        if not _smtp_is_configured():
            logger.warning("Change-request notification skipped because SMTP is not configured request_id=%s", change_request_id)
            return
        booking = change_request.booking
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
        await asyncio.to_thread(
            _send_email_sync,
            recipients=[str(settings.admin_notification_email)],
            reply_to=booking.customer_email,
            subject=f"Customer {change_request.request_type.value} request: {booking.service_type}",
            html=f"<h2>BrightNest customer booking-change request</h2><table style='border-collapse:collapse'>{rows}</table>",
        )
    except Exception:
        logger.exception("Customer change-request notification failed request_id=%s", change_request_id)
    finally:
        session.close()


async def notify_customer_change_resolution(change_request_id: str) -> None:
    """Tell the customer how BrightNest resolved their booking-change request."""
    session: Session = SessionLocal()
    try:
        change_request = session.get(CustomerChangeRequest, change_request_id)
        if change_request is None or change_request.booking is None or not _smtp_is_configured():
            return
        booking = change_request.booking
        decision = "approved" if change_request.resolution == "approved" else "declined"
        decision_text = "approved" if decision == "approved" else "not approved"
        next_visit = f"{booking.preferred_date} at {booking.preferred_time.strftime('%H:%M')}"
        html = (
            "<h2>BrightNest booking-change update</h2>"
            f"<p>Your request to <strong>{escape(change_request.request_type.value)}</strong> booking "
            f"<strong>{escape(booking.id[:8])}</strong> has been <strong>{decision_text}</strong>.</p>"
            f"<p>Your current booking is scheduled for {escape(next_visit)}.</p>"
            f"<p>{escape(change_request.resolution_note or 'Please reply to this email if you need any further help.')}</p>"
        )
        await asyncio.to_thread(
            _send_email_sync,
            recipients=[booking.customer_email],
            subject=f"BrightNest booking-change request {decision_text}",
            html=html,
        )
    except Exception:
        logger.exception("Customer change resolution notification failed request_id=%s", change_request_id)
    finally:
        session.close()


async def send_customer_magic_link(customer_email: str, raw_token: str) -> bool:
    """Send a customer dashboard link without exposing booking data in the URL."""
    if not _smtp_is_configured():
        logger.warning("Customer magic link skipped because SMTP is not configured email=%s", customer_email)
        return False
    link = f"{settings.frontend_base_url.rstrip('/')}/dashboard?token={quote(raw_token)}"
    html = (
        "<h2>Your BrightNest booking dashboard</h2>"
        "<p>Use the secure link below to view your upcoming and past booking requests.</p>"
        f"<p><a href=\"{escape(link)}\">Open my booking dashboard</a></p>"
        f"<p>This link expires in {settings.customer_magic_link_minutes} minutes and can only be used to access bookings for this email address.</p>"
    )
    try:
        await asyncio.to_thread(
            _send_email_sync,
            recipients=[customer_email],
            subject="Your BrightNest booking dashboard",
            html=html,
        )
        return True
    except Exception:
        logger.exception("Customer magic-link delivery failed email=%s", customer_email)
        return False


async def notify_new_booking(booking_id: str) -> None:
    """Send an internal alert and store only delivery state, never credentials."""
    session: Session = SessionLocal()
    try:
        booking = session.get(Booking, booking_id)
        if booking is None:
            return
        if not _smtp_is_configured():
            booking.email_status = "not_configured"
            session.commit()
            logger.warning("Booking notification skipped because SMTP is not configured booking_id=%s", booking_id)
            return
        await asyncio.to_thread(
            _send_email_sync,
            recipients=[str(settings.admin_notification_email)],
            reply_to=booking.customer_email,
            subject=f"New booking request: {booking.service_type}",
            html=_booking_email_html(booking),
        )
        booking.email_status = "sent"
        session.commit()
    except Exception:
        session.rollback()
        logger.exception("Booking notification failed booking_id=%s", booking_id)
        if booking := session.get(Booking, booking_id):
            booking.email_status = "failed"
            session.commit()
    finally:
        session.close()
