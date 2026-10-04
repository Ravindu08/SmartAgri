"""add token_version to users so a password change signs out other devices

Revision ID: p6q7r8s9t0u1
Revises: o5p6q7r8s9t0
Create Date: 2026-10-04
"""
from alembic import op
import sqlalchemy as sa

revision = 'p6q7r8s9t0u1'
down_revision = 'o5p6q7r8s9t0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('token_version', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('users', 'token_version')
