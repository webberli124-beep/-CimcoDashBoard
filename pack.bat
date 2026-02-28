@echo off
chcp 65001 >nul 2>&1
title CIMCO Dashboard - Build Delivery Packages

:: ── Resolve base directory ──
set "BASE_DIR=%~dp0"
if "%BASE_DIR:~-1%"=="\" set "BASE_DIR=%BASE_DIR:~0,-1%"
cd /d "%BASE_DIR%"

echo ============================================
echo   Building CIMCO MDC Dashboard Packages
echo   Output: lite + full ZIP
echo ============================================
echo.

:: ══════════════════════════════════════════════
:: 1. Install all dependencies (including dev)
:: ══════════════════════════════════════════════
echo [1/8] Installing all dependencies...
call npm ci
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm ci failed.
    pause
    exit /b 1
)
echo.

:: ══════════════════════════════════════════════
:: 2. Build frontend
:: ══════════════════════════════════════════════
echo [2/8] Building frontend...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)
echo.

:: ══════════════════════════════════════════════
:: 3. Compile server TypeScript
:: ══════════════════════════════════════════════
echo [3/8] Compiling server...
call npx tsc -p server/tsconfig.json
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Server compile failed.
    pause
    exit /b 1
)
echo.

:: ══════════════════════════════════════════════
:: 4. Assemble lite package
::    _build\lite\cimco-dashboard\  ← top-level folder in ZIP
:: ══════════════════════════════════════════════
echo [4/8] Assembling lite package...

set "BUILD_LITE=_build\lite"
set "PKG=cimco-dashboard"
set "LITE_DIR=%BUILD_LITE%\%PKG%"
if exist "_build" rd /s /q "_build"
mkdir "%LITE_DIR%\server\dist"

:: Copy built output
xcopy /E /I /Q dist "%LITE_DIR%\dist"
xcopy /E /I /Q server\dist "%LITE_DIR%\server\dist"

:: Copy root files
copy package.json "%LITE_DIR%\"
copy package-lock.json "%LITE_DIR%\"
copy .env.example "%LITE_DIR%\"
copy INSTALL.md "%LITE_DIR%\"
copy README.md "%LITE_DIR%\"

:: Copy scripts
copy launch.vbs "%LITE_DIR%\"
copy start.bat "%LITE_DIR%\"
copy install.bat "%LITE_DIR%\"
copy verify.bat "%LITE_DIR%\"

:: Fresh production-only npm install in package dir
echo   Installing production dependencies in package...
pushd "%LITE_DIR%"
call npm ci --omit=dev --ignore-scripts 2>&1
popd
if not exist "%LITE_DIR%\node_modules\express" (
    echo [ERROR] Production dependency install failed in package dir.
    pause
    exit /b 1
)

echo   [OK] Lite package assembled
echo.

:: ══════════════════════════════════════════════
:: 5. Create lite ZIP (with top-level folder)
:: ══════════════════════════════════════════════
echo [5/8] Creating cimco-dashboard-lite.zip...

set "OUT_DIR=%BASE_DIR%\install_package"
if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"

set "LITE_ZIP=cimco-dashboard-lite.zip"
set "LITE_ZIP_ABS=%OUT_DIR%\%LITE_ZIP%"
if exist "%LITE_ZIP_ABS%" del /q "%LITE_ZIP_ABS%"

:: ZIP the parent dir so archive contains cimco-dashboard\ folder
powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('%BUILD_LITE%', '%LITE_ZIP_ABS%', 'Optimal', $true)"

if exist "%LITE_ZIP_ABS%" (
    for %%F in ("%LITE_ZIP_ABS%") do echo   [OK] %LITE_ZIP% (%%~zF bytes^)
) else (
    echo   [WARNING] Lite ZIP creation failed.
)
echo.

:: ══════════════════════════════════════════════
:: 6. Copy lite to full + add Node.js
:: ══════════════════════════════════════════════
echo [6/8] Preparing full package...

set "BUILD_FULL=_build\full"
set "FULL_DIR=%BUILD_FULL%\%PKG%"
mkdir "%BUILD_FULL%"
xcopy /E /I /Q "%LITE_DIR%" "%FULL_DIR%"

set "NODE_VER=22.14.0"
set "NODE_ZIP=node-v%NODE_VER%-win-x64.zip"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VER%/%NODE_ZIP%"
set "NODE_DL=%BASE_DIR%\_build\%NODE_ZIP%"
set "NODE_EXTRACT=%BASE_DIR%\_build\_node-extract"

echo   Downloading %NODE_ZIP%...
where curl.exe >nul 2>&1
if errorlevel 1 goto :dl_ps
curl.exe -L -o "%NODE_DL%" "%NODE_URL%" --progress-bar
goto :dl_check

:dl_ps
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_DL%' -UseBasicParsing"

:dl_check
if not exist "%NODE_DL%" (
    echo   [WARNING] Download failed. Full package will not contain Node.js.
    goto :skip_node
)

echo   Extracting...
if exist "%NODE_EXTRACT%" rd /s /q "%NODE_EXTRACT%"
powershell -NoProfile -Command "Expand-Archive -Path '%NODE_DL%' -DestinationPath '%NODE_EXTRACT%' -Force"
if errorlevel 1 (
    echo   [WARNING] Extraction failed.
    del /q "%NODE_DL%" >nul 2>&1
    goto :skip_node
)

if exist "%FULL_DIR%\node" rd /s /q "%FULL_DIR%\node"
xcopy /E /I /Q "%NODE_EXTRACT%\node-v%NODE_VER%-win-x64" "%FULL_DIR%\node"
rd /s /q "%NODE_EXTRACT%" >nul 2>&1
del /q "%NODE_DL%" >nul 2>&1
echo   [OK] Portable Node.js v%NODE_VER% bundled
echo.

:skip_node

:: ══════════════════════════════════════════════
:: 7. Create full ZIP (with top-level folder)
:: ══════════════════════════════════════════════
echo [7/8] Creating cimco-dashboard-full.zip...

set "FULL_ZIP=cimco-dashboard-full.zip"
set "FULL_ZIP_ABS=%OUT_DIR%\%FULL_ZIP%"
if exist "%FULL_ZIP_ABS%" del /q "%FULL_ZIP_ABS%"

powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('%BUILD_FULL%', '%FULL_ZIP_ABS%', 'Optimal', $true)"

if exist "%FULL_ZIP_ABS%" (
    for %%F in ("%FULL_ZIP_ABS%") do echo   [OK] %FULL_ZIP% (%%~zF bytes^)
) else (
    echo   [WARNING] Full ZIP creation failed.
)
echo.

:: ══════════════════════════════════════════════
:: 8. Cleanup
:: ══════════════════════════════════════════════
echo [8/8] Cleaning up...
rd /s /q "_build" >nul 2>&1

echo.
echo ============================================
echo   Packages created successfully!
echo   Output: install_package\
echo.
if exist "%LITE_ZIP_ABS%" (
    for %%F in ("%LITE_ZIP_ABS%") do echo   Lite:  %LITE_ZIP%  (%%~zF bytes^)
)
if exist "%FULL_ZIP_ABS%" (
    for %%F in ("%FULL_ZIP_ABS%") do echo   Full:  %FULL_ZIP%  (%%~zF bytes^)
)
echo.
echo   Lite: no Node.js, client needs system install
echo   Full: includes portable Node.js v%NODE_VER%
echo ============================================
pause
