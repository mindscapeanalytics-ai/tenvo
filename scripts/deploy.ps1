param (
    [string]$CommitMessage = "Deployment updates and cleanup"
)

Write-Host "Starting deployment cleanup..." -ForegroundColor Cyan

# 1. Remove unnecessary generated root markdown reports
Write-Host "Cleaning up root markdown reports..." -ForegroundColor Yellow
$rootMDFiles = Get-ChildItem -Path ".\*.md" -File | Where-Object { $_.Name -ne "AGENTS.md" -and $_.Name -ne "README.md" }
foreach ($file in $rootMDFiles) {
    Remove-Item -Path $file.FullName -Force
    Write-Host "Removed $($file.Name)" -ForegroundColor Gray
}

# 2. Ensure git index matches current state (adds deletions)
Write-Host "Staging changes to git..." -ForegroundColor Yellow
git add -A

# 3. Check if there are changes to commit
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit. Working tree is clean." -ForegroundColor Green
    exit
}

# 4. Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m $CommitMessage

# 5. Push to remote
Write-Host "Pushing to remote..." -ForegroundColor Yellow
git push origin main

Write-Host "Deployment push complete!" -ForegroundColor Green
