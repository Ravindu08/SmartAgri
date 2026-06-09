@echo off
title SmartAgri Launcher
echo ============================================
echo   SmartAgri - Starting all services
echo ============================================
echo.

:: Kill old processes on both ports
echo [1/2] Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001 " ^| findstr "LISTENING"') do (
    echo       Killing old backend (PID %%a)
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo       Killing old frontend (PID %%a)
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: Start backend in its own window
echo [2/2] Starting backend on http://localhost:8001
start "SmartAgri Backend" cmd /k "cd /d "%~dp0backend" && uvicorn app.main:app --reload --port 8001"

:: Brief pause so backend window opens first
timeout /t 2 /nobreak >nul

:: Start frontend in its own window
echo [2/2] Starting frontend on http://localhost:5173
start "SmartAgri Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================
echo   Backend  -> http://localhost:8001
echo   Frontend -> http://localhost:5173
echo ============================================
echo.
echo Both windows are open. Close them to stop the servers.
pause
