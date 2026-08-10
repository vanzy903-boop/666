# PowerShell 自动 Commit 与 Push 脚本

Set-Location $PSScriptRoot

# 检查是否有未提交的文件变更
$status = git status --porcelain
if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "检测到变更，正在准备提交 ($timestamp)..." -ForegroundColor Cyan
    
    git add .
    git commit -m "Auto commit: $timestamp"
    
    # 尝试推送代码
    Write-Host "正在推送到 GitHub..." -ForegroundColor Cyan
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 成功自动推送至 GitHub！" -ForegroundColor Green
    } else {
        Write-Host "❌ 推送失败，请检查网络或 GitHub 仓库地址设置。" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️ 当前没有修改，无需提交。" -ForegroundColor Yellow
}
