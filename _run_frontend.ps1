$host.UI.RawUI.WindowTitle = "SmartAgri - Frontend (5173)"

Write-Host ""
Write-Host " SmartAgri - Frontend (Vite)" -ForegroundColor Green
Write-Host " Binding: http://localhost:5173" -ForegroundColor Gray
Write-Host ""

# Kill any stale process on 5173 or 5174
foreach ($port in @(5173, 5174)) {
    $lines = netstat -aon 2>$null | Select-String ":$port\s" | Select-String "LISTENING"
    foreach ($line in $lines) {
        $p = ($line -split '\s+')[-1]
        if ($p -match '^\d+$' -and $p -ne '0') {
            try {
                Stop-Process -Id $p -Force -ErrorAction Stop
                Write-Host "[Frontend] Killed stale process PID $p (port $port)" -ForegroundColor Yellow
            } catch {}
        }
    }
}

Set-Location "$PSScriptRoot\frontend"

Write-Host "[Frontend] Starting Vite dev server..." -ForegroundColor Cyan

npm run dev

Write-Host ""
Write-Host "[Frontend] Dev server stopped." -ForegroundColor Red
Read-Host "Press Enter to close"
