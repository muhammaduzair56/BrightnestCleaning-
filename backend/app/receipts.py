"""PDF service receipts for completed BrightNest bookings.

Receipts intentionally contain service-record details only. No amount, tax, or payment
status is inferred because the booking table does not store financial transactions.
"""
from __future__ import annotations

from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models import Booking


INK = colors.HexColor("#173137")
MINT = colors.HexColor("#2F9F91")
IVORY = colors.HexColor("#F8F6EF")
MUTED = colors.HexColor("#607276")


def _paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(escape(text).replace("\n", "<br/>"), style)


def build_completed_receipt_pdf(booking: Booking) -> bytes:
    """Return a downloadable service receipt for one completed booking."""
    output = BytesIO()
    document = SimpleDocTemplate(
        output,
        pagesize=A4,
        rightMargin=22 * mm,
        leftMargin=22 * mm,
        topMargin=22 * mm,
        bottomMargin=20 * mm,
        title=f"BrightNest service receipt {booking.id[:8].upper()}",
        author="BrightNest Cleaning UK",
    )
    styles = getSampleStyleSheet()
    title = ParagraphStyle("ReceiptTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=29, textColor=INK, alignment=TA_LEFT, spaceAfter=4)
    subtitle = ParagraphStyle("ReceiptSubtitle", parent=styles["Normal"], fontName="Helvetica", fontSize=10, leading=15, textColor=MUTED)
    section = ParagraphStyle("ReceiptSection", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=MINT, spaceBefore=15, spaceAfter=7)
    body = ParagraphStyle("ReceiptBody", parent=styles["Normal"], fontName="Helvetica", fontSize=10, leading=15, textColor=INK)
    label = ParagraphStyle("ReceiptLabel", parent=body, fontName="Helvetica-Bold", textColor=MUTED)
    value = ParagraphStyle("ReceiptValue", parent=body, fontName="Helvetica-Bold")
    small = ParagraphStyle("ReceiptSmall", parent=body, fontSize=8, leading=12, textColor=MUTED)

    story = [
        _paragraph("BrightNest", title),
        _paragraph("Cleaning UK · Thoughtful domestic & specialist care", subtitle),
        Spacer(1, 13 * mm),
        _paragraph("SERVICE RECEIPT", section),
        _paragraph("Thank you for trusting BrightNest with your home. This receipt records the completed service attached to your booking reference.", body),
        Spacer(1, 5 * mm),
    ]

    service_rows = [
        [_paragraph("Booking reference", label), _paragraph(booking.id[:8].upper(), value)],
        [_paragraph("Customer", label), _paragraph(booking.customer_name, value)],
        [_paragraph("Service", label), _paragraph(booking.service_type, value)],
        [_paragraph("Visit type", label), _paragraph(booking.frequency, value)],
        [_paragraph("Completed visit", label), _paragraph(f"{booking.preferred_date} at {booking.preferred_time.strftime('%H:%M')}", value)],
        [_paragraph("Postcode", label), _paragraph(booking.postcode, value)],
        [_paragraph("Status", label), _paragraph("Completed", value)],
    ]
    service_table = Table(service_rows, colWidths=[47 * mm, 105 * mm], hAlign="LEFT")
    service_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D9E3DF")),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#E8EEEA")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(service_table)
    story.extend([
        _paragraph("PAYMENT NOTE", section),
        _paragraph("This service receipt confirms the completed booking record. Payment amounts and tax details are not stored in the BrightNest booking system and are therefore not shown here.", body),
        _paragraph(f"Customer notes: {booking.notes or 'No additional notes recorded.'}", small),
        Spacer(1, 18 * mm),
        _paragraph("BrightNest Cleaning UK", body),
        _paragraph("Thoughtful cleaning across Birmingham and surrounding areas.", subtitle),
    ])

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(IVORY)
        canvas.rect(0, 0, A4[0], 12 * mm, fill=1, stroke=0)
        canvas.setFillColor(MINT)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.drawString(22 * mm, 6 * mm, "BRIGHTNEST CLEANING UK")
        canvas.setFillColor(MUTED)
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(A4[0] - 22 * mm, 6 * mm, f"Page {doc.page}")
        canvas.restoreState()

    document.build(story, onFirstPage=footer, onLaterPages=footer)
    return output.getvalue()
