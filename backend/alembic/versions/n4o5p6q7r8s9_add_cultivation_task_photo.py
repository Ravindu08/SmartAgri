"""add photo column to cultivation_tasks for task-completion photo diary

Revision ID: n4o5p6q7r8s9
Revises: m3n4o5p6q7r8
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa

revision = 'n4o5p6q7r8s9'
down_revision = 'm3n4o5p6q7r8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('cultivation_tasks', sa.Column('photo', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('cultivation_tasks', 'photo')
