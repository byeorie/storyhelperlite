@echo off
cd /d "C:\Users\byeor\Claude\Projects\StoryHelperLite"
git add .
git diff --cached --quiet && exit /b 0
git commit -m "auto: %date% %time%"
git push
