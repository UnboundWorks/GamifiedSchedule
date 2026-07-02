@echo off
REM ===========================================================================
REM  Dubbs Family Quest - one-time setup for 24/7 hosting (Windows)
REM  RIGHT-CLICK this file and choose "Run as administrator".
REM  It (1) opens the firewall for port 4173, (2) makes the host start
REM  automatically when you log in, and (3) starts it now.
REM ===========================================================================
setlocal
cd /d "%~dp0"
title Dubbs Family Quest - Setup Auto-start

REM --- Must be admin ---
net session >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Please RIGHT-CLICK this file and choose "Run as administrator".
  echo.
  pause
  exit /b 1
)

echo.
echo   1) Opening Windows Firewall for port 4173...
netsh advfirewall firewall delete rule name="Dubbs Family Quest" >nul 2>nul
netsh advfirewall firewall add rule name="Dubbs Family Quest" dir=in action=allow protocol=TCP localport=4173

echo.
echo   2) Registering auto-start at logon...
schtasks /create /tn "DubbsFamilyQuest" /tr "\"%~dp0host.bat\"" /sc onlogon /rl HIGHEST /f

echo.
echo   3) Starting the host now...
schtasks /run /tn "DubbsFamilyQuest" >nul 2>nul

echo.
echo   ===============================================================
echo   Done! This PC will now serve Dubbs Family Quest after every login.
echo.
echo   Your network addresses (use one ending in 4173 on the iPad):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
  for /f "tokens=* delims= " %%b in ("%%a") do echo        http://%%b:4173
)
echo.
echo   TIP: In your router, give this PC a "reserved" / static IP so the
echo   address never changes, then on the iPad open it in Safari and choose
echo   Share -^> Add to Home Screen.
echo   ===============================================================
echo.
pause
