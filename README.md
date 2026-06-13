# SmartAgri — AI-Powered Agribusiness Platform for Sri Lanka

**ML Service v5.3 · Main API v0.1** | Multi-role platform | AI Crop Recommendation | Farm Management | Trilingual

Full-stack web application for Sri Lankan agribusiness. Farmers get AI-driven crop recommendations and lifecycle guidance; land owners manage farms, crops, and cultivation sessions; traders and admins access role-specific dashboards.

For complete documentation see [DOCS.md](DOCS.md).

---

## Quick Start

### One command (recommended)

Double-click **`start.bat`** — kills any old processes on ports 8000/8001/5173, then opens three terminal windows.

### Manual start (3 terminals)

**Terminal 1 — Auth / Farm / Crop Service (port 8001)**
```bash
cd backend
python -m alembic upgrade head    # first run only — creates DB tables
uvicorn app.main:app --reload --port 8001
# http://localhost:8001/docs
```

**Terminal 2 — ML Service (port 8000)**
```bash
cd backend
uvicorn ml_service.app:app --reload --port 8000
# http://localhost:8000/docs
```

**Terminal 3 — Frontend (port 5173)**
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL — database `smartagri` must exist before first run

### Environment setup

Copy `backend/.env.example` to `backend/.env` and set at minimum:

```
DATABASE_URL=postgresql://user:password@localhost:5432/smartagri
SECRET_KEY=your-secret-key
```

The admin user (`admin@smartagri.lk` / `Admin@12345`) is created automatically on first startup.

### Tests

```bash
python -m pytest backend/tests/ -v
```

---

## Two ML Prediction Modes

| Mode | Input | Accuracy |
|---|---|---|
| **Full Analysis** | N, P, K, Temperature, Rainfall, pH, Humidity + soil/zone/irrigation/season | ~90% Top-1 |
| **Quick Predict** | Soil type, agro zone, irrigation, season (+ optional district) | ~47% Top-1 |

---

## Tech Stack

| Layer | Technologies |
|---|---|
| ML API (port 8000) | Python · FastAPI · Uvicorn · scikit-learn · XGBoost · NumPy · joblib |
| Main API (port 8001) | Python · FastAPI · Uvicorn · SQLAlchemy · PostgreSQL · Alembic · JWT |
| Frontend | React 18 · React Router v6 · Vite 5 · Axios |

---

## User Roles

| Role | Access | How created |
|---|---|---|
| **Admin** | Admin dashboard, full platform oversight | Auto-created on startup |
| **Land Owner** | Landowner portal — farms, crops, cultivations | Self-register at `/register` |
| **Trader** | Trader dashboard, marketplace | Self-register at `/register` |
| **Visitor** | Public pages only | — |

---

## Features

**AI Tools**
- 34 Sri Lankan crops · 15 agro zones · 25 districts · 34 soil types
- RF + XGBoost soft-voting ensemble with temperature-scaled confidence
- Per-prediction explainable AI (XAI) via RF decision path traversal — no SHAP library
- Crop-specific planting calendar and outlier warnings (±3σ)
- Prediction history (localStorage, last 10)
- Full crop lifecycle guide — growth stages, fertilisation schedule, disease & pest management, harvest guide
- Cultivation tracker — auto-generated task schedule, DB-persisted, task status tracking
- Weather & farm advisory — Open-Meteo live conditions + 7-day forecast for all 25 districts
- Yield & price calculator

**Platform**
- JWT authentication (30-minute tokens)
- Land owner portal: Farm CRUD, Crop CRUD, Cultivation sessions
- Role-based dashboards (Admin, Trader)
- Marketplace page
- Dark mode / light mode (persisted in localStorage)
- Full trilingual UI: English / සිංහල / தமிழ்
