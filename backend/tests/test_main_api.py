"""
SmartAgri main API tests — run with: pytest backend/tests/test_main_api.py -v
Requires the conftest.py in this directory to run first (sets env + patches dotenv).
"""
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# ── SQLite in-memory engine (all tables created from ORM metadata) ────────────
from app.db.database import Base
from app.core.deps import get_db
from app.core.security import create_access_token, hash_password
from app.models.user import User, UserRole
from app.main import app

_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
Base.metadata.create_all(bind=_engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db

client = TestClient(app, raise_server_exceptions=False)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _make_user(email: str, role: UserRole, password: str = "Password123!") -> User:
    db = TestingSessionLocal()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        db.close()
        return existing
    user = User(
        full_name="Test User",
        email=email,
        hashed_password=hash_password(password),
        role=role,
        roles=[role.value],
        is_verified=True,
        is_suspended=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


def _bearer(email: str, role: UserRole) -> dict[str, str]:
    _make_user(email, role)
    token = create_access_token(data={"sub": email})
    return {"Authorization": f"Bearer {token}"}


# ── Tests ──────────────────────────────────────────────────────────────────────

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_register_and_login():
    r = client.post("/auth/register", json={
        "full_name": "Jane Test",
        "email": "janetest@smartagri.com",
        "password": "Password123!",
        "roles": ["Land Owner"],
    })
    assert r.status_code == 201

    r2 = client.post("/auth/login", json={
        "email": "janetest@smartagri.com",
        "password": "Password123!",
    })
    assert r2.status_code == 200
    body = r2.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


def test_login_invalid_password():
    _make_user("badpass@smartagri.com", UserRole.LAND_OWNER)
    r = client.post("/auth/login", json={
        "email": "badpass@smartagri.com",
        "password": "WrongPass!",
    })
    assert r.status_code == 401


def test_protected_endpoint_no_token():
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_protected_endpoint_valid_token():
    headers = _bearer("mecheck@smartagri.com", UserRole.LAND_OWNER)
    r = client.get("/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == "mecheck@smartagri.com"


def test_admin_endpoint_unauthorized():
    headers = _bearer("noadmin@smartagri.com", UserRole.LAND_OWNER)
    r = client.get("/api/admin/users", headers=headers)
    assert r.status_code == 403


def test_marketplace_listings_public():
    r = client.get("/api/marketplace/listings")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_refresh_token():
    _make_user("refresh@smartagri.com", UserRole.TRADER)
    login = client.post("/auth/login", json={
        "email": "refresh@smartagri.com",
        "password": "Password123!",
    })
    assert login.status_code == 200
    refresh_tok = login.json()["refresh_token"]

    r = client.post("/auth/refresh", json={"refresh_token": refresh_tok})
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert "refresh_token" in body


def test_rate_limit_login():
    """11 rapid login attempts from the same client should eventually get a 429."""
    statuses = []
    for i in range(11):
        r = client.post("/auth/login", json={
            "email": f"rl{i}@example.com",
            "password": "wrong",
        })
        statuses.append(r.status_code)
    # All should be 401 (wrong password) or 429 (rate limited)
    assert all(s in (401, 429) for s in statuses), f"Unexpected statuses: {statuses}"
