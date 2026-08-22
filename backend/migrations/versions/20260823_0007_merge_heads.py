"""Merge the privacy-consent and growth-compliance migration branches.

Revision ID: 20260823_0007
Revises: 20260820_0002, 20260821_0006
"""

revision = "20260823_0007"
down_revision = ("20260820_0002", "20260821_0006")
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Join the existing branches; both parent migrations already ran their changes."""


def downgrade() -> None:
    """Move back to the two parent heads without reversing either branch."""
