@echo off
REM 🔧 PitchConnect - Windows Build Fix Script
REM This script fixes Prisma permission errors on Windows and builds the application
REM Usage: Double-click fix-and-build.bat or run: fix-and-build.bat

setlocal enabledelayedexpansion

echo.
echo ================================================
echo  🏆 PitchConnect Build Fix & Start
echo ================================================
echo.
echo This script will:
echo   1. Kill any running Node processes
echo   2. Clear Prisma cache
echo   3. Install dependencies
echo   4. Generate Prisma client
echo   5. Build the application
echo   6. Start the development server
echo.
echo Press ENTER to continue or CTRL+C to cancel...
pause >nul

REM ========================================================================
REM STEP 1: Kill Node processes
REM ========================================================================
echo.
echo [1/6] 🗑️  Killing Node processes...
taskkill /IM node.exe /F /Q 2>nul
if "%ERRORLEVEL%"=="0" (
    echo  ✅ Node processes killed
) else (
    echo  ✓ No Node processes running
)
timeout /t 2 /nobreak >nul

REM ========================================================================
REM STEP 2: Clear Prisma cache
REM ========================================================================
echo.
echo [2/6] 🖱️  Clearing Prisma cache...
if exist node_modules\.prisma (
    rmdir /s /q node_modules\.prisma >nul 2>&1
    echo  ✅ Prisma cache cleared
) else (
    echo  ✓ Prisma cache already clean
)

REM ========================================================================
REM STEP 3: Install dependencies
REM ========================================================================
echo.
echo [3/6] 📊 Installing dependencies...
call npm install
if errorlevel 1 (
    echo.
    echo  ❌ npm install failed
    echo.
    echo Trying cleanup and retry...
    rmdir /s /q node_modules >nul 2>&1
    del package-lock.json >nul 2>&1
    npm cache clean --force >nul 2>&1
    echo Retrying...
    call npm install
    if errorlevel 1 (
        echo.
        echo  ❌ npm install still failing
        echo  Check your internet connection and disk space
        pause
        goto error
    )
)
echo  ✅ Dependencies installed

REM ========================================================================
REM STEP 4: Generate Prisma client
REM ========================================================================
echo.
echo [4/6] 🔖 Generating Prisma client...
call npm run prisma:generate
if errorlevel 1 (
    echo.
    echo  ❌ Prisma generation failed
    pause
    goto error
)
echo  ✅ Prisma client generated

REM ========================================================================
REM STEP 5: Build application
REM ========================================================================
echo.
echo [5/6] 🔨 Building application...
set NODE_OPTIONS=--max-old-space-size=4096
call npm run build
if errorlevel 1 (
    echo.
    echo  ❌ Build failed
    echo.
    echo Attempting aggressive cleanup...
    taskkill /IM node.exe /F /Q 2>nul
    timeout /t 2 /nobreak >nul
    rmdir /s /q .next >nul 2>&1
    rmdir /s /q node_modules\.prisma >nul 2>&1
    echo Retrying build...
    set NODE_OPTIONS=--max-old-space-size=4096
    call npm run build
    if errorlevel 1 (
        echo.
        echo  ❌ Build still failing
        echo  Last resort: complete reset
        echo.
        pause
        goto nuclear
    )
)
echo  ✅ Build completed successfully

REM ========================================================================
REM STEP 6: Start development server
REM ========================================================================
echo.
echo [6/6] 🚀 Starting development server...
echo.
echo ================================================
echo  ✅ All systems ready!
echo ================================================
echo.
echo 📔 Access your app:
echo    Local:   http://localhost:3000
echo    Network: http://%COMPUTERNAME%:3000
echo.
echo 🔐 Authentication: NextAuth v5 (Ready)
echo 📊 Database: Prisma (Ready)
echo 🖖 API: Next.js (Ready)
echo.
echo Press CTRL+C to stop the server
echo.
pause

call npm run dev
goto end

REM ========================================================================
REM ERROR handling
REM ========================================================================
:error
echo.
echo ❌ Build process failed
echo.
echo Try these manual fixes:
echo   1. Close all open terminals and editors
echo   2. Restart your computer
echo   3. Check your antivirus (might be blocking node.exe)
echo   4. Ensure you have 5GB+ free disk space
echo   5. Update Node.js from https://nodejs.org
echo.
echo For detailed help, read WINDOWS_PRISMA_FIX.md
echo.
pause
goto end

REM ========================================================================
REM Nuclear option - complete reset
REM ========================================================================
:nuclear
echo.
echo 💣 NUCLEAR OPTION: Complete Reset
echo.
echo This will delete node_modules and .next folder
echo Your source code and .env file are SAFE
echo.
echo Press ENTER to proceed or CTRL+C to cancel...
pause >nul

echo Killing processes...
taskkill /IM node.exe /F /Q 2>nul
timeout /t 2 /nobreak >nul

echo Removing .next...
rmdir /s /q .next >nul 2>&1

echo Removing node_modules...
rmdir /s /q node_modules >nul 2>&1

echo Removing cache...
del package-lock.json >nul 2>&1

echo Clearing npm cache...
call npm cache clean --force >nul 2>&1

echo Reinstalling...
call npm install

echo Generating Prisma...
call npm run prisma:generate

echo Building...
set NODE_OPTIONS=--max-old-space-size=4096
call npm run build

if errorlevel 0 (
    echo.
    echo ✅ Nuclear reset successful!
    echo.
    call npm run dev
    goto end
)

echo.
echo ❌ Even nuclear option failed
echo Please reach out for support
pause

REM ========================================================================
REM Cleanup and exit
REM ========================================================================
:end
echo.
echo ================================================
echo  Done! Exiting...
echo ================================================
echo.
pause
exit /b 0
