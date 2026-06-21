import os
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.db.database import SessionLocal
from app.routers.admin import router as admin_router
from app.routers.crop import router as crop_router
from app.routers.marketplace import router as marketplace_router
from app.routers.sprint_marketplace import router as sprint_marketplace_router
from app.services.sprint_marketplace_store import seed_demo_data
from app.services.auth import ensure_admin_user
from app.routers.farm import router as farm_router


def _run_migrations() -> None:
    try:
        from alembic.config import Config
        from alembic import command as alembic_command
        ini = Path(__file__).resolve().parents[1] / "alembic.ini"
        cfg = Config(str(ini))
        cfg.set_main_option("script_location", str(Path(__file__).resolve().parents[1] / "alembic"))
        alembic_command.upgrade(cfg, "head")
    except Exception as exc:
        print(f"[startup] migration warning: {exc}")


# ── Lifespan (replaces deprecated @app.on_event) ─────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    _run_migrations()
    db = SessionLocal()
    try:
        ensure_admin_user(db)
    finally:
        db.close()
    seed_demo_data()
    yield  # app runs here


# ── CORS origins from env (same pattern as ML service) ───────────────────────
_cors_origins_raw = os.getenv(
    "SMARTAGRI_CORS_ORIGINS",
    "http://localhost:4173,http://localhost:5173,http://localhost:5174,http://localhost:5175,"
    "http://127.0.0.1:4173,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175",
)
_cors_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]

app = FastAPI(
    title="Smart Agribusiness Decision Support System API",
    description="Backend API for a Smart Agribusiness Decision Support System",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(farm_router)
app.include_router(crop_router)
app.include_router(marketplace_router)
app.include_router(sprint_marketplace_router)
app.include_router(admin_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Smart Agribusiness Decision Support System API is running."}


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
