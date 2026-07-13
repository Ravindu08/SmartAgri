# SmartAgri — Complete Project Documentation

**ML Service v5.3 · Main API v8.0** | AI-Powered Agribusiness Platform for Sri Lanka

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

**ML Tools (port 8001):** A farmer enters their soil and climate data and the system recommends the best crop with a full explanation of why — using a trained Random Forest + XGBoost ensemble. Supporting tools include a crop lifecycle guide, a cultivation task tracker, a weather advisory, and a yield/price calculator. Everything works in English, Sinhala (සිංහල), and Tamil (தமிழ்).

**Platform (port 8000):** A multi-role web platform where land owners manage their farms, registered crops, and cultivation sessions in a persistent database. Traders and admins get role-specific dashboards. JWT authentication controls access; all platform data lives in PostgreSQL.

**The problem it solves:** Sri Lanka has 34 commonly grown crops, 15 agro-climatic zones, 25 districts, and 33 soil types. Smallholder farmers without access to agricultural extension services need decision support — both for choosing what to grow and for managing an active growing season.

---

## 2. Technology Stack

### ML Service — Runtime (`requirements.txt`, port 8001)

| Technology | Version | What it does in this project |
|---|---|---|
| **Python** | 3.10+ | Language the entire backend runs in |
| **FastAPI** | 0.115.0 | Web framework for all ML API endpoints |
| **Uvicorn** | ≥0.30.0 | ASGI server — runs FastAPI on port 8001 |
| **Pydantic** | 2.7.0 | Request validation — pH must be 3–10, Season must be Maha/Yala/Year-round, etc. |
| **scikit-learn** | 1.5.0 | `RandomForestClassifier`, `VotingClassifier`, `LabelEncoder`, `GridSearchCV` |
| **XGBoost** | 3.2.0 | Second model in the ensemble; sequential boosting covers RF's weaknesses |
| **joblib** | 1.4.2 | Saves and loads trained models as `.pkl` files |
| **NumPy** | 1.26.4 | Array operations, input vector construction, XAI impurity math |
| **httpx** | 0.27.0 | HTTP client for calling Open-Meteo forecast and archive APIs |
| **python-dotenv** | ≥1.0.1 | Loads `backend/.env` for both services |

### Main API — Runtime (`requirements.txt`, port 8000)

| Technology | Version | What it does in this project |
|---|---|---|
| **FastAPI** | 0.115.0 | Web framework — auth, farms, crops routes |
| **Uvicorn** | ≥0.30.0 | ASGI server — runs the main API on port 8000 |
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
| **React Router** | 6.26.0 | Client-side routing — 30+ routes across public, auth, ML-tool, landowner, trader, and admin pages |
| **SWR** | ≥2.4.1 | Data-fetching hooks used in selected components |
| **lucide-react** | ≥1.21.0 | Icon library |
| **Vite** | 5.4.0 | Build tool and dev server — proxies `/auth`, `/api` to port 8000 and ML routes to port 8001 |

**Notable: no external UI component library, no state management library.** All components are hand-written. Tailwind CSS is installed as a dev dependency but styles are primarily plain CSS with variables in `globals.css`.

---

## 3. Project Structure

```
SmartAgri/
├── .gitignore
├── README.md
├── DOCS.md
├── start-services.bat                  # One-click launcher — starts all 3 services
├── stop-services.bat                   # Kills all 3 service processes
├── _run_backend.bat                    # Starts main API (port 8000) only
├── _run_frontend.bat                   # Starts frontend only
├── _run_ml.bat                         # Starts ML service (port 8001) only
│
├── docs/                               # Project reference documents
│   ├── Client Approval Letter.pdf
│   ├── Proposal_Report_CST_Group_07.pdf
│   ├── SmartAgri Presentation.pdf
│   └── Zone.txt
│
├── backend/
│   ├── requirements.txt                # Runtime dependencies (both services)
│   ├── requirements-dev.txt            # Training + test dependencies
│   ├── .env                            # Active environment variables (git-ignored)
│   ├── .env.example                    # Template
│   ├── alembic.ini                     # Alembic configuration
│   │
│   ├── alembic/
│   │   └── versions/                   # 19 migration files (applied automatically on startup)
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
│   │   └── app.py                      # ML FastAPI app (port 8001)
│   │
│   ├── app/                            # Main FastAPI app (port 8000)
│   │   ├── main.py                     # App factory, CORS, lifespan, router registration
│   │   ├── api/
│   │   │   └── auth.py                 # /auth/* endpoints (register, verify, login, refresh, me, password, delete)
│   │   ├── routers/
│   │   │   ├── farm.py                 # /api/farms/* endpoints
│   │   │   ├── crop.py                 # /api/* crop endpoints
│   │   │   ├── marketplace.py          # /api/marketplace/* endpoints (listings, orders, negotiation)
│   │   │   ├── notifications.py        # /api/notifications/* endpoints
│   │   │   ├── ratings.py              # /api/ratings/* endpoints
│   │   │   ├── payments.py             # PayHere checkout init/webhook/status endpoints
│   │   │   └── admin.py                # /api/admin/* endpoints (23 endpoints)
│   │   ├── models/
│   │   │   ├── user.py                 # User (roles JSON, is_suspended, is_verified, email tokens)
│   │   │   ├── farm.py                 # Farm
│   │   │   ├── crop.py                 # Crop (with relationship to Farm)
│   │   │   ├── cultivation.py          # CultivationSession, CultivationTask
│   │   │   ├── marketplace.py          # MarketplaceListing, MarketplaceOrder, MarketplaceNegotiationMessage
│   │   │   ├── notification.py         # Notification
│   │   │   ├── rating.py               # Rating
│   │   │   ├── payment.py              # Payment (PayHere checkout attempts)
│   │   │   └── activity.py             # UserActivity, Feedback
│   │   ├── schemas/
│   │   │   ├── auth.py                 # UserRegister, UserLogin, AuthResponse
│   │   │   ├── user.py                 # UserRead, UserUpdate, PasswordChange
│   │   │   ├── farm.py                 # FarmCreate, FarmRead, FarmUpdate
│   │   │   ├── crop.py                 # CropCreate, CropRead, CropUpdate
│   │   │   ├── marketplace.py          # MarketplaceListingRead, MarketplaceOrderRead, etc.
│   │   │   └── payment.py              # PaymentInitResponse, PaymentStatusRead
│   │   ├── services/
│   │   │   ├── auth.py                 # User CRUD, ensure_admin_user, role→redirect map
│   │   │   ├── farm_service.py         # Farm CRUD
│   │   │   ├── crop_service.py         # Crop CRUD
│   │   │   ├── marketplace_service.py  # Listing/order CRUD, order status state machine
│   │   │   ├── notification_service.py # create_notification
│   │   │   ├── email.py                # SMTP sending (console fallback in dev)
│   │   │   └── payment_service.py      # PayHere hash/signature, init/apply payment
│   │   ├── core/
│   │   │   ├── security.py             # JWT creation/verification, password hashing
│   │   │   ├── deps.py                 # get_db, get_current_user, get_current_land_owner, get_current_trader
│   │   │   ├── limiter.py              # slowapi rate limiter instance
│   │   │   └── payment_config.py       # PAYHERE_* env var readers
│   │   └── db/
│   │       └── database.py             # SQLAlchemy engine, SessionLocal, Base
│   │
│   └── tests/
│       ├── test_main_api.py            # Main API tests (pytest) — run in CI
│       ├── test_payments.py            # PayHere hash/signature + payment-gate tests — run in CI
│       └── test_api.py                 # ML API tests (pytest) — requires loaded ML models, not run in CI
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js                  # Vite config + proxy rules (port 8000 and 8001)
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
        │   ├── TraderLayout.jsx        # Sidebar + Outlet for /trader/* pages
        │   ├── AdminLayout.jsx         # Sidebar + Outlet for /admin/* pages
        │   ├── AccountSettings.jsx     # Shared settings panel (profile, password, notifications)
        │   ├── Navbar.jsx              # Top nav, language switcher, theme toggle, auth state
        │   ├── Footer.jsx
        │   ├── Toast.jsx               # Toast notification component
        │   ├── CustomSelect.jsx        # Theme-aware dropdown replacing native <select>
        │   ├── CropPicker.jsx          # Shared crop selector
        │   ├── FeatureCard.jsx         # Feature card used on the landing page
        │   ├── SuitBar.jsx             # Parameter suitability bar (N/P/K/pH etc. vs ideal range)
        │   ├── XAIFeatureCard.jsx      # Feature contribution bars for XAI section
        │   ├── CalendarCard.jsx        # Planting/harvest calendar card
        │   ├── CompareCard.jsx         # Top-3 crops comparison table
        │   ├── HistoryPanel.jsx        # Prediction history (localStorage)
        │   ├── WeatherLocationPicker.jsx  # District picker + live weather banner
        │   ├── WeatherLocationPicker.css
        │   ├── CultivationTracker.jsx  # Cultivation task tracking UI component
        │   └── PayDialog.jsx           # Shared PayHere checkout modal (Marketplace + Trader Orders)
        │
        ├── pages/
        │   ├── HomePage.jsx            # Landing page (public)
        │   ├── LoginPage.jsx           # Login form (standalone, no Navbar)
        │   ├── RegisterPage.jsx        # Register form — Land Owner, Trader, or both
        │   ├── RoleSelectPage.jsx      # Role picker shown after login for dual-role users
        │   ├── MarketplacePage.jsx     # Shared marketplace — view switches by active role
        │   ├── About.jsx
        │   ├── ContactPage.jsx
        │   ├── CropRecommendation.jsx  # ML: full/quick predict form + results
        │   ├── CropGuidance.jsx        # ML: crop lifecycle guide
        │   ├── YieldPrice.jsx          # ML: yield & revenue calculator (frontend-only)
        │   ├── Weather.jsx             # ML: weather & farm advisory
        │   ├── farms/
        │   │   ├── MyFarms.jsx
        │   │   ├── AddFarm.jsx
        │   │   ├── EditFarm.jsx
        │   │   └── FarmDetails.jsx
        │   ├── crops/
        │   │   ├── MyCrops.jsx
        │   │   ├── AddCrop.jsx
        │   │   └── CropDetails.jsx
        │   ├── cultivations/
        │   │   └── MyCultivations.jsx  # Uses CultivationTracker component
        │   ├── landowner/
        │   │   ├── LandOwnerDashboard.jsx
        │   │   ├── Settings.jsx
        │   │   └── HelpSupport.jsx
        │   ├── trader/
        │   │   ├── TraderDashboard.jsx
        │   │   ├── TraderRequests.jsx  # Pending purchase requests
        │   │   ├── TraderOrders.jsx    # Active orders (Confirmed/Delivered)
        │   │   ├── TraderHistory.jsx   # Completed/cancelled/rejected orders
        │   │   ├── TraderSettings.jsx  # Wraps AccountSettings
        │   │   └── TraderHelp.jsx      # FAQ accordion + Trader-specific help
        │   └── admin/
        │       ├── AdminDashboard.jsx
        │       ├── AdminUsers.jsx      # User list, suspend/unsuspend/delete
        │       ├── AdminUserCreate.jsx
        │       ├── AdminUserImport.jsx # Bulk-create users from CSV
        │       ├── AdminFarms.jsx
        │       ├── AdminFarmImport.jsx # Bulk-create farms from CSV
        │       ├── AdminMarketplace.jsx
        │       ├── AdminActivity.jsx
        │       ├── AdminFeedback.jsx   # View, reply, resolve feedback tickets
        │       ├── AdminReports.jsx    # Stats charts + Export CSV
        │       └── AdminHarvestForecast.jsx  # Upcoming harvests across all farms, by district
        │
        ├── services/
        │   └── api.js                  # fetch wrapper, auth session helpers, getActiveRole(), request()
        │
        ├── utils/
        │   ├── cultivationApi.js       # /cultivation/* calls (ML service, port 8001)
        │   └── userId.js               # Derives a stable user_id for ML cultivation sessions
        │
        ├── data/
        │   ├── translations.js         # All UI strings in EN / SI / TA (all pages + admin)
        │   ├── cropData.js             # Crop labels, emoji, yield data, soil guide helpers
        │   ├── districtZones.js        # District → agro zone mapping (25 districts)
        │   └── farmOptions.js          # Static option lists for farm form dropdowns
        │
        └── styles/
            ├── globals.css             # CSS variables, dark/light theme tokens
            ├── Navbar.css
            ├── Footer.css
            ├── About.css
            ├── Contact.css
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

Migrations run automatically on startup via `_run_migrations()` in `main.py`. Running them manually on first setup ensures the database is ready before the ML service tries to access it. All tables are created: `users`, `farms`, `crops`, `cultivation_sessions`, `cultivation_tasks`, `marketplace_listings`, `marketplace_orders`, `marketplace_negotiation_messages`, `notifications`, `ratings`, `payments`, `user_activity`, `feedback`.

### Start all services

**Option A — One command:**
```
start-services.bat
```
Opens three terminal windows (kills old processes on 8000/8001/5173 first).

**Option B — Three terminals:**

```bash
# Terminal 1 — Main API (auth, farms, crops, marketplace, admin) — port 8000
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — ML Service (predict, guidance, weather, cultivation) — port 8001
cd backend
uvicorn ml_service.app:app --reload --port 8001

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

### ML Service — `ml_service/app.py` (port 8001)

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

**Cultivation tracker (ML service):** `POST /cultivation` reads `crop_guidance.json` and auto-generates a date-stamped task list persisted to PostgreSQL. All cultivation endpoints (`/cultivation/*`) are served by the ML service on port 8001 — the main API has no cultivation router.

**Weather module:** `/weather` calls Open-Meteo forecast and archive APIs in parallel via `httpx`. Derives the current Sri Lanka season (Maha/Yala/Year-round) from the calendar date and generates contextual farm advisory messages.

### Main API — `app/main.py` (port 8000)

Full-featured FastAPI app with PostgreSQL persistence. At startup it runs Alembic migrations automatically (`_run_migrations()`) then auto-creates the admin user if none exists (`ensure_admin_user`).

**Module layout:**

| Module | Responsibility |
|---|---|
| `api/auth.py` | `/auth/*` — register, login, refresh, `/me` (read/update/password/delete) |
| `routers/farm.py` | `/api/farms/*` — CRUD, land-owner-only |
| `routers/crop.py` | `/api/*` crop endpoints — CRUD, land-owner-only |
| `routers/marketplace.py` | `/api/marketplace/*` — listings, orders, order lifecycle, negotiation |
| `routers/notifications.py` | `/api/notifications/*` — list, unread count, mark read |
| `routers/ratings.py` | `/api/ratings/*` — submit/read order ratings, seller aggregate |
| `routers/payments.py` | PayHere checkout init, signature-verified webhook, payment status polling |
| `routers/admin.py` | `/api/admin/*` — 23 admin endpoints (users, farms, activity, feedback, reports, marketplace, bulk import, harvest forecast, CSV exports) |
| `models/` | SQLAlchemy ORM models: User, Farm, Crop, CultivationSession, CultivationTask, MarketplaceListing, MarketplaceOrder, MarketplaceNegotiationMessage, Notification, Rating, Payment, UserActivity, Feedback |
| `schemas/` | Pydantic request/response models |
| `services/` | Business logic layer (auth, farm, crop, marketplace CRUD; notifications; email; PayHere payment logic) |
| `core/security.py` | JWT creation/verification, password hashing (pbkdf2_sha256) |
| `core/deps.py` | FastAPI dependencies: `get_db`, `get_current_user`, `get_current_land_owner`, `get_current_trader` |
| `core/limiter.py` | slowapi rate limiter, applied per-route via `@limiter.limit(...)` |
| `core/payment_config.py` | Reads `PAYHERE_MERCHANT_ID`/`SECRET`/`MODE`/`NOTIFY_URL` from env; raises only when a payment endpoint is actually called, so the app still boots without them configured |
| `db/database.py` | SQLAlchemy engine, `SessionLocal`, declarative `Base` |

**Database schema:**

| Table | Primary Key | Notes |
|---|---|---|
| `users` | `id` (int) | `email` unique; `roles` JSON array; `is_suspended` bool; `is_verified` bool (default false for new accounts); `email_verification_token` varchar(255); `reset_token` varchar(255); `reset_token_expires` timestamptz |
| `farms` | `id` (UUID) | `owner_id` → users.id |
| `crops` | `id` (UUID) | `farm_id` → farms.id (CASCADE), `owner_id` → users.id |
| `cultivation_sessions` | `id` (UUID) | `crop_id` → crops.id (SET NULL), `farm_id` → farms.id (SET NULL) |
| `cultivation_tasks` | `id` (varchar) | `session_id` → cultivation_sessions.id (CASCADE) |
| `marketplace_listings` | `id` (int) | `seller_id` → users.id; `listing_type`, `location`, `image` columns |
| `marketplace_orders` | `id` (UUID) | `listing_id` → listings.id, `buyer_id` / `seller_id` → users.id; status: Pending/Confirmed/Delivered/Completed/Rejected/Cancelled; `proposed_price`, `agreed_price`, `counter_offer_price`, `buyer_note`, `seller_note`, `accepted_at`, `delivered_at`, `completed_at`; `payment_status`: Unpaid/Paid, `paid_at` |
| `marketplace_negotiation_messages` | `id` (int) | `order_id` → orders.id (CASCADE); `sender_id` → users.id; `message`, `proposed_price`, `created_at` — append-only thread; the "current offer" is snapshotted onto the order's own `buyer_note`/`seller_note`/`counter_offer_price` |
| `notifications` | `id` (int) | `user_id` → users.id; `type`, `title`, `message`, `is_read` (bool), `created_at` |
| `ratings` | `id` (int) | `order_id` → orders.id (unique); `reviewer_id` / `seller_id` → users.id; `score` (1–5), `comment`, `created_at` |
| `payments` | `id` (UUID) | `order_id` → orders.id (CASCADE); `amount` (Numeric), `currency` (default `LKR`); `status`: Initiated/Paid/Failed/Cancelled/Chargedback; `payhere_payment_id`, `raw_notify_payload`, `created_at`, `updated_at`. One row per checkout attempt — `init_payment()` reuses an existing `Initiated` row for the same order instead of creating a new one on every call |
| `user_activity` | `id` (int) | `actor_id` (int, not name), `action`, `target`, `timestamp` |
| `feedback` | `id` (int) | `user_id` → users.id; `type`, `subject`, `message`; `status`: open/resolved; `reply` text |

**Authentication flow:**
1. Client `POST /auth/register` with `roles: [...]` (array — a user can register as Land Owner, Trader, or both at once) → server creates account (`is_verified=false`), emails a 6-digit verification code
2. User enters the code → `POST /auth/verify-email {email, code}` → account activated (code expires; `resend-verification` can issue a new one)
3. Client `POST /auth/login` → server checks `is_verified` and `is_suspended`, then returns `{access_token, refresh_token, redirect_to, user}`
4. Client stores both tokens in localStorage; attaches the access token as `Authorization: Bearer <token>` on subsequent requests; `POST /auth/refresh` exchanges the refresh token for a new access token when the access token expires (the frontend's `request()` wrapper does this automatically on a 401, then retries once)
5. `get_current_user` dependency decodes the token on every protected route

**Forgot password flow:**
1. Client `POST /auth/forgot-password` → server emails a reset link (token valid 1 hour)
2. User clicks link → `POST /auth/reset-password` with new password
3. Server validates token expiry, updates password, clears reset fields
5. `get_current_land_owner` / `get_current_trader` additionally check the `roles` array
6. Multi-role users choose their active role on `/role-select`; active role stored in `localStorage('sa-active-role')`
7. 401 responses cause the frontend to clear the session and redirect to `/login`

---

## 7. Frontend Architecture

### Routing

All routes are defined in `App.jsx` using React Router v6:

| Path | Component | Auth required |
|---|---|---|
| `/login` | `LoginPage` | No (standalone, no Navbar) |
| `/register` | `RegisterPage` | No (standalone, no Navbar) |
| `/verify-email-sent` | `VerifyEmailSentPage` | No — shown after registration |
| `/verify-email?token=` | `VerifyEmailPage` | No — activates account via token |
| `/forgot-password` | `ForgotPasswordPage` | No — linked from login page |
| `/reset-password?token=` | `ResetPasswordPage` | No — linked from reset email |
| `/role-select` | `RoleSelectPage` | JWT (shown after login for dual-role users) |
| `/` | `HomePage` | No |
| `/marketplace` | `MarketplacePage` | No (view switches by active role) |
| `/crop-recommendation` | `CropRecommendation` | No |
| `/crop-guidance` | `CropGuidance` | No |
| `/wx` | `Weather` | No |
| `/yield-price` | `YieldPrice` | No |
| `/about` | `About` | No |
| `/contact` | `ContactPage` | No |
| `/dashboard/admin` | → redirect to `/admin/dashboard` | — |
| `/dashboard/trader` | → redirect to `/trader/dashboard` | — |
| `/landowner/dashboard` | `LandOwnerDashboard` | Land Owner JWT |
| `/landowner/farms` | `MyFarms` | Land Owner JWT |
| `/landowner/farms/add` | `AddFarm` | Land Owner JWT |
| `/landowner/farms/edit/:id` | `EditFarm` | Land Owner JWT |
| `/landowner/farms/:id` | `FarmDetails` | Land Owner JWT |
| `/landowner/crops` | `MyCrops` | Land Owner JWT |
| `/landowner/crops/add` | `AddCrop` | Land Owner JWT |
| `/landowner/crops/:id` | `CropDetails` | Land Owner JWT |
| `/landowner/cultivations` | `MyCultivations` | Land Owner JWT |
| `/landowner/settings` | `Settings` | Land Owner JWT |
| `/landowner/help` | `HelpSupport` | Land Owner JWT |
| `/trader/dashboard` | `TraderDashboard` | Trader JWT |
| `/trader/requests` | `TraderRequests` | Trader JWT |
| `/trader/orders` | `TraderOrders` | Trader JWT |
| `/trader/history` | `TraderHistory` | Trader JWT |
| `/trader/settings` | `TraderSettings` | Trader JWT |
| `/trader/help` | `TraderHelp` | Trader JWT |
| `/admin/dashboard` | `AdminDashboard` | Admin JWT |
| `/admin/users` | `AdminUsers` | Admin JWT |
| `/admin/users/create` | `AdminUserCreate` | Admin JWT |
| `/admin/users/import` | `AdminUserImport` | Admin JWT — bulk-create users from CSV |
| `/admin/marketplace` | `AdminMarketplace` | Admin JWT |
| `/admin/farms` | `AdminFarms` | Admin JWT |
| `/admin/farms/import` | `AdminFarmImport` | Admin JWT — bulk-create farms from CSV |
| `/admin/activity` | `AdminActivity` | Admin JWT |
| `/admin/feedback` | `AdminFeedback` | Admin JWT |
| `/admin/reports` | `AdminReports` | Admin JWT |
| `/admin/harvest-forecast` | `AdminHarvestForecast` | Admin JWT — upcoming harvests across all farms |

### Layouts

**`AppLayout`** wraps all public and ML-tool pages. It renders the shared `Navbar` and passes shared state (`lang`, `setLang`, `weather`, `setWeather`, `setPage`) via React Router's `useOutletContext`. Wrapper components in `App.jsx` (e.g. `CropRecommendationPage`) bridge the outlet context to the props the original ML pages expect.

**`LandOwnerLayout`** wraps all `/landowner/*` routes. Renders a sidebar navigation, checks JWT state, and redirects unauthenticated users to `/login`.

**`TraderLayout`** wraps all `/trader/*` routes. 7-item sidebar (Dashboard, Marketplace, My Requests, My Orders, Transaction History, Settings, Help). Includes notification bell, profile dropdown, feedback modal, and Switch Role button for dual-role users. Redirects non-Trader active roles to `/login`.

**`AdminLayout`** wraps all `/admin/*` routes. Renders an admin-specific sidebar. Redirects non-Admin users to `/login`.

### Global State — `AppContext`

| State | Type | Purpose |
|---|---|---|
| `lang` | `"en" \| "si" \| "ta"` | Active language — persisted to `localStorage('smartagri_lang')` |
| `weather` | object or null | Latest fetched weather — shared across pages |
| `theme` | `"dark" \| "light"` | UI theme — persisted to localStorage as `sa-theme` |
| `toggleTheme` | function | Flips between dark and light mode |

### Auth Session & Multi-Role — `services/api.js`

JWT token and user object are stored in localStorage (`smartagri_token`, `smartagri_user`). The `request()` wrapper attaches the token as a Bearer header on every call. A 401 response clears the session and redirects to `/login`.

Multi-role helpers also live in `services/api.js`:
- `getActiveRole()` — reads `localStorage('sa-active-role')`; falls back to the first role in `user.roles`
- `setActiveRole(role)` — writes to localStorage
- `isDualRole()` — true if user holds both Land Owner and Trader roles
- **Rule:** always use `getActiveRole()` for role-conditional UI, never `user.role` directly

### Vite Proxy

In development, all API traffic is proxied by Vite — no CORS configuration needed:

| Path prefix | Target |
|---|---|
| `/auth`, `/api` | `http://localhost:8000` (Main API) |
| `/predict`, `/weather`, `/cultivation`, `/guidance`, `/meta`, `/health` | `http://localhost:8001` (ML Service) |

Note: `/weather` has an HTML bypass so browser navigation to `/weather` serves the React SPA instead of proxying to the ML service.

### Persistence

| Store | Key | Contents |
|---|---|---|
| localStorage | `smartagri_token` | JWT access token |
| localStorage | `smartagri_user` | Serialised user object |
| localStorage | `smartagri_lang` | Active language: `"en"`, `"si"`, or `"ta"` |
| localStorage | `sa-active-role` | Active role for multi-role users: `"Land Owner"` or `"Trader"` |
| localStorage | `smartagri_history` | Last 10 ML predictions |
| localStorage | `sa-theme` | `"dark"` or `"light"` |
| sessionStorage | form fields | Crop recommendation form inputs (survives page refresh) |

### Translations

All UI text lives in `src/data/translations.js` keyed by language code. Components receive a `t` prop (the current language's string map). No i18n library — deliberately simple.

### Mock Fallback

If the `/health` check on startup fails (backend not running), `isMock` is set to `true` in `CropRecommendation`. The app shows an orange warning banner and generates a random mock result so the ML UI is always navigable without a running backend.

---

## 8. API Reference

### ML Service (port 8001)

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

#### `PUT /cultivation/{user_id}/{id}/task/{task_id}`

Updates task status: `done` | `skipped` | `pending` | `overdue`. Note: the session ID field in the response is `id` (not `session_id`).

#### `DELETE /cultivation/{user_id}/{session_id}`

Marks session as `"abandoned"`. Returns `204`.

#### `GET /weather?district={district}`

Live conditions + 7-day forecast (Open-Meteo) + season-to-date rainfall + farm advisory messages for one of the 25 Sri Lankan districts. Returns `400` for unknown district, `502`/`503` if upstream API is unreachable.

---

### Main API (port 8000)

#### Auth — `POST /auth/register`

Registers a new account as **Land Owner**, **Trader**, or both at once (Admin cannot self-register). Rate-limited to 5/minute.

```json
{ "full_name": "Sunil Perera", "email": "sunil@example.com", "password": "Secret@123", "roles": ["Land Owner"] }
```

Returns `201` with `{ message, email }`. The account is created but **not yet active** — the user must enter the 6-digit code emailed to them (`POST /auth/verify-email`) before logging in. If `EMAIL_ENABLED=false`, the account is auto-verified so local dev doesn't need a real mailbox.

If the email already exists and verified with a *different* role than requested, this call adds the new role to the existing account instead of erroring, returning `200` with `{ message: "Role added successfully...", email }`.

#### Auth — `POST /auth/resend-verification?email=<email>`

Issues a new verification code. Always returns `200 { message }` regardless of whether the email exists or is already verified (prevents enumeration). Rate-limited to 5/minute.

#### Auth — `POST /auth/verify-email`

```json
{ "email": "sunil@example.com", "code": "482913" }
```

Marks the account `is_verified=true` and clears the code. Returns `200 { message }` on success, `400` if the code is wrong, expired, or the account is already verified.

#### Auth — `POST /auth/login`

```json
{ "email": "sunil@example.com", "password": "Secret@123" }
```

Returns `AuthResponse { access_token, refresh_token, token_type, redirect_to, user }`.
- `403 { detail: "EMAIL_NOT_VERIFIED" }` — account not yet verified
- `403 { detail: "ACCOUNT_SUSPENDED" }` — account suspended by admin
- `401` — wrong credentials
- Rate-limited; repeated failed attempts from the same client eventually get `429`

#### Auth — `POST /auth/refresh`

```json
{ "refresh_token": "<refresh_token>" }
```

Exchanges a valid refresh token for a new `{access_token, refresh_token}` pair. The frontend's `request()` wrapper calls this automatically on a `401` and retries the original request once.

#### Auth — `POST /auth/forgot-password`

```json
{ "email": "sunil@example.com" }
```

Sends a reset link valid for 1 hour. Always returns `200 { message }` (prevents enumeration). Only sends if the account exists and is verified.

#### Auth — `POST /auth/reset-password`

```json
{ "token": "<reset_token>", "new_password": "NewSecret@123" }
```

Validates token is not expired, updates password, clears reset fields. Returns `400` for invalid/expired token.

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

#### Marketplace — JWT required for write operations

| Method | Path | Who | Description |
|---|---|---|---|
| `GET` | `/api/marketplace/listings` | Anyone | Browse all active listings |
| `POST` | `/api/marketplace/listings` | Land Owner / Trader | Create a listing |
| `PUT` | `/api/marketplace/listings/{id}` | Seller | Update listing |
| `DELETE` | `/api/marketplace/listings/{id}` | Seller | Remove listing |
| `GET` | `/api/marketplace/orders` | JWT | All orders where user is buyer or seller |
| `POST` | `/api/marketplace/orders` | Trader / Land Owner | Place a purchase request |
| `PUT` | `/api/marketplace/orders/{id}/status` | Seller / Buyer | Update order status |

Order status lifecycle: `Pending → Confirmed` (seller) `→ Delivered` (seller) `→ Completed` (buyer), or `Rejected` / `Cancelled`. The `Confirmed → Delivered` transition is blocked server-side until the buyer pays (see Payments below) — `payment_status` must be `Paid`.
Seller phone number is included in the order response (`seller_phone`).

---

#### Marketplace — supplementary endpoints

| Method | Path | Who | Description |
|---|---|---|---|
| `GET` | `/api/marketplace/listings/me` | JWT | List the current user's own listings |
| `GET` | `/api/marketplace/listings/{id}` | Anyone | Get one listing |
| `PUT` | `/api/marketplace/orders/{id}/status` | Seller / Buyer | Update order status (`Confirmed`, `Delivered`, `Completed`, `Rejected`, `Cancelled`) |
| `POST` | `/api/marketplace/orders/{id}/negotiation` | Buyer or Seller | Post a negotiation message with optional `proposed_price` |
| `GET` | `/api/marketplace/history` | JWT | Completed/rejected/cancelled orders |

---

#### Notifications — JWT required

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/notifications` | List all notifications for the current user |
| `GET` | `/api/notifications/unread-count` | Returns `{"count": N}` — used for the bell badge |
| `POST` | `/api/notifications/{id}/read` | Mark one notification as read |
| `POST` | `/api/notifications/read-all` | Mark all notifications as read |

Notifications are auto-created by the backend when: a purchase request is placed (seller notified), an order is confirmed/delivered/completed (buyer notified), a negotiation message is sent.

---

#### Ratings — JWT required

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/ratings/orders/{order_id}` | Submit a rating `{score: 1–5, comment: "…"}` for a completed order |
| `GET` | `/api/ratings/orders/{order_id}` | Get the rating for a specific order |
| `GET` | `/api/ratings/users/{user_id}` | Get aggregate rating for a user `{average_score, total_ratings}` |

Ratings can only be submitted once per order, and only after the order reaches `Completed` status.

---

#### Payments — PayHere checkout

| Method | Path | Who | Description |
|---|---|---|---|
| `POST` | `/api/marketplace/orders/{order_id}/payment/init` | Buyer | Order must be `Confirmed` and not already paid. Computes the total server-side from `agreed_price × requested_quantity` (never trusts a client amount), returns the full PayHere checkout payload (merchant id, hash, buyer details, sandbox flag). Idempotent — repeated calls before payment settles reuse the same `Initiated` `Payment` row rather than creating a new one. Returns `503` if `PAYHERE_MERCHANT_ID`/`SECRET` aren't configured in `.env`. |
| `GET` | `/api/marketplace/orders/{order_id}/payment` | Buyer or seller | Latest payment attempt's status for this order — the frontend polls this after PayHere's client-side checkout completes, since the DB only flips to `Paid` once the webhook below has landed. |
| `POST` | `/api/payments/payhere/notify` | PayHere (server-to-server, no auth) | Webhook. Verifies `md5sig` against `PAYHERE_MERCHANT_SECRET` before trusting anything in the payload; on `status_code=2` (success) marks the `Payment` and the order `Paid`, notifies the seller in-app and by email. |

Once `payment_status=Paid`, the order's `Confirmed → Delivered` transition (blocked otherwise — see `update_order_status` in `marketplace_service.py`) becomes available to the seller. Requires `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, `PAYHERE_MODE` (`sandbox`/`live`), and `PAYHERE_NOTIFY_URL` (must be a publicly reachable HTTPS URL — PayHere cannot call `localhost`) in `backend/.env`.

---

#### Admin — Admin JWT required for all endpoints (`/api/admin/*`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/users` | List all users with `is_verified`, role badges, status |
| `POST` | `/api/admin/users` | Create a user account |
| `PATCH` | `/api/admin/users/{id}` | Suspend or unsuspend a user (`{"is_suspended": true/false}`) |
| `DELETE` | `/api/admin/users/{id}` | Delete a user |
| `POST` | `/api/admin/users/{id}/resend-verification` | Resend verification code for an unverified user |
| `POST` | `/api/admin/users/bulk` | Bulk-create users from an uploaded CSV |
| `GET` | `/api/admin/farms` | List all farms across all users |
| `POST` | `/api/admin/farms/bulk` | Bulk-create farms from an uploaded CSV |
| `GET` | `/api/admin/marketplace/listings` | All listings (any status) |
| `PATCH` | `/api/admin/marketplace/listings/{id}/archive` | Archive a listing |
| `GET` | `/api/admin/marketplace/orders` | All orders platform-wide |
| `GET` | `/api/admin/activity` | User activity log |
| `GET` | `/api/admin/feedback` | All feedback submissions |
| `DELETE` | `/api/admin/feedback/{id}` | Delete a feedback submission |
| `POST` | `/api/admin/feedback/{id}/reply` | Reply to and resolve a feedback ticket |
| `POST` | `/api/admin/submit-feedback` | Submit feedback (any authenticated user — this is what the "Send Feedback" sidebar button calls) |
| `GET` | `/api/admin/reports` | Platform stats: `{users:{total,land_owners,traders,suspended}, farms:{total}, marketplace:{total_listings,total_orders}, feedback:{open}}` |
| `GET` | `/api/admin/harvest-forecast?district=` | Upcoming harvest dates derived from active cultivation sessions, optionally filtered by district |
| `GET` | `/api/admin/export/users.csv` | Download all users as CSV |
| `GET` | `/api/admin/export/orders.csv` | Download all orders as CSV |
| `GET` | `/api/admin/export/activity.csv` | Download activity log as CSV |
| `GET` | `/api/admin/export/farms.csv` | Download all farms as CSV |
| `GET` | `/api/admin/export/harvest.csv` | Download the harvest forecast as CSV |

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

- **Second backend service added (port 8000):** FastAPI + SQLAlchemy + PostgreSQL. Handles auth, farms, crops, marketplace, and admin.
- **JWT authentication:** register/login for Land Owner and Trader roles; Admin auto-created on startup.
- **Land Owner portal:** full CRUD for farms, crops, and cultivation sessions with DB persistence.
- **Role-based dashboards:** Admin and Trader dashboards.
- **Marketplace page** added.
- **React Router v6** routing with `AppLayout` and `LandOwnerLayout` shell components.
- **Dark mode / light mode** with `data-theme` CSS variable, persisted to localStorage.
- `services/api.js` added — a `fetch()`-based `request()` wrapper (no axios or other HTTP library) for farm, crop, and platform API calls.
- Cultivation tracker sessions migrated from in-memory ML service storage to PostgreSQL (`cultivation_sessions` + `cultivation_tasks` tables, 2 Alembic migrations).
- Frontend i18n expanded; `AppContext` updated to include theme state.

### v7.0 — Platform features, notifications, and admin tools

- **Phone number field** added to user profiles; shown on marketplace listings and order detail cards.
- **In-app notification system:** `notifications` DB table; bell icon with unread badge (polls every 30 seconds); mark-read and mark-all-read. Backend auto-creates notifications on purchase, confirmation, delivery, and completion events.
- **Email notifications via SMTP:** order lifecycle events trigger emails when `EMAIL_ENABLED=true`; falls back to console logging in dev.
- **Marketplace search & filters:** name search, min/max price, district filter — all applied server-side on the listings endpoint.
- **PDF export:** `exportSessionPDF()` in `MyCultivations.jsx` uses `jsPDF` to generate a cultivation report for any active session client-side.
- **5-star rating & review:** `ratings` DB table; `POST /api/ratings/orders/{id}` (once per order, Completed only); aggregate shown per seller.
- **Admin CSV exports:** `GET /api/admin/export/{users,orders,activity}.csv` — streamed as `StreamingResponse` with `text/csv` content type.
- **Admin resend verification:** `POST /api/admin/users/{id}/resend-verification`; `is_verified` field now force-included in `/api/admin/users` response (was being silently dropped by FastAPI's `response_model` filter).
- **Cultivation task status:** ML service task update uses `{"status": "done"|"skipped"|"pending"|"overdue"}` (not `{"completed": bool}`).
- **Multi-role accounts:** dual Land Owner + Trader users select active role at login; `Switch Role` button in sidebars for instant switching without re-login.
- **Email-based registration with a code, not a link:** `POST /auth/verify-email` takes `{email, code}` — a 6-digit code emailed on registration, entered on `VerifyCodePage` — replacing the earlier link/token design.
- **Marketplace negotiation:** buyers and sellers exchange counter-offers via `POST /api/marketplace/orders/{id}/negotiation`, persisted as an append-only `marketplace_negotiation_messages` thread (separate from the "current offer" snapshot on the order itself).
- **Admin bulk import:** `AdminUserImport.jsx` / `AdminFarmImport.jsx` + `POST /api/admin/users/bulk` / `/api/admin/farms/bulk` — create many users or farms from an uploaded CSV in one action.
- **Admin harvest forecast:** `AdminHarvestForecast.jsx` + `GET /api/admin/harvest-forecast` — upcoming harvest dates derived from active cultivation sessions across all farms, filterable by district, exportable as CSV.

### v8.0 — PayHere payment gateway (2026-07-13)

- **Payment step added to the order lifecycle:** after the seller confirms an order, the buyer must pay via PayHere (sandbox) before the seller can mark it `Delivered` — enforced server-side in `update_order_status()`, not just in the UI.
- **New `payments` table and `Payment` model:** one row per checkout attempt (`Initiated`/`Paid`/`Failed`/`Cancelled`/`Chargedback`); `marketplace_orders` gained `payment_status` (`Unpaid`/`Paid`) and `paid_at`.
- **New `routers/payments.py`:** checkout init (`POST .../payment/init`, idempotent), a signature-verified webhook (`POST /api/payments/payhere/notify`), and a status-polling endpoint (`GET .../payment`).
- **New shared `PayDialog.jsx` component:** loads PayHere's JS SDK on demand, used from both `MarketplacePage.jsx` and `TraderOrders.jsx`.
- **Receipt PDF:** `exportReceiptPDF()` in `MarketplacePage.jsx`, modeled on the existing `exportSessionPDF()` pattern — downloadable once an order is paid.
- Requires `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, `PAYHERE_MODE`, `PAYHERE_NOTIFY_URL` in `backend/.env` (see `.env.example`) — not yet configured as of this writing, so the checkout flow currently stops at a clear "not configured" error rather than completing.

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
