@echo off
setlocal
title SmartAgri - Frontend (port 5173)

echo.
echo  [SmartAgri] Stopping any existing process on ports 5173 and 5174...
for %%P in (5173 5174) do (
    for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        if not "%%a"=="0" (
            taskkill /F /PID %%a >nul 2>&1
            echo  [SmartAgri] Killed PID %%a  (port %%P)
        )
    )
)
timeout /t 2 /nobreak >nul

echo  [SmartAgri] Starting Frontend on http://localhost:5173
cd /d "%~dp0frontend"
npm run dev

echo.
pause
