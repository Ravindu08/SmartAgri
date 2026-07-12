@echo off
title SmartAgri Launcher
cls

set "ROOT=%~dp0"

echo.
echo  ============================================================
echo    SmartAgri ^| Starting All Services
echo  ============================================================
echo.

REM ── Check if ports are already occupied ─────────────────────────────────────
for %%P in (8000 8001 5173) do (
    netstat -ano 2>nul | findstr /L ":%%P " | findstr /L "LISTENING" >nul
    if not errorlevel 1 (
        echo  [!] Port %%P is already in use.
        echo      Run stop-services.bat first, then try again.
        echo.
        pause
        exit /b 1
    )
)

echo  [1/3] Starting Backend API   - port 8000
start "SmartAgri - Backend :8000" "%ROOT%_run_backend.bat"

echo  [2/3] Starting ML Service    - port 8001
start "SmartAgri - ML Service :8001" "%ROOT%_run_ml.bat"

echo.
echo  Waiting 8 seconds for backends to initialise...
timeout /t 8 /nobreak >nul

echo  [3/3] Starting Frontend      - port 5173
start "SmartAgri - Frontend :5173" "%ROOT%_run_frontend.bat"

echo.
echo  ============================================================
echo    All services launched in separate windows.
echo.
echo    Backend API  :  http://localhost:8000
echo    ML Service   :  http://localhost:8001
echo    Frontend     :  http://localhost:5173
echo.
echo    Run stop-services.bat to shut everything down.
echo  ============================================================
echo.
pause
