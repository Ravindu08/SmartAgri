"""create users table

Revision ID: 0001_create_users_table
Revises:
Create Date: 2026-05-17 00:00:00.000000

"""
from alembic import op


revision = "0001_create_users_table"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE user_role AS ENUM ('Admin', 'Land Owner', 'Trader', 'Visitor');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id         SERIAL PRIMARY KEY,
            full_name  VARCHAR(255) NOT NULL,
            email      VARCHAR(255) NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            role       user_role NOT NULL DEFAULT 'Visitor',
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    """)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email);")
    op.execute("CREATE        INDEX IF NOT EXISTS ix_users_id    ON users (id);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS users;")
    op.execute("DROP TYPE  IF EXISTS user_role;")
