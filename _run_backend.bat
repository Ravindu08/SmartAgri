@echo off
title SmartAgri ^| Backend :8000
cd /d "%~dp0backend"
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
