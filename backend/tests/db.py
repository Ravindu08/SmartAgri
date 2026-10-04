"""
The one database every backend test module shares.

Defaults to in-memory SQLite. Set TEST_DATABASE_URL to a PostgreSQL database to
run the same tests there (CI does), which is what exercises the foreign-key
cascades and row locks SQLite ignores. conftest.py empties it between modules.
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if TEST_DATABASE_URL:
    # Same driver the app names explicitly (see app/db/database.py).
    engine = create_engine(
        TEST_DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1),
        pool_pre_ping=True,
    )
else:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
