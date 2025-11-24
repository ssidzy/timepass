@echo off
REM Quick Start Setup Script for Streaming App (Windows)

echo.
echo 4K Movie Streaming App - Quick Setup
echo ====================================
echo.

REM Check Node.js installation
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Node.js not found. Please install Node.js v14+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js version: %NODE_VERSION%

REM Check FFmpeg installation
where ffmpeg >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] FFmpeg not found!
    echo Please download FFmpeg from: https://ffmpeg.org/download.html
    echo And add it to your PATH environment variable
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('ffmpeg -version ^| findstr /R "ffmpeg"') do set FFMPEG_VERSION=%%i
echo [OK] FFmpeg found

REM Create .env file if doesn't exist
if not exist ".env" (
    echo [*] Creating .env file...
    copy .env.example .env
)

REM Install npm dependencies
echo.
echo [*] Installing npm dependencies...
call npm install

REM Create necessary directories
echo.
echo [*] Creating directories...
if not exist "streams" mkdir streams
if not exist "logs" mkdir logs
if not exist "temp" mkdir temp

echo.
echo ====================================
echo [OK] Setup complete!
echo.
echo To start the server, run:
echo   npm start
echo.
echo Server will run on: http://localhost:3000
echo ====================================
echo.
pause
