"""Add property details to bookings.

Revision ID: 20260823_0008
Revises: 20260823_0007
"""
from alembic import op
import sqlalchemy as sa

revision = "20260823_0008"
down_revision = "20260823_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("bookings", sa.Column("bedrooms", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("bookings", sa.Column("bathrooms", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("bookings", sa.Column("bin_cleaning", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.alter_column("bookings", "bedrooms", server_default=None)
    op.alter_column("bookings", "bathrooms", server_default=None)
    op.alter_column("bookings", "bin_cleaning", server_default=None)


def downgrade() -> None:
    op.drop_column("bookings", "bin_cleaning")
    op.drop_column("bookings", "bathrooms")
    op.drop_column("bookings", "bedrooms")
