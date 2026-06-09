@echo off
title SmartAgri Backend
echo [SmartAgri] Starting backend on port 8001...

:: Kill any process already using port 8001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001 " ^| findstr "LISTENING"') do (
    echo [SmartAgri] Killing old process on port 8001 (PID %%a)
    taskkill /F /PID %%a >nul 2>&1
)

:: Short pause to let the port free up
timeout /t 1 /nobreak >nul

:: Start uvicorn
cd /d "%~dp0backend"
uvicorn app.main:app --reload --port 8001

pause
