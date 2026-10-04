"""
Regression tests for the marketplace, auth and upload bugs found in the
2026-10 audit — run with: pytest backend/tests/test_security_fixes.py -v
Requires the conftest.py in this directory to run first (sets env + patches dotenv).
"""
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.deps import get_db
from app.core.limiter import limiter
from app.core.security import hash_password
from app.main import app
from app.models.user import User, UserRole
from app.utils.image_storage import InvalidImageError, store_image

from tests.db import TestingSessionLocal

PASSWORD = "Password123!"


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def _isolated_app():
    """Point the app at this module's database and lift the login rate limit."""
    previous = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = _override_get_db
    limiter.enabled = False
    yield
    limiter.enabled = True
    if previous is not None:
        app.dependency_overrides[get_db] = previous


client = TestClient(app, raise_server_exceptions=False)

_seq = 0


def _login_new(role: UserRole) -> dict:
    """Create a fresh user and return its login response (tokens + user)."""
    global _seq
    _seq += 1
    email = f"user-{_seq}@fixes-smartagri.com"
    db = TestingSessionLocal()
    db.add(User(full_name=f"User {_seq}", email=email, hashed_password=hash_password(PASSWORD),
                role=role, roles=[role.value], is_verified=True))
    db.commit()
    db.close()
    r = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()


def _h(session: dict) -> dict[str, str]:
    return {"Authorization": f"Bearer {session['access_token']}"}


def _listing(seller, quantity=100, price=100):
    r = client.post("/api/marketplace/listings", headers=_h(seller),
                    json={"crop_name": "Rice", "quantity": quantity, "unit": "kg", "price_per_unit": price})
    assert r.status_code == 201, r.text
    return r.json()


def _order(buyer, listing, quantity=10, proposed_price=90):
    r = client.post("/api/marketplace/orders", headers=_h(buyer),
                    json={"listing_id": listing["id"], "requested_quantity": quantity, "proposed_price": proposed_price})
    assert r.status_code == 201, r.text
    return r.json()


def _set_status(who, order, status, **extra):
    return client.put(f"/api/marketplace/orders/{order['id']}/status", headers=_h(who),
                      json={"status": status, **extra})


def _stock(listing) -> float:
    return client.get(f"/api/marketplace/listings/{listing['id']}").json()["quantity"]


# ── Tokens ────────────────────────────────────────────────────────────────────

def test_refresh_token_is_not_accepted_as_access_token():
    s = _login_new(UserRole.TRADER)
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {s['refresh_token']}"})
    assert r.status_code == 401


def test_refresh_issues_a_working_access_token():
    s = _login_new(UserRole.TRADER)
    r = client.post("/auth/refresh", json={"refresh_token": s["refresh_token"]})
    assert r.status_code == 200
    assert client.get("/auth/me", headers=_h(r.json())).status_code == 200


def test_token_survives_an_email_change():
    s = _login_new(UserRole.TRADER)
    r = client.put("/auth/me", headers=_h(s), json={"email": "renamed@fixes-smartagri.com"})
    assert r.status_code == 200
    me = client.get("/auth/me", headers=_h(s))
    assert me.status_code == 200
    assert me.json()["email"] == "renamed@fixes-smartagri.com"


# ── Marketplace roles ─────────────────────────────────────────────────────────

def test_trader_only_account_cannot_create_listing():
    trader = _login_new(UserRole.TRADER)
    r = client.post("/api/marketplace/listings", headers=_h(trader),
                    json={"crop_name": "Rice", "quantity": 1, "unit": "kg", "price_per_unit": 1})
    assert r.status_code == 403


def test_land_owner_only_account_cannot_place_order():
    seller, other_owner = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.LAND_OWNER)
    listing = _listing(seller)
    r = client.post("/api/marketplace/orders", headers=_h(other_owner),
                    json={"listing_id": listing["id"], "requested_quantity": 1})
    assert r.status_code == 403


# ── Order state machine ───────────────────────────────────────────────────────

def test_buyer_cannot_write_the_counter_offer():
    seller, buyer = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.TRADER)
    order = _order(buyer, _listing(seller))
    assert _set_status(buyer, order, "Pending", counter_offer_price=0.01).status_code in (400, 403)
    assert _set_status(buyer, order, "Cancelled", counter_offer_price=0.01).status_code == 403
    confirmed = _set_status(seller, order, "Confirmed")
    assert confirmed.status_code == 200
    assert confirmed.json()["agreed_price"] == 90


def test_repeating_a_status_is_rejected_and_does_not_restore_stock_twice():
    seller, buyer = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.TRADER)
    listing = _listing(seller, quantity=100)
    order = _order(buyer, listing, quantity=10)
    assert _stock(listing) == 90
    assert _set_status(buyer, order, "Cancelled").status_code == 200
    assert _stock(listing) == 100
    assert _set_status(buyer, order, "Cancelled").status_code == 400
    assert _stock(listing) == 100


def test_paid_order_cannot_be_repriced_or_cancelled():
    seller, buyer = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.TRADER)
    order = _order(buyer, _listing(seller))
    assert _set_status(seller, order, "Confirmed").status_code == 200
    assert client.post(f"/api/marketplace/orders/{order['id']}/payment/simulate", headers=_h(buyer)).status_code == 200

    assert _set_status(seller, order, "Confirmed", counter_offer_price=500).status_code == 400
    assert _set_status(buyer, order, "Cancelled").status_code == 400
    assert _set_status(seller, order, "Cancelled").status_code == 400

    current = next(o for o in client.get("/api/marketplace/orders", headers=_h(buyer)).json() if o["id"] == order["id"])
    assert current["status"] == "Confirmed"
    assert current["agreed_price"] == 90
    assert current["payment_status"] == "Paid"


def test_listing_with_orders_cannot_be_deleted():
    seller, buyer = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.TRADER)
    listing = _listing(seller)
    _order(buyer, listing)
    r = client.delete(f"/api/marketplace/listings/{listing['id']}", headers=_h(seller))
    assert r.status_code == 409
    assert len(client.get("/api/marketplace/orders", headers=_h(buyer)).json()) == 1


def test_listing_without_orders_can_be_deleted():
    seller = _login_new(UserRole.LAND_OWNER)
    listing = _listing(seller)
    assert client.delete(f"/api/marketplace/listings/{listing['id']}", headers=_h(seller)).status_code == 204


def test_listing_update_ignores_null_for_required_field():
    seller = _login_new(UserRole.LAND_OWNER)
    listing = _listing(seller)
    r = client.put(f"/api/marketplace/listings/{listing['id']}", headers=_h(seller),
                   json={"crop_name": None, "description": "fresh"})
    assert r.status_code == 200
    assert r.json()["crop_name"] == "Rice"
    assert r.json()["description"] == "fresh"


# ── Crops ─────────────────────────────────────────────────────────────────────

FARM = {"farm_name": "F", "location": "L", "farm_size": 1, "soil_type": "Loam", "season": "Maha"}
CROP = {"crop_name": "Rice", "crop_type": "Grain", "category": "Cereal", "growth_stage": "Seed",
        "planting_date": "2026-01-01", "expected_harvest_date": "2026-05-01", "status": "Active"}


def _farm_and_crop(owner):
    farm = client.post("/api/farms", headers=_h(owner), json=FARM).json()
    crop = client.post("/api/crops", headers=_h(owner), json={**CROP, "farm_id": farm["id"]}).json()
    return farm, crop


def test_crop_cannot_be_moved_to_another_users_farm():
    owner, stranger = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.LAND_OWNER)
    farm, crop = _farm_and_crop(owner)
    other_farm = client.post("/api/farms", headers=_h(stranger), json=FARM).json()
    r = client.put(f"/api/crops/{crop['id']}", headers=_h(owner), json={"farm_id": other_farm["id"]})
    assert r.status_code == 404
    assert client.get(f"/api/crops/{crop['id']}", headers=_h(owner)).json()["farm_id"] == farm["id"]


def test_crop_can_be_moved_between_own_farms():
    owner = _login_new(UserRole.LAND_OWNER)
    _, crop = _farm_and_crop(owner)
    second = client.post("/api/farms", headers=_h(owner), json=FARM).json()
    r = client.put(f"/api/crops/{crop['id']}", headers=_h(owner), json={"farm_id": second["id"]})
    assert r.status_code == 200
    assert r.json()["farm_id"] == second["id"]


def test_crop_update_rejects_harvest_before_stored_planting_date():
    owner = _login_new(UserRole.LAND_OWNER)
    _, crop = _farm_and_crop(owner)
    r = client.put(f"/api/crops/{crop['id']}", headers=_h(owner), json={"expected_harvest_date": "2020-01-01"})
    assert r.status_code == 422
    r = client.put(f"/api/crops/{crop['id']}", headers=_h(owner), json={"planting_date": "2027-01-01"})
    assert r.status_code == 422


# ── Image uploads ─────────────────────────────────────────────────────────────

def test_external_image_url_is_rejected():
    s = _login_new(UserRole.TRADER)
    r = client.put("/auth/me", headers=_h(s), json={"profile_image": "https://evil.example/track.gif"})
    assert r.status_code == 400


def test_malformed_base64_image_is_a_400_not_a_500():
    s = _login_new(UserRole.TRADER)
    r = client.put("/auth/me", headers=_h(s), json={"profile_image": "data:image/png;base64,!!!notbase64"})
    assert r.status_code == 400


def test_store_image_passes_through_stored_paths_and_empties():
    assert store_image(None) is None
    assert store_image("") == ""
    assert store_image("/uploads/0123abcd.jpg") == "/uploads/0123abcd.jpg"
    with pytest.raises(InvalidImageError):
        store_image("/uploads/../../etc/passwd")


# ── Secret key placeholder guard ──────────────────────────────────────────────

@pytest.mark.parametrize("placeholder", [
    "change-this-secret-key",
    "change-me-to-a-random-secret-key",
    "CHANGE_ME_TO_A_STRONG_RANDOM_KEY_AT_LEAST_32_CHARS",
    "short",
])
def test_placeholder_secret_keys_are_refused(placeholder, monkeypatch):
    import importlib
    import app.core.security as security

    good = security.SECRET_KEY
    monkeypatch.setenv("SECRET_KEY", placeholder)
    try:
        with pytest.raises(RuntimeError):
            importlib.reload(security)
    finally:
        monkeypatch.setenv("SECRET_KEY", good)
        importlib.reload(security)


# ── A password change signs out every other device ───────────────────────────

def _login(email: str, password: str = PASSWORD) -> dict:
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


def test_password_change_invalidates_other_sessions_but_not_this_one():
    this_device = _login_new(UserRole.TRADER)
    other_device = _login(this_device["user"]["email"])
    assert client.get("/auth/me", headers=_h(other_device)).status_code == 200

    r = client.put("/auth/me/password", headers=_h(this_device),
                   json={"current_password": PASSWORD, "new_password": "NewPassword456!"})
    assert r.status_code == 200, r.text
    fresh = r.json()

    # Old tokens are dead on both devices, access and refresh alike.
    assert client.get("/auth/me", headers=_h(other_device)).status_code == 401
    assert client.get("/auth/me", headers=_h(this_device)).status_code == 401
    assert client.post("/auth/refresh",
                       json={"refresh_token": other_device["refresh_token"]}).status_code == 401

    # The pair returned by the change keeps this device logged in.
    assert client.get("/auth/me", headers=_h(fresh)).status_code == 200
    refreshed = client.post("/auth/refresh", json={"refresh_token": fresh["refresh_token"]})
    assert refreshed.status_code == 200
    assert client.get("/auth/me", headers=_h(refreshed.json())).status_code == 200


def test_password_reset_invalidates_existing_sessions():
    session = _login_new(UserRole.TRADER)
    db = TestingSessionLocal()
    user = db.get(User, session["user"]["id"])
    user.reset_token = "reset-token-for-test"
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()
    db.close()

    r = client.post("/auth/reset-password",
                    json={"token": "reset-token-for-test", "new_password": "ResetPassword789!"})
    assert r.status_code == 200, r.text

    assert client.get("/auth/me", headers=_h(session)).status_code == 401
    assert client.post("/auth/refresh",
                       json={"refresh_token": session["refresh_token"]}).status_code == 401
    again = _login(session["user"]["email"], "ResetPassword789!")
    assert client.get("/auth/me", headers=_h(again)).status_code == 200


def test_token_without_version_claim_still_works_until_password_changes():
    # Tokens issued before the "ver" claim existed must not all break on deploy.
    from app.core.security import create_access_token

    session = _login_new(UserRole.TRADER)
    legacy = {"access_token": create_access_token({"sub": str(session["user"]["id"])})}
    assert client.get("/auth/me", headers=_h(legacy)).status_code == 200

    client.put("/auth/me/password", headers=_h(session),
               json={"current_password": PASSWORD, "new_password": "NewPassword456!"})
    assert client.get("/auth/me", headers=_h(legacy)).status_code == 401


# ── Cultivation tracker (ML service) requires the owner's token ───────────────

def test_cultivation_requires_login_and_ownership(monkeypatch):
    import ml_service.app as ml

    monkeypatch.setattr(ml, "_DB_AVAILABLE", False)
    monkeypatch.setattr(ml, "_cultivations_fallback", {})
    ml_client = TestClient(ml.app)
    overrides = dict(ml.app.dependency_overrides)
    ml.app.dependency_overrides.clear()
    ml.app.dependency_overrides[get_db] = _override_get_db
    try:
        owner, stranger = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.LAND_OWNER)
        owner_id = str(owner["user"]["id"])
        body = {"user_id": owner_id, "crop": "Tomato", "planting_date": "2026-06-01"}

        assert ml_client.post("/cultivation", json=body).status_code == 401
        assert ml_client.get(f"/cultivation/{owner_id}").status_code == 401
        assert ml_client.post("/cultivation", json=body, headers=_h(stranger)).status_code == 403
        assert ml_client.get(f"/cultivation/{owner_id}", headers=_h(stranger)).status_code == 403

        created = ml_client.post("/cultivation", json=body, headers=_h(owner))
        assert created.status_code == 201
        sid = created.json()["id"]
        assert ml_client.delete(f"/cultivation/{owner_id}/{sid}", headers=_h(stranger)).status_code == 403
        assert len(ml_client.get(f"/cultivation/{owner_id}", headers=_h(owner)).json()["sessions"]) == 1
    finally:
        ml.app.dependency_overrides.clear()
        ml.app.dependency_overrides.update(overrides)
