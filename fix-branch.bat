@echo off
cd /d "C:\Users\byeor\Claude\Projects\이야기 도우미"
git branch -m master main
git branch --set-upstream-to=origin/main main
git branch -vv
echo Done. If you see "main ... [origin/main]" above, it worked.
pause
