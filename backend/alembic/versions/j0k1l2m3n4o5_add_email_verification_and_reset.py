"""add email verification and password reset tokens

Revision ID: j0k1l2m3n4o5
Revises: h9i0j1k2l3m4
Create Date: 2026-06-21

"""
from alembic import op
import sqlalchemy as sa

revision = 'j0k1l2m3n4o5'
down_revision = 'h9i0j1k2l3m4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column(
        'is_verified', sa.Boolean(), nullable=False,
        server_default='true',   # existing rows are grandfathered as verified
    ))
    op.add_column('users', sa.Column('email_verification_token', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('reset_token', sa.String(255), nullable=True))
    op.add_column('users', sa.Column(
        'reset_token_expires', sa.DateTime(timezone=True), nullable=True,
    ))
    # New registrations default to unverified — flip the server_default after backfill
    op.alter_column('users', 'is_verified', server_default='false')


def downgrade() -> None:
    op.drop_column('users', 'reset_token_expires')
    op.drop_column('users', 'reset_token')
    op.drop_column('users', 'email_verification_token')
    op.drop_column('users', 'is_verified')
