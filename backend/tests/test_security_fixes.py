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


# ── Admin: CSV exports, list paging, bulk import ─────────────────────────────

def test_csv_export_neutralises_formula_cells():
    from app.routers.admin import _csv_safe

    for risky in ("=1+1", "+1", "-1", "@SUM(A1)", "\tx", "\rx"):
        assert _csv_safe(risky) == "'" + risky
    assert _csv_safe("Kandy Farm") == "Kandy Farm"
    assert _csv_safe(42) == 42
    assert _csv_safe(None) is None

    admin = _login_new(UserRole.ADMIN)
    db = TestingSessionLocal()
    db.add(User(full_name='=HYPERLINK("http://evil.example","x")', email="formula@fixes-smartagri.com",
                hashed_password=hash_password(PASSWORD), role=UserRole.TRADER,
                roles=[UserRole.TRADER.value], is_verified=True))
    db.commit()
    db.close()

    r = client.get("/api/admin/export/users.csv", headers=_h(admin))
    assert r.status_code == 200
    line = next(l for l in r.text.splitlines() if "formula@fixes-smartagri.com" in l)
    assert "'=HYPERLINK" in line
    assert ",=HYPERLINK" not in line and ',"=HYPERLINK' not in line


def test_admin_user_list_is_paged():
    admin = _login_new(UserRole.ADMIN)
    for _ in range(3):
        _login_new(UserRole.TRADER)

    everyone = client.get("/api/admin/users", headers=_h(admin)).json()
    assert len(everyone) >= 4

    first = client.get("/api/admin/users", headers=_h(admin), params={"limit": 2}).json()
    second = client.get("/api/admin/users", headers=_h(admin), params={"limit": 2, "offset": 2}).json()
    assert len(first) == 2 and len(second) == 2
    assert [u["id"] for u in first + second] == [u["id"] for u in everyone[:4]]

    assert client.get("/api/admin/users", headers=_h(admin), params={"limit": 0}).status_code == 422
    assert client.get("/api/admin/users", headers=_h(admin), params={"limit": 100000}).status_code == 422
    for path in ("farms", "marketplace/listings", "marketplace/orders"):
        assert client.get(f"/api/admin/{path}", headers=_h(admin), params={"limit": 1}).status_code == 200


def test_bulk_import_keeps_going_after_a_bad_row():
    # A 300-character name overflows VARCHAR(255) on PostgreSQL. Before the
    # per-row savepoint that error poisoned the session, so every later row
    # failed too. (SQLite ignores the length, so there all three are created.)
    admin = _login_new(UserRole.ADMIN)
    r = client.post("/api/admin/users/bulk", headers=_h(admin), json={
        "default_password": PASSWORD,
        "role": "Trader",
        "users": [
            {"full_name": "Good Before", "email": "bulk-before@fixes-smartagri.com"},
            {"full_name": "x" * 300, "email": "bulk-bad@fixes-smartagri.com"},
            {"full_name": "Good After", "email": "bulk-after@fixes-smartagri.com"},
        ],
    })
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["created"] + len(body["errors"]) == 3
    assert all(e["email"] == "bulk-bad@fixes-smartagri.com" for e in body["errors"])

    for email in ("bulk-before@fixes-smartagri.com", "bulk-after@fixes-smartagri.com"):
        assert client.post("/auth/login", json={"email": email, "password": PASSWORD}).status_code == 200

    r = client.post("/api/admin/farms/bulk", headers=_h(admin), json={
        "default_password": PASSWORD,
        "farms": [
            {"farmer_name": "y" * 300, "email": "farm-bad@fixes-smartagri.com", "district": "Kandy",
             "farm_name": "Bad Farm", "soil_type": "Loam", "size": 2},
            {"farmer_name": "Good Farmer", "email": "farm-good@fixes-smartagri.com", "district": "Kandy",
             "farm_name": "Good Farm", "soil_type": "Loam", "size": 2},
        ],
    })
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["created_farms"] + len(body["errors"]) == 2
    assert body["created_farms"] >= 1
    assert all(e["email"] == "farm-bad@fixes-smartagri.com" for e in body["errors"])
    assert client.post("/auth/login", json={"email": "farm-good@fixes-smartagri.com",
                                            "password": PASSWORD}).status_code == 200


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


# ── 2026-10-05 check-up ───────────────────────────────────────────────────────

def test_login_ignores_email_letter_case():
    session = _login_new(UserRole.TRADER)
    email = session["user"]["email"]
    r = client.post("/auth/login", json={"email": email.upper().replace("@FIXES", "@fixes"), "password": PASSWORD})
    assert r.status_code == 200, r.text
    assert r.json()["user"]["id"] == session["user"]["id"]


def test_same_email_in_another_case_is_not_a_second_account():
    r = client.post("/auth/register", json={"full_name": "Case One", "email": "CaseTest@fixes-smartagri.com",
                                            "password": PASSWORD, "roles": ["Trader"]})
    assert r.status_code == 201, r.text
    assert r.json()["email"] == "casetest@fixes-smartagri.com"
    r = client.post("/auth/register", json={"full_name": "Case Two", "email": "casetest@FIXES-smartagri.com",
                                            "password": "Different123!", "roles": ["Trader"]})
    assert r.status_code == 409


def test_cancelling_an_order_does_not_reopen_an_archived_listing():
    seller, buyer = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.TRADER)
    listing = _listing(seller, quantity=100)
    order = _order(buyer, listing, quantity=10)
    r = client.put(f"/api/marketplace/listings/{listing['id']}", headers=_h(seller), json={"status": "Archived"})
    assert r.status_code == 200, r.text
    assert _set_status(buyer, order, "Cancelled").status_code == 200
    after = client.get(f"/api/marketplace/listings/{listing['id']}").json()
    assert after["status"] == "Archived"
    assert after["quantity"] == 100


def test_rejecting_an_order_puts_a_sold_out_listing_back_on_sale():
    seller, buyer = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.TRADER)
    listing = _listing(seller, quantity=10)
    order = _order(buyer, listing, quantity=10)
    assert client.get(f"/api/marketplace/listings/{listing['id']}").json()["status"] == "Sold"
    assert _set_status(seller, order, "Rejected").status_code == 200
    after = client.get(f"/api/marketplace/listings/{listing['id']}").json()
    assert (after["status"], after["quantity"]) == ("Active", 10)


def test_no_notes_on_a_closed_order_and_no_price_change_after_confirmation():
    seller, buyer = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.TRADER)
    order = _order(buyer, _listing(seller))
    url = f"/api/marketplace/orders/{order['id']}/negotiation"
    assert client.post(url, headers=_h(seller), json={"message": "95 is my best", "proposed_price": 95}).status_code == 200
    assert _set_status(seller, order, "Confirmed").json()["agreed_price"] == 95
    # A plain note is still fine on a confirmed order; a new price is not.
    assert client.post(url, headers=_h(buyer), json={"message": "Collecting on Friday"}).status_code == 200
    assert client.post(url, headers=_h(seller), json={"message": "Make it 200", "proposed_price": 200}).status_code == 400
    assert _set_status(buyer, order, "Cancelled").status_code == 200
    assert client.post(url, headers=_h(buyer), json={"message": "Hello?"}).status_code == 400


def test_order_reports_the_listing_unit():
    seller, buyer = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.TRADER)
    assert _order(buyer, _listing(seller))["unit"] == "kg"


def test_review_and_activity_limits_are_validated():
    admin = _login_new(UserRole.ADMIN)
    assert client.get("/api/ratings/users/1/reviews?limit=-1").status_code == 422
    assert client.get("/api/ratings/users/1/reviews?limit=5").status_code == 200
    assert client.get("/api/admin/activity?limit=-1", headers=_h(admin)).status_code == 422


def test_admin_cannot_assign_an_unknown_role_or_drop_own_admin_role():
    admin, user = _login_new(UserRole.ADMIN), _login_new(UserRole.TRADER)
    uid, aid = user["user"]["id"], admin["user"]["id"]
    assert client.patch(f"/api/admin/users/{uid}", headers=_h(admin), json={"roles": ["Superuser"]}).status_code == 400
    assert client.patch(f"/api/admin/users/{uid}", headers=_h(admin), json={"roles": []}).status_code == 400
    assert client.patch(f"/api/admin/users/{aid}", headers=_h(admin), json={"roles": ["Trader"]}).status_code == 400
    r = client.patch(f"/api/admin/users/{uid}", headers=_h(admin), json={"roles": ["Trader", "Land Owner"]})
    assert r.status_code == 200, r.text
    assert (r.json()["role"], r.json()["roles"]) == ("Trader", ["Trader", "Land Owner"])


def test_admin_account_cannot_delete_itself():
    admin = _login_new(UserRole.ADMIN)
    assert client.delete("/auth/me", headers=_h(admin)).status_code == 400
    assert client.get("/auth/me", headers=_h(admin)).status_code == 200


def test_deleting_a_buyer_returns_their_held_stock():
    seller, buyer = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.TRADER)
    listing = _listing(seller, quantity=10)
    _order(buyer, listing, quantity=10)
    assert client.get(f"/api/marketplace/listings/{listing['id']}").json()["status"] == "Sold"
    assert client.delete("/auth/me", headers=_h(buyer)).status_code == 204
    after = client.get(f"/api/marketplace/listings/{listing['id']}").json()
    assert (after["status"], after["quantity"]) == ("Active", 10)
    assert client.get("/api/marketplace/orders", headers=_h(seller)).json() == []


def _product(seller, quantity=20, price=300):
    r = client.post("/api/marketplace/listings", headers=_h(seller),
                    json={"crop_name": "Urea", "crop_type": "Fertilizer", "quantity": quantity, "unit": "kg",
                          "price_per_unit": price, "listing_type": "product"})
    return r


def test_traders_sell_supplies_and_land_owners_buy_them():
    trader, owner = _login_new(UserRole.TRADER), _login_new(UserRole.LAND_OWNER)
    assert _product(owner).status_code == 403          # supplies are a trader's to list
    created = _product(trader)
    assert created.status_code == 201, created.text
    listing = created.json()
    other_trader = _login_new(UserRole.TRADER)
    r = client.post("/api/marketplace/orders", headers=_h(other_trader),
                    json={"listing_id": listing["id"], "requested_quantity": 1})
    assert r.status_code == 403                        # ...and a land owner's to buy
    order = _order(owner, listing, quantity=5, proposed_price=280)
    assert order["listing_type"] == "product"
    # The whole lifecycle works with the roles the other way round.
    assert _set_status(trader, order, "Confirmed").status_code == 200
    assert client.post(f"/api/marketplace/orders/{order['id']}/payment/simulate", headers=_h(owner)).status_code == 200
    assert _set_status(trader, order, "Delivered").status_code == 200
    assert _set_status(owner, order, "Completed").status_code == 200
    # The trader can manage their own listing.
    assert client.put(f"/api/marketplace/listings/{listing['id']}", headers=_h(trader),
                      json={"price_per_unit": 310}).status_code == 200


def test_unknown_listing_type_is_rejected():
    owner = _login_new(UserRole.LAND_OWNER)
    r = client.post("/api/marketplace/listings", headers=_h(owner),
                    json={"crop_name": "X", "quantity": 1, "unit": "kg", "price_per_unit": 1, "listing_type": "weapon"})
    assert r.status_code == 422


def test_note_written_with_an_order_opens_the_thread():
    seller, buyer = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.TRADER)
    listing = _listing(seller)
    r = client.post("/api/marketplace/orders", headers=_h(buyer),
                    json={"listing_id": listing["id"], "requested_quantity": 5, "proposed_price": 90,
                          "buyer_note": "Can you do 90?"})
    assert r.status_code == 201, r.text
    thread = client.get(f"/api/marketplace/orders/{r.json()['id']}/negotiation", headers=_h(seller)).json()
    assert [(m["message"], m["proposed_price"], m["sender_id"]) for m in thread] == \
        [("Can you do 90?", 90, buyer["user"]["id"])]
    # No note, no empty message.
    quiet = _order(buyer, listing, quantity=1)
    assert client.get(f"/api/marketplace/orders/{quiet['id']}/negotiation", headers=_h(seller)).json() == []


def test_order_list_reports_whether_an_order_is_rated():
    seller, buyer = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.TRADER)
    order = _order(buyer, _listing(seller))
    _set_status(seller, order, "Confirmed")
    client.post(f"/api/marketplace/orders/{order['id']}/payment/simulate", headers=_h(buyer))
    _set_status(seller, order, "Delivered")
    assert _set_status(buyer, order, "Completed").status_code == 200

    def rated():
        return client.get("/api/marketplace/orders", headers=_h(buyer)).json()[0]["rated"]

    assert rated() is False
    assert client.post(f"/api/ratings/orders/{order['id']}", headers=_h(buyer), json={"score": 4}).status_code == 201
    assert rated() is True


def test_phone_number_must_look_like_a_phone_number():
    s = _login_new(UserRole.TRADER)
    assert client.put("/auth/me", headers=_h(s), json={"phone_number": "hello world"}).status_code == 422
    assert client.put("/auth/me", headers=_h(s), json={"phone_number": "123"}).status_code == 422
    ok = client.put("/auth/me", headers=_h(s), json={"phone_number": "+94 77 123 4567"})
    assert ok.status_code == 200 and ok.json()["phone_number"] == "+94 77 123 4567"
    cleared = client.put("/auth/me", headers=_h(s), json={"phone_number": ""})
    assert cleared.status_code == 200 and cleared.json()["phone_number"] is None


def test_public_listings_do_not_give_out_the_seller_phone():
    seller = _login_new(UserRole.LAND_OWNER)
    client.put("/auth/me", headers=_h(seller), json={"phone_number": "+94 77 123 4567"})
    listing = _listing(seller)
    public = client.get(f"/api/marketplace/listings/{listing['id']}").json()
    assert "owner_phone" not in public
    assert "+94 77 123 4567" not in client.get("/api/marketplace/listings").text
    # ...but the buyer gets it once the order is confirmed.
    buyer = _login_new(UserRole.TRADER)
    order = _order(buyer, listing)
    assert order["seller_phone"] is None
    assert _set_status(seller, order, "Confirmed").status_code == 200
    mine = client.get("/api/marketplace/orders", headers=_h(buyer)).json()[0]
    assert mine["seller_phone"] == "+94 77 123 4567"


def test_suspended_sellers_listings_are_taken_off_the_market():
    admin = _login_new(UserRole.ADMIN)
    seller, buyer = _login_new(UserRole.LAND_OWNER), _login_new(UserRole.TRADER)
    listing = _listing(seller)

    def on_market():
        return listing["id"] in [l["id"] for l in client.get("/api/marketplace/listings").json()]

    assert on_market()
    sid = seller["user"]["id"]
    assert client.patch(f"/api/admin/users/{sid}", headers=_h(admin), json={"is_suspended": True}).status_code == 200
    assert not on_market()
    r = client.post("/api/marketplace/orders", headers=_h(buyer),
                    json={"listing_id": listing["id"], "requested_quantity": 1})
    assert r.status_code == 400
    assert client.patch(f"/api/admin/users/{sid}", headers=_h(admin), json={"is_suspended": False}).status_code == 200
    assert on_market()


def test_feedback_needs_real_text_and_lists_its_sender():
    admin, user = _login_new(UserRole.ADMIN), _login_new(UserRole.TRADER)
    blank = client.post("/api/admin/submit-feedback", headers=_h(user), json={"subject": "   ", "message": "  "})
    assert blank.status_code == 422
    ok = client.post("/api/admin/submit-feedback", headers=_h(user),
                     json={"type": "bug", "subject": " Button ", "message": "It does nothing"})
    assert ok.status_code == 201
    rows = client.get("/api/admin/feedback", headers=_h(admin)).json()
    mine = next(r for r in rows if r["id"] == ok.json()["id"])
    assert (mine["subject"], mine["user_email"], mine["user_name"]) == \
        ("Button", user["user"]["email"], user["user"]["full_name"])


def test_new_password_must_differ_from_the_current_one():
    s = _login_new(UserRole.TRADER)
    r = client.put("/auth/me/password", headers=_h(s), json={"current_password": PASSWORD, "new_password": PASSWORD})
    assert r.status_code == 400


def test_bulk_farm_import_reports_bad_rows_and_keeps_good_ones():
    admin = _login_new(UserRole.ADMIN)
    row = {"farmer_name": "Bulk Farmer", "email": "bulk-farmer@fixes-smartagri.com", "farm_name": "Good Farm",
           "soil_type": "Loam", "district": "kandy", "size": 2}
    r = client.post("/api/admin/farms/bulk", headers=_h(admin), json={"default_password": PASSWORD, "farms": [
        row,
        {**row, "farm_name": "Negative", "size": -4},
        {**row, "farm_name": "Nowhere", "district": "Atlantis"},
    ]})
    assert r.status_code == 201, r.text
    body = r.json()
    assert (body["created_farms"], body["created_users"]) == (1, 1)
    assert [e["error"] for e in body["errors"]] == ["Farm size must be greater than 0", "Unknown district: Atlantis"]
    farms = client.get("/api/admin/farms", headers=_h(admin)).json()
    assert [(f["name"], f["district"]) for f in farms if f["owner_name"] == "Bulk Farmer"] == [("Good Farm", "Kandy")]
