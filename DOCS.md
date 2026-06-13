# SmartAgri — Complete Project Documentation

**ML Service v5.3 · Main API v0.1** | AI-Powered Agribusiness Platform for Sri Lanka

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

SmartAgri is an AI-powered agribusiness platform built for Sri Lanka. It has two distinct halves that work together:

**ML Tools (port 8000):** A farmer enters their soil and climate data and the system recommends the best crop with a full explanation of why — using a trained Random Forest + XGBoost ensemble. Supporting tools include a crop lifecycle guide, a cultivation task tracker, a weather advisory, and a yield/price calculator. Everything works in English, Sinhala (සිංහල), and Tamil (தமிழ்).

**Platform (port 8001):** A multi-role web platform where land owners manage their farms, registered crops, and cultivation sessions in a persistent database. Traders and admins get role-specific dashboards. JWT authentication controls access; all platform data lives in PostgreSQL.

**The problem it solves:** Sri Lanka has 34 commonly grown crops, 15 agro-climatic zones, 25 districts, and 33 soil types. Smallholder farmers without access to agricultural extension services need decision support — both for choosing what to grow and for managing an active growing season.

---

## 2. Technology Stack

### ML Service — Runtime (`requirements.txt`, port 8000)

| Technology | Version | What it does in this project |
|---|---|---|
| **Python** | 3.10+ | Language the entire backend runs in |
| **FastAPI** | 0.115.0 | Web framework for all ML API endpoints |
| **Uvicorn** | ≥0.30.0 | ASGI server — runs FastAPI on port 8000 |
| **Pydantic** | 2.7.0 | Request validation — pH must be 3–10, Season must be Maha/Yala/Year-round, etc. |
| **scikit-learn** | 1.5.0 | `RandomForestClassifier`, `VotingClassifier`, `LabelEncoder`, `GridSearchCV` |
| **XGBoost** | 3.2.0 | Second model in the ensemble; sequential boosting covers RF's weaknesses |
| **joblib** | 1.4.2 | Saves and loads trained models as `.pkl` files |
| **NumPy** | 1.26.4 | Array operations, input vector construction, XAI impurity math |
| **httpx** | 0.27.0 | HTTP client for calling Open-Meteo forecast and archive APIs |
| **python-dotenv** | ≥1.0.1 | Loads `backend/.env` for both services |

### Main API — Runtime (`requirements.txt`, port 8001)

| Technology | Version | What it does in this project |
|---|---|---|
| **FastAPI** | 0.115.0 | Web framework — auth, farms, crops routes |
| **Uvicorn** | ≥0.30.0 | ASGI server — runs the main API on port 8001 |
| **SQLAlchemy** | ≥2.0.0 | ORM — `User`, `Farm`, `Crop`, `CultivationSession`, `CultivationTask` models |
| **psycopg2-binary** | ≥2.9.9 | PostgreSQL driver |
| **Alembic** | ≥1.13.0 | Database schema migrations |
| **python-jose** | ≥3.3.0 | JWT creation and verification |
| **passlib** | ≥1.7.4 | Password hashing (pbkdf2_sha256) |
| **pydantic-settings** | ≥2.4.0 | Settings management |
| **email-validator** | ≥2.2.0 | Email field validation in Pydantic schemas |

### Backend — Dev & Training Only (`requirements-dev.txt`)

| Technology | What it does |
|---|---|
| **pandas** | Reads the training CSV and does feature engineering — only used in training scripts |
| **pytest** | Test runner for `backend/tests/` |

### Frontend

| Technology | Version | What it does in this project |
|---|---|---|
| **React** | 18.3.1 | UI framework — component tree, state management |
| **React DOM** | 18.3.1 | Renders React to the browser |
| **React Router** | 6.26.0 | Client-side routing — 20+ routes across public, auth, ML-tool, and landowner pages |
| **Axios** | ≥1.6.0 | HTTP client for platform API calls (farm/crop services) |
| **Vite** | 5.4.0 | Build tool and dev server — proxies `/auth`, `/api` to port 8001 and ML routes to port 8000 |

**Notable: no UI component library, no CSS framework, no state management library.** All components are hand-written; all styles are plain CSS with variables.

---

## 3. Project Structure

```
SmartAgri/
├── .gitignore
├── README.md
├── DOCS.md
├── start.bat                           # One-click launcher — starts all 3 services
├── start-backend.bat                   # Starts port 8001 only
├── start-frontend.bat                  # Starts frontend only
├── Crop_Details.docx                   # Reference crop data document
│
├── docs/                               # Project reference documents
│   ├── Client Approval Letter.pdf
│   ├── Proposal_Report_CST_Group_07.pdf
│   ├── SmartAgri Presentation.pdf
│   └── Zone.txt
│
├── data/                               # Datasets
│   └── merged_all_crops_clean.csv      # Training dataset (also in backend/datasets/)
│
├── backend/
│   ├── requirements.txt                # Runtime dependencies (both services)
│   ├── requirements-dev.txt            # Training + test dependencies
│   ├── .env                            # Active environment variables (git-ignored)
│   ├── .env.example                    # Template
│   ├── alembic.ini                     # Alembic configuration
│   │
│   ├── alembic/
│   │   └── versions/                   # Migration files (6 applied migrations)
│   │
│   ├── datasets/
│   │   ├── merged_all_crops_clean.csv  # Training dataset: 17,768 rows, 34 crops
│   │   └── standardize_dataset.py      # Reproducible cleaning script
│   │
│   ├── ai_models/
│   │   └── training/
│   │       ├── train_full_model.py
│   │       ├── train_simplified_model.py
│   │       ├── generate_guidance.py
│   │       └── models/                 # Generated by training (git-ignored)
│   │           ├── crop_info.json
│   │           ├── crop_guidance.json
│   │           ├── crop_model_full.pkl
│   │           ├── crop_model_simple.pkl
│   │           ├── label_encoder_full.pkl
│   │           ├── label_encoder_simple.pkl
│   │           ├── model_info_full.pkl
│   │           └── model_info_simple.pkl
│   │
│   ├── ml_service/
│   │   └── app.py                      # ML FastAPI app (port 8000)
│   │
│   ├── app/                            # Main FastAPI app (port 8001)
│   │   ├── main.py                     # App factory, CORS, lifespan, router registration
│   │   ├── api/
│   │   │   └── auth.py                 # /auth/* endpoints (register, login, me, password, delete)
│   │   ├── routers/
│   │   │   ├── farm.py                 # /api/farms/* endpoints
│   │   │   └── crop.py                 # /api/crops/* and /api/farms/{id}/crops endpoints
│   │   ├── models/
│   │   │   ├── user.py                 # User, UserRole enum
│   │   │   ├── farm.py                 # Farm
│   │   │   ├── crop.py                 # Crop (with relationship to Farm)
│   │   │   └── cultivation.py          # CultivationSession, CultivationTask
│   │   ├── schemas/
│   │   │   ├── auth.py                 # UserRegister, UserLogin, AuthResponse
│   │   │   ├── user.py                 # UserRead, UserUpdate, PasswordChange
│   │   │   ├── farm.py                 # FarmCreate, FarmRead, FarmUpdate
│   │   │   └── crop.py                 # CropCreate, CropRead, CropUpdate
│   │   ├── services/
│   │   │   ├── auth.py                 # User CRUD, ensure_admin_user, role→redirect map
│   │   │   ├── farm_service.py         # Farm CRUD
│   │   │   └── crop_service.py         # Crop CRUD
│   │   ├── core/
│   │   │   ├── security.py             # JWT creation/verification, password hashing
│   │   │   └── deps.py                 # get_db, get_current_user, get_current_land_owner
│   │   └── db/
│   │       └── database.py             # SQLAlchemy engine, SessionLocal, Base
│   │
│   └── tests/
│       └── test_api.py                 # 14 ML API tests (pytest)
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js                  # Vite config + proxy rules (8001 and 8000)
    ├── .env.local                      # Active env vars (git-ignored)
    ├── .env.example
    │
    ├── public/
    │   └── favicon.svg
    │
    └── src/
        ├── main.jsx                    # React entry point
        ├── App.jsx                     # Router tree — all routes defined here
        ├── styles.css                  # Page and component styles
        │
        ├── context/
        │   └── AppContext.jsx          # Global state: lang, weather, theme (dark/light)
        │
        ├── components/                 # Shared UI components
        │   ├── AppLayout.jsx           # Navbar + Outlet for all public/ML pages
        │   ├── LandOwnerLayout.jsx     # Sidebar + Outlet for /landowner/* pages
        │   ├── Navbar.jsx              # Top nav, language switcher, theme toggle, auth state
        │   ├── Footer.jsx
        │   ├── Toast.jsx               # Toast notification component
        │   ├── CropPicker.jsx          # Shared crop selector
        │   ├── SuitBar.jsx             # Confidence percentage bar
        │   ├── XAIFeatureCard.jsx      # Feature contribution bars
        │   ├── CalendarCard.jsx        # Planting/harvest calendar
        │   ├── CompareCard.jsx         # Top-3 crops comparison table
        │   ├── HistoryPanel.jsx        # Prediction history (localStorage)
        │   ├── FeatureCard.jsx
        │   ├── WeatherLocationPicker.jsx  # District picker + live weather banner
        │   └── CultivationTracker.jsx  # Cultivation task tracking UI
        │
        ├── pages/
        │   ├── HomePage.jsx            # Landing page (public)
        │   ├── LoginPage.jsx           # Login form (standalone, no Navbar)
        │   ├── RegisterPage.jsx        # Register form — Land Owner or Trader only
        │   ├── MarketplacePage.jsx
        │   ├── DashboardPage.jsx       # Reusable dashboard shell (Admin + Trader)
        │   ├── About.jsx
        │   ├── ContactPage.jsx
        │   ├── CropRecommendation.jsx  # ML: full/quick predict form + results
        │   ├── CropGuidance.jsx        # ML: crop lifecycle guide + cultivation tracker
        │   ├── YieldPrice.jsx          # ML: yield & revenue calculator
        │   ├── Weather.jsx             # ML: weather & farm advisory
        │   ├── farms/
        │   │   ├── MyFarms.jsx
        │   │   ├── AddFarm.jsx
        │   │   ├── EditFarm.jsx
        │   │   └── FarmDetails.jsx
        │   ├── crops/
        │   │   ├── MyCrops.jsx
        │   │   ├── AddCrop.jsx
        │   │   ├── EditCrop.jsx
        │   │   └── CropDetails.jsx
        │   ├── cultivations/
        │   │   └── MyCultivations.jsx
        │   └── landowner/
        │       ├── LandOwnerDashboard.jsx
        │       ├── Settings.jsx
        │       └── HelpSupport.jsx
        │
        ├── services/
        │   ├── api.js                  # Base fetch wrapper, auth session helpers, /auth endpoints
        │   ├── farmService.js          # /api/farms/* calls
        │   ├── cropService.js          # /api/crops/* calls
        │   ├── cultivationApi.js       # /cultivation/* calls (ML service)
        │   └── userId.js               # Derives a stable user_id for ML cultivation sessions
        │
        ├── data/
        │   ├── translations.js         # All UI strings in EN / SI / TA
        │   ├── cropData.js             # Crop labels, emoji, yield data, soil guide helpers
        │   └── districtZones.js        # District → agro zone mapping (25 districts)
        │
        ├── utils/                      # Shared utility functions
        │
        └── styles/
            ├── globals.css             # CSS variables, dark/light theme tokens
            ├── Navbar.css
            ├── CropRecommendation.css
            ├── CropGuidance.css
            ├── YieldPrice.css
            └── Weather.css
```

---

## 4. How to Run

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL — database `smartagri` must exist

### Environment variables

Copy `backend/.env.example` to `backend/.env`:

```
PROJECT_NAME=Smart Agribusiness Decision Support System
DATABASE_URL=postgresql://user:password@localhost:5432/smartagri
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SMARTAGRI_CORS_ORIGINS=http://localhost:5173

# Optional — defaults shown
ADMIN_EMAIL=admin@smartagri.lk
ADMIN_PASSWORD=Admin@12345
ADMIN_FULL_NAME=System Administrator
```

Copy `frontend/.env.example` to `frontend/.env.local`:

```
# Leave empty for Vite dev proxy (recommended for local dev)
VITE_API_URL=

# Set only for production deployments
# VITE_API_URL=https://api.yourdomain.com
```

### First run: database migration

```bash
cd backend
python -m alembic upgrade head
```

This creates all five tables: `users`, `farms`, `crops`, `cultivation_sessions`, `cultivation_tasks`.

### Start all services

**Option A — One command:**
```
start.bat
```
Opens three terminal windows (kills old processes on 8000/8001/5173 first).

**Option B — Three terminals:**

```bash
# Terminal 1 — Main API (auth, farms, crops) — port 8001
cd backend
uvicorn app.main:app --reload --port 8001

# Terminal 2 — ML Service — port 8000
cd backend
uvicorn ml_service.app:app --reload --port 8000

# Terminal 3 — Frontend — port 5173
cd frontend
npm install     # first run only
npm run dev
```

### Train ML models (first run or after dataset changes)

```bash
cd backend
pip install -r requirements-dev.txt
python ai_models/training/train_full_model.py
python ai_models/training/train_simplified_model.py
python ai_models/training/generate_guidance.py   # optional — regenerates crop_guidance.json
```

Training takes 3–5 minutes and writes `.pkl` files to `backend/ml_service/models/`.

### Run tests

```bash
python -m pytest backend/tests/ -v
```

### Default admin account

The admin user is created automatically when the main API starts for the first time:

| Field | Default |
|---|---|
| Email | admin@smartagri.lk |
| Password | Admin@12345 |
| Role | Admin |

Override with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME` in `.env`.

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
| `Rainfall_Temp_Ratio` | Rainfall / (Temperature + 1) | Climate stress index |
| `pH_Squared` | pH² | pH has a non-linear effect; squaring amplifies deviations from neutral |

Four categorical features (Soil_Type, Agro_Zone, Irrigation, Season) are one-hot encoded, giving a final feature vector of ~50+ columns.

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

**Random Forest:** 300 trees trained independently (bagging). Good at low-variance predictions, handles diverse feature types well.

**XGBoost:** Trees trained sequentially — each corrects the previous one (boosting). Captures complex feature interactions RF misses.

**Soft Voting:** Both models output a probability distribution over 34 crops. The distributions are averaged — this almost always beats either model alone.

### Calibration (Temperature Scaling)

```
p_calibrated = softmax(log(p_raw) / T)
```

`T` is found by minimising Negative Log-Likelihood on a held-out calibration set (15% of data). For this model T ≈ 0.60 — the ensemble was underconfident; calibration sharpens predictions.

### Train / Cal / Test Split

```
17,768 rows
│
├── 70% Training    (12,436 rows) → fits RF and XGBoost
├── 15% Calibration  (2,666 rows) → finds optimal temperature T
└── 15% Test         (2,666 rows) → measures final accuracy
```

All splits use stratified sampling to ensure every crop is proportionally represented.

### Explainable AI (XAI)

For every Full Analysis prediction, the system computes per-prediction feature contributions:

1. Find all RF trees that voted for the predicted crop (up to 50 trees).
2. Walk each tree's decision path for this specific input.
3. At each split node, compute the impurity reduction.
4. Accumulate impurity reduction per feature across all trees.
5. Normalise to sum to 1.

**Direction** (`positive` / `negative` / `neutral`) is computed by comparing the user's value against the crop's ideal range in `crop_info.json`. No SHAP library required; runs in ~10ms per prediction.

---

## 6. Backend Architecture

The backend is **two independent FastAPI applications**, both started from the `backend/` directory.

### ML Service — `ml_service/app.py` (port 8000)

Single-file FastAPI app. At startup it:
1. Loads 6 pickle files from `models/` (both models + encoders + model infos)
2. Loads `crop_info.json` (ideal ranges for 34 crops) and `crop_guidance.json` (lifecycle data for 41 crops)
3. Pre-computes `feature_columns` as a set for O(1) lookup during inference
4. Extracts the RF sub-model from the ensemble via `named_estimators_["rf"]` for XAI
5. Loads training statistics (mean/std) from `model_info_full.pkl` for outlier detection
6. Reads calibration temperature T from `model_info_full.pkl`

**Inference path (no pandas):** Input dicts are converted directly to NumPy arrays via `_build_full_input()` / `_build_simple_input()`. One-hot encoding is replicated by building a `{col_val: 1}` dict and reading columns in saved feature order.

**Prediction cache:** Process-local LRU dict (max 500 entries). Identical inputs return immediately without running the model.

**Outlier detection:** Values more than ±3 standard deviations from training mean trigger a warning in the response.

**Cultivation tracker (ML service):** `POST /cultivation` reads `crop_guidance.json` and auto-generates a date-stamped task list. Sessions are persisted to PostgreSQL via the main API — the ML service calls the cultivation endpoints which in turn persist to the database.

**Weather module:** `/weather` calls Open-Meteo forecast and archive APIs in parallel via `httpx`. Derives the current Sri Lanka season (Maha/Yala/Year-round) from the calendar date and generates contextual farm advisory messages.

### Main API — `app/main.py` (port 8001)

Full-featured FastAPI app with PostgreSQL persistence. At startup it auto-creates the admin user if none exists (`ensure_admin_user`).

**Module layout:**

| Module | Responsibility |
|---|---|
| `api/auth.py` | `/auth/*` — register, login, `/me` (read/update/password/delete) |
| `routers/farm.py` | `/api/farms/*` — CRUD, land-owner-only |
| `routers/crop.py` | `/api/crops/*` and `/api/farms/{id}/crops` — CRUD, land-owner-only |
| `models/` | SQLAlchemy ORM models: User, Farm, Crop, CultivationSession, CultivationTask |
| `schemas/` | Pydantic request/response models |
| `services/` | Business logic layer (auth, farm, crop CRUD) |
| `core/security.py` | JWT creation/verification, password hashing (pbkdf2_sha256) |
| `core/deps.py` | FastAPI dependencies: `get_db`, `get_current_user`, `get_current_land_owner` |
| `db/database.py` | SQLAlchemy engine, `SessionLocal`, declarative `Base` |

**Database schema:**

| Table | Primary Key | Notes |
|---|---|---|
| `users` | `id` (int) | `email` unique; `role` enum: Admin/Land Owner/Trader/Visitor |
| `farms` | `id` (UUID) | `owner_id` → users.id |
| `crops` | `id` (UUID) | `farm_id` → farms.id (CASCADE), `owner_id` → users.id |
| `cultivation_sessions` | `id` (UUID) | `crop_id` → crops.id (SET NULL), `farm_id` → farms.id (SET NULL) |
| `cultivation_tasks` | `id` (varchar) | `session_id` → cultivation_sessions.id (CASCADE) |

**Authentication flow:**
1. Client sends credentials to `POST /auth/login` or `POST /auth/register`
2. Server returns a JWT access token (30-minute expiry)
3. Client stores token in localStorage; attaches it as `Authorization: Bearer <token>` on subsequent requests
4. `get_current_user` dependency decodes the token on every protected route
5. `get_current_land_owner` additionally checks `role == Land Owner`
6. 401 responses cause the frontend to clear the session and redirect to `/login`

---

## 7. Frontend Architecture

### Routing

All routes are defined in `App.jsx` using React Router v6:

| Path | Component | Auth required |
|---|---|---|
| `/login` | `LoginPage` | No (standalone, no Navbar) |
| `/register` | `RegisterPage` | No (standalone, no Navbar) |
| `/` | `HomePage` | No |
| `/marketplace` | `MarketplacePage` | No |
| `/dashboard/admin` | `DashboardPage` (Admin) | — (no guard yet) |
| `/dashboard/trader` | `DashboardPage` (Trader) | — |
| `/crop-recommendation` | `CropRecommendation` | No |
| `/crop-guidance` | `CropGuidance` | No |
| `/wx` | `Weather` | No |
| `/yield-price` | `YieldPrice` | No |
| `/about` | `About` | No |
| `/contact` | `ContactPage` | No |
| `/landowner/dashboard` | `LandOwnerDashboard` | Land Owner JWT |
| `/landowner/farms` | `MyFarms` | Land Owner JWT |
| `/landowner/farms/add` | `AddFarm` | Land Owner JWT |
| `/landowner/farms/edit/:id` | `EditFarm` | Land Owner JWT |
| `/landowner/farms/:id` | `FarmDetails` | Land Owner JWT |
| `/landowner/crops` | `MyCrops` | Land Owner JWT |
| `/landowner/crops/add` | `AddCrop` | Land Owner JWT |
| `/landowner/crops/edit/:id` | `EditCrop` | Land Owner JWT |
| `/landowner/crops/:id` | `CropDetails` | Land Owner JWT |
| `/landowner/cultivations` | `MyCultivations` | Land Owner JWT |
| `/landowner/settings` | `Settings` | Land Owner JWT |
| `/landowner/help` | `HelpSupport` | Land Owner JWT |

### Layouts

**`AppLayout`** wraps all public and ML-tool pages. It renders the shared `Navbar` and passes shared state (`lang`, `setLang`, `weather`, `setWeather`, `setPage`) via React Router's `useOutletContext`. Wrapper components in `App.jsx` (e.g. `CropRecommendationPage`) bridge the outlet context to the props the original ML pages expect.

**`LandOwnerLayout`** wraps all `/landowner/*` routes. It renders a sidebar navigation and checks JWT state, redirecting unauthenticated users to `/login`.

### Global State — `AppContext`

| State | Type | Purpose |
|---|---|---|
| `lang` | `"en" \| "si" \| "ta"` | Active language — passed to all pages |
| `weather` | object or null | Latest fetched weather — shared across pages |
| `theme` | `"dark" \| "light"` | UI theme — persisted to localStorage as `sa-theme` |
| `toggleTheme` | function | Flips between dark and light mode |

### Auth Session — `services/api.js`

JWT token and user object are stored in localStorage (`smartagri_token`, `smartagri_user`). The `request()` wrapper attaches the token as a Bearer header on every call. A 401 response clears the session and redirects to `/login`.

### Vite Proxy

In development, all API traffic is proxied by Vite — no CORS configuration needed:

| Path prefix | Target |
|---|---|
| `/auth`, `/api`, `/health` | `http://localhost:8001` (Main API) |
| `/predict`, `/weather`, `/cultivation`, `/guidance`, `/meta` | `http://localhost:8000` (ML Service) |

### Persistence

| Store | Key | Contents |
|---|---|---|
| localStorage | `smartagri_token` | JWT access token |
| localStorage | `smartagri_user` | Serialised user object |
| localStorage | `smartagri_history` | Last 10 ML predictions |
| localStorage | `sa-theme` | `"dark"` or `"light"` |
| sessionStorage | form fields | Crop recommendation form inputs (survives page refresh) |

### Translations

All UI text lives in `src/data/translations.js` keyed by language code. Components receive a `t` prop (the current language's string map). No i18n library — deliberately simple.

### Mock Fallback

If the `/health` check on startup fails (backend not running), `isMock` is set to `true` in `CropRecommendation`. The app shows an orange warning banner and generates a random mock result so the ML UI is always navigable without a running backend.

---

## 8. API Reference

### ML Service (port 8000)

#### `GET /health`

```json
{
  "status": "ok",
  "version": "5.3.0",
  "full_model": { "loaded": true, "accuracy": 0.9021, "type": "VotingClassifier(RF+XGBoost)", "calibration_T": 0.6053 },
  "simple_model": { "loaded": true, "accuracy": 0.4690 },
  "crop_info_crops": 34,
  "cache_entries": 0
}
```

#### `GET /meta`

Returns all valid input values (soil types, zones, districts, seasons, irrigation types). The frontend uses this to build dropdowns.

#### `POST /predict/full`

**Request:**
```json
{
  "N": 100, "P": 60, "K": 91,
  "Temperature": 27.0, "Rainfall": 1050.0, "pH": 6.3, "Humidity": 72.0,
  "Soil_Type": "Sandy Loam", "Agro_Zone": "Dry Zone",
  "Irrigation": "Rainfed", "Season": "Yala"
}
```

**Validation:** N 0–300, P 0–200, K 0–300, Temperature 5–45°C, Rainfall 0–5000 mm, pH 3.0–10.0, Humidity 0–100%.

**Response:**
```json
{
  "success": true,
  "data": {
    "mode": "full",
    "recommended_crop": "Tomato",
    "confidence": 0.87,
    "low_confidence": false,
    "top_3": [{ "crop": "Tomato", "confidence": 0.87, "crop_info": {} }],
    "xai_features": [{ "feature": "Rainfall", "score": 0.22, "direction": "positive", "value": 1050, "ideal_min": 600, "ideal_max": 1200 }],
    "xai_is_global": false,
    "xai_summary": { "en": "...", "si": "...", "ta": "..." },
    "warnings": [],
    "planting_calendar": { "plant_start": 4, "plant_end": 5, "harvest_start": 7, "harvest_end": 9 },
    "crop_info": {}
  }
}
```

#### `POST /predict/simple`

```json
{ "Soil_Type": "Sandy Loam", "Agro_Zone": "Dry Zone", "Irrigation": "Rainfed", "Season": "Yala", "District": "Ampara" }
```

`District` is optional. If `Temperature`, `Rainfall`, or `Humidity` are provided (e.g. from the weather widget), mode is reported as `"simple_weather"`. Response structure identical to `/predict/full`.

#### `GET /guidance`

Returns sorted list of all 41 crops that have lifecycle guidance. `{ "crops": [...], "total": 41 }`

#### `GET /guidance/{crop_name}`

Full lifecycle data for one crop: growth stages, fertilisation schedule, irrigation, diseases, pests, risks, harvest guide. Returns `404` if no guidance exists.

#### `POST /cultivation`

Starts a cultivation session. Auto-generates a task list from `crop_guidance.json` dated from `planting_date`.

```json
{ "user_id": "user-abc", "crop": "Tomato", "planting_date": "2026-06-01", "district": "Kandy" }
```

Returns `201` with the full session including all generated tasks.

#### `GET /cultivation/{user_id}`

Returns all cultivation sessions (with tasks) for a user.

#### `PUT /cultivation/{user_id}/{session_id}/task/{task_id}`

Updates task status: `done` | `skipped` | `pending` | `overdue`.

#### `DELETE /cultivation/{user_id}/{session_id}`

Marks session as `"abandoned"`. Returns `204`.

#### `GET /weather?district={district}`

Live conditions + 7-day forecast (Open-Meteo) + season-to-date rainfall + farm advisory messages for one of the 25 Sri Lankan districts. Returns `400` for unknown district, `502`/`503` if upstream API is unreachable.

---

### Main API (port 8001)

#### Auth — `POST /auth/register`

Registers a new **Land Owner** or **Trader** account (Admin cannot self-register).

```json
{ "full_name": "Sunil Perera", "email": "sunil@example.com", "password": "Secret@123", "role": "Land Owner" }
```

Returns `201` with `{ access_token, token_type, redirect_to, user }`. `redirect_to` is `/landowner/dashboard` for Land Owner, `/dashboard/trader` for Trader.

#### Auth — `POST /auth/login`

```json
{ "email": "sunil@example.com", "password": "Secret@123" }
```

Returns the same `AuthResponse` shape. Returns `401` for wrong credentials.

#### Auth — `GET /auth/me`

Returns the current user. Requires Bearer token.

#### Auth — `PUT /auth/me`

Updates `full_name`, `email`, or `profile_image` (base64 string). Requires Bearer token.

#### Auth — `PUT /auth/me/password`

```json
{ "current_password": "...", "new_password": "..." }
```

Returns `400` if `current_password` is wrong.

#### Auth — `DELETE /auth/me`

Deletes the authenticated user's account. Returns `204`.

---

#### Farms — all require Land Owner JWT

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/farms` | Create a farm |
| `GET` | `/api/farms` | List the user's farms |
| `GET` | `/api/farms/{id}` | Get one farm |
| `PUT` | `/api/farms/{id}` | Update a farm |
| `DELETE` | `/api/farms/{id}` | Delete a farm |

**Farm fields:** `farm_name`, `location`, `district`, `farm_size`, `size_unit` (default `"acres"`), `soil_type`, `irrigation_type`, `cultivated_crops`, `season`, `image_data` (base64, optional).

---

#### Crops — all require Land Owner JWT

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/crops` | Create a crop record |
| `GET` | `/api/crops` | List all crops for the user |
| `GET` | `/api/crops/{id}` | Get one crop |
| `PUT` | `/api/crops/{id}` | Update a crop |
| `DELETE` | `/api/crops/{id}` | Delete a crop |
| `GET` | `/api/farms/{farm_id}/crops` | List all crops for a specific farm |

**Crop fields:** `farm_id`, `crop_name`, `crop_type`, `category`, `growth_stage`, `planting_date`, `expected_harvest_date`, `status`, `season` (optional). Crops are cascade-deleted when their farm is deleted.

---

## 9. Project Evolution

### v1.0 — Original baseline

- Single FastAPI ML backend with `/predict/full` only
- Plain `RandomForestClassifier` with `GridSearchCV`
- Basic JSON response — crop name and confidence score only
- No explanations, no language support, no frontend

### v2.0 — Bug fixes and dataset standardisation

- **Critical bug fixed:** Confidence score used the class label integer as an array index instead of the predicted class index — completely wrong probabilities.
- Dataset cleaned: crop names normalised; irrigation collapsed to 3 canonical values; seasons to 3.
- `standardize_dataset.py` added for reproducible cleaning.

### v3.0 — React frontend and full crop coverage

- React + Vite frontend built from scratch.
- Trilingual UI: English, සිංහල, தமிழ்.
- District picker with automatic agro-zone resolution.
- Two-mode form: Quick Predict + Full Analysis.
- `crop_info.json` expanded to cover all 34 crops.

### v4.0 — Explainable AI and UX improvements

- Per-prediction XAI via RF decision path traversal.
- Natural-language XAI summary in all 3 languages.
- Out-of-distribution detection (±3σ warnings).
- `low_confidence` flag (< 60%).
- Planting calendar and crop comparison table (top-3).

### v5.0 — Ensemble model

- Full mode switched from single RF to soft-voting ensemble: RF + ExtraTrees + HGB×2.
- Top-1 accuracy: 87% → 90%. Top-3: 98% → 99%.
- Temperature scaling (calibration) added.

### v5.1 — Bug fixes and code organisation

- `TRAIN_STATS` now loaded from `model_info_full.pkl` — stays in sync after retraining.
- 3-way 70/15/15 split for calibration (previous version had data leakage).
- 882-line monolith split into 9 focused files; CSS and translations extracted.
- Prediction history panel, soil identification guide modal added.

### v5.2 — Technology reduction and model improvement

- Ensemble simplified: ExtraTrees + HGB×2 replaced by **XGBoost**. Two models instead of four. Accuracy maintained at ~90%.
- **pandas removed from inference:** input arrays now built directly as NumPy arrays.
- **scipy removed entirely:** `minimize_scalar` replaced with a 15-line golden-section search (scipy was a 50MB dependency used for one function call).
- XAI extraction bug fixed: RF sub-model extracted from ensemble via `named_estimators_["rf"]`.
- All 14 tests pass.

### v5.3 — New feature modules

- **Crop Guidance:** `GET /guidance` and `GET /guidance/{crop_name}` added; `CropGuidance.jsx` page.
- **Cultivation Tracker:** cultivation endpoints added; `CultivationTracker.jsx` component.
- **Weather & Farm Advisory:** `GET /weather` endpoint; `Weather.jsx` page; `WeatherLocationPicker.jsx` shared component.
- **Yield & Price Calculator:** `YieldPrice.jsx` page added.

### v6.0 — Multi-role platform

- **Second backend service added (port 8001):** FastAPI + SQLAlchemy + PostgreSQL. Handles auth, farms, crops, and cultivation persistence.
- **JWT authentication:** register/login for Land Owner and Trader roles; Admin auto-created on startup.
- **Land Owner portal:** full CRUD for farms, crops, and cultivation sessions with DB persistence.
- **Role-based dashboards:** Admin and Trader dashboards.
- **Marketplace page** added.
- **React Router v6** routing with `AppLayout` and `LandOwnerLayout` shell components.
- **Dark mode / light mode** with `data-theme` CSS variable, persisted to localStorage.
- **Axios** added for platform API calls; `services/` layer added for farm and crop API functions.
- Cultivation tracker sessions migrated from in-memory ML service storage to PostgreSQL (`cultivation_sessions` + `cultivation_tasks` tables, 2 Alembic migrations).
- Frontend i18n expanded; `AppContext` updated to include theme state.

---

## 10. Design Decisions

### Why two separate backend services?

The ML service (`ml_service/app.py`) is stateless — it only needs the trained model files and the `crop_guidance.json` at startup. Keeping it separate from the database-backed main API means: the ML service has no dependency on PostgreSQL and can be deployed or scaled independently; the main API has no ML dependency.

### Why PostgreSQL for the platform data?

Farms, crops, and cultivation sessions need proper relational integrity (a crop belongs to a farm; cultivation tasks cascade-delete with their session). PostgreSQL with SQLAlchemy and Alembic migrations is the standard choice for this shape of data.

### Why JWT stored in localStorage?

Standard choice for a React SPA. The alternative (httpOnly cookies) requires same-origin or careful CORS+cookie configuration. The Vite proxy makes both services appear same-origin in development; for production, a reverse proxy (nginx) achieves the same. If XSS risk is a concern in production, switch to httpOnly cookies.

### Why no Redux or Zustand?

Global state is minimal: language, theme, and current weather. These fit comfortably in a single `AppContext`. A state library would add dependencies and indirection with no benefit.

### Why plain CSS instead of Tailwind or a component library?

Zero-dependency, easy to read, and the styles here are simple enough that utility classes would not reduce complexity. Component libraries (MUI, Chakra) would significantly increase bundle size.

### Why keep Random Forest for XAI instead of XGBoost's built-in SHAP?

The RF path traversal code was already written, tested, and well-understood before XGBoost was added. Reusing it avoids adding complexity to the inference path. For a 2-model ensemble that already includes RF, it is the pragmatic choice.

### Why synthetic training data?

`merged_all_crops_clean.csv` is synthetic — generated to reflect agronomic relationships from published Sri Lankan DOA crop guides, not real field measurements. This is the primary weakness. Replacing it with real farmer data would be the highest-impact improvement possible. Until then, the model is a decision-support tool, not a replacement for agronomic expertise.

### Why temperature scaling for calibration?

Temperature scaling has one parameter (T) and cannot overfit. Platt scaling and isotonic regression have more parameters and can overfit a small calibration set. With 34 classes and ~2,600 calibration samples, the simpler method is correct.
