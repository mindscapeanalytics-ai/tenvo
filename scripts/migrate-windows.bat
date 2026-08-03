@echo off
REM ============================================
REM Database Migration Script for Windows
REM ============================================

echo.
echo ============================================
echo TENVO DATABASE MIGRATION - Admin Features
echo ============================================
echo.

REM Check if psql is available
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL client (psql) not found in PATH
    echo Please install PostgreSQL or add psql to your PATH
    exit /b 1
)

REM Check DATABASE_URL
if "%DATABASE_URL%"=="" (
    echo ERROR: DATABASE_URL environment variable not set
    echo Please set DATABASE_URL before running this script
    echo Example: set DATABASE_URL=postgresql://user:pass@host/dbname
    exit /b 1
)

echo [1/5] Creating backup...
set TIMESTAMP=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=backups\pre_migration_%TIMESTAMP%.sql

if not exist backups mkdir backups

pgdump "%DATABASE_URL%" > "%BACKUP_FILE%" 2>nul
if %errorlevel% equ 0 (
    echo ✓ Backup created: %BACKUP_FILE%
) else (
    echo ⚠ Backup failed (continuing anyway)
)

echo.
echo [2/5] Testing database connection...
psql "%DATABASE_URL%" -c "SELECT version();" >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Connection failed
    exit /b 1
)
echo ✓ Connection successful

echo.
echo [3/5] Executing migration...
psql "%DATABASE_URL%" -f "scripts\migrations\002_add_admin_features.sql"
if %errorlevel% neq 0 (
    echo ✗ Migration failed
    echo Check the error messages above
    exit /b 1
)
echo ✓ Migration executed

echo.
echo [4/5] Verifying migration...
psql "%DATABASE_URL%" -f "scripts\verify-database.sql"

echo.
echo [5/5] Migration complete!
echo.
echo ============================================
echo ✓ MIGRATION SUCCESSFUL
echo ============================================
echo.
echo Backup: %BACKUP_FILE%
echo.
echo Next steps:
echo   1. Run: bun run build
echo   2. Deploy to production
echo   3. Test admin panel
echo.
echo ============================================

pause
