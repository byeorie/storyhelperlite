# StoryHelperLite 프로젝트 지침

## GitHub 자동 푸시 방법

샌드박스에서 직접 git push가 불가 (OneDrive 폴더 잠금 + GitHub API 차단).
아래 절차로 매번 푸시할 것:

1. `/tmp/`에 clone
   ```bash
   git clone https://ghp_TOKEN@github.com/byeorie/storyhelperlite.git /tmp/storyhelperlite
   ```

2. 수정된 파일을 Read 툴로 읽어 → `/tmp/storyhelperlite/`에 직접 쓰기 (heredoc 또는 cat)
   - OneDrive 폴더 파일을 bash cp로 복사하면 잘릴 수 있으므로, 짧은 파일은 heredoc으로 직접 작성
   - 긴 파일(app.js 등)은 cp로 시도 후 wc -l로 줄 수 확인

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
- PAT: 필요 시 사용자에게 요청 (보안상 여기 저장 안 함)

## 파일 수정 규칙
- 파일 생성/수정/삭제 시 DEVLOG.md 업데이트
- push 후 DEVLOG도 함께 포함
