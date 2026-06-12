"""add cultivation tables

Revision ID: d4e5f6a7b8c9
Revises: a1b2c3d4e5f6
Create Date: 2026-06-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = 'd4e5f6a7b8c9'
down_revision = 'b7f3e2d1c890'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'cultivation_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', sa.String(64), nullable=False),
        sa.Column('crop', sa.String(255), nullable=False),
        sa.Column(
            'crop_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('crops.id', ondelete='SET NULL'),
            nullable=True,
        ),
        sa.Column(
            'farm_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('farms.id', ondelete='SET NULL'),
            nullable=True,
        ),
        sa.Column('planting_date', sa.String(16), nullable=False),
        sa.Column('district', sa.String(128), nullable=True),
        sa.Column('status', sa.String(32), nullable=False, server_default='active'),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('CURRENT_TIMESTAMP'),
        ),
    )
    op.create_index('ix_cultivation_sessions_user_id', 'cultivation_sessions', ['user_id'])
    op.create_index('ix_cultivation_sessions_crop_id', 'cultivation_sessions', ['crop_id'])

    op.create_table(
        'cultivation_tasks',
        sa.Column('id', sa.String(64), primary_key=True, nullable=False),
        sa.Column(
            'session_id',
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey('cultivation_sessions.id', ondelete='CASCADE'),
            nullable=False,
        ),
        sa.Column('type', sa.String(32), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('why', sa.Text(), nullable=True),
        sa.Column('day', sa.Integer(), nullable=False),
        sa.Column('scheduled_date', sa.String(16), nullable=False),
        sa.Column('stage_id', sa.String(64), nullable=False),
        sa.Column('stage_name', sa.String(128), nullable=False),
        sa.Column('status', sa.String(32), nullable=False, server_default='pending'),
    )
    op.create_index('ix_cultivation_tasks_session_id', 'cultivation_tasks', ['session_id'])


def downgrade() -> None:
    op.drop_index('ix_cultivation_tasks_session_id', table_name='cultivation_tasks')
    op.drop_table('cultivation_tasks')
    op.drop_index('ix_cultivation_sessions_crop_id', table_name='cultivation_sessions')
    op.drop_index('ix_cultivation_sessions_user_id', table_name='cultivation_sessions')
    op.drop_table('cultivation_sessions')
