@echo off
REM === Backend starten ===
echo Starte Backend...
start cmd /k "cd taskmanager_backend && python manage.py runserver"

REM === Frontend starten (Vite) ===
echo Starte Frontend...
start cmd /k "cd taskmanager_frontend && npm run dev"

echo Beide Server wurden gestartet.
echo Frontend: http://localhost:5173/
echo API Endpoint: http://127.0.0.1:8000/api/tasks/
pause