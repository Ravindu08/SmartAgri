@echo off
title SmartAgri Frontend
echo [SmartAgri] Starting frontend on port 5173...

:: Kill any process already using port 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo [SmartAgri] Killing old process on port 5173 (PID %%a)
    taskkill /F /PID %%a >nul 2>&1
)

:: Short pause to let the port free up
timeout /t 1 /nobreak >nul

:: Start Vite
cd /d "%~dp0frontend"
npm run dev

pause
