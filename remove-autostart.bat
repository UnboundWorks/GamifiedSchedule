@echo off
REM ===========================================================================
REM  Dubbs Family Quest - undo 24/7 hosting setup (Windows)
REM  RIGHT-CLICK and "Run as administrator".
REM  Removes the auto-start task and the firewall rule.
REM ===========================================================================
setlocal
title Dubbs Family Quest - Remove Auto-start

net session >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Please RIGHT-CLICK this file and choose "Run as administrator".
  echo.
  pause
  exit /b 1
)

echo.
echo   Removing auto-start task...
schtasks /end /tn "DubbsFamilyQuest" >nul 2>nul
schtasks /delete /tn "DubbsFamilyQuest" /f

echo.
echo   Removing firewall rule...
netsh advfirewall firewall delete rule name="Dubbs Family Quest"

echo.
echo   Done. Dubbs Family Quest will no longer start automatically.
echo   (Any running host window can just be closed.)
echo.
pause
