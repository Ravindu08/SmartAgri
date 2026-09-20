import logging
import math
import os
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.limiter import limiter

from app.api.auth import router as auth_router
from app.db.database import SessionLocal
from app.routers.admin import router as admin_router
from app.routers.contact import router as contact_router
from app.routers.crop import router as crop_router
from app.routers.marketplace import router as marketplace_router
from app.routers.notifications import router as notifications_router
from app.routers.payments import router as payments_router
from app.routers.ratings import router as ratings_router
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
        logger.warning("[startup] migration warning: %s", exc, exc_info=True)


# ── Lifespan (replaces deprecated @app.on_event) ─────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    _run_migrations()
    db = SessionLocal()
    try:
        ensure_admin_user(db)
    except Exception as exc:
        logger.warning("[startup] admin user setup warning: %s", exc)
    finally:
        db.close()
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

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def _json_safe(obj):
    """Replace NaN/Infinity with a string so a value can always be echoed back."""
    if isinstance(obj, float) and not math.isfinite(obj):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    return obj


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return 422 for invalid input even when the input itself cannot be encoded.

    JSON permits NaN and Infinity, so a client can send them into any float
    field. FastAPI's default handler echoes the offending value back in the
    error's `input` field, and encoding NaN then raises -- turning a clean 422
    rejection into a 500. Scrub the values so the rejection survives.
    """
    # _json_safe first (removes NaN, which json.dumps rejects), then
    # jsonable_encoder (turns the ctx ValueError object into plain data).
    return JSONResponse(
        status_code=422,
        content={"detail": jsonable_encoder(_json_safe(exc.errors()))},
    )

app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Listing images are stored on disk (see marketplace_service._store_image)
_uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
_uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(farm_router)
app.include_router(crop_router)
app.include_router(marketplace_router)
app.include_router(payments_router)
app.include_router(admin_router)
app.include_router(contact_router)
app.include_router(notifications_router, prefix="/api", tags=["notifications"])
app.include_router(ratings_router, prefix="/api", tags=["ratings"])


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Smart Agribusiness Decision Support System API is running."}


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
