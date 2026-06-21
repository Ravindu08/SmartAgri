# SmartAgri — AI-Powered Agribusiness Platform for Sri Lanka

**ML Service v5.3 · Main API v1.0** | Multi-role platform | AI Crop Recommendation | Farm Management | Trilingual

Full-stack web application for Sri Lankan agribusiness. Farmers get AI-driven crop recommendations and lifecycle guidance; land owners manage farms, crops, and cultivation sessions; traders access their own dashboard and marketplace; admins have full platform oversight.

---

## Quick Start

### One command (recommended)

Double-click **`start-services.bat`** — kills stale processes on ports 8000/8001/5173, checks PostgreSQL, opens three Command Prompt service windows, and polls each until ready. Do **not** run it as Administrator.

### Manual start (3 terminals)

**Terminal 1 — Main Backend (port 8000)**
```bash
cd backend
python -m alembic upgrade head    # first run only — creates DB tables
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
# http://localhost:8000/docs
```

**Terminal 2 — ML / AI Service (port 8001)**
```bash
cd backend
python -m uvicorn ml_service.app:app --host 127.0.0.1 --port 8001 --reload
# http://localhost:8001/docs
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

Copy `backend/.env.example` to `backend/.env` and fill in the required values:

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/smartagri
SECRET_KEY=your-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SMARTAGRI_CORS_ORIGINS=http://localhost:5173
```

The admin account (`admin@smartagri.lk`) is created automatically on first startup.

### Tests

```bash
python -m pytest backend/tests/ -v
```

---

## Architecture

| Layer | Port | Technologies |
|---|---|---|
| Main API | 8000 | Python · FastAPI · Uvicorn · SQLAlchemy · PostgreSQL · Alembic · JWT |
| ML / AI Service | 8001 | Python · FastAPI · Uvicorn · scikit-learn · XGBoost · NumPy · joblib |
| Frontend | 5173 | React 18 · React Router v6 · Vite 5 · Tailwind CSS · SWR |

---

## Two ML Prediction Modes

| Mode | Input | Accuracy |
|---|---|---|
| **Full Analysis** | N, P, K, Temperature, Rainfall, pH, Humidity + soil/zone/irrigation/season | ~90% Top-1 |
| **Quick Predict** | Soil type, agro zone, irrigation, season (+ optional district) | ~47% Top-1 |

---

## User Roles

| Role | Access | How created |
|---|---|---|
| **Admin** | Full platform oversight — users, farms, marketplace, reports, activity logs | Auto-created on startup |
| **Land Owner** | Farm CRUD, crop management, cultivation tracker, marketplace listings | Self-register at `/register` |
| **Trader** | Trader dashboard, marketplace browse & purchase requests, order tracking | Self-register at `/register` |
| **Dual role** | Users can hold both Land Owner and Trader roles simultaneously | Admin grants or self-register both |

---

## Features

**AI & Crop Tools**
- 41 Sri Lankan crops · 15 agro zones · 25 districts · 34 soil types
- RF + XGBoost soft-voting ensemble with temperature-scaled confidence
- Per-prediction explainable AI (XAI) via RF decision path traversal — no SHAP library
- Crop-specific planting calendar and outlier warnings (±3σ)
- Full crop lifecycle guide — growth stages, fertilisation schedule, disease & pest management, harvest guide
- Cultivation tracker — auto-generated task schedule, DB-persisted, task status tracking
- Weather & farm advisory — Open-Meteo live conditions + 7-day forecast for all 25 districts
- Yield & price calculator
- Prediction history (localStorage, last 10)

**Marketplace**
- Crop listings and agricultural product listings with images
- Purchase request negotiation with counter-offer messaging
- Order lifecycle: pending → confirmed → delivered → completed
- Transaction history panel

**Admin Dashboard**
- User management (view, suspend, role assignment, create accounts)
- Farm and cultivation oversight
- Activity feed and user feedback review
- Marketplace moderation
- Platform statistics and reports

**Auth & Security**
- Email verification required on registration (token emailed via SMTP)
- Forgot password / reset password flow (time-limited tokens, 1 hour expiry)
- JWT authentication (configurable token lifetime)
- Multi-role accounts with live role switching
- Account suspension by admin
- Dark mode / light mode (persisted in localStorage)
- Full trilingual UI: English / සිංහල / தமிழ்
- Responsive layout

**Email configuration (`backend/.env`)**

| Variable | Description |
|---|---|
| `EMAIL_ENABLED` | `false` = print links to console (dev), `true` = send via SMTP |
| `SMTP_HOST` | SMTP server (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | Usually `587` (STARTTLS) |
| `SMTP_USER` | SMTP login email |
| `SMTP_PASSWORD` | SMTP password / app password |
| `FRONTEND_URL` | Base URL for token links (e.g. `http://localhost:5173`) |

> **Dev tip:** leave `EMAIL_ENABLED=false`. Token links are printed to the backend console so you can test without a real email account.

---

## Dev Logins (local only)

| Role | Email | Password |
|---|---|---|
| Land Owner + Trader | induwara.ihalavithana@gmail.com | 12345678 |
| Admin | admin@smartagri.lk | Admin@12345 |
