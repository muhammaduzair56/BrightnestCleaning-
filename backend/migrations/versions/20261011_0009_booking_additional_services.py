"""Add structured additional cleaning service details to bookings.

Revision ID: 20261011_0009
Revises: 20260823_0008
"""
from alembic import op
import sqlalchemy as sa


revision = "20261011_0009"
down_revision = "20260823_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("bookings", sa.Column("additional_services", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("bookings", "additional_services")
