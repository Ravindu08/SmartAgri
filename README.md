# SmartAgri — AI Crop Recommendation System for Sri Lanka

**v5.3.0** | Random Forest + XGBoost | Trilingual | Explainable AI

AI-powered crop recommendation for Sri Lankan farmers. Enter your soil and climate conditions, get the best crop suggestion with a full explanation of why — in English, Sinhala, or Tamil.

For complete documentation see [DOCS.md](DOCS.md).

---

## Quick Start (3 terminals)

### Terminal 1 — ML Service (port 8000)
```bash
cd backend
pip install -r requirements.txt
python ml_service/app.py
# http://localhost:8000/docs
```

### Terminal 2 — Auth / Farm / Crop Service (port 8001)
```bash
cd backend
python -m alembic upgrade head       # first run only — creates DB tables
python auth_main.py
# http://localhost:8001/docs
```

> **PostgreSQL required.** Database `smartagri` must exist.
> The `.env` file holds the `DATABASE_URL`. The admin user is auto-created on startup.

### Terminal 3 — Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### Tests
```bash
python -m pytest backend/tests/ -v
```

---

## Two Prediction Modes

| Mode | Input | Accuracy |
|---|---|---|
| **Full Analysis** | N, P, K, Temperature, Rainfall, pH, Humidity + soil/zone/irrigation/season | ~90% Top-1 |
| **Quick Predict** | Soil type, agro zone, irrigation, season (+ optional district) | ~47% Top-1 |

---

## Tech Stack

| Layer | Technologies |
|---|---|
| API | Python · FastAPI · Uvicorn · Pydantic |
| ML | scikit-learn (Random Forest) · XGBoost · NumPy · joblib |
| Training only | pandas |
| Tests only | pytest · httpx |
| Frontend | React 18 · Vite 5 |

---

## Features

- 34 Sri Lankan crops · 15 agro zones · 25 districts · 34 soil types
- RF + XGBoost soft-voting ensemble with temperature-scaled confidence
- Per-prediction XAI via RF decision path traversal (no SHAP library)
- Crop-specific planting calendar
- Outlier warnings (±3σ detection)
- Prediction history (localStorage)
- Soil identification guide
- **Crop Guidance** — full lifecycle guide per crop: growth stages, fertilization schedule, disease & pest management, harvest guide
- **Cultivation Tracker** — auto-generated task schedule for an active growing season; track tasks as pending / done / skipped / overdue
- **Weather & Farm Advisory** — live conditions + 7-day forecast (Open-Meteo) with actionable farm advice for any of the 25 districts
- **Yield & Price Calculator** — estimate expected yield and revenue based on crop, land size, and market prices
- Full trilingual UI: English / සිංහල / தமிழ්
