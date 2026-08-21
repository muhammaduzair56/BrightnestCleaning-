"""Add booking pricing and payment metadata.

Revision ID: 20260821_0004
Revises: 20260821_0003
"""
from alembic import op
import sqlalchemy as sa


revision = "20260821_0004"
down_revision = "20260821_0003"
branch_labels = None
depends_on = None


payment_status = sa.Enum("unpaid", "paid", "partially_refunded", "refunded", "failed", name="payment_status")


def upgrade() -> None:
    bind = op.get_bind()
    payment_status.create(bind, checkfirst=True)
    op.add_column("bookings", sa.Column("currency", sa.String(length=3), server_default="GBP", nullable=False))
    op.add_column("bookings", sa.Column("subtotal_pence", sa.Integer(), nullable=True))
    op.add_column("bookings", sa.Column("tax_rate_basis_points", sa.Integer(), nullable=True))
    op.add_column("bookings", sa.Column("tax_pence", sa.Integer(), nullable=True))
    op.add_column("bookings", sa.Column("total_pence", sa.Integer(), nullable=True))
    op.add_column("bookings", sa.Column("payment_status", payment_status, server_default="unpaid", nullable=False))
    op.add_column("bookings", sa.Column("payment_provider", sa.String(length=32), nullable=True))
    op.add_column("bookings", sa.Column("payment_reference", sa.String(length=128), nullable=True))
    op.add_column("bookings", sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_bookings_payment_status", "bookings", ["payment_status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_bookings_payment_status", table_name="bookings")
    op.drop_column("bookings", "paid_at")
    op.drop_column("bookings", "payment_reference")
    op.drop_column("bookings", "payment_provider")
    op.drop_column("bookings", "payment_status")
    op.drop_column("bookings", "total_pence")
    op.drop_column("bookings", "tax_pence")
    op.drop_column("bookings", "tax_rate_basis_points")
    op.drop_column("bookings", "subtotal_pence")
    op.drop_column("bookings", "currency")
    bind = op.get_bind()
    payment_status.drop(bind, checkfirst=True)
