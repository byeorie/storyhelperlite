@echo off
cd /d "%~dp0"
echo === git push ===
git push
echo push exit code: %errorlevel%
pause
