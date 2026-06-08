# SmartAgri — Complete Project Documentation

**Version 5.3.0** | AI Crop Recommendation System for Sri Lanka

---

## Table of Contents

1. [What This Project Is](#1-what-this-project-is)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [How to Run](#4-how-to-run)
5. [Machine Learning Pipeline](#5-machine-learning-pipeline)
6. [Backend Architecture](#6-backend-architecture)
7. [Frontend Architecture](#7-frontend-architecture)
8. [API Reference](#8-api-reference)
9. [Project Evolution](#9-project-evolution)
10. [Design Decisions](#10-design-decisions)

---

## 1. What This Project Is

SmartAgri is an AI-powered crop recommendation system built for Sri Lankan farmers. A farmer enters their soil conditions, climate data, and farm location, and the system recommends the most suitable crop — with a full explanation of why that crop was chosen.

**The problem it solves:** Sri Lanka has 34 commonly grown crops, 15 agro-climatic zones, 25 districts, and 33 soil types. Choosing the right crop for your specific conditions is complex, especially for smallholder farmers without access to agricultural extension services.

**What the system does:**
- Takes soil and climate data as input (or just basic farm info for a quick estimate)
- Runs it through a trained ML ensemble (Random Forest + XGBoost)
- Returns the top 3 recommended crops with confidence scores
- Explains *why* each crop was recommended (which factors helped, which didn't)
- Shows a planting calendar specific to the recommended crop
- Warns if any input values are unusually extreme
- Works in English, Sinhala (සිංහල), and Tamil (தமிழ்)

---

## 2. Technology Stack

### Backend — Runtime (`requirements.txt`)

| Technology | Version | What it does in this project |
|---|---|---|
| **Python** | 3.10+ | The language the entire backend runs in. |
| **FastAPI** | 0.115.0 | Web framework. Defines all API endpoints (`/predict/full`, `/predict/simple`, `/health`, `/meta`). Handles HTTP routing, request parsing, and automatic response serialisation. |
| **Uvicorn** | 0.30.0 | ASGI server. Actually runs FastAPI — listens on port 8000 and hands incoming HTTP requests to FastAPI. FastAPI alone cannot serve traffic without it. |
| **Pydantic** | 2.7.0 | Data validation. Every API request is checked against a schema before the ML model sees it — e.g. pH must be 3.0–10.0, Season must be Maha/Yala/Year-round. FastAPI uses Pydantic automatically via type annotations. |
| **scikit-learn** | 1.5.0 | ML toolkit. Provides `RandomForestClassifier`, `VotingClassifier`, `LabelEncoder`, `train_test_split`, `GridSearchCV`. The Random Forest sub-model is also used for XAI (explainability). |
| **XGBoost** | 3.2.0 | Gradient boosted tree model. The second model in the ensemble. XGBoost learns sequentially — each tree corrects the errors of the previous one. Paired with Random Forest, the two cover each other's weaknesses. |
| **joblib** | 1.4.2 | Serialisation. Saves trained models to `.pkl` files and loads them on server startup. Without it we would have to retrain from scratch every time the server starts. |
| **NumPy** | 1.26.4 | Numerical computing. All array operations: building input vectors, probability calculations, temperature scaling, XAI impurity math. |
| **httpx** | 0.27.0 | HTTP client. Used by the `/weather` endpoint to call the Open-Meteo forecast and archive APIs. Also used by FastAPI's `TestClient` in tests. |

### Backend — Dev & Training (`requirements-dev.txt`)

These are only needed on the development machine — not in the production API container.

| Technology | What it does |
|---|---|
| **pandas** | Reads the training CSV, does feature engineering with named columns, builds the one-hot encoded feature matrix. Only used in training scripts, not in the running API. |
| **pytest** | Test runner. Runs the API tests in `backend/tests/test_api.py`. |

### Frontend

| Technology | Version | What it does in this project |
|---|---|---|
| **React** | 18.3.1 | UI framework. Manages all state (form inputs, prediction results, active language, prediction history), re-renders components reactively when data changes. |
| **React DOM** | 18.3.1 | Renders React component trees into actual browser HTML. React and React DOM are separate packages — React describes the UI, React DOM writes it to the page. |
| **Vite** | 5.4.0 | Build tool and dev server. Compiles JSX to JavaScript, proxies `/predict`, `/health`, and `/meta` API calls to the backend (so CORS is never an issue in development), and produces the optimised production bundle. |

**Notable: no UI component library, no CSS framework, no state management library (Redux/Zustand).** All components are hand-written, all styles are plain CSS with variables. This keeps the bundle small and removes build complexity.

---

## 3. Project Structure

```
SMARTAGRI_project/
├── .gitignore                          # Ignores .pkl files, node_modules, .env files
├── README.md                           # Quick-start guide
├── DOCS.md                             # This file — complete documentation
│
├── backend/
│   ├── requirements.txt                # Runtime dependencies (API server)
│   ├── requirements-dev.txt            # Training + test dependencies
│   ├── .env.example                    # Template for environment variables
│   │
│   ├── datasets/
│   │   ├── merged_all_crops_clean.csv  # Training dataset: 17,768 rows, 34 crops
│   │   └── standardize_dataset.py      # Reproducible cleaning script for the CSV
│   │
│   ├── ai_models/
│   │   └── training/
│   │       ├── train_full_model.py     # Trains the RF+XGBoost ensemble
│   │       ├── train_simplified_model.py # Trains the quick-predict RF model
│   │       ├── generate_guidance.py    # Generates crop_guidance.json for 41 crops
│   │       └── models/                 # Generated by training (git-ignored)
│   │           ├── crop_info.json      # Ideal ranges for all 34 crops (manually curated)
│   │           ├── crop_guidance.json  # Full lifecycle guidance for 41 crops
│   │           ├── crop_model_full.pkl
│   │           ├── crop_model_simple.pkl
│   │           ├── label_encoder_full.pkl
│   │           ├── label_encoder_simple.pkl
│   │           ├── model_info_full.pkl
│   │           └── model_info_simple.pkl
│   │
│   ├── ml_service/
│   │   └── app.py                      # FastAPI application (the running API)
│   │
│   └── tests/
│       ├── __init__.py
│       └── test_api.py                 # 14 API tests (pytest)
│
└── frontend/
    ├── index.html                      # Single HTML entry point
    ├── package.json                    # npm scripts and dependency list
    ├── vite.config.js                  # Vite config + API proxy rules
    ├── .env.example                    # Template for VITE_API_URL
    │
    ├── public/
    │   └── favicon.svg
    │
    └── src/
        ├── main.jsx                    # React app entry point
        ├── App.jsx                     # Root component: holds lang/page/weather state; routes to 4 pages
        │
        ├── components/                 # Reusable UI pieces
        │   ├── Navbar.jsx              # Top navigation + language switcher
        │   ├── SuitBar.jsx             # Confidence percentage bar
        │   ├── XAIFeatureCard.jsx      # Feature contribution bars (XAI display)
        │   ├── CalendarCard.jsx        # Planting and harvest calendar
        │   ├── CompareCard.jsx         # Top-3 crops comparison table
        │   ├── HistoryPanel.jsx        # Last 10 predictions (localStorage)
        │   ├── WeatherLocationPicker.jsx # Compact district picker + live weather banner (shared across pages)
        │   └── CultivationTracker.jsx  # Active cultivation sessions; task status tracking
        │
        ├── pages/
        │   ├── CropRecommendation.jsx  # Main page: form + prediction results
        │   ├── CropGuidance.jsx        # Crop lifecycle guide + cultivation tracker
        │   ├── YieldPrice.jsx          # Yield & price/revenue calculator
        │   └── Weather.jsx             # Dedicated weather & farm advisory page
        │
        ├── data/
        │   ├── translations.js         # All UI strings in EN / SI / TA
        │   ├── cropData.js             # Crop labels, emoji, yield data, soil guide helpers
        │   └── districtZones.js        # District → agro zone mapping (25 districts)
        │
        └── styles/
            ├── globals.css             # CSS variables, reset, body styles
            ├── Navbar.css              # Navbar component styles
            ├── CropRecommendation.css  # Crop recommendation page styles
            ├── CropGuidance.css        # Crop guidance page styles
            ├── YieldPrice.css          # Yield & price calculator styles
            └── Weather.css             # Weather page styles
```

---

## 4. How to Run

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend

# Install runtime dependencies
pip install -r requirements.txt

# Install training/dev dependencies (first time or after retraining)
pip install -r requirements-dev.txt

# Train models (run once, or after dataset changes — takes 3-5 minutes)
python ai_models/training/train_full_model.py
python ai_models/training/train_simplified_model.py

# Start the API server
python ml_service/app.py
# Runs at http://localhost:8000
# Swagger UI at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

Vite's dev server automatically proxies `/predict/*`, `/health`, `/meta`, `/guidance/*`, `/cultivation/*`, and `/weather` to `localhost:8000` — no CORS configuration needed.

### Run Tests

```bash
# From project root
python -m pytest backend/tests/ -v
```

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:
```
SMARTAGRI_CORS_ORIGINS=https://yourdomain.com
```

Copy `frontend/.env.example` to `frontend/.env.local` and set:
```
VITE_API_URL=https://api.yourdomain.com
```

---

## 5. Machine Learning Pipeline

### Two Prediction Modes

| Mode | Input | Model | Accuracy |
|---|---|---|---|
| **Full Analysis** | 7 numeric + 4 categorical = 11 params | RF + XGBoost ensemble | ~90% Top-1, ~99% Top-3 |
| **Quick Predict** | 4–5 categorical params only | Random Forest (GridSearchCV) | ~47% Top-1, ~72% Top-3 |

The accuracy gap exists because numeric inputs (soil nutrients, temperature, rainfall, pH, humidity) carry far more signal than categorical ones.

### Full Mode — Feature Engineering

Seven raw numeric inputs are expanded to 13 by adding derived features:

| Derived Feature | Formula | Why |
|---|---|---|
| `N_P_Ratio` | N / (P + 1) | Nutrient balance matters more than absolute amounts |
| `N_K_Ratio` | N / (K + 1) | Same rationale |
| `P_K_Ratio` | P / (K + 1) | Same rationale |
| `NPK_Sum` | N + P + K | Total nutrient load |
| `Rainfall_Temp_Ratio` | Rainfall / (Temperature + 1) | Climate stress index — high rain + low temp is different from high rain + high temp |
| `pH_Squared` | pH² | pH has a non-linear effect; squaring amplifies deviations from neutral |

Four categorical features (Soil_Type, Agro_Zone, Irrigation, Season) are then one-hot encoded, giving a final feature vector of ~50+ columns.

### The Ensemble

```
Input vector (50+ features)
         │
    ┌────┴────┐
    RF        XGBoost
    │         │
    proba     proba
    └────┬────┘
    Average (soft voting)
         │
    Calibrate (temperature scaling)
         │
    Final confidence scores
```

**Random Forest:** Trains 300 decision trees independently (bagging). Each tree sees a random subset of features and data. Their votes are averaged. Good at low-variance predictions, handles diverse feature types well.

**XGBoost:** Trains trees sequentially — each tree learns from the mistakes of the previous one (boosting). Captures complex feature interactions that RF misses. Uses `hist` method for speed, `subsample=0.8` and `colsample_bytree=0.8` for regularisation.

**Soft Voting:** Both models output a probability distribution over 34 crops. The two distributions are averaged. This almost always beats either model alone.

### Calibration (Temperature Scaling)

The raw ensemble probabilities are often overconfident (e.g. 97% when the true accuracy is ~90%). Temperature scaling corrects this:

```
p_calibrated = softmax(log(p_raw) / T)
```

Where `T` is a scalar found by minimising the Negative Log-Likelihood on a held-out calibration set (15% of data, never seen during training). For this model, T ≈ 0.60 — meaning the ensemble was underconfident and calibration sharpens its predictions.

**The calibration set is strictly separate from both training and test data** (3-way 70/15/15 split). Using training data to find T would overfit the temperature parameter.

### Train / Cal / Test Split

```
17,768 rows
│
├── 70% Training   (12,436 rows) → fits RF and XGBoost
├── 15% Calibration (2,666 rows) → finds optimal temperature T
└── 15% Test        (2,666 rows) → measures final accuracy (never used in fitting)
```

All splits use stratified sampling to ensure every crop is proportionally represented.

### Explainable AI (XAI)

For every Full Analysis prediction, the system computes *per-prediction* feature contributions — not just global model importance.

**Method:** Random Forest decision path traversal.
1. Find all trees in the RF that voted for the predicted crop (up to 50 trees).
2. Walk each tree's decision path for this specific input.
3. At each split node, compute the impurity reduction (how much that split reduced uncertainty).
4. Accumulate impurity reduction per feature across all trees.
5. Normalise to sum to 1.

**Direction:** Each feature's direction (`positive` / `negative` / `neutral`) is computed by comparing the user's value against the crop's ideal range from `crop_info.json`:
- `positive` → value is within the ideal range (supporting factor)
- `negative` → value is outside the ideal range (limiting factor)
- `neutral` → no ideal range data available

This approach requires no external SHAP library and runs in ~10ms per prediction.

---

## 6. Backend Architecture

`backend/ml_service/app.py` is a single-file FastAPI application. At startup it:

1. Loads 6 pickle files from `models/` (both models + both label encoders + both model infos)
2. Loads `crop_info.json` (ideal ranges for 34 crops)
3. Loads `crop_guidance.json` (full lifecycle guidance for 41 crops)
4. Pre-computes `feature_columns` as a set for O(1) lookup during inference
5. Extracts the RF sub-model from the ensemble via `named_estimators_["rf"]` — used for XAI
6. Loads training statistics (mean/std for outlier detection) from `model_info_full.pkl`
7. Reads the calibration temperature T from `model_info_full.pkl`

**Weather module:** The `/weather` endpoint calls the Open-Meteo forecast API and archive API in parallel using `httpx` (run via `asyncio.run_in_executor` to keep the endpoint non-blocking). It derives the current Sri Lanka season (Maha / Yala / Year-round) from the calendar date, fetches the season-to-date accumulated rainfall from the archive, and generates contextual farm advisory messages based on current temperature, humidity, wind, and forecast rain.

**Cultivation tracker:** An in-memory dict (`_cultivations`) stores per-user cultivation sessions. When a session is started (`POST /cultivation`), the system reads the crop's lifecycle data from `crop_guidance.json` and auto-generates a date-stamped task list covering all growth-stage activities, fertilization events, and irrigation checks. Task statuses (`pending` / `done` / `skipped` / `overdue`) can be updated via `PUT`. Note: sessions are stored in process memory and are lost on server restart. For production use, replace with a database.

**Inference path (no pandas):** At prediction time, the input dict is converted directly to a NumPy array using `_build_full_input()` / `_build_simple_input()`. This manually replicates the one-hot encoding by building a dict of `{col_val: 1}` entries and reading them out in the saved feature column order. pandas is not needed at inference time.

**Prediction cache:** Results are cached in a process-local dict (max 500 entries, LRU eviction). Identical inputs return immediately without running the model again. Note: with multiple server workers, each worker has its own cache — use Redis for shared caching.

**Outlier detection:** Input values more than ±3 standard deviations from the training mean trigger a warning in the response. The means and standard deviations come from the training set statistics saved in `model_info_full.pkl`.

---

## 7. Frontend Architecture

### Component Tree

```
App.jsx                              ← holds: lang, currentPage, weather (shared across pages)
│
├── Navbar.jsx                       ← props: lang, setLang, currentPage, setPage
│
└── <page> (rendered based on currentPage)
    │
    ├── CropRecommendation.jsx       ← holds: form state, result, history, isMock
    │   ├── WeatherLocationPicker.jsx
    │   ├── HistoryPanel.jsx
    │   └── (after prediction)
    │       ├── SuitBar.jsx
    │       ├── XAIFeatureCard.jsx
    │       ├── CalendarCard.jsx
    │       └── CompareCard.jsx
    │
    ├── CropGuidance.jsx             ← holds: mode (guide|cultivations), selected crop, planting date
    │   ├── WeatherLocationPicker.jsx
    │   ├── GuidanceSelector          (inline sub-component)
    │   ├── GuidanceDetail            (inline sub-component with 7 tabs)
    │   └── CultivationTracker.jsx
    │
    ├── YieldPrice.jsx               ← holds: yield form, price form, calculated results
    │   └── WeatherLocationPicker.jsx
    │
    └── Weather.jsx                  ← holds: selected district, weather data
```

### State Management

State is split between `App.jsx` (global) and each page component (local). No external state library is used.

**Global state in `App.jsx`:**

| State | Type | Purpose |
|---|---|---|
| `lang` | `"en" \| "si" \| "ta"` | Active language — passed to all pages and children |
| `page` | string | Active page key (`"crop-recommendation"`, `"crop-guidance"`, `"yield-price"`, `"weather"`) |
| `weather` | object or null | Latest fetched weather data — shared across pages via `WeatherLocationPicker` |

**Local state in `CropRecommendation.jsx`:**

| State | Type | Purpose |
|---|---|---|
| `result` | object or null | The full API response after a prediction |
| `history` | array | Last 10 predictions, loaded from localStorage |
| `isMock` | boolean | True when the backend is unreachable — shows an orange warning banner |
| `soilGuide` | boolean | Controls the soil identification modal |
| Form fields | strings/numbers | Controlled inputs: N, P, K, Temperature, etc. |

### Persistence
- **localStorage** (`smartagri_history`): Stores the last 10 prediction results. Written by `saveToHistory()` in `HistoryPanel.jsx` after every successful prediction.
- **sessionStorage**: Form inputs are persisted across page refreshes so the farmer doesn't lose their data.

### Translations

All UI text lives in `src/data/translations.js` as a single object keyed by language code:
```js
{ en: { title: "...", ... }, si: { title: "...", ... }, ta: { title: "...", ... } }
```
Components receive a `t` prop (the current language's strings) rather than calling a translation function. This is intentionally simple — no i18n library.

### Mock Fallback

If the `/health` check on startup fails (backend not running), `isMock` is set to `true`. The app shows a prominent orange banner and generates a random mock result so the UI is always navigable for development and demos.

---

## 8. API Reference

### `GET /health`

Returns server status, loaded model types and accuracy, calibration temperature, and active feature flags.

```json
{
  "status": "ok",
  "version": "5.3.0",
  "full_model": {
    "loaded": true,
    "accuracy": 0.9021,
    "type": "VotingClassifier(RF+XGBoost)",
    "calibration_T": 0.6053,
    "train_stats_src": "model_info"
  },
  "simple_model": { "loaded": true, "accuracy": 0.4690 },
  "crop_info_crops": 34,
  "cache_entries": 0
}
```

### `GET /meta`

Returns all valid input values. The frontend uses this to build dropdown lists, keeping them in sync with the backend without hardcoding values.

### `POST /predict/full`

**Request:**
```json
{
  "N": 100, "P": 60, "K": 91,
  "Temperature": 27.0, "Rainfall": 1050.0, "pH": 6.3, "Humidity": 72.0,
  "Soil_Type": "Sandy Loam", "Agro_Zone": "Dry Zone",
  "Irrigation": "Rainfed", "Season": "Yala"
}
```

**Validation rules:**
| Field | Range |
|---|---|
| N | 0 – 300 kg/ha |
| P | 0 – 200 kg/ha |
| K | 0 – 300 kg/ha |
| Temperature | 5 – 45 °C |
| Rainfall | 0 – 5000 mm |
| pH | 3.0 – 10.0 |
| Humidity | 0 – 100 % |

**Response:**
```json
{
  "success": true,
  "data": {
    "mode": "full",
    "recommended_crop": "Tomato",
    "confidence": 0.87,
    "low_confidence": false,
    "top_3": [
      { "crop": "Tomato",  "confidence": 0.87, "crop_info": { ... } },
      { "crop": "Chilli",  "confidence": 0.43, "crop_info": { ... } },
      { "crop": "Capsicum","confidence": 0.21, "crop_info": { ... } }
    ],
    "explanations": ["Rainfall 1050 mm · 27°C", ...],
    "xai_features": [
      {
        "feature": "Rainfall", "label": "Rainfall",
        "label_si": "වර්ෂාපතනය", "label_ta": "மழைவீழ்ச்சி",
        "score": 0.22, "direction": "positive",
        "value": 1050, "ideal_min": 600, "ideal_max": 1200
      }
    ],
    "xai_is_global": false,
    "xai_summary": {
      "en": "Tomato was recommended because your Rainfall...",
      "si": "...", "ta": "..."
    },
    "warnings": [],
    "planting_calendar": {
      "plant_start": 4, "plant_end": 5,
      "harvest_start": 7, "harvest_end": 9
    },
    "crop_info": { "crop_duration_min": 75, "rainfall_min": 600, ... }
  }
}
```

**Field notes:**
- `direction`: `"positive"` = value within ideal range. `"negative"` = outside ideal range. `"neutral"` = no ideal range data.
- `xai_is_global`: Always `false` for full mode (contributions are per-prediction). Always `true` for simple mode (uses global RF feature importances).
- `low_confidence`: `true` when top confidence < 60%. The frontend shows a caution badge.
- `planting_calendar`: Harvest window is derived from the recommended crop's duration (crop-specific), not a fixed season-wide window.

### `POST /predict/simple`

**Request:**
```json
{
  "Soil_Type": "Sandy Loam", "Agro_Zone": "Dry Zone",
  "Irrigation": "Rainfed", "Season": "Yala",
  "District": "Ampara"
}
```
District is optional. Temperature, Rainfall, and Humidity are also optional — if provided (e.g. from the live weather widget), they are used as additional features and the mode is reported as `"simple_weather"`. Response structure is identical to `/predict/full`.

---

### `GET /guidance`

Returns a sorted list of all crops that have lifecycle guidance available.

```json
{ "crops": ["Banana", "Bean", "Carrot", ...], "total": 41 }
```

### `GET /guidance/{crop_name}`

Returns the full lifecycle data for a crop: growth stages with daily activities, fertilization schedule, irrigation requirements, disease management, pest management, risk factors, and harvest guide.

```json
{
  "success": true,
  "crop": "Tomato",
  "data": {
    "scientific_name": "Solanum lycopersicum",
    "overview": "...",
    "duration": { "min": 75, "max": 120 },
    "stages": [ { "id": "land_prep", "name": "Land Preparation", ... } ],
    "fertilization": [ { "timing": "Basal", "day": 0, "applications": [...] } ],
    "irrigation": { "frequency": "...", "method": "...", "critical_stages": [...] },
    "diseases": [ { "name": "Early Blight", "severity": "high", ... } ],
    "pests": [ { "name": "Whitefly", "severity": "medium", ... } ],
    "risks": [...],
    "harvest": { "indicators": [...], "method": "...", "yield": "..." }
  }
}
```

Returns `404` if no guidance exists for the requested crop.

---

### `POST /cultivation`

Starts a new cultivation session for a user and crop. Auto-generates a full task list from the crop's lifecycle data.

**Request:**
```json
{
  "user_id": "user-abc",
  "crop": "Tomato",
  "planting_date": "2026-06-01",
  "district": "Kandy"
}
```

**Response (201):** The full session object including all generated tasks with scheduled dates and initial statuses (`pending` or `overdue` based on today's date).

---

### `GET /cultivation/{user_id}`

Returns all cultivation sessions for a user.

```json
{ "sessions": [ { "id": "...", "crop": "Tomato", "status": "active", "tasks": {...} } ] }
```

### `PUT /cultivation/{user_id}/{session_id}/task/{task_id}`

Updates the status of a single task. Status must be one of: `done`, `skipped`, `pending`, `overdue`.

```json
{ "status": "done" }
```

### `DELETE /cultivation/{user_id}/{session_id}`

Marks a cultivation session as `"abandoned"`. Returns `204 No Content`.

---

### `GET /weather?district={district}`

Fetches live weather conditions and a 7-day forecast for the specified district using the Open-Meteo API. Also returns season-to-date accumulated rainfall (from the archive API) and contextual farm advisory messages.

**Query parameter:** `district` — one of the 25 Sri Lankan districts (see `/meta` for the full list).

**Response:**
```json
{
  "district": "Kandy",
  "latitude": 7.2906,
  "longitude": 80.6337,
  "current": {
    "temperature": 28.4,
    "humidity": 76.0,
    "wind_kph": 12.0,
    "rainfall_mm": 0.0,
    "condition": "Partly Cloudy",
    "condition_icon": "⛅",
    "weather_code": 2
  },
  "forecast": [
    {
      "date": "2026-06-06",
      "max_temp": 31.2, "min_temp": 22.1,
      "rain_mm": 0.0, "precip_prob": 15.0,
      "humidity": 78.0, "wind_kph": 14.0,
      "condition": "Partly Cloudy", "icon": "⛅"
    }
  ],
  "advice": [
    {
      "type": "action",
      "icon": "☀️",
      "title": "Good Conditions for Field Work",
      "detail": "Low rainfall and moderate humidity create favourable conditions..."
    }
  ],
  "season_name": "Yala",
  "season_start": "2026-05-01",
  "season_actual_mm": 142.3,
  "seasonal_rainfall": { "Maha": 1000, "Yala": 700, "Year-round": 2000 },
  "source": "Open-Meteo (open-meteo.com)"
}
```

Returns `400` for an unknown district, `502`/`503` if the upstream weather API is unreachable.

---

## 9. Project Evolution

The project went through 5 major versions. Each version is described below.

### v1.0 — Original baseline
- Single FastAPI backend with `/predict/full` only
- Plain `RandomForestClassifier` with `GridSearchCV`
- 34 crop datasets, raw merged CSV
- Basic JSON response — crop name and confidence score only
- No explanations, no language support, no frontend

### v2.0 — Bug fixes and dataset standardisation
- **Critical bug fixed:** Confidence score was using the class label integer as an array index instead of the predicted class index — completely wrong probabilities.
- Dataset cleaned: crop names normalised, irrigation collapsed to 3 canonical values (Rainfed / Irrigated / Supplemental), seasons to 3 canonical values (Maha / Yala / Year-round).
- `standardize_dataset.py` written for reproducible cleaning.
- `requirements.txt` added.

### v3.0 — React frontend and full crop coverage
- React + Vite frontend built from scratch.
- Trilingual UI: English, සිංහල, தமிழ்.
- District picker with automatic agro-zone resolution (25 districts, 15 zones).
- Two-mode form: Quick Predict + Full Analysis.
- Suitability bars, result card, crop info card.
- `crop_info.json` expanded to cover all 34 crops with ideal ranges.

### v4.0 — Explainable AI and UX improvements
- **Per-prediction XAI** via RF decision path traversal — no external SHAP library.
- XAI card with contribution bars and ideal-range direction badges.
- Natural-language XAI summary generated in all 3 languages.
- Out-of-distribution detection (±3σ warnings).
- `low_confidence` flag (< 60%).
- Planting calendar added.
- Crop comparison table (top-3 side-by-side).

### v5.0 — Ensemble model for accuracy
- Full mode switched from single RF to **soft-voting ensemble: RF + ExtraTrees + HGB×2**.
- Top-1 accuracy: 87% → 90%. Top-3: 98% → 99%.
- Temperature scaling (calibration) added — confidence scores are now properly calibrated.

### v5.1 — Bug fixes and code organisation
**Backend fixes:**
- `TRAIN_STATS` now loaded dynamically from `model_info_full.pkl` — stays in sync after retraining.
- XAI feature direction correctly computed from value vs ideal range.
- Planting calendar harvest window derived per-crop from crop duration.
- 3-way 70/15/15 split for calibration (was using a training subset — data leakage).
- `predict_simple` DataFrame mutation fixed with `.copy()`.
- `reload=False` in production entry point.
- Logging via `logger.*` instead of bare `print()`.

**Frontend fixes:**
- Mock fallback shows visible orange warning banner.
- XAI bars normalised relative to top feature (was broken — most bars showed 100%).
- Compare table "Crop" header now translated in all 3 languages.
- Prediction history panel (localStorage, last 10 results).
- Soil identification guide modal.

**Code organisation:**
- 882-line monolith split into 9 focused files.
- All CSS extracted to separate files.
- All translations extracted to `translations.js`.
- Static crop/soil data extracted to `cropData.js`.
- `DISTRICT_TO_ZONES` duplication removed.

### v5.3 — New feature modules

**Crop Guidance module:**
- `generate_guidance.py` added — generates `crop_guidance.json` covering lifecycle data for 41 crops (growth stages, fertilization schedule, irrigation guide, disease management, pest management, risk factors, harvest guide).
- `GET /guidance` and `GET /guidance/{crop_name}` endpoints added.
- `CropGuidance.jsx` page added: crop selector → tabbed lifecycle detail view with weather-contextual alerts per tab.

**Cultivation Tracker:**
- `POST /cultivation`, `GET /cultivation/{user_id}`, `PUT /cultivation/{user_id}/{session_id}/task/{task_id}`, `DELETE /cultivation/{user_id}/{session_id}` endpoints added.
- On session start, all growth-stage activities, fertilization events, and irrigation checks are auto-scheduled from the planting date.
- `CultivationTracker.jsx` component added; accessible from the Crop Guidance page.

**Weather & Farm Advisory page:**
- `GET /weather?district=` endpoint added. Calls Open-Meteo forecast and archive APIs in parallel.
- Returns current conditions, 7-day forecast, season-to-date rainfall, and contextual farm advisory messages.
- `Weather.jsx` dedicated page added; `WeatherLocationPicker.jsx` shared component added for inline weather display across all pages.
- `httpx` promoted from dev-only to a runtime dependency.

**Yield & Price Calculator:**
- `YieldPrice.jsx` page added: calculates expected yield and estimated revenue based on crop, land size, seed quality, crop condition, and market price.

### v5.2 — Technology reduction and model improvement
- **Ensemble simplified:** ExtraTrees + HGB×2 replaced by **XGBoost**. Two models instead of four. Accuracy maintained at ~90%.
- **pandas removed from inference:** Input arrays now built directly as NumPy arrays (`_build_full_input`, `_build_simple_input`). pandas is now a dev-only dependency.
- **scipy removed entirely:** `minimize_scalar` replaced with a 15-line golden-section search. scipy was a 50MB dependency used for one function call.
- **`uvicorn[standard]` simplified** to bare `uvicorn` — websocket and HTTP/2 extras not needed.
- **`pytest` and `httpx` moved** from `requirements.txt` to `requirements-dev.txt`.
- **XAI extraction fixed:** RF sub-model extracted from ensemble via `named_estimators_["rf"]` — previous code had a bug where it checked unfitted estimators and fell back to passing the entire VotingClassifier to the tree-traversal code.
- **stale `default_values.json` deleted.**
- All 14 tests pass.

---

## 10. Design Decisions

### Why no ORM, no database?
Predictions are stateless — each request contains everything the model needs. There is nothing to persist on the server side. Prediction history is stored client-side in localStorage, which is the right place for per-user data in a frontend app.

### Why no authentication?
This is a public agricultural advisory tool. Adding auth would reduce access without adding value. For a production multi-tenant deployment (e.g. per-farmer personalisation), OAuth2 could be added via FastAPI's built-in security utilities.

### Why no Redux or Zustand?
The entire app is one page with one form. All state fits comfortably in a single `useState` tree in `CropRecommendation.jsx`. A state library would add dependencies and indirection with no benefit.

### Why plain CSS instead of Tailwind or a component library?
Tailwind would be reasonable, but plain CSS with variables is zero-dependency, easy to read, and the styles here are simple enough that utility classes would not reduce complexity. Component libraries (MUI, Chakra) would dramatically increase bundle size for what is a form and a results card.

### Why keep Random Forest for XAI instead of using XGBoost's built-in SHAP?
XGBoost's `pred_contribs=True` requires calling `get_booster().predict(DMatrix(...), pred_contribs=True)` and parsing a shaped array across 34 classes. The RF path traversal code is already written, tested, and well-understood. For a 2-model ensemble that already includes RF, reusing it for XAI is the pragmatic choice.

### Why synthetic training data?
The dataset (`merged_all_crops_clean.csv`) is synthetic — generated to reflect agronomic relationships from published Sri Lankan DOA crop guides, but not real field measurements. This is the primary weakness of the current system. Replacing it with real farmer data collected in the field would be the highest-impact improvement possible. Until then, the model is a decision-support tool, not a replacement for agronomic expertise.

### Why temperature scaling instead of Platt scaling or isotonic regression?
Temperature scaling has one parameter (T) and is non-overfitting by design. Platt scaling and isotonic regression have more parameters and can overfit a small calibration set. With 34 classes and ~2600 calibration samples, the simpler method is correct.
