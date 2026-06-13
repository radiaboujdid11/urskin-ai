@echo off
echo Arret de l'ancien backend...
taskkill /F /IM uvicorn.exe 2>nul
taskkill /F /IM python.exe /FI "WINDOWTITLE eq uvicorn*" 2>nul
timeout /t 2 /nobreak >nul

echo Demarrage du backend...
cd /d "%~dp0backend"
set VENV_UVICORN=%~dp0skin-analyzer-train\venv\Scripts\uvicorn.exe
"%VENV_UVICORN%" main:app --host 0.0.0.0 --port 8000 --reload
