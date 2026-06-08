"""Auth / Farm / Crop Service entry point — runs on port 8001."""
from app.main import app  # noqa: F401

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "auth_main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        reload_excludes=["*.venv*", "*/.venv/*", "*/node_modules/*"],
    )
