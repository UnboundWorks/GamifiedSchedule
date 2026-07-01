@echo off
REM ===========================================================================
REM  GamifiedSchedule - dev launcher (double-click to run on Windows)
REM  Starts the live dev server and opens your browser to the app.
REM ===========================================================================
setlocal
cd /d "%~dp0"
title GamifiedSchedule (dev)

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
echo   Starting GamifiedSchedule...
echo   Your browser will open at http://localhost:5173
echo   Leave this window open while using the app. Close it (or press Ctrl+C) to stop.
echo.
call npm run dev -- --open

echo.
echo   The dev server has stopped.
pause
