# 스토리 가이드

웹툰 전공생을 위한 스토리 제작 도구. 캐릭터(MBTI·에니어그램)·세계관·배경·사건 설정과
**영웅의 여정 12단계** 플롯 구성, PDF 내보내기를 지원합니다.

- **자체 회원가입/로그인** (소속학교·이름·아이디·비밀번호·이메일)
- 로그인 시 작성 내용이 **서버(Cloudflare D1)** 와 브라우저(localStorage)에 동시 저장
- 서버에는 최근 3개월간 갱신된 데이터만 보관되며, 이후에는 자동으로 삭제됩니다(로컬 저장본은 유지)
- Cloudflare Pages + Pages Functions로 동작 (별도 서버 임대 불필요)

## 파일 구성
| 파일/폴더 | 역할 |
|---|---|
| `index.html` | 화면 구조 (로그인/회원가입 오버레이 포함) |
| `style.css` | 디자인 / 인쇄 스타일 |
| `data.js` | MBTI·에니어그램·영웅의 여정 12단계 데이터 |
| `app.js` | 핵심 로직(저장·렌더·내보내기) |
| `auth.js` | 회원가입/로그인/로그아웃, 서버 저장·불러오기 연동 |
| `functions/api/` | Cloudflare Pages Functions (백엔드 API) |
| `schema.sql` | D1 데이터베이스 테이블 정의 |
| `privacy.html` | 개인정보처리방침 |

## 백엔드 API (functions/api/)
| 경로 | 메서드 | 설명 |
|---|---|---|
| `/api/signup` | POST | 회원가입 (소속학교/이름/아이디/비밀번호/이메일) |
| `/api/login` | POST | 로그인, 세션 토큰 발급 |
| `/api/logout` | POST | 로그아웃, 세션 토큰 폐기 |
| `/api/data` | GET/POST | 작품 데이터 불러오기/저장 (로그인 필요) |
| `/api/find-account` | POST | 이메일로 계정 확인 안내 |
| `/api/storyboard-image` | GET/POST/DELETE | 콘티제작 탭의 업로드·그리기 이미지 저장/조회/삭제 (POST·DELETE는 로그인 필요, GET은 공개) |

비밀번호는 PBKDF2-SHA256(100,000회)으로 해시되어 저장되며 평문으로 보관되지 않습니다.
`/api/data` 조회 시 3개월 이상 갱신되지 않은 데이터는 자동으로 삭제됩니다.

콘티 이미지는 D1(값 하나 최대 2MB 제한)이 아니라 **Cloudflare R2**(오브젝트 스토리지)에 저장됩니다.
클라이언트에서 업로드/그리기 모두 300KB 이하로 자동 압축한 뒤 R2에 저장하고, 프로젝트 데이터(D1)에는
이미지를 가리키는 key 문자열만 남습니다.

## 배포 (Cloudflare Pages)
GitHub 저장소(main 브랜치)에 push하면 Cloudflare Pages가 자동으로 재배포합니다.

**최초 1회 수동 설정 필요** (Cloudflare 대시보드):
1. Workers & Pages > D1에서 데이터베이스 생성
2. 생성한 DB의 Console 탭에 `schema.sql` 내용을 붙여넣어 실행
3. Pages 프로젝트 > Settings > Functions > D1 database bindings에서
   변수 이름 `DB`로 위 데이터베이스를 연결
4. Workers & Pages > R2에서 버킷 생성 (이름 예: `storyboard-images`, 무료 한도 월 10GB)
5. Pages 프로젝트 > Settings > Functions > R2 bucket bindings에서
   변수 이름 `STORYBOARD_BUCKET`으로 위 버킷을 연결

`schema.sql`에는 관리자 계정(아이디 `profh`, 임시 비밀번호 `1234`)이 함께 생성되니,
최초 접속 후 반드시 비밀번호를 변경하세요.

## 참고
- Google 로그인/Drive 연동은 2026-07-16부로 제거되었습니다(자체 로그인 시스템으로 전환).
- Gemini AI 조언/유사작품 분석 기능은 2026-07-03부로 제거되었습니다(관련 코드·문서 삭제).
- 2026-08-14: 글쓰기 탭 아래 "콘티제작" 탭 추가 (이미지 업로드/직접 그리기, R2 저장). 아래 4~5번 R2 설정을 하지 않으면 이미지 저장이 실패합니다.
