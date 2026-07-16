# StoryHelperLite 프로젝트 지침

## GitHub 자동 푸시 방법

샌드박스에서 직접 git push가 불가 (GitHub API 차단).
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
