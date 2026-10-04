@echo off
title SmartAgri - ML Service :8001
cd /d "%~dp0backend"
REM Use the pinned virtual environment when it exists (see backend/requirements.txt).
set "UVICORN=uvicorn"
if exist ".venv\Scripts\uvicorn.exe" set "UVICORN=.venv\Scripts\uvicorn.exe"
"%UVICORN%" ml_service.app:app --host 127.0.0.1 --port 8001 --reload
