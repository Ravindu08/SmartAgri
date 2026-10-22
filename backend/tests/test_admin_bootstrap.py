"""The admin account comes only from ADMIN_EMAIL / ADMIN_PASSWORD; there is no built-in default."""
from app.models.user import UserRole
from app.services.auth import ensure_admin_user, get_user_by_email, verify_password
from tests.db import TestingSessionLocal


def test_no_admin_is_created_without_env(monkeypatch):
    monkeypatch.delenv("ADMIN_EMAIL", raising=False)
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)
    db = TestingSessionLocal()
    try:
        assert ensure_admin_user(db) is None
        assert get_user_by_email(db, "admin@example.com") is None
    finally:
        db.close()


def test_one_missing_variable_is_not_enough(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "boot-admin@example.com")
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)
    db = TestingSessionLocal()
    try:
        assert ensure_admin_user(db) is None
        assert get_user_by_email(db, "boot-admin@example.com") is None
    finally:
        db.close()


def test_admin_is_created_from_env_and_reused(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "Boot-Admin@Example.com")
    monkeypatch.setenv("ADMIN_PASSWORD", "test-only-password-1")
    db = TestingSessionLocal()
    try:
        admin = ensure_admin_user(db)
        assert admin is not None and admin.role == UserRole.ADMIN
        assert admin.email == "boot-admin@example.com"
        assert verify_password("test-only-password-1", admin.hashed_password)
        assert ensure_admin_user(db).id == admin.id  # second startup reuses it
    finally:
        db.close()
