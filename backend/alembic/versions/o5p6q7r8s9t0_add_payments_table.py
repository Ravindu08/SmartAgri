"""add payments table and payment_status/paid_at on marketplace_orders

Revision ID: o5p6q7r8s9t0
Revises: n4o5p6q7r8s9
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'o5p6q7r8s9t0'
down_revision = 'n4o5p6q7r8s9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # create_table auto-creates a referenced ENUM type on first use, but
    # add_column (ALTER TABLE) does not — it must be created explicitly first,
    # and NOT also referenced by create_table afterwards, or the second
    # auto-create attempt fails with DuplicateObject.
    order_payment_status = sa.Enum('Unpaid', 'Paid', name='order_payment_status')
    payment_status = sa.Enum('Initiated', 'Paid', 'Failed', 'Cancelled', 'Chargedback', name='payment_status')
    order_payment_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'marketplace_orders',
        sa.Column('payment_status', order_payment_status, nullable=False, server_default='Unpaid'),
    )
    op.add_column('marketplace_orders', sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        'payments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('marketplace_orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='LKR'),
        sa.Column('status', payment_status, nullable=False, server_default='Initiated'),
        sa.Column('payhere_payment_id', sa.String(length=64), nullable=True),
        sa.Column('raw_notify_payload', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_payments_order_id', 'payments', ['order_id'])


def downgrade() -> None:
    op.drop_index('ix_payments_order_id', table_name='payments')
    op.drop_table('payments')
    op.drop_column('marketplace_orders', 'paid_at')
    op.drop_column('marketplace_orders', 'payment_status')
    sa.Enum(name='payment_status').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='order_payment_status').drop(op.get_bind(), checkfirst=True)
