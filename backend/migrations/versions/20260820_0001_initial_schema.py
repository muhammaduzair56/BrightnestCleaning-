"""Create BrightNest administration, bookings, refresh-token, and audit tables."""
from alembic import op
import sqlalchemy as sa


revision = "20260820_0001"
down_revision = None
branch_labels = None
depends_on = None

# Create enum types explicitly in upgrade() with checkfirst=True, then prevent
# SQLAlchemy from issuing a second CREATE TYPE while creating the tables.
user_role = sa.Enum("admin", name="user_role", create_type=False)
booking_status = sa.Enum(
    "new",
    "contacted",
    "confirmed",
    "cancelled",
    "completed",
    name="booking_status",
    create_type=False,
)


def upgrade() -> None:
    user_role.create(op.get_bind(), checkfirst=True)
    booking_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "admin_users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="admin"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("email", name="uq_admin_users_email"),
    )
    op.create_index("ix_admin_users_email", "admin_users", ["email"])
    op.create_table(
        "bookings",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("customer_name", sa.String(length=120), nullable=False),
        sa.Column("customer_email", sa.String(length=320), nullable=False),
        sa.Column("customer_phone", sa.String(length=32)),
        sa.Column("postcode", sa.String(length=16), nullable=False),
        sa.Column("service_type", sa.String(length=80), nullable=False),
        sa.Column("frequency", sa.String(length=32), nullable=False),
        sa.Column("preferred_date", sa.Date(), nullable=False),
        sa.Column("preferred_time", sa.Time(), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("status", booking_status, nullable=False, server_default="new"),
        sa.Column("admin_notes", sa.Text()),
        sa.Column("assigned_admin_id", sa.String(length=36), sa.ForeignKey("admin_users.id", ondelete="SET NULL")),
        sa.Column("email_status", sa.String(length=24), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    for name, columns in {
        "ix_bookings_customer_email": ["customer_email"],
        "ix_bookings_postcode": ["postcode"],
        "ix_bookings_service_type": ["service_type"],
        "ix_bookings_preferred_date": ["preferred_date"],
        "ix_bookings_status": ["status"],
        "ix_bookings_assigned_admin_id": ["assigned_admin_id"],
        "ix_bookings_created_at": ["created_at"],
        "ix_bookings_status_created_at": ["status", "created_at"],
        "ix_bookings_customer_email_created_at": ["customer_email", "created_at"],
        "ix_bookings_service_type_scheduled_date": ["service_type", "preferred_date"],
    }.items():
        op.create_index(name, "bookings", columns)
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("jti_hash", sa.String(length=64), nullable=False),
        sa.Column("admin_id", sa.String(length=36), sa.ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("jti_hash", name="uq_refresh_tokens_jti_hash"),
    )
    op.create_index("ix_refresh_tokens_jti_hash", "refresh_tokens", ["jti_hash"])
    op.create_index("ix_refresh_tokens_admin_id", "refresh_tokens", ["admin_id"])
    op.create_index("ix_refresh_tokens_expires_at", "refresh_tokens", ["expires_at"])
    op.create_table(
        "audit_events",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("admin_id", sa.String(length=36), sa.ForeignKey("admin_users.id", ondelete="SET NULL")),
        sa.Column("booking_id", sa.String(length=36), sa.ForeignKey("bookings.id", ondelete="SET NULL")),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("metadata_json", sa.JSON()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    for name, columns in {
        "ix_audit_events_admin_id": ["admin_id"],
        "ix_audit_events_booking_id": ["booking_id"],
        "ix_audit_events_action": ["action"],
        "ix_audit_events_created_at": ["created_at"],
        "ix_audit_events_admin_created_at": ["admin_id", "created_at"],
        "ix_audit_events_booking_created_at": ["booking_id", "created_at"],
    }.items():
        op.create_index(name, "audit_events", columns)


def downgrade() -> None:
    op.drop_table("audit_events")
    op.drop_table("refresh_tokens")
    op.drop_table("bookings")
    op.drop_table("admin_users")
    booking_status.drop(op.get_bind(), checkfirst=True)
    user_role.drop(op.get_bind(), checkfirst=True)
