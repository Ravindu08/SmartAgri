"""
SmartAgri API tests — run with: pytest backend/tests/ -v
"""
import pytest

try:
    from ml_service.app import app
    from fastapi.testclient import TestClient
    client = TestClient(app)
    MODELS_LOADED = True
except Exception:
    MODELS_LOADED = False

BASE_FIELDS = {"Soil_Type":"Sandy Loam","Agro_Zone":"Dry Zone","Irrigation":"Rainfed","Season":"Yala","District":"Ampara"}
VALID_FULL  = {**BASE_FIELDS,"N":100,"P":60,"K":91,"Temperature":27.0,"Rainfall":1050.0,"pH":6.3,"Humidity":72.0}

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "ok"
    assert "version" in d
    assert "cache_entries" in d

def test_meta():
    r = client.get("/meta")
    assert r.status_code == 200
    d = r.json()
    assert len(d["soil_types"]) == 34  # 33 original + Marshy Soil added with new crops
    assert len(d["agro_zones"]) == 15
    assert len(d["crops"]) == 41  # 34 original + 7 new crops
    assert len(d["districts"]) == 25

@pytest.mark.skipif(not MODELS_LOADED, reason="Models not trained yet")
def test_predict_full_valid():
    r = client.post("/predict/full", json=VALID_FULL)
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["mode"] == "full"
    assert len(d["xai_features"]) > 0
    assert all(k in d["xai_summary"] for k in ["en","si","ta"])
    assert d["crop_info"] is not None

@pytest.mark.skipif(not MODELS_LOADED, reason="Models not trained yet")
def test_predict_full_xai_multilingual():
    r = client.post("/predict/full", json=VALID_FULL)
    feat = r.json()["data"]["xai_features"][0]
    assert feat["label_si"] != ""
    assert feat["label_ta"] != ""

@pytest.mark.skipif(not MODELS_LOADED, reason="Models not trained yet")
def test_predict_full_top3_has_crop_info():
    r = client.post("/predict/full", json=VALID_FULL)
    for item in r.json()["data"]["top_3"]:
        assert item["crop_info"] is not None

@pytest.mark.skipif(not MODELS_LOADED, reason="Models not trained yet")
def test_predict_full_ph_invalid():
    assert client.post("/predict/full", json={**VALID_FULL,"pH":15.0}).status_code == 422

@pytest.mark.skipif(not MODELS_LOADED, reason="Models not trained yet")
def test_predict_full_outlier_warning():
    r = client.post("/predict/full", json={**VALID_FULL,"Rainfall":4999.0})
    assert r.status_code == 200
    assert any(w["field"]=="Rainfall" for w in r.json()["data"]["warnings"])

@pytest.mark.skipif(not MODELS_LOADED, reason="Models not trained yet")
def test_caching_identical_results():
    r1 = client.post("/predict/full", json=VALID_FULL).json()["data"]
    r2 = client.post("/predict/full", json=VALID_FULL).json()["data"]
    assert r1["recommended_crop"] == r2["recommended_crop"]
    assert r1["confidence"] == r2["confidence"]

@pytest.mark.skipif(not MODELS_LOADED, reason="Models not trained yet")
def test_calendar_maha():
    r = client.post("/predict/full", json={**VALID_FULL, "Season": "Maha"})
    cal = r.json()["data"]["planting_calendar"]
    assert cal["plant_start"] == 10          # Maha planting always starts October
    assert 1 <= cal["harvest_start"] <= 12   # crop-specific harvest month

@pytest.mark.skipif(not MODELS_LOADED, reason="Models not trained yet")
def test_calendar_yala():
    r = client.post("/predict/full", json={**VALID_FULL, "Season": "Yala"})
    cal = r.json()["data"]["planting_calendar"]
    assert cal["plant_start"] == 4           # Yala planting always starts April
    assert 1 <= cal["harvest_start"] <= 12   # crop-specific harvest month


# ── Input validation regression tests ────────────────────────────────────────
# These cover the "fail soft into a fake success" bugs: invalid input used to
# produce a result-shaped response instead of a rejection.

@pytest.mark.parametrize("field,bad_value", [
    ("N", 99999), ("N", -1),
    ("P", 500),   ("K", -20),
    ("Temperature", 100), ("Temperature", -10),
    ("Rainfall", 99999),
    ("pH", 14), ("pH", 0),
    ("Humidity", 150), ("Humidity", -5),
])
def test_predict_full_rejects_out_of_range(field, bad_value):
    r = client.post("/predict/full", json={**VALID_FULL, field: bad_value})
    assert r.status_code == 422, f"{field}={bad_value} should be rejected"
    assert field in str(r.json()["detail"])

@pytest.mark.parametrize("field", ["Soil_Type", "Agro_Zone", "Irrigation", "Season"])
def test_predict_full_rejects_unknown_category(field):
    r = client.post("/predict/full", json={**VALID_FULL, field: "Not A Real Value"})
    assert r.status_code == 422
    assert field in str(r.json()["detail"])

@pytest.mark.parametrize("literal", ["NaN", "Infinity", "-Infinity"])
def test_predict_full_rejects_non_finite_without_crashing(literal):
    """NaN/Infinity are legal JSON. They must give 422, not a 500 from the
    error response failing to serialise the offending value."""
    body = '{"Soil_Type":"Sandy Loam","Agro_Zone":"Dry Zone","Irrigation":"Rainfed",' \
           '"Season":"Yala","N":%s,"P":60,"K":91,"Temperature":27,"Rainfall":1050,' \
           '"pH":6.3,"Humidity":72}' % literal
    r = client.post("/predict/full", content=body,
                    headers={"Content-Type": "application/json"})
    assert r.status_code == 422, f"{literal} produced {r.status_code}"
    assert "finite" in str(r.json()["detail"])

def test_meta_ranges_match_validator():
    """/meta must advertise exactly the bounds the validator enforces, so the
    form can never accept a value the server will reject."""
    from ml_service.app import NUMERIC_RANGES
    advertised = client.get("/meta").json()["numeric_ranges"]
    assert set(advertised) == set(NUMERIC_RANGES)
    for field, spec in NUMERIC_RANGES.items():
        assert advertised[field]["min"] == spec["min"]
        assert advertised[field]["max"] == spec["max"]
        # a value one step past the advertised max must actually be rejected
        r = client.post("/predict/full", json={**VALID_FULL, field: spec["max"] + 1})
        assert r.status_code == 422, f"{field} max {spec['max']} not enforced"


# ── Cultivation input validation ─────────────────────────────────────────────

VALID_CULTIVATION = {"user_id": "pytest-user", "crop": "Tomato", "planting_date": "2026-10-01"}

@pytest.mark.parametrize("bad_date", ["not-a-date", "", "2026-13-01", "01-10-2026", "1850-01-01", "3000-01-01"])
def test_cultivation_rejects_bad_planting_date(bad_date):
    """A bad date used to return 201 with an empty task list — a cultivation
    session with no schedule and no error shown to the user."""
    r = client.post("/cultivation", json={**VALID_CULTIVATION, "planting_date": bad_date})
    assert r.status_code == 422, f"{bad_date!r} produced {r.status_code}"

def test_cultivation_rejects_blank_user_id():
    r = client.post("/cultivation", json={**VALID_CULTIVATION, "user_id": "   "})
    assert r.status_code == 422

def test_cultivation_rejects_malformed_uuid():
    r = client.post("/cultivation", json={**VALID_CULTIVATION, "crop_id": "not-a-uuid"})
    assert r.status_code == 422

def test_cultivation_rejects_unknown_crop():
    r = client.post("/cultivation", json={**VALID_CULTIVATION, "crop": "Dragonfruit-XYZ"})
    assert r.status_code == 404
