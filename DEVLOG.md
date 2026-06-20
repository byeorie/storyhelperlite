# 개발 로그 (DEVLOG)

프로젝트 파일이 생성/수정/삭제될 때마다 이 파일을 갱신합니다.

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
- **clou