@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title ResearchFlow - MERN Launcher

echo.
echo ==============================================
echo        ResearchFlow - MERN Launcher
echo ==============================================
echo.

where node >nul 2>&1 || (echo [ERROR] Node.js 20+ is required. & pause & exit /b 1)
where npm >nul 2>&1 || (echo [ERROR] npm is required. & pause & exit /b 1)

if not exist "backend\.env" copy /Y "backend\.env.example" "backend\.env" >nul
if not exist "frontend\.env" copy /Y "frontend\.env.example" "frontend\.env" >nul

if not exist "backend\node_modules" (
  echo [SETUP] Installing backend dependencies...
  pushd backend
  call npm install --no-audit --no-fund
  if errorlevel 1 (echo [ERROR] Backend install failed. Check internet/npm. & popd & pause & exit /b 1)
  popd
)

echo [CHECK] Checking MongoDB on 127.0.0.1:27017 ...
powershell -NoProfile -Command "if (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -InformationLevel Quiet)) { exit 1 }" >nul 2>&1
if errorlevel 1 (
  echo [INFO] MongoDB is not responding. Attempting to start the MongoDB Windows service...
  net start MongoDB >nul 2>&1
  timeout /t 3 /nobreak >nul
)
powershell -NoProfile -Command "if (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -InformationLevel Quiet)) { exit 1 }" >nul 2>&1
if errorlevel 1 (echo [ERROR] MongoDB is not running on 127.0.0.1:27017. Install/start MongoDB Community Server, then run this file again. & pause & exit /b 1)

if not exist "frontend\node_modules" (
  echo [SETUP] Installing frontend dependencies...
  pushd frontend
  call npm install --no-audit --no-fund
  if errorlevel 1 (echo [ERROR] Frontend install failed. Check internet/npm. & popd & pause & exit /b 1)
  popd
)

echo.
echo [CHECK] Building frontend before opening browser...
pushd frontend
call npm run build
if errorlevel 1 (
  echo.
  echo [ERROR] Frontend build failed. The browser will NOT be opened.
  echo Read the error above and fix the dependency/source issue first.
  popd
  pause
  exit /b 1
)
popd

echo [CHECK] Frontend build passed.

echo [SEED] Ensuring development database contains ResearchFlow demo data...
pushd backend
call npm run seed
if errorlevel 1 (echo [ERROR] Database seed failed. Check MongoDB and the backend error above. & popd & pause & exit /b 1)
echo [VERIFY] Verifying demo login credentials...
call npm run verify-demo-login
if errorlevel 1 (echo [ERROR] Demo login verification failed. Database credentials are not valid. & popd & pause & exit /b 1)
popd

echo [START] Starting backend on http://127.0.0.1:5000 ...
start "ResearchFlow Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo [START] Starting frontend on http://127.0.0.1:5173 ...
start "ResearchFlow Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo [CHECK] Waiting for backend health...
set BACKEND_READY=0
for /L %%N in (1,1,30) do (
  powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5000/health' -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; exit 1" >nul 2>&1
  if not errorlevel 1 (set BACKEND_READY=1&goto :backend_ready)
  timeout /t 1 /nobreak >nul
)
:backend_ready
if "%BACKEND_READY%"=="0" (echo [ERROR] Backend did not become ready on port 5000. Keep the backend window open and inspect its error. & pause & exit /b 1)
echo [CHECK] Backend health passed.
start "" http://127.0.0.1:5173

echo.
echo ==============================================
echo ResearchFlow is starting.
echo Frontend: http://127.0.0.1:5173
echo Backend:  http://127.0.0.1:5000
echo ==============================================
echo.
echo Keep the server windows open while using the app.
pause
