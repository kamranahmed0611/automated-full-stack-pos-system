@echo off
echo ============================================
echo    SuperMart POS - Starting...
echo ============================================

echo.
echo [1/3] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 ( echo ERROR: Backend install failed & pause & exit /b )

echo.
echo [2/3] Seeding database with sample data...
call node db/seed.js
if %errorlevel% neq 0 ( echo ERROR: Seed failed & pause & exit /b )

echo.
echo [3/3] Installing frontend dependencies...
cd ../frontend
call npm install
if %errorlevel% neq 0 ( echo ERROR: Frontend install failed & pause & exit /b )

echo.
echo ============================================
echo    SETUP COMPLETE!
echo    Run START-DEV.bat to launch
echo ============================================
pause
