"""SMARTAGRI ML Service — v5.3.0

Changes vs v5.2:
- Ensemble swapped to RF + XGBoost (was RF + ET + HGB×2)
- pandas removed from inference path — inputs built as numpy arrays
- XAI uses RF sub-estimator extracted from ensemble via named_estimators_
- scipy removed — temperature calibration uses golden-section search
- uvicorn[standard] extras dropped
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict, Any
import asyncio
import joblib, json, hashlib, logging, os, ssl
import numpy as np
from pathlib import Path
import httpx
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

# Python 3.10+ raises on unexpected TLS EOF; this flag restores the lenient behaviour.
_SSL_CTX = ssl.create_default_context()
_SSL_CTX.options |= getattr(ssl, "OP_IGNORE_UNEXPECTED_EOF", 0)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("smartagri")

# ── Database (shared PostgreSQL at :5432) ─────────────────────────────────────
# NOTE: run this service as 'uvicorn ml_service.app:app' from the backend/ dir,
# NOT as 'uvicorn app:app' from ml_service/. The latter puts this file in
# sys.modules["app"], blocking imports from backend/app/.
import sys as _sys
_backend_dir = str(Path(__file__).parent.parent)
if _backend_dir not in _sys.path:
    _sys.path.insert(0, _backend_dir)

try:
    from app.db.database import SessionLocal as _SessionLocal
    from app.models.cultivation import CultivationSession as _CultivationSession
    from app.models.cultivation import CultivationTask as _CultivationTask
    from sqlalchemy.orm import Session as _OrmSession
    from sqlalchemy import select as _select
    _DB_AVAILABLE = True
    logger.info("[OK] Cultivation DB (PostgreSQL) connected")
except Exception as _db_err:
    _DB_AVAILABLE = False
    logger.warning("[WARN] Cultivation DB unavailable: %s — sessions will be in-memory only", _db_err)

from app.utils.image_storage import ImageTooLargeError, InvalidImageError, store_image as _store_task_photo

app = FastAPI(
    title="SMARTAGRI ML Service",
    description="Explainable dual-mode crop recommendation for Sri Lanka",
    version="5.3.0",
)

_cors_origins = os.getenv(
    "SMARTAGRI_CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000,"
    "http://localhost:4173,http://127.0.0.1:4173,http://127.0.0.1:5173,"
    "http://127.0.0.1:5174,http://127.0.0.1:5175"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Valid categorical values ──────────────────────────────────────────────────
VALID_SOIL_TYPES = {
    "Alluvial", "Alluvial Loam", "Bog and Half-Bog Soil", "Clay Loam", "Clay Soil",
    "Deep Loam", "Deep Sandy Loam", "Fertile Loam", "Humic Gley", "Immature Brown Loam",
    "Lateritic Loam", "Lateritic Soil", "Light Loam", "Light Sandy Loam", "Loam",
    "Loamy Sand", "Low-Humic Gley", "Mountain Regosol", "Non-Calcic Brown Earth",
    "Organic-Rich Loam", "Red Loam", "Red-Brown Earth", "Red-Yellow Latosol",
    "Red-Yellow Podzolic", "Reddish-Brown Earth", "Reddish-Brown Latosol", "Regosol",
    "Sandy Clay Loam", "Sandy Loam", "Sandy Regosol", "Sandy Soil", "Silt Loam",
    "Well Drained Loam",
    # Added with new crops (v5.3)
    "Marshy Soil",
}
VALID_AGRO_ZONES = {
    "Dry Zone", "Wet Zone", "Intermediate Zone", "Low Country Dry Zone",
    "Low Country Wet Zone", "Low Country Intermediate Zone", "Mid Country Wet Zone",
    "Mid Country Intermediate Zone", "Up Country Wet Zone", "Up Country Intermediate Zone",
    "Dry Coastal Zone", "Northern Dry Zone", "Eastern Dry Zone",
    "Mahaweli H Zone", "Dry Zone with Irrigation",
}
VALID_IRRIGATION = {"Rainfed", "Irrigated", "Supplemental"}
VALID_SEASONS    = {"Maha", "Yala", "Year-round"}

FULL_CAT_FEATURES   = ["Soil_Type", "Agro_Zone", "Irrigation", "Season"]
FULL_NUM_FEATURES   = ["N", "P", "K", "Temperature", "Rainfall", "pH", "Humidity"]

PLANTING_WINDOWS = {
    "Maha":       {"plant_start": 10, "plant_end": 1},
    "Yala":       {"plant_start": 4,  "plant_end": 5},
    "Year-round": {"plant_start": 1,  "plant_end": 12},
}
HARVEST_FALLBACK = {
    "Maha":       {"harvest_start": 3, "harvest_end": 5},
    "Yala":       {"harvest_start": 8, "harvest_end": 9},
    "Year-round": {"harvest_start": 1, "harvest_end": 12},
}


# ── Pydantic models ───────────────────────────────────────────────────────────
class SimplifiedModeRequest(BaseModel):
    Soil_Type:   str
    Agro_Zone:   str
    Irrigation:  str
    Season:      str
    District:    Optional[str]   = None
    # Weather-sourced parameters — auto-filled from live weather API
    Temperature: Optional[float] = None
    Rainfall:    Optional[float] = None
    Humidity:    Optional[float] = None

    @field_validator("Soil_Type")
    @classmethod
    def validate_soil(cls, v):
        if v not in VALID_SOIL_TYPES:
            raise ValueError(f"Invalid Soil_Type '{v}'.")
        return v

    @field_validator("Agro_Zone")
    @classmethod
    def validate_zone(cls, v):
        if v not in VALID_AGRO_ZONES:
            raise ValueError(f"Invalid Agro_Zone '{v}'.")
        return v

    @field_validator("Irrigation")
    @classmethod
    def validate_irrigation(cls, v):
        if v not in VALID_IRRIGATION:
            raise ValueError(f"Invalid Irrigation '{v}'. Must be: Rainfed, Irrigated, or Supplemental.")
        return v

    @field_validator("Season")
    @classmethod
    def validate_season(cls, v):
        if v not in VALID_SEASONS:
            raise ValueError(f"Invalid Season '{v}'. Must be: Maha, Yala, or Year-round.")
        return v

    @field_validator("Temperature")
    @classmethod
    def validate_temp(cls, v):
        if v is not None and not (5 <= v <= 45):
            raise ValueError("Temperature must be 5-45 °C.")
        return v

    @field_validator("Rainfall")
    @classmethod
    def validate_rainfall(cls, v):
        if v is not None and not (0 <= v <= 5000):
            raise ValueError("Rainfall must be 0-5000 mm.")
        return v

    @field_validator("Humidity")
    @classmethod
    def validate_humidity(cls, v):
        if v is not None and not (0 <= v <= 100):
            raise ValueError("Humidity must be 0-100 %.")
        return v


class FullModeRequest(SimplifiedModeRequest):
    N:           float
    P:           float
    K:           float
    Temperature: float
    Rainfall:    float
    pH:          float
    Humidity:    float

    @field_validator("N")
    @classmethod
    def validate_N(cls, v):
        if not (0 <= v <= 300): raise ValueError("N must be 0-300 kg/ha.")
        return v

    @field_validator("P")
    @classmethod
    def validate_P(cls, v):
        if not (0 <= v <= 200): raise ValueError("P must be 0-200 kg/ha.")
        return v

    @field_validator("K")
    @classmethod
    def validate_K(cls, v):
        if not (0 <= v <= 300): raise ValueError("K must be 0-300 kg/ha.")
        return v

    @field_validator("Temperature")
    @classmethod
    def validate_temp(cls, v):
        if not (5 <= v <= 45): raise ValueError("Temperature must be 5-45 C.")
        return v

    @field_validator("Rainfall")
    @classmethod
    def validate_rainfall(cls, v):
        if not (0 <= v <= 5000): raise ValueError("Rainfall must be 0-5000 mm.")
        return v

    @field_validator("pH")
    @classmethod
    def validate_ph(cls, v):
        if not (3.0 <= v <= 10.0): raise ValueError("pH must be 3.0-10.0.")
        return v

    @field_validator("Humidity")
    @classmethod
    def validate_humidity(cls, v):
        if not (0 <= v <= 100): raise ValueError("Humidity must be 0-100%.")
        return v


class XAIFeature(BaseModel):
    feature:   str
    label:     str
    label_si:  str = ""
    label_ta:  str = ""
    score:     float
    direction: str
    value:     Optional[float] = None
    ideal_min: Optional[float] = None
    ideal_max: Optional[float] = None


class Warning(BaseModel):
    field:      str
    message_en: str
    message_si: str
    message_ta: str


class PlantingCalendar(BaseModel):
    plant_start:   int
    plant_end:     int
    harvest_start: int
    harvest_end:   int


class CropInfo(BaseModel):
    crop_duration_min:   Optional[float] = None
    crop_duration_max:   Optional[float] = None
    water_required_min:  Optional[float] = None
    water_required_max:  Optional[float] = None
    rainfall_min:        Optional[float] = None
    rainfall_max:        Optional[float] = None
    ph_min:              Optional[float] = None
    ph_max:              Optional[float] = None
    n_min:               Optional[float] = None
    n_max:               Optional[float] = None
    p_min:               Optional[float] = None
    p_max:               Optional[float] = None
    k_min:               Optional[float] = None
    k_max:               Optional[float] = None
    temp_min:            Optional[float] = None
    temp_max:            Optional[float] = None
    humidity_min:        Optional[float] = None
    humidity_max:        Optional[float] = None


class CropPrediction(BaseModel):
    crop:       str
    confidence: float
    crop_info:  Optional[CropInfo] = None


class PredictionResponse(BaseModel):
    mode:              str
    recommended_crop:  str
    confidence:        float
    low_confidence:    bool
    top_3:             List[CropPrediction]
    explanations:      List[str]
    xai_features:      List[XAIFeature]
    xai_is_global:     bool
    xai_summary:       Dict[str, str]
    warnings:          List[Warning]
    planting_calendar: Optional[PlantingCalendar] = None
    crop_info:         Optional[CropInfo] = None


class SuccessResponse(BaseModel):
    success: bool
    data:    PredictionResponse


# ── Model loading ─────────────────────────────────────────────────────────────
MODELS_DIR     = Path(__file__).parent.parent / "ai_models" / "training" / "models"
CROP_INFO_PATH = MODELS_DIR / "crop_info.json"


def _load(path, label):
    try:
        obj = joblib.load(path)
        logger.info("[OK] %s", label)
        return obj
    except Exception as e:
        logger.warning("[WARN] %s: %s", label, e)
        return None


full_model      = _load(MODELS_DIR / "crop_model_full.pkl",    "Full model")
full_label_enc  = _load(MODELS_DIR / "label_encoder_full.pkl", "Full label encoder")
full_model_info = _load(MODELS_DIR / "model_info_full.pkl",    "Full model info")

simple_model      = _load(MODELS_DIR / "crop_model_simple.pkl",    "Simple model")
simple_label_enc  = _load(MODELS_DIR / "label_encoder_simple.pkl", "Simple label encoder")
simple_model_info = _load(MODELS_DIR / "model_info_simple.pkl",    "Simple model info")

try:
    with open(CROP_INFO_PATH) as f:
        crop_info_db = json.load(f)
    logger.info("[OK] Crop info (%d crops)", len(crop_info_db))
except Exception as e:
    crop_info_db = {}
    logger.warning("[WARN] Crop info: %s", e)

GUIDANCE_PATH = MODELS_DIR / "crop_guidance.json"
try:
    with open(GUIDANCE_PATH, encoding="utf-8") as f:
        crop_guidance_db = json.load(f)
    logger.info("[OK] Crop guidance (%d crops)", len(crop_guidance_db))
except Exception as e:
    crop_guidance_db = {}
    logger.warning("[WARN] Crop guidance: %s", e)

# Pre-compute feature sets for O(1) column lookup during inference
_full_feature_set   = set(full_model_info["feature_columns"])   if full_model_info   else set()
_simple_feature_set = set(simple_model_info["feature_columns"]) if simple_model_info else set()

# Extract RF from ensemble for XAI (RF trees support decision-path traversal)
_xai_rf_model = None
if full_model is not None and hasattr(full_model, "named_estimators_"):
    _xai_rf_model = full_model.named_estimators_.get("rf")
    if _xai_rf_model is not None:
        logger.info("[OK] RF sub-model extracted for XAI")

_DEFAULT_TRAIN_STATS = {
    "N":           (100.6, 40.1),
    "P":           (65.9,  25.8),
    "K":           (94.1,  40.6),
    "Temperature": (26.5,  3.9),
    "Rainfall":    (1139.7, 545.4),
    "pH":          (6.3,   0.6),
    "Humidity":    (71.9,  9.3),
}

if full_model_info and "train_stats" in full_model_info:
    TRAIN_STATS = {k: (float(v[0]), float(v[1])) for k, v in full_model_info["train_stats"].items()}
    logger.info("[OK] Train stats loaded from model_info")
else:
    TRAIN_STATS = _DEFAULT_TRAIN_STATS
    logger.warning("[WARN] Train stats: using hardcoded defaults (retrain to fix)")

_cal_T = float(full_model_info.get("calibration_temperature", 1.0)) if full_model_info else 1.0
logger.info("[OK] Calibration temperature T=%.4f", _cal_T)


# ── Prediction cache ──────────────────────────────────────────────────────────
_prediction_cache: dict = {}
MAX_CACHE_SIZE = 500


def _cache_key(data: dict) -> str:
    return hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()


def _get_cached(key: str):
    return _prediction_cache.get(key)


def _set_cached(key: str, value):
    if len(_prediction_cache) >= MAX_CACHE_SIZE:
        del _prediction_cache[next(iter(_prediction_cache))]
    _prediction_cache[key] = value


# ── Input builders (numpy, no pandas) ────────────────────────────────────────
def _build_full_input(data: dict, feature_columns: list) -> np.ndarray:
    """Build full-mode input array from request dict without pandas."""
    N = float(data["N"]); P = float(data["P"]); K = float(data["K"])
    T = float(data["Temperature"]); R = float(data["Rainfall"])
    pH = float(data["pH"])
    row = {
        "N": N, "P": P, "K": K, "Temperature": T,
        "Rainfall": R, "pH": pH, "Humidity": float(data["Humidity"]),
        "N_P_Ratio":           N / (P + 1),
        "N_K_Ratio":           N / (K + 1),
        "P_K_Ratio":           P / (K + 1),
        "NPK_Sum":             N + P + K,
        "Rainfall_Temp_Ratio": R / (T + 1),
        "pH_Squared":          pH ** 2,
    }
    for col in FULL_CAT_FEATURES:
        ohe_col = f"{col}_{data[col]}"
        if ohe_col in _full_feature_set:
            row[ohe_col] = 1
    return np.array([[row.get(col, 0.0) for col in feature_columns]], dtype=np.float64)


def _build_simple_input(data: dict, cat_feats: list, feature_columns: list) -> np.ndarray:
    """Build simple-mode input array (OHE categoricals + optional weather numerics)."""
    row = {}
    # One-hot encode categorical features
    for col in cat_feats:
        val = data.get(col) or "Unknown"
        ohe_col = f"{col}_{val}"
        if ohe_col in _simple_feature_set:
            row[ohe_col] = 1
    # Weather numeric features (present in v2 model; fall back to dataset mean if missing)
    _WEATHER_DEFAULTS = {
        "Temperature": 26.5,
        "Rainfall":    1139.7,
        "Humidity":    71.9,
    }
    for col in ("Temperature", "Rainfall", "Humidity"):
        if col in _simple_feature_set:
            val = data.get(col)
            row[col] = float(val) if val is not None else _WEATHER_DEFAULTS[col]
    # Engineered: Rainfall / (Temperature + 1)
    if "Rainfall_Temp_Ratio" in _simple_feature_set:
        row["Rainfall_Temp_Ratio"] = row.get("Rainfall", _WEATHER_DEFAULTS["Rainfall"]) / \
                                     (row.get("Temperature", _WEATHER_DEFAULTS["Temperature"]) + 1)
    return np.array([[row.get(col, 0.0) for col in feature_columns]], dtype=np.float64)


# ── XAI helpers ───────────────────────────────────────────────────────────────
FEATURE_LABELS = {
    "N":                   {"en": "Nitrogen (N)",    "si": "නයිට්‍රජන් (N)",     "ta": "நைட்ரஜன் (N)"},
    "P":                   {"en": "Phosphorus (P)",  "si": "පොස්පරස් (P)",       "ta": "பாஸ்பரஸ் (P)"},
    "K":                   {"en": "Potassium (K)",   "si": "පොටෑසියම් (K)",      "ta": "பொட்டாசியம் (K)"},
    "Temperature":         {"en": "Temperature",     "si": "උෂ්ණත්වය",            "ta": "வெப்பநிலை"},
    "Rainfall":            {"en": "Rainfall",        "si": "වර්ෂාපතනය",           "ta": "மழைவீழ்ச்சி"},
    "pH":                  {"en": "Soil pH",         "si": "පාංශු pH",            "ta": "மண் pH"},
    "Humidity":            {"en": "Humidity",        "si": "ආර්ද්‍රතාවය",         "ta": "ஈரப்பதம்"},
    "NPK_Sum":             {"en": "Total nutrients", "si": "මුළු පෝෂක ප්‍රමාණය", "ta": "மொத்த ஊட்டச்சத்து"},
    "N_P_Ratio":           {"en": "N:P balance",     "si": "N:P සමතුලිතතාව",     "ta": "N:P சமநிலை"},
    "N_K_Ratio":           {"en": "N:K balance",     "si": "N:K සමතුලිතතාව",     "ta": "N:K சமநிலை"},
    "P_K_Ratio":           {"en": "P:K balance",     "si": "P:K සමතුලිතතාව",     "ta": "P:K சமநிலை"},
    "Rainfall_Temp_Ratio": {"en": "Climate index",   "si": "දේශගුණ දර්ශකය",      "ta": "காலநிலை குறியீடு"},
    "pH_Squared":          {"en": "pH sensitivity",  "si": "pH සංවේදීතාව",        "ta": "pH உணர்திறன்"},
}


def get_feature_contributions(rf_model, X_input: np.ndarray, pred_class_idx: int,
                               feature_names: list, top_n: int = 6) -> list:
    """Per-prediction feature contributions via RF decision-path traversal.

    Walks up to MAX_TREES individual decision trees that voted for the predicted
    class, accumulating impurity reduction at each split node.
    """
    contribs = np.zeros(X_input.shape[1])
    votes = 0
    MAX_TREES = 50
    for tree in rf_model.estimators_:
        if votes >= MAX_TREES:
            break
        if tree.predict(X_input)[0] != pred_class_idx:
            continue
        votes += 1
        node_indicator = tree.decision_path(X_input)
        node_ids = node_indicator.indices
        tree_ = tree.tree_
        for node_id in node_ids[:-1]:
            feat_idx = tree_.feature[node_id]
            if feat_idx < 0:
                continue
            l, r = tree_.children_left[node_id], tree_.children_right[node_id]
            n = tree_.n_node_samples[node_id]
            decrease = (
                tree_.impurity[node_id]
                - tree_.n_node_samples[l] / n * tree_.impurity[l]
                - tree_.n_node_samples[r] / n * tree_.impurity[r]
            )
            contribs[feat_idx] += decrease
    if votes > 0:
        contribs /= votes
    total = contribs.sum()
    if total > 0:
        contribs /= total
    top_idx = np.argsort(contribs)[-top_n:][::-1]
    results = []
    for i in top_idx:
        feat = feature_names[i]
        label_map = FEATURE_LABELS.get(feat, {"en": feat, "si": feat, "ta": feat})
        results.append({
            "feature":  feat,
            "label":    label_map["en"],
            "label_si": label_map["si"],
            "label_ta": label_map["ta"],
            "score":    float(contribs[i]),
        })
    return results


def build_xai_features(raw_contribs: list, user_inputs: dict, ci: dict) -> list:
    """Attach user values and ideal ranges; derive direction from value vs ideal range."""
    CI_MAP = {
        "N":           ("n_min",    "n_max"),
        "P":           ("p_min",    "p_max"),
        "K":           ("k_min",    "k_max"),
        "Temperature": ("temp_min", "temp_max"),
        "Rainfall":    ("rainfall_min", "rainfall_max"),
        "pH":          ("ph_min",   "ph_max"),
        "Humidity":    ("humidity_min", "humidity_max"),
    }
    out = []
    for c in raw_contribs:
        feat = c["feature"]
        val  = user_inputs.get(feat)
        imin = imax = None
        if ci and feat in CI_MAP:
            imin = ci.get(CI_MAP[feat][0])
            imax = ci.get(CI_MAP[feat][1])
        if val is not None and imin is not None and imax is not None:
            direction = "positive" if imin <= val <= imax else "negative"
        else:
            direction = "neutral"
        out.append(XAIFeature(
            feature=feat,
            label=c["label"],
            label_si=c.get("label_si", c["label"]),
            label_ta=c.get("label_ta", c["label"]),
            score=c["score"],
            direction=direction,
            value=val,
            ideal_min=imin,
            ideal_max=imax,
        ))
    return out


def generate_xai_summary(xai_features: list, crop: str, user_inputs: dict) -> dict:
    """Generate a 2-3 sentence natural-language explanation in all 3 languages."""
    top = xai_features[:3]
    parts_en, parts_si, parts_ta = [], [], []
    for f in top:
        feat = f.feature
        val  = f.value
        lbl  = FEATURE_LABELS.get(feat, {"en": f.label, "si": f.label, "ta": f.label})
        if val is not None and f.ideal_min is not None and f.ideal_max is not None:
            if f.ideal_min <= val <= f.ideal_max:
                parts_en.append(f"your {lbl['en']} of {val:.1f} is within the ideal range")
                parts_si.append(f"ඔබේ {lbl['si']} {val:.1f} සුදුසු පරාසය තුළ ඇත")
                parts_ta.append(f"உங்கள் {lbl['ta']} {val:.1f} சரியான வரம்பில் உள்ளது")
            elif val < f.ideal_min:
                parts_en.append(f"your {lbl['en']} ({val:.1f}) is below ideal - consider enriching")
                parts_si.append(f"ඔබේ {lbl['si']} ({val:.1f}) සුදුසු ප්‍රමාණයට අඩු ය")
                parts_ta.append(f"உங்கள் {lbl['ta']} ({val:.1f}) சரியான அளவுக்கு கீழே உள்ளது")
            else:
                parts_en.append(f"your {lbl['en']} ({val:.1f}) is higher than ideal")
                parts_si.append(f"ඔබේ {lbl['si']} ({val:.1f}) සුදුසු ප්‍රමාණයට වැඩි ය")
                parts_ta.append(f"உங்கள் {lbl['ta']} ({val:.1f}) சரியான அளவை விட அதிகமாக உள்ளது")
        else:
            parts_en.append(f"{lbl['en']} was a key factor")
            parts_si.append(f"{lbl['si']} ප්‍රධාන සාධකයකි")
            parts_ta.append(f"{lbl['ta']} முக்கிய காரணியாக இருந்தது")

    def join_en(p):
        if not p: return ""
        if len(p) == 1: return p[0].capitalize() + "."
        return p[0].capitalize() + ", " + " and ".join(p[1:]) + "."

    return {
        "en": f"{crop} was recommended because {join_en(parts_en)}",
        "si": f"{crop} නිර්දේශ කරන ලද්දේ: {' '.join(parts_si)}.",
        "ta": f"{crop} பரிந்துரைக்கப்பட்டது ஏனெனில்: {', '.join(parts_ta)}.",
    }


def check_warnings(user_inputs: dict) -> list:
    """Return warnings for values outside ±3σ of the training distribution."""
    field_labels = {
        "N":           {"en": "Nitrogen (N)",   "si": "නයිට්‍රජන් (N)",  "ta": "நைட்ரஜன் (N)"},
        "P":           {"en": "Phosphorus (P)", "si": "පොස්පරස් (P)",    "ta": "பாஸ்பரஸ் (P)"},
        "K":           {"en": "Potassium (K)",  "si": "පොටෑසියම් (K)",   "ta": "பொட்டாசியம் (K)"},
        "Temperature": {"en": "Temperature",    "si": "උෂ්ණත්වය",         "ta": "வெப்பநிலை"},
        "Rainfall":    {"en": "Rainfall",       "si": "වර්ෂාපතනය",        "ta": "மழைவீழ்ச்சி"},
        "pH":          {"en": "Soil pH",        "si": "පාංශු pH",         "ta": "மண் pH"},
        "Humidity":    {"en": "Humidity",       "si": "ආර්ද්‍රතාවය",      "ta": "ஈரப்பதம்"},
    }
    warnings = []
    for field, (mean, std) in TRAIN_STATS.items():
        val = user_inputs.get(field)
        if val is None:
            continue
        lo, hi = mean - 3 * std, mean + 3 * std
        if val < lo or val > hi:
            lbl = field_labels[field]
            warnings.append(Warning(
                field=field,
                message_en=f"{lbl['en']} value {val} is unusual - prediction may be less reliable.",
                message_si=f"{lbl['si']} අගය {val} අසාමාන්‍ය ය — අනාවැකිය අඩු විශ්වාසදායී විය හැකිය.",
                message_ta=f"{lbl['ta']} மதிப்பு {val} அசாதாரணமானது — கணிப்பு நம்பகத்தன்மை குறையலாம்.",
            ))
    return warnings


# ── Shared helpers ────────────────────────────────────────────────────────────
def _apply_temperature(proba: np.ndarray, T: float) -> np.ndarray:
    if abs(T - 1.0) < 1e-4:
        return proba
    log_p = np.log(proba + 1e-12) / T
    log_p -= log_p.max()
    p = np.exp(log_p)
    return p / p.sum()


def _build_top3(proba: np.ndarray, label_enc):
    top3_idx   = np.argsort(proba)[-3:][::-1]
    top3_crops = label_enc.inverse_transform(top3_idx)
    top3_conf  = proba[top3_idx]
    return top3_crops, top3_conf


def _get_crop_info(crop_name: str) -> Optional[CropInfo]:
    if crop_name in crop_info_db:
        return CropInfo(**crop_info_db[crop_name])
    return None


def _get_calendar(season: str, crop_name: str = None) -> Optional[PlantingCalendar]:
    window = PLANTING_WINDOWS.get(season)
    if not window:
        return None
    plant_start = window["plant_start"]
    plant_end   = window["plant_end"]
    if season == "Year-round":
        return PlantingCalendar(plant_start=1, plant_end=12, harvest_start=1, harvest_end=12)
    ci = crop_info_db.get(crop_name) if crop_name else None
    if ci and ci.get("crop_duration_min") and ci.get("crop_duration_max"):
        months_min    = max(1, round(ci["crop_duration_min"] / 30))
        months_max    = max(1, round(ci["crop_duration_max"] / 30))
        harvest_start = ((plant_start - 1 + months_min) % 12) + 1
        harvest_end   = ((plant_end   - 1 + months_max) % 12) + 1
    else:
        fb = HARVEST_FALLBACK.get(season, {})
        harvest_start = fb.get("harvest_start", 1)
        harvest_end   = fb.get("harvest_end",   12)
    return PlantingCalendar(
        plant_start=plant_start, plant_end=plant_end,
        harvest_start=harvest_start, harvest_end=harvest_end,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status":  "ok",
        "version": "5.3.0",
        "full_model": {
            "loaded":          full_model is not None,
            "accuracy":        full_model_info.get("accuracy")   if full_model_info else None,
            "type":            full_model_info.get("model_type") if full_model_info else None,
            "calibration_T":   _cal_T,
            "train_stats_src": "model_info" if (full_model_info and "train_stats" in full_model_info) else "hardcoded_defaults",
        },
        "simple_model": {
            "loaded":           simple_model is not None,
            "accuracy":         simple_model_info.get("accuracy")         if simple_model_info else None,
            "mode":             simple_model_info.get("mode", "simple")   if simple_model_info else None,
            "weather_enhanced": simple_model_info.get("weather_auto_fill") is not None if simple_model_info else False,
        },
        "crop_info_crops": len(crop_info_db),
        "cache_entries":   len(_prediction_cache),
        "features": [
            "xai_per_prediction", "xai_direction", "xai_multilingual",
            "warnings_3sigma", "crop_specific_calendar",
            "caching", "logging", "temperature_scaling",
        ],
    }


@app.get("/meta")
async def meta():
    return {
        "soil_types":  sorted(VALID_SOIL_TYPES),
        "agro_zones":  sorted(VALID_AGRO_ZONES),
        "irrigations": sorted(VALID_IRRIGATION),
        "seasons":     sorted(VALID_SEASONS),
        "crops":       sorted(set(full_model_info["class_labels"]) if full_model_info else crop_info_db.keys()),
        "districts": [
            "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle",
            "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle",
            "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala",
            "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura",
            "Trincomalee", "Vavuniya",
        ],
        "numeric_ranges": {
            "N":           {"min": 0,   "max": 300,  "unit": "kg/ha"},
            "P":           {"min": 0,   "max": 200,  "unit": "kg/ha"},
            "K":           {"min": 0,   "max": 300,  "unit": "kg/ha"},
            "Temperature": {"min": 5,   "max": 45,   "unit": "C"},
            "Rainfall":    {"min": 0,   "max": 5000, "unit": "mm"},
            "pH":          {"min": 3.0, "max": 10.0, "unit": "pH"},
            "Humidity":    {"min": 0,   "max": 100,  "unit": "%"},
        },
    }


@app.post("/predict/full", response_model=SuccessResponse)
async def predict_full(request: FullModeRequest):
    if full_model is None:
        raise HTTPException(503, "Full model not loaded. Run train_full_model.py.")
    if _xai_rf_model is None:
        raise HTTPException(503, "RF sub-model not available for XAI. Retrain the full model.")
    try:
        data = request.model_dump()
        cache_key = _cache_key(data)
        if cached := _get_cached(cache_key):
            logger.info("full cache hit | crop=%s", cached.data.recommended_crop)
            return cached

        logger.info("full predict | zone=%s season=%s", data.get("Agro_Zone"), data.get("Season"))

        input_arr = _build_full_input(data, full_model_info["feature_columns"])

        proba_raw      = full_model.predict_proba(input_arr)[0]
        proba          = _apply_temperature(proba_raw, _cal_T)
        pred_idx       = int(np.argmax(proba))
        predicted_crop = full_label_enc.inverse_transform([pred_idx])[0]
        top3_crops, top3_conf = _build_top3(proba, full_label_enc)
        low_conf = bool(float(top3_conf[0]) < 0.60)

        ci = crop_info_db.get(predicted_crop)

        raw_contribs = get_feature_contributions(
            _xai_rf_model, input_arr, pred_idx,
            full_model_info["feature_columns"], top_n=6,
        )
        xai_features  = build_xai_features(raw_contribs, data, ci)
        xai_summary   = generate_xai_summary(xai_features, predicted_crop, data)
        warnings_list = check_warnings(data)

        top3_out = [
            CropPrediction(crop=c, confidence=float(v), crop_info=_get_crop_info(c))
            for c, v in zip(top3_crops, top3_conf)
        ]
        expl = [
            f"Rainfall {data['Rainfall']} mm · {data['Temperature']}°C",
            f"pH {data['pH']} · {data['Soil_Type']}",
            f"N {data['N']} · P {data['P']} · K {data['K']} kg/ha",
            f"{data['Humidity']}% humidity · {data['Irrigation']} · {data['Season']}",
        ]

        result = SuccessResponse(success=True, data=PredictionResponse(
            mode="full",
            recommended_crop=predicted_crop,
            confidence=float(top3_conf[0]),
            low_confidence=low_conf,
            top_3=top3_out,
            explanations=expl,
            xai_features=xai_features,
            xai_is_global=False,
            xai_summary=xai_summary,
            warnings=warnings_list,
            planting_calendar=_get_calendar(data["Season"], predicted_crop),
            crop_info=_get_crop_info(predicted_crop),
        ))
        _set_cached(cache_key, result)
        logger.info("full result | crop=%s conf=%.2f low=%s", predicted_crop, float(top3_conf[0]), low_conf)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("predict_full error")
        raise HTTPException(500, f"Prediction error: {e}")


@app.post("/predict/simple", response_model=SuccessResponse)
async def predict_simple(request: SimplifiedModeRequest):
    if simple_model is None:
        raise HTTPException(503, "Simple model not loaded. Run train_simplified_model.py.")
    try:
        data = request.model_dump()
        cache_key = _cache_key(data)
        if cached := _get_cached(cache_key):
            logger.info("simple cache hit | crop=%s", cached.data.recommended_crop)
            return cached

        weather_provided = any(data.get(f) is not None for f in ("Temperature", "Rainfall", "Humidity"))
        logger.info("simple predict | zone=%s season=%s weather=%s",
                    data.get("Agro_Zone"), data.get("Season"), weather_provided)

        cat_feats = simple_model_info["categorical_features"]
        input_arr = _build_simple_input(data, cat_feats, simple_model_info["feature_columns"])

        proba          = simple_model.predict_proba(input_arr)[0]
        pred_idx       = simple_model.predict(input_arr)[0]
        predicted_crop = simple_label_enc.inverse_transform([pred_idx])[0]
        top3_crops, top3_conf = _build_top3(proba, simple_label_enc)
        low_conf = bool(float(top3_conf[0]) < 0.60)

        ci = crop_info_db.get(predicted_crop)

        # Feature importance-based XAI (global for simple mode)
        fi   = simple_model.feature_importances_
        fn   = simple_model_info["feature_columns"]
        top6 = np.argsort(fi)[-6:][::-1]
        raw_contribs = []
        for i in top6:
            feat_name = fn[i]
            base = next((k for k in FEATURE_LABELS if feat_name.startswith(k)), feat_name)
            lmap = FEATURE_LABELS.get(base, {"en": feat_name, "si": feat_name, "ta": feat_name})
            raw_contribs.append({
                "feature":  base if base in FEATURE_LABELS else feat_name,
                "label":    lmap["en"],
                "label_si": lmap["si"],
                "label_ta": lmap["ta"],
                "score":    float(fi[i]),
            })

        # For weather features that were provided, attach value + ideal range (direction)
        xai_features_list = build_xai_features(raw_contribs, data, ci) if weather_provided \
                            else [
                                XAIFeature(
                                    feature=c["feature"], label=c["label"],
                                    label_si=c.get("label_si", c["label"]),
                                    label_ta=c.get("label_ta", c["label"]),
                                    score=c["score"], direction="neutral",
                                )
                                for c in raw_contribs
                            ]

        district_en = f" in {data.get('District')}"            if data.get("District") else ""
        district_si = f" {data.get('District')} දිස්ත්‍රික්කයේ" if data.get("District") else ""
        district_ta = f" {data.get('District')} மாவட்டத்தில்"   if data.get("District") else ""

        if weather_provided:
            wx_parts = []
            if data.get("Temperature") is not None:
                wx_parts.append(f"{data['Temperature']}°C")
            if data.get("Rainfall") is not None:
                wx_parts.append(f"{data['Rainfall']} mm rainfall")
            if data.get("Humidity") is not None:
                wx_parts.append(f"{data['Humidity']}% humidity")
            wx_str = ", ".join(wx_parts)
            xai_summary = {
                "en": f"{predicted_crop} best matches your conditions{district_en} — soil, zone, irrigation, season, and live weather ({wx_str}).",
                "si": f"{predicted_crop}{district_si} ඔබේ පාංශු, කලාපය, වාරිමාර්ග, කාලය සහ කාලගුණ ({wx_str}) සඳහා ගැළපේ.",
                "ta": f"{predicted_crop}{district_ta} உங்கள் மண், மண்டலம், பாசனம், பருவம் மற்றும் வானிலை ({wx_str}) நிலைகளுக்கு பொருந்துகிறது.",
            }
        else:
            xai_summary = {
                "en": f"{predicted_crop} best matches your soil, zone, irrigation and season{district_en}.",
                "si": f"{predicted_crop}{district_si} ඔබේ පාංශු වර්ගය, කලාපය, වාරිමාර්ග සහ කාලය සඳහා ගැළපේ.",
                "ta": f"{predicted_crop}{district_ta} உங்கள் மண் வகை, மண்டலம், பாசனம் மற்றும் பருவத்திற்கு பொருந்துகிறது.",
            }

        top3_out = [
            CropPrediction(crop=c, confidence=float(v), crop_info=_get_crop_info(c))
            for c, v in zip(top3_crops, top3_conf)
        ]
        expl = [
            f"Soil: {data['Soil_Type']}",
            f"Zone: {data['Agro_Zone']}",
            f"Water: {data['Irrigation']}",
            f"Season: {data['Season']}",
        ]
        if weather_provided:
            if data.get("Temperature") is not None:
                expl.append(f"Temperature: {data['Temperature']}°C (live)")
            if data.get("Rainfall") is not None:
                expl.append(f"Rainfall: {data['Rainfall']} mm (live)")
            if data.get("Humidity") is not None:
                expl.append(f"Humidity: {data['Humidity']}% (live)")

        warnings_list = check_warnings(data) if weather_provided else []

        mode_str = "simple_weather" if weather_provided else "simple"

        result = SuccessResponse(success=True, data=PredictionResponse(
            mode=mode_str,
            recommended_crop=predicted_crop,
            confidence=float(top3_conf[0]),
            low_confidence=low_conf,
            top_3=top3_out,
            explanations=expl,
            xai_features=xai_features_list,
            xai_is_global=not weather_provided,
            xai_summary=xai_summary,
            warnings=warnings_list,
            planting_calendar=_get_calendar(data["Season"], predicted_crop),
            crop_info=_get_crop_info(predicted_crop),
        ))
        _set_cached(cache_key, result)
        logger.info("simple result | crop=%s conf=%.2f", predicted_crop, float(top3_conf[0]))
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("predict_simple error")
        raise HTTPException(500, f"Prediction error: {e}")


# ── Crop Guidance endpoints ───────────────────────────────────────────────────
@app.get("/guidance")
async def guidance_list():
    """Return a sorted list of crops that have guidance data available."""
    return {
        "crops": sorted(crop_guidance_db.keys()),
        "total": len(crop_guidance_db),
    }


@app.get("/guidance/{crop_name}")
async def guidance_detail(crop_name: str):
    """Return full lifecycle guidance for a given crop."""
    # Try exact match first, then case-insensitive
    data = crop_guidance_db.get(crop_name)
    if data is None:
        match = next(
            (k for k in crop_guidance_db if k.lower() == crop_name.lower()), None
        )
        if match:
            data = crop_guidance_db[match]
    if data is None:
        raise HTTPException(
            404,
            f"No guidance found for '{crop_name}'. "
            f"Available: {sorted(crop_guidance_db.keys())}",
        )
    return {"success": True, "crop": crop_name, "data": data}


# ── Cultivation tracker ───────────────────────────────────────────────────────
import calendar as _calendar
import uuid as _uuid
from datetime import date as _date, timedelta as _timedelta

# In-memory fallback (used only when DB is unavailable)
_cultivations_fallback: Dict[str, Dict] = {}


class StartCultivationRequest(BaseModel):
    user_id:       str
    crop:          str
    planting_date: str            # ISO date YYYY-MM-DD
    district:      Optional[str] = None
    crop_id:       Optional[str] = None   # UUID of the crops table row
    farm_id:       Optional[str] = None   # UUID of the farms table row


class TaskStatusUpdate(BaseModel):
    status: str  # done | skipped | pending | overdue
    photo: Optional[str] = None  # data URI (image/*) captured when marking the task done


def _gen_cultivation_tasks(crop_data: dict, planting_date_str: str) -> list:
    try:
        pd = _date.fromisoformat(planting_date_str)
    except ValueError:
        return []
    today = _date.today()
    tasks = []

    for stage in crop_data.get("stages", []):
        for i, act in enumerate(stage.get("activities", [])):
            day   = act.get("day", 0)
            sched = max(pd + _timedelta(days=day), today)
            tasks.append({
                "id":             f"s-{stage['id']}-{i}",
                "type":           act.get("type", "monitor"),
                "title":          act.get("title", ""),
                "description":    act.get("description", ""),
                "why":            act.get("why", ""),
                "day":            day,
                "scheduled_date": sched.isoformat(),
                "stage_id":       str(stage["id"]),
                "stage_name":     stage.get("name", ""),
                "status":         "pending",
            })

    for i, fert in enumerate(crop_data.get("fertilization", [])):
        day   = fert.get("day", 0)
        sched = max(pd + _timedelta(days=day), today)
        apps  = fert.get("applications", [])
        mat   = apps[0]["material"] if apps else fert.get("timing", "Fertilize")
        tasks.append({
            "id":             f"f-{i}",
            "type":           "fertilize",
            "title":          f"Fertilize: {mat}",
            "description":    fert.get("timing", ""),
            "why":            fert.get("why", ""),
            "day":            day,
            "scheduled_date": sched.isoformat(),
            "stage_id":       "fertilization",
            "stage_name":     "Fertilization",
            "status":         "pending",
        })

    irrigation = crop_data.get("irrigation", {})
    critical   = set(irrigation.get("critical_stages", []))
    irrig_note = irrigation.get("frequency", "")
    for stage in crop_data.get("stages", []):
        if stage.get("name") not in critical:
            continue
        start_d = max(0, stage.get("day_start", 0))
        end_d   = stage.get("day_end", start_d + 7)
        w = 0
        d = start_d
        while d <= end_d:
            sched = max(pd + _timedelta(days=d), today)
            tasks.append({
                "id":             f"irr-{stage['id']}-w{w}",
                "type":           "water",
                "title":          f"Irrigation check — {stage.get('name', '')}",
                "description":    irrig_note,
                "why":            "",
                "day":            d,
                "scheduled_date": sched.isoformat(),
                "stage_id":       str(stage["id"]),
                "stage_name":     stage.get("name", ""),
                "status":         "pending",
            })
            d += 7
            w += 1

    return tasks


def _session_to_dict(session: "_CultivationSession") -> dict:
    tasks_dict = {}
    for task in (session.tasks or []):
        tasks_dict[task.id] = {
            "id":             task.id,
            "type":           task.type,
            "title":          task.title,
            "description":    task.description or "",
            "why":            task.why or "",
            "day":            task.day,
            "scheduled_date": task.scheduled_date,
            "stage_id":       task.stage_id,
            "stage_name":     task.stage_name,
            "status":         task.status,
            "photo":          task.photo,
        }
    return {
        "id":            str(session.id),
        "user_id":       session.user_id,
        "crop":          session.crop,
        "crop_id":       str(session.crop_id) if session.crop_id else None,
        "farm_id":       str(session.farm_id) if session.farm_id else None,
        "planting_date": session.planting_date,
        "district":      session.district,
        "created_at":    session.created_at.date().isoformat() if session.created_at else None,
        "status":        session.status,
        "tasks":         tasks_dict,
    }


@app.post("/cultivation", status_code=201)
def start_cultivation(req: StartCultivationRequest):
    crop_data = crop_guidance_db.get(req.crop)
    if crop_data is None:
        raise HTTPException(404, f"No guidance for crop: {req.crop}")

    task_list = _gen_cultivation_tasks(crop_data, req.planting_date)
    logger.info("cultivation started | user=%s crop=%s tasks=%d", req.user_id[:8], req.crop, len(task_list))

    if _DB_AVAILABLE:
        try:
            import uuid as _u
            db: "_OrmSession" = _SessionLocal()
            try:
                crop_uuid  = _u.UUID(req.crop_id)  if req.crop_id  else None
                farm_uuid  = _u.UUID(req.farm_id)  if req.farm_id  else None
                session_obj = _CultivationSession(
                    user_id=req.user_id,
                    crop=req.crop,
                    crop_id=crop_uuid,
                    farm_id=farm_uuid,
                    planting_date=req.planting_date,
                    district=req.district,
                    status="active",
                )
                db.add(session_obj)
                db.flush()
                for t in task_list:
                    db.add(_CultivationTask(
                        id=f"{session_obj.id}-{t['id']}",
                        session_id=session_obj.id,
                        type=t["type"],
                        title=t["title"],
                        description=t.get("description", ""),
                        why=t.get("why", ""),
                        day=t["day"],
                        scheduled_date=t["scheduled_date"],
                        stage_id=t["stage_id"],
                        stage_name=t["stage_name"],
                        status=t["status"],
                    ))
                db.commit()
                db.refresh(session_obj)
                return _session_to_dict(session_obj)
            finally:
                db.close()
        except Exception as exc:
            logger.exception("DB cultivation create failed, falling back to memory: %s", exc)

    # ── fallback: in-memory ───────────────────────────────────────────────────
    session_id = str(_uuid.uuid4())
    session = {
        "id":            session_id,
        "user_id":       req.user_id,
        "crop":          req.crop,
        "crop_id":       req.crop_id,
        "farm_id":       req.farm_id,
        "planting_date": req.planting_date,
        "district":      req.district,
        "created_at":    _date.today().isoformat(),
        "status":        "active",
        "tasks":         {f"{session_id}-{t['id']}": {**t, "id": f"{session_id}-{t['id']}"} for t in task_list},
    }
    _cultivations_fallback.setdefault(req.user_id, {})[session_id] = session
    return session


@app.get("/cultivation/{user_id}")
def list_cultivations(user_id: str):
    if _DB_AVAILABLE:
        try:
            db: "_OrmSession" = _SessionLocal()
            try:
                rows = db.execute(
                    _select(_CultivationSession)
                    .where(_CultivationSession.user_id == user_id)
                    .order_by(_CultivationSession.created_at.desc())
                ).unique().scalars().all()
                return {"sessions": [_session_to_dict(r) for r in rows]}
            finally:
                db.close()
        except Exception as exc:
            logger.exception("DB cultivation list failed: %s", exc)

    sessions = list(_cultivations_fallback.get(user_id, {}).values())
    return {"sessions": sessions}


@app.put("/cultivation/{user_id}/{session_id}/task/{task_id}")
def update_cultivation_task(user_id: str, session_id: str, task_id: str, body: TaskStatusUpdate):
    if body.status not in ("done", "skipped", "pending", "overdue"):
        raise HTTPException(400, "status must be: done | skipped | pending | overdue")

    if _DB_AVAILABLE:
        try:
            db: "_OrmSession" = _SessionLocal()
            try:
                import uuid as _u
                try:
                    s_uuid = _u.UUID(session_id)
                except ValueError:
                    raise HTTPException(404, "Session not found")
                session_obj = db.execute(
                    _select(_CultivationSession).where(
                        _CultivationSession.id == s_uuid,
                        _CultivationSession.user_id == user_id,
                    )
                ).unique().scalar_one_or_none()
                if session_obj is None:
                    raise HTTPException(404, "Session not found")
                task_obj = db.execute(
                    _select(_CultivationTask).where(
                        _CultivationTask.id == task_id,
                        _CultivationTask.session_id == s_uuid,
                    )
                ).scalar_one_or_none()
                if task_obj is None:
                    raise HTTPException(404, "Task not found")
                task_obj.status = body.status
                if body.photo is not None:
                    task_obj.photo = _store_task_photo(body.photo)
                db.commit()
                return {
                    "id":             task_obj.id,
                    "type":           task_obj.type,
                    "title":          task_obj.title,
                    "description":    task_obj.description or "",
                    "why":            task_obj.why or "",
                    "day":            task_obj.day,
                    "scheduled_date": task_obj.scheduled_date,
                    "stage_id":       task_obj.stage_id,
                    "stage_name":     task_obj.stage_name,
                    "status":         task_obj.status,
                    "photo":          task_obj.photo,
                }
            finally:
                db.close()
        except HTTPException:
            raise
        except ImageTooLargeError as exc:
            raise HTTPException(413, str(exc))
        except InvalidImageError as exc:
            raise HTTPException(400, str(exc))
        except Exception as exc:
            logger.exception("DB task update failed: %s", exc)

    # ── fallback ──────────────────────────────────────────────────────────────
    session = _cultivations_fallback.get(user_id, {}).get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    task = session["tasks"].get(task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    task["status"] = body.status
    if body.photo is not None:
        try:
            task["photo"] = _store_task_photo(body.photo)
        except ImageTooLargeError as exc:
            raise HTTPException(413, str(exc))
        except InvalidImageError as exc:
            raise HTTPException(400, str(exc))
    return task


@app.delete("/cultivation/{user_id}/{session_id}", status_code=204)
def abandon_cultivation(user_id: str, session_id: str):
    if _DB_AVAILABLE:
        try:
            db: "_OrmSession" = _SessionLocal()
            try:
                import uuid as _u
                try:
                    s_uuid = _u.UUID(session_id)
                except ValueError:
                    raise HTTPException(404, "Session not found")
                session_obj = db.execute(
                    _select(_CultivationSession).where(
                        _CultivationSession.id == s_uuid,
                        _CultivationSession.user_id == user_id,
                    )
                ).unique().scalar_one_or_none()
                if session_obj is None:
                    raise HTTPException(404, "Session not found")
                session_obj.status = "abandoned"
                db.commit()
                return
            finally:
                db.close()
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("DB cultivation abandon failed: %s", exc)

    # ── fallback ──────────────────────────────────────────────────────────────
    user_sess = _cultivations_fallback.get(user_id, {})
    if session_id not in user_sess:
        raise HTTPException(404, "Session not found")
    user_sess[session_id]["status"] = "abandoned"


# ── Weather module — Open-Meteo ───────────────────────────────────────────────

# Seasonal rainfall lookup (mm) per district — Sri Lanka Meteorological Dept averages.
# Maha = Oct–Feb (NE monsoon), Yala = May–Sep (SW monsoon), Year-round = annual mean.
# These are the climatological seasonal totals the crop model was trained against.
DISTRICT_SEASON_RAINFALL: Dict[str, Dict[str, int]] = {
    "Ampara":       {"Maha": 1100, "Yala":  500, "Year-round": 1700},
    "Anuradhapura": {"Maha":  900, "Yala":  400, "Year-round": 1400},
    "Badulla":      {"Maha":  800, "Yala":  700, "Year-round": 1750},
    "Batticaloa":   {"Maha": 1200, "Yala":  500, "Year-round": 1700},
    "Colombo":      {"Maha":  900, "Yala":  600, "Year-round": 1800},
    "Galle":        {"Maha": 1200, "Yala":  900, "Year-round": 2500},
    "Gampaha":      {"Maha":  850, "Yala":  550, "Year-round": 1750},
    "Hambantota":   {"Maha":  700, "Yala":  350, "Year-round": 1100},
    "Jaffna":       {"Maha":  800, "Yala":  300, "Year-round": 1100},
    "Kalutara":     {"Maha": 1100, "Yala":  800, "Year-round": 2400},
    "Kandy":        {"Maha": 1000, "Yala":  700, "Year-round": 2000},
    "Kegalle":      {"Maha": 1200, "Yala":  800, "Year-round": 2600},
    "Kilinochchi":  {"Maha":  850, "Yala":  350, "Year-round": 1250},
    "Kurunegala":   {"Maha":  900, "Yala":  500, "Year-round": 1500},
    "Mannar":       {"Maha":  750, "Yala":  300, "Year-round": 1100},
    "Matale":       {"Maha":  900, "Yala":  600, "Year-round": 1800},
    "Matara":       {"Maha": 1100, "Yala":  800, "Year-round": 2300},
    "Monaragala":   {"Maha": 1000, "Yala":  500, "Year-round": 1800},
    "Mullaitivu":   {"Maha":  900, "Yala":  400, "Year-round": 1350},
    "Nuwara Eliya": {"Maha":  700, "Yala":  900, "Year-round": 2000},
    "Polonnaruwa":  {"Maha":  950, "Yala":  450, "Year-round": 1600},
    "Puttalam":     {"Maha":  800, "Yala":  400, "Year-round": 1200},
    "Ratnapura":    {"Maha": 1500, "Yala": 1100, "Year-round": 3500},
    "Trincomalee":  {"Maha": 1000, "Yala":  500, "Year-round": 1600},
    "Vavuniya":     {"Maha":  850, "Yala":  400, "Year-round": 1300},
}

DISTRICT_COORDS: Dict[str, tuple] = {
    "Ampara":        (7.2977, 81.6747),
    "Anuradhapura":  (8.3114, 80.4037),
    "Badulla":       (6.9934, 81.0550),
    "Batticaloa":    (7.7102, 81.6924),
    "Colombo":       (6.9271, 79.8612),
    "Galle":         (6.0535, 80.2210),
    "Gampaha":       (7.0873, 80.0144),
    "Hambantota":    (6.1429, 81.1212),
    "Jaffna":        (9.6615, 80.0255),
    "Kalutara":      (6.5854, 79.9607),
    "Kandy":         (7.2906, 80.6337),
    "Kegalle":       (7.2513, 80.3464),
    "Kilinochchi":   (9.3803, 80.4037),
    "Kurunegala":    (7.4818, 80.3609),
    "Mannar":        (8.9810, 79.9044),
    "Matale":        (7.4675, 80.6234),
    "Matara":        (5.9549, 80.5550),
    "Monaragala":    (6.8728, 81.3507),
    "Mullaitivu":    (9.2671, 80.8128),
    "Nuwara Eliya":  (6.9497, 80.7891),
    "Polonnaruwa":   (7.9403, 81.0188),
    "Puttalam":      (8.0362, 79.8283),
    "Ratnapura":     (6.6828, 80.3992),
    "Trincomalee":   (8.5874, 81.2152),
    "Vavuniya":      (8.7542, 80.4982),
}

# WMO weather codes (Open-Meteo) → {en, si, ta, icon}
_WMO_LABELS: Dict[int, Dict] = {
    0:  {"en": "Clear Sky",          "si": "පැහැදිලි අහස",            "ta": "தெளிவான வானம்",          "icon": "☀️"},
    1:  {"en": "Mainly Clear",       "si": "බොහෝ දුරට පැහැදිලි",       "ta": "பெரும்பாலும் தெளிவானது",  "icon": "🌤️"},
    2:  {"en": "Partly Cloudy",      "si": "අර්ධ වශයෙන් වළාකුළු",      "ta": "பகுதி மேகமூட்டம்",        "icon": "⛅"},
    3:  {"en": "Overcast",           "si": "සම්පූර්ණ වළාකුළු",          "ta": "முழு மேகமூட்டம்",         "icon": "☁️"},
    45: {"en": "Fog",                "si": "මීදුම",                     "ta": "மூடுபனி",                 "icon": "🌫️"},
    48: {"en": "Icy Fog",            "si": "ශීතල මීදුම",                "ta": "பனி மூடுபனி",             "icon": "🌫️"},
    51: {"en": "Light Drizzle",      "si": "සැහැල්ලු කිල්ලන් වැසි",     "ta": "இலேசான தூறல்",           "icon": "🌦️"},
    53: {"en": "Drizzle",            "si": "කිල්ලන් වැසි",               "ta": "தூறல்",                   "icon": "🌦️"},
    55: {"en": "Heavy Drizzle",      "si": "අධික කිල්ලන් වැසි",          "ta": "அதிகமான தூறல்",          "icon": "🌦️"},
    61: {"en": "Light Rain",         "si": "සැහැල්ලු වර්ෂාව",           "ta": "இலேசான மழை",             "icon": "🌦️"},
    63: {"en": "Rain",               "si": "වර්ෂාව",                    "ta": "மழை",                     "icon": "🌧️"},
    65: {"en": "Heavy Rain",         "si": "අධික වර්ෂාව",                "ta": "கனமழை",                  "icon": "🌧️"},
    71: {"en": "Light Snow",         "si": "සැහැල්ලු හිම",               "ta": "இலேசான பனிவீழ்ச்சி",    "icon": "🌨️"},
    73: {"en": "Snow",               "si": "හිම",                        "ta": "பனிவீழ்ச்சி",            "icon": "🌨️"},
    75: {"en": "Heavy Snow",         "si": "අධික හිම",                   "ta": "கனமான பனிவீழ்ச்சி",     "icon": "❄️"},
    77: {"en": "Snow Grains",        "si": "හිම කැට",                    "ta": "பனித்துகள்கள்",           "icon": "🌨️"},
    80: {"en": "Rain Showers",       "si": "ෂවර් වර්ෂාව",               "ta": "மழைப்பொழிவு",            "icon": "🌦️"},
    81: {"en": "Rain Showers",       "si": "ෂවර් වර්ෂාව",               "ta": "மழைப்பொழிவு",            "icon": "🌦️"},
    82: {"en": "Heavy Showers",      "si": "අධික ෂවර් වර්ෂාව",           "ta": "கடும் மழைப்பொழிவு",     "icon": "🌧️"},
    85: {"en": "Snow Showers",       "si": "හිම ෂවරය",                  "ta": "பனி மழைப்பொழிவு",        "icon": "🌨️"},
    86: {"en": "Heavy Snow Showers", "si": "අධික හිම ෂවරය",              "ta": "கடும் பனி மழைப்பொழிவு", "icon": "❄️"},
    95: {"en": "Thunderstorm",       "si": "ගිගිරුම් සහිත වැසි",         "ta": "இடி மழை",                "icon": "⛈️"},
    96: {"en": "Thunderstorm",       "si": "ගිගිරුම් සහිත වැසි",         "ta": "இடி மழை",                "icon": "⛈️"},
    99: {"en": "Thunderstorm",       "si": "ගිගිරුම් සහිත වැසි",         "ta": "இடி மழை",                "icon": "⛈️"},
}

_THUNDERSTORM_CODES = {95, 96, 99}

def _wmo_label(code: int, lang: str = "en") -> tuple:
    e = _WMO_LABELS.get(code, {"en": "Cloudy", "si": "වළාකුළු", "ta": "மேகமூட்டம்", "icon": "☁️"})
    return e.get(lang, e["en"]), e["icon"]


def _season_date_range(season: Optional[str] = None) -> tuple:
    """Returns (season_name, start_date_str, end_date_str) for the given or current Sri Lanka season.

    If season is provided (Maha/Yala/Year-round), returns the most recent window for that season.
    If omitted, auto-detects from the current calendar date (used by WeatherLocationPicker/CropGuidance).
    """
    today = _date.today()
    m = today.month
    y = today.year
    yesterday = today - _timedelta(days=1)   # archive API lags 1 day

    if season == "Maha":
        # Most recent Maha window (Oct–Feb).
        if m >= 10:                          # Oct–Dec: Maha in progress this year
            start = _date(y, 10, 1)
            end   = yesterday
        elif m <= 2:                         # Jan–Feb: Maha still ongoing (started last Oct)
            start = _date(y - 1, 10, 1)
            end   = yesterday
        else:                                # Mar–Sep: last completed Maha
            start = _date(y - 1, 10, 1)
            end   = _date(y, 2, _calendar.monthrange(y, 2)[1])  # handles leap years

    elif season == "Yala":
        # Most recent Yala window (May–Sep).
        if 5 <= m <= 9:                      # May–Sep: Yala in progress
            start = _date(y, 5, 1)
            end   = yesterday
        elif m >= 10:                        # Oct–Dec: Yala just ended this year
            start = _date(y, 5, 1)
            end   = _date(y, 9, 30)
        else:                                # Jan–Apr: use previous year's Yala
            start = _date(y - 1, 5, 1)
            end   = _date(y - 1, 9, 30)

    elif season == "Year-round":
        start = _date(y, 1, 1)
        end   = yesterday

    else:
        # Auto-detect from calendar date (existing behaviour).
        if m in (10, 11, 12):
            start  = _date(y, 10, 1)
            season = "Maha"
        elif m in (1, 2):
            start  = _date(y - 1, 10, 1)
            season = "Maha"
        elif m in (5, 6, 7, 8, 9):
            start  = _date(y, 5, 1)
            season = "Yala"
        else:
            start  = _date(y, 1, 1)
            season = "Year-round"
        end = yesterday

    # Clamp: never request future dates; always at least 1 day of data
    end = min(end, yesterday)
    if end < start:
        end = start

    return season, start.isoformat(), end.isoformat()


_ADVICE_TEXT = {
    "avoid_chem_rain": {
        "en": {
            "title": "Do Not Apply Chemicals — Rain Expected",
            "detail": "Rain forecast tomorrow ({rain} mm). Rain above 5 mm will wash pesticides and herbicides off before they are absorbed. Apply after the rain passes.",
        },
        "si": {
            "title": "රසායනික ද්‍රව්‍ය නොදමන්න — වර්ෂාව අපේක්ෂිතයි",
            "detail": "හෙට වර්ෂාව ({rain} mm). 5 mm ට වැඩි වර්ෂාව කෘමිනාශක සෝදා ගෙන යයි. වැස්ස ගිය පසු යෙදීම නිර්දේශ කෙරේ.",
        },
        "ta": {
            "title": "இரசாயனங்கள் தெளிக்காதீர்கள் — மழை எதிர்பார்க்கப்படுகிறது",
            "detail": "நாளை மழை ({rain} mm). 5 mm க்கு மேல் மழை பூச்சிக்கொல்லிகளை கழுவிவிடும். மழை நின்ற பிறகு தெளிக்கவும்.",
        },
    },
    "fert_good": {
        "en": {
            "title": "Good Time to Fertilize",
            "detail": "Rainfall of {rain} mm provides ideal soil moisture (30–60 mm) for fertilizer absorption. Apply now for best results.",
        },
        "si": {
            "title": "පොහොර යෙදීමට සුදුසු වේලාව",
            "detail": "වර්ෂාව {rain} mm — පොහොර අවශෝෂණයට ප්‍රශස්ත ආර්ද්‍රතාව (30–60 mm). දැන් යෙදීම නිර්දේශ කෙරේ.",
        },
        "ta": {
            "title": "உரமிட சிறந்த நேரம்",
            "detail": "மழை அளவு {rain} mm — உரம் உறிஞ்சுவதற்கு சிறந்த மண் ஈரப்பதம் (30–60 mm). இப்போது உரமிடவும்.",
        },
    },
    "fert_wet": {
        "en": {
            "title": "Avoid Fertilizing — Excessive Rain",
            "detail": "Rainfall of {rain} mm exceeds 60 mm. Heavy rain causes fertilizer runoff and leaching — nutrients will be lost before uptake.",
        },
        "si": {
            "title": "පොහොර නොදමන්න — අධික වර්ෂාව",
            "detail": "වර්ෂාව {rain} mm (60 mm ඉක්මවා). අධික වැස්ස නිසා පොහොර ගලා යයි — පෝෂකය අවශෝෂණ වීමට පෙර නැති වේ.",
        },
        "ta": {
            "title": "உரமிடாதீர்கள் — அதிகப்படியான மழை",
            "detail": "மழை {rain} mm (60 mm ஐ தாண்டியது). கடுமையான மழை உரத்தை கழுவிவிடும் — ஊட்டச்சத்து உறிஞ்சப்படுவதற்கு முன்பே போய்விடும்.",
        },
    },
    "fert_dry": {
        "en": {
            "title": "Fertilizing Not Recommended — Dry Soil",
            "detail": "Rainfall below 30 mm. Dry soil reduces fertilizer absorption. Water the field first or wait for moderate rain (30–60 mm) before applying fertilizer.",
        },
        "si": {
            "title": "පොහොර යෙදීම නිර්දේශ නොකෙරේ — වියළි පස",
            "detail": "වර්ෂාව 30 mm ට අඩු. වියළි පස පොහොර ශෝෂණය අඩු කරයි. ජලය ලබා දෙන්න හෝ මධ්‍යස්ථ වර්ෂාවකට (30–60 mm) බලා සිටින්න.",
        },
        "ta": {
            "title": "உரமிட பரிந்துரைக்கப்படவில்லை — வறண்ட மண்",
            "detail": "மழை 30 mm க்கு குறைவு. வறண்ட மண் உரம் உறிஞ்சுவதை குறைக்கும். வயலுக்கு நீர் பாய்ச்சவும் அல்லது மிதமான மழைக்கு (30–60 mm) காத்திருக்கவும்.",
        },
    },
    "disease_risk": {
        "en": {
            "title": "High Disease Risk",
            "detail": "Humidity is {hum}%. Monitor crops for fungal diseases (blight, rust, mildew). Improve air circulation where possible.",
        },
        "si": {
            "title": "ඉහළ රෝග අවදානම",
            "detail": "ආර්ද්‍රතාවය {hum}%. දිලීර රෝග (දූෂිත, මලකඳ) සඳහා බෝග නිරීක්ෂණය කරන්න. හැකි තැනක වාතාශ්‍රය වැඩිදියුණු කරන්න.",
        },
        "ta": {
            "title": "அதிக நோய் ஆபத்து",
            "detail": "ஈரப்பதம் {hum}%. பூஞ்சை நோய்களுக்கு (காய்ப்பழுக்கை, துருப்பூச்சு, தூள் நோய்) பயிர்களை கண்காணிக்கவும்.",
        },
    },
    "increase_irr": {
        "en": {
            "title": "Increase Irrigation",
            "detail": "Temperature is {temp}°C. Heat stress reduces yield — water early morning or evening to minimise evaporation.",
        },
        "si": {
            "title": "ජලසේචනය වැඩි කරන්න",
            "detail": "උෂ්ණය {temp}°C. තාප ආතතිය අස්වැන්න අඩු කරයි — ගේගල් ශෝෂණය අවම කිරීමට උදෑ හෝ සාය ජලය ලබා දෙන්න.",
        },
        "ta": {
            "title": "நீர்ப்பாசனம் அதிகரிக்கவும்",
            "detail": "வெப்பநிலை {temp}°C. வெப்ப அழுத்தம் மகசூலை குறைக்கும் — ஆவியாதலை குறைக்க காலை அல்லது மாலையில் நீர் பாய்ச்சவும்.",
        },
    },
    "cold_stress": {
        "en": {
            "title": "Cold Stress Alert",
            "detail": "Temperature is {temp}°C. Sensitive crops (tomato, pepper, bean) may suffer chilling injury. Consider protective covering at night.",
        },
        "si": {
            "title": "ශීතල ආතතිය අනතුරු ඇඟවීම",
            "detail": "උෂ්ණය {temp}°C. ස්පර්ශශීලී බෝග (තක්කාලි, ගම්මිරිස්, බෝංචි) ශීතල හානියට ලක් විය හැකිය. රාත්‍රී ආවරණ සලකා බලන්න.",
        },
        "ta": {
            "title": "குளிர் அழுத்த எச்சரிக்கை",
            "detail": "வெப்பநிலை {temp}°C. உணர்திறன் பயிர்கள் (தக்காளி, மிளகாய், பீன்ஸ்) குளிர் பாதிப்பிற்கு உள்ளாகலாம். இரவில் பாதுகாப்பு தேவை.",
        },
    },
    "avoid_spray": {
        "en": {
            "title": "Avoid Spraying",
            "detail": "Wind speed is {wind} km/h. Spraying pesticides or foliar fertilizers in high wind causes drift and uneven coverage.",
        },
        "si": {
            "title": "ඉසීමෙන් වළකින්න",
            "detail": "සුළං වේගය {wind} km/h. ප්‍රබල සුළඟේ ස්ප්‍රේ කිරීම ගලා යයි. සුළං 15 km/h ට අඩු වූ විට ස්ප්‍රේ කරන්න.",
        },
        "ta": {
            "title": "தெளிப்பதை தவிருங்கள்",
            "detail": "காற்று வேகம் {wind} km/h. அதிக காற்றில் தெளிப்பது பயனற்றது மற்றும் அருகிலுள்ள பயிர்களை பாதிக்கும்.",
        },
    },
    "thunderstorm": {
        "en": {
            "title": "Thunderstorm Warning",
            "detail": "Severe weather expected. Secure farm structures, stay indoors, and postpone all field operations.",
        },
        "si": {
            "title": "ගිගිරුම් අනතුරු ඇඟවීම",
            "detail": "ප්‍රබල කාලගුණ ඇතිවේ. ගොවිපළ ව්‍යූහ සුරක්ෂිත කරන්න, නිවස ඇතුළේ රැඳෙන්න. ක්ෂේත්‍ර ක්‍රියාකාරකම් කල් දමන්න.",
        },
        "ta": {
            "title": "இடியுடன் கூடிய புயல் எச்சரிக்கை",
            "detail": "கடுமையான வானிலை எதிர்பார்க்கப்படுகிறது. பண்ணை கட்டமைப்புகளை பாதுகாக்கவும், வீட்டினுள் இருக்கவும். வயல் பணிகளை ஒத்திடுங்கள்.",
        },
    },
    "good_conditions": {
        "en": {
            "title": "Good Conditions for Field Work",
            "detail": "Low rainfall and moderate humidity create favourable conditions for land preparation, harvesting, or crop inspection.",
        },
        "si": {
            "title": "ක්ෂේත්‍ර කටයුතු සඳහා හොඳ කොන්දේසි",
            "detail": "අඩු වර්ෂාව සහ මධ්‍යස්ථ ආර්ද්‍රතාවය — ඉඩම් සකස් කිරීම, අස්වනු නෙළීම හෝ බෝග පරීක්ෂාවට ශ්‍රේෂ්ඨ.",
        },
        "ta": {
            "title": "வயல் வேலைக்கு சிறந்த நிலைமைகள்",
            "detail": "குறைந்த மழை மற்றும் மிதமான ஈரப்பதம் — நிலம் தயாரிப்பு, அறுவடை அல்லது பயிர் பரிசோதனைக்கு ஏற்றது.",
        },
    },
    "normal": {
        "en": {
            "title": "Normal Conditions",
            "detail": "Weather conditions are within normal range. Continue regular farm activities.",
        },
        "si": {
            "title": "සාමාන්‍ය කොන්දේසි",
            "detail": "කාලගුණ කොන්දේසි සාමාන්‍ය පරාසය තුළ. නිත්‍ය ගොවිතැන් ක්‍රියාකාරකම් ඉදිරියට ගෙන යන්න.",
        },
        "ta": {
            "title": "சாதாரண நிலைமைகள்",
            "detail": "வானிலை நிலைமைகள் சாதாரண வரம்பில் உள்ளன. வழக்கமான பண்ணை நடவடிக்கைகளை தொடருங்கள்.",
        },
    },
}


def _agricultural_advice(temp: float, humidity: float, wind_kph: float,
                          rain_today_mm: float, rain_tomorrow_mm: float,
                          weather_code: int,
                          precip_prob_tomorrow: float = 0.0,
                          rain_today_total: float = 0.0,
                          lang: str = "en") -> List[Dict[str, str]]:
    L = lang if lang in ("si", "ta") else "en"
    advice = []

    # Chemical spraying: rain >= 5 mm tomorrow will wash off pesticides/herbicides
    if rain_tomorrow_mm >= 5:
        d = _ADVICE_TEXT["avoid_chem_rain"][L]
        advice.append({
            "type": "warning", "icon": "🚫",
            "title": d["title"],
            "detail": d["detail"].format(rain=f"{rain_tomorrow_mm:.0f}"),
        })

    # Fertilizing: soil moisture based on today's total + tomorrow's forecast
    # < 30 mm → dry (poor absorption), 30–60 mm → ideal, > 60 mm → runoff risk
    soil_mm = max(rain_today_total, rain_tomorrow_mm)
    if soil_mm > 60:
        d = _ADVICE_TEXT["fert_wet"][L]
        advice.append({
            "type": "warning", "icon": "🌊",
            "title": d["title"],
            "detail": d["detail"].format(rain=f"{soil_mm:.0f}"),
        })
    elif soil_mm >= 30:
        d = _ADVICE_TEXT["fert_good"][L]
        advice.append({
            "type": "action", "icon": "🌿",
            "title": d["title"],
            "detail": d["detail"].format(rain=f"{soil_mm:.0f}"),
        })
    elif soil_mm < 5:
        # Only flag explicitly when it's very dry (< 5 mm), to avoid noise on typical days
        d = _ADVICE_TEXT["fert_dry"][L]
        advice.append({
            "type": "info", "icon": "🏜️",
            "title": d["title"],
            "detail": d["detail"].format(rain=f"{soil_mm:.0f}"),
        })

    if humidity > 80:
        d = _ADVICE_TEXT["disease_risk"][L]
        advice.append({
            "type": "risk", "icon": "🦠",
            "title": d["title"],
            "detail": d["detail"].format(hum=f"{humidity:.0f}"),
        })

    if temp > 35:
        d = _ADVICE_TEXT["increase_irr"][L]
        advice.append({
            "type": "action", "icon": "💧",
            "title": d["title"],
            "detail": d["detail"].format(temp=f"{temp:.1f}"),
        })

    if temp < 15:
        d = _ADVICE_TEXT["cold_stress"][L]
        advice.append({
            "type": "risk", "icon": "🥶",
            "title": d["title"],
            "detail": d["detail"].format(temp=f"{temp:.1f}"),
        })

    if wind_kph > 30:
        d = _ADVICE_TEXT["avoid_spray"][L]
        advice.append({
            "type": "warning", "icon": "💨",
            "title": d["title"],
            "detail": d["detail"].format(wind=f"{wind_kph:.0f}"),
        })

    if weather_code in _THUNDERSTORM_CODES:
        d = _ADVICE_TEXT["thunderstorm"][L]
        advice.append({
            "type": "danger", "icon": "⛈️",
            "title": d["title"],
            "detail": d["detail"],
        })

    if rain_today_mm < 1 and humidity < 50 and temp > 28:
        d = _ADVICE_TEXT["good_conditions"][L]
        advice.append({
            "type": "action", "icon": "☀️",
            "title": d["title"],
            "detail": d["detail"],
        })

    if not advice:
        d = _ADVICE_TEXT["normal"][L]
        advice.append({
            "type": "info", "icon": "✅",
            "title": d["title"],
            "detail": d["detail"],
        })

    return advice


@app.get("/weather")
async def get_weather(district: str, season: Optional[str] = None, lang: str = "en"):
    if district not in DISTRICT_COORDS:
        raise HTTPException(400, f"Unknown district '{district}'. Valid districts: {sorted(DISTRICT_COORDS)}")
    if season is not None and season not in {"Maha", "Yala", "Year-round"}:
        raise HTTPException(400, f"Invalid season '{season}'. Must be Maha, Yala, or Year-round.")

    lat, lon = DISTRICT_COORDS[district]
    tz = "Asia/Colombo"

    # ── Build Open-Meteo URLs ─────────────────────────────────────────────────
    forecast_url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,"
        f"precipitation_probability_max,weather_code,wind_speed_10m_max,"
        f"relative_humidity_2m_max"
        f"&forecast_days=7&timezone={tz}"
    )

    season_name, hist_start, hist_end = _season_date_range(season)
    archive_url = (
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={lat}&longitude={lon}"
        f"&start_date={hist_start}&end_date={hist_end}"
        f"&daily=precipitation_sum,temperature_2m_mean,relative_humidity_2m_mean"
        f"&timezone={tz}"
    )

    try:
        async with httpx.AsyncClient(timeout=25.0, headers={"User-Agent": "SmartAgri/1.0"}) as client:
            forecast_resp, archive_resp = await asyncio.gather(
                client.get(forecast_url),
                client.get(archive_url),
            )
        forecast_resp.raise_for_status()
        archive_resp.raise_for_status()
        forecast_raw = forecast_resp.json()
        archive_raw  = archive_resp.json()
    except httpx.HTTPStatusError as e:
        logger.error("Open-Meteo HTTP error: %s", e.response.text)
        raise HTTPException(502, f"Weather API error: {e.response.status_code}")
    except Exception as e:
        logger.error("Weather fetch failed: %s %r", type(e).__name__, e)
        raise HTTPException(503, f"Could not reach weather service: {type(e).__name__}: {e}")

    # ── Parse current conditions ──────────────────────────────────────────────
    cur       = forecast_raw.get("current", {})
    temp      = float(cur.get("temperature_2m", 0))
    humidity  = float(cur.get("relative_humidity_2m", 0))
    wind_kph  = float(cur.get("wind_speed_10m", 0))
    rain_now  = float(cur.get("precipitation", 0))
    wcode     = int(cur.get("weather_code", 0))
    cond_label, cond_icon = _wmo_label(wcode, lang)

    # ── Parse 7-day forecast ──────────────────────────────────────────────────
    daily     = forecast_raw.get("daily", {})
    dates     = daily.get("time", [])
    rain_tomorrow      = 0.0
    precip_prob_tomorrow = 0.0
    if len(dates) > 1:
        rain_tomorrow        = float((daily.get("precipitation_sum") or [0, 0])[1] or 0)
        precip_prob_tomorrow = float((daily.get("precipitation_probability_max") or [0, 0])[1] or 0)

    forecast = []
    for i, d in enumerate(dates[:7]):
        dc = int((daily.get("weather_code") or [])[i] or 0)
        dl, di = _wmo_label(dc, lang)
        forecast.append({
            "date":        d,
            "max_temp":    float((daily.get("temperature_2m_max")              or [])[i] or temp),
            "min_temp":    float((daily.get("temperature_2m_min")              or [])[i] or temp),
            "rain_mm":     round(float((daily.get("precipitation_sum")         or [])[i] or 0), 1),
            "precip_prob": float((daily.get("precipitation_probability_max")   or [])[i] or 0),
            "humidity":    float((daily.get("relative_humidity_2m_max")        or [])[i] or humidity),
            "wind_kph":    float((daily.get("wind_speed_10m_max")              or [])[i] or wind_kph),
            "condition":   dl,
            "icon":        di,
        })

    # ── Actual season-to-date stats from archive ─────────────────────────────
    arch_daily   = archive_raw.get("daily", {})
    precip_list  = arch_daily.get("precipitation_sum") or []
    season_actual_mm = round(sum(v for v in precip_list if v is not None), 1)

    temp_list = [v for v in (arch_daily.get("temperature_2m_mean") or []) if v is not None]
    hum_list  = [v for v in (arch_daily.get("relative_humidity_2m_mean") or []) if v is not None]
    season_avg_temp     = round(sum(temp_list) / len(temp_list), 1) if temp_list else None
    season_avg_humidity = round(sum(hum_list)  / len(hum_list),  1) if hum_list  else None

    # Seasonal lookup (climatological expected totals — fallback / reference)
    seasonal_lookup = DISTRICT_SEASON_RAINFALL.get(district, {})

    rain_today_total = float((daily.get("precipitation_sum") or [0])[0] or 0)
    advice = _agricultural_advice(temp, humidity, wind_kph, rain_now, rain_tomorrow,
                                   wcode, precip_prob_tomorrow, rain_today_total, lang)

    return {
        "district":   district,
        "latitude":   lat,
        "longitude":  lon,
        "current": {
            "temperature":    temp,
            "humidity":       humidity,
            "wind_kph":       wind_kph,
            "rainfall_mm":    rain_now,
            "condition":      cond_label,
            "condition_icon": cond_icon,
            "weather_code":   wcode,
        },
        "forecast":   forecast,
        "advice":     advice,
        # Actual season-to-date stats from Open-Meteo archive
        "season_name":         season_name,
        "season_start":        hist_start,
        "season_actual_mm":    season_actual_mm,
        "season_avg_temp":     season_avg_temp,
        "season_avg_humidity": season_avg_humidity,
        # Climatological seasonal averages per season (lookup table fallback)
        "seasonal_rainfall":   seasonal_lookup,
        "source":              "Open-Meteo (open-meteo.com)",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
