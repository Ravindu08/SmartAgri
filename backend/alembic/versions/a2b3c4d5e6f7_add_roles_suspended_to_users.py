"""add roles and is_suspended to users

Revision ID: a2b3c4d5e6f7
Revises: f7a8b9c0d1e2
Create Date: 2026-06-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'a2b3c4d5e6f7'
down_revision = 'f7a8b9c0d1e2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('roles', sa.JSON(), nullable=True))
    op.add_column('users', sa.Column('is_suspended', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('users', 'is_suspended')
    op.drop_column('users', 'roles')
