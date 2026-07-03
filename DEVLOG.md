# 개발 로그 (DEVLOG)

프로젝트 파일이 생성/수정/삭제될 때마다 이 파일을 갱신합니다.

## 2026-07-03 (7차) · Lite 브랜딩 제거 / 상단바 정리 / 로그인 오류 수정
- **index.html** 수정 — 타이틀, 헤더, 로그인 오버레이, 푸터에서 "Lite" 표기 전부 제거
- **style.css** 수정 — `.topbar`를 `flex-wrap:nowrap`으로 변경해 상단바가 2줄로 줄바꿈되던 문제 해결(공간 부족 시 가로 스크롤로 대체). 미사용된 `.lite` 스타일 제거
- **google-drive.js** 수정 — 사용자 정보(userinfo) fetch가 실패하거나 이름/이메일이 없을 때 로그인 버튼에 "undefined"와 깨진 아바타 아이콘이 표시되던 문제 수정 (실패 시 이전 상태 유지, 사진 없으면 아이콘 생략)
- **google-drive.js, app.js** 수정 — "모든 버튼이 먹통" 원인 규명: 구글 드라이브에서 불러온 예전 스키마 데이터(`loadFromDrive`)가 `render()`에서 필드 누락으로 예외를 던지면 스크립트가 아니라 함수 내부에서 멈추면서 화면이 빈 채로 남는 문제였음. `app.js`에 `fillProject()` 데이터 보정 함수를 추가해 로컬/드라이브 데이터 모두 누락 필드를 채우도록 하고, `render()`를 try/catch로 감싸 오류 시 "이 작품 초기화" 버튼이 있는 복구 화면을 보여주도록 함
- 참고: 최초에는 배포 파일이 또 손상된 줄 알았으나(과거 5차와 동일 증상), 실제로는 파일 바이트가 정상이었고 사용자 브라우저의 구 스키마 저장 데이터가 원인이었음

## 2026-07-03 (6차) · OAuth 클라이언트 ID 교체
- **google-drive.js** 수정 — GOOGLE_CLIENT_ID를 `612980273037-...` → `543063091602-injv9mjpavv1gobhrgmgbn7fr2u8jhge.apps.googleusercontent.com`으로 교체. 계정을 바꿔 새로 만든 OAuth 클라이언트이며, `https://storyhelperlite.pages.dev`를 승인된 JavaScript 원본으로 등록해 기존 origin_mismatch(400) 오류 해결

## 2026-07-03 (5차) · 구글 로그인 버튼 무반응 — 저장소 파일 손상 복구
- **google-drive.js** 수정 — GitHub 저장소에 실제 배포된 파일이 158번째 줄부터 중간에 잘려 있어(문자 인코딩 깨짐, 유효하지 않은 토큰) 브라우저가 SyntaxError로 스크립트 전체 실행을 중단시키고 있었음. `bindLoginButton()`이 실행되지 못해 로그인 버튼에 클릭 핸들러(`onclick=googleLogin`)가 전혀 연결되지 않았던 것이 "버튼이 안눌림" 현상의 직접 원인. 전체 파일(198줄)을 정상 버전으로 다시 작성
- **app.js, README.md** 수정 — 같은 저장소에서 파일 끝부분이 눈에 보이지 않는 null 바이트로 손상되어 있던 것 추가 발견, 정상 내용으로 복구
- 원인 추정: 과거 세션에서 `cp` 명령으로 배포 파일을 복사하다 샌드박스 마운트 제한으로 파일이 중간에 잘린 것으로 보임(CLAUDE.md에 이미 경고되어 있던 문제) — 이후로는 반드시 python으로 파일 내용을 직접 작성하는 절차를 지킬 것

## 2026-07-03 (4차) · 로그인 오버레이 CSS 버그 수정
- **style.css** 수정 — `.spinner` 규칙이 중간에 잘려 닫는 중괄호가 없던 탓에, 그 뒤에 있던 `.login-overlay` 등 로그인 오버레이 CSS 전체가 무효화되어 있었음. 실제 배포 사이트에서 로그인 없이 앱 화면이 그대로 노출되는 원인이었음. `.spinner` 규칙을 정상적으로 닫고 `@keyframes spin` 추가하여 해결

## 2026-07-03 (3차) · Gemini AI 기능 완전 제거
- **gemini.js, cloudflare-worker.js, SETUP-GEMINI.md** 삭제 — 더 이상 Gemini 사용하지 않기로 결정
- **app.js** 수정 — 아이디어 탭 "유사 작품 분석" 버튼/결과창, 플롯 탭 "AI 조언" 버튼/결과창 및 관련 함수(`formatSimilarResult`, `doAdvice`) 제거. 아이디어 탭 안내 문구에서 Gemini 언급 삭제
- **README.md** 재작성 — Gemini 관련 설명 제거, Cloudflare Pages 배포 방식 및 Google Drive 저장 기능 반영
- 참고: index.html은 애초에 gemini.js를 로드하고 있지 않아 해당 버튼들은 이미 동작하지 않는 상태였음(사용 중이던 기능 아님)

## 2026-07-03 (2차) · drive.file 스코프 전환 + 개인정보처리방침 페이지 실제 적용
- **google-drive.js** 수정 — `drive.appdata` → `drive.file` 스코프로 변경. 숨김 appDataFolder 대신 "이야기도우미"라는 이름의 보이는 폴더를 자동 생성/조회 후 그 안에 데이터 파일 저장. `findOrCreateDriveFolder()` 신규 추가, `findDriveFile()`/`saveToDrive()`가 폴더 기준으로 동작하도록 수정
- **privacy.html** 신규 생성 — 개인정보처리방침 실제 페이지 (도메인 연결 후 OAuth 동의화면에 바로 등록 가능한 형태)
- **index.html** 수정 — 하단 푸터에 개인정보처리방침 링크 추가
- 참고: 운영주체·연락처는 아직 개인(황기연) 기준, 확정되면 privacy.html 갱신 필요

## 2026-07-03 · OAuth 심사 준비 문서 3종 + DB 방식 결정
- **docs/privacy-policy-draft.md** 신규 생성 — 개인정보처리방침 초안 (운영주체·도메인 미정, placeholder)
- **docs/oauth-consent-screen-draft.md** 신규 생성 — Google OAuth 동의화면 입력 항목 초안, 테스트 사용자 모드로 지금 바로 테스트 가능
- **docs/drive-integration-design.md** 신규 생성 — drive.file 스코프 기반 저장 흐름 설계 (기존 appDataFolder 방식에서 전환 예정)
- **결정**: 작품DB는 Cloudflare D1로 진행 (구글시트보다 속도 빠름)
- 미확정: 도메인명, 운영주체 명의(개인 vs 협회) — 추후 확정 필요
- 참고: Google Cloud 프로젝트는 studio.inknpen@gmail.com 계정으로 생성 예정 (교수님 직접 로그인 필요, 브라우저 제어로 함께 진행 가능)

## 2026-06-21 (4차) · 로그인 버튼 먹통 근본 수정 + 로그인 화면 디자인
- **g