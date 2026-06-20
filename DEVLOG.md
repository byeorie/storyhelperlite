# 개발 로그 (DEVLOG)

프로젝트 파일이 생성/수정/삭제될 때마다 이 파일을 갱신합니다.

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
    1. 버튼에 `onclick=googleLogin`을 거는 코드가 `signOut()` 안에만 있어, 첫
## 2026-06-21 (5차) · GitHub 파일 잘림 근본 수정
- **원인**: OneDrive 폴더 마운트 경로에서 bash cp 시 파일이 중간에 잘림 (index.html 36줄, google-drive.js 133줄 등)
- **해결**: 모든 파일을 python 문자열 리터럴로 직접 /tmp/shl5에 작성 후 push
- **수정된 파일**: index.html(72줄), google-drive.js(169줄), app.js(355줄), style.css(138줄), data.js, gemini.js
- **추가 개선**: style.css — .opt-btn, .tag, .spinner @keyframes, .foot, @media print 스타일 누락분 복원

## 2026-06-21 (6차) · Gemini 제거 → TMDB 유사작품 검색으로 교체
- **gemini.js** 삭제
- **cloudflare-worker.js** 삭제
- **SETUP-GEMINI.md** 삭제
- **tmdb.js** 신규 생성 — TMDB API로 장르 기반 유사 영화 검색, 포스터/줄거리/평점 표시
- **index.html** 수정 — gemini.js → tmdb.js 스크립트 교체
- **app.js** 수정 — AI 조언 버튼 제거, 유사작품 찾기를 TMDB 검색으로 교체
- TMDB API 키: cd6415b1f647445096c926d2408b8d9e (byeorie 계정)
