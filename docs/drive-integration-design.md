# Google Drive 연동 설계 (drive.file 스코프)

## 목표
학생이 사이트에서 Google 로그인 후 글을 쓰면, 본인 Google Drive에 자동 저장.

## 흐름
1. 학생이 "Google로 로그인" 클릭 → Google OAuth 동의 화면(위 oauth-consent-screen-draft.md 참고) → `drive.file` 권한 동의
2. 로그인 성공 시 access token(+ refresh token) 발급받아 서버(Cloudflare Workers)에서 관리
3. 학생이 로그라인/설정 작성 → "저장" 클릭
4. Workers가 Google Drive API `files.create` 호출 → 학생 Drive에 새 문서(Google Docs 또는 .md/.txt) 생성
   - 이후 수정 시에는 같은 파일 ID로 `files.update` 호출 (덮어쓰기 아님, 버전 갱신)
5. `drive.file` 스코프이므로 이 앱이 만든 파일에만 접근 가능 — 학생의 기존 Drive 파일은 전혀 건드리지 않음

## 저장 위치
- 기본: 학생 Drive의 "내 드라이브" 최상위에 저장, 또는 앱 전용 폴더(`이야기도우미` 폴더) 자동 생성 후 그 안에 저장 (권장)

## 기술 구성 (Cloudflare 기준)
- 인증: Cloudflare Workers + Google OAuth2 (Authorization Code flow)
- 토큰 저장: Cloudflare D1 (사용자별 refresh token 암호화 저장)
- 파일 저장: Google Drive API v3 (`drive.file` 스코프)
- DB(작품DB 등 서비스 데이터): **Cloudflare D1로 결정** — 속도 우선

## 주의사항
- refresh token은 반드시 암호화 저장 (D1에 평문 저장 금지)
- `drive.file` 스코프는 "앱이 만들거나 사용자가 앱으로 연 파일"에만 접근 가능하므로 사전 동의 절차나 폴더 선택 UI가 필요 없어 심사가 간단함
- 토큰 만료 시 refresh token으로 자동 갱신 로직 필요

## 다음 단계 (도메인 확정 후)
- 실제 Workers 코드 구현 (OAuth 콜백 라우트, Drive API 호출 함수)
- D1 스키마 설계: `users`, `documents`, (추후) `db_keywords`, `db_works` 테이블
