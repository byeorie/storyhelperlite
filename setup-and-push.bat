@echo off
cd /d "C:\Users\byeor\Claude\Projects\이야기 도우미"
echo === setting git identity (global, one time) ===
git config --global user.email "byeorie@gmail.com"
git config --global user.name "byeorie"
echo === untracking node_modules if needed ===
git rm -r --cached node_modules >nul 2>&1
echo === git add ===
git add .
echo add exit code: %errorlevel%
echo === git commit ===
git commit -m "chore: stop tracking node_modules + plan page changes"
echo commit exit code: %errorlevel%
echo === git push ===
git push
echo push exit code: %errorlevel%
pause
