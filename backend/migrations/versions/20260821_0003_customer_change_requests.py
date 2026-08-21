"""Add customer reschedule and cancellation requests.

Revision ID: 20260821_0003
Revises: 20260821_0002
"""
from alembic import op
import sqlalchemy as sa


revision = "20260821_0003"
down_revision = "20260821_0002"
branch_labels = None
depends_on = None


customer_request_type = sa.Enum("reschedule", "cancel", name="customer_change_request_type")
customer_request_status = sa.Enum("requested", "reviewed", "resolved", name="customer_change_request_status")


def upgrade() -> None:
    bind = op.get_bind()
    customer_request_type.create(bind, checkfirst=True)
    customer_request_status.create(bind, checkfirst=True)
    op.create_table(
        "customer_change_requests",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("booking_id", sa.String(length=36), nullable=False),
        sa.Column("customer_email", sa.String(length=320), nullable=False),
        sa.Column("request_type", customer_request_type, nullable=False),
        sa.Column("requested_date", sa.Date(), nullable=True),
        sa.Column("requested_time", sa.Time(), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", customer_request_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_customer_change_requests_booking_id", "customer_change_requests", ["booking_id"], unique=False)
    op.create_index("ix_customer_change_requests_customer_email", "customer_change_requests", ["customer_email"], unique=False)
    op.create_index("ix_customer_change_requests_status", "customer_change_requests", ["status"], unique=False)
    op.create_index("ix_customer_change_requests_booking_status", "customer_change_requests", ["booking_id", "status"], unique=False)
    op.create_index("ix_customer_change_requests_email_created_at", "customer_change_requests", ["customer_email", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_customer_change_requests_email_created_at", table_name="customer_change_requests")
    op.drop_index("ix_customer_change_requests_booking_status", table_name="customer_change_requests")
    op.drop_index("ix_customer_change_requests_status", table_name="customer_change_requests")
    op.drop_index("ix_customer_change_requests_customer_email", table_name="customer_change_requests")
    op.drop_index("ix_customer_change_requests_booking_id", table_name="customer_change_requests")
    op.drop_table("customer_change_requests")
    bind = op.get_bind()
    customer_request_status.drop(bind, checkfirst=True)
    customer_request_type.drop(bind, checkfirst=True)
