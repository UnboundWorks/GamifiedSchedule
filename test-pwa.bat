@echo off
REM ===========================================================================
REM  GamifiedSchedule - PWA / offline test launcher (double-click on Windows)
REM  Builds the production app and serves it so you can install it and test
REM  offline behavior - the same mode the iPad uses.
REM ===========================================================================
setlocal
cd /d "%~dp0"
title GamifiedSchedule (PWA test)

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed.
  echo   Please install the LTS version from https://nodejs.org/ then run this again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo.
  echo   First run: installing dependencies. This can take a few minutes...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   Dependency install failed. See the messages above.
    echo.
    pause
    exit /b 1
  )
)

echo.
echo   Building the production app...
echo.
call npm run build
if errorlevel 1 (
  echo.
  echo   Build failed. See the messages above.
  echo.
  pause
  exit /b 1
)

echo.
echo   Starting the production server...
echo   Your browser will open at http://localhost:4173
echo   Look for the install icon in the address bar to add it as an app.
echo   To test offline: open DevTools (F12) - Network tab - set to "Offline" - reload.
echo   Leave this window open while using the app. Close it (or press Ctrl+C) to stop.
echo.
call npm run preview -- --open

echo.
echo   The server has stopped.
pause
