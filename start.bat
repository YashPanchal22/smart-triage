@echo off
echo Starting Smart Healthcare Ecosystem...
start "Backend - FastAPI" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
start "Frontend - Vite" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo.
echo ========================================================
echo   Smart Healthcare Ecosystem is starting!
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/api/docs
echo ========================================================
echo Demo Accounts:
echo   Admin:       admin / admin123
echo   Doctor:      doctor / doctor123
echo   Triage:      triage / triage123
echo   Patient:     patient / patient123
echo   Blood Bank:  blood / blood123
echo   Emergency:   emergency / emergency123
echo ========================================================
