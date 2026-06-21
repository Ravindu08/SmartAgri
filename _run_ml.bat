@echo off
title SmartAgri ^| ML Service :8001
cd /d "%~dp0backend"
uvicorn ml_service.app:app --host 127.0.0.1 --port 8001 --reload
