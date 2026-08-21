"""Create customer magic-link access records.

Revision ID: 20260821_0002
Revises: 20260820_0001
"""
from alembic import op
import sqlalchemy as sa


revision = "20260821_0002"
down_revision = "20260820_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "customer_magic_links",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("customer_email", sa.String(length=320), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash", name="uq_customer_magic_links_token_hash"),
    )
    op.create_index("ix_customer_magic_links_token_hash", "customer_magic_links", ["token_hash"], unique=True)
    op.create_index("ix_customer_magic_links_customer_email", "customer_magic_links", ["customer_email"], unique=False)
    op.create_index("ix_customer_magic_links_expires_at", "customer_magic_links", ["expires_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_customer_magic_links_expires_at", table_name="customer_magic_links")
    op.drop_index("ix_customer_magic_links_customer_email", table_name="customer_magic_links")
    op.drop_index("ix_customer_magic_links_token_hash", table_name="customer_magic_links")
    op.drop_table("customer_magic_links")
