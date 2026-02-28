@echo off
chcp 65001 >nul 2>&1
title CIMCO MDC Dashboard

:: ── Resolve base directory ──
set "BASE_DIR=%~dp0"
if "%BASE_DIR:~-1%"=="\" set "BASE_DIR=%BASE_DIR:~0,-1%"
cd /d "%BASE_DIR%"

echo.
echo  ============================================
echo   CIMCO MDC Dashboard
echo  ============================================
echo.

:: ── Detect Node.js: bundled portable → system PATH ──
set "NODE_CMD="
set "NPM_CMD="

if not exist "%BASE_DIR%\node\node.exe" goto :start_try_system
"%BASE_DIR%\node\node.exe" -v >nul 2>&1
if errorlevel 1 goto :start_try_system
set "NODE_CMD=%BASE_DIR%\node\node.exe"
set "NPM_CMD=%BASE_DIR%\node\npm.cmd"
goto :start_node_ok

:start_try_system
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js is not installed.
    echo.
    echo  Please run install.bat first, or install Node.js from:
    echo    https://nodejs.org/
    echo.
    pause
    exit /b 1
)
set "NODE_CMD=node"
set "NPM_CMD=npm"

:start_node_ok
for /f "tokens=*" %%i in ('"%NODE_CMD%" -v') do echo   Node.js: %%i

:: ── Check node_modules ──
if not exist "%BASE_DIR%\node_modules\express" (
    echo.
    echo  Installing dependencies (first run)...
    call "%NPM_CMD%" install --omit=dev
    if errorlevel 1 (
        echo  [ERROR] npm install failed. Check internet connection.
        pause
        exit /b 1
    )
)

:: ── Check dist ──
if not exist "%BASE_DIR%\dist\index.html" (
    echo  [ERROR] Frontend files not found (dist/index.html).
    echo  The package may be incomplete. Please contact the provider.
    pause
    exit /b 1
)

:: ── Check .env ──
if not exist "%BASE_DIR%\.env" (
    if exist "%BASE_DIR%\.env.example" (
        copy "%BASE_DIR%\.env.example" "%BASE_DIR%\.env" >nul
    ) else (
        echo  [ERROR] Configuration file .env not found.
        echo  Please run install.bat first.
        pause
        exit /b 1
    )
    echo.
    echo  [!] Created .env with default settings.
    echo  Edit .env to set your database connection, then restart.
    echo.
    notepad "%BASE_DIR%\.env"
    pause
    exit /b 0
)

:: ── Read port from .env ──
set SERVER_PORT=3002
for /f "usebackq tokens=1,* delims==" %%a in ("%BASE_DIR%\.env") do (
    if "%%a"=="SERVER_PORT" set SERVER_PORT=%%b
)

:: ── Get LAN IP for other devices ──
set "LAN_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4.*[0-9][0-9]*\.[0-9]"') do (
    if not defined LAN_IP set "LAN_IP=%%a"
)
if defined LAN_IP set "LAN_IP=%LAN_IP: =%"

echo.
echo   Local URL:    http://localhost:%SERVER_PORT%
if defined LAN_IP (
    echo   Network URL:  http://%LAN_IP%:%SERVER_PORT%
    echo.
    echo   Other devices (TV, phone^) can access via Network URL.
)
echo   Press Ctrl+C to stop the server.
echo  ============================================
echo.

:: ── Open browser after 2 seconds ──
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:%SERVER_PORT%"

:: ── Start server ──
if exist "%BASE_DIR%\server\dist\index.js" (
    "%NODE_CMD%" "%BASE_DIR%\server\dist\index.js"
) else (
    echo  [ERROR] Server files not found.
    echo  Expected: server/dist/index.js
    echo  Please run: npx tsc -p server/tsconfig.json
    pause
    exit /b 1
)
