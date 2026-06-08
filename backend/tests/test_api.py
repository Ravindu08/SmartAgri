"""
SmartAgri API tests — run with: pytest backend/tests/ -v
"""
import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "ml_service"))

try:
    from app import app
    from fastapi.testclient import TestClient
    client = TestClient(app)
    MODELS_LOADED = True
except Exception:
    MODELS_LOADED = False

VALID_SIMPLE = {"Soil_Type":"Sandy Loam","Agro_Zone":"Dry Zone","Irrigation":"Rainfed","Season":"Yala","District":"Ampara"}
VALID_FULL   = {**VALID_SIMPLE,"N":100,"P":60,"K":91,"Temperature":27.0,"Rainfall":1050.0,"pH":6.3,"Humidity":72.0}

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
def test_predict_simple_valid():
    r = client.post("/predict/simple", json=VALID_SIMPLE)
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["mode"] == "simple"
    assert d["recommended_crop"]
    assert 0 <= d["confidence"] <= 1
    assert len(d["top_3"]) == 3
    assert d["planting_calendar"] is not None
    assert d["crop_info"] is not None

@pytest.mark.skipif(not MODELS_LOADED, reason="Models not trained yet")
def test_predict_simple_no_district():
    payload = {k:v for k,v in VALID_SIMPLE.items() if k != "District"}
    assert client.post("/predict/simple", json=payload).status_code == 200

@pytest.mark.skipif(not MODELS_LOADED, reason="Models not trained yet")
def test_predict_simple_bad_zone():
    assert client.post("/predict/simple", json={**VALID_SIMPLE,"Agro_Zone":"Moon Zone"}).status_code == 422

@pytest.mark.skipif(not MODELS_LOADED, reason="Models not trained yet")
def test_predict_simple_bad_irrigation():
    assert client.post("/predict/simple", json={**VALID_SIMPLE,"Irrigation":"Magic Drip"}).status_code == 422

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
