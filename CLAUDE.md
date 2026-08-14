# StoryHelperLite 프로젝트 지침

## 로컬 폴더 (2026-08-14부터 git 연결됨)
"C:\Users\byeor\Claude\Projects\이야기 도우미" 폴더가 실제 GitHub 저장소와 git으로 연결되어 있다
(origin에 PAT 포함, `git push`/`git pull` 즉시 가능). 예전에 쓰던 "StoryHelperLite" 폴더는 커밋 1개짜리
방치된 옛날 클론(Gemini/Google Drive 연동 시절)이라 더 이상 사용하지 않는다 — 헷갈리지 말 것.
- 사용자가 직접: `autopush.bat` 더블클릭(add+commit+push), `pull.bat` 더블클릭(fetch+hard reset)
- Claude(Cowork 세션)가: 이 폴더는 `mcp__remote-devices__*` 디바이스 브리지로 접근. 클라우드 샌드박스의
  git 프록시가 "session's authorized repository set" 제한으로 push를 차단하는 경우가 있으므로(2026-08
  세션에서 확인), 그럴 땐 아래 클론 방식으로 작업한 뒤 변경된 파일만 SendUserFile + device_commit_files로
  이 로컬 폴더에 반영하고, 사용자에게 `autopush.bat` 실행을 요청할 것 (사용자 PC는 이 제한을 받지 않음)
- device_bash는 기존 파일을 삭제/덮어쓰기(unlink)할 수 없음 — unzip -o나 cp -f로 기존 파일을 덮으려 하면
  "Operation not permitted" 오류. 기존 파일 내용을 바꿔야 하면 반드시 python `open(path,'w'/'wb').write(...)`
  (truncate 방식, unlink 아님)로 쓸 것

## GitHub 자동 푸시 방법 (클라우드 샌드박스에서 직접 push가 막혔을 때의 대안)

샌드박스에서 직접 git push가 막힐 수 있음(위 참고).
아래 절차로 매번 푸시할 것:

1. `/tmp/`에 clone (매 세션마다 새 경로 사용: /tmp/shl2, /tmp/shl3 등 — 이전 세션 잔여물 권한 충돌 방지)
   ```bash
   git clone https://[PAT]@github.com/byeorie/storyhelperlite.git /tmp/shl2
   ```

2. **반드시 python으로 파일 내용을 직접 작성** — bash `cp`는 샌드박스 마운트 제한으로 파일이 중간에 잘림
   ```python
   python3 << 'PYEOF'
   content = """..."""  # Read 툴로 읽은 완전한 내용을 python 문자열로
   open('/tmp/shlN/파일명', 'w', encoding='utf-8').write(content)
   PYEOF
   ```
   - cp 절대 사용 금지. heredoc(cat << EOF)도 긴 파일에서 잘릴 수 있음
   - 작성 후 반드시 줄 수 확인: `python3 -c "print(open('/tmp/shlN/파일명').read().count('\n')+1)"`

3. commit & push
   ```bash
   cd /tmp/storyhelperlite
   git config user.email "byeorie@gmail.com"
   git config user.name "byeorie"
   git add .
   git commit -m "커밋 메시지"
   git push
   ```

## 프로젝트 정보
- GitHub: https://github.com/byeorie/storyhelperlite
- 배포: Cloudflare Pages (main 브랜치 push 시 자동 재배포)
- PAT: 프로젝트 폴더의 `.github-pat` 파일에 저장됨 (git 추적 대상 아님, `.gitignore`에 등록됨). 푸시 작업 시작 전 이 파일을 Read 툴로 읽어서 사용할 것 (GitHub push protection으로 CLAUDE.md에 직접 저장 불가하며, "Claude 메모리"는 세션 간 보장되지 않아 이 방식으로 변경함 — 2026-07-16)

## 파일 수정 규칙
- 파일 생성/수정/삭제 시 DEVLOG.md 업데이트
- push 후 DEVLOG도 함께 포함
