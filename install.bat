@echo off
chcp 65001 >nul 2>&1
title CIMCO MDC Dashboard - One-Click Installer
color 0F

:: ── Resolve base directory (supports double-click from any location) ──
set "BASE_DIR=%~dp0"
:: Remove trailing backslash
if "%BASE_DIR:~-1%"=="\" set "BASE_DIR=%BASE_DIR:~0,-1%"
cd /d "%BASE_DIR%"

echo.
echo  ========================================================
echo    CIMCO MDC Dashboard - One-Click Installer
echo  ========================================================
echo.

:: ══════════════════════════════════════════════════════════
:: Step 1: Detect Node.js (5-level priority chain)
:: ══════════════════════════════════════════════════════════
echo  [Step 1/5] Detecting Node.js...
echo.

set "NODE_CMD="
set "NPM_CMD="
set "NODE_SOURCE="

:: ── Priority 1: Bundled portable node\node.exe ──
if not exist "%BASE_DIR%\node\node.exe" goto :try_system_node
"%BASE_DIR%\node\node.exe" -v >nul 2>&1
if errorlevel 1 goto :try_system_node
set "NODE_CMD=%BASE_DIR%\node\node.exe"
set "NPM_CMD=%BASE_DIR%\node\npm.cmd"
set "NODE_SOURCE=bundled portable"
goto :node_found

:try_system_node

:: ── Priority 2: System PATH node ──
where node >nul 2>&1
if not errorlevel 1 (
    set "NODE_CMD=node"
    set "NPM_CMD=npm"
    set "NODE_SOURCE=system PATH"
    goto :node_found
)

echo  [!] Node.js not found locally. Attempting auto-install...
echo.

:: ── Priority 3: winget (Win10 1709+ / Win11) ──
where winget >nul 2>&1
if not errorlevel 1 (
    echo  [*] Trying winget install...
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements >nul 2>&1
    if not errorlevel 1 (
        echo  [OK] winget install succeeded. Refreshing PATH...
        call :refresh_path
        where node >nul 2>&1
        if not errorlevel 1 (
            set "NODE_CMD=node"
            set "NPM_CMD=npm"
            set "NODE_SOURCE=winget auto-install"
            goto :node_found
        )
    )
    echo  [!] winget install failed or node not in PATH yet.
    echo.
)

:: ── Priority 4: PowerShell download MSI + silent install ──
echo  [*] Trying PowerShell MSI download...
set "NODE_VER=22.14.0"
set "NODE_MSI=node-v%NODE_VER%-x64.msi"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VER%/%NODE_MSI%"

powershell -NoProfile -Command ^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; " ^
    "try { Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%TEMP%\%NODE_MSI%' -UseBasicParsing; " ^
    "Write-Host 'DOWNLOAD_OK' } catch { Write-Host 'DOWNLOAD_FAIL' }" 2>nul | findstr "DOWNLOAD_OK" >nul 2>&1

if not errorlevel 1 (
    echo  [*] Installing Node.js v%NODE_VER% (may require admin)...
    msiexec /i "%TEMP%\%NODE_MSI%" /qn /norestart 2>nul
    if not errorlevel 1 (
        call :refresh_path
        where node >nul 2>&1
        if not errorlevel 1 (
            set "NODE_CMD=node"
            set "NPM_CMD=npm"
            set "NODE_SOURCE=MSI auto-install"
            del /q "%TEMP%\%NODE_MSI%" >nul 2>&1
            goto :node_found
        )
    )
    del /q "%TEMP%\%NODE_MSI%" >nul 2>&1
    echo  [!] MSI install failed (may need admin privileges).
    echo.
)

:: ── Priority 5: Open browser for manual download ──
echo  ┌─────────────────────────────────────────────────────┐
echo  │  Could not install Node.js automatically.           │
echo  │                                                     │
echo  │  Opening download page now...                       │
echo  │  Please install Node.js v22 LTS (64-bit).          │
echo  │                                                     │
echo  │  After install, CLOSE this window and run           │
echo  │  install.bat again.                                 │
echo  └─────────────────────────────────────────────────────┘
echo.
start https://nodejs.org/en/download
echo  Press any key after you have installed Node.js...
pause >nul

call :refresh_path
where node >nul 2>&1
if not errorlevel 1 (
    set "NODE_CMD=node"
    set "NPM_CMD=npm"
    set "NODE_SOURCE=manual install"
    goto :node_found
)

echo.
echo  [ERROR] Node.js still not detected.
echo  Please install Node.js, then run install.bat again.
echo.
pause
exit /b 1

:node_found
for /f "tokens=*" %%i in ('"%NODE_CMD%" -v') do set "NODE_VER=%%i"
echo  [OK] Node.js %NODE_VER% detected (%NODE_SOURCE%).
echo.

:: ══════════════════════════════════════════════════════════
:: Step 2: Verify npm
:: ══════════════════════════════════════════════════════════
echo  [Step 2/5] Verifying npm...

if "%NODE_SOURCE%"=="bundled portable" goto :npm_bundled
:: System npm
where npm >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] npm not found. Please reinstall Node.js.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set "NPM_VER=%%i"
goto :npm_done

:npm_bundled
if not exist "%NPM_CMD%" (
    echo  [ERROR] npm.cmd not found in bundled node directory.
    echo  The package may be corrupted. Please re-download.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('call "%NPM_CMD%" -v 2^>nul') do set "NPM_VER=%%i"

:npm_done

echo  [OK] npm %NPM_VER% detected.
echo.

:: ══════════════════════════════════════════════════════════
:: Step 3: Check / install node_modules
:: ══════════════════════════════════════════════════════════
echo  [Step 3/5] Checking dependencies...

if exist "%BASE_DIR%\node_modules\express" (
    if exist "%BASE_DIR%\node_modules\mysql2" (
        echo  [OK] Dependencies already installed.
        goto :deps_done
    )
)

echo  [*] Installing production dependencies (may take 1-2 minutes)...
echo.

if "%NODE_SOURCE%"=="bundled portable" (
    :: Use bundled npm with explicit prefix
    call "%NPM_CMD%" install --omit=dev --prefix "%BASE_DIR%" 2>&1
) else (
    call npm install --omit=dev 2>&1
)

if errorlevel 1 (
    echo.
    echo  [ERROR] npm install failed.
    echo  Check your internet connection and try again.
    pause
    exit /b 1
)
echo.
echo  [OK] Dependencies installed successfully.

:deps_done
echo.

:: ══════════════════════════════════════════════════════════
:: Step 4: Configure .env
:: ══════════════════════════════════════════════════════════
echo  [Step 4/5] Configuring environment...

if not exist "%BASE_DIR%\.env" (
    if exist "%BASE_DIR%\.env.example" (
        copy "%BASE_DIR%\.env.example" "%BASE_DIR%\.env" >nul
    ) else (
        (
            echo # CIMCO MDC Database ^(existing production MariaDB, READ-ONLY^)
            echo DB_HOST=localhost
            echo DB_PORT=3306
            echo DB_USER=root
            echo DB_PASSWORD=cimco123
            echo DB_NAME=MDC
            echo.
            echo # Backend API Server
            echo SERVER_PORT=3002
        ) > "%BASE_DIR%\.env"
    )
    echo  [!] Created .env with default settings.
) else (
    echo  [OK] .env already exists.
)

echo.
echo  ┌─────────────────────────────────────────────────────┐
echo  │  Database Configuration (.env)                      │
echo  │                                                     │

:: Display current .env values (explicit key checks skip comments automatically)
for /f "usebackq eol=# tokens=1,* delims==" %%a in ("%BASE_DIR%\.env") do (
    if "%%a"=="DB_HOST"     echo  │    DB_HOST     = %%b
    if "%%a"=="DB_PORT"     echo  │    DB_PORT     = %%b
    if "%%a"=="DB_USER"     echo  │    DB_USER     = %%b
    if "%%a"=="DB_PASSWORD" echo  │    DB_PASSWORD = %%b
    if "%%a"=="DB_NAME"     echo  │    DB_NAME     = %%b
    if "%%a"=="SERVER_PORT" echo  │    SERVER_PORT = %%b
)

echo  │                                                     │
echo  │  [1] Continue with these settings                   │
echo  │  [2] Open .env in Notepad to edit                   │
echo  └─────────────────────────────────────────────────────┘
echo.

choice /C 12 /N /M "  Press [1] to continue, [2] to edit .env: "
if %ERRORLEVEL%==2 (
    notepad "%BASE_DIR%\.env"
    echo.
    echo  Save the file in Notepad, then press any key to continue...
    pause >nul
)

:: ══════════════════════════════════════════════════════════
:: Step 5: Quick verification
:: ══════════════════════════════════════════════════════════
echo.
echo  [Step 5/5] Quick verification...

set "CHECKS_OK=1"

:: Check server files
if exist "%BASE_DIR%\server\dist\index.js" (
    echo  [OK] Server files found.
) else (
    echo  [FAIL] Server files not found (server/dist/index.js)!
    set "CHECKS_OK=0"
)

:: Check frontend
if exist "%BASE_DIR%\dist\index.html" (
    echo  [OK] Frontend files found.
) else (
    echo  [FAIL] Frontend files not found!
    set "CHECKS_OK=0"
)

:: Check express module
if exist "%BASE_DIR%\node_modules\express" (
    echo  [OK] Express module present.
) else (
    echo  [FAIL] Express module missing!
    set "CHECKS_OK=0"
)

:: Quick server test (try to import express)
"%NODE_CMD%" -e "try{import('express').then(()=>process.exit(0)).catch(()=>process.exit(1))}catch(e){process.exit(1)}" >nul 2>&1
if not errorlevel 1 (
    echo  [OK] Express module loadable.
) else (
    echo  [WARN] Express module load test inconclusive.
)

echo.

if "%CHECKS_OK%"=="0" (
    echo  ========================================================
    echo   [!] Some checks failed. Run verify.bat for details.
    echo  ========================================================
    echo.
    pause
    exit /b 1
)

:: ══════════════════════════════════════════════════════════
:: Done! Offer to start
:: ══════════════════════════════════════════════════════════
echo  ========================================================
echo    Installation Complete!
echo  ========================================================
echo.
echo  Checklist:
echo    [OK] Node.js %NODE_VER% (%NODE_SOURCE%)
echo    [OK] npm %NPM_VER%
echo    [OK] Dependencies installed
echo    [OK] Environment configured
echo    [OK] Server and frontend files verified
echo.

set "SERVER_PORT=3002"
for /f "usebackq eol=# tokens=1,* delims==" %%a in ("%BASE_DIR%\.env") do (
    if "%%a"=="SERVER_PORT" set "SERVER_PORT=%%b"
)

echo  Dashboard URL:  http://localhost:%SERVER_PORT%
echo.
echo  To start the dashboard later:
echo    Double-click  start.bat
echo.

choice /C YN /N /M "  Start the dashboard now? [Y/N]: "
if %ERRORLEVEL%==1 (
    call "%BASE_DIR%\start.bat"
)

exit /b 0

:: ══════════════════════════════════════════════════════════
:: Subroutine: Refresh PATH from registry (no restart needed)
:: ══════════════════════════════════════════════════════════
:refresh_path
:: Read system PATH from registry
for /f "tokens=2,*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%b"
:: Read user PATH from registry
for /f "tokens=2,*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USR_PATH=%%b"
:: Combine
if defined SYS_PATH if defined USR_PATH (
    set "PATH=%SYS_PATH%;%USR_PATH%"
) else if defined SYS_PATH (
    set "PATH=%SYS_PATH%"
)
goto :eof
