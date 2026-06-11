@echo off
title SmartAgri Launcher
echo ============================================
echo   SmartAgri - Starting all services
echo ============================================
echo.

:: Kill old processes on ports 8000, 8001, and 5173
echo [1/3] Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001 " ^| findstr "LISTENING"') do (
    echo       Killing old main backend (PID %%a)
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    echo       Killing old ML service (PID %%a)
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo       Killing old frontend (PID %%a)
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: Start main backend (auth, farms, crops) on port 8001
echo [2/3] Starting main backend on http://localhost:8001
start "SmartAgri Backend" cmd /k "cd /d "%~dp0backend" && uvicorn app.main:app --reload --port 8001"

timeout /t 2 /nobreak >nul

:: Start ML service on port 8000
echo [2/3] Starting ML service on http://localhost:8000
start "SmartAgri ML Service" cmd /k "cd /d "%~dp0backend" && uvicorn ml_service.app:app --reload --port 8000"

timeout /t 2 /nobreak >nul

:: Start frontend on port 5173
echo [3/3] Starting frontend on http://localhost:5173
start "SmartAgri Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================
echo   Main Backend -> http://localhost:8001
echo   ML Service   -> http://localhost:8000
echo   Frontend     -> http://localhost:5173
echo ============================================
echo.
echo All three windows are open. Close them to stop the servers.
pause
