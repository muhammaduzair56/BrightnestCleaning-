"""Add admin resolution fields to customer change requests.

Revision ID: 20260821_0005
Revises: 20260821_0004
"""
from alembic import op
import sqlalchemy as sa

revision = "20260821_0005"
down_revision = "20260821_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("customer_change_requests", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("customer_change_requests", sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("customer_change_requests", sa.Column("resolved_by_admin_id", sa.String(length=36), nullable=True))
    op.add_column("customer_change_requests", sa.Column("resolution", sa.String(length=16), nullable=True))
    op.add_column("customer_change_requests", sa.Column("resolution_note", sa.Text(), nullable=True))
    op.create_index("ix_customer_change_requests_resolved_by_admin_id", "customer_change_requests", ["resolved_by_admin_id"], unique=False)
    op.create_foreign_key(
        "fk_customer_change_requests_resolved_by_admin_id",
        "customer_change_requests",
        "admin_users",
        ["resolved_by_admin_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_customer_change_requests_resolved_by_admin_id", "customer_change_requests", type_="foreignkey")
    op.drop_index("ix_customer_change_requests_resolved_by_admin_id", table_name="customer_change_requests")
    op.drop_column("customer_change_requests", "resolution_note")
    op.drop_column("customer_change_requests", "resolution")
    op.drop_column("customer_change_requests", "resolved_by_admin_id")
    op.drop_column("customer_change_requests", "resolved_at")
    op.drop_column("customer_change_requests", "reviewed_at")
