"""add email_code_expires column for OTP expiry

Revision ID: l2m3n4o5p6q7
Revises: k1l2m3n4o5p6
Create Date: 2026-06-23
"""
from alembic import op
import sqlalchemy as sa

revision = 'l2m3n4o5p6q7'
down_revision = 'k1l2m3n4o5p6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('email_code_expires', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'email_code_expires')
