@echo off
title SmartAgri ^| Stop Services
cls

echo.
echo  ============================================================
echo    SmartAgri ^| Stopping All Services
echo  ============================================================
echo.

REM ── Step 1: Kill the cmd windows by title (takes down the whole process tree) ─
echo  Closing service windows...
taskkill /F /T /FI "WINDOWTITLE eq SmartAgri - Backend :8000"   >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq SmartAgri - ML Service :8001" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq SmartAgri - Frontend :5173"  >nul 2>&1

timeout /t 1 /nobreak >nul

REM ── Step 2: Port cleanup (catches any leftover workers from reload mode) ─────
echo  Cleaning up leftover processes on ports 8000, 8001, 5173...
for %%P in (8000 8001 5173) do (
    for /f "tokens=5" %%i in ('netstat -ano 2^>nul ^| findstr /L ":%%P " ^| findstr /L "LISTENING"') do (
        if not "%%i"=="" (
            taskkill /F /T /PID %%i >nul 2>&1
        )
    )
)

timeout /t 1 /nobreak >nul

REM ── Step 3: Verify ───────────────────────────────────────────────────────────
echo.
set "REMAINING=0"
for %%P in (8000 8001 5173) do (
    netstat -ano 2>nul | findstr /L ":%%P " | findstr /L "LISTENING" >nul
    if not errorlevel 1 (
        echo  [!] Port %%P still in use.
        set "REMAINING=1"
    )
)

if "%REMAINING%"=="0" (
    echo  All SmartAgri services stopped cleanly.
) else (
    echo.
    echo  Some ports are still occupied. Try running as Administrator.
)

echo.
pause
