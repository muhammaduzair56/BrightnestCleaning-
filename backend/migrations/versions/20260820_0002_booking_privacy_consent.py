"""Record the timestamp for mandatory privacy-policy consent on each booking."""
from alembic import op
import sqlalchemy as sa


revision = "20260820_0002"
down_revision = "20260820_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "bookings",
        sa.Column("privacy_consent_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_column("bookings", "privacy_consent_at")
