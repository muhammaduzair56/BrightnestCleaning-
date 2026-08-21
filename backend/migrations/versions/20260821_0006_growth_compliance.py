"""Add growth and compliance tracking tables.

Revision ID: 20260821_0006
Revises: 20260821_0005
"""
from alembic import op
import sqlalchemy as sa

revision = "20260821_0006"
down_revision = "20260821_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "referral_codes",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("discount_percent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_redemptions", sa.Integer(), nullable=True),
        sa.Column("redemption_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_referral_codes_code", "referral_codes", ["code"], unique=False)
    op.create_index("ix_referral_codes_active_expires_at", "referral_codes", ["active", "expires_at"], unique=False)
    op.create_table(
        "recurring_booking_plans",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("source_booking_id", sa.String(length=36), sa.ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_email", sa.String(length=320), nullable=False),
        sa.Column("frequency", sa.String(length=32), nullable=False),
        sa.Column("next_date", sa.Date(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("last_generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_recurring_booking_plans_source_booking_id", "recurring_booking_plans", ["source_booking_id"], unique=False)
    op.create_index("ix_recurring_booking_plans_customer_email", "recurring_booking_plans", ["customer_email"], unique=False)
    op.create_index("ix_recurring_booking_plans_due_active", "recurring_booking_plans", ["next_date", "active"], unique=False)
    op.create_table(
        "customer_data_requests",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("customer_email", sa.String(length=320), nullable=False),
        sa.Column("request_type", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="requested"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_customer_data_requests_customer_email", "customer_data_requests", ["customer_email"], unique=False)
    op.create_index("ix_customer_data_requests_email_status", "customer_data_requests", ["customer_email", "status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_customer_data_requests_email_status", table_name="customer_data_requests")
    op.drop_index("ix_customer_data_requests_customer_email", table_name="customer_data_requests")
    op.drop_table("customer_data_requests")
    op.drop_index("ix_recurring_booking_plans_due_active", table_name="recurring_booking_plans")
    op.drop_index("ix_recurring_booking_plans_customer_email", table_name="recurring_booking_plans")
    op.drop_index("ix_recurring_booking_plans_source_booking_id", table_name="recurring_booking_plans")
    op.drop_table("recurring_booking_plans")
    op.drop_index("ix_referral_codes_active_expires_at", table_name="referral_codes")
    op.drop_index("ix_referral_codes_code", table_name="referral_codes")
    op.drop_table("referral_codes")
