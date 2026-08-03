# ============================================
# Windows Environment Setup for Tenvo Migration
# Run this in PowerShell as Administrator
# ============================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TENVO MIGRATION SETUP - Windows" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "⚠️  Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Some operations may fail. Consider running as Admin." -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Check for PostgreSQL
Write-Host "[Step 1/4] Checking PostgreSQL..." -ForegroundColor Yellow

$pgPaths = @(
    "C:\Program Files\PostgreSQL\*\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe",
    "$env:LOCALAPPDATA\PostgreSQL\*\bin\psql.exe"
)

$psqlFound = $false
foreach ($path in $pgPaths) {
    $matches = Get-ChildItem -Path $path -ErrorAction SilentlyContinue
    if ($matches) {
        $psqlPath = $matches[0].FullName
        Write-Host "✅ PostgreSQL found: $psqlPath" -ForegroundColor Green
        $psqlFound = $true
        
        # Add to PATH if not already there
        $pgBin = Split-Path $psqlPath -Parent
        if ($env:PATH -notlike "*$pgBin*") {
            Write-Host "   Adding PostgreSQL to PATH..." -ForegroundColor Cyan
            [Environment]::SetEnvironmentVariable("Path", $env:PATH + ";$pgBin", "User")
            $env:PATH += ";$pgBin"
        }
        break
    }
}

if (-not $psqlFound) {
    Write-Host "❌ PostgreSQL not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options to fix:" -ForegroundColor Yellow
    Write-Host "1. Install PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Use the Node.js migration method (no psql needed)" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Do you want to continue with Node.js method? (y/n)"
    if ($choice -ne 'y') {
        Write-Host "Please install PostgreSQL first, then run this script again." -ForegroundColor Yellow
        exit 1
    }
}

# Step 2: Setup DATABASE_URL
Write-Host ""
Write-Host "[Step 2/4] Setting up DATABASE_URL..." -ForegroundColor Yellow

if ($env:DATABASE_URL) {
    Write-Host "✅ DATABASE_URL already set" -ForegroundColor Green
    Write-Host "   Current value: $($env:DATABASE_URL.Substring(0, [Math]::Min(30, $env:DATABASE_URL.Length)))..." -ForegroundColor Gray
} else {
    Write-Host "❌ DATABASE_URL not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please provide your database connection string:" -ForegroundColor Cyan
    Write-Host "Example: postgresql://user:password@host:5432/database" -ForegroundColor Gray
    Write-Host ""
    
    $dbUrl = Read-Host "Enter DATABASE_URL"
    
    if ($dbUrl -and $dbUrl.StartsWith("postgresql://")) {
        # Set for current session
        $env:DATABASE_URL = $dbUrl
        
        # Set permanently for user
        [Environment]::SetEnvironmentVariable("DATABASE_URL", $dbUrl, "User")
        
        Write-Host "✅ DATABASE_URL configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Invalid DATABASE_URL format" -ForegroundColor Red
        Write-Host "Expected format: postgresql://user:password@host:5432/database" -ForegroundColor Yellow
        exit 1
    }
}

# Step 3: Verify migration files
Write-Host ""
Write-Host "[Step 3/4] Verifying migration files..." -ForegroundColor Yellow

$migrationFile = "scripts\migrations\002_add_admin_features.sql"
if (Test-Path $migrationFile) {
    $size = (Get-ChildItem $migrationFile).Length
    Write-Host "✅ Migration file found: $migrationFile ($size bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

# Step 4: Test database connection
Write-Host ""
Write-Host "[Step 4/4] Testing database connection..." -ForegroundColor Yellow

try {
    # Use Node.js to test connection since psql might not be available
    $testScript = @"
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
pool.query('SELECT version()', (err, res) => {
    if (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    } else {
        console.log('Connected to:', res.rows[0].version.split(' ')[0] + ' ' + res.rows[0].version.split(' ')[1]);
        process.exit(0);
    }
});
"@
    
    $testScript | node - 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful" -ForegroundColor Green
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
    Write-Host "   Please check your DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE ✅" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run migration: node scripts\execute-migration.js" -ForegroundColor White
Write-Host "2. Or use batch: scripts\migrate-windows.bat" -ForegroundColor White
Write-Host ""
Write-Host "If you open a NEW PowerShell window, run:" -ForegroundColor Cyan
Write-Host "   set DATABASE_URL=your_connection_string" -ForegroundColor Gray
Write-Host ""
