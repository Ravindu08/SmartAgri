"""
SmartAgri ML service tests for endpoints that do not need the trained model:
crop guidance, cultivation tracker, weather, and the rule-based helpers behind them.
Run with: pytest backend/tests/test_ml_endpoints.py -v

crop_guidance.json is committed to git, so these run in CI even though the
754 MB model file is not. Open-Meteo is mocked, so no network access is needed.
"""
from datetime import date

import httpx
import pytest
from fastapi.testclient import TestClient

import ml_service.app as ml

client = TestClient(ml.app)

CROP = "Tomato"
USER = "test-user-ml"


@pytest.fixture
def memory_store(monkeypatch):
    """Force the cultivation tracker onto its in-memory fallback (no PostgreSQL)."""
    monkeypatch.setattr(ml, "_DB_AVAILABLE", False)
    monkeypatch.setattr(ml, "_cultivations_fallback", {})


def _fixed_today(monkeypatch, y, m, d):
    class _FixedDate(date):
        @classmethod
        def today(cls):
            return cls(y, m, d)
    monkeypatch.setattr(ml, "_date", _FixedDate)


# ── Crop guidance ─────────────────────────────────────────────────────────────
def test_guidance_list():
    r = client.get("/guidance")
    assert r.status_code == 200
    d = r.json()
    assert d["total"] == len(d["crops"]) == 41
    assert d["crops"] == sorted(d["crops"])


def test_guidance_detail_case_insensitive():
    r = client.get("/guidance/tomato")
    assert r.status_code == 200
    d = r.json()["data"]
    assert len(d["stages"]) > 0
    assert "fertilization" in d and "irrigation" in d


def test_guidance_unknown_crop_404():
    assert client.get("/guidance/NotACrop").status_code == 404


# ── Cultivation tracker ───────────────────────────────────────────────────────
def _start(planting_date="2026-06-01"):
    return client.post("/cultivation", json={
        "user_id": USER, "crop": CROP, "planting_date": planting_date, "district": "Kandy",
    })


def test_cultivation_start_generates_tasks(memory_store):
    r = _start()
    assert r.status_code == 201
    s = r.json()
    assert s["status"] == "active"
    types = {t["type"] for t in s["tasks"].values()}
    assert "fertilize" in types and "water" in types
    # Tasks are never scheduled in the past
    today = ml._date.today().isoformat()
    assert all(t["scheduled_date"] >= today for t in s["tasks"].values())


def test_cultivation_unknown_crop_404(memory_store):
    r = client.post("/cultivation", json={"user_id": USER, "crop": "NotACrop", "planting_date": "2026-06-01"})
    assert r.status_code == 404


def test_cultivation_list(memory_store):
    sid = _start().json()["id"]
    r = client.get(f"/cultivation/{USER}")
    assert r.status_code == 200
    assert [s["id"] for s in r.json()["sessions"]] == [sid]
    assert client.get("/cultivation/someone-else").json()["sessions"] == []


def test_cultivation_update_task(memory_store):
    s = _start().json()
    task_id = next(iter(s["tasks"]))
    r = client.put(f"/cultivation/{USER}/{s['id']}/task/{task_id}", json={"status": "done"})
    assert r.status_code == 200
    assert r.json()["status"] == "done"


def test_cultivation_update_task_invalid_status_400(memory_store):
    s = _start().json()
    task_id = next(iter(s["tasks"]))
    r = client.put(f"/cultivation/{USER}/{s['id']}/task/{task_id}", json={"status": "finished"})
    assert r.status_code == 400


def test_cultivation_update_unknown_session_404(memory_store):
    r = client.put(f"/cultivation/{USER}/no-such-session/task/x", json={"status": "done"})
    assert r.status_code == 404


def test_cultivation_abandon(memory_store):
    sid = _start().json()["id"]
    assert client.delete(f"/cultivation/{USER}/{sid}").status_code == 204
    assert client.get(f"/cultivation/{USER}").json()["sessions"][0]["status"] == "abandoned"
    assert client.delete(f"/cultivation/{USER}/no-such-session").status_code == 404


# ── Weather ───────────────────────────────────────────────────────────────────
FORECAST = {
    "current": {"temperature_2m": 30.0, "relative_humidity_2m": 85, "wind_speed_10m": 12,
                "precipitation": 0.0, "weather_code": 2},
    "daily": {
        "time": ["2026-09-17", "2026-09-18"],
        "temperature_2m_max": [32, 31], "temperature_2m_min": [24, 23],
        "precipitation_sum": [2.0, 12.0], "precipitation_probability_max": [20, 80],
        "weather_code": [2, 63], "wind_speed_10m_max": [15, 18], "relative_humidity_2m_max": [85, 90],
    },
}
ARCHIVE = {"daily": {"precipitation_sum": [10.0, None, 5.5],
                     "temperature_2m_mean": [27.0, 28.0, 29.0],
                     "relative_humidity_2m_mean": [80.0, 82.0, 84.0]}}


def test_weather_invalid_district_400():
    assert client.get("/weather", params={"district": "Atlantis"}).status_code == 400


def test_weather_invalid_season_400():
    assert client.get("/weather", params={"district": "Kandy", "season": "Winter"}).status_code == 400


def test_weather_parses_open_meteo(monkeypatch):
    async def fake_get(self, url, *args, **kwargs):
        body = ARCHIVE if "archive-api" in url else FORECAST
        return httpx.Response(200, json=body, request=httpx.Request("GET", url))
    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)

    r = client.get("/weather", params={"district": "Kandy", "season": "Yala"})
    assert r.status_code == 200
    d = r.json()
    assert d["current"]["temperature"] == 30.0
    assert len(d["forecast"]) == 2
    assert d["season_name"] == "Yala"
    assert d["season_actual_mm"] == 15.5          # None values skipped
    assert d["season_avg_temp"] == 28.0
    assert d["seasonal_rainfall"]["Yala"] == 700  # Kandy lookup table
    titles = [a["title"] for a in d["advice"]]
    assert ml._ADVICE_TEXT["avoid_chem_rain"]["en"]["title"] in titles  # 12 mm tomorrow
    assert ml._ADVICE_TEXT["disease_risk"]["en"]["title"] in titles     # humidity 85%


def test_weather_upstream_error_502(monkeypatch):
    async def fake_get(self, url, *args, **kwargs):
        return httpx.Response(500, text="down", request=httpx.Request("GET", url))
    monkeypatch.setattr(httpx.AsyncClient, "get", fake_get)
    assert client.get("/weather", params={"district": "Kandy"}).status_code == 502


# ── Rule-based helpers ────────────────────────────────────────────────────────
def _advice_keys(**kw):
    args = dict(temp=25, humidity=60, wind_kph=10, rain_today_mm=5, rain_tomorrow_mm=0,
                weather_code=2, precip_prob_tomorrow=0, rain_today_total=10)
    args.update(kw)
    titles = {a["title"] for a in ml._agricultural_advice(**args)}
    return {k for k, v in ml._ADVICE_TEXT.items() if v["en"]["title"] in titles}


@pytest.mark.parametrize("kw, expected", [
    ({"rain_tomorrow_mm": 5},        "avoid_chem_rain"),
    ({"rain_today_total": 61},       "fert_wet"),
    ({"rain_today_total": 30},       "fert_good"),
    ({"rain_today_total": 4},        "fert_dry"),
    ({"humidity": 81},               "disease_risk"),
    ({"temp": 36},                   "increase_irr"),
    ({"temp": 14},                   "cold_stress"),
    ({"wind_kph": 31},               "avoid_spray"),
    ({"weather_code": 95},           "thunderstorm"),
    ({},                             "normal"),
])
def test_agricultural_advice_thresholds(kw, expected):
    assert expected in _advice_keys(**kw)


def test_agricultural_advice_boundaries_not_triggered():
    keys = _advice_keys(rain_tomorrow_mm=4.9, humidity=80, temp=35, wind_kph=30)
    assert not keys & {"avoid_chem_rain", "disease_risk", "increase_irr", "avoid_spray"}


def test_agricultural_advice_translated():
    advice = ml._agricultural_advice(25, 85, 10, 0, 0, 2, lang="si")
    assert ml._ADVICE_TEXT["disease_risk"]["si"]["title"] in {a["title"] for a in advice}


def test_season_range_maha_after_season_leap_year(monkeypatch):
    _fixed_today(monkeypatch, 2028, 3, 15)
    assert ml._season_date_range("Maha") == ("Maha", "2027-10-01", "2028-02-29")


def test_season_range_yala_before_season(monkeypatch):
    _fixed_today(monkeypatch, 2026, 1, 20)
    assert ml._season_date_range("Yala") == ("Yala", "2025-05-01", "2025-09-30")


def test_season_range_in_progress_ends_yesterday(monkeypatch):
    _fixed_today(monkeypatch, 2026, 7, 10)
    assert ml._season_date_range("Yala") == ("Yala", "2026-05-01", "2026-07-09")


def test_season_range_autodetect(monkeypatch):
    _fixed_today(monkeypatch, 2026, 11, 5)
    assert ml._season_date_range()[0] == "Maha"
    _fixed_today(monkeypatch, 2026, 3, 5)
    assert ml._season_date_range()[0] == "Year-round"


def test_season_range_first_day_never_empty(monkeypatch):
    _fixed_today(monkeypatch, 2026, 1, 1)
    _, start, end = ml._season_date_range("Year-round")
    assert start == end == "2026-01-01"
