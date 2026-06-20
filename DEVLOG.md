# 개발 로그 (DEVLOG)

프로젝트 파일이 생성/수정/삭제될 때마다 이 파일을 갱신합니다.

## 2026-06-21 · 구글 로그인 버튼 무반응 버그 수정
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
  - 로그인 시 자동으로 드라이브