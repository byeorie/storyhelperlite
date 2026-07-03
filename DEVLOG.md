# 개발 로그 (DEVLOG)

프로젝트 파일이 생성/수정/삭제될 때마다 이 파일을 갱신합니다.

## 2026-07-03 (12차) · 기존 아이디어 카드의 "+ 태그"도 기존 태그 선택 가능하도록 개선
- **app.js** 수정 — 카드의 "+ 태그" 클릭 시 `prompt()` 대신, 카드 하단에 이 아이디어에 없는 기존 태그들이 클릭 가능한 칩으로 나열되고 새 태그 입력창도 함께 표시되도록 변경(`ideaTagPickerFor` 상태로 카드별 열림/닫힘 관리)

## 2026-07-03 (11차) · 아이디어 입력창 개선 — 텍스트/태그 입력 분리 + 기존 태그 선택
- **app.js** 수정 — 입력창의 예시 문구(`#오늘점심 #학식` 등) 제거, 텍스트 입력창은 순수 아이디어 문장만 입력. 태그는 별도 입력창(Enter로 추가)에서 작성하고, 이미 만들어둔 태그가 있으면 입력창 아래에 목록으로 표시되어 클릭만으로 선택 가능. 선택된 태그는 칩으로 보이며 Enter로 아이디어 등록 시 함께 저장, 등록 후 초기화

## 2026-07-03 (10차) · 아이디어 탭을 "아이디어 블록 모음"으로 개편
- **app.js** 수정 — 기존 폼 형태(주인공 유형/MBTI/장르/엔딩/로그라인 선택)의 "아이디어 탐색" 탭을 걷어내고, 짧은 아이디어와 태그를 자유롭게 모으는 카드형 UI로 교체. 입력창에 `#태그` 형식으로 적으면 자동으로 태그 분리, 카드 클릭 시 텍스트 바로 수정, 태그별 필터 바(전체/개별 태그 토글) 추가. 데이터는 `P.ideaBlocks` 배열(`{id, text, tags}`)로 저장, `blankProject`/`fillProject`에 필드 추가해 기존 저장 데이터도 안전하게 마이그레이션
- **style.css** 수정 — `.idea-block`, `.idea-tag`, `.idea-filter-bar` 등 새 스타일 추가
- 참고: 8차 문제와 동일한 마운트 캐시 이슈가 재발해 `node --check`가 계속 실패했으나, Read 툴로 확인한 실제 파일은 정상이었음. `/tmp`에 새로 clone한 뒤 Read 툴 내용을 python으로 그대로 옮겨 재검증 후 push

## 2026-07-03 (9차) · 로그인 프로필 아바타 + 설정/로그아웃 드롭다운 메뉴
- **google-drive.js** 수정 — `DRIVE_SCOPE`에 `userinfo.profile`, `userinfo.email` 스코프 추가. 기존에는 `drive.file` 스코프만 요청해서 `/oauth2/v3/userinfo` 호출이 403으로 항상 실패해 로그인 후에도 버튼이 "Google로 로그인" 텍스트 그대로 남아있던 문제였음(8차의 undefined 문제와 같은 원인)
- **index.html, style.css, google-drive.js** 수정 — 로그인 시 상단 버튼이 원형 프로필 사진(없으면 이니셜 아바타)으로 바뀌고, 클릭하면 이메일 표시 + "설정"/"로그아웃" 드롭다운 메뉴가 뜨도록 구현. 바깥 클릭 시 메뉴 자동 닫힘. "설정"은 아직 기능 없어 안내 alert만 표시

## 2026-07-03 (8차) · 마운트 캐시로 인한 배포 실패 재발 및 수정
- **원인**: 샌드박스의 프로젝트 폴더 마운트가 Edit 툴로 수정한 최신 내용을 반영하지 못하고 오래된(158줄에서 잘린) `google-drive.js`와 옛 버전 `app.js`, `style.css`를 계속 반환. 이 상태로 GitHub에 push되어 실제 배포 사이트에서 `google-drive.js`가 `SyntaxError: Unexpected end of input`로 전체 중단 → 로그인 버튼 포함 모든 버튼 무반응
- **조치**: 마운트를 거치지 않고 Read 툴로 확인한 정확한 파일 내용을 heredoc으로 직접 작성 후 `node -c`로 문법 검증, 브라우저에서 실제 실행 여부까지 확인한 뒤 재배포
- **교훈**: 이 프로젝트에서는 파일을 push하기 전에 `wc -l`/`node -c`로 예상 줄 수·문법을 반드시 재검증할 것. 마운트 경로 값을 무조건 신뢰하지 말 것

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
- **google-drive.js** 수정 — One Tap `prompt()` 콜백 의존 제거(이게 먹통 진짜 원인). 버튼 클릭 시 바로 `requestAccessToken` OAuth 팝업. 토큰 수령 후 userinfo API로 이름/사진 가져와 UI 갱신. 폴링 조건 oauth2로 변경
- **style.css** 수정 — 로그인 오버레이를 흰 카드 + 남색 버튼 스타일로 재디자인
- **index.html** 수정 — 로그인 박스 상단에 소제목 라벨 추가

## 2026-06-21 (3차) · 접속 시 전체화면 강제 로그인 추가
- **index.html** 수정 — `#loginOverlay` 전체화면 로그인 박스 추가
- **style.css** 수정 — `.login-overlay` 스타일, `body.logged-in` 시 오버레이 숨김
- **google-drive.js** 수정 — 오버레이 버튼 연결, 로그인 성공(onGoogleSignIn/onTokenResponse) 시 `logged-in` 클래스 추가, 로그아웃 시 제거
  - 동작: 접속하면 앱을 가리는 로그인 화면이 먼저 뜨고, 구글 로그인 성공 시에만 사라짐

## 2026-06-21 (2차) · 구글 로그인 버튼 무반응 버그 재수정
- **google-drive.js** 수정 — DOMContentLoaded에서 버튼에 onclick 직접 연결 + GSI 폴링 초기화
  - 진짜 원인 2가지:
    1. 버튼에 `onclick=googleLogin`을 거는 코드가 `signOut()` 안에만 있어, 첫 로드 시 핸들러 미연결 → 클릭해도 무반응
    2. `window.onGoogleLibraryLoad`는 실제 GSI 콜백이 아니어서 `initGoogle()`이 영영 호출 안 됨 → `gTokenClient`도 null
  - 해결: `bindLoginButton()`으로 즉시 onclick 연결, `waitForGsiAndInit()`로 google.accounts 준비될 때까지 폴링 후 초기화

## 2026-06-21 · 구글 로그인 버튼 무반응 버그 수정 (실패한 시도)
- **google-drive.js** 수정 — `window.onGoogleLibraryLoad` 콜백 추가로 `initGoogle()` 자동 호출
  - 원인: GSI 라이브러리 로드 후 `initGoogle()`을 호출하는 코드가 없어 `googleLogin` 함수 미등록 상태였음

## 2026-06-20 · 사이드바 + 아이디어 탭 + 구글 로그인 수정
- **index.html** 수정 — 상단 탭 → 왼쪽 사이드바로 변경, 그룹화(아이디어/캐릭터/배경/사건/플롯)
- **style.css** 수정 — 사이드바 레이아웃, opt-btn(옵션선택) 스타일 추가
- **app.js** 수정 — 아이디어 탭(rIdea) 신설: 주인공 유형/MBTI/장르/엔딩/로그라인 → Gemini 유사작품 분석
- **gemini.js** 수정 — buildIdeaSimilarPrompt 추가 (유사도%, 로그라인 포함 출력)
- **google-drive.js** 수정 — 로그인 버튼 One Tap 차단 시 OAuth 팝업 fallback 처리

## 2026-06-20 · 제목 변경
- **index.html** 수정 — 제목/헤더 "스토리헬퍼 Lite" → "글쓰기도우미 Lite"
- **app.js** 수정 — alert 텍스트 동일 변경
- **CLAUDE.md** 수정 — PAT 저장, clone 경로 전략 업데이트

## 2026-06-20 · v0.2 Google 로그인 + 드라이브 저장
- **google-drive.js** 신규 생성 — Google OAuth2 + Drive API(appDataFolder) 연동
  - 로그인 시 자동으로 드라이브에서 데이터 불러오기
  - save() 호출 시 드라이브 자동 동기화 (로컬+클라우드 이중 저장)
  - 로그아웃 시 로컬 저장 모드로 전환
- **index.html** 수정 — Google GSI 스크립트 추가, 헤더에 로그인 버튼/드라이브 상태 표시
- **app.js** 수정 — save()에 saveToDrive() 연동
- **style.css** 수정 — google-auth 버튼 스타일 추가
- OAuth 클라이언트 ID: 612980273037-...googleusercontent.com
- 저장 위치: 사용자 개인 구글 드라이브 appDataFolder (앱 전용 숨김 폴더)

## 2026-06-20 · v0.1 최초 구축
- **index.html** 생성 — 탭 구조(캐릭터/세계관/배경/사건/플롯/AI/내보내기), 프로젝트 선택·생성·삭제 UI
- **style.css** 생성 — 따뜻한 톤 디자인, 인쇄(PDF)용 스타일 포함
- **data.js** 생성 — MBTI 16종, 에니어그램 9종, 영웅의 여정 12단계, 장르 목록
- **app.js** 생성 — 상태관리, localStorage 자동저장, 다중 프로젝트, 7개 탭 렌더링, JSON 백업/복원, PDF 미리보기·인쇄
- **gemini.js** 생성 — Cloudflare Worker 프록시 호출, 12단계 조언/유사작품 프롬프트 빌더
- **cloudflare-worker.js** 생성 — Gemini 중계 서버 코드(API키 서버 보관, CORS 처리)
- **SETUP-GEMINI.md** 생성 — 비개발자용 AI 연결 가이드
- **README.md** 생성 — 배포·사용 안내
- 기능: 캐릭터(MBTI/에니어그램)·세계관·배경·사건 설정 / 영웅의 여정 12단계 플롯 + 로그라인 / 단계별 AI 조언 / 유사작품 찾기 / PDF·JSON 내보내기
- 데이터 저장: 브라우저 localStorage (서버 불필요, GitHub Pages 정적 호스팅 호환)
- **.gitignore** 생성
- 검증: data.js(MBTI16·에니어9·12단계·장르15) 및 gemini 프롬프트 빌더 동작 확인 완료
- 참고: OneDrive 동기화 폴더라 샌드박스에서 git 푸시 불가 → 사용자 PC에서 푸시 필요
