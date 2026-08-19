"""Database entities and performance indexes for BrightNest bookings and administration."""
from __future__ import annotations

import enum
import uuid
from datetime import date, datetime, time

from sqlalchemy import JSON, Boolean, Date, DateTime, Enum, ForeignKey, Index, String, Text, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def uuid_string() -> str:
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    ADMIN = "admin"


class BookingStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.ADMIN)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    assigned_bookings: Mapped[list[Booking]] = relationship(back_populates="assigned_admin")
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(back_populates="admin", cascade="all, delete-orphan")
    audit_events: Mapped[list[AuditEvent]] = relationship(back_populates="admin")


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        Index("ix_bookings_status_created_at", "status", "created_at"),
        Index("ix_bookings_customer_email_created_at", "customer_email", "created_at"),
        Index("ix_bookings_service_type_scheduled_date", "service_type", "preferred_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    customer_name: Mapped[str] = mapped_column(String(120), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(320), nullable=False, index=True)
    customer_phone: Mapped[str | None] = mapped_column(String(32))
    postcode: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    service_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    frequency: Mapped[str] = mapped_column(String(32), nullable=False)
    preferred_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    preferred_time: Mapped[time] = mapped_column(Time, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus, name="booking_status"), nullable=False, default=BookingStatus.NEW, index=True)
    admin_notes: Mapped[str | None] = mapped_column(Text)
    assigned_admin_id: Mapped[str | None] = mapped_column(ForeignKey("admin_users.id", ondelete="SET NULL"), index=True)
    email_status: Mapped[str] = mapped_column(String(24), nullable=False, default="pending")
    privacy_consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    assigned_admin: Mapped[AdminUser | None] = relationship(back_populates="assigned_bookings")
    audit_events: Mapped[list[AuditEvent]] = relationship(back_populates="booking", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    jti_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    admin_id: Mapped[str] = mapped_column(ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    admin: Mapped[AdminUser] = relationship(back_populates="refresh_tokens")


class AuditEvent(Base):
    __tablename__ = "audit_events"
    __table_args__ = (
        Index("ix_audit_events_admin_created_at", "admin_id", "created_at"),
        Index("ix_audit_events_booking_created_at", "booking_id", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_string)
    admin_id: Mapped[str | None] = mapped_column(ForeignKey("admin_users.id", ondelete="SET NULL"), index=True)
    booking_id: Mapped[str | None] = mapped_column(ForeignKey("bookings.id", ondelete="SET NULL"), index=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    metadata_json: Mapped[dict[str, object] | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    admin: Mapped[AdminUser | None] = relationship(back_populates="audit_events")
    booking: Mapped[Booking | None] = relationship(back_populates="audit_events")
