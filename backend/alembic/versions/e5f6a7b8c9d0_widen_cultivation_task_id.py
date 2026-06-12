"""widen cultivation_task id to 128 chars

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        'cultivation_tasks', 'id',
        existing_type=sa.String(64),
        type_=sa.String(128),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        'cultivation_tasks', 'id',
        existing_type=sa.String(128),
        type_=sa.String(64),
        existing_nullable=False,
    )
