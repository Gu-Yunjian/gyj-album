@echo off
chcp 65001 >nul
echo ==========================================
echo    🚀 一键部署到 Cloudflare Pages
echo ==========================================
echo.

REM 检查是否在正确的目录
cd /d "%~dp0\.."

REM 1. 检查是否有更改
git status --short > .git-status.tmp
set /p GIT_STATUS=<.git-status.tmp
del .git-status.tmp

if "%GIT_STATUS%"=="" (
  echo ✅ 没有需要提交的更改
  goto :check_processing
)

echo 📋 待提交的文件:
git status --short
echo.

REM 2. 询问提交信息
set /p COMMIT_MSG="📝 请输入提交信息 (直接回车使用默认): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG="update: %date% %time%"

REM 3. Git 操作
echo.
echo 🔄 正在执行 Git 操作...
git add -A
git commit -m "%COMMIT_MSG%"

echo.
echo 📤 推送到远程仓库...
git push origin main

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ❌ 推送失败，请检查网络连接
  pause
  exit /b 1
)

echo.
echo ✅ Git 提交完成！
goto :check_processing

:check_processing

REM 4. 检查是否需要处理图片
echo.
echo 🔍 检查是否需要处理图片...

REM 检查 originals 目录是否有新文件
if exist "originals" (
  for %%F in (originals\*) do (
    set NEED_PROCESS=1
    goto :do_process
  )
)

set NEED_PROCESS=0

:do_process
if "%NEED_PROCESS%"=="1" (
  echo 📸 发现原图，开始处理...
  python scripts/process_photos.py
  
  if %ERRORLEVEL% NEQ 0 (
    echo ❌ 图片处理失败
    pause
    exit /b 1
  )
  
  echo.
  echo 📝 提交处理后的图片...
  git add public/photos.json public/photos/ public/thumbnails/
  git commit -m "chore: process photos"
  git push origin main
)

echo.
echo ==========================================
echo    ✅ 部署完成！
echo.
echo    Cloudflare Pages 将自动构建部署
echo    请访问 Cloudflare 控制台查看状态
echo ==========================================
echo.
pause
