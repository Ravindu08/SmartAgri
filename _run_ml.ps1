$host.UI.RawUI.WindowTitle = "SmartAgri - ML Service (8001)"

Write-Host ""
Write-Host " SmartAgri - ML / AI Service" -ForegroundColor Green
Write-Host " Binding: http://127.0.0.1:8001" -ForegroundColor Gray
Write-Host " Provides: Crop prediction, weather analysis, cultivation guidance" -ForegroundColor Gray
Write-Host ""

Set-Location "$PSScriptRoot\backend"

Write-Host "[ML] Starting service (hot-reload enabled)..." -ForegroundColor Cyan

python -m uvicorn ml_service.app:app --host 127.0.0.1 --port 8001 --reload

Write-Host ""
Write-Host "[ML] Service stopped." -ForegroundColor Red
Read-Host "Press Enter to close"
