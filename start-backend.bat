@echo off
setlocal
title SmartAgri - Backend (port 8000)

echo.
echo  [SmartAgri] Stopping any existing process on port 8000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    if not "%%a"=="0" (
        taskkill /F /PID %%a >nul 2>&1
        echo  [SmartAgri] Killed PID %%a
    )
)
timeout /t 2 /nobreak >nul

echo  [SmartAgri] Applying DB migrations...
cd /d "%~dp0backend"
python -m alembic upgrade head
if errorlevel 1 echo  [SmartAgri] WARNING: Migration returned non-zero - check output above.

echo.
echo  [SmartAgri] Starting Main Backend on http://127.0.0.1:8000  (hot-reload enabled)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

echo.
pause
