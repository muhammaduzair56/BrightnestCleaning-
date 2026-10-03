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
    smtp_timeout = settings.smtp_timeout_seconds

    def open_client(port: int) -> smtplib.SMTP:
        if port == 465:
            return smtplib.SMTP_SSL(
                smtp_host,
                port,
                context=ssl.create_default_context(),
                timeout=smtp_timeout,
            )
        return smtplib.SMTP(smtp_host, port, timeout=smtp_timeout)

    try:
        smtp_client = open_client(smtp_port)
    except (OSError, TimeoutError):
        if smtp_port != 587:
            raise
        logger.warning("SMTP port 587 was unreachable; retrying Brevo on port 2525")
        smtp_port = 2525
        smtp_client = open_client(smtp_port)

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


def _booking_confirmation_html(booking: Booking) -> str:
    """Build the customer-facing BrightNest confirmation email with inline CSS."""
    logo_url = escape(settings.email_logo_url, quote=True)
    booking_reference = escape(booking.id)
    customer_name = escape(booking.customer_name)
    service_type = escape(booking.service_type)
    frequency = escape(booking.frequency)
    preferred_date = escape(str(booking.preferred_date))
    preferred_time = escape(booking.preferred_time.strftime("%H:%M"))
    postcode = escape(booking.postcode)
    phone = escape(booking.customer_phone or "Not provided")
    details = ""
    if booking.bedrooms or booking.bathrooms:
        details = f"{booking.bedrooms} bedroom(s) · {booking.bathrooms} bathroom(s)"
    if booking.bin_cleaning:
        details = f"{details} · Bin cleaning" if details else "Bin cleaning"
    details_row = f"<tr><td style='padding:13px 0;color:#647477;font-size:13px'>Property details</td><td style='padding:13px 0;text-align:right;color:#173137;font-weight:700;font-size:13px'>{escape(details or 'Specialist service — scope to be confirmed')}</td></tr>"
    whatsapp_url = "https://wa.me/447859293986?text=Hello%20BrightNest%2C%20I%20have%20a%20booking%20request%20question."
    return f"""<!doctype html>
<html><body style="margin:0;background:#f3f0e7;font-family:Arial,Helvetica,sans-serif;color:#173137">
  <div style="padding:28px 12px">
    <div style="max-width:620px;margin:0 auto;background:#fffdf7;border-radius:24px;overflow:hidden;border:1px solid #dce7df">
      <div style="background:#173137;padding:24px 30px;text-align:center">
        <img src="{logo_url}" width="190" alt="BrightNest Cleaning UK" style="display:inline-block;max-width:190px;height:auto;background:#fffdf7;border-radius:12px;padding:6px">
      </div>
      <div style="padding:34px 30px 28px">
        <p style="margin:0;color:#23786f;font-size:11px;letter-spacing:2px;font-weight:700;text-transform:uppercase">Booking request received</p>
        <h1 style="margin:12px 0 14px;font-size:30px;line-height:1.12;color:#173137">Thank you, {customer_name}.</h1>
        <p style="margin:0;color:#526568;font-size:15px;line-height:1.7">We have received your cleaning request. Our team will review the details and contact you to confirm availability and the final quote.</p>
        <div style="margin:26px 0 0;padding:18px 20px;background:#d9f0e8;border-radius:16px;text-align:center">
          <p style="margin:0;color:#23786f;font-size:11px;letter-spacing:1.5px;font-weight:700;text-transform:uppercase">Your reference</p>
          <p style="margin:7px 0 0;color:#173137;font-size:17px;font-weight:700;word-break:break-all">{booking_reference}</p>
        </div>
        <h2 style="margin:30px 0 8px;color:#173137;font-size:20px">Request summary</h2>
        <table role="presentation" width="100%" style="border-collapse:collapse;border-top:1px solid #dce7df">
          <tr><td style="padding:13px 0;color:#647477;font-size:13px">Service</td><td style="padding:13px 0;text-align:right;color:#173137;font-weight:700;font-size:13px">{service_type}</td></tr>
          <tr><td style="padding:13px 0;color:#647477;font-size:13px;border-top:1px solid #e8eee9">Visit rhythm</td><td style="padding:13px 0;text-align:right;color:#173137;font-weight:700;font-size:13px;border-top:1px solid #e8eee9">{frequency}</td></tr>
          <tr><td style="padding:13px 0;color:#647477;font-size:13px;border-top:1px solid #e8eee9">Preferred visit</td><td style="padding:13px 0;text-align:right;color:#173137;font-weight:700;font-size:13px;border-top:1px solid #e8eee9">{preferred_date} at {preferred_time}</td></tr>
          <tr><td style="padding:13px 0;color:#647477;font-size:13px;border-top:1px solid #e8eee9">Postcode</td><td style="padding:13px 0;text-align:right;color:#173137;font-weight:700;font-size:13px;border-top:1px solid #e8eee9">{postcode}</td></tr>
          <tr><td style="padding:13px 0;color:#647477;font-size:13px;border-top:1px solid #e8eee9">Phone</td><td style="padding:13px 0;text-align:right;color:#173137;font-weight:700;font-size:13px;border-top:1px solid #e8eee9">{phone}</td></tr>
          {details_row}
        </table>
        <div style="margin:25px 0 0;padding:16px 18px;border-left:4px solid #2f9f91;background:#f1f7f2;color:#526568;font-size:13px;line-height:1.65">No payment is required today. Your visit is confirmed after BrightNest reviews your request and agrees the scope and quote with you.</div>
        <div style="margin:26px 0 4px;text-align:center">
          <a href="{whatsapp_url}" style="display:inline-block;background:#173137;color:#fffdf7;text-decoration:none;border-radius:999px;padding:13px 21px;font-size:13px;font-weight:700">Message us on WhatsApp</a>
        </div>
        <p style="margin:20px 0 0;color:#718083;font-size:12px;line-height:1.6;text-align:center">Questions? Reply to this email or call +44 7859 293986.</p>
      </div>
      <div style="padding:20px 30px;background:#173137;color:#d9f0e8;text-align:center;font-size:11px;line-height:1.6">BrightNest Cleaning UK · Thoughtful cleaning across the UK<br>This is an acknowledgement of your request, not a final booking confirmation.</div>
    </div>
  </div>
</body></html>"""


async def notify_customer_booking_confirmation(booking_id: str) -> None:
    """Send a branded acknowledgement to the customer without blocking booking creation."""
    session: Session = SessionLocal()
    try:
        booking = session.get(Booking, booking_id)
        if booking is None or not booking.customer_email or not _smtp_is_configured():
            return
        await asyncio.to_thread(
            _send_email_sync,
            recipients=[booking.customer_email],
            reply_to=str(settings.admin_notification_email),
            subject=f"We received your BrightNest booking request · {booking.id[:8]}",
            html=_booking_confirmation_html(booking),
        )
        logger.info("Customer booking confirmation sent booking_id=%s", booking_id)
    except Exception:
        logger.exception("Customer booking confirmation failed booking_id=%s", booking_id)
    finally:
        session.close()


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
