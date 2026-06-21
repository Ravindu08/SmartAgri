$host.UI.RawUI.WindowTitle = "SmartAgri - Backend (8000)"
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host " SmartAgri - Main Backend" -ForegroundColor Green
Write-Host " Binding: http://127.0.0.1:8000" -ForegroundColor Gray
Write-Host ""

Set-Location "$PSScriptRoot\backend"

Write-Host "[Backend] Applying DB migrations..." -ForegroundColor Cyan
try {
    python -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) { throw "Alembic exited with code $LASTEXITCODE" }
    Write-Host "[Backend] Migrations OK." -ForegroundColor Green
} catch {
    Write-Host "[Backend] WARNING: Migration failed - $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "[Backend] Continuing with existing schema..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[Backend] Starting server (hot-reload enabled)..." -ForegroundColor Cyan

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

Write-Host ""
Write-Host "[Backend] Server stopped." -ForegroundColor Red
Read-Host "Press Enter to close"
