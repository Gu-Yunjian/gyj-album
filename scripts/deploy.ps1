#!/usr/bin/env pwsh
# 一键部署到 Cloudflare Pages (PowerShell 版本)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "    🚀 一键部署到 Cloudflare Pages" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 切换到项目根目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Resolve-Path "$scriptDir\.."
Set-Location $projectDir

# 1. 检查是否有更改
$gitStatus = git status --short

if ([string]::IsNullOrWhiteSpace($gitStatus)) {
  Write-Host "✅ 没有需要提交的更改" -ForegroundColor Green
} else {
  Write-Host "📋 待提交的文件:" -ForegroundColor Yellow
  Write-Host $gitStatus
  Write-Host ""
  
  # 2. 询问提交信息
  $commitMsg = Read-Host "📝 请输入提交信息 (直接回车使用默认)"
  if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
  }
  
  # 3. Git 操作
  Write-Host ""
  Write-Host "🔄 正在执行 Git 操作..." -ForegroundColor Yellow
  git add -A
  git commit -m "$commitMsg"
  
  Write-Host ""
  Write-Host "📤 推送到远程仓库..." -ForegroundColor Yellow
  git push origin main
  
  Write-Host ""
  Write-Host "✅ Git 提交完成！" -ForegroundColor Green
}

# 4. 检查是否需要处理图片
Write-Host ""
Write-Host "🔍 检查是否需要处理图片..." -ForegroundColor Yellow

$originalsDir = "originals"
$hasOriginals = $false

if (Test-Path $originalsDir) {
  $files = Get-ChildItem $originalsDir -File -ErrorAction SilentlyContinue
  $hasOriginals = $files.Count -gt 0
}

if ($hasOriginals) {
  Write-Host "📸 发现原图，开始处理..." -ForegroundColor Yellow
  python scripts/process_photos.py
  
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 图片处理失败" -ForegroundColor Red
    exit 1
  }
  
  Write-Host ""
  Write-Host "📝 提交处理后的图片..." -ForegroundColor Yellow
  git add public/photos.json public/photos/ public/thumbnails/
  git commit -m "chore: process photos" --allow-empty
  git push origin main
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "    ✅ 部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "    Cloudflare Pages 将自动构建部署" -ForegroundColor White
Write-Host "    请访问 Cloudflare 控制台查看状态" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

Read-Host "按回车键继续..."
