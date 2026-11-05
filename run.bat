@echo off
title StockAI Launcher
cls
echo ====================================================================
echo           StockAI - AI-Powered Stock Market Analysis System
echo ====================================================================
echo.

echo [1/3] Starting Backend Server (FastAPI + AI Model) on http://localhost:8000...
start "StockAI Backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Waiting 3 seconds for backend initialization...
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Server (React + Vite) on http://localhost:3000...
start "StockAI Frontend" cmd /k "cd /d %~dp0frontend\stockai && npm run dev -- --host"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:3000...
start http://localhost:3000

echo.
echo ====================================================================
echo  StockAI is now RUNNING!
echo  - Frontend Dashboard: http://localhost:3000
echo  - Backend API:        http://localhost:8000
echo  - API Swagger Docs:   http://localhost:8000/docs
echo ====================================================================
echo You can minimize this window. Close the opened windows to stop the servers.
pause

