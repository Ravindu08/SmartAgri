@echo off
setlocal
title SmartAgri - ML Service (port 8001)

echo.
echo  [SmartAgri] Stopping any existing process on port 8001...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8001 " ^| findstr "LISTENING"') do (
    if not "%%a"=="0" (
        taskkill /F /PID %%a >nul 2>&1
        echo  [SmartAgri] Killed PID %%a
    )
)
timeout /t 2 /nobreak >nul

echo  [SmartAgri] Starting ML / AI Service on http://127.0.0.1:8001  (hot-reload enabled)
echo  [SmartAgri] Provides: Crop prediction, weather analysis, cultivation guidance
cd /d "%~dp0backend"
python -m uvicorn ml_service.app:app --host 127.0.0.1 --port 8001 --reload

echo.
pause
