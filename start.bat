@echo off
setlocal EnableDelayedExpansion
title SmartAgri - Service Manager
color 0A

echo.
echo  ===================================================
echo   SmartAgri  -  Development Launcher
echo  ===================================================
echo.

:: ----- [1/5] Kill stale processes on service ports -----
echo  [1/5]  Cleaning up old processes...
set KILLED=0
for %%P in (5173 5174 8000 8001) do (
    for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        if not "%%a"=="0" (
            taskkill /F /PID %%a >nul 2>&1
            echo         Killed PID %%a on port %%P
            set KILLED=1
        )
    )
)
if "!KILLED!"=="0" echo         No stale processes found.
timeout /t 2 /nobreak >nul
echo.

:: ----- [2/5] PostgreSQL -----
echo  [2/5]  Starting PostgreSQL (if not already running)...
net start postgresql-x64-17 >nul 2>&1
net start postgresql-x64-16 >nul 2>&1
net start postgresql-x64-15 >nul 2>&1
net start postgresql       >nul 2>&1
sc query postgresql-x64-17 2>nul | findstr /C:"RUNNING" >nul 2>&1
if not errorlevel 1 ( echo         PostgreSQL  [RUNNING] ) else ( echo         PostgreSQL started or already running - check manually if issues arise. )
timeout /t 2 /nobreak >nul
echo.

:: ----- [3/5] Main Backend -----
echo  [3/5]  Starting Main Backend  (port 8000)...
start "SmartAgri - Backend" powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%~dp0_run_backend.ps1"
echo         Waiting for backend...
timeout /t 14 /nobreak >nul
curl -sf http://localhost:8000/health >nul 2>&1
if not errorlevel 1 ( echo         Backend  [UP]  http://localhost:8000 ) else ( echo         Backend not ready yet - check its PowerShell window. )
echo.

:: ----- [4/5] ML Service -----
echo  [4/5]  Starting ML / AI Service  (port 8001)...
start "SmartAgri - ML Service" powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%~dp0_run_ml.ps1"
echo         Waiting for ML service...
timeout /t 12 /nobreak >nul
curl -sf http://localhost:8001/health >nul 2>&1
if not errorlevel 1 ( echo         ML Service  [UP]  http://localhost:8001 ) else ( echo         ML service still loading - check its PowerShell window. )
echo.

:: ----- [5/5] Frontend -----
echo  [5/5]  Starting Frontend  (port 5173)...
start "SmartAgri - Frontend" powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%~dp0_run_frontend.ps1"
echo         Waiting for frontend...
timeout /t 18 /nobreak >nul
curl -sf http://localhost:5173 >nul 2>&1
if not errorlevel 1 ( echo         Frontend  [UP]  http://localhost:5173 ) else ( echo         Frontend not ready yet - check its PowerShell window. )
echo.

:: ----- Summary -----
echo  ===================================================
echo   SERVICE           URL
echo  ---------------------------------------------------
echo   Database          PostgreSQL  (localhost:5432)
echo   Main Backend      http://localhost:8000
echo   ML / AI Service   http://localhost:8001
echo   Frontend          http://localhost:5173
echo  ===================================================
echo.
echo   Open browser:  http://localhost:5173
echo.
echo   Dev logins  (LOCAL ONLY):
echo     Land Owner / Trader :  induwara.ihalavithana@gmail.com  /  12345678
echo     Admin               :  admin@smartagri.lk  /  admin1234
echo.
echo   3 PowerShell windows are keeping the services alive.
echo   To stop: close those 3 windows or press Ctrl+C inside each.
echo  ===================================================
echo.
pause
