@echo off
REM Windows cleanup script for npm reinstall
REM Run this file to clean up node_modules and package-lock.json

echo Cleaning up npm cache...
npm cache clean --force

echo.
echo Removing node_modules folder...
if exist node_modules (
  rmdir /s /q node_modules
  echo node_modules deleted successfully
) else (
  echo node_modules folder not found
)

echo.
echo Removing package-lock.json...
if exist package-lock.json (
  del /q package-lock.json
  echo package-lock.json deleted successfully
) else (
  echo package-lock.json not found
)

echo.
echo Cleanup complete! Now run: npm install
echo.
pause
