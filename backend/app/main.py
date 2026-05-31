from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.db.database import SessionLocal
from app.services.auth import ensure_admin_user


app = FastAPI(
	title="Smart Agribusiness Decision Support System API",
	description="Backend API for a Smart Agribusiness Decision Support System",
	version="0.1.0",
)

app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"http://localhost:4173",
		"http://localhost:5173",
		"http://localhost:5174",
		"http://127.0.0.1:4173",
		"http://127.0.0.1:5173",
		"http://127.0.0.1:5174",
	],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.on_event("startup")
def seed_admin_user() -> None:
	db = SessionLocal()
	try:
		ensure_admin_user(db)
	finally:
		db.close()


app.include_router(auth_router, prefix="/auth", tags=["auth"])


@app.get("/")
async def root() -> dict[str, str]:
	return {"message": "Smart Agribusiness Decision Support System API is running."}


@app.get("/health")
async def health_check() -> dict[str, str]:
	return {"status": "ok"}
