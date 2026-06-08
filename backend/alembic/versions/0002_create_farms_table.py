"""create farms table

Revision ID: 0002_create_farms_table
Revises: 0001_create_users_table
Create Date: 2026-06-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "0002_create_farms_table"
down_revision = "0001_create_users_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "farms",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("farm_name", sa.String(length=255), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("farm_size", sa.Float(), nullable=False),
        sa.Column("soil_type", sa.String(length=128), nullable=False),
        sa.Column("season", sa.String(length=16), nullable=False),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index(op.f("ix_farms_owner_id"), "farms", ["owner_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_farms_owner_id"), table_name="farms")
    op.drop_table("farms")
