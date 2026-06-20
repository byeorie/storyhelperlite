# 스토리헬퍼 Lite

웹툰 전공생을 위한 스토리 제작 도구. 캐릭터(MBTI·에니어그램)·세계관·배경·사건 설정과
**영웅의 여정 12단계** 플롯 구성, AI(Gemini) 조언·유사작품 찾기, PDF 내보내기를 지원합니다.

- 서버가 필요 없는 **정적 사이트** (GitHub Pages에서 그대로 동작)
- 데이터는 **각자 브라우저(localStorage)에만 저장** — 정기적으로 JSON 백업 권장
- AI 기능은 교수님이 1회 설정한 무료 Gemini 프록시를 공용으로 사용 (학생 설정 불필요)

## 파일 구성
| 파일 | 역할 |
|---|---|
| `index.html` | 화면 구조 |
| `style.css` | 디자인 / 인쇄 스타일 |
| `data.js` | MBTI·에니어그램·영웅의 여정 12단계 데이터 |
| `app.js` | 핵심 로직(저장·렌더·내보내기) |
| `gemini.js` | AI 호출 (PROXY_URL 교체 필요) |
| `cloudflare-worker.js` | AI 중계 서버 코드 |
| `SETUP-GEMINI.md` | AI 연결 가이드(교수님용) |

## GitHub Pages 배포 (처음 한 번)
1. GitHub에서 새 저장소(repository) 생성
2. 이 폴더의 모든 파일을 업로드(또는 push)
3. 저장소 **Settings → Pages → Source**를 `main` 브랜치 / `/ (root)`로 설정 → Save
4. 잠시 후 `https://<아이디>.github.io/<저장소이름>/` 로 접속

## AI 기능 켜기
`SETUP-GEMINI.md`를 따라 무료 Gemini 프록시를 설정한 뒤 `gemini.js`의 `PROXY_URL`만 교체하면 됩니다.
설정 전에도 AI를 제외한 모든 기능(설정·플롯·PDF·백업)은 정상 작동합니다.
