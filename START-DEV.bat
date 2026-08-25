@echo off
echo ============================================
echo    SuperMart POS - Development Mode
echo ============================================
echo.
echo Starting Backend on http://localhost:5000 ...
echo Starting Frontend on http://localhost:3000 ...
echo.
echo Press Ctrl+C in each window to stop.
echo ============================================

start "SuperMart Backend" cmd /k "cd backend && npm run dev"
timeout /t 2 >nul
start "SuperMart Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 >nul
start http://localhost:3000
