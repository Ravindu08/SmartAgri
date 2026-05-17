# SmartAgri

SmartAgri - Smart Agricultural Decision Support System

This repository contains a FastAPI backend and a React frontend for a university final-year project.

Structure:

- `backend/` — FastAPI, SQLAlchemy, Alembic migrations
- `frontend/` — React landing page (Vite)

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Run the backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
