# 개발 로그 (DEVLOG)

프로젝트 파일이 생성/수정/삭제될 때마다 이 파일을 갱신합니다.

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
