@echo off
echo ========================================================
echo SOLAR OPTIMIZER - DEV SERVER TROUBLESHOOTER
echo ========================================================
echo.

echo 1. Checking for lingering node processes...
@REM Safe check, won't kill anything automatically to avoid data loss
tasklist | findstr node.exe
if %errorlevel% neq 0 (
    echo    [OK] No node processes found (or none named node.exe).
) else (
    echo    [WARN] Node processes found. If the server is still running in background,
    echo           you might need to close other terminals or use Task Manager.
)

echo.
echo 2. Cleaning node_modules/.vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo    [OK] Cache cleaned.
) else (
    echo    [INFO] Cache not found, nothing to clean.
)

echo.
echo 3. Starting Dev Server with --force flag...
echo    This will force Vite to re-optimize dependencies.
echo.
echo    If this window closes immediately, please check the output above.
echo ========================================================
echo.

call npm run dev -- --force
pause
