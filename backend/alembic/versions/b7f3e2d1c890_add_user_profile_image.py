"""add_user_profile_image

Revision ID: b7f3e2d1c890
Revises: a1b2c3d4e5f6
Create Date: 2026-06-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'b7f3e2d1c890'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('profile_image', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'profile_image')
