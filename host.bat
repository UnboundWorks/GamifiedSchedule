@echo off
REM ===========================================================================
REM  Dubbs Family Quest - always-on local host (Windows)
REM  Builds the app and serves it on your home network at port 4173.
REM  Leave this running on the 24/7 PC, or use setup-autostart.bat to have it
REM  start automatically after every reboot.
REM ===========================================================================
setlocal
cd /d "%~dp0"
title Dubbs Family Quest - Host

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed.
  echo   Install the LTS version from https://nodejs.org/ then run this again.
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
echo   Building the app...
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
echo   ===============================================================
echo   Dubbs Family Quest is now serving on your network.
echo   Open the "Network:" address below on your iPad's Safari,
echo   then Share -^> Add to Home Screen.
echo   Keep this window open (or use setup-autostart.bat for 24/7).
echo   ===============================================================
echo.

REM Serve, and if it ever stops, wait 5s and restart automatically.
:loop
call npm run host
echo.
echo   Server stopped. Restarting in 5 seconds... (close this window to quit)
timeout /t 5 >nul
goto loop
