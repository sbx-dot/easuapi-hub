@echo off
setlocal

cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
set DEPLOY_EXIT_CODE=%ERRORLEVEL%

echo.
if not "%DEPLOY_EXIT_CODE%"=="0" (
  echo Deploy failed with exit code %DEPLOY_EXIT_CODE%.
) else (
  echo Deploy completed.
)
echo.
pause
exit /b %DEPLOY_EXIT_CODE%
