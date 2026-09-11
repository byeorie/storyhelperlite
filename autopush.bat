@echo off
cd /d "C:\Users\byeor\Claude\Projects\이야기 도우미"
git add .
git diff --cached --quiet || git commit -m "auto: %date% %time%"

rem 2026-09-08 수정: 예전에는 "새로 커밋할 내용이 없으면" 여기서 그냥 끝냈다.
rem 그래서 지난번처럼 커밋은 됐는데 push만 실패한 경우, 다시 실행해도 밀린 커밋이 영영 안 올라갔다.
rem 이제는 커밋할 게 없어도 항상 push를 시도하고, 실패하면 창을 닫지 않고 이유를 보여준다.
git push
if errorlevel 1 (
  echo.
  echo ****************************************************
  echo  업로드[push]에 실패했습니다. 위 메시지를 확인하세요.
  echo  인터넷 연결 또는 GitHub 로그인 문제일 수 있습니다.
  echo ****************************************************
  pause
  exit /b 1
)
echo 업로드 완료.
