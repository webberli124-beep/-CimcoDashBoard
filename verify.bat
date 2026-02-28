@echo off
chcp 65001 >nul 2>&1
title CIMCO Dashboard - Package Verification

:: ── Resolve base directory ──
set "BASE_DIR=%~dp0"
if "%BASE_DIR:~-1%"=="\" set "BASE_DIR=%BASE_DIR:~0,-1%"
cd /d "%BASE_DIR%"

echo.
echo  ========================================================
echo    CIMCO MDC Dashboard - Package Verification
echo  ========================================================
echo.

set "PASS=0"
set "FAIL=0"
set "WARN=0"

:: ══════════════════════════════════════════════════════════
:: Check 1: Node.js
:: ══════════════════════════════════════════════════════════
echo  [1/6] Node.js...

set "NODE_CMD="
if not exist "%BASE_DIR%\node\node.exe" goto :v_try_sys_node
"%BASE_DIR%\node\node.exe" -v >nul 2>&1
if errorlevel 1 goto :v_try_sys_node
set "NODE_CMD=%BASE_DIR%\node\node.exe"
for /f "tokens=*" %%i in ('"%NODE_CMD%" -v') do echo        [OK] Bundled Node.js %%i
set /a PASS+=1
goto :v_node_done

:v_try_sys_node
where node >nul 2>&1
if errorlevel 1 (
    echo        [FAIL] Node.js not found (no bundled node\ and not in PATH)
    set /a FAIL+=1
    goto :v_node_done
)
set "NODE_CMD=node"
for /f "tokens=*" %%i in ('node -v') do echo        [OK] System Node.js %%i
set /a PASS+=1

:v_node_done
echo.

:: ══════════════════════════════════════════════════════════
:: Check 2: Frontend (dist/)
:: ══════════════════════════════════════════════════════════
echo  [2/6] Frontend files (dist/)...

if exist "%BASE_DIR%\dist\index.html" (
    echo        [OK] dist/index.html found
    set /a PASS+=1
) else (
    echo        [FAIL] dist/index.html missing
    set /a FAIL+=1
)
echo.

:: ══════════════════════════════════════════════════════════
:: Check 3: Server files
:: ══════════════════════════════════════════════════════════
echo  [3/6] Server files...

if exist "%BASE_DIR%\server\dist\index.js" (
    echo        [OK] server/dist/index.js found
    set /a PASS+=1
) else (
    echo        [FAIL] server/dist/index.js missing
    echo              Expected: server/dist/index.js
    set /a FAIL+=1
)
echo.

:: ══════════════════════════════════════════════════════════
:: Check 4: node_modules (express + mysql2)
:: ══════════════════════════════════════════════════════════
echo  [4/6] Dependencies (node_modules)...

set "DEP_OK=1"
if exist "%BASE_DIR%\node_modules\express" (
    echo        [OK] express found
) else (
    echo        [FAIL] express missing
    set "DEP_OK=0"
)

if exist "%BASE_DIR%\node_modules\mysql2" (
    echo        [OK] mysql2 found
) else (
    echo        [FAIL] mysql2 missing
    set "DEP_OK=0"
)

if "%DEP_OK%"=="1" (
    set /a PASS+=1
) else (
    set /a FAIL+=1
    echo        [!] Run: npm install --omit=dev   to fix
)
echo.

:: ══════════════════════════════════════════════════════════
:: Check 5: .env
:: ══════════════════════════════════════════════════════════
echo  [5/6] Configuration (.env)...

if exist "%BASE_DIR%\.env" goto :v_env_found
if exist "%BASE_DIR%\.env.example" goto :v_env_example
echo        [FAIL] .env and .env.example both missing
set /a FAIL+=1
goto :v_env_done

:v_env_example
echo        [WARN] .env missing, but .env.example exists
echo              Run install.bat or copy .env.example to .env
set /a WARN+=1
goto :v_env_done

:v_env_found
echo        [OK] .env found
set /a PASS+=1

:v_env_done
echo.

:: ══════════════════════════════════════════════════════════
:: Check 6: package.json
:: ══════════════════════════════════════════════════════════
echo  [6/6] Package manifest (package.json)...

if exist "%BASE_DIR%\package.json" (
    echo        [OK] package.json found
    set /a PASS+=1
) else (
    echo        [FAIL] package.json missing
    set /a FAIL+=1
)
echo.

:: ══════════════════════════════════════════════════════════
:: Summary
:: ══════════════════════════════════════════════════════════
echo  ========================================================
echo    VERIFICATION SUMMARY
echo  ========================================================
echo.
echo    PASSED:   %PASS%
echo    FAILED:   %FAIL%
echo    WARNINGS: %WARN%
echo.

if "%FAIL%"=="0" goto :v_all_pass
echo    ** %FAIL% CHECK^(S^) FAILED **
echo.
echo    The package has issues that need to be resolved.
echo    Please screenshot this output and send to technical support.
goto :v_summary_end

:v_all_pass
echo    ** ALL CHECKS PASSED **
if not "%WARN%"=="0" echo    ^(with %WARN% warning^(s^) - see above^)
echo.
echo    The package is ready to use.
echo    Run install.bat for first-time setup, or start.bat to launch.

:v_summary_end

echo.
echo  ========================================================
echo.
pause
