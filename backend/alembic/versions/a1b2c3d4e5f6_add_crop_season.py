"""add_crop_season

Revision ID: a1b2c3d4e5f6
Revises: 387d70c71ee7
Create Date: 2026-06-10 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'a1b2c3d4e5f6'
down_revision = '387d70c71ee7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('crops', sa.Column('season', sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column('crops', 'season')
