"""add marketplace tables

Revision ID: f7a8b9c0d1e2
Revises: e5f6a7b8c9d0
Create Date: 2026-06-19 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'f7a8b9c0d1e2'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    marketplace_listing_status = sa.Enum('Active', 'Reserved', 'Sold', 'Archived', name='marketplace_listing_status')
    marketplace_order_status = sa.Enum('Pending', 'Confirmed', 'Delivered', 'Completed', 'Rejected', 'Cancelled', name='marketplace_order_status')

    op.create_table(
        'marketplace_listings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('crop_name', sa.String(length=255), nullable=False),
        sa.Column('crop_type', sa.String(length=128), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=32), nullable=False),
        sa.Column('price_per_unit', sa.Float(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', marketplace_listing_status, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_marketplace_listings_owner_id'), 'marketplace_listings', ['owner_id'], unique=False)

    op.create_table(
        'marketplace_orders',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('listing_id', sa.UUID(), nullable=False),
        sa.Column('buyer_id', sa.Integer(), nullable=False),
        sa.Column('seller_id', sa.Integer(), nullable=False),
        sa.Column('requested_quantity', sa.Float(), nullable=False),
        sa.Column('proposed_price', sa.Float(), nullable=True),
        sa.Column('agreed_price', sa.Float(), nullable=True),
        sa.Column('buyer_note', sa.Text(), nullable=True),
        sa.Column('seller_note', sa.Text(), nullable=True),
        sa.Column('counter_offer_price', sa.Float(), nullable=True),
        sa.Column('status', marketplace_order_status, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['buyer_id'], ['users.id']),
        sa.ForeignKeyConstraint(['listing_id'], ['marketplace_listings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_marketplace_orders_buyer_id'), 'marketplace_orders', ['buyer_id'], unique=False)
    op.create_index(op.f('ix_marketplace_orders_listing_id'), 'marketplace_orders', ['listing_id'], unique=False)
    op.create_index(op.f('ix_marketplace_orders_seller_id'), 'marketplace_orders', ['seller_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_marketplace_orders_seller_id'), table_name='marketplace_orders')
    op.drop_index(op.f('ix_marketplace_orders_listing_id'), table_name='marketplace_orders')
    op.drop_index(op.f('ix_marketplace_orders_buyer_id'), table_name='marketplace_orders')
    op.drop_table('marketplace_orders')
    op.drop_index(op.f('ix_marketplace_listings_owner_id'), table_name='marketplace_listings')
    op.drop_table('marketplace_listings')
