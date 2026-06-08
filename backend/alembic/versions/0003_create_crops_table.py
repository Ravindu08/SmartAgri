"""create crops table

Revision ID: 0003_create_crops_table
Revises: 0002_create_farms_table
Create Date: 2026-06-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "0003_create_crops_table"
down_revision = "0002_create_farms_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "crops",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "farm_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("farms.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("crop_name", sa.String(length=255), nullable=False),
        sa.Column("crop_type", sa.String(length=128), nullable=False),
        sa.Column("category", sa.String(length=128), nullable=False),
        sa.Column("growth_stage", sa.String(length=32), nullable=False),
        sa.Column("planting_date", sa.Date(), nullable=False),
        sa.Column("expected_harvest_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
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
    op.create_index(op.f("ix_crops_owner_id"), "crops", ["owner_id"], unique=False)
    op.create_index(op.f("ix_crops_farm_id"), "crops", ["farm_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_crops_farm_id"), table_name="crops")
    op.drop_index(op.f("ix_crops_owner_id"), table_name="crops")
    op.drop_table("crops")
