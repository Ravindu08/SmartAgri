"""add marketplace_negotiation_messages table for append-only negotiation thread

Revision ID: m3n4o5p6q7r8
Revises: l2m3n4o5p6q7
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'm3n4o5p6q7r8'
down_revision = 'l2m3n4o5p6q7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'marketplace_negotiation_messages',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('marketplace_orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sender_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('proposed_price', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_marketplace_negotiation_messages_order_id', 'marketplace_negotiation_messages', ['order_id'])


def downgrade() -> None:
    op.drop_index('ix_marketplace_negotiation_messages_order_id', table_name='marketplace_negotiation_messages')
    op.drop_table('marketplace_negotiation_messages')
