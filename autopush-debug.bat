@echo off
cd /d "C:\Users\byeor\Claude\Projects\이야기 도우미"
echo === git add ===
git add .
echo === git diff check ===
git diff --cached --quiet
echo diff exit code: %errorlevel%
if %errorlevel%==0 (
  echo No changes to commit.
  goto end
)
echo === git commit ===
git commit -m "auto: %date% %time%"
echo commit exit code: %errorlevel%
echo === git push ===
git push
echo push exit code: %errorlevel%
:end
pause
