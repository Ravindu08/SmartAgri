"""
Shared pytest configuration for backend tests.
This file runs before any test module is imported.
"""
import os
import sys
from pathlib import Path

# Ensure backend root is importable as a package
BACKEND_DIR = Path(__file__).parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Patch load_dotenv to a no-op BEFORE any app module imports it.
# This prevents the production .env from overriding our test env vars.
import dotenv as _dotenv
_dotenv.load_dotenv = lambda *a, **kw: None  # type: ignore[assignment]

# Set required env vars for the test session
os.environ["DATABASE_URL"] = "sqlite:///./test_smartagri.db"
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-32chars!!")
os.environ.setdefault("EMAIL_ENABLED", "false")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
os.environ.setdefault("REFRESH_TOKEN_EXPIRE_DAYS", "7")

import pytest

# The cultivation tracker requires a logged-in user. ML-service tests have no
# users table, so they run as this fixed id instead of presenting a real token.
ML_TEST_USER = "test-user-ml"


@pytest.fixture(autouse=True, scope="session")
def _ml_service_runs_as_test_user():
    import ml_service.app as ml
    ml.app.dependency_overrides[ml.current_user_id] = lambda: ML_TEST_USER
    yield


@pytest.fixture(autouse=True, scope="module")
def _fresh_database():
    """Give each test module empty tables, so files never see each other's rows."""
    import app.main  # noqa: F401 — registers every model on Base.metadata
    from app.db.database import Base
    from tests.db import engine

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
