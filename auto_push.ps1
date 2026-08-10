# PowerShell Auto Commit & Push Script

Set-Location $PSScriptRoot

# Check git status for modified/untracked files
$status = git status --porcelain
if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "Changes detected. Committing ($timestamp)..." -ForegroundColor Cyan
    
    git add .
    git commit -m "Auto commit: $timestamp"
}

Write-Host "Pushing to GitHub (origin main)..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Push failed. Please verify network or GitHub authorization." -ForegroundColor Red
}
