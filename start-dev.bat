@echo off
REM MyBudgetTracker Dual-Server (Dev-Modus mit Hot-Reload)
REM Windows: Doppelklick startet alles.

cd /d "%~dp0"
chcp 65001 >nul

cls
echo ==========================================
echo   MyBudgetTracker — Dev-Modus
echo ==========================================
echo.

REM Node prüfen
where node >nul 2>nul
if errorlevel 1 (
  echo [FEHLER] Node.js ist nicht installiert.
  echo.
  echo Installation:
  echo   - Installer:    https://nodejs.org  ^(LTS-Version^)
  echo   - Oder winget:  winget install OpenJS.NodeJS.LTS
  echo.
  pause
  exit /b 1
)

for /f "tokens=1 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
for /f "tokens=2 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
if %NODE_MAJOR% LSS 18 (
  echo [FEHLER] Node.js zu alt. Benoetigt: 18+
  pause
  exit /b 1
)
echo [OK] Node ist installiert
node -v

REM Dependencies
if not exist "node_modules" (
  echo.
  echo Server-Dependencies werden installiert ^(einmalig, ~15 Sek^)...
  call npm install --no-audit --no-fund --loglevel=error
  if errorlevel 1 (
    echo [FEHLER] npm install fehlgeschlagen
    pause
    exit /b 1
  )
)
echo [OK] Server-Dependencies da

if not exist "new\node_modules" (
  echo.
  echo App-Dependencies werden installiert ^(einmalig, ~30 Sek^)...
  pushd new
  call npm install --no-audit --no-fund --loglevel=error
  popd
  if errorlevel 1 (
    echo [FEHLER] npm install ^(new^) fehlgeschlagen
    pause
    exit /b 1
  )
)
echo [OK] App-Dependencies da

echo.
echo Starte Server...
echo.
echo    Alte App:  http://localhost:3000
echo    Neue App:  http://localhost:3001
echo.
echo    Strg+C beendet beide.
echo.

REM Browser nach 2 Sek öffnen
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000 && start http://localhost:3001"

node server.js

echo.
echo Server beendet.
pause
