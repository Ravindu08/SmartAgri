"""add marketplace location image listing_type

Revision ID: h9i0j1k2l3m4
Revises: f7a8b9c0d1e2
Branch Labels: None
Depends On: None

"""
from alembic import op
import sqlalchemy as sa


revision = 'h9i0j1k2l3m4'
down_revision = 'b3c4d5e6f7a8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('marketplace_listings', sa.Column('location', sa.String(length=255), nullable=True))
    op.add_column('marketplace_listings', sa.Column('image', sa.Text(), nullable=True))
    op.add_column('marketplace_listings', sa.Column('listing_type', sa.String(length=32), nullable=False, server_default='crop'))


def downgrade() -> None:
    op.drop_column('marketplace_listings', 'listing_type')
    op.drop_column('marketplace_listings', 'image')
    op.drop_column('marketplace_listings', 'location')
