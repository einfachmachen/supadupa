@echo off
REM MyBudgetTracker Dual-Server (Production-Modus)

cd /d "%~dp0"
chcp 65001 >nul

cls
echo ==========================================
echo   MyBudgetTracker — Production-Modus
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [FEHLER] Node.js ist nicht installiert.
  echo Installation: https://nodejs.org
  pause
  exit /b 1
)

for /f "tokens=2 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
if %NODE_MAJOR% LSS 18 (
  echo [FEHLER] Node.js zu alt. Benoetigt: 18+
  pause
  exit /b 1
)
echo [OK] Node ist installiert
node -v

if not exist "node_modules" (
  echo Server-Dependencies installieren...
  call npm install --no-audit --no-fund --loglevel=error || ( pause & exit /b 1 )
)

if not exist "new\node_modules" (
  echo App-Dependencies installieren...
  pushd new
  call npm install --no-audit --no-fund --loglevel=error
  popd
  if errorlevel 1 ( pause & exit /b 1 )
)

echo Baue App ^(kann 5-15 Sek dauern^)...
pushd new
call npm run build
popd
if errorlevel 1 (
  echo [FEHLER] Build fehlgeschlagen
  pause
  exit /b 1
)

echo.
echo Starte Server...
echo    Alte App:  http://localhost:3000
echo    Neue App:  http://localhost:3001 ^(Production^)
echo.

start "" /b cmd /c "timeout /t 1 /nobreak >nul && start http://localhost:3000 && start http://localhost:3001"

node server.js --prod

pause
