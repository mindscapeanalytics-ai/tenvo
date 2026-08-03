param(
    [string]$commitMessage = "Deploy and cleanup unnecessary files"
)

Write-Host "Starting deployment process..." -ForegroundColor Cyan

# List of irrelevant/temporary files to remove
$filesToRemove = @(
    "PRODUCTS_FIX_README.md",
    "README_ORDER_FIX.md",
    "README.md",
    "redeam.md",
    "apply-inventory-constraints.mjs",
    "apply-inventory-constraints.sql",
    "apply-products-fix.mjs",
    "apply-products-fix.ps1",
    "query-indexes.js",
    "query-pg.js",
    "temp_verify_indexes.sql",
    "temp_verify.sql",
    "test-conflict.js",
    "test-conflict2.js",
    "test-products-constraint.sql"
)

# 1. Remove files from local filesystem and Git tracking
Write-Host "Cleaning up irrelevant files..." -ForegroundColor Yellow
foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force -ErrorAction SilentlyContinue
        Write-Host "Deleted local file: $file" -ForegroundColor Gray
    }
    # Attempt to remove from git if it was tracked
    git rm -f --ignore-unmatch $file 2>$null
}

# 2. Stage all remaining files
Write-Host "Staging files for commit..." -ForegroundColor Yellow
git add .

# 3. Check if there are changes to commit
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit. Working tree is clean." -ForegroundColor Green
    # We can still attempt push in case there are unpushed commits
} else {
    # 4. Commit changes
    Write-Host "Committing changes with message: '$commitMessage'" -ForegroundColor Yellow
    git commit -m $commitMessage
}

# 5. Push to remote
Write-Host "Pushing to remote repository..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Deployment failed during push. Please check your git configuration." -ForegroundColor Red
}
