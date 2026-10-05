@echo off
REM Starts the whole SAN TECH system, each part in its own window:
REM   1. Backend  (FastAPI, http://localhost:8000)
REM   2. Frontend (web chat, http://localhost:3000)
REM   3. ngrok    (public URL for Africa's Talking USSD/SMS)
REM Double-click this file, or run "start-all" from C:\agri-advisor.
REM Options:  start-all nongrok   (skip ngrok)
REM Stop everything with stop-all.bat.

cd /d "%~dp0"

if not exist ".venv\Scripts\activate.bat" (
    echo Python environment not found. Run first:  python -m venv .venv  and  pip install -r backend\requirements.txt
    pause
    exit /b 1
)

echo Starting backend...
start "SAN TECH - Backend (port 8000)" cmd /k "cd /d %~dp0backend && call ..\.venv\Scripts\activate.bat && uvicorn app.main:app --reload"

echo Waiting for the backend to be ready...
set /a tries=0
:wait_backend
timeout /t 2 /nobreak >nul
set /a tries+=1
curl -s -o nul http://localhost:8000/health && goto backend_ready
if %tries% lss 20 goto wait_backend
echo Backend did not answer after 40 seconds - check the Backend window for errors.
:backend_ready

echo Starting frontend...
start "SAN TECH - Frontend (port 3000)" cmd /k "cd /d %~dp0frontend\web && pnpm dev"

if /i "%~1"=="nongrok" goto open_browser
echo Starting ngrok...
start "SAN TECH - ngrok" cmd /k "ngrok http 8000"

:open_browser
echo Opening the web chat in a few seconds...
timeout /t 10 /nobreak >nul
start "" http://localhost:3000

echo.
echo All started. Keep the three windows open.
echo   Web chat:   http://localhost:3000
echo   API docs:   http://localhost:8000/docs
echo   Public URL: https://irish-foppish-cullen.ngrok-free.dev  (USSD *384*74619#)
echo To stop everything: stop-all.bat
