# 개발 로그 (DEVLOG)

프로젝트 파일이 생성/수정/삭제될 때마다 이 파일을 갱신합니다.

## 2026-07-16 (24차) · [플롯 생성] 메뉴 신설 (기존 영웅의 여정 탭 대체) — 1단계
- 전체 워크플로 설계 확정: 아이디어 수집 → 플롯 생성 → 글쓰기로 콘텐츠가 연계되는 구조. 이번 커밋은 그 중 **[플롯 생성]**까지 구현(글쓰기는 다음 단계). 사용자 확인 결정 3건: ①기존 영웅의여정 탭은 새 [플롯 생성]으로 교체 ②아이디어는 원본 유지(참조 방식) ③단계 분할 진행
- **data.js** 수정 — `PLOT_STRUCTURES` 추가: `act3`(1막·2막·3막), `part5`(발단·전개·위기·절정·결말), `hero12`(영웅의 여정 12단계, HERO_STAGES 재사용)
- **app.js** 수정 —
  - `blankProject`에 `plotDoc:{structure:"", sections:[]}` 추가, `fillPlotDoc()` 보정 함수 신설, `fillProject`에 반영(기존 데이터 안전 마이그레이션)
  - 기존 `rPlot()`(영웅의 여정 12단계 텍스트 입력) 전체를 새 플롯 생성 UI로 교체:
    - 구조 미선택 시 3개 구조 선택 카드 표시 → 선택하면 해당 섹션 자동 생성
    - 헤더에 `＋ 섹션 추가`(사용자 정의 섹션), `구조 변경`(초기화, 원본 아이디어는 보존) 버튼
    - `미배치 아이디어 풀`: 아이디어 수집의 블록 중 아직 섹션에 없는 것들을 드래그 가능한 미니 카드로 표시(태그 색상 반영)
    - 각 섹션은 드롭 영역. 아이디어를 풀→섹션, 섹션↔섹션으로 드래그해 배치/이동/정렬(핸들 ⠿). 섹션 이름 인라인 수정, 배치 개수 표시, 섹션 삭제 가능
    - `unplacedIdeas`/`findIdea`/`cleanPlotRefs`(삭제된 아이디어 참조 정리)/`getDragAfterElementV`/`rebuildPlotFromDOM`(화면 순서→모델 반영)/`plotIdeaCard` 함수 신설. **참조 방식**이라 아이디어 원본은 아이디어 수집에 그대로 유지
  - `buildPreview()`(내보내기) 플롯 섹션을 새 `plotDoc` 구조로 렌더링하도록 수정(구조명 + 섹션별 배치 아이디어 목록)
- **index.html** 수정 — 사이드바 탭 라벨 `영웅의 여정` → `플롯 생성`
- **style.css** 수정 — `.plot-structure-choices`, `.plot-struct-btn`, `.plot-section`, `.plot-idea`(드래그 카드), `.plot-drop`(드롭존) 등 스타일 추가
- **다음 단계(예정)**: [글쓰기] 메뉴 — 좌(플롯 블록 목록+글자수/%)·중앙(scene 단위 하위 블록 작성/정렬)·우([미리보기] A4 페이지 구분) 3분할, 플롯 단계 가로 구분선, 블록별 캐릭터/배경 지정

## 2026-07-16 (23차) · 아이디어 블록 드래그 정렬 + 태그별 색상 지정
- **app.js** 수정 —
  - 아이디어 블록(`ideaBlockCard`)에 드래그 핸들(⠿) 추가. 핸들을 누른 채 위/아래로 끌면 카드 순서를 바꿀 수 있음(HTML5 드래그앤드롭, `getDragAfterElement`/`reorderIdeaBlocks`로 화면 순서를 실제 저장 순서에 반영). PC 브라우저 기준 동작(모바일 터치 드래그는 브라우저 제약으로 제한적일 수 있음)
  - 태그마다 색상을 지정할 수 있도록 `P.tagColors`(태그명→hex) 필드 추가, `blankProject`/`fillProject`에 반영. 색상 미지정 태그는 10색 팔레트에서 이름 기반으로 자동 배정(`getTagColor`), 태그 칩의 동그란 색상 점을 클릭하면 네이티브 컬러피커로 변경 가능(`openTagColorPicker`/`setTagColor`)
  - 태그 칩 렌더링을 공통 함수 `makeTagChip()`으로 통합 (입력 중 태그, 기존 태그 선택, 필터 바, 블록 내 태그, 태그 추가 팝오버 전부 동일 로직 사용)
  - 아이디어 블록 왼쪽에 표시되던 색상 테두리를 해당 블록의 첫 번째 태그 색상으로 표시하고, 두께를 4px→9px로 키우고 옅은 배경 틴트를 추가해 색상이 더 잘 보이도록 개선
- **style.css** 수정 — `.idea-block` 테두리/패딩 조정, `.idea-handle`, `.tag-color-dot`, `.idea-block.dragging` 스타일 추가

## 2026-07-16 (22차) · Cloudflare D1 실제 연동 + 로그인/회원가입 폼 표시 버그 수정
- **Cloudflare 대시보드 작업** (브라우저 자동화로 진행) — D1 데이터베이스 `storyhelperlite-db` 생성, `schema.sql` 콘솔에서 실행(users/sessions/user_data 테이블 + 관리자 계정 `profh` 시드 확인), Pages 프로젝트(storyhelperlite, Production)에 변수명 `DB`로 바인딩 후 재배포 완료
- **style.css** 버그 수정 — `.auth-panel { display:flex }` 규칙이 `[hidden]` 속성보다 우선 적용되어, 로그인 화면에서 회원가입/찾기 폼이 로그인 폼과 함께 그대로 노출되던 문제 발견(실제 배포 사이트에서 확인). `.auth-panel[hidden] { display: none; }` 규칙 추가로 수정
- 검증: storyhelperlite.pages.dev 실제 접속하여 로그인/회원가입 탭 전환 정상 동작 확인 예정(다음 접속 시 확인)

## 2026-07-16 (21차) · Google 로그인/Drive 연동 제거 → 자체 회원가입·로그인 + 서버(D1) 저장으로 전환
- **google-drive.js** 삭제, **docs/oauth-consent-screen-draft.md, docs/drive-integration-design.md, docs/privacy-policy-draft.md** 삭제 (Google 연동 관련 문서 전부 제거)
- **auth.js** 신규 생성 — 자체 로그인/회원가입/로그아웃, 세션 토큰(localStorage) 관리, 서버 데이터 불러오기(`loadFromServer`)/저장(`saveToServer`, 600ms 디바운스) 구현
- **index.html** 수정 — Google GSI 스크립트 태그 제거. 로그인 오버레이를 로그인/회원가입/아이디·비번 찾기 3개 탭 폼으로 재구성:
  - 로그인: 아이디, 비밀번호
  - 회원가입: 소속학교, 이름, 아이디, 비밀번호, 비밀번호 확인, 이메일(찾기용) — 클라이언트에서 비밀번호 일치·6자 이상 검증
  - 찾기: 이메일 입력 → 서버에 계정 존재 여부만 확인(실제 이메일 발송 기능은 미구현, 안내 문구로 대체)
  - 상단바 `google-auth` 블록을 `user-auth`로 교체, `googleLoginBtn`→`userMenuBtn`, `driveStatus`→`serverStatus`
- **app.js** 수정 —
  - `ADMIN_EMAIL`(이메일 기준) → `ADMIN_USERNAME="profh"`(아이디 기준)으로 관리자 판정 방식 변경, `isAdmin()`이 `currentUser.username`을 확인하도록 수정
  - `save()`가 `saveToDrive()` 대신 `saveToServer()` 호출
  - Google 로그인 버튼 바인딩, `window.load` 시 `initGoogle()` 호출 코드 제거
- **functions/api/** 신규 생성 (Cloudflare Pages Functions, D1 바인딩 변수명 `DB` 사용):
  - `_utils.js` — PBKDF2-SHA256(100,000회) 비밀번호 해시/검증, 세션 토큰 발급, `requireAuth()` 헬퍼
  - `signup.js` — 회원가입(소속학교/이름/아이디/비밀번호/이메일), 아이디 중복 검사, 30일 세션 발급
  - `login.js` — 로그인, 30일 세션 발급
  - `logout.js` — 세션 토큰 삭제
  - `data.js` — GET(불러오기)/POST(저장, upsert). GET 호출 시 `updated_at`이 90일(3개월) 이상 지난 `user_data` 행을 자동 삭제(느슨한 만료 정리 방식 — Cron Trigger 없이도 접속이 있을 때마다 정리됨)
  - `find-account.js` — 이메일로 계정 존재 여부 확인(실제 발송 없음, 관리자 문의 안내)
- **schema.sql** 신규 생성 — `users`/`sessions`/`user_data` 테이블 정의. 관리자 계정 시드 포함(아이디 `profh`, 임시 비밀번호 `1234`, 이메일 `byeorie@gmail.com`) — **최초 접속 후 반드시 비밀번호 변경 필요**
- **style.css** 수정 — `.google-auth`/`#googleLoginBtn.avatar-btn` 등 Google 전용 클래스를 `.user-auth`/`#userMenuBtn.avatar-btn`으로 교체, 로그인/회원가입 탭·폼 스타일(`.auth-tabs`, `.auth-panel`, `.auth-submit` 등) 추가
- **privacy.html** 수정 — Google Drive 관련 서술 제거, 자체 계정(비밀번호 해시 저장)·서버 3개월 자동삭제 정책으로 재작성
- **README.md** 재작성 — 자체 로그인/D1 저장 구조 반영, `functions/api/` 엔드포인트 표, Cloudflare 대시보드 최초 수동 설정(D1 생성 → schema.sql 실행 → Pages에 `DB` 바인딩) 안내 추가
- **미완료(다음 단계로 보류)**: 로컬 저장을 "독자 포맷"으로 내보내기/불러오기 하는 기능은 요청대로 이번 작업에서 제외 — 모든 기능 완성 후 별도 진행
- **주의**: `functions/api/` 사용을 위해서는 Cloudflare 대시보드에서 D1 데이터베이스를 생성하고 `schema.sql`을 실행한 뒤, Pages 프로젝트에 변수명 `DB`로 바인딩하는 수동 설정이 최초 1회 필요함 (자동화 불가 영역, 안내 문서 참고)

## 2026-07-04 (20차) · "아이디어 탐색" 탭 상단 작품DB 상태 안내 블록 제거
- **app.js** 수정 — `rExplore()` 상단의 "작품DB에 N개 등록되어 있습니다 / 아직 등록된 작품DB가 없습니다" 안내 블록 삭제. 등록 현황은 관리자 메뉴("작품DB 관리")에서만 확인 가능
- 참고: 직전 커밋(app.js 복구)은 이미 다른 세션에서 완료되어 있었음 — 확인해보니 배포가 정상 상태였음

## 2026-07-04 (18차) · 새로고침 시 탭이 "아이디어 수집"으로 초기화되는 문제 수정
- **원인**: `activeTab` 변수가 메모리에만 있고 저장되지 않아, 새로고침하면 항상 기본값 "idea"로 리셋됨
- **app.js** 수정 —
  - `TAB_KEY="storyhelper_activeTab"` 추가, 탭 클릭 시 `localStorage`에 저장
  - 초기 로드 시 저장된 탭 값을 읽어 `activeTab` 초기값으로 사용 (유효한 탭 이름일 때만), 해당 탭 버튼에 active 클래스 적용
  - 관리자 권한 상실로 admin 탭에서 강제 이동될 때도 저장값을 "idea"로 갱신

## 2026-07-04 (17차) · 작품DB 등록을 관리자 전용 메뉴로 분리
- **index.html** 수정 — 사이드바 맨 아래에 "🔐 관리자" 그룹(작품DB 관리 탭) 추가. 기본적으로 `display:none`으로 숨겨져 있고, 관리자로 로그인해야만 노출됨
- **app.js** 수정 —
  - `ADMIN_EMAIL = "studio.inknpen@gmail.com"` 상수와 `isAdmin()` 판정 함수 추가 (로그인 이메일이 이 계정과 일치할 때만 true)
  - `refreshAdminTabVisibility()`: 관리자 여부에 따라 사이드바의 관리자 메뉴를 표시/숨김
  - `onAuthChanged()`: 로그인/로그아웃 시 google-drive.js에서 호출되는 훅. 관리자 메뉴 표시를 갱신하고, 관리자가 아닌 상태로 admin 탭에 있었다면 자동으로 "아이디어 수집" 탭으로 이동
  - `render()`에 이중 방어 추가 — 관리자가 아닌 사용자가 `activeTab==="admin"`으로 진입해도(예: URL 조작) "접근 권한 없음" 화면만 보이고 실제 관리 UI는 렌더링되지 않음
  - 기존 "아이디어 탐색" 탭에 있던 작품DB 업로드/삭제 UI를 새 `rAdmin()` 함수로 이동. "아이디어 탐색" 탭은 이제 등록된 작품 수만 읽기 전용으로 보여주고, 매칭·로그라인 조합 기능은 그대로 유지
  - `rAdmin()`에 등록된 작품 제목 목록을 함께 표시해 관리자가 등록 상태를 바로 확인 가능
- **google-drive.js** 수정 — `gUserEmail` 전역 변수 추가, `updateUserUI()`에서 로그인 이메일을 저장하고 `onAuthChanged()`를 호출하도록 연결. `signOut()`에서도 `gUserEmail`을 비우고 `onAuthChanged()` 호출
- **style.css** 수정 — `#adminNavGroup .nav-label` 강조색 추가
- 참고: 이메일 일치 여부만으로 판정하는 클라이언트 사이드 체크이므로, 완전한 서버 인증은 아니지만 이 프로젝트의 사용 목적(학생에게 관리 메뉴를 노출하지 않는 것)에는 충분함

## 2026-07-04 (16차) · "아이디어 탐색" 메뉴 신설 — 작품DB 매칭 로그라인 빌더
- **index.html** 수정 — 사이드바 "아이디어 수집" 아래에 "아이디어 탐색" 탭 추가. xlsx(SheetJS) CDN 스크립트 추가(엑셀 작품DB 업로드 파싱용)
- **data.js** 수정 — 로그라인 8슬롯 정의(`LOGLINE_SLOTS`: 주인공특성/시대/공간/사건유형/위기유형/원인동기/해결방식/결말) 추가
- **app.js** 수정 — `rExplore()` 렌더러 신설:
  - 작품DB(.md 표 또는 .xlsx) 업로드 → 슬롯별 키워드 마스터 자동 추출, `DB.workDB`(전역, 프로젝트 공통)에 저장
  - 8슬롯 드롭다운(기존 키워드 선택 + 직접입력)으로 로그라인 조합 → 실시간 미리보기 문장 생성, "아이디어 수집"에 저장 가능
  - 선택한 슬롯과 작품DB를 슬롯별로 매칭해 점수순 유사 작품 추천(`matchWorks`), 일치한 슬롯을 배지로 표시
  - `P.explore`(프로젝트별 슬롯 선택값) 필드 추가, `blankProject`/`fillProject`에 반영해 기존 데이터 마이그레이션 안전 처리
- **style.css** 수정 — `.explore-*`, `.match-*` 스타일 추가
- 참고: 작품DB 자체 제작(신규 키워드 자동 추가 등)은 이 시스템 범위 밖이며, 별도로 만든 .md/.xlsx 파일을 업로드해 사용하는 구조

## 2026-07-03 (15차) · 새로고침 시 로그인창으로 넘어가는 문제 수정
- **원인**: 14차에서 추가한 "조용한 복원"이 `requestAccessToken({prompt:""})`을 새로고침 시 자동 호출하는 방식이었는데, 브라우저가 사용자 클릭 없이 뜨는 OAuth 팝업을 차단해서 콜백이 전혀 실행되지 않았음 → `logged-in` 클래스가 추가되지 않아 로그인 오버레이가 계속 보임
- **google-drive.js** 수정 — access token 자체와 만료시각(`expiresAt`, 로그인 시 받은 `expires_in` 기준 보통 1시간)을 `localStorage`에 저장. 새로고침 시 팝업 호출 없이 저장된 토큰을 바로 사용해 로그인 화면을 건너뜀(`restoreSessionIfFresh`). Drive API가 401(토큰 만료/무효)을 응답하면 자동으로 로그아웃 처리(`handleAuthExpired`)하도록 모든 Drive 호출 지점에 체크 추가
- 결과: 로그인한 뒤 1시간 이내에 새로고침하면 로그인 화면 없이 그대로 이어서 작업 가능. 1시간이 지나거나(토큰 만료) 1시간 동안 입력이 없으면 자동 로그아웃되어 로그인 화면이 다시 나타남(정상 동작)

## 2026-07-03 (14차) · 새로고침 시 로그인 유지 + 1시간 무입력 자동 로그아웃
- **google-drive.js** 수정 — 로그인 성공 시 이름/이메일/사진과 마지막 활동 시각을 `localStorage`에 저장. 새로고침되면 최근 1시간 안에 활동이 있었을 경우 팝업 없이 조용히 로그인 토큰을 재발급받아 로그인 상태를 복원(`trySilentRestore`). 클릭/키보드/스크롤 등 활동이 있으면 30초 간격으로 활동 시각을 갱신하고, 1분마다 유휴 시간을 검사해 1시간 동안 입력이 없으면 자동 로그아웃(`signOut` 호출). 로그아웃 시 저장된 세션 정보도 함께 삭제
- 참고: 리프레시 토큰 없이 Google Identity Services의 `requestAccessToken({prompt:""})`로 조용한 재인증을 시도하는 방식이라, 브라우저의 구글 로그인 세션 자체가 만료/해제된 경우엔 복원되지 않고 다시 로그인 버튼을 눌러야 함(정상 동작)

## 2026-07-03 (13차) · "아이디어 탐색" 탭 이름을 "아이디어 수집"으로 변경
- **index.html** 수정 — 사이드바 탭 라벨 "아이디어 탐색" → "아이디어 수집"

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
