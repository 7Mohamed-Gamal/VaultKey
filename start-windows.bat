@echo off
title KeyVault & API Sync - Windows Launcher
color 0A

echo ========================================================
echo        KeyVault & API Sync - Local Launcher
echo ========================================================
echo.

:: Check Node.js installation
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not added to PATH!
    echo Please download and install Node.js from: https://nodejs.org/
    echo After installation, please restart this script.
    echo.
    pause
    exit /b
)

echo [1/3] Node.js is detected!
echo.

:: Check if node_modules exists
if not exist node_modules (
    echo [2/3] First time setup: Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b
    )
) else (
    echo [2/3] Dependencies already installed.
)

echo.
echo [3/3] Starting local development server...
echo Access the application at: http://localhost:3000
echo.
echo Press Ctrl + C in this window to stop the server anytime.
echo ========================================================
echo.

:: Open browser automatically after a short delay
start "" "http://localhost:3000"

:: Start the Vite dev server
call npm run dev

pause
