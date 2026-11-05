Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "          StockAI - AI-Powered Stock Market Analysis System" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "[1/3] Starting Backend Server (FastAPI) on http://localhost:8000..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$baseDir\backend`" && .venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

Start-Sleep -Seconds 3

Write-Host "[2/3] Starting Frontend Server (React + Vite) on http://localhost:3000..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$baseDir\frontend\stockai`" && npm run dev -- --host"

Start-Sleep -Seconds 3

Write-Host "[3/3] Opening browser at http://localhost:3000..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Green
Write-Host " StockAI is now RUNNING!" -ForegroundColor Green
Write-Host " - Frontend: http://localhost:3000"
Write-Host " - Backend:  http://localhost:8000"
Write-Host " - Docs:     http://localhost:8000/docs"
Write-Host "====================================================================" -ForegroundColor Green

