# 개발 로그 (DEVLOG)

프로젝트 파일이 생성/수정/삭제될 때마다 이 파일을 갱신합니다.

## 2026-08-22 (2) — 아이디어 수집: 태그 입력창 옆에 "등록" 버튼 추가

**요청**: "아이디어 수집에서 아이디어 입력창에 등록 버튼 만들어줘." → 이후 "등록버튼 위치를 태그
입력창 옆으로."로 위치 조정.

- 기존에는 아이디어 입력창(`#ideaNewInput`)에서 Enter 키를 눌러야만 등록됐음. 태그 입력창
  (`#ideaNewTagInput`) 오른쪽에 "등록" 버튼(`#ideaAddBtn`)을 추가해 클릭으로도 등록할 수 있게 함 —
  두 입력창 모두 Enter 키 등록은 그대로 유지.
- `app.js`: 등록 로직을 `submitNewIdea()` 함수로 분리해 Enter 키 핸들러와 버튼 클릭 핸들러가 공유하도록
  정리(입력값이 비어있으면 아무 동작 안 함).
- `style.css`: `.idea-add-row`(입력창+버튼 한 줄 배치, 입력창이 남는 폭을 모두 차지) 스타일을
  `.idea-compose-row`(태그 입력 줄)에 함께 적용.
- 모바일(768px 이하)에서도 태그 입력창+버튼이 한 줄에 나란히 표시되도록 확인함.

## 2026-08-22 (1) — 모바일 화면 최적화 (반응형, 폭 768px 이하에서만 적용)

**요청**: "모바일에서도 사용 가능하게 해줘. 모바일로 접속했을때만 적용되게. 1) 사이드 메뉴는 햄버거 메뉴로
열고 접을수 있도록. 2) 모든 입력 폼은 한 줄에 하나씩만. 3) 기능은 그대로, UI만 모바일 최적화."

- `style.css` 맨 끝에 `@media(max-width:768px)` 블록 추가(768px보다 넓은 화면엔 영향 없음):
  - 왼쪽 사이드 메뉴(`.sidebar`)를 화면 폭 안에서 밀어내는 대신, 화면 위에 뜨는 오버레이 서랍(왼쪽에서
    슬라이드 인/아웃, `transform:translateX`)으로 전환. 기존 데스크톱용 `sb-collapsed`(접기) 상태와는
    별개로 `body.mobile-nav-open` 클래스로만 여닫음 — 데스크톱에서 저장해둔 접힘 상태(localStorage)와
    충돌하지 않음.
  - 서랍 뒤에 반투명 배경(`#mobileNavBackdrop`, `index.html`에 새로 추가)을 깔아 바깥을 탭하면 닫히게 함.
  - `.row`, `.plan-row`, `.char-rel-add`와 각종 2열 그리드(`.scene-meta-row`, `.scene-dashed-row`,
    `.sub-branches`, `.explore-grid`, `.plot-structure-choices`, `.char-gallery`, `.learn-grid`,
    `.prof-assign-grid`)를 1열로 강제 — 입력 폼이 한 줄에 하나씩만 오도록 함(기획서 작성/사건 설정/배경
    설정 등에서 확인).
  - 상단바 여백·아이콘 크기, 본문(`main`) 좌우 여백을 좁은 화면에 맞게 축소. 모달(`.plot-modal`,
    `.guide-modal`)은 화면 폭에 맞춤.
- `app.js`: `#sbToggleBtn` 클릭 핸들러가 `matchMedia("(max-width:768px)")`로 모바일 여부를 판단해,
  모바일이면 `mobile-nav-open` 토글만(데스크톱 접기 로직과 별도 경로), 데스크톱이면 기존 로직 그대로 실행.
  메뉴 탭 선택 시 모바일 서랍이 자동으로 닫히도록 처리. `#mobileNavBackdrop` 클릭 시 서랍 닫힘.
- 기능(로직)은 전혀 건드리지 않았고 CSS 미디어쿼리 + 화면폭 분기 JS 몇 줄만 추가 — 데스크톱(768px 초과)
  화면에서는 기존과 동일하게 동작함. Playwright로 모바일 뷰포트(390×844) 렌더링 확인 완료(햄버거
  열기/닫기, 배경 탭으로 닫기, 탭 이동 시 자동 닫힘, 기획서/사건 설정 폼 1열 표시).

## 2026-08-20 (11) — 서버 데이터 자동 삭제 주기를 3개월(미접속 기준) → 6개월(고정 기준일) 정책으로 확정, 안내 문구 일치

**요청**: "서버 저장본 자동 삭제 주기를 6개월로 변경해줘."

- **배경**: 기존에는 "3개월 이상 갱신 없으면 개별 데이터 삭제" 방식이었는데(README/개인정보처리방침/앱 내
  "사용법"에 그렇게 안내되어 있었음), (3)번 작업으로 `functions/api/_utils.js`에 `wipeIfDue()`/
  `latestWipeBoundarySec()`가 추가되면서 "매년 3월 1일·9월 1일 두 고정 기준일에 계정(users)만 남기고
  나머지 서버 데이터 전체 초기화"(사실상 6개월 주기) 방식으로 이미 바뀌어 있었으나, 안내 문구들이
  예전 "3개월" 기준 그대로 남아있어 정책과 문서가 불일치하던 상태였음.
- **정리한 내용**: 실제 정책(고정 기준일 6개월 주기)은 그대로 유지하고, 아래 파일들의 "3개월" 안내 문구를
  실제 동작과 일치하도록 "6개월(매년 3/1·9/1)"로 수정함.
  - `README.md`: 상단 요약, `/api/data` 설명 두 곳.
  - `privacy.html`: "3. 보유 및 이용 기간" 문단.
  - `app.js`의 "사용법" 안내 모달(`GUIDE_SECTIONS`)은 이전 작업에서 이미 새 정책 기준으로 작성되어 있어
    추가 수정 없음.
- **⚠️ 배포 시 확인 필요**: `schema.sql`에 추가된 `server_meta` 표(마지막 초기화 기준일 기록용)가 이미
  운영 중인 D1(`storyguide-db`)에 없다면, `/api/data` 호출마다 `wipeIfDue()`가 테이블 없음 에러로 실패함.
  Cloudflare 대시보드 → D1 → `storyguide-db` → Console에서 `schema.sql`의 "2026-08-20 (3): 서버 데이터
  정기 초기화" 섹션(`CREATE TABLE IF NOT EXISTS server_meta...`)을 아직 실행하지 않았다면 반드시 실행할 것.

## 2026-08-20 (10) — 왼쪽 사이드 메뉴 최하단에 "사용법" 안내 메뉴 추가

**요청**: "이 앱의 사용법 메뉴를 만들어줘." → 이후 "사용법을 푸터 말고 사이드 메뉴 최하단에 넣어줘."로 위치 수정.

- `app.js`에 `GUIDE_SECTIONS` 배열 + `openUsageGuide()` 추가 — 기존 팝업과 동일한
  `.plot-modal-overlay/.plot-modal` 스타일 모달을 열고, `<details>` 아코디언으로 9개 섹션(시작하기·작품
  관리·창작 순서·스토리텔링 학습·과제 제출과 첨삭 반영·교수 계정 기능·관리자 계정 기능·계정 설정·데이터
  보관 안내) 표시.
- 처음엔 페이지 하단 푸터에 링크로 넣었다가, 요청에 따라 `index.html`의 왼쪽 사이드바(`<nav
  class="sidebar">`) 맨 끝 `#adminNavGroup` 다음으로 이동(`.nav-group.nav-group-help` +
  `#usageGuideLink` 버튼, class는 `.tab`이 아닌 `.tab-help`로 분리해 기존 탭 전환 로직과 얽히지 않게 함).
  역할과 무관하게 항상 사이드바 최하단에 보임. 푸터의 "스토리 가이드"/"개인정보처리방침" 링크는 그대로 유지.
- `style.css`: `.guide-modal`/`.guide-modal-body`/`.guide-section`(아코디언), `.nav-group-help`/
  `.tab-help`(사이드바 하단 버튼) 스타일 추가.

## 2026-08-20 (9) — 반영된 교수님 메모를 "메모 블럭" 카드로 표시(삭제 가능) — (8)의 텍스트 방식 문제 수정

**요청**: "학생이 덮어쓰기 하면 이렇게 나오는데(제목/장르 칸에 메모가 본문과 뒤섞여 보임), 첨삭때처럼
메모 블럭으로 표시되도록 하고. 필요한경우 학생이 메모 블럭을 삭제 할 수 있도록 해줘."

- **문제**: (8)에서 넣은 방식은 메모를 `"\n\n[교수님 메모]\n- ..."` 형태로 항목 텍스트 끝에 그냥
  이어붙였는데, 제목/장르처럼 `<input type="text">`(한 줄 입력칸)로 렌더되는 항목은 줄바꿈이 화면에
  표시되지 않아 "asdf[교수님 메모]- sdafasfd"처럼 본문과 메모가 뒤섞여 보이는 문제가 있었음.
- **app.js**: 메모를 텍스트에 합치지 않고 `P.appliedMemos[type][key]`(구조화된 배열)에 별도 저장하는
  방식으로 전면 수정.
  - `memoNoteBlock()` 삭제, 대신 `setAppliedMemos(type,key,memos)`/`getAppliedMemos(type,key)`/
    `deleteAppliedMemo(type,key,memoId)` 신규 — key는 plan/background/event는 필드 key, plot/write/
    character는 항목(섹션/블록/캐릭터) id.
  - `applyFeedbackToProject()`: 각 항목 텍스트는 첨삭 내용 그대로만 대입(순수 텍스트, 메모 안 섞임),
    메모는 `setAppliedMemos()`로 별도 저장.
  - `buildAppliedMemoList(type,key,onChanged)`(신규) — 첨삭 화면의 `.memo-block`/`.memo-block-marker`/
    `.memo-block-text`/`.memo-block-del`과 동일한 스타일로 메모 카드 DOM을 만듦(삭제 버튼 포함).
  - `renderAppliedMemoBlock(container,type,key)` — 필드마다 개별 래퍼(`.plan-block` 등)가 있는 경우
    그 컨테이너 맨 아래에 메모 카드를 붙임(기획서 탭에 사용).
  - `renderAppliedMemoBlockAfter(afterEl,type,key)` — 필드들이 개별 래퍼 없이 한 카드 안에 나란히
    있는 경우(배경/사건 설정) 해당 입력칸 바로 다음에 형제 요소로 메모 카드를 끼워 넣음.
  - `rPlan()`/`rBg()`/`rEvent()`/`plotSectionCard()`(플롯)/`sceneBlockCard()`(글쓰기)/
    `charDetailPage()`(캐릭터, "기타 메모" 칸 아래) 각각에 위 렌더 호출을 추가해 6개 콘텐츠 타입
    모두에서 반영된 메모가 카드로 보이고 삭제 버튼(✕)으로 지울 수 있게 됨. 삭제하면 즉시 저장(save())됨.
- jsdom으로 구조화 저장(getAppliedMemos), `.plan-block` 컨테이너/형제 삽입 두 렌더 방식 모두에서 입력칸
  값은 그대로 유지되고 메모가 별도 카드로 표시되는지, 삭제 버튼 클릭 시 카드가 사라지고 save()가
  호출되는지, 메모가 없을 때는 아무 것도 렌더되지 않는지 확인함.


## 2026-08-20 (8) — 첨삭 반영 시 교수님 메모도 함께 넘어가도록 수정

**요청**: "학생이 피드백 받아서 자신의 작업물에 반영할 때, 메모도 같이 넘어가도록 해줘."

- **배경**: [내 작업물에 반영] 버튼은 지금까지 `feedback`(첨삭 텍스트)만 프로젝트에 덮어쓰고, 원본
  블록에 단 메모(범위 각주 메모 + 일반 메모)는 반영하지 않고 화면에서만 보여줬음.
- **app.js** `memoNoteBlock(memos, pairId)`(신규): 해당 항목(review-pair)에 달린 메모들을
  `"\n\n[교수님 메모]\n- ..."` 목록 텍스트로 합침. 메모의 start/end(원본 텍스트 기준 글자 오프셋)는
  첨삭 반영 후에는 더 이상 정확하지 않으므로 인용 없이 메모 내용만 나열.
- **`applyFeedbackToProject(type, feedback, memos)`**: 인자로 `memos` 추가. 항목별 텍스트에 그대로
  덧붙이는 방식(plan/background/event/plot/write는 해당 항목 자신의 텍스트 끝에, character는 항목이
  여러 필드로 나뉘어 있어 "기타 메모" 필드 끝에) — write는 지문(text) 아이템으로 자연스럽게 붙음.
- **호출부**(`rFeedbackDetail`): `applyFeedbackToProject(sub.type, sub.feedback, memos)`로 memos 전달.
  안내 문구에 "교수님이 남긴 메모(N개)도 함께 반영됩니다" 문구 추가.
- jsdom으로 plan/plot/write/character 네 타입 모두 메모가 정확히 해당 항목 끝에 붙는지, 메모가 없을
  때 기존과 동일하게 동작하는지 확인함.


## 2026-08-20 (7) — 계정 설정에 개인정보 수정 메뉴 추가 + 툴바 교수 표시에서 학교명 제거

**요청**: "1) 계정 설정에 개인정보 수정하는 메뉴 만들어줘. 2) 상단툴바 왼쪽의 교수 표시되는 곳에
교수이름만 넣어줘. 학교명은 빼고."

- **functions/api/update-profile.js**(신규): 로그인한 계정의 학교/이름/이메일을 수정. 아이디(username)는
  로그인 식별자이자 여러 테이블에서 참조되므로 이 메뉴에서는 바꾸지 않음(비밀번호도 기존
  request-password-change.js로 별도 처리, 여기서 다루지 않음).
- **auth.js** `openSettings()`: [설정] 모달 맨 위에 학교/이름/이메일 입력칸 + "개인정보 저장" 버튼을
  공통(학생/교수/관리자 모두)으로 추가. 저장 성공 시 `currentUser`/localStorage/우측 상단 표시(이름·
  학교)를 즉시 갱신하고 `onAuthChanged()`로 툴바 교수 표시 등도 함께 새로고침.
- **app.js** `refreshProfBar()`: 상단 툴바의 교수(수업) 표시에서 "학교 · 이름" → "이름"만 표시하도록
  변경(1명일 때 텍스트, 2명 이상일 때 드롭다운 옵션 모두 동일하게 적용).
- jsdom으로 학생/교수 두 계정 모두 [설정] 모달에 개인정보 입력칸이 기존 값으로 채워지는지, 저장 후
  `currentUser`/상단 표시가 갱신되는지, 툴바 드롭다운/텍스트에 학교명이 빠졌는지 확인함.


## 2026-08-20 (5) — 상단 툴바 "서버에 저장됨" 표시 제거 + 교수(수업) 표시/드롭다운 추가

**요청**: "1) 상단 툴바의 왼쪽에 [서버에 저장됨] 표시는 삭제해주고, 어떤 교수의 수업인지 표시되도록
해줘. 2) 등록한 교수가 여러명일 경우에는 드롭다운으로 표시해서 선택하도록 해주고. 3) 과제 제출할 때
교수를 선택하게 하지 말고 툴바에서 선택한 교수에게 보내지도록 해줘."

- **index.html**: 우측 상단 `#serverStatus`("서버에 저장됨"/"로컬 저장" 등) 스팬 삭제. 그 자리(아바타
  버튼 왼쪽)에 빈 `#profBarWrap` 컨테이너 추가(교수 계정/미등록 시 hidden, app.js가 채움). 프로젝트별
  로컬 저장 상태를 보여주는 `#saveStatus`("저장됨"/"저장 중…")는 그대로 유지.
- **app.js**:
  - `refreshProfBar()`(신규) — 학생 계정에서 `student-professors`를 불러와 `#profBarWrap`을 채움.
    1명이면 이름 텍스트만, 2명 이상이면 `<select>` 드롭다운으로 표시. 고른 값은 기존
    `rememberSelectedProf()`(localStorage `shl_selected_prof`)로 기억되어 새로고침해도 유지됨.
    전역 `profBarId`가 "지금 선택된 교수"의 단일 기준값이 됨. 교수/관리자 계정이거나 등록된 교수가
    없으면 숨김.
  - `onAuthChanged()`에 `refreshProfBar()` 호출 추가 — 로그인/로그아웃/교수 코드 추가 등록 시(이미
    onAuthChanged를 부르고 있던 지점들) 자동으로 갱신됨.
  - `openSubmitModal()`/`rFeedbackList()`: 모달·화면 안에서 교수를 다시 고르던 `profSelectHtml()`
    드롭다운을 제거하고, 항상 `profBarId`(툴바에서 고른 교수) 기준으로 `student-assignments`를 조회.
    미등록 상태 안내 문구는 그대로 유지.
  - `profSelectHtml()` 함수는 더 이상 쓰이지 않아 삭제(`rememberSelectedProf`/`recalledSelectedProf`는
    `refreshProfBar`가 계속 사용하므로 유지).
- **auth.js**: [설정] 패널의 학생용 안내 주석을 "제출/첨삭 화면 드롭다운" → "상단 툴바 드롭다운"으로
  갱신(실제 코드 동작 변경 없음, 주석만).
- **style.css**: `.prof-bar-wrap`(+ 내부 아이콘/select) 스타일 추가.
- jsdom으로 로그인 → 교수 2명 등록 → 드롭다운 전환 → [제출]/[첨삭 보기] 흐름을 시뮬레이션해 정상
  동작 확인(수동 QA, 자동화 테스트 파일로 커밋하지는 않음).

## 2026-08-20 (4) — 캐릭터 설정에도 기획서 미리보기 + 캐릭터/배경/사건 설정 과제 제출 지원

**요청**: "1) 캐릭터 설정 페이지에도 오른쪽에 기획서가 보이도록 해줘(배경 설정 페이지 참고). 2) 캐릭터
설정, 배경 설정, 사건 설정도 과제로 제출 가능하도록 해줘."

- **app.js `rChar()`**: 캐릭터 목록(갤러리/관계도) 화면과 캐릭터 상세 편집 화면 모두
  `mountWithPlanViewer()`로 감싸, 배경/사건 설정과 동일하게 오른쪽에 "기획서 작성" 내용 미리보기가
  나타나도록 변경(기존엔 상세 편집 화면만 폭을 맞췄을 뿐 미리보기는 없었음).
- **제출 가능 타입 확장**: `TYPE_LABEL`에 `character/background/event` 추가.
  - `rChar()`/`rBg()`/`rEvent()` 각 헤더에 `submitBtnHtml()`([제출]/[첨삭 보기]) 추가, 각 함수 진입부에
    `feedbackPage.type` 체크 추가(다른 탭과 동일 패턴).
  - **배경/사건**: 필드가 이미 평평한 key-value라 `BG_FIELDS`/`EVENT_FIELDS` 목록으로 "기획서" 타입과
    동일하게 항목별 첨삭 지원(배경은 `P.world`+`P.background` 두 객체를 소스로만 구분해서 병합).
  - **캐릭터**: 인원 × 항목 수가 너무 많아지는 걸 피하려고, 캐릭터 한 명당 "라벨: 값" 줄들을 합친
    텍스트 블록 하나로 제출(플롯/글쓰기 탭과 같은 방식). `charFieldsToText()`/`parseCharFeedbackText()`로
    직렬화·역직렬화(값에 줄바꿈이 있어도 다음 라벨 전까지는 같은 항목으로 복원됨).
  - `buildSubmissionData`/`buildReviewPairs`/`buildFeedbackFromPairs`/`applyFeedbackToProject`에 세
    타입 분기 추가. 첨삭 화면(교수 첨삭 편집, 학생 첨삭 보기, PDF 일괄 다운로드, 버전 관리 등)은 이미
    타입을 몰라도 되게 설계돼 있어서 이 네 함수만 손대면 나머지는 그대로 동작함.
- **functions/api/student-submit.js**: `VALID_TYPES`에 `character/background/event` 추가(없으면 제출
  API가 400으로 거부함).
- **functions/api/professor-assignment.js**: `TYPE_LABEL`에 동일 항목 추가(교수 쪽 제출함 목록 표시용).
- 과제 폴더 자체는 원래도 타입 구분이 없어(학생이 어느 탭의 [제출] 버튼을 눌렀는지로만 타입이 정해짐)
  스키마·과제 등록 화면 변경은 필요 없었음.

## 2026-08-20 (3) — 앱 이름 "스토리텔링 가이드" → "스토리 가이드"로 변경

**요청**: "앱 이름을 스토리 가이드로 변경해줘."

- **index.html**: `<title>`, 상단바 로고 텍스트(로그인 화면/앱 화면 2곳), 하단 footer 링크 텍스트 변경.
- **privacy.html**: `<title>`, 최종 수정일 옆 서비스명, 하단 "돌아가기" 링크 텍스트 변경.
- **app.js**: 하단 "스토리 가이드" 링크 클릭 시 뜨는 안내 alert 문구 변경.
- **README.md**: 최상단 제목(`# 스토리 가이드`) 변경.
- **schema.sql**: 최상단 주석("-- 스토리 가이드 D1 스키마") 변경.
- **functions/api/_utils.js**: 이메일 발신자 표시명(`From: 스토리 가이드 <...>`) 변경.
- **functions/api/find-account.js**: 아이디 안내 메일 본문 + 제목("[스토리 가이드] 아이디 안내 및 비밀번호 재설정") 변경.
- **functions/api/request-password-change.js**: 비밀번호 변경 메일 제목("[스토리 가이드] 비밀번호 변경 링크") 변경.
- DB/코드 내부 식별자(GitHub 저장소명 storyhelperlite, Cloudflare Pages 프로젝트명 storyguide, D1 DB명
  등)는 변경하지 않음 — 사용자에게 보이는 화면/이메일 문구만 변경.

## 2026-08-20 (2) — 계정 설정 비밀번호 변경(이메일) + 학생 다중 교수 등록 + 관리 표 밀도 축소

**요청**: "1) 모든 계정의 설정에 비밀번호 변경하는 옵션 넣어줘. 변경은 이메일로. 2) 한 학생이 여러명의
교수와 그룹을 맺을 수 있어. 여러명의 교수코드를 등록하고, 해당교수의 수업시간에 드롭다운으로 해당 교수를
선택할 수 있는 기능을 만들어줘. 주로 과제를 보내고 피드백 받는 기능위주로. 3) 과제관리/학생관리/회원관리
리스트들의 표와 블럭 상하 높이가 너무 커서 촘촘하게."

- **스키마(신규, 수동 적용 필요 — 아래 "⚠️ 적용 안내" 참고)**: `student_professors` 표 추가
  (`student_id, prof_id, joined_at`, `(student_id, prof_id)` UNIQUE). 학생 1명이 여러 교수를 동시에
  등록할 수 있게 됨. `users.prof_id` 컬럼은 삭제하지 않고 "기본 선택 교수"로 계속 사용(첫 등록 시
  자동 지정). 기존에 이미 교수를 등록해뒀던 학생은 `INSERT OR IGNORE ... SELECT`로 새 표에 자동
  백필됨(수동 스크립트 불필요, schema.sql 실행만 하면 됨).
- **functions/api/request-password-change.js**(신규): 로그인 상태에서 POST — find-account.js와 같은
  방식(같은 `password_resets` 표, 같은 reset-password.js로 실제 변경)으로 본인 가입 이메일에 비밀번호
  변경 링크를 보낸다. 이메일을 다시 입력할 필요 없음. 학생/교수/관리자 계정 전부 동일하게 사용 가능.
- **auth.js**: `openSettings()`에 모든 계정 공통 "비밀번호 변경 메일 보내기" 버튼 추가(하단, 구분선
  아래). 학생 계정의 [설정]은 코드 입력 시 기존 등록을 대체하지 않고 목록에 추가하도록 변경, 등록된
  교수 목록을 보여주는 `loadSettingsProfList()` 추가.
- **functions/api/student-join.js**: 코드 입력 시 `student_professors`에 INSERT(이미 등록된 코드면
  에러). 첫 등록이면 `users.prof_id`(기본 선택)도 함께 지정.
- **functions/api/student-professors.js**(신규, GET): 내가 등록한 교수 전체 목록 + 기본 선택 교수 id.
- **functions/api/student-assignments.js**: `?profId=` 쿼리 지원 — 여러 교수 중 하나를 골라 그 교수의
  과제 목록만 반환, 응답에 `professors`(드롭다운 구성용 전체 목록) 추가.
- **functions/api/student-submit.js**: 제출 가능 여부를 `auth.user.profId`(기본 선택 하나) 대신
  `student_professors` 등록 여부로 직접 확인하도록 변경(어느 교수 드롭다운에서 제출했든 그 과제의
  실제 prof_id 기준으로만 검증).
- **functions/api/professor-students.js**(학생 관리): 조회 기준을 `users.prof_id`(기본 선택)에서
  `student_professors`(등록 전체)로 변경 — 학생이 다른 교수를 기본으로 바꿔도 내 코드로 등록한 학생이면
  계속 명단에 나옴.
- **functions/api/admin.js**: 회원 삭제(`deleteUser`)/등급 변경(`setRole`, 교수→학생) 시
  `student_professors` 정리 로직 추가(교수 삭제/강등 시 그 교수를 등록해뒀던 학생들의 기본 선택을
  다른 등록 교수로 넘기거나 비움; 회원 본인 삭제 시 자신의 등록 목록도 함께 삭제).
- **app.js**: 학생의 [제출] 모달(`openSubmitModal`)과 [첨삭 보기] 목록(`rFeedbackList`)에 등록 교수가
  2명 이상이면 상단에 교수 선택 드롭다운 추가(`profSelectHtml`), 마지막 선택은 `localStorage`
  (`shl_selected_prof`)에 기억해뒀다가 다음에 열 때도 유지.
- **style.css**: `.admin-table`(회원 관리·학생 관리 표) 셀 padding 7px 10px → 4px 8px, 폰트 13px →
  12.5px로 축소. `.assign-folder`(과제 관리 폴더 블록) padding 12px 14px → 8px 12px,
  `.prof-assign-grid` gap 12px → 8px로 축소해 더 촘촘하게 표시.

**⚠️ 적용 안내(교수님 진행 필요)**: 이번 변경은 D1에 새 표(`student_professors`)가 필요합니다.
Cloudflare 대시보드 → Workers & Pages → D1 → 사용 중인 DB(`storyguide-db` 등) → Console 탭에서
`schema.sql`의 "2026-08-20 (2)" 구간(`CREATE TABLE student_professors...`부터 `INSERT OR IGNORE...`
까지)을 붙여넣고 실행해야 새 기능이 정상 동작합니다. 실행 전에는 학생이 교수 코드를 등록해도
`student_professors` 표가 없어 에러가 납니다.

## 2026-08-20 (1) — 첨삭 화면에 "메모" 기능 추가 + 첨삭 피드백 버전별 저장

**요청**: "과제 관리 페이지에서 학생들 과제를 첨삭하는 페이지가 구축되어있는데, 첨삭과 별도로 학생 과제에
메모를 해주는 기능을 추가해줘. (1) 텍스트 드래그 후 우클릭 또는 블록에서 그냥 우클릭 시 메모 추가 메뉴
(2) 메모는 블록 아래 옅은 노란색 배경, 돋움체로 여백 없이 (3) 드래그 선택 메모는 배경 노랑+각주번호
(4) 선택 없는 메모는 각주번호 없이 *로 표시. 참고용 메모 기능이 이미 구축된 파일(첨부한 별도 프로젝트의
index.html)을 검색해서 참고." + 추가 요청: "메모도 피드백 보내기로 반환했을 때 학생이 볼 수 있어야 하고
학생이 지울 수도 있어야 한다" + "피드백 파일들은 버전별로 저장되도록 해서, 같은 과제를 여러 번 피드백
했을 때 열 수 있도록 해줘. 과제 관리의 과제 리스트에서 해당 과제 블럭 오른쪽에 버전 드롭다운을 작게
붙여줘." (버전 재편집 방식은 "이전 버전 이어서 편집", 학생 버전 열람 범위는 "모든 버전 열람 가능"으로
질문해 확인 후 진행)

- **스키마(신규, 수동 적용 필요 — 아래 "⚠️ 적용 안내" 참고)**: `submission_feedback_versions` 표 추가
  (`submission_id, version, feedback, memos, created_at`, `(submission_id, version)` UNIQUE). 첨삭을
  "피드백 전달"할 때마다 새 버전 행이 쌓이고, 기존 `submissions.feedback`/`feedback_at`은 항상 "최신
  버전" 캐시로 함께 갱신되어 과제 목록의 "첨삭 완료" 표시 등 기존 기능은 그대로 동작. 이 표 도입 이전에
  저장된 첨삭은 서버가 자동으로 "버전 1"로 간주해 보여주고, 그 상태에서 다음 저장이 일어나면 그 레거시
  내용을 실제 버전 1 행으로 먼저 백필한 뒤 버전 2를 추가함(수동 백필 스크립트 불필요).
- **functions/api/professor-submission.js**: GET에 `&version=N` 지원(없으면 최신) + 응답에 `memos`,
  `versions`(전체 버전 목록), `viewingVersion`, `latestVersion` 추가. POST(`피드백 전달`) body에 `memos`
  추가, 항상 새 버전으로 INSERT(덮어쓰지 않음) + `submissions` 캐시도 갱신.
- **functions/api/student-submission.js**: GET에 동일하게 `&version=N` + `memos`/`versions`/
  `viewingVersion`/`latestVersion` 추가(학생도 과거 버전 전체 열람 가능).
- **functions/api/student-submission-memo.js**(신규): `POST {id, version, memoId}` — 학생이 자기
  제출물의 특정 버전에 달린 메모 하나를 삭제.
- **functions/api/professor-assignment.js**: 제출함 목록 쿼리에 `version_count` 서브쿼리 추가(버전
  드롭다운 렌더링용).
- **app.js**:
  - `renderReviewPairs`/`openReviewBlockCtxMenu`를 메모 지원하도록 확장(`memos`, `memoOpts` 매개변수
    추가). 신규 함수: `uidMemo`, `rawOffsetInMemoText`, `captureMemoSelection`(우클릭 직전 드래그 선택
    범위를 원본 문자열 글자 오프셋으로 캡처 — 참고 파일의 `rawOffsetInTaContent`와 같은 방식),
    `computePairMemoNumbering`, `renderMemoTargetText`(하이라이트+각주번호/*), `renderMemoCardsInto`
    (메모 카드 목록). 메모는 항상 학생의 "원본" 텍스트에만 달림(첨삭 입력란 자체엔 안 달림).
  - 이미 분리된(첨삭 중인) 블록에 메모가 있으면 "이전 버전" 패널은 diff 강조 대신 메모 강조를 우선
    보여줌(같은 텍스트 위에 두 강조를 동시에 표시하기 어려워서 — 폴리시로 채택).
  - `rProfSubmissionReview(id, version)`: 특정 과거 버전을 읽기 전용으로 볼 수 있게 되고, 최신 버전에서만
    편집/메모/저장 가능. 저장 시 `memos`도 함께 전달, 저장 후 최신 버전으로 새로고침.
  - `rProfAssignmentFolder`: 제출함 목록의 각 줄에 버전이 2개 이상이면 작은 `<select>` 버전 드롭다운을
    붙여, 고르면 그 버전으로 바로 첨삭 화면이 열림(읽기 전용).
  - `rFeedbackDetail(type, id, version)`(학생): 버전이 2개 이상이면 상단에 작은 버전 드롭다운 추가,
    메모 카드에 삭제(✕) 버튼을 붙여 눌리면 `student-submission-memo` API로 즉시 서버 반영.
- **style.css**: `mark.memo-hl`(드래그 메모 하이라이트, 노랑), `sup.memo-fn-num`/`sup.memo-star`(각주
  번호/*), `.memo-block-list`/`.memo-block`(옅은 노란색 배경 + 돋움체, 본문 바로 아래 여백 없이 붙임),
  `.submit-assign-row`/`.submit-version-select`(버전 드롭다운) 신규 추가.
- **참고**: 첨부받은 다른 프로젝트("논문쓰기 도우미" 계열)의 index.html에 이미 구축돼 있던 메모 기능
  (`addMemoAt`, `applyMemoHighlights`, `rawOffsetInTaContent` 등)을 검색해 오프셋 계산 방식(합성 배지
  요소를 0글자로 세는 방식)을 그대로 참고해 적용함 — 단, 그 파일은 contentEditable 기반의 훨씬 복잡한
  구조라 그대로 이식하지 않고, 이 프로젝트의 읽기전용 텍스트 구조에 맞게 단순화해서 새로 작성함.
- **알려진 제한**: PDF 일괄 다운로드(`submissionToPdfBlob`)는 메모를 포함하지 않음(첨삭 내용만 인쇄).
- **검증**: `node -c`로 app.js 및 새/수정된 functions/api/*.js 문법 확인. 실제 로그인·D1 저장까지 필요한
  전체 흐름은 이 환경에서 재현 불가 — 실사용 중 이상이 있으면 알려달라고 안내 필요.

**⚠️ 적용 안내(필수)**: 이번 기능은 새 표(`submission_feedback_versions`)가 필요합니다. Cloudflare
대시보드 → Workers & Pages → D1 → storyhelperlite-db → Console에서 `schema.sql` 맨 아래
"2026-08-20: 첨삭 피드백 버전별 저장 + 원본 블록 메모" 섹션의 SQL을 한 번 실행해야 메모/버전 기능이
동작합니다(안 하면 "피드백 전달"이 실패함). 이전에도 이 단계를 깜빡해 며칠간 기능 전체가 500 에러였던
적이 있으니([[project CLAUDE.md]] 참고) 꼭 확인 부탁드립니다.

## 2026-08-19 (19) — 플롯 구조 5종 추가(8단계 원형·사건 중간부터 시작·액자·비선형·옴니버스) + 구조별 가이드 문구

**요청**: "플롯 생성에서 새 플롯 만들때 플롯 구조 선택할 때 현재 3막, 5막, 영웅의여정 12단계만 있는데.
3막 구조/5막 구조/영웅의 여정 (캠벨)/8단계 원형 구조/사건 중간부터 시작/액자 구조/비선형 구조/옴니버스
이렇게 나머지 구조도 만들어줘. 구조 선택 생성 후 가이드도 만들어주고."

- **data.js**: `PLOT_STRUCTURES`에 `arc8`(8단계 원형 구조, 나이젤 와츠 8-Point 아크), `inmedias`(사건
  중간부터 시작), `frame`(액자 구조), `nonlinear`(비선형 구조), `omnibus`(옴니버스) 5종 신규 추가(각
  4~8개 섹션 + 섹션별 예시 설명). 기존 3종에도 구조 전체를 설명하는 `guide` 필드를 새로 추가하고, 기존
  "5부 구조"는 사용자가 부르는 명칭에 맞춰 "5막 구조"로, "영웅의 여정 12단계"는 "영웅의 여정 (캠벨)"로
  라벨만 변경(데이터 키는 그대로라 기존 저장 데이터에 영향 없음).
- **app.js**: 구조 선택 화면의 각 카드에 `guide`를 `.ps-guide`로 추가 표시, 구조를 선택한 뒤 플롯 생성
  화면 상단 "현재 구조: …" 문구 옆에도 그 구조의 `guide`를 함께 보여주도록 수정.
- **style.css**: `.ps-guide`(점선 구분선 + 작은 안내 텍스트) 신규 추가, 카드 8개가 들어갈 수 있도록
  `.plot-structure-choices`의 최소 칼럼 너비를 200px→220px로 소폭 조정.
- **검증**: data.js를 Node로 직접 실행해 8개 구조 키·라벨·섹션 개수·guide 유무를 확인. Playwright로
  구조 선택 카드 8개를 실제 렌더링한 스크린샷을 육안으로 확인(레이아웃 깨짐 없음).

## 2026-08-19 (18) — 관리자 회원 관리: 계정 개별 삭제 버튼 추가

**요청**: "회원 관리에서 계정을 개별적으로 삭제할 수 있도록 해줘."

- **functions/api/admin.js**: `onRequestPost`에 `mode:"deleteUser"`(body: `{userId}`) 신규 추가. 관리자
  본인/`ADMIN_USERNAME` 계정은 삭제 거부. FK CASCADE가 없는 스키마라 수동 순서로 삭제: 대상이
  `role==="professor"`면 그 교수의 `assignments` → 각 과제의 `submissions` 삭제 → `assignments` 삭제 →
  그 교수 그룹 학생들의 `users.prof_id`를 NULL로 초기화(학생 계정 자체는 유지, 소속만 해제). 이어서
  역할 무관 공통으로 `submissions WHERE student_id=?`, `user_data`, `sessions`, `password_resets` 삭제 →
  마지막에 `users` 삭제.
- **app.js**: `renderAdminUsers()` 표 마지막 열에 삭제 버튼(`.admin-user-del`, 관리자 자신 행은 버튼 없음)
  추가, `doAdminDeleteUser()`가 `confirm()` 한 번 거쳐 `admin` API를 `deleteUser` 모드로 호출 후 표 새로고침.
- **검증**: 로그인/D1이 필요한 실제 삭제 흐름은 이 환경에서 재현 불가해 `node --check`로 app.js/
  admin.js 문법 오류만 확인. 실사용 중 문제가 있으면 알려달라고 안내 필요.

## 2026-08-19 (17) — 회원가입 시 학생/교수 선택 제거, 항상 학생으로 가입 (교수 등급은 관리자만 부여)

**요청**: "가입할 때 학생/교수 선택하는 거 없애주고, 무조건 학생으로 가입되도록 해줘. 교수 계정은
관리자가 변경시에만 적용되도록 해줘."

- **index.html**: 회원가입 폼의 학생/교수 라디오 버튼(`.signup-role`)과 안내 문구 제거.
- **auth.js**: 회원가입 제출 시 라디오값을 읽던 코드를 없애고 `role`을 항상 `"student"`로 고정.
- **functions/api/signup.js**: 요청 본문에 `role`이 와도 무시하고 서버에서도 항상 `"student"`로 저장(누가
  API를 직접 두드려도 교수로 가입 불가). 가입 시 교수 코드(profCode) 발급 로직도 함께 제거(항상 null).
  이제 교수 등급은 `functions/api/admin.js`의 `setRole`(관리자 전용, 기존 기능)로만 부여됨.
- **style.css**: 더 이상 안 쓰는 `.signup-role`/`.signup-role-opt`/`.signup-role-hint` 규칙 삭제.
- **검증**: `node --check`로 auth.js/signup.js 문법 확인. 실제 가입 흐름은 D1이 필요해 이 환경에서
  재현 불가.

## 2026-08-19 (16) — 과제 폴더 제출함 목록을 한 줄(가로) 블록으로 압축

**요청**: "과제관리에서 생성한 과제폴더 안에 있는 제출된 과제들을 한줄로 된 블록으로 보이게 해줘. 지금은
두줄로 되어있어서 블록이 너무 커."

- **style.css**: `.submit-assign-item`이 학생 과제 선택/제출 목록과 공용이라, 교수 쪽 제출함에만 별도
  수정자 클래스 `.submit-assign-list--compact`를 추가하고 그 안에서만 `flex-direction: row`로 바꿔
  이름·아이디·유형 배지·제출일이 한 줄에 표시되게 함(좁으면 가로 스크롤, 다른 두 목록은 영향 없음).
- **app.js**: `rProfAssignmentFolder()`의 제출함 목록 `<div>`에 `submit-assign-list--compact` 클래스 추가.
- **검증**: Playwright로 정적 미리보기 HTML(이름/아이디가 아주 긴 케이스 포함)을 렌더링해 스크린샷으로
  한 줄 레이아웃과 오른쪽 정렬을 확인.

## 2026-08-19 (15) — 과제 관리: 과제 폴더 삭제 + 제출물 PDF 일괄 다운로드 추가

**요청**: "1. 과제 관리에서 등록한 과제 폴더 삭제 할 수 있도록 해줘. 2. 과제폴더에 제출된 과제들을
PDF로 일괄 다운 받을 수 있도록 해줘."

- **과제 폴더 삭제**:
  - `functions/api/professor-assignment.js`: `onRequestDelete` 신규 — `DELETE /api/professor-assignment?id=`
    로 본인 과제인지 확인 후 `submissions`(해당 과제의 제출물 전부) → `assignments` 순서로 삭제.
    (schema.sql에 FK CASCADE가 없어 제출물을 먼저 수동 삭제해야 함.)
  - `app.js`의 `renderProfAssignList()`: 과제 폴더 카드마다 삭제(휴지통) 버튼 추가(체크박스 스위치
    옆, `event.stopPropagation()`으로 폴더 열기와 분리). 제출물이 있으면 "N건도 함께 영구 삭제됩니다"
    경고를 confirm에 포함.
  - `style.css`: `.assign-folder-controls`/`.assign-folder-del` 추가(캐릭터 카드 삭제 버튼과 같은 톤).
- **제출물 PDF 일괄 다운로드**:
  - `app.js`에 `loadScriptOnce`/`ensureBulkPdfLibs`(jsPDF·html2canvas·JSZip을 "PDF 일괄 다운로드"
    버튼을 처음 누를 때만 CDN에서 불러옴 — 다른 사용자는 로드 비용 없음), `submissionToPdfBlob`
    (제출물 하나를 화면 밖에 그려 html2canvas로 캡처 → jsPDF로 A4 여러 페이지에 나눠 담음, 첨삭 완료된
    블록은 초록 박스로 함께 표시 — 기존 `buildReviewPairs`를 그대로 재사용), `bulkDownloadAssignmentPdfs`
    (학생별 PDF를 만들어 JSZip으로 묶어 zip 파일 하나로 다운로드, 진행 중 버튼 텍스트에 "(i/N)" 표시,
    실패한 건은 건너뛰고 마지막에 안내) 신규 추가.
  - `rProfAssignmentFolder`(과제 폴더 상세)에 "PDF 일괄 다운로드" 버튼 추가(제출물 없으면 비활성).
- **검증**: 실제 로그인/D1은 이 환경에서 재현 불가해, `apiFetch`를 목(mock)으로 바꿔치기해 Playwright로
  검증. (1) 삭제: 목록 2건 → 삭제 버튼 클릭 → confirm 경고 문구("제출된 과제 2건도 함께 영구 삭제됩니다")
  확인 → 목록 1건으로 감소. (2) PDF: jsdelivr가 이 샌드박스에서 막혀 있어 동일 버전 라이브러리를
  로컬에 받아 해당 CDN 요청만 가로채 응답(운영 코드는 무관) → 실제로 zip 다운로드 발생 → 압축 해제해
  PDF 2개(기획서 2쪽·글쓰기 1쪽, 긴 시놉시스가 자동으로 다음 페이지로 넘어감) 확인 → `pdftoppm`으로
  PNG 렌더링해 한글 텍스트와 첨삭 박스가 정상적으로 보이는 것까지 육안 확인함.

## 2026-08-19 (14) — 앱 전체 점검 중 발견: 실행취소 직후 "다시실행" 버튼이 클릭 안 되는 버그 수정

**요청**: "학습" 메뉴 추가 작업 이후 앱 전체 점검 요청. Playwright로 모든 탭(아이디어~콘티)을 실제
클릭·입력하며 점검하던 중, 실행취소(Ctrl+Z 아님, 상단 툴바의 "↩ 실행취소" 버튼) 클릭 직후
"↪ 다시실행" 버튼이 계속 비활성(disabled) 상태로 남아 마우스로는 눌리지 않는 버그를 발견함.

- **원인**: `doUndo()`/`doRedo()`가 `undoStack`/`redoStack`을 갱신한 뒤 `updateUndoButtons()`를
  호출하지 않아, 버튼의 `disabled` 속성이 갱신 전 상태로 남아있었음(`updateUndoButtons()`는
  `resetUndoHistory()`와 `commitUndoCheckpoint()`에서만 호출되고 있었음). 데이터 자체(undo/redo
  스냅샷 복원)는 정상 동작했지만, 버튼의 활성/비활성 표시만 어긋나 있어서 마우스 클릭으로는
  다시실행이 막혀 있었음 — 키보드 단축키(Ctrl+Y)는 버튼 상태와 무관하게 함수를 직접 호출하므로
  기존 (12)번 점검에서는 발견되지 않았던 것으로 보임.
- **수정**: `app.js`의 `doUndo()`/`doRedo()` 끝에 `updateUndoButtons();` 호출 추가.
- **검증**: Playwright로 (1) 아이디어 추가 → 800ms 대기(코얼레싱 타이머) → 실행취소 버튼 클릭 →
  다시실행 버튼이 즉시 활성화되는지, (2) 활성화된 다시실행 버튼을 실제 클릭했을 때 데이터가
  복원되는지, (3) 그 후 다시실행 버튼이 다시 비활성화되는지까지 순서대로 확인함.
- **함께 재확인**: 이 수정과 무관하게 idea/character/background/event/plan/plot/write/storyboard/
  learn 탭 전체를 재방문 + CRUD(아이디어 추가, 캐릭터 추가/이름수정/삭제, 필드 입력 후 탭 전환
  지속성)까지 다시 돌려 콘솔 에러 없음과 학습 카드 19장 데이터 정합성을 재확인함(문제 없음).

## 2026-08-19 (13) — 좌측 메뉴에 "학습" 탭 신규 추가 (스토리텔링 구성요소 & 로그라인 설계 학습 카드)

**요청**: 업로드한 "스토리텔링 구성요소 & 로그라인 설계" 자료를 학생들이 학습할 수 있도록, 주제별
섹션으로 나눈 학습 카드 메뉴를 만들어달라는 요청. 카드뷰는 요약만 보이고, 클릭하면 상세 내용을
볼 수 있어야 함.

- **data.js**: 업로드 문서를 파싱해 `LEARN_SECTIONS` 배열 신규 추가 — 섹션 2개(①`elements`: 스토리텔링
  10대 구성요소 10장, ②`logline`: 로그라인 설계 요소 9장, 총 19장). 카드마다 `num/title/summary`(카드
  앞면 요약)와 `rows`(표 형태 항목) 또는 `bullets`(나열형 항목), `notes`(참고 메모, 인물 카드의
  "평면적↔입체적" 등)를 담음.
- **app.js**: `rLearn()`(학습 탭 메인 — 섹션별로 `learn-grid`에 요약 카드 나열), `learnCardMini()`
  (카드 앞면), `learnDetailPage()`(뒤로가기 버튼 + 표/목록/메모 상세, 팝업이 아니라 같은 탭 안에서
  페이지 전환하는 기존 관례 그대로 적용 — `learnDetailFor` 모듈 상태값으로 분기) 신규 추가. `render()`의
  `renderers` 맵에 `learn:rLearn` 등록.
- **index.html**: 사이드바에 "학습" `nav-group`과 `data-tab="learn"` 탭 버튼 추가(콘티 그룹과 교수
  그룹 사이, 학생·교수 구분 없이 항상 노출).
- **style.css**: `.learn-section/.learn-formula/.learn-grid/.learn-card-mini/.learn-table/.learn-bullets/
  .learn-notes` 등 신규 클래스 추가(기존 캐릭터 갤러리 카드와 같은 톤의 디자인 토큰 재사용).
- 검증: Playwright로 로컬 정적 서버 구동 후 학습 탭 클릭 → 19개 카드 렌더 확인 → 표형 카드(인물)와
  나열형 카드(주인공 유형) 각각 클릭해 상세 페이지(표 6행 / 불릿 15개)와 "← 목록으로" 복귀까지 확인.

## 2026-08-19 (12) — 화면 상단 가운데 저장 상태 배너 추가 (+ 캐릭터 사진 제거 버튼·단축키는 기존에도 정상 동작 확인)

**요청**: "캐릭터 세부 설정창에서 제거 버튼이 작동 안해. 그리고 ctrl+z,y 와 ctrl+s 와 같은 단축키도
적용해줘. 그리고 저장시 화면 상단 가운데에 *저장중* 과 *저장됨* 메세지가 보이도록 해줘."

- **점검 결과 (수정 불필요)**:
  - 사진 "제거" 버튼(`#charImgRemove`): Playwright로 캐릭터 추가 → 실제 이미지 파일 업로드 →
    제거 클릭까지 재현했으나 정상 동작함(`ch.image`가 빈 문자열로 바뀌고 버튼도 다시 비활성화됨).
    코드상 문제를 찾지 못함 — 브라우저가 이전 버전의 app.js를 캐시하고 있을 가능성이 커서, 강력
    새로고침(Ctrl+Shift+R)을 먼저 권장. 그래도 안 되면 어떤 상황에서 안 눌리는지(사진 올린 직후인지,
    기존에 저장해둔 캐릭터를 다시 열었을 때인지 등) 더 구체적인 재현 방법이 필요.
  - Ctrl+Z/Shift+Z/Y(실행취소·다시실행), Ctrl+S(즉시저장)는 이미 `app.js`(377번째 줄 부근, undo/redo
    버튼 툴팁에도 이미 "(Ctrl+Z)"로 안내돼 있음)에 구현돼 있었고, Playwright로 캐릭터 이름 입력 →
    Ctrl+Z → Ctrl+Y 순서로 재현해 정상 동작 확인함. 별도 수정 없음.
- **실제 수정**: 화면 상단 가운데 저장 상태 배너(`#saveToast`) 신규 추가.
  - **index.html**: `<div id="saveToast" class="save-toast" hidden></div>`를 body 최상단에 추가.
  - **style.css**: `.save-toast`(고정 위치, 상단 중앙, 캡슐 모양)와 상태별 색상(`.saving`=주황,
    `.saved`=초록, `.error`=빨강) 추가.
  - **app.js**: `showSaveToast(state)` 함수 신규 — `save()`/`forceSaveNow()`에서 로그인 상태면
    "저장 중…"을 즉시 띄우고(서버 저장은 실제로 비동기라 지연이 있음), 비로그인(로컬 전용)이면
    로컬 저장이 즉시 끝나므로 바로 "저장됨"을 띄움.
  - **auth.js**: `doServerSave()` 완료 시점(성공/실패 응답을 받은 직후)에 `showSaveToast("saved"|"error")`
    호출을 추가해, 실제 서버 저장이 끝나는 시점에 맞춰 배너가 "저장됨"/"저장 실패"로 바뀌도록 연결.
  - 검증: Playwright로 (1) 비로그인 상태 저장 → 즉시 "저장됨" 배너 확인, (2) `getToken`/`apiFetch`를
    가짜 함수로 대체해 로그인 후 저장 흐름을 흉내 → 저장 직후 "저장 중…", 약 600ms 디바운스 + 서버
    응답 후 "저장됨"으로 바뀌는 것 확인.

## 2026-08-19 (11) — MBTI 드롭다운에도 에니어그램처럼 한 줄 요약 추가

**요청**: "mbti 드롭다운에서도 간략한 설명 넣어줘. 애니어그램처럼." — (9)에서 선택 후 아래에 뜨는 상세
설명(MBTI_DESC)은 이미 있었지만, 드롭다운 옵션 자체에는 에니어그램(`1번 개혁가 — 원칙적·완벽주의·옳음
추구`)과 달리 MBTI 코드만 나열돼 있었음.

- **data.js**: `MBTI_SHORT`(16개 유형별 3단어 내외 요약, 예: `ISTJ: "책임감·원칙·현실주의"`) 신규 추가.
- **app.js**: `charDetailPage`의 `mbtiOpts` 생성부를 `${m}` → `${m} — ${MBTI_SHORT[m]}`로 변경해
  드롭다운 옵션에서도 에니어그램과 같은 형식으로 보이게 함.
- 검증: Playwright로 캐릭터 추가 화면의 MBTI select 옵션 텍스트를 직접 읽어 "ISTJ — 책임감·원칙·현실주의"
  형식으로 정상 표시되는지 확인.

## 2026-08-19 (10) — 캐릭터 추가/상세 화면을 팝업→페이지로 전환, 배경 설정 페이지와 동일한 너비로 통일

**요청**: "캐릭터 추가화면과 세부설정 화면을 페이지 형태로 수정해주고, 배경설정 페이지와 동일한 너비로
맞춰줘. 그리고 MBTI도 종류별로 설명을 넣어줘." (MBTI 설명은 (9)에서 이미 추가돼 있었음 — 이번엔 화면
구조 변경만 진행)

- **app.js**:
  - "＋ 캐릭터 추가" 클릭 시 `charModalFor`(팝업)를 열던 것을 `charDetailFor`(상세 페이지)를 열도록 변경
    — 신규 생성과 기존 수정이 이제 완전히 같은 화면(`charDetailPage`)을 공유함.
  - 팝업 전용이던 `charModal(ch)` 함수와 `charModalFor` 상태, `rChar()`의 팝업 렌더 분기를 전부 제거
    (더 이상 팝업 경로가 없으므로 죽은 코드 정리).
  - 너비를 배경 설정 페이지와 맞추기 위해, 배경 설정이 쓰는 것과 동일한 방식을 그대로 재사용:
    (1) `render()`의 `#app.wide` 토글 조건에 `activeTab==="character" && charDetailFor`를 추가해
    캐릭터 상세 페이지에서도 `main`의 860px 폭 제한을 해제하고, (2) `rChar()`에서 `charDetailPage(dch)`를
    `.setting-split > .setting-main`(배경 설정이 쓰는 60% 폭 컨테이너)으로 감싸서 반환. 별도의 고정
    px 값을 새로 만들지 않고 기존 CSS를 그대로 재사용해, 화면 크기가 달라져도 배경 설정 페이지와
    항상 같은 비율로 넓어지고 좁아짐(1023px 이하에서는 둘 다 전체 폭으로 전환되는 것까지 동일).
- **style.css**: 이제 쓰이지 않는 `.char-modal{width:560px}` 규칙 삭제, `.char-detail-page{max-width:640px}`
  고정폭 제거(폭은 위 `.setting-main`에서 결정되므로 불필요).
- **검증**: Playwright 헤드리스로 실제 앱 로드 → 로그인 오버레이 제거 후 캐릭터 탭 진입 → "＋ 캐릭터
  추가" → 이름/MBTI(INFP)/에니어그램(4번 예술가)/직업 입력 → 설명 박스에 해당 유형 설명이 뜨는 것 확인
  → "← 캐릭터 목록으로"로 돌아가 갤러리에 정상 반영 → 다시 클릭해 입력값이 그대로 보존되는지 확인.
  배경 설정 페이지와 캐릭터 상세 페이지의 카드 `boundingClientRect` 폭을 여러 뷰포트(820~1920px)에서
  비교해 항상 거의 동일(오차 1% 이내, 좁은 화면에서는 완전히 동일)함을 확인.

## 2026-08-19 (9) — 캐릭터 설정 페이지 리서치 반영: MBTI/에니어그램 유형 설명 + 항목 5종 추가

**요청**: 캐릭터 설정 페이지 개선을 위한 리서치(업계 캐릭터 시트 대비 비어 있는 항목 조사) 진행 후,
그 내용을 반영해 (1) MBTI/에니어그램 선택 시 유형에 대한 자세한 설명이 보이도록, (2) 리서치에서
제안한 항목들을 실제로 추가해달라는 요청.

- **data.js**: `MBTI_DESC`(16개 유형별 3문장 내외 상세 설명, 캐릭터 작법 관점) 신규 추가. 기존
  `ENNEAGRAM` 배열의 각 항목에 `long`(상세 설명) 필드 추가(기존 `d`는 드롭다운 짧은 라벨용으로 유지).
- **app.js**:
  - `wireTypeDesc(body)` 함수 신규 — MBTI/에니어그램 select 아래에 `.type-desc-box`를 두고, 선택이
    바뀔 때마다 해당 유형의 상세 설명을 즉시 보여줌(캐릭터 편집 팝업 `charModal`, 상세 페이지
    `charDetailPage` 양쪽에서 공용으로 사용).
  - `blankChar()`에 리서치에서 우선순위로 제안한 5개 항목 필드 추가: `job`(직업/신분),
    `affiliation`(소속/세력), `strength`(강점), `secret`(비밀), `charmPoint`(매력 포인트/시그니처 소품).
    덤으로 `arcType`(인물호 유형)도 추가 — 기존 "아이디어 탐색"의 `STORY_GUIDE_SLOTS`의 "변화" 옵션
    목록을 그대로 재사용해 데이터 중복 없이 select로 제공.
  - `charModal`(팝업)에는 직업/신분·소속/세력·강점·비밀을 추가하고, `charDetailPage`(상세 페이지)에는
    같은 항목에 더해 매력 포인트/시그니처 소품, 인물호 유형 select까지 추가.
- **style.css**: `.type-desc-box` 스타일 추가(내용 없으면 자동 숨김).
- DB 스키마 변경 없음(캐릭터 데이터는 프로젝트 JSON에 저장되는 구조라 필드 추가만으로 반영됨).

## 2026-08-19 (8) — [+ 아이디어 생성] 버튼의 브라우저 기본 prompt()를 커스텀 팝업으로 교체

**요청**: (7)에서 고친 뒤에도 "화면 상단에 뜬다"는 신고가 다시 들어옴. 확인해보니 사용자가 말한
팝업은 [+ 아이디어 가져오기](이미 (7)에서 고친 `.plot-modal-overlay` 커스텀 팝업)가 아니라
[+ 아이디어 생성] 버튼이 띄우는 **브라우저 기본 `prompt()`** 창이었음. `prompt()`/`alert()`/`confirm()`
같은 네이티브 브라우저 대화상자는 항상 브라우저 창 상단(주소창 바로 아래)에 뜨고, 위치가 CSS로 전혀
제어되지 않기 때문에 (7)의 CSS 수정이 적용될 수 없는 대상이었음.

- **진단**: `AskUserQuestion`으로 어느 버튼의 팝업인지 확인 → [+ 아이디어 생성] 확정
- **app.js** 수정 — `createIdeaInSection(sec)`에서 `prompt("새 아이디어 내용을 입력하세요:", "")`를
  없애고, 다른 팝업들과 같은 `.plot-modal-overlay.center-content` + `.plot-modal` 구조의 커스텀
  팝업(제목 "아이디어 생성 · {섹션명}" + textarea + [+ 추가] 버튼, Ctrl/Cmd+Enter로도 추가)으로 교체.
  (7)에서 만든 `center-content` 클래스를 그대로 재사용해 [가져오기] 팝업과 동일하게 작업 영역
  가운데에 뜨도록 함
- 검증: Playwright 헤드리스로 실제 화면 로드 → [+ 아이디어 생성] 클릭 → 팝업 좌표(`getBoundingClientRect`)
  로 위/아래 여백이 같음(완전한 세로 중앙) 확인 + 스크린샷으로 육안 확인

**요청**: "플롯생성의 아이디어 추가 버튼 눌렀을때 나오는 팝업창을 화면 가운데로 바꿔줘."

- **원인 진단**: `.plot-modal-overlay`는 `position:fixed;inset:0`이라 브라우저 창 전체를 기준으로
  가운데 정렬되는데, 왼쪽에 사이드바(220px, 접으면 44px)가 항상 떠 있어서 "창 전체 가운데"가 실제
  작업 영역(사이드바 오른쪽) 기준으로는 왼쪽으로 치우쳐 보임. Playwright로 실제 앱을 헤드리스
  렌더링해서 좌표를 재보고(로그인 우회 후 `render()` 직접 호출) 눈으로도 스크린샷 확인함 — 수정 전:
  뷰포트(1280px) 기준 정중앙(x=640)이라 콘텐츠 영역(220~1280) 기준으로는 왼쪽으로 치우침. 수정 후:
  콘텐츠 영역 기준 정중앙(x=750)으로 이동, 스크린샷으로도 확인
- **app.js** 수정 — `plotPickerModal(sec)`(플롯 생성의 "아이디어 가져오기" 클릭 시 뜨는 아이디어 선택
  팝업)의 오버레이에 `center-content` 클래스 추가(다른 팝업들은 그대로 두고 이 팝업만 대상)
- **style.css** 수정 — `.plot-modal-overlay.center-content{left:var(--sidebar)}` +
  `body.sb-collapsed .plot-modal-overlay.center-content{left:44px}` 추가 — 사이드바 폭만큼 뺀
  영역을 기준으로 flex 가운데 정렬되도록 함(사이드바 접힘 상태도 반영)
- 검증: Playwright(헤드리스 Chromium, 이 세션에 미리 설치돼 있음)로 정적 서버를 띄워 실제 index.html/
  app.js/style.css를 그대로 로드하고, 로그인만 우회(가짜 `currentUser`/`DB`/`P` 주입)해서 플롯 탭 →
  아이디어 가져오기 팝업을 열어 좌표(`getBoundingClientRect`)와 스크린샷으로 직접 확인. 사이드바
  펼침/접힘 두 상태 모두 확인함

**요청**: "학생계정의 첨삭보기도 페이지 형태로 해줘." — (5)에서 만든 [첨삭 보기] 버튼이 아직 팝업
(`.plot-modal-overlay`)이었는데, 교수 쪽 과제 관리처럼 페이지 전환으로 바꿔달라는 요청.

- **app.js** 수정
  - 상태값 `feedbackPage` 신설: `null`(평소 탭 화면) / `{type, mode:'list'}`(제출 목록) /
    `{type, mode:'detail', id}`(상세: 원본+첨삭+내 작업물에 반영). 교수 쪽 `profAssignFolderId`/
    `profReviewId` 패턴과 동일하게, 라우터 없이 그 탭 렌더 함수 맨 앞에서 상태값을 체크해 분기함
    ([[project-storyhelperlite-popup-to-page-pattern]] 참고)
  - `rPlan()`/`rPlot()`/`rWrite()` 맨 앞에 `if(feedbackPage && feedbackPage.type==="해당타입"){
    rFeedbackPage(); return; }` 추가 — 즉 [첨삭 보기]는 그 버튼을 누른 탭(기획서/플롯/글쓰기) *안에서*
    페이지로 전환되고, 다른 탭으로 이동하면 그 탭은 원래 화면 그대로 보임
  - `openMyFeedbackListModal(type)`(팝업) → `rFeedbackList(type)`(페이지)로, `openMySubmissionView(id)`
    (팝업) → `rFeedbackDetail(type, id)`(페이지)로 교체. 둘 다 `app`에 카드로 붙고 "← 돌아가기/←
    목록으로" 버튼으로 이동. 상세 페이지의 [내 작업물에 반영] 버튼을 누르면 반영 후 페이지를 완전히
    벗어나(`feedbackPage=null`) 바로 탭의 평소 화면(반영된 결과)이 보이도록 함
  - `showFeedbackPage(type)` 신설 — 탭 헤더의 [첨삭 보기] 버튼, 글쓰기 탭 툴바의 [첨삭 보기] 버튼이
    이제 이 함수(상태값 세팅 + `render()`)를 호출
  - [제출] 모달 안의 "이미 N회 제출함 · 첨삭 완료(보기)" 링크도 팝업(`openMySubmissionView`) 대신
    같은 페이지 전환(`feedbackPage={type, mode:'detail', id}`)을 쓰도록 변경 — 첨삭 보기로 들어가는
    두 경로(전용 버튼 / 제출 모달 안 링크)가 이제 완전히 같은 화면을 씀
- 검증: `node --check app.js` 통과, `openMyFeedbackListModal`/`openMySubmissionView` 남은 참조 없음
  확인

**요청**: "첨삭 과제 보는 버튼을 제출 버튼 옆에 따로 만들어줘." — 지금까지는 [제출]을 눌러 모달을 열고
그 안에서 "이미 제출함 · 첨삭 완료(보기)" 링크를 찾아야만 첨삭 결과를 볼 수 있었는데, 이 경로가
눈에 잘 안 띄어서 첨삭 보기 전용 버튼을 따로 요청함.

- **app.js** 수정
  - `openMyFeedbackListModal(type)` 신설 — `student-assignments` API(과제 목록 + `mySubmissions`)를
    그대로 재사용해, 해당 타입(기획서/플롯/글쓰기)으로 내가 제출한 것들만 모아 제출일 최신순으로
    나열. 클릭하면 기존 `openMySubmissionView(id)`(원본+첨삭 보기, 첨삭 전이면 "아직 첨삭 전입니다")
    그대로 열림
  - `submitBtnHtml()`/`wireSubmitBtn()`(기획서·플롯 탭에서 공용으로 씀) — `.submit-tab-btn`(제출)
    옆에 `.feedback-tab-btn`(첨삭 보기) 버튼을 추가하고 `.submit-btn-group`으로 함께 묶음
  - 글쓰기(write) 탭은 제출 버튼이 `submitBtnHtml()`을 안 쓰고 툴바에서 따로 만들고 있어서(`rWrite()`
    안, `barRight`) 그쪽에도 동일하게 "첨삭 보기" 버튼을 별도로 추가
- **style.css** 수정 — `.submit-btn-group{display:flex;gap:6px;flex-shrink:0}` 추가(카드 헤더의
  `card-h2-row`가 `space-between`이라 버튼 2개를 하나의 flex 아이템으로 묶어야 h2 반대편 끝에 나란히
  붙음)
- 검증: `node --check app.js` 통과

**요청**: "반환한 과제를 제출한 과제에 덮어씌우면 안될까?" → 확인해보니 학생의 실제 작업물(기획서/
플롯/글쓰기 탭에서 편집 중인 프로젝트)에 첨삭 내용을 반영하고 싶다는 뜻이었음.

- **배경**: 지금까지 교수의 첨삭은 `submissions.feedback`에만 저장되고, 학생이 보는 것도 별도의
  읽기전용 팝업(`openMySubmissionView`)뿐이었음 — 학생의 실제 프로젝트 데이터(P.planDoc/P.plotDoc/
  P.writeDoc)에는 절대 자동으로 합쳐지지 않는 구조(주석: "제출물은 교수 계정 자신의 작품에 절대
  합쳐지지 않는다"와 대칭되게, 학생 쪽도 제출은 스냅샷 복사본이라 원본과 완전히 분리돼 있었음)
- **app.js** 수정
  - `applyFeedbackToProject(type, feedback)` 신설 — 타입별로 반영 방식이 다름:
    - **기획서(plan)**: `PLAN_FIELDS` 항목별로 그대로 대입(손실 없음, 가장 안전)
    - **플롯(plot)**: 섹션의 `desc`(설명)에 첨삭 텍스트 전체를 대입. 배치된 아이디어 카드(ideaIds)는
      건드리지 않음 — 첨삭 텍스트 안의 "[아이디어]" 목록은 원본 아이디어 블록과 다시 연결할 방법이
      없어서 구조적으로 되돌릴 수 없기 때문(제출 시 desc+아이디어 텍스트를 합쳐서 하나의 텍스트로
      만든 뒤라 원래 경계가 사라짐)
    - **글쓰기(write)**: `parseFeedbackTextToItems()` 신설 — "이름: 대사" 형식의 줄만 대사(line)
      아이템으로, 나머지는 지문(text) 아이템으로 되돌려 블록의 `items`를 재구성. 분기(branches)는
      제출 시점에 이미 하나의 텍스트로 합쳐져 사라졌기 때문에 복원 안 됨(기존 제한과 동일선상)
  - `openMySubmissionView()`(학생이 자기 제출물+첨삭 보는 팝업)에 **[이 첨삭 내용을 내 작업물에
    반영]** 버튼 추가. 누르면 confirm()으로 "지금 작업 중인 OOO 작품에 덮어쓴다"는 경고 후 실행 —
    자동 반영이 아니라 학생이 직접 눌러야만 실행되도록 해서, 제출 이후 학생이 더 진행한 작업이 실수로
    사라지지 않게 함. 타입별 한계(위 caveat)도 화면에 함께 안내
  - **다른 작품(프로젝트)에 잘못 반영되는 것 방지**: 제출 당시 프로젝트 이름(`projectName`)과 지금
    열려있는 작품 이름(`P.name`)이 다르면 화면에 빨간 경고 문구를 띄움(이 앱은 학생도 여러 "작품"을
    가질 수 있는 구조라, 첨삭 반영 시점에 다른 작품이 열려있으면 엉뚱한 곳에 덮어쓸 위험이 있음).
    다만 프로젝트는 id가 아니라 이름으로만 저장되어 있어(작품 rename 시 못 걸러냄) 완벽한 차단은 아니고
    경고만 함
- **functions/api/student-submission.js** 수정 — 응답에 `projectName`(제출 당시 프로젝트 이름)이
  빠져 있어서(컬럼은 저장돼 있었지만 SELECT에 없었음) 추가함
- 검증: `node --check app.js` 통과. jsdom 미설치라 실제 렌더링 확인은 못 했고 코드 리뷰로 재검토함 —
  특히 write 타입은 "이름: 대사" 패턴 되돌리기가 휴리스틱이라(예: 대사가 아닌 문장에 콜론이 있으면
  오인식 가능) 실제 화면에서 몇 개 블록으로 꼭 확인 권장

**증상**: 사용자가 실제 화면에서 확인해보니, 과제 폴더 페이지·첨삭 페이지의 제목(`<h2>`)에 아이콘이
그려지지 않고 `<svg class="icon" ...>...</svg>` 마크업 문자열이 글자 그대로 화면에 보임(2026-08-19
(2)에서 만든 `rProfAssignmentFolder`/`rProfSubmissionReview`의 버그).

- **원인**: 데이터를 불러온 뒤 제목을 다시 채우는 부분에서 `titleEl.textContent = \`${ICONS.book} ...\``
  처럼 아이콘 SVG 문자열이 섞인 템플릿을 `textContent`에 대입함. `textContent`는 HTML을 파싱하지 않고
  그대로 문자로 꽂아 넣으므로 아이콘이 렌더링되지 않고 SVG 태그 글자가 그대로 보였음. (참고로 초기
  로딩 중 "불러오는 중…" 상태의 뒤로가기 버튼·제목은 `c.innerHTML=...`로 만들어져서 정상 표시됐고,
  데이터 로딩이 끝난 뒤 제목만 다시 채우는 이 두 줄만 문제였음)
- **수정**: `app.js`의 `rProfAssignmentFolder()`(제출함 제목)와 `rProfSubmissionReview()`(첨삭 제목)에서
  아이콘이 섞인 제목을 채우는 두 줄을 `titleEl.textContent=...` → `titleEl.innerHTML=...`로 변경
- 검증: `node --check app.js` 통과. 사용자가 준 스크린샷 기준으로 동일 패턴(`.textContent`+아이콘)이
  남아있는 곳이 더 있는지 전체 재검색해 없음을 확인

**요청**: (1) 과제 폴더를 클릭하면 팝업 대신 페이지로 보이게 할 것. (2) 학생 제출물을 클릭했을 때(첨삭
화면)도 팝업이 아닌 페이지로 뜨게 할 것. (3) 첨삭 화면에서 모든 블록을 미리 첨삭용으로 만들지 말고,
원본 블록을 우클릭해 "첨삭"을 선택해야 그 블록만 위(이전 버전)/아래(첨삭 입력란)로 분리되게 할 것.
(4) 분리 디자인은 사용자가 준 CSS(`.version-prev`/`.version-prev-toggle`/`.version-prev-text`/
`.diff-bg`/`.ta-wrap.version-current`)를 참고. (5) 교수가 첨삭을 학생에게 돌려주는 [피드백] 버튼을
만들고, 그 결과도 원본/첨삭이 위아래로 보이는 같은 디자인으로 보여줄 것.

- **app.js** 수정
  - `openAssignmentFolder`(팝업)를 `rProfAssignmentFolder(id)`(페이지)로, `openSubmissionReview`
    (팝업)를 `rProfSubmissionReview(id)`(페이지)로 교체. 둘 다 `app`에 카드로 붙고 "← 목록으로/←
    제출함으로" 버튼으로 뒤로 갈 수 있음(팝업 오버레이 방식 폐기, `.plot-modal-overlay` 미사용)
  - "과제 관리" 탭 안에서 화면 전환을 위한 상태값 `profAssignFolderId`/`profReviewId` 신설.
    `rProfAssignments()`가 이 값들을 보고 목록/폴더(제출함)/첨삭 중 어느 화면을 그릴지 분기.
    `renderProfAssignList()`의 폴더 클릭, `rProfAssignmentFolder()`의 제출물 클릭 핸들러가 팝업
    호출 대신 이 상태값을 세팅하고 `render()`만 호출하도록 변경
  - `buildReviewPairs()` — 각 항목(plan 필드/plot 섹션/write 블록)에 안정적인 `id`를 추가(기존엔
    배열 인덱스만 있어서 개별 블록을 식별할 수 없었음)
  - `renderReviewPairs(container, pairs, editable, splitIds)` 신설 — 기본은 원본 텍스트 한 줄
    (`.plan-block.review-before`)만 보여주고, "분리된" 블록만 `.version-prev`(위, 접기 가능, 원본에서
    지금 첨삭 내용과 달라진 단어만 `.diff-bg`로 강조)와 `.ta-wrap.version-current`(아래, 교수 화면은
    `<textarea>`로 편집, 학생 화면은 읽기전용 텍스트)로 분리해서 그림. `editable=true`(교수)는 우클릭
    가능·textarea 입력 시 diff 실시간 갱신, `editable=false`(학생)는 원본과 실제로 달라진 블록만
    자동으로 분리해서 보여주고 나머지는 한 줄만 표시
  - `diffPrevHtml(before, after)` 신설 — 단어 단위 LCS 기반 diff로 이전 텍스트에서 지금과 달라진
    부분만 `<span class="diff-bg">`로 감싼 HTML 생성
  - `openReviewBlockCtxMenu(...)` 신설 — 기존 `#ctxMenu` 공용 우클릭 메뉴 재사용. 원본(미분리)
    블록이면 [첨삭](→ 위/아래로 분리), 이미 분리된 블록이면 [원본 보기로 되돌리기](입력 중이던 첨삭
    내용은 유지한 채 다시 한 줄 보기로 되돌림)
  - `rProfSubmissionReview()` — 불러오자마자 원본과 첨삭 내용이 이미 다른 블록(= 이전에 저장된 첨삭이
    있는 블록)은 자동으로 분리된 채 보여줌. 저장 버튼 라벨을 "첨삭 저장" → "피드백 전달"로 변경(교수가
    학생에게 첨삭을 돌려준다는 의미를 명확히 함)
  - `openMySubmissionView()`(학생이 자기 제출물+첨삭 결과 보는 팝업, 그대로 유지)도 새
    `renderReviewPairs(..., false, null)`를 사용하도록 교체 — 첨삭 완료된 항목은 원본/첨삭이 같은
    위/아래 분리 디자인으로 보이고, 변경 없는 항목은 한 줄만 보임
- **style.css** 수정 — `.review-pair.split{gap:0}` 추가(분리된 블록은 위아래가 여백 없이 붙도록),
  사용자가 준 CSS 그대로 `.version-prev`/`.version-prev-toggle`/`.version-prev-text`/
  `.version-prev.collapsed`/`.diff-bg`/`.ta-wrap.version-current` 추가 + `.ta-wrap` 기본 스타일(테두리·
  배경·패딩)은 기존 `.plan-block`과 동일하게 신설. `.block-add-row`/`.write-add-block`/
  `.block-add-small`은 이번 기능(블록 추가가 아니라 "우클릭 → 첨삭"만 필요)과 무관하고, 특히
  `.write-add-block`은 글쓰기 탭에 이미 다른 값으로 정의돼 있어 그대로 추가하면 그 탭 스타일이
  깨지므로 의도적으로 가져오지 않음
- 검증: `node --check app.js` 통과. jsdom 미설치 상태라(이 세션의 /tmp 클론엔 node_modules 없음) 실제
  브라우저 렌더링 확인은 못 했고, 로직을 코드 리뷰로 재검토함 — 사용자가 실제 화면에서 한 번 확인해줄
  것을 권장

**요청**: 플롯 생성 페이지의 [+아이디어 추가] 버튼을 누르면 아이디어 수집에서 먼저 아이디어를
만들라는 메시지가 뜨는 문제. [+아이디어 가져오기](아이디어 수집에서 골라오기)와 [+아이디어 생성]
(플롯 생성에서 바로 새 블록 작성)으로 버튼을 분리하고, 새로 만든 블록을 우클릭하면 아이디어 수집
페이지로 보내는 메뉴도 추가해달라는 요청.

- **app.js** 수정
  - `plotSectionCard()` — 섹션 헤더의 아이디어 추가 아이콘 버튼 1개(`addBtn`)를 `importBtn`(＋아이디어
    가져오기, 기존 `togglePicker` 피커 그대로 연결)과 `createBtn`(＋아이디어 생성, 신설
    `createIdeaInSection` 연결) 2개로 분리. 섹션 바닥의 점선 박스도 `addBox` 1개 → `importBox`/
    `createBox` 2개(`.plot-add-row`로 가로 배치)로 동일하게 분리, 드래그 드롭 수신은 두 박스 모두 유지
  - `createIdeaInSection(sec)` 신설 — `prompt()`로 텍스트를 입력받아 `P.ideaBlocks`(아이디어 수집과
    동일한 저장소)에 새 블록을 만들고 바로 해당 섹션의 `ideaIds`에 배치. 같은 저장소를 쓰므로 아이디어
    수집 목록에도 자동으로 나타남
  - `plotIdeaCard()` — 아이디어 카드에 `contextmenu` 리스너 추가, 우클릭 시 `openPlotIdeaCtxMenu`로
    기존 `#ctxMenu` 재사용 메뉴(다른 우클릭 메뉴들과 동일 패턴)를 띄움. 메뉴 항목 "아이디어 수집으로
    보내기" 클릭 시 `goToIdeaCollection(id)` 호출 — 아이디어 수집 탭으로 전환하고 해당 블록으로
    스크롤 + 잠깐 배경 강조(`idea-flash`, 1.6초). 새로 생성한 블록뿐 아니라 가져온 블록에도 동일하게
    적용(모든 아이디어가 같은 저장소를 쓰므로 구분할 이유가 없어 일관되게 적용)
  - `ideaBlockCard()` — `ideaHighlightId`가 자신의 id와 같으면 렌더 직후 스크롤·`idea-flash` 클래스
    부여(한 번 쓰고 바로 null로 리셋, `write` 탭의 `writeFocusTitle` 포커스 패턴과 동일한 방식)
- **style.css** 수정 — `.plot-add-box`를 `.plot-add-row`(flex) 안에 2개 배치하도록 `flex:1` 추가,
  `.idea-block`에 `background` 트랜지션과 `.idea-flash`(강조 배경색) 클래스 추가
- 검증: `node --check app.js` 통과

## 2026-08-18 (15) — 기획서 뷰어 폭 40%로 조정 + 앱 이름을 "스토리텔링 가이드"로 변경

**요청**: (1) 기획서 미리보기 영역이 너무 넓어 60:40 비율로 줄여달라는 요청. (2) 앱 이름을
"글쓰기도우미"에서 "스토리텔링 가이드"로 바꿔달라는 요청.

- **style.css** 수정 — `.setting-main`을 `flex:0 1 720px`(고정 px) → `flex:0 1 60%`로,
  `.setting-planview`를 `flex:1 1 0`(남는 공간 전부) → `flex:0 1 40%`로 변경(최소 폭 260px 유지)해
  좌 60% : 우 40% 비율이 되도록 함
- **이름 변경** — 사용자에게 노출되는 문자열만 "글쓰기도우미(StoryHelper)" → "스토리텔링 가이드"로
  교체(로그인 화면 로고, 상단바 로고, 브라우저 탭 제목, 하단 footer 링크, 정보 알림창(app.js),
  개인정보처리방침 페이지 제목·서비스명·돌아가기 링크(privacy.html), 아이디 찾기·비밀번호 재설정
  메일 본문·제목(functions/api/find-account.js), 발신자 표시명(functions/api/_utils.js), README.md
  제목, schema.sql 상단 주석)
  - **바꾸지 않은 것**: `localStorage` 키(`storyhelper_v1` 등 — 바꾸면 기존 사용자 데이터 유실),
    GitHub 저장소 이름·URL(`storyhelperlite`), Cloudflare 배포 도메인(`storyhelperlite.pages.dev`),
    CLAUDE.md의 내부 인프라 설명(레포/브랜치 이름 등). 이런 것들은 앱의 "표시 이름"이 아니라
    인프라 식별자라 그대로 유지해야 함
- 검증: `node --check app.js`, `functions/api/find-account.js`, `functions/api/_utils.js` 통과.
  jsdom으로 렌더링해 `document.title`, 상단바 로고, footer 링크가 모두 새 이름으로 바뀌었고 본문
  어디에도 옛 이름이 남아있지 않은지 확인. "배경 설정" 탭의 `.setting-split` 분할 화면도 정상 렌더링
  되는지 함께 확인(레이아웃 폭 비율은 jsdom이 실제 레이아웃을 계산하지 않아 CSS 값만 육안 검토)

## 2026-08-18 (14) — "배경 설정"·"사건 설정" 오른쪽에 기획서 미리보기(블록형 뷰어) 분할 화면 추가

**요청**: 두 페이지의 오른쪽 빈 공간에 "글쓰기" 탭처럼 화면을 분할해, "기획서 작성" 내용을 블록 형태
읽기 전용 뷰어로 띄워달라는 요청.

- **app.js** 수정
  - `renderPlanViewerInto(container)` 신설 — `P.planDoc`(일시·작성자 + `PLAN_FIELDS` 12개 항목)을
    `.plan-block` 스타일의 읽기 전용 블록으로 렌더링. 아직 작성 안 한 항목은 "아직 작성하지 않았습니다"
    표시, 기획서 자체가 비어 있으면 "기획서 작성" 탭으로 안내하는 문구를 보여줌
  - `mountWithPlanViewer(cardEl)` 신설 — 기존 카드(`c`)를 좌측(`.setting-main`)에, 위 뷰어를
    우측(`.setting-planview`)에 배치하는 `.setting-split` 레이아웃으로 `app`에 붙임(글쓰기 탭의
    `.write-layout`과 동일한 사고방식)
  - `rBg()`·`rEvent()`의 `app.appendChild(c)`를 `mountWithPlanViewer(c)`로 교체 (내부 로직은
    그대로 — `c`가 어디에 붙는지만 바뀌므로 기존 바인딩·용어사전/회차일지 리스트는 영향 없음)
  - `render()`의 `app.classList.toggle("wide", ...)` 조건에 `background`·`event` 탭 추가 — 두 탭도
    글쓰기 탭처럼 본문 폭 제한(860px)을 풀어 분할 화면이 충분한 공간을 쓰도록 함
- **style.css** 수정 — `.setting-split`/`.setting-main`/`.setting-planview`(글쓰기 탭의 미리보기처럼
  `position:sticky`) 및 `.plan-view-block`/`.plan-view-text` 스타일 추가. 화면이 1023px보다 좁아지면
  기획서 뷰어를 숨기고 본문이 폭을 다 쓰도록 함(글쓰기 탭의 반응형 규칙과 동일 패턴)
- 검증: `node --check app.js` 통과. jsdom으로 렌더링해 (1) 기획서가 비어있을 때 안내 문구,
  (2) 기획서에 값을 채운 뒤 14개 블록(일시·작성자+12항목)이 모두 뜨고 줄바꿈이 보존되는지,
  (3) 기존 폼 필드(`w_summary` 등) 바인딩이 그대로 동작하는지, (4) `event` 탭에서도 동일하게
  동작하는지, (5) 관련 없는 다른 탭(`idea`)에는 분할 화면·wide 클래스가 적용되지 않는지 확인

## 2026-08-18 (13) — "아이디어 탐색" 6개 카테고리 선택지 대폭 확장 (34개 → 63개)

**배경**: `STORY_GUIDE_SLOTS`(성격/목적/변화/세계관/플롯의 종류/엔딩) 각 카테고리가 4~6개 옵션뿐이라
선택 폭이 좁았음. 캐릭터 아크 3대 이론(긍정형/부정형/평탄형), 캐릭터 동기 카테고리, 크리스토퍼 부커의
7가지 기본 플롯, 웹툰 트렌드 장르·소재(로판/헌터물/회빙환 등)를 리서치한 뒤 반영.

- **data.js** 수정 — `STORY_GUIDE_SLOTS` 각 카테고리 옵션 확장(각 옵션에 새 `tip` 포함):
  - 성격 6→10, 목적 6→11, 변화 4→6(타락형을 환멸형/몰락형으로 세분화 + 시험형 추가),
    세계관 6→13, 플롯의 종류 6→15, 엔딩의 종류 6→8
  - 세계관·플롯의 종류 옵션 객체에 `group` 필드 추가(예: "클래식 장르"/"웹툰 트렌드 장르",
    "플롯 형태"/"웹툰 트렌드 소재") — 옵션이 많아진 카테고리를 optgroup으로 묶어 스캔하기 쉽게 함
- **app.js** 수정
  - `optionsToHtml(options)` 헬퍼 신설 — `group` 필드가 있으면 `<optgroup>`으로 묶고, 없으면(성격/목적/
    변화/엔딩처럼) 기존과 동일하게 평평한 옵션 목록을 만듦
  - `rExplore()`의 카테고리 select와 `rBg()`의 "세계관 유형" select 모두 이 헬퍼를 쓰도록 교체
  - 값 매칭은 기존처럼 문자열 비교라, 예전에 선택했던 값(예: 옛 "타락형(부정적 변화)")이 새 옵션
    목록에 없어도 자동으로 "직접 입력" 칸에 그 값 그대로 표시되어 데이터 손실 없음(기존 로직 그대로 활용)
- 검증: `node --check app.js`, `node --check data.js` 통과. jsdom으로 렌더링해 각 카테고리 옵션 개수
  (10/11/6/13/15/8) 확인, optgroup 개수(세계관 2개, 플롯의 종류 2개) 확인, 새 옵션 선택 시 미리보기·
  작법 안내가 정상 표시되는지 확인, 옛 값("타락형")이 자동으로 "직접 입력"에 보존되는지 확인,
  "세계관 설정" 탭의 "세계관 유형" select도 같은 방식으로 정상 렌더링되는지 확인

## 2026-08-18 (12) — "사건 설정" 페이지를 사건 단위 설계(목표→갈등→결과→여파) 구조로 확장

**배경**: 기존 "사건 설정"은 주요 사건(발단)/핵심 갈등/결말 방향 3개 필드뿐이었는데, "발단"·"결말"
같은 표현이 전체 이야기 구조(이미 "플롯 생성" 탭의 영역)와 겹치는 문제가 있었음. 소설 작법에서 말하는
"사건"의 정의(갈등의 결과로 인물의 가치·지위가 전환되는 것)와 드와이트 스웨인의 Scene-Sequel
프레임워크(목표→갈등→결과 / 반응→딜레마→결정)를 리서치한 뒤, 플롯 파트와 역할이 겹치지 않도록
"사건 하나를 어떻게 설계하는가"에만 집중해 페이지를 재구성.

- **app.js** 수정
  - `blankProject()`의 `event` 기본값에 `name, characters, agency, conflictType, goal, disaster,
    reaction, decision, transform, nextLink, log(배열)` 필드 추가. 기존 `main/conflict/ending`은
    그대로 유지(기존 데이터 손실 없음) — `conflict`는 "갈등·장애물" 필드로, `main`은 "사건 설명"으로,
    `ending`은 "결말 방향(선택, 플롯 파트와 중복 방지 안내 문구 추가)"으로 재배치
  - `fillProject()`에 `event.log` 배열 정규화 로직 추가(하위 호환)
  - `rEvent()` 전면 재작성 — "사건 개요 / 사건 설계(목표→갈등→결과) / 여파(반응→결정) / 인과·전환 /
    사건 관리(회차 일지)" 5개 섹션으로 구성. "사건 유형"(능동/피동)과 "갈등 유형"(내적/외적 — 인물 vs
    인물·자신·사회·자연·운명) select 추가. "사건 관리(회차 일지)"는 세계관 페이지의 "용어사전"과 동일한
    패턴(반복 카드, 추가/삭제)으로 사건명/관련 인물/발생 회차/파급효과/다음 사건 연결/클리프행어 여부를 관리
- 검증: `node --check app.js` 통과. jsdom으로 `index.html`을 로컬 HTTP 서버에 띄워 `render()` 호출 →
  새 필드 13개 DOM 존재 확인, 기존 필드(`e_conflict` 등) 바인딩 유지 확인, 회차 일지 추가/수정/삭제 동작
  확인, `fillProject()`로 옛 프로젝트(신규 필드 없는 구버전 데이터) 마이그레이션 정상 확인

## 2026-08-18 (11) — (10) 직후 탭/카드 이름을 "세계관 설정"에서 "배경 설정"으로 환원

바로 아래 (10)에서 "배경 설정"을 "세계관 설정"으로 바꿨는데, 요청에 따라 이름만 다시 "배경 설정"으로
되돌림(구성/필드는 그대로 유지). **index.html**의 사이드메뉴 라벨, **app.js**의 `rBg()` 카드 제목만 수정.

## 2026-08-18 (10) — "배경 설정" 탭을 "세계관 설정"으로 확장 (지리·역사·사회·규칙·문화·갈등·용어사전)

**배경**: 기존 "배경 설정" 탭은 한 줄 요약/시대/장소/세계의 규칙/사회·정치적 배경/분위기/세부 묘사
7개 필드뿐이라 세계관을 체계적으로 쌓기엔 항목이 부족했음. 해외 라이팅 가이드의 표준 세계관 요소
(지리/역사/정치/경제/문화/규칙체계/종교/갈등 등)와 웹툰 연재 특화 "설정 관리" 기법(검색어·첫 등장
회차·절대 규칙·독자 공개 범위·떡밥 회수 여부)을 리서치한 뒤, 그 구성대로 페이지를 확장.

- **app.js** 수정
  - `blankProject()`의 `world` 기본값에 `type, regions, timeline, politics, factions, economy,
    taboo, culture, language, conflict, glossary(배열)` 필드 추가. 기존 `summary/rules/era/place`와
    `background{social,mood,detail}`은 그대로 유지(기존 데이터 손실 없음)
  - `fillProject()`에 `world.glossary` 배열 정규화 로직 추가(옛 데이터에 없던 필드는 빈 배열/빈
    문자열로 채움 — 하위 호환)
  - `rBg()` 전면 재작성 — "기본 정보 / 지리·역사 / 사회 구조 / 규칙 체계 / 문화·일상 / 갈등·세력 구도 /
    설정 관리(용어사전)" 7개 섹션으로 구성. "세계관 유형" select는 기존 "작법 안내" 탭의
    `STORY_GUIDE_SLOTS`(worldview) 옵션을 재사용. "설정 관리(용어사전)"는 용어명/한 줄 정의/첫 등장
    회차/독자 공개 범위/떡밥 회수 여부/절대 규칙을 담는 반복 카드 리스트(추가/삭제 가능)
- **index.html** 수정 — 사이드메뉴 탭 라벨 "배경 설정" → "세계관 설정" (data-tab="background"는 그대로
  유지, 기존 저장된 activeTab 값과 호환)
- **style.css** 수정 — `.wv-glossary-list`, `.wv-term-head`, `.wv-term textarea` 스타일 추가(용어
  카드는 기존 `.plan-block` 박스 스타일 재사용)
- 검증: `node --check app.js`, `node --check data.js` 통과. jsdom으로 실제 `index.html`을 로컬
  HTTP 서버에 띄워 `render()` 호출 → 새 필드 17개 DOM 존재 확인, 입력 바인딩(P.world.\* 갱신) 확인,
  용어사전 추가/수정/삭제 동작 확인, `fillProject()`로 신규 프로젝트 및 **옛 프로젝트(신규 필드가
  아예 없는 구버전 데이터)** 양쪽 모두 정상 마이그레이션되는지 확인(모두 통과)

## 2026-08-18 (9) — 새 계정 가입 시 다른 계정 테스트 데이터가 그대로 보이던 버그 수정

**증상**: 새로 회원가입하면 빈 화면이어야 하는데, 같은 브라우저에서 예전에 다른 계정으로 테스트하며
썼던 작품 내용이 그대로 나타남.

**원인**: 로그인 화면이 뜨기 전 `app.js`의 `let DB = load();`가 이미 `localStorage`(키
`storyhelper_v1`)에 남아있던 값을 읽어 메모리에 올려두는데, 이 캐시는 계정별로 구분되지 않고 브라우저
전체에서 공유됨. `auth.js`의 `loadFromServer()`는 로그인/회원가입 성공 후 서버에 저장된 데이터가
없으면(신규 계정 등) "현재 로컬 데이터를 서버로 업로드"하도록 되어 있었는데, 이 "로컬 데이터"가 사실은
다른 계정으로 테스트하며 남긴 캐시였던 것. 원래 이 로직은 로그인 없이도 앱을 쓸 수 있던 예전 버전
(Google Drive 연동 시절)에서 "비로그인 상태로 작성한 내용을 첫 로그인 시 서버로 이전"하기 위한
것이었는데, 지금은 `#loginOverlay`가 항상 화면을 가려서 로그인 없이는 앱을 쓸 방법 자체가 없어져
이 마이그레이션 로직이 통째로 위험한 코드로만 남아있었음.

- **auth.js** 수정 — `loadFromServer()`에서 서버에 데이터가 없을 때, 기존 메모리의 DB를 그대로
  업로드하던 것을 제거하고 항상 빈 작품 하나(`blankProject(id,"내 첫 작품")`)로 새로 시작하도록 변경.
  이후 `save()`를 호출해 그 빈 상태를 로컬(localStorage)과 서버 양쪽에 반영
- 검증: `node -c auth.js` 통과

## 2026-08-18 (7) — 교수 코드 입력란 예시 수정 + 회원 관리에서 등급 직접 변경

**배경**: 설정 화면의 "교수 코드" 입력란 placeholder가 실제 studio.inknpen 교수 계정의 코드(360544)를
그대로 노출하고 있었음(학생들이 진짜 코드로 착각할 수 있음) → 예시용 임의 숫자로 교체 요청.
또한 회원 관리 표에서 등급(교수/학생)을 관리자가 직접 바꿀 수 있게 해달라는 요청.

- **auth.js** 수정 — `openSettings()`의 `#profCodeInput` placeholder "예: 360544" → "예: 123456"
- **functions/api/admin.js** 수정
  - `generateProfCode(env)` 추가(signup.js와 동일 로직 — 6자리 숫자, DB 중복 없을 때까지 재생성)
  - `POST /api/admin`에 `mode:"setRole"` 신설 — body `{userId, role:"student"|"professor"}`. 학생→교수로
    바꾸는데 기존 코드가 없으면 새로 발급, 교수→학생으로 바꾸면 코드를 지움
- **app.js** 수정 — `renderAdminUsers()`의 등급 열을 텍스트 대신 `<select>`(학생/교수)로 렌더링, 값이
  바뀌면 `doAdminSetRole()`이 확인창 후 `/api/admin`(setRole)을 호출하고 표를 새로고침. 관리자
  본인(byeorie) 행은 select를 비활성화(관리자 권한은 role과 무관해서 바꿀 이유가 없음)
- 검증: `node -c app.js`, `node -c auth.js`, `node --input-type=module -c < functions/api/admin.js` 통과.
  실제 배포 후 회원 관리 화면에서 테스트 계정(testuser...) 등급을 학생→교수로 바꿔 표에 코드가 새로
  생기는지, 교수→학생으로 되돌리면 코드가 사라지는지 확인 예정

## 2026-08-18 (6) — 관리자 계정을 studio.inknpen → byeorie 로 교체

**배경**: studio.inknpen은 교수 계정으로만 쓰고, 관리자 권한은 별도 계정 byeorie(교수님이 D1에서
직접 profh → byeorie 로 아이디를 바꿔둔 계정)로 옮기고 싶다는 요청.

- **functions/api/_utils.js** 수정 — `ADMIN_USERNAME` "studio.inknpen" → "byeorie"
- **app.js** 수정 — `ADMIN_USERNAME` 상수 동일하게 교체, 서버 초기화 안내 문구("관리자(...) 계정을
  제외한...")의 계정명 표기도 byeorie로 수정
- 참고: 관리자 권한은 DB에 별도 컬럼으로 저장되는 게 아니라 로그인한 아이디가 이 상수와 같은지만
  비교하는 방식이라, 이 상수만 바꾸면 byeorie 계정이 (role 값과 무관하게) 바로 관리자 권한을 갖고,
  studio.inknpen은 자동으로 관리자 권한을 잃음(교수 권한은 role='professor' 값을 그대로 유지하고
  있어 별도 변경 없이 계속 교수로 남음). DB 스키마 변경 없음 — D1에서 추가로 실행할 SQL 없음
- 검증: `node -c app.js` / `node -c functions/api/_utils.js` 통과, 코드 전체에 "studio.inknpen"
  문자열이 더 이상 남아있지 않음을 grep으로 확인(과거 기록용 schema.sql 주석·DEVLOG 이전 항목은
  기록 보존 차원에서 그대로 둠)

## 2026-08-18 (5) — 비밀번호를 잊었을 때 이메일로 아이디 안내 + 재설정 링크 발송

**배경**: profh(→studio.inknpen) 계정 비밀번호를 잊어버렸는데, 로그인 화면의 "아이디/비밀번호를
잊으셨나요?"는 이메일 확인만 하고 실제 메일 발송은 "준비 중"이었음 → 실제로 메일이 가도록 구현.

- **발송 방식**: 별도 유료 서비스 가입 없이, 교수님이 이미 쓰는 Gmail 계정으로 발송(Cloudflare
  Pages Functions에서 `cloudflare:sockets`로 smtp.gmail.com:465에 직접 접속해 SMTP 프로토콜을
  구현). **배포 후 Cloudflare 대시보드 → Pages 프로젝트 → Settings → Environment variables에
  `GMAIL_USER`(보내는 사람 gmail 주소), `GMAIL_APP_PASSWORD`(구글 계정의 "앱 비밀번호", 일반
  로그인 비밀번호 아님)를 추가해야 동작함** — 별도 안내 필요
- **schema.sql** 수정 — `password_resets`(token/user_id/생성·만료시각/사용여부) 테이블 신설(30분
  유효, 1회용) — Cloudflare D1 콘솔에서 수동 실행 필요
- **functions/api/_utils.js** 수정 — `sendEmail(env,{to,subject,text})` 신설: 최소 SMTP
  클라이언트(EHLO/AUTH LOGIN/MAIL FROM/RCPT TO/DATA, 멀티라인 응답 버퍼링, 제목 한글은 RFC2047
  `=?UTF-8?B?...?=`로 인코딩) 구현
- **functions/api/find-account.js** 수정 — 기존엔 "계정 확인됨" 메시지만 보여주던 것을, 실제로
  ①비밀번호 재설정용 1회용 토큰을 `password_resets`에 저장하고 ②이메일 본문에 가입 아이디 안내 +
  재설정 링크(`<사이트주소>/?reset=<토큰>`)를 담아 `sendEmail()`로 발송하도록 교체
- **functions/api/reset-password.js** 신규 — POST {token,newPassword}: 토큰 유효성(존재/미사용/
  기한내)을 검사해 비밀번호를 실제로 변경, 토큰은 사용 처리, 보안을 위해 해당 계정의 기존 로그인
  세션은 모두 삭제(재로그인 필요)
- **index.html** 수정 — 로그인 화면에 "새 비밀번호 설정" 패널(`#resetPanel`) 추가
- **auth.js** 수정 — 페이지 로드 시 주소창에 `?reset=토큰`이 있으면 로그인 화면 대신 새 비밀번호
  설정 패널을 바로 보여줌(기존 로그인 세션 자동 복원은 건너뜀). `resetPanel` 제출 시
  `/api/reset-password` 호출 → 성공하면 로그인 패널로 안내
- 검증: `node -c` 로 _utils.js/find-account.js/reset-password.js/auth.js 문법 확인, index.html
  `<form>` 개수 짝 확인. **Gmail SMTP 실제 발송 자체는 이 환경에서 직접 테스트할 수 없어(실제 구글
  계정 인증 필요), 배포 후 교수님이 직접 "비밀번호 찾기"로 한 번 테스트해봐야 함** — 앱 비밀번호가
  틀렸거나 미설정이면 화면에 "메일 발송에 실패했습니다: ..." 형태로 원인이 표시됨

## 2026-08-18 (4) — 교수 그룹 설정 (학생 가입 + 과제 등록/제출 + 첨삭)

**배경**: 위 단계에서 교수(studio.inknpen 등)가 6자리 코드를 받도록 만들어뒀으니, 이제 학생이 그 코드로
교수 그룹에 가입하고, 교수가 과제를 만들면 학생이 기획서/플롯/글쓰기 작업물을 제출하고, 교수가 그
제출물을 열람·첨삭할 수 있도록 하는 마지막 단계.

- **schema.sql** 수정 — `users`에 `prof_id`(학생이 가입한 교수의 id, 미가입이면 NULL) 컬럼 추가.
  `assignments`(과제: 교수id/제목/제출기한/제출열림여부) · `submissions`(제출물: 과제id/학생id/유형
  plan·plot·write/제출당시 작업물 JSON 스냅샷/첨삭 JSON/제출·첨삭시각) 테이블 신설 — **Cloudflare D1
  콘솔에서 수동 실행 필요** (교수님께 별도 안내)
- **functions/api/_utils.js** 수정 — `requireAuth()`가 `prof_code`/`prof_id`도 함께 조회해 `profCode`/
  `profId`로 반환, `requireProfessor()` 헬퍼 추가(로그인 + role이 professor인 계정만 통과)
- **functions/api/login.js**, **signup.js** 수정 — 응답 user 객체에 `profId` 포함
- **신규 API 8종**(모두 `node --check`로 문법 확인)
  - `student-join.js` — POST {code}: 6자리 코드로 교수를 찾아 `users.prof_id` 갱신(본인 코드로는
    가입 불가)
  - `professor-students.js` — GET: 내 그룹에 가입한 학생 명단
  - `professor-assignments.js` — GET(과제별 제출 건수 포함 목록)/POST {title,dueAt}(과제 생성)
  - `professor-assignment.js` — GET ?id=(해당 과제의 제출물 목록, 소유권 확인)/POST {id,open}(제출
    열림/마감 토글)
  - `professor-submission.js` — GET ?id=(제출물 상세, 소유권은 과제 조인으로 확인)/POST {id,feedback}
    (첨삭 저장)
  - `student-assignments.js` — GET: 내가 가입한 교수 정보 + 그 교수의 과제 목록(과제별 내 제출 이력
    포함)
  - `student-submit.js` — POST {assignmentId,type,projectName,data}: 과제 제출(가입 그룹·제출 열림
    여부 확인 후 현재 작업물 스냅샷을 그대로 저장)
  - `student-submission.js` — GET ?id=: 내가 제출한 것의 상세 + 교수 첨삭(본인 것만)
- **index.html** 수정 — 사이드바 관리자 메뉴 바로 위에 "교수" 메뉴 그룹(`#profNavGroup`, 기본 숨김) +
  "학생 관리"(`data-tab="profStudents"`)/"과제 관리"(`data-tab="profAssignments"`) 탭 추가
- **app.js** 수정
  - `isProfessor()`/`refreshProfNavVisibility()`/`forceTab()` 추가, `onAuthChanged()`가 로그인한
    계정이 교수가 아니면 교수 전용 탭에서 자동으로 빠져나오도록 처리
  - `renderers` 맵에 `profStudents:rProfStudents`, `profAssignments:rProfAssignments` 등록
  - 학생 계정 화면의 "기획서 작성"/"플롯 생성"/"글쓰기" 탭 제목 오른쪽에 "제출" 버튼 추가(교수
    계정에서는 숨김) — `submitBtnHtml()`/`wireSubmitBtn()`로 공용화
  - `openSubmitModal(type)` — 내가 가입한 교수의 열려있는 과제 목록을 보여주고, 고르면 현재 작업물을
    `buildSubmissionData(type)`로 스냅샷 떠서 `/api/student-submit`으로 제출. 이미 제출한 과제는
    "이미 N회 제출함" 배지 표시(클릭하면 본인이 제출한 내용을 읽기 전용으로 확인 가능)
  - `rProfStudents()` — 내 그룹 학생 명단 표
  - `rProfAssignments()`/`renderProfAssignList()` — 과제들을 폴더형 카드로 나열, 카드마다 제출기한·
    제출건수 + 제출열림/마감 토글 스위치. "과제 등록" 버튼(`openNewAssignmentModal()`)으로 과제명·
    제출기한 입력해 생성
  - `openAssignmentFolder(id)` — 과제 폴더를 열면 그 과제에 제출한 학생 이름 목록 표시, 클릭 시
    `openSubmissionReview(id)`로 이동
  - `openSubmissionReview(id)` — 교수의 첨삭 화면. 제출물을 유형(기획서/플롯/글쓰기)에 맞는 블록
    단위로 쪼개 **위에는 학생이 제출한 원본(읽기 전용), 바로 아래에 첨삭 입력란**을 블록마다 짝
    지어 세로로 나열. "첨삭 저장"을 누르면 학생도 확인 가능하도록 서버에 저장. 이 화면에서 여는
    제출물은 교수 본인의 프로젝트 데이터(`DB`/`P`)에는 전혀 반영되지 않는 **완전히 별도의 임시
    데이터**로만 다룸(전역 `P`/`DB`를 건드리지 않고 모달 내부 지역 변수로만 렌더링)
  - `buildReviewPairs(type,data,feedback)`/`buildFeedbackFromPairs(type,data,afterList)` — 기획서는
    14개 필드별, 플롯은 섹션별, 글쓰기는 블록별로 원본/첨삭 쌍을 만들고 되돌리는 공용 변환 함수
- **auth.js** 수정 — `openSettings()`를 실제 기능으로 구현. 교수 계정은 본인의 6자리 코드를 크게
  표시(학생에게 공유용), 학생 계정은 6자리 코드 입력란 + "가입하기" 버튼을 보여주고
  `/api/student-join` 호출 → 성공 시 `currentUser.profId` 갱신 후 저장
- **style.css** 수정 — `.card-h2-row`(탭 제목+제출버튼 배치), `.plot-modal.wide`, `.prof-code-display`
  (설정 화면 코드 큰 글씨), `.submit-assign-list`류(제출 모달 과제 목록), `.assign-type-badge`,
  `.prof-assign-grid`/`.assign-folder`류(과제 폴더 카드), `.assign-switch`류(제출열림/마감 토글
  스위치), `.review-pair`/`.review-before`/`.review-after`(첨삭 화면 원본/첨삭 쌍 레이아웃) 추가.
  기존에 app.js에서 쓰이고 있었으나 정의가 빠져있던 `.muted` 클래스도 함께 추가
- 검증: `node -c app.js`, `node -c auth.js`, 신규 API 8개 전부 `node --check` 통과
- ⚠️ **배포 후 수동 설정 필요**: 위 schema.sql의 이번 단계분(`prof_id` 컬럼 + `assignments`/
  `submissions` 테이블)을 Cloudflare D1 콘솔에서 실행해야 학생 가입/과제/제출 기능이 정상 동작함.
  또한 이 기능은 2단계(관리자 페이지)에서 추가된 `role`/`prof_code` 컬럼과 studio.inknpen 계정 전환이
  이미 D1에 반영돼 있어야 함께 정상 동작함

## 2026-08-18 (3) — 관리자 페이지 신설 (회원 관리 + 서버 초기화) + 회원 등급(교수/학생)

**배경**: studio.inknpen 계정을 유일한 관리자로 지정하고, 회원 명단 조회와 서버 초기화(데이터만 /
계정+데이터) 기능이 필요해짐. 회원은 교수/학생 등급으로 나뉘고 교수는 6자리 코드를 받는다(다음 단계
"교수 그룹 설정"에서 학생이 이 코드로 교수 그룹에 가입).

- **schema.sql** 수정 — `users` 테이블에 `role`(기본값 'student')·`prof_code` 컬럼 추가. 기존 DB에
  적용할 `ALTER TABLE`문과, 기존 profh 계정을 studio.inknpen(교수 등급 + 코드 360544)으로 바꾸는
  `UPDATE`문 추가 — **Cloudflare D1 콘솔에서 수동 실행 필요** (교수님께 별도 안내)
- **functions/api/_utils.js** 수정 — `ADMIN_USERNAME`("studio.inknpen") 상수화, `requireAuth()`가
  role/prof_code도 함께 조회, 공용 `requireAdmin()` 헬퍼 추가
- **functions/api/login.js**, **signup.js** 수정 — 로그인/가입 응답에 role·profCode 포함. signup은
  role(student/professor) 입력을 받아 저장하고, 교수로 가입 시 중복되지 않는 6자리 코드를 자동 생성
- **functions/api/admin.js** 신규 생성 — GET: 회원 명단 조회, POST {mode:"data"|"all"}: 서버 초기화
  (data=모든 회원 작품데이터만 삭제, all=관리자 본인 제외 모든 계정·세션·데이터 삭제). 둘 다
  `requireAdmin()`으로 studio.inknpen 계정만 허용
- **index.html** 수정 — 회원가입 폼에 교수/학생 선택 라디오 버튼 + 8pt 안내문구 추가. 사이드바 맨
  아래 "관리자" 메뉴 그룹(`#adminNavGroup`, 기본 숨김) + "회원 관리 · 서버 초기화" 탭(`data-tab="admin"`)
  복원 — 기존 isAdmin()/refreshAdminTabVisibility() 스캐폴딩(2026-08-16에 구 작품DB 관리 페이지만
  지우고 남겨뒀던 것)을 그대로 재사용
- **app.js** 수정 — `ADMIN_USERNAME` 'profh' → 'studio.inknpen'. `rAdmin()` 신설(회원 명단 표 +
  데이터초기화/계정+데이터초기화 버튼, 각 버튼은 confirm() 2연속으로 재확인 후 `/api/admin` POST) +
  `renderers` 맵에 `admin:rAdmin` 등록
- **auth.js** 수정 — 회원가입 제출 시 선택한 role을 `/api/signup` 요청 본문에 포함
- **style.css** 수정 — `.signup-role`(가입 폼 등급 선택), `.admin-table`(회원 명단 표),
  `.admin-reset-row`/`.admin-reset-box`(초기화 버튼 영역) 스타일 추가
- 검증: Node로 모든 수정 파일 문법 체크(`node -c`/ESM 문법 체크) 통과
- 정리: 이전 커밋에서 실수로 들어간 빈 파일 `main`과, git 브랜치/잠금 문제 진단용으로 썼던 1회성
  배치 파일(`fix-branch.bat`/`autopush-debug.bat`/`cleanup-node_modules.bat`/`setup-and-push.bat`)
  삭제 — 더 이상 필요 없음

## 2026-08-18 — 기획서 작성 페이지 신설 (블럭형 입력 + .docx 출력)

**배경**: 교수님이 첨부한 표준 웹툰 기획안 양식(일시/작성자 · 제목/장르/로그라인 ·
주요독자/웹툰분량/중심소재/상황/등장인물/사건/결말/기획의도 · 시놉시스)을 학생들이 항목별로
입력하고, 첨부 양식 그대로 .docx로 뽑을 수 있게 해달라는 요청. (교수-학생 그룹/과제 시스템,
관리자 페이지는 다음 단계로 순차 진행 예정)

- **index.html** 수정 — 사이드바에 "기획 → 기획서 작성"(`data-tab="plan"`) 메뉴 그룹 추가(아이디어
  그룹 바로 다음). 상단 내보내기 메뉴에 "기획서 출력 (.docx)"(`#topExportPlan`) 버튼 추가(맨 위)
- **app.js** 수정
  - `blankPlanDoc()`/`fillPlanDoc()` 신설 — 기획서 14개 필드(date/author/title/genre/logline/
    mainReaders/length/material/situation/characters/incident/ending/intent/synopsis) 기본값·구버전
    데이터 보정
  - `blankProject()`/`fillProject()`에 `planDoc` 필드 연결 (다른 프로젝트 문서들과 동일 패턴)
  - `PLAN_FIELDS` 배열 + `rPlan()` 신설 — 항목별 블럭(`.plan-block`) UI, 블럭마다 8pt 작성 가이드
    문구(`.plan-guide`)를 라벨 아래에 표시. `renderers` 맵에 `plan:rPlan` 등록
  - `exportPlan()` 신설 — docx 라이브러리로 첨부 양식과 동일한 표 구성(일시/작성자 표 → 제목·장르·
    로그라인 표 → 주요독자~기획의도 표 → 페이지 나눔 후 시놉시스 표) 그대로 출력. 라벨 셀은
    베이지색(#E8D9C5) 음영 처리
- **style.css** 수정 — `.plan-row`/`.plan-block`/`.plan-guide`(font-size:8pt)/`.plan-ta-lg`/
  `.plan-ta-xl` 스타일 추가
- 검증: Node로 `exportPlan()`과 동일한 테이블 구성을 만들어 LibreOffice로 PDF 변환 후 렌더링
  이미지로 확인 — 첨부 원본 양식과 레이아웃(라벨 음영, 표 구간, 시놉시스 2페이지 분리) 일치 확인

## 2026-08-16 (4) — 아이디어 탐색: 작품DB 매칭 → 선택형 작법 가이드로 전면 교체

**배경**: "로그라인을 입력하면 작품DB에서 비슷한 작품을 찾아주는" 기존 방식은 관리자가 작품DB(.md/.xlsx)를
직접 구축·유지해야 해서 실질적으로 운영이 어려움 → 폐지 요청.

**변경**: 아이디어 탐색 탭을 "주인공의 성격 / 목적 / 변화 / 세계관 / 플롯의 종류 / 엔딩의 종류" 6개 카테고리
중 선택하면, 선택한 항목마다 구체적인 작법 안내(어떻게 써야 하는지)를 보여주는 방식으로 전면 교체.
- **data.js**: `LOGLINE_SLOTS`(8슬롯) 삭제 → `STORY_GUIDE_SLOTS`(6카테고리 × 옵션별 작법 tip)로 교체
- **app.js**: 작품DB 업로드/파싱/매칭 관련 함수 전부 삭제(`splitRow`, `rowsToWorks`, `parseMarkdownTable`,
  `parseExcelBuffer`, `handleWorkDBFile`, `applyWorkDB`, `keywordOptions`, `matchWorks`, `fillWorkDB`),
  `rExplore()`를 카테고리 선택 + 작법 안내 카드 렌더링으로 재작성. `rAdmin()`(작품DB 관리 페이지)과
  상태의 `DB.workDB` 필드 전체 삭제
- **index.html**: "관리자 — 작품DB 관리" 사이드바 메뉴(`adminNavGroup`) 삭제, 더 이상 쓰지 않는 `xlsx`
  CDN 스크립트 태그 삭제 (docx 내보내기용 `docx` 스크립트는 유지)
- 로그인 시스템 자체(`isAdmin`/`ADMIN_USERNAME`)는 향후 다른 용도로 쓰일 수 있어 그대로 둠

## 2026-08-16 (3) — 대본/대사 Word 출력 시 대사 텍스트 굵게(bold) 처리
- **app.js** 수정 — `blockBodyParagraphs()`(대본 출력용)와 `exportDialogueOnly()`(대사만 출력용) 두 곳
  모두, 대사(line 타입) 텍스트에 `bold:true`를 적용. 캐릭터 이름은 기존에도 굵게 처리되어 있었음. 지문은
  그대로 일반 굵기 유지.

## 2026-08-16 (2) — 대본 출력 .docx가 MS워드에선 열리는데 한컴 워드에선 안 열리던 버그 수정

**증상**: 위 항목에서 docx 라이브러리로 교체한 뒤 MS Word에서는 정상 출력되지만, 한컴 오피스(한컴 워드)
에서는 파일이 열리지 않거나 표가 깨짐.

**원인**: 대본 출력의 표를 만들 때 각 셀(TableCell)에만 개별 너비(700dxa / 9000dxa)를 지정하고, 표
전체의 `columnWidths`는 지정하지 않았음. `docx` 라이브러리는 `columnWidths`가 없으면 `w:tblGrid`
(표의 열 구조를 선언하는 부분)를 실제 셀 너비와 무관하게 기본값(모든 열 100dxa)으로 채워버려, 문서
안에 "표 구조 선언(tblGrid)"과 "실제 셀 너비(tcW)"가 서로 어긋나는 결함 있는 표가 만들어짐. 또한 표
전체 너비를 퍼센트(`WidthType.PERCENTAGE`, 100%)로 지정했는데, 라이브러리가 이를 표준적인 "50분의
1% 단위 정수"가 아니라 `w:w="100%"`처럼 퍼센트 기호가 붙은 문자열로 그대로 써버려 값 형식이 모호해짐.
MS Word는 이런 결함을 알아서 눈감아주고 셀 너비 기준으로 다시 그려주지만, 한컴 오피스의 OOXML
가져오기 필터는 훨씬 엄격해서 tblGrid와 tcW가 불일치하는 표를 만나면 열기를 거부하거나 빈 문서로
처리함.

**수정**: `exportScript()`의 표 생성부에서
- 표 전체 너비를 퍼센트 대신 dxa(트윕) 정수 고정값(9000 = 700+8300)으로 지정
- `new Table({...})`에 `columnWidths:[700, 8300]`을 명시해 tblGrid가 실제 셀 너비와 정확히 일치하도록 수정

**검증**: Playwright로 실제 app.js를 로드해 export 실행 후 생성된 .docx의 `word/document.xml`을 파싱해
`w:tblGrid`(700/8300)와 각 `w:tcW`(700/8300) 값이 정확히 일치함을 확인. LibreOffice(soffice --headless)
로도 정상 변환/텍스트 추출됨을 재확인.

## 2026-08-15 (61차) · 내보내기 롤메뉴가 작업스페이스에 가려지는 문제 수정
- 증상: 상단바의 "내보내기" 드롭다운(대본/대사/콘티/.story)을 열면 메뉴가 워크스페이스(#app) 뒤로 가려져 거의 보이지 않음
- 원인: `.topbar{overflow-x:auto}`가 걸려 있는데, CSS 스펙상 `overflow-x`가 `visible`이 아니면 지정하지 않은 `overflow-y`도 강제로 `auto`가 됨(가로 스크롤을 넣으려던 의도가 세로도 함께 잘라버림). `.mb-export-menu`는 `.topbar` 안의 `position:absolute` 요소라 이 세로 클리핑에 걸려, 버튼 아래로 펼쳐지는 부분(약 56px짜리 상단바 높이를 넘는 대부분)이 잘려나가 그 아래 워크스페이스가 비쳐 보였음. 같은 상단바의 `#userMenu`는 이미 `toggleUserMenu()`에서 열 때마다 `document.body`로 옮기고 `position:fixed`로 좌표를 직접 계산해 이 문제를 피해가고 있었는데, 내보내기 메뉴는 그 패턴이 적용돼 있지 않았음
- **app.js** 수정 — `toggleExportMenu(forceHide)` 신설(`auth.js`의 `toggleUserMenu()`와 동일 패턴): 열 때 `topExportMenu`를 `document.body`로 옮기고 `topExportBtn`의 `getBoundingClientRect()` 기준으로 `top`/`left`를 직접 계산(화면 아래로 넘치면 버튼 위쪽에 표시). `topExportBtn.onclick`과 문서 전역 클릭(바깥 클릭 시 닫기) 핸들러를 이 함수 호출로 교체
- **style.css** 수정 — `.mb-export-menu`를 `position:absolute;top:38px;left:0`에서 `position:fixed`로 변경(좌표는 JS가 지정), `z-index`를 30→1000으로 올려 다른 팝업들과 동일한 수준으로 맞춤
- 검증: 정적 파일 서버(`node`)로 실제 페이지를 띄워 브라우저에서 직접 확인 — 수정 전엔 메뉴 중심 좌표(`elementFromPoint`)에서 워크스페이스 안의 `#ideaNewInput`이 잡혔으나(메뉴가 가려짐), 수정 후엔 같은 좌표에서 메뉴 자신의 버튼(`#topExportStoryboard`)이 정상적으로 잡힘. 메뉴가 `document.body`로 옮겨진 것과 바깥 클릭 시 다시 닫히는 것까지 확인

## 2026-08-15 (60차) · 내보내기를 대본/대사/콘티 3종 출력으로 전면 교체
- 요청: 기존 "Word(.docx) / PDF" 내보내기(캐릭터·세계관·배경·사건·플롯 개요만 담고 실제 글쓰기 본문은 빠져 있던 구조)를 없애고, 실제 창작 결과물에 맞는 3종 출력으로 교체
  1. **대본 출력**(.docx) — 글쓰기 탭의 모든 장면 블록을 표로 저장. 표는 블록 번호당 한 행, 한 칸에 그 블록의 전체 내용(지문·대사 구분 없이 줄바꿈으로만 구분). 대사 항목은 반드시 "캐릭터명: 대사" 형식으로 캐릭터 이름을 앞에 표기
  2. **대사만 출력**(.docx) — 표 없이, 대사(line) 항목만 추출하고 캐릭터명은 제외. 블록 간에는 줄바꿈으로만 구분하고, 같은 블록 안의 여러 대사 항목은 줄바꿈 없이 공백으로 이어붙여 한 문단으로 출력
  3. **콘티 출력**(.pdf) — 콘티제작 탭과 동일한 블록 순서로 표를 만들어 왼쪽 칸엔 글 블록 내용(제목+본문), 오른쪽 칸엔 콘티 이미지(`/api/storyboard-image?key=`) 또는 "(콘티 없음)" 표시. 기존 `exportPdf()`와 동일하게 `#preview`에 렌더 후 `window.print()`로 PDF 저장 유도하되, `<img>` 로딩(비동기 네트워크 요청)이 끝난 뒤에 인쇄되도록 `onload/onerror` 대기 로직(4초 타임아웃 안전장치) 추가 — 기존엔 이미지 없는 텍스트 전용 출력이라 이 문제가 없었음
- **app.js** 수정 — 기존 `exportPdf()`/`exportDocx()`/`buildPreview()`(프로젝트 개요용) 제거. `allWriteBlocksOrdered()`(플롯 섹션 순서대로 이어붙인 전체 글쓰기 블록 목록) / `blockBodyHtml(bl)`(지문·대사를 줄바꿈으로만 나열, 대사는 "캐릭터: 대사" 포맷) 공용 헬퍼 신설. `exportScript()`/`exportDialogueOnly()`/`downloadDocx()`/`exportStoryboardPdf()` 신설. 상단 내보내기 버튼 클릭 핸들러를 새 함수로 교체
- **index.html** 수정 — 상단 내보내기 드롭다운의 "Word (.docx)"/"PDF" 2개 버튼을 "대본 출력 (.docx)" / "대사만 출력 (.docx)" / "콘티 출력 (.pdf)" 3개로 교체(`.story` 작품 파일 내보내기는 그대로 유지). 버튼 id를 `topExportScript`/`topExportDialogue`/`topExportStoryboard`로 변경
- 검증: `node --check app.js` 통과. 새 함수들만 별도로 jsdom에 로드해(전체 `app.js`를 eval하면 이 프로젝트에 원래 있던 것으로 확인된 별개 이슈 `LOGLINE_SLOTS is not defined`에 걸려 실행 자체가 막힘 — 51차에서도 동일 확인된 기존 이슈라 이번 변경과 무관) 테스트: (1) 지문+대사 혼합 블록에서 대사만 "캐릭터: 텍스트"로 접두되고 항목들이 `<br>`로 구분됨 (2) 대본 출력 표가 블록 수만큼 행을 갖고 1번부터 순서대로 번호 매겨짐 (3) 대사만 출력에서 캐릭터명이 빠지고, 같은 블록의 대사 2개가 공백으로 이어붙어 한 문단이 되며 대사 없는 블록은 문단 자체가 생기지 않음 (4) 콘티 출력 미리보기 표에 블록 제목·본문이 들어가고 콘티 이미지가 없으면 "(콘티 없음)"으로 표시되며 이미지가 없을 때는 즉시 `window.print()` 호출됨 (5) 작성된 블록이 없으면 alert로 안내하고 내보내기를 중단함 — 총 17개 항목 모두 통과

## 2026-08-14 (59차) · 그리기 툴 펜 굵기, 브라우저별로 마지막 값 기억
- 요청: 그리기 툴의 펜 기본 두께를 바꿔달라 → 고정값 대신 "한 번 정하면 계속 유지"로 변경 요청
- **app.js** — `DRAW_WIDTH_KEY`(localStorage) + `loadDrawWidth()`/`saveDrawWidth()` 추가. `openDrawModal()`의 `curWidth` 초기값을 고정 상수 대신 `loadDrawWidth()`(저장된 값 없으면 4)로 설정하고, 굵기 슬라이더 `oninput`에서 `saveDrawWidth()` 호출 → 같은 브라우저에서 다음에 그리기 툴을 열 때도 마지막에 쓴 굵기가 그대로 적용됨
- 검증: `node --check app.js` 통과

## 2026-08-14 (58차) · "콘티제작" 탭 신설 (글쓰기 블록 연동 + 이미지 업로드/직접 그리기 + R2 저장)
- 요청: 글쓰기 섹션 아래에 콘티제작 섹션 추가. (1) 글쓰기 탭의 장면 블록과 연동 (2) 작업공간을 절반으로 나눠 왼쪽 글 블록 / 오른쪽 콘티 (3) 콘티는 글 블록과 같은 행에 위치 (4) 콘티 블록에 이미지 업로드(300KB 제한) 또는 직접 그리기 (5) 글-콘티가 하나의 그룹으로 함께 순서 이동 (6) 직접 그리기 시 캔버스 크기(큰/중간/작은 칸) 먼저 선택 (7) 그리기 툴 팝업은 바깥 클릭으로 안 닫히고 "저장 후 종료"로만 닫힘 (8) 업로드·그리기 모두 300KB 초과 시 자동 압축
- 아키텍처 결정: 콘티 이미지는 D1에 base64로 넣지 않고 **Cloudflare R2**에 저장. 캐릭터 사진(300x300, D1 base64 임베드)과 달리 학생 1인당 수십 장이 쌓일 수 있어(300KB×30~40장 ≈ 9~12MB/명) D1의 "값 하나 최대 2MB" 제한에 바로 걸림. `bl.storyboard={key,size}`로 R2 오브젝트 key만 D1에 저장
- **index.html** — "글쓰기" nav-group 아래에 "콘티" nav-group + `data-tab="storyboard"` 탭 신설
- **app.js**
  - `ICONS`에 `image`/`pencil`/`eraser` 아이콘 추가
  - `fillWriteDoc()`의 블록 매핑에 `storyboard:{key,size}` 필드 추가 (구버전 데이터는 `storyboard:null`로 보정)
  - `render()`: `renderers` 맵에 `storyboard:rStoryboard` 등록, `app.wide` 토글 조건에 `storyboard` 탭 추가
  - `rStoryboard()` 신설 — `P.writeDoc.blocks`를 `blocksOfSection()`으로 플롯 섹션별로 순회하며 `storyboardRow()`를 렌더링. 로그인 전/플롯·블록 없음 가드 포함
  - `storyboardRow(bl,no)` — 한 행(`.sb-row`)에 왼쪽 `.sb-text-cell`(글 블록 제목+본문 미리보기, 읽기전용), 오른쪽 `.sb-storyboard-cell`(콘티 슬롯) 배치. flex row 한 행 안에 좌우를 넣는 방식이라 별도 스크롤 동기화 없이 항상 같은 행에 정렬됨
  - `setupStoryboardRowDnD()`/`commitStoryboardOrder()` — 기존 `setupBlockDnD`/`rebuildWriteFromDOM`과 동일 패턴으로 `P.writeDoc.blocks`(글쓰기 탭과 같은 배열)를 그대로 재정렬 → 글 블록에 콘티가 딸려있는 구조라 순서 이동 시 항상 함께 움직임 (별도 "그룹" 개념 불필요)
  - `openSizePicker(bl,onPick)` — 큰 칸(세로500×가로350)/중간 칸(350×350)/작은 칸(세로250×가로350) 선택 팝업. 바깥 클릭·×로 닫기 가능(그리기 툴 팝업과 달리 일반 팝업)
  - `openDrawModal(bl,sizeKey)` — 그리기 툴 팝업. **오버레이 클릭 닫기 핸들러와 × 버튼을 의도적으로 넣지 않아** "저장 후 종료" 버튼을 눌러야만 닫힘. pointerdown/move/up으로 캔버스에 직접 드로잉(색상 스와치+커스텀 컬러피커, 굵기 슬라이더, 지우개, 전체 지우기). 기존 콘티가 있으면 배경으로 불러와 이어 그리기 가능
  - `triggerStoryboardUpload(bl)` — 파일 선택 → `compressImageToLimit()`로 압축 후 업로드
  - `compressImageToLimit(img,maxBytes,cb)` — 업로드 이미지용. 최대 1400px로 먼저 다운스케일한 뒤 JPEG 품질을 0.1씩 낮추고, 품질 0.4 이하에서도 넘으면 캔버스 크기를 85%씩 추가로 줄여 300KB 이하로 수렴
  - `compressCanvasToLimit(canvas,maxBytes,cb)` — 그리기 캔버스용(선 그림이라 품질 조정만으로 충분)
  - `uploadStoryboardBlob()`/`deleteStoryboardImage()`/`saveStoryboardBlob()`/`deleteStoryboardSlot()` — `/api/storyboard-image`(Authorization: Bearer 토큰) 호출 래퍼. 이미지 교체 시 새 key 저장 성공 후 이전 key를 R2에서 삭제(고아 오브젝트 방지)
- **style.css** — `.storyboard-layout`/`.sb-*`(행·텍스트셀·콘티셀·플레이스홀더·썸네일) + `.draw-modal*`/`.draw-*`(그리기 툴 팝업, 캔버스, 툴바) 스타일 추가
- **functions/api/storyboard-image.js** 신설 — R2 바인딩 `env.STORYBOARD_BUCKET` 사용
  - `POST`: `requireAuth`로 로그인 확인, 요청 본문(이미지 바이트, 서버측 상한 400KB)을 `{userId}/{uuid}.jpg` key로 저장 후 key 반환
  - `GET ?key=`: 인증 없이 공개 제공(추측 불가능한 UUID 키라 사실상 비공개 링크와 동일), `Cache-Control: immutable` 1년
  - `DELETE ?key=`: 로그인 필요 + key 접두사가 본인 user_id인 경우만 삭제 허용
  - `env.STORYBOARD_BUCKET`이 바인딩되지 않은 경우(R2 버킷 미생성) 500 에러로 안내
- **README.md** — API 표에 `/api/storyboard-image` 추가, 배포 섹션에 R2 버킷 생성 + `STORYBOARD_BUCKET` 바인딩 수동 설정 단계(4~5번) 추가, 참고란에 이번 변경 안내
- ⚠️ **배포 후 수동 설정 필요**: Cloudflare 대시보드에서 R2 버킷을 만들고 Pages Functions에 `STORYBOARD_BUCKET`으로 바인딩하기 전까지는 이미지 업로드/그리기 저장이 500 에러로 실패함 (README 배포 섹션 4~5번 참고)
- 검증: `node --check app.js` / `node --check functions/api/storyboard-image.js` 통과

## 2026-07-31 (57차) · 분기 블록 순서 이동을 화살표 버튼 → 드래그 핸들로 교체
- 요청: 56차에서 넣은 ▲▼ 이동 버튼 대신, 앱의 다른 블록들처럼 그립(grip) 핸들을 드래그해서 순서를 바꾸도록 변경
- **app.js**
  - 분기 셀(`.sub-branch`)에 `dataset.id`, `draggable` 상태, `ICONS.grip` 핸들(`branch-handle`) 추가 — 핸들 mousedown/touchstart 시에만 draggable=true (다른 블록들과 동일한 패턴)
  - `setupBranchDnD(container, it)` 신설 — 2열 그리드이므로 Y좌표만 쓰는 기존 `getDragAfterEl` 대신, 커서와 가장 가까운 칸을 유클리드 거리로 찾고 그 칸의 중심보다 위/왼쪽이면 앞에, 아니면 뒤에 삽입
  - `commitBranchOrder(container, it)` 신설 — 드롭 후 DOM 순서를 `it.branches` 배열에 반영(다른 `commit*Order` 함수들과 동일한 패턴), `dndDropHandled` 플래그로 dragend 중복 커밋 방지
  - 전역 `mouseup` 안전장치 선택자에 `.sub-branch[draggable=true]` 추가(다른 드래그 요소들과 동일하게 놓친 드래그 상태 초기화)
  - 56차의 ▲▼ index±2 스왑 로직/버튼 제거
- **style.css** — `.branch-move`/`.branch-move-wrap` 제거, `.sub-branch.dragging{opacity:.4}` + `.branch-handle`(그립 아이콘, 다른 `.sub-handle`보다 살짝 작게) 추가
- 검증: `node --check app.js` 통과, `setupBranchDnD`/`commitBranchOrder` 호출부·정의부 개수 일치 확인

## 2026-07-31 (56차) · 분기 기능 보완 4건 + 대사 블록 클릭편집
- 요청: (1) [분기 블럭 추가]는 1개가 아니라 한 줄(2개)씩 생성 (2) 본문 블럭 우클릭 메뉴에서 사라진 지문추가/대사추가 복원 (3) 분기 블럭 두 열 사이 세로 구분선 (4) 분기 블럭도 위/아래 이동 가능 (5) 대사 블럭 우클릭 메뉴의 "수정" 삭제, 대신 대사 텍스트를 클릭하면 바로 편집
- **app.js**
  - `openTextBlockCtxMenu(x,y,bl,it)` — 시그니처에 `bl` 추가, 55차에서 분기 항목만 있던 메뉴를 장면블록 메뉴(수정/지문 추가/대사 추가/그룹/삭제)와 병합 + 분기 항목 유지. [분기 블럭 추가] 클릭 시 `it.branches.push(x2)`로 2개씩 생성
  - 분기 셀마다 ▲▼ 이동 버튼 추가 — 2열 그리드라 "위/아래"는 같은 열의 앞뒤 줄을 의미하므로 index±1이 아닌 index±2 스왑으로 구현(예: 0번↔2번, 1번↔3번). 첫/마지막 줄에서는 버튼 비활성화
  - 대사(line) 타입 `dlg-text`를 `scene-title`과 동일한 클릭-편집 패턴으로 변경(contentEditable 토글, blur 시 잠금, oninput으로 `it.text` 저장)
  - `openLineBlockCtxMenu(x,y,bl)` 신설 — 대사 블록 전용 우클릭 메뉴, 기존 장면블록 메뉴에서 "수정" 항목만 제외(지문 추가/대사 추가/그룹/삭제는 유지). 대사 블록에 `contextmenu` 리스너 추가(stopPropagation으로 장면블록 메뉴와 분리)
- **style.css**
  - `.sub-branches`에 `::before` 가상요소로 두 열 사이 세로 구분선 추가(column-gap 중앙에 1px 라인)
  - `.branch-move`/`.branch-move-wrap` 스타일 추가(▲▼ 버튼, 비활성 시 흐리게)
  - `.dlg-text`에 `cursor:text` + `[contenteditable="true"]` 포커스 스타일(scene-title과 동일한 톤) 추가
- 검증: `node --check app.js` 통과, 함수 시그니처/호출부 grep으로 인자 개수 일치 확인

## 2026-07-31 (55차) · 본문 블럭 분기 글쓰기 기능 추가
- 요청: (1) 본문 블럭 우클릭 시 [분기 만들기] 메뉴 (2) 클릭하면 아래에 절반 크기 본문 블럭 2개를 2열로 배치 (3) 분기 블럭 폰트는 1pt 작게 (4) 이미 분기된 블럭은 [분기 만들기] 대신 [분기 블럭 추가]만 표시(분기 나누기는 최초 1회만, 이후는 블럭 추가만 가능)
- **app.js**
  - `subBlockEl()`의 본문(text) 타입 렌더링 구조 변경 — 기존엔 핸들·textarea·삭제버튼을 `.sub-block`에 바로 append했으나, 이제 이 셋을 `.sub-main-row`로 감싸고 그 아래에 `it.branches` 배열이 있으면 `.sub-branches`(2열 그리드) 컨테이너를 형제로 추가. 대사(line) 타입 구조는 그대로 유지
  - 드래그앤드롭 순서 저장(`rebuildItemsFromDOM`)은 `.sub-block` 클래스만 기준으로 항목을 다시 읽으므로, 분기 내부 요소에는 그 클래스를 주지 않아 기존 로직과 충돌 없음
  - 본문 블럭(`d`)에 `contextmenu` 리스너 추가 → `openTextBlockCtxMenu(x, y, it)` 호출(부모 장면블록의 우클릭 메뉴로 전파되지 않도록 stopPropagation)
  - `openTextBlockCtxMenu()` 신설 — `it.branches`가 없으면 [분기 만들기](클릭 시 `it.branches=[{}, {}]`로 분기 블럭 2개 생성), 있으면 [분기 블럭 추가](클릭 시 배열에 1개 push)만 노출
  - 분기 블럭 각각에도 자체 textarea(`branch-textarea`, oninput으로 `br.text` 저장) + 개별 삭제(x) 버튼 부여
- **style.css** — `.sub-block.sub-text{flex-direction:column}` + `.sub-main-row`(기존 flex row 그대로 이동) + `.sub-branches{display:grid;grid-template-columns:1fr 1fr}` + `.sub-branch`(카드형) + `.branch-textarea{font-size:calc(11px - 1pt)}` (기존 본문 11px 대비 정확히 1pt 작게)
- 검증: `node --check app.js` 통과. 데이터 구조상 `it.branches`는 옵셔널이라 기존 저장 데이터(분기 없음)는 영향 없음

## 2026-07-26 (54차) · 작품 탭 스타일을 실제 파일탭처럼 변경 + 사이드바/플롯목록/미리보기 접기 + 본문·미리보기 폭 조절 (곰국을끼리오너라 프로젝트 참고)
- 요청: (1) 상단 탭 구조를 곰국 프로젝트 스크린샷처럼 변경 (2) 사이드메뉴·본문 블럭화면(플롯 목록)·미리보기 화면 접기 기능을 곰국 프로젝트에서 검색해 그대로 적용 (3) 본문 블럭화면과 미리보기 화면 사이 경계를 드래그해 폭 조절하는 기능도 곰국 프로젝트에서 검색해 적용
- **탭 스타일** — `.ptab`을 둥근 알약형 칩에서 곰국의 `.file-tab`과 동일한 "실제 파일탭" 모양으로 변경: 위쪽만 둥글고 아래는 테두리 없이 열려 본문 영역에 붙어 보임(`border-radius:8px 8px 0 0`, `border-bottom:none`). `.ptabs`가 `align-self:stretch`+`align-items:flex-end`로 상단바 높이 전체를 채운 뒤 탭을 바닥에 붙임(상단바가 grid가 아닌 flex라 곰국과 다른 방식으로 구현). 활성 탭은 배경을 `--card`(페이지 배경과 동일)로 칠해 아래 콘텐츠와 이어지는 느낌
- **접기/펼치기(곰국 방식 그대로: sb-collapsed/toc-collapsed/preview-collapsed 3개 body 클래스 + 각 패널 옆 고정 위치 토글 버튼)** —
  - **style.css** 수정 — `--topbar-h` CSS 변수 신설(기존 하드코딩된 56px 대체), `.sb-toggle`/`.panel-toggle`/`.toc-toggle`/`.preview-toggle` 버튼 스타일과 `body.sb-collapsed .sidebar{display:none}` 등 3개 접기 규칙, `.write-resizer` 드래그 핸들 스타일 추가. 단, 곰국은 사이드바가 `position:fixed`라 접었을 때 `main`에 `margin-left`를 줘야 했지만 이야기 도우미는 `.sidebar`가 flex 자식이라 `display:none`만으로 자동으로 폭이 채워짐 — 대신 접힌 자리의 고정 토글 버튼과 겹치지 않도록 `body.sb-collapsed main{padding-left:44px}`만 추가
  - **app.js** 수정 — `UI_KEY`/`loadUiCollapse`/`UICOL`/`saveUiCollapse`/`applyUiCollapse` 상태 관리 신설(localStorage에 저장돼 다음 방문에도 유지). `sbToggleBtn` 클릭 연결 + 페이지 로드 시 `applyUiCollapse()` 1회 호출. 상단바 실제 높이를 재서 `--topbar-h`에 반영하는 `syncTopbarHeight()` 추가(탭 줄바꿈 등으로 높이가 달라져도 사이드바가 툴바에 딱 붙도록). `rWrite()`에 목차(플롯목록) 접기 버튼(`toc-toggle`)과 미리보기 접기 버튼(`preview-toggle`)을 각 패널 앞/뒤에 추가
- **본문·미리보기 폭 조절** — `MAINW_KEY`/`loadMainWidth`/`saveMainWidth`/`setupPanelResizer(resizer, mainEl)` 함수를 곰국 코드 그대로 이식(드래그로 `write-main`의 `flex-basis`를 px로 고정, 최소 360px~최대 `window.innerWidth-420px`, 결과를 localStorage에 저장해 다음에도 유지). `rWrite()`의 `write-main`과 `write-preview` 사이에 `.write-resizer` 핸들 삽입. 미리보기를 접으면 리사이저도 함께 숨기고 본문이 남은 폭을 채우도록(`flex:1 1 auto!important`) 처리
- 참고: 곰국 프로젝트의 미리보기 확대/축소(`preview-zoom`, 50~200%) 기능은 이번 요청 범위(접기·폭 조절)에 포함되지 않아 이식하지 않음
- 검증: `node --check`로 app.js/auth.js 문법 확인. jsdom으로 (1) 기존 탭/저장점/실행취소·단축키 24개 항목 재통과 (2) 사이드바 접기 토글·localStorage 저장 (3) `write` 탭 진입 시 toc-toggle/preview-toggle/write-resizer 요소 생성 (4) 두 토글 클릭 시 UICOL 값과 body 클래스 반영 (5) 리사이저 mousedown→mousemove→mouseup 시뮬레이션으로 `write-main`의 flex-basis가 드래그 거리만큼 늘어나고 localStorage에 저장됨을 확인 — 총 18개 항목 추가 통과

## 2026-07-26 (53차) · 상단 툴바 작품 탭 + 저장상태 점 + 단축키 (곰국을끼리오너라 참고)
- 요청: 상단 툴바에 탭 기능(저장여부 표시 컬러 점 포함) 구현, 단축키(Ctrl+S 즉시저장, Ctrl+Z/Y 실행취소·다시실행) 구현. `곰국을끼리오너라` 프로젝트의 파일탭 UI를 참고
- 탭 닫기(×) 정책은 곰국 프로젝트 방식을 따름: **삭제가 아니라 "닫기"** — 닫아도 작품 데이터는 `DB.projects`에 그대로 남고, 상단 select("다른 작품 열기")로 언제든 다시 열 수 있음
- **app.js** 수정 —
  - `DB.openIds` 필드 신설(현재 탭에 열려 있는 작품 id 목록). `fillOpenIds()`로 구버전 데이터(필드 없음) 보정 — 기존 사용자는 첫 로드 시 보유한 모든 작품이 탭으로 열린 상태로 시작
  - `refreshProjSelect()`를 확장 — `#projTabs`에 열린 작품만 탭으로 렌더(이름+저장상태 점+ICONS.close 닫기), `#projSelect`는 "다른 작품 열기" 메뉴로 역할 변경(닫힌 작품은 앞에 ◦ 표시)
  - `switchProject()`/`openProjectTab()`/`closeProjTab()` 신설. 마지막 탭은 닫을 수 없도록 방지(안내 alert)
  - `newProjBtn`/`delProjBtn`/`importStory`를 openIds와 연동, 렌더 오류 복구 버튼에도 `resetUndoHistory()` 연동
  - **저장상태 컬러 점** — `projSaveState`(pending/saved/error) + `updateTabDot()`. 로컬(localStorage)은 save() 즉시 반영되어 항상 최신이므로, 점 색은 **서버 동기화** 기준으로 표시: 주황(저장 중)→초록(저장됨)/빨강(실패). 비로그인(로컬 전용) 상태에서는 항상 초록
  - **실행취소/다시실행** — 곰국 프로젝트와 동일한 방식(현재 작품 전체를 JSON 스냅샷, 800ms 코얼레싱, 최대 60단계). `resetUndoHistory()`를 프로젝트 전환·생성·삭제·서버 데이터 로드 시점마다 호출해 작품이 바뀌면 이력도 초기화되도록 함
  - **단축키** — 전역 keydown에서 Ctrl/Cmd+S(즉시저장), Ctrl/Cmd+Z(실행취소), Ctrl/Cmd+Shift+Z 또는 Ctrl/Cmd+Y(다시실행)를 가로채 브라우저 기본 동작(인쇄창 등)을 막고 처리. 기존 상단바 "저장" 버튼(`manualSaveBtn`)도 디바운스 없이 즉시 저장하도록 `forceSaveNow()`로 교체
- **auth.js** 수정 — `saveToServer()`를 `doServerSave(pid)` 공용 로직으로 분리, 응답 결과에 따라 해당 작품 탭의 점 색을 갱신. `forceSaveToServer()` 신설(디바운스 없이 즉시 저장, Ctrl+S/수동저장 버튼용). `loadFromServer()`에 openIds 보정 및 실행취소 이력 초기화 추가
- **index.html** 수정 — 상단바 `.mb-left`에 `#undoBtn`/`#redoBtn`(SVG 아이콘) 추가, `#projTabs`(탭 스트립)를 `.mb-left`와 `.proj-controls` 사이에 추가
- **style.css** 수정 — `.ptabs`/`.ptab`/`.ptab-dot`/`.ptab-close` 탭 스타일과 `.mb-icon:disabled` 비활성 스타일 추가
- 주의: 이번 작업 시작 시 로컬 프로젝트 폴더가 GitHub 원격보다 14회치(38차→52차, 아이콘 SVG 전환·캐릭터 상세페이지·탭 구조 개편 등) 뒤처져 있음을 발견 — 원격 최신본(52차)을 먼저 로컬로 가져온 뒤, 그 위에 이번 탭 기능을 다시 적용함(이전에 38차 기준으로 만들었던 버전은 폐기)
- 검증: `node --check`로 app.js/auth.js 문법 확인. jsdom으로 초기 탭 1개 상태, 새 작품 생성 시 자동 탭 오픈, 탭 닫기(마지막 탭은 차단)/select로 재오픈, 실행취소·다시실행 스냅샷 복원, Ctrl+S/Z/Y 단축키가 preventDefault와 함께 올바른 함수를 호출하는지 총 24개 항목 모두 통과 확인

## 2026-08-04 · 캐릭터 설정 버튼 정렬 수정
- 요청: 캐릭터 상세페이지 사진 업로드 영역의 "사진 선택"(label)과 "제거"(button) 버튼이 서로 수직으로 어긋나 보임
- **style.css** 수정 — 공통 \ 규칙에 \를 추가해, 태그가 다른(label vs button) 버튼들도 항상 동일한 높이/중앙 정렬로 렌더링되도록 통일
- 검증: style.css 내 다른 \ 관련 규칙(margin-left:auto 등)과 충돌 없음을 확인

## 2026-08-04 · 캐릭터 설정 버튼 정렬 수정
- 요청: 캐릭터 상세페이지 사진 업로드 영역의 "사진 선택"(label)과 "제거"(button) 버튼이 서로 수직으로 어긋나 보임
- **style.css** 수정 — 공통 `.btn` 규칙에 `display:inline-flex;align-items:center;justify-content:center;line-height:1.2;vertical-align:middle`를 추가해, 태그가 다른(label vs button) 버튼들도 항상 동일한 높이/중앙 정렬로 렌더링되도록 통일
- 검증: style.css 내 다른 `.btn` 관련 규칙(margin-left:auto 등)과 충돌 없음을 확인

## 2026-08-04 · 캐릭터 설정: 인물 변화(전/후) 분리 + 세부 정보 섹션화
- 요청: (1) "인물 변화" 입력을 변화 전/변화 후 2개 폼으로 분리 (2) 캐릭터 상세페이지를 인물 정보/성격/가족사/변화/외모 등 섹션으로 재구성 (3) 학생이 변화를 직관적으로 확인할 수 있는 장치 추가
- **app.js** 수정
  - `blankChar()`에 `age, gender, parentsInfo, familyRelations, arcBefore, arcAfter` 필드 추가 (기존 `arc` 필드는 하위호환을 위해 유지)
  - `fillProject()`의 캐릭터 마이그레이션에서, 기존 `arc` 값이 있고 `arcBefore/arcAfter`가 비어 있으면 `arc` 값을 `arcBefore`로 1회 이전 — 기존에 입력해둔 인물 변화 내용이 사라지지 않도록 처리
  - `charDetailPage()`(캐릭터 상세 수정 페이지)를 "인물 정보(이름/역할/나이/성별) → 인물 성격(MBTI/에니어그램/목표/결함) → 가족사(부모의 정보 및 관계/가족 관계/성장배경) → 인물의 변화(변화 전/변화 후 + 실시간 비교 미리보기) → 외모 및 특징(외모/말투/취향/대사 샘플) → 기타 메모" 순서의 섹션(`h3.char-detail-sub`)으로 재구성
  - 변화 전/후 텍스트를 입력할 때마다 즉시 갱신되는 `#charArcPreview` 비교 카드(변화 전 → 변화 후) 추가로 직관적 확인 지원
  - `charGalleryCard()`에 변화 전/후가 모두 채워진 캐릭터에는 "변화 설정됨" 배지를 표시해 갤러리에서 한눈에 파악 가능하도록 함
  - `charModal()`(신규 캐릭터 빠른 입력 팝업)도 동일하게 변화 전/후 2개 필드로 교체
  - `buildPreview()`(Word/PDF 내보내기)의 "아크" 표기를 "인물 변화: 변화 전 - .../변화 후 - ..." 형식으로 변경
- **style.css** 수정 — `.char-arc-preview`, `.arc-box`(전/후 카드, 좌측 컬러 보더로 구분), `.arc-arrow`, `.arc-empty`, `.char-badge.arc-badge` 스타일 추가
- 검증: `node --check app.js` 통과, style.css 중괄호 개수 일치 확인, 원격 저장소 최신본(undo/redo·패널 접기·작품 탭 등 기존 기능 포함) 기준으로 diff --stat 을 대조해 의도한 변경 외 삭제가 없음을 확인 (직전 커밋에서 로컬 사본이 원격보다 낡아 실수로 최신 기능을 덮어썼던 문제를 되돌리고 재작업함)

## 2026-07-23 (52차) · 세계관 + 배경 설정 탭을 "배경 설정" 하나로 통합
- 요청: 사이드메뉴의 "세계관"과 "배경 설정" 탭을 하나로 합쳐 "배경 설정"으로
- **app.js** 수정 — `rWorld()`와 `rBg()`를 하나의 `rBg()`로 통합: 기존 세계관 항목(한 줄 요약/시대/장소/규칙)과 배경 항목(사회·정치적 배경/분위기/세부 묘사)을 "배경 설정" 카드 한 장에 순서대로 배치하고 중간에 `구체적 상황` 구분선(`.section-title`) 추가. 데이터는 기존 `P.world`/`P.background` 두 필드를 그대로 사용해 기존 저장 데이터 손실 없이 바인딩. 렌더러 매핑(`renderers`)에서 `world` 항목 제거
- **index.html** 수정 — 사이드메뉴에서 "세계관" 버튼(`data-tab="world"`) 제거, "배경 설정" 버튼만 유지
- 검증: `node --check app.js` 통과, 탭 버튼 개수(8개: 아이디어/아이디어 탐색/캐릭터/배경/사건/플롯/글쓰기/관리자) 확인, `rWorld`·`data-tab="world"` 참조가 코드에 남아있지 않음을 grep으로 확인

## 2026-07-23 (51차) · 이모티콘 아이콘 전부 심플라인아이콘(SVG)으로 교체
- 요청: 화면 곳곳의 이모티콘(💡🔒📖✍️🔍🌍🏙⚡👤📚📂💾📝📄⚙🔐☁️)과 텍스트 심볼(✕✎⠿☰🗑)로 되어있는 아이콘을 모두 기존 헤더 툴바에 쓰이던 것과 같은 심플 라인 SVG 아이콘으로 통일
- **app.js** 수정 — `ICONS` 객체에 `bulb, search, lock, book, globe, building, bolt, user, gear, grip, cloud` 11종 라인 아이콘 추가. `iconBtn()` 헬퍼가 `textContent` 대신 `innerHTML`을 쓰도록 변경(SVG 삽입 지원). 각 탭 h2/h3 타이틀, 캐릭터 모달·상세페이지 제목, 아이디어/플롯/장면/서브블록의 드래그 핸들(⠿→grip)·수정(✎→edit)·삭제(✕/🗑→close/trash) 버튼, 플롯 구조 힌트 문구(글자로 아이콘을 설명하던 부분)를 전부 SVG 아이콘 참조로 교체
- **index.html** 수정 — 로그인/헤더 타이틀, 내보내기 메뉴(Word/PDF/.story), 설정 버튼, 사이드메뉴 5개 그룹 라벨(아이디어/설정/플롯/글쓰기/관리자)의 이모지를 인라인 SVG로 교체
- **auth.js** 수정 — 서버 상태 표시(`☁️ 불러오는 중…` 등)를 `CLOUD_ICON` 상수(인라인 SVG) + 텍스트 조합으로 교체
- **style.css** 수정 — 아이콘이 들어간 각 컴포넌트(nav-label, save-status, idea-handle/del/tag-x, plot-idea-handle/edit/rm, scene-handle, sub-handle/del, 로그인·헤더 h1)에 맞는 `.icon` 크기·정렬 보정 규칙 추가
- 검증: `node --check`로 app.js/auth.js/data.js 문법 확인, CSS 중괄호·HTML `<svg>` 태그 짝 수 일치 확인. 기존 `smoketest.js`(jsdom)는 이번 변경과 무관하게 원본 커밋(cea726e)에서도 동일하게 `LOGLINE_SLOTS is not defined` 오류가 발생함을 확인해 이번 수정이 원인이 아님을 확인(기존에 있던 별개 이슈, 별도 조치 필요)

## 2026-07-23 (50차) · 사이드메뉴 캐릭터/배경/사건을 "설정" 그룹으로 통합
- 요청: 사이드메뉴에서 캐릭터, 배경(세계관+배경 설정), 사건을 하나의 "설정" 섹션으로 묶어달라는 요청
- **index.html** 수정 — 기존 "👤 캐릭터"/"🌍 배경"/"⚡ 사건" 3개의 `.nav-group`을 "⚙️ 설정" 그룹 하나로 통합(캐릭터 설정 · 세계관 · 배경 설정 · 사건 설정 4개 탭 버튼을 그룹 안에 순서대로 배치). data-tab 값과 탭 로직(app.js)은 변경 없음
- 검증: 각 탭 버튼의 `data-tab` 값이 기존과 동일함을 확인(character/world/background/event) — 렌더러 매핑에 영향 없음

## 2026-07-23 (49차) · 아이디어 블럭 축소 + 캐릭터 입력폼 2단계 분리(생성 모달 / 수정 페이지)
- 요청: (1) 아이디어 수집 블럭들의 크기·폰트 축소 (2) 캐릭터 카드 입력폼을 신규 생성용과 수정용 2종류로 분리 — 처음 만들 때는 기존 모달 유지, 이후 수정할 때는 별도 페이지로 이동해 더 세밀한 항목을 채울 수 있도록. 세밀한 항목 구성은 "서사 확장형"(외모 상세·말투/버릇·성장배경/과거사·좋아하는것·싫어하는것·대사 샘플)으로 사용자 확인
- **style.css** 수정 — `.idea-block`류(패딩·테두리·폰트) 전반 축소(예: 블록 패딩 14px→9px, 본문 15px→13px, 태그 12px→11px, 블록 간 간격 12px→8px). `.char-detail-page/.char-detail-top/.char-detail-sub` 신설(상세 페이지 레이아웃)
- **app.js** 수정 — `blankChar()`에 서사 확장 필드(`appearance, speechHabit, backstory, likes, dislikes, dialogueSample`) 추가(기존 데이터는 병합 시 자동으로 빈 값 채워짐). `charModalFor`(신규 생성 팝업)와 `charDetailFor`(수정 페이지) 상태를 분리 — "＋ 캐릭터 추가"는 기존 `charModal()` 그대로 유지, 갤러리 카드 클릭·관계도 노드 클릭은 새 `charDetailPage(ch)`(뒤로가기 버튼 있는 전체 페이지, 기존 항목 + 서사 확장 항목 + 관계 관리)로 이동하도록 변경
- 검증: `node --check app.js` 문법 확인, CSS 중괄호 짝 확인. 브라우저 조작 없이 코드 리뷰로 로직 확인(생성 흐름/수정 흐름 분기, 관계도 노드 클릭 경로 포함)

## 2026-07-22 (48차) · 관계도 라벨 박스 겹침 추가 수정
- 증상: 47차에서 화살표 선 자체는 평행하게 잘 벌어졌지만, 관계 라벨 배경 박스(가로 폭 36~47px)가 선 사이 간격(18px)보다 넓어 라벨끼리는 여전히 겹쳐 보임(스크린샷: "무관심"과 "증오" 박스가 겹침)
- **app.js** 수정 — `charRelationshipGraph()`에서 라벨 위치를 더 이상 선의 정중앙(t=0.5) 고정이 아니라, 같은 캐릭터쌍 안에서 인덱스에 따라 **선을 따라가는 위치(t)도 함께 벌어지도록**(0.26~0.74 범위, 관계 1개면 그대로 0.5) 계산. 화살표 선 자체(평행 오프셋)는 47차 로직 그대로 유지하고 라벨 위치만 추가로 세로 방향(선 진행 방향)으로 어긋나게 해, 좁은 평행 간격에서도 라벨 박스끼리 겹치지 않게 함
- 검증: jsdom — 관계 2개(반대 방향)에서 두 라벨 박스의 사각 영역이 서로 겹치지 않음(AABB 충돌 검사)을 좌표로 확인, 관계 3개(양방향 포함)로 늘려도 어떤 두 라벨 박스도 겹치지 않음을 확인 — 콘솔 오류 0건

## 2026-07-22 (47차) · 관계도 화살표 겹침 수정 + 관계 라벨 배경 박스
- 증상: 같은 두 캐릭터 사이에 관계가 2개 이상(예: A→B "무관심", B→A "증오")이면 화살표 선이 완전히 겹쳐서 하나처럼 보이고, 라벨 글자가 선 위에 그대로 겹쳐 보기 어려움
- **원인 규명**: 평행 오프셋 계산을 각 간선 자신의 from→to 방향 벡터 기준으로 했더니, 두 관계의 방향이 반대이면 수직 오프셋 벡터의 부호도 함께 뒤집혀 결과적으로 같은 방향으로 밀리면서 서로 상쇄 — 두 선이 정확히 같은 좌표에 겹치는 버그였음
- **app.js** 수정 — `charRelationshipGraph()`의 오프셋 계산을 각 간선 고유 방향이 아니라 **정렬된 캐릭터id쌍(A,B) 기준의 고정 방향**으로 바꿔, 관계의 실제 방향(A→B든 B→A든)과 무관하게 같은 쌍의 여러 관계가 항상 일정한 간격(18px)으로 평행하게 벌어지도록 수정. 관계 라벨은 흰 배경 박스(`char-graph-edge-label-bg`, 텍스트 길이에 비례한 폭)를 두고 텍스트를 그 위에 그려 화살표 선과 겹쳐도 잘 읽히게 함. 렌더 순서를 "모든 화살표 선 → 모든 라벨 박스" 2단계로 분리해 어떤 라벨도 다른 화살표 선에 가려지지 않도록 함
- **style.css** 수정 — `.char-graph-edge-label-bg`(카드 배경색 + 테두리) 추가, `.char-graph-edge-label` 글자색을 더 진하게(가독성)
- 검증: jsdom — 같은 캐릭터쌍에 방향이 반대인 관계 2개를 등록했을 때 두 화살표 선의 좌표가 서로 달라짐(18px 간격) 확인, 관계 3개로 늘렸을 때도 3개 모두 서로 다른 위치로 벌어짐 확인, 라벨 박스·텍스트가 SVG상 모든 화살표 선보다 뒤(위)에 그려짐 확인 — 콘솔 오류 0건

## 2026-07-22 (46차) · 캐릭터 "역할"을 보글러의 8가지 캐릭터 원형 드롭다운으로 변경
- 요청: 캐릭터 입력폼의 "역할"을 크리스토퍼 보글러의 캐릭터 원형 기반 드롭다운으로. 사용자가 "9가지"라고 했으나 보글러 원형은 통상 8가지(영웅·정신적 스승·관문의 수호자·전령관·변신자재자·그림자·협력자·장난꾸러기)라 확인 질문 후 표준 8가지로 진행하기로 함
- **data.js** 수정 — `VOGLER_ROLES` 배열 신설(`{n,d}` 형식, ENNEAGRAM과 동일 패턴): 영웅/정신적 스승/관문의 수호자/전령관/변신자재자/그림자/협력자/장난꾸러기 8종 + 각 한 줄 설명
- **app.js** 수정 — `charModal(ch)`의 역할 필드를 자유 텍스트 입력에서 `<select data-k="role">`로 교체(옵션 텍스트는 "이름 — 설명" 형식, MBTI/에니어그램 select와 동일 UX). `blankChar()`의 기본 역할값을 "주인공"에서 목록에 실제로 존재하는 "영웅"으로 변경(기존엔 기본값이 목록에 없어 셀렉트가 빈 상태로 보이는 문제 방지)
- 참고: 이 변경 전에 저장된 캐릭터가 목록에 없는 자유 텍스트 역할(예: "조력자")을 갖고 있으면 팝업에서는 빈 선택으로 보이지만, 값 자체는 사용자가 드롭다운을 조작하기 전까지 보존됨(에니어그램/MBTI와 동일한 기존 동작)
- 검증: jsdom — 역할 필드가 SELECT로 렌더, 옵션이 정확히 8개(+선택 1개)이고 목록 순서·값 일치, 새 캐릭터 기본값 "영웅"이 정상 선택된 상태로 표시, 드롭다운 변경 시 데이터 저장과 갤러리 카드 표시까지 반영 — 콘솔 오류 0건

## 2026-07-22 (45차) · 캐릭터 사진 업로드 + 관계도 화살표/방향 표시
- 요청 2건
  1. 캐릭터 입력폼에 이미지 추가 — 500KB 이하 파일을 300×300px로 압축해 등록, 갤러리에서 확인 가능
  2. 관계도에 화살표 설정 — 화살표 중간에 관계(사랑/증오/무관심 등) 라벨 표시
- **app.js** 수정 —
  - `blankChar()`에 `image:""` 필드 추가
  - `handleCharImageFile(file, ch, onDone)` 신설 — 이미지 MIME 검증, 500KB 초과 시 거부(alert), `FileReader`로 읽은 뒤 `Image`+`<canvas>`로 300×300 정사각형 cover-fit 크롭·JPEG 압축(품질 0.85) 후 데이터URL을 `ch.image`에 저장
  - `charAvatarHtml(ch)` — 이미지가 있으면 `<img>`, 없으면 이니셜 글자를 반환하는 공용 헬퍼. 갤러리 카드(`charGalleryCard`)와 편집 팝업 아바타 미리보기가 공유
  - `charModal(ch)` 상단에 사진 업로드 행 추가 — 아바타 미리보기(`#charImgPreview`), "사진 선택"(파일 입력) / "제거" 버튼, 안내 문구. 업로드·제거 시 미리보기 즉시 갱신
  - 관계 데이터에 `mutual`(양방향 여부) 필드 추가. 관계 추가 폼에 "양방향(서로 같은 관계)" 체크박스 신설. 관계 목록에 방향 표시(`→ 대상` / `↔ 대상`) 추가
  - `charRelationshipGraph()` — SVG `<marker>`로 화살촉 정의 후 각 관계 선의 `marker-end`(및 양방향이면 `marker-start`)에 적용, 화살촉이 노드 원 뒤에 가려지지 않도록 선 끝점을 노드 반지름만큼 안쪽으로 당겨서 그림(기존엔 노드 중심까지 선이 닿아 화살촉이 안 보였을 문제를 함께 해결). 관계 라벨은 그대로 화살표 중앙에 표시
- **style.css** 수정 — `.char-avatar img`(원형 크롭), `.char-img-row`/`.char-avatar-lg`/`.char-img-actions`(팝업 내 사진 업로드 영역), `.char-rel-mutual`(양방향 체크박스), `.char-graph-arrowhead`(화살촉 색상), `.char-graph-edge` 색상을 라인색→강조색으로 조정(화살표가 더 잘 보이도록)
- 검증: jsdom — 이미지가 아닌 파일·500KB 초과 파일 거부(alert, 데이터 불변) 확인, `Image`/`canvas`를 스텁으로 대체해 압축 성공 경로에서 `ch.image`가 저장되고 갤러리에 `<img>`로 반영되는 것까지 확인. 관계 목록에 방향 접두어(→/↔) 정상 표시, 양방향 체크박스로 추가한 관계가 `mutual:true`로 저장, 관계도에서 화살촉 마커 정의 존재·각 선의 marker-end(양방향은 marker-start도) 속성·선 끝점이 노드 중심에서 벗어나 있음(화살촉이 가려지지 않음)까지 확인 — 콘솔 오류 0건

## 2026-07-22 (44차) · 캐릭터 설정 페이지 전면 개편 (갤러리뷰 · 팝업 입력폼 · 관계 · 관계도)
- 요청 4건
  1. 갤러리뷰 형식을 기본으로
  2. "캐릭터 추가" 클릭 시 입력 폼을 팝업으로
  3. 인물 설정 폼에 다른 캐릭터와의 관계 입력
  4. 관계가 입력된 캐릭터들을 그래픽 뷰(관계도)에서 확인
- **데이터 모델** — `blankChar()`에 `id`(uid)와 `relationships:[]`(각 항목 `{id, targetId, label}`) 추가. 기존 `Object.assign({}, blankChar(), c)` 마이그레이션 구조 덕분에 예전 데이터(캐릭터에 id 없음)도 로드 시 자동으로 id가 부여됨. `cleanCharRelationships()` 신설 — 대상 캐릭터가 삭제되면 그 관계도 같이 정리(고아 참조 방지), `rChar()` 진입 시마다 실행
- **app.js** 수정 —
  - `rChar()` 전면 재작성: 상단에 갤러리/관계도 보기 전환 토글(`.char-view-btn`, `charViewMode` 전역)과 "＋ 캐릭터 추가" 버튼(클릭 시 빈 캐릭터 생성 후 바로 편집 팝업을 염)
  - `charGalleryCard(ch)` — 아바타(이니셜, 캐릭터 id 해시 기반 색상)·이름·역할·MBTI/에니어그램 배지·관계 개수를 보여주는 카드. 카드 클릭 시 편집 팝업, 우상단 삭제 버튼(호버 시 노출)
  - `charModal(ch)` — 기존 인라인 폼 필드(이름/역할/MBTI/에니어그램/목표/결함/아크/설명)를 그대로 팝업(`.plot-modal-overlay`+`.plot-modal char-modal`, 기존 대사추가 팝업과 동일 패턴 재사용)으로 이동, 실시간 저장(`bind()`). 하단에 "다른 캐릭터와의 관계" 섹션 추가 — 현재 관계 목록(대상 이름 + 관계 라벨 + x 삭제)과, 다른 캐릭터를 고르는 드롭다운 + 관계 텍스트 입력 + "관계 추가" 버튼으로 새 관계 등록
  - `charRelationshipGraph()` — SVG로 캐릭터를 원형으로 배치하고 관계마다 선 + 라벨(텍스트)을 그리는 관계도. 노드를 클릭하면 그 캐릭터의 편집 팝업이 열림. 캐릭터/관계가 없으면 안내 문구
  - 옛 `charCard(ch,i)`(인라인 풀폼 목록) 함수는 제거
- **style.css** 수정 — `.char-toolbar`/`.char-view-toggle`/`.char-view-btn`(보기 전환), `.char-gallery`/`.char-card-mini`/`.char-avatar`/`.char-badge`/`.char-card-del`(갤러리 카드), `.char-modal`/`.char-modal-body`/`.char-rel-list`/`.char-rel-item`/`.char-rel-add`(편집 팝업·관계 입력), `.char-graph-wrap`/`.char-graph-svg`/`.char-graph-edge`/`.char-graph-node`(관계도) 추가
- 검증: jsdom — 갤러리 카드 렌더, "＋ 캐릭터 추가"로 팝업이 뜨고 이름 입력이 실시간 저장·팝업 제목에 반영, 관계 드롭다운이 자기 자신을 제외한 나머지 캐릭터만 보여줌, 관계 추가/목록 표시, 갤러리 카드에 "관계 N개" 표시, 관계도 전환 시 노드·간선·라벨이 올바른 개수로 렌더되고 노드 클릭 시 해당 캐릭터 편집 팝업이 열림, 관계 대상 캐릭터를 삭제하면 다른 캐릭터의 관계 목록에서도 자동 제거됨 — 콘솔 오류 0건

## 2026-07-22 (43차) · 배경/캐릭터 라벨 1회 표시 + 상단 툴바를 곰국을끼리오너라 스타일로 개편
- 요청 3건
  1. 블록의 배경/캐릭터를 항목마다 "배경: 이름" 반복 대신, 열 맨 앞에 라벨을 한 번만 두고 "배경: 이름1, 이름2" 형식으로
  2. 상단 툴바를 곰국을끼리오너라 index.html처럼 왼쪽에 새로 만들기·저장·불러오기·내보내기 아이콘 그룹으로 재구성(인터페이스를 그대로 이식)
  3. 상단 툴바에 내보내기가 생겼으니 왼쪽 사이드 메뉴의 "내보내기" 탭은 제거
- **app.js** 수정 —
  - `metaChip()` 제거, `metaCol(label, list, onRemoveAt)` 신설 — 라벨(`배경:`/`캐릭터:`)을 한 번만 렌더하고 이름들을 쉼표로 이어 표시, 이름마다 개별 x 삭제 버튼 유지
  - 사이드바 "내보내기" 탭이 사라졌으므로 `renderers` 매핑에서 `export:rExport` 제거, `rExport()` 함수 삭제. 대신 `exportPdf()`(미리보기 생성 후 인쇄) 신설 — `exportDocx`/`exportStory`/`importStory`는 그대로 유지하되 전역 `#preview`(항상 DOM에 존재)를 사용하도록 정리
  - 상단 툴바 새 버튼 이벤트 바인딩: `manualSaveBtn`(수동 저장), `topImportBtn`+`topImportInput`(.story 불러오기), `topExportBtn`+`topExportMenu`(Word/PDF/.story 드롭다운, 문서 클릭 시 자동 닫힘)
- **index.html** 수정 —
  - `<header class="topbar">`를 곰국 스타일로 재구성: 왼쪽 `.mb-left`(새 작품/저장/불러오기/내보내기 드롭다운 아이콘 + 구분선), 가운데 `.proj-controls`(작품 선택/이름변경/삭제), 오른쪽 `.user-auth`(기존 유지)
  - 사이드바에서 "내보내기" nav-group 제거
  - 인쇄(PDF) 전용 `#preview`를 body 최상위에 항상 존재하도록 고정 배치(평소엔 숨김, 인쇄 시에만 노출)
- **style.css** 수정 — `.mb-left`/`.mb-icon`/`.mb-sep`/`.mb-export`/`.mb-export-menu`(곰국 톤 유지, 이 프로젝트 CSS 변수 재사용), `.print-preview`+`@media print`(인쇄 시 `#preview`만 보이고 나머지는 숨김 — 기존엔 인쇄 스타일이 아예 없어 전체 화면이 그대로 인쇄되던 문제도 함께 개선됨), `.scene-meta-col`/`.scene-meta-label`/`.scene-meta-comma`/`.scene-meta-item` 추가(기존 `.scene-chip`류는 더 이상 사용 안 함)
- 검증: jsdom — 사이드바에 "내보내기" 탭 없음(TAB_NAMES 미포함) 확인, 새 상단 버튼 전부 존재, 저장 버튼 동작, 내보내기 드롭다운 토글, 글쓰기/내보내기 탭이 아닌 상태에서도 전역 `#preview`로 PDF/Word/.story 내보내기 정상 동작, 배경·캐릭터 열이 "배경: 학교, 집" / "캐릭터: 철수" 형식으로 렌더 — 콘솔 오류 0건

## 2026-07-22 (42차) · 배경/캐릭터 라벨, 지문추가 명칭, 섹션 우클릭 메뉴, 브라우저 기본 메뉴 차단
- 요청 4건
  1. 블록에 추가된 배경/캐릭터 칩 앞에 "배경: "/"캐릭터: " 라벨 표시
  2. [+본문추가] → [+지문추가]로 명칭 변경
  3. 섹션 구분선의 "아이디어 불러오기"(📥)·"블럭추가"(＋) 아이콘도 심플라인 아이콘으로, 두 기능을 우클릭 메뉴로도 제공
  4. 작업 영역(#app)에서 브라우저 기본 우클릭 메뉴가 뜨지 않도록 차단(자체 메뉴만 사용)
- **app.js** 수정 —
  - `metaChip` 호출 시 배경은 `"배경: "+bg`, 캐릭터는 `"캐릭터: "+nm`로 접두어를 붙여 전달
  - 점선 "본문추가" 버튼 라벨/타이틀을 "지문추가"로 변경(우클릭 메뉴의 "본문 추가" 항목도 "지문 추가"로 통일)
  - 섹션 구분선의 `loadBtn`/`createBtn`을 이모지 대신 `ICONS.load`/`ICONS.plus`로 교체
  - 블록 생성 로직을 `addSceneBlock(sec)`로 함수화(기존 `+` 버튼과 신규 메뉴가 공유)
  - `openSectionCtxMenu(x,y,sec)` 신설 — 섹션 그룹(`.write-group`)에 `contextmenu` 리스너 추가, "아이디어 불러오기"·"블럭 생성" 메뉴 제공. 장면 블록 자체의 우클릭 메뉴는 `stopPropagation`으로 분리되어 있어 서로 충돌하지 않음
  - `#app`에 전역 `contextmenu` 리스너를 추가해 `preventDefault()` — 작업 영역 전체에서 브라우저 기본 우클릭 메뉴 대신 앱 자체 메뉴만 뜨도록 함
- 검증: jsdom — 칩 라벨("배경: 학교"/"캐릭터: 주인공"), 지문추가 버튼 라벨, 구분선 아이콘에 svg 포함, 섹션 빈 여백 우클릭 시 2항목 메뉴(블럭 생성 클릭 시 블록 수 증가 확인), 블록 우클릭은 별도로 정상 동작(섹션 메뉴와 섞이지 않음), `#app` 우클릭 시 브라우저 기본 메뉴 preventDefault 확인 — 콘솔 오류 0건

## 2026-07-22 (41차) · 점선 추가버튼에 대사추가도 병렬 배치 (5:5 2열)
- 요청: 본문추가 버튼 옆에 대사추가 버튼도 추가, 한 행에 5:5 크기로 2열 배치
- **app.js** 수정 — `sceneBlockCard`의 단일 `.scene-dashed-add`를 `.scene-dashed-row`(그리드 컨테이너) 안의 두 버튼(본문추가/대사추가)으로 교체. 대사추가는 기존 대사 입력 팝업(`writeDlgFor`)을 그대로 사용
- **style.css** 수정 — `.scene-dashed-row{display:grid;grid-template-columns:1fr 1fr}`로 5:5 균등 폭 배치
- 검증: jsdom — 점선 버튼 2개(본문추가/대사추가) 렌더 확인, 본문추가 클릭 시 텍스트 항목 생성, 대사추가 클릭 시 대사 팝업 트리거(writeDlgFor 설정)까지 콘솔 오류 0건

## 2026-07-22 (40차) · 본문 블록 헤더 버튼 개편 (배경/캐릭터 태그 + 점선 추가버튼)
- 요청: 본문 블록의 수정/대사추가/블럭추가 버튼은 우클릭 메뉴와 중복되니, 삭제 대신 다음처럼 변경
  - 제목(플롯/제목)은 버튼 없이 텍스트를 직접 클릭하면 편집모드로 전환
  - 본문 블록 아래에 점선 테두리의 "+ 추가" 버튼(새 본문 항목 추가, 대사 추가는 우클릭 메뉴 유지)
  - 기존 아이콘 자리에 [+배경] [+캐릭터] 버튼 신설. 캐릭터는 캐릭터 설정에 등록된 인물을 드롭다운으로 선택(목록 끝에 "직접 입력" 옵션), 배경은 짧은 메모를 직접 입력. 추가된 배경/캐릭터는 플롯/제목 바로 아래 2열로 표시하고 각 항목에 삭제(x) 가능
- **app.js** 수정 —
  - `sceneBlockCard`: 헤더의 ✎/＋/💬 버튼 제거, `titleEl`에 click 리스너 추가(잠금 상태일 때 클릭 시 편집모드 진입), `bgBtn`("+배경", `prompt()`로 메모 입력 후 `bl.backgrounds`에 push)·`charBtn`("+캐릭터", `openCharacterPicker` 호출) 신설. 블록 하단에 `.scene-dashed-add` 점선 버튼 추가(클릭 시 본문 텍스트 항목 1개 추가)
  - `bl.backgrounds`/`bl.characters`(문자열 배열) 데이터 추가. `fillWriteDoc`에서 배열 형태 검증·마이그레이션, 블록 생성 지점(새 블록 만들기/플롯 불러오기 2곳) 모두 빈 배열로 초기화
  - `metaChip(text, onRemove)` — 배경/캐릭터 칩 UI(텍스트 + x 삭제버튼) 공용 생성 함수
  - `openCharacterPicker(btn, bl)` — 기존 `#ctxMenu` DOM/스타일을 재사용해 캐릭터 설정(`P.characters`)의 이름 목록 + "직접 입력" 옵션을 버튼 아래 드롭다운으로 표시
  - 제목/배경·캐릭터 영역을 `head` 바로 아래 `.scene-meta-row`(2열 grid)로 렌더 — 배경·캐릭터가 모두 없으면 렌더 생략
- **style.css** 수정 — `.scene-tagbtn`(+배경/+캐릭터 버튼), `.scene-meta-row`/`.scene-meta-col`(2열 배치), `.scene-chip`/`.chip-text`/`.chip-x`(태그 칩), `.scene-dashed-add`(점선 추가버튼) 추가
- 검증: jsdom(임시 폴더에서 실행)으로 헤더에서 기존 수정/본문추가/대사추가 버튼이 사라짐 → 제목 클릭 시 편집모드 전환 → 점선 추가버튼으로 본문 항목 생성 → [+배경] 메모 추가 → [+캐릭터] 드롭다운에서 기존 인물 선택 → 2열 메타 영역에 칩 2개 표시 → 칩 삭제(x)까지 콘솔 오류 0건으로 확인

## 2026-07-22 (39차) · 곰국을끼리오너라(논문쓰기 도구)에서 UI/기능 일부 이식
- 요청: 자매 프로젝트 "곰국을끼리오너라"의 index.html에서 개발된 개선사항 중 일부를 이 프로젝트에 적용
  1. 심플라인 아이콘(24x24 stroke SVG) 적용
  2. 상단 툴바 인터페이스에 아이콘 반영
  3. 내보내기에 `.story` 확장자(JSON) 추가
  4. 기본 저장은 기존대로 서버(계정 귀속) 유지 — 변경 없음, 확인만 함
  5. 내보내기는 Word(.docx) / PDF / `.story` 세 가지만 지원(hwpx 없음)
  6. 글쓰기 블록 인터페이스 — 장/절/항/목 같은 상위 구조는 도입하지 않고, 기존 "장면 블록(본문 블록)"을 유지한 채 **여러 블록을 선택해 그룹으로 묶는 기능**을 신규 추가
  7. 장면 블록 우클릭 시 커스텀 컨텍스트 메뉴(수정/본문 추가/대사 추가/그룹 묶기·해제/삭제)
- **index.html** 수정 — `html-docx-js` CDN 스크립트 추가, 상단바 새 작품/이름변경/삭제 버튼을 SVG 라인아이콘으로 교체, 전역 `#ctxMenu` DOM 추가
- **style.css** 수정 — `.icon`/`.icon-btn`(아이콘 버튼 공통), `.write-toolbar-right`(선택모드/그룹묶기 버튼 영역), `.scene-select-chk`·`.scene-block.selected`, `.write-blockgroup`/`.wg-head`/`.wg-title`/`.wg-actions`(그룹 상자), `.ctx-menu`(우클릭 메뉴), `.export-btnrow` 추가
- **app.js** 수정 —
  - `ICONS` 객체 신설(라인아이콘 SVG 모음), 장면 블록 헤더 버튼(✎/＋/💬/✕)과 글쓰기 툴바·내보내기 버튼에 적용
  - `writeDoc.groups`(그룹 목록) + 블록별 `groupId` 데이터모델 추가, `fillWriteDoc`에서 구버전 데이터 마이그레이션(잘못된 groupId 제거) 처리
  - 선택모드: `writeSelectMode`/`writeSelectedIds` 신설. 글쓰기 툴바에 "블록 선택" 토글 버튼, 선택모드에서 각 장면 블록에 체크박스 표시
  - `groupSelectedBlocks()`(2개 이상 선택 시 그룹 이름을 물어보고 그룹 생성 + 배열에서 인접하게 재배치) / `ungroupBlocks(gid)`(그룹 해제, 블록은 유지) 신설
  - `blockGroupWrap()`으로 같은 groupId를 가진 연속 블록들을 점선 상자(`.write-blockgroup`)로 묶어 렌더 — 그룹 상자에 이름변경·해제 버튼 포함
  - `openBlockCtxMenu()`/`hideCtxMenu()` 신설 — 장면 블록 우클릭 시 커서 위치에 메뉴 표시(문서 클릭/Esc로 닫힘)
  - 내보내기 탭(`rExport`) 전면 개편: `exportDocx()`(html-docx-js로 미리보기 HTML → .docx), `exportStory()`/`importStory()`(기존 exportJSON/importJSON을 `.story` 확장자로 교체, `.json`도 하위호환으로 불러오기 가능), PDF 버튼 유지
- 검증: jsdom(node_modules 활용, 파일을 /tmp로 복사 후 실행 — 마운트된 폴더에서 직접 실행 시 `require` 지연으로 타임아웃 발생해 우회)으로 장면블록 렌더(3개) → 선택모드 체크박스(3개) → 2개 선택 후 그룹 생성(그룹 1개, 미선택 블록은 그대로) → 그룹 우클릭 메뉴(5개 항목) → 그룹 해제 → 내보내기 탭 버튼(docx/pdf/story 내보내기·불러오기) 클릭까지 콘솔 오류 0건으로 확인

## 2026-07-16 (38차) · 드래그 순서변경이 미리보기에 반영 안 되는 문제 수정 (전 영역 공통 버그)
- 증상: 본문(글쓰기)에서 플롯 블록 순서를 드래그로 바꿨는데 미리보기에 반영되지 않음
- **원인 규명**: 드래그 재정렬은 `dragover`에서 DOM만 실시간으로 옮기고, 실제 데이터 반영(`save()`+`render()`)은 `drop` 이벤트에서만 수행하고 있었음. 그런데 중첩된 드롭존(예: 장면 블록 안의 대사/본문 영역, 아이디어 추가 박스 등) 위에서 마우스를 놓으면 브라우저에 따라 `drop` 이벤트가 안정적으로 발생하지 않을 수 있음 — 이 경우 화면상 블록은 이미 옮겨진 것처럼 보이지만(드래그 중 실시간 DOM 이동 때문) 실제 데이터(`P.writeDoc`/`P.plotDoc`/`P.ideaBlocks`)는 갱신되지 않아, 다시 렌더링되는 미리보기·좌측 목록에는 예전 순서가 그대로 남는 불일치가 발생. jsdom으로 "drop 없이 dragend만 발생"하는 상황을 직접 재현해 실제로 이 불일치가 나타남을 확인
- **app.js** 수정 — 드래그 하나당 처리 여부를 추적하는 전역 플래그 `dndDropHandled` 신설(각 `dragstart`에서 false로 초기화, 해당 `drop` 처리 시 true로 표시). 모든 드래그 정렬 로직에 **`dragend`에서의 안전장치**를 추가해, `drop`이 끝내 발생하지 않았을 경우 `dragend` 시점에 한 번 더 같은 반영 로직을 실행하도록 함:
  - 아이디어 수집: `commitIdeaOrder(list)` 신설(`ideaBlockCard`에 `list` 인자 추가)
  - 플롯 생성 — 섹션 순서: `commitSectionOrder(secWrap)` 신설
  - 플롯 생성 — 섹션 내 아이디어 배치: `commitPlotIdeaOrder(secWrap)` 신설(`plotIdeaCard`에 `secWrap` 인자 추가)
  - 글쓰기 — 장면 블록 순서: `commitWriteBlockOrder(main)` 신설
  - 글쓰기 — 하위 블록(본문/대사) 순서: `commitWriteItemOrder(main)` 신설(`subBlockEl`에 `main` 인자 추가)
- 검증: jsdom으로 "핸들 mousedown→dragstart→(dragover로 인한 DOM 재배치를 수동 시뮬레이션)→**drop 이벤트 없이** dragend만 발생" 시나리오를 5개 영역 전부에서 재현 — 아이디어 수집·플롯 섹션·플롯 아이디어·글쓰기 본문/대사·글쓰기 장면블록 전부 정상적으로 데이터와 화면(미리보기 포함)에 반영됨을 확인

## 2026-07-16 (37차) · 글쓰기 블록 왼쪽 컬러 바를 플롯 단계(섹션) 기준으로 통일
- 요청: 글쓰기 본문의 플롯 블록 왼쪽 색이 아이디어 태그 색이라 섹션 안에서도 블록마다 색이 달랐음 → 같은 플롯 단계면 항상 같은 색으로
- **app.js** 수정 — `getSectionColor(secId)`(섹션 id 해시 기반, `TAG_PALETTE` 재사용) 추가. `sceneBlockCard`의 왼쪽 컬러 바를 (아이디어 태그 대신) `getSectionColor(bl.sectionId)`로 통일 — 같은 섹션의 모든 블록이 동일한 색을 가짐, 다른 섹션은 다른 색
- 검증: jsdom — 같은 섹션·다른 아이디어 태그인 두 블록이 동일 색, 다른 섹션 블록은 다른 색 확인

## 2026-07-16 (36차) · 본문 블록 여백 제거(자동높이) + 제목 줄바꿈 지원
- 요청 ①: 본문 하위블록 아래 빈 여백이 안 없어짐 → 원인은 textarea `min-height:44px`+`resize:vertical`. 자동 높이 조절로 교체
- 요청 ②: 플롯/제목이 블록 폭보다 길면 한 줄 내려가도록(줄바꿈). 단, 제목 칸만 늘어나고 핸들·번호·버튼 위치는 고정
- **app.js** 수정 —
  - `autoGrowTextarea(ta)` 추가 — `scrollHeight`에 맞춰 실시간으로 높이 조절. `sub-textarea`에 `rows=1` 부여, `oninput`/최초 렌더 후(`requestAnimationFrame`) 호출 → 내용 길이만큼만 높이 차지, 빈 여백·리사이즈 손잡이 제거
  - **제목을 `<input>`→`contenteditable div`로 변경**: 길면 자연스럽게 줄바꿈됨(`white-space:pre-wrap`). 기본 `contentEditable=false`(잠금), `✎ 수정` 클릭 시 `true`+포커스+전체선택(`selectAllEditable` 신설), blur 시 다시 잠금. 새 블록 생성 시에도 동일하게 편집 상태로 시작
- **style.css** 수정 —
  - `.scene-head`를 `align-items:flex-start`로 바꾸고 핸들/번호/아이콘버튼에 `margin-top`을 줘서 **제목이 여러 줄이 되어도 버튼들은 첫 줄 위치에 고정**
  - `.scene-title`을 div 전용 스타일로 정리(줄바꿈, `:empty:before`로 placeholder, `[contenteditable=true]`로 편집 상태 표시) — 더 이상 전역 `input[type=text]` 규칙과 충돌하지 않음
  - `.sub-textarea` `resize:none`+`overflow:hidden`+자동높이로 변경, 본문/대사 폰트 10→**11px**로 재조정(사용자 요청)
- 검증: jsdom — 제목이 DIV로 렌더, 기본 잠금(false)→✎ 클릭 후 편집(true), 텍스트 유지, 본문 textarea rows=1·값 정상 확인

## 2026-07-16 (35차) · 아이디어 제목 필드 스타일 + 블록 전체 연속 번호
- 요청: ③은 바깥 블록이 아니라 안쪽 "아이디어/제목" 필드 대상 — 폰트 유지(13px/800)하고 배경을 살짝 어둡게 해 아이디어 블록임을 명확히. + 큰 블록마다 이동 핸들 옆에 순서 번호(섹션 구분 없이 전체 연속)
- **app.js** 수정 — `sceneBlockCard(bl, main, liveRefresh, num)`에 번호 배지(`.scene-num`)를 핸들 옆에 추가. `rWrite`에서 `writeBlockNo` 전역 카운터로 **섹션 구분 없이 1,2,3… 연속 번호** 부여(재정렬 시 자동 갱신)
- **style.css** 수정 — `.scene-title` 배경을 `#ece7dd`(살짝 어둡게)+라인 테두리로 변경(읽기전용=채워진 필드, 편집 시 흰색+액센트). placeholder 두께 상향. `.scene-num`(핸들 옆 원형 번호 배지) 추가
- 검증: jsdom — 2개 섹션 4블록에서 번호 `1,2,3,4` 연속 부여, 제목 readonly 유지 확인

## 2026-07-16 (34차) · 불러오기/생성 버튼을 중앙 구분선 아이콘으로 이동 + 블록 스타일 조정
- 요청 ①: 좌측 플롯 단계의 '아이디어 불러오기'·'아이디어 생성' 버튼 삭제
- 요청 ②: 그 두 기능을 중앙 글쓰기 영역으로 이동 — 섹션 구분선에 **아이콘만**(📥/＋), 마우스 오버 시 기능 이름 툴팁. 불러오기/생성 시 좌측 플롯 단계에 실시간 반영
- 요청 ③: 아이디어 블록(제목) 폰트 1px 축소 + 두껍게, 블록 왼쪽 컬러 바 복원(두껍게)
- **app.js** 수정 —
  - `renderLeftInto`: 좌측 섹션의 불러오기/생성 버튼(`wpl-btnrow`) 제거(블록 목록·글자수·`＋ 플롯 단계 추가`는 유지)
  - `rWrite`: 섹션 구분선(`write-divider`)에 `📥`(아이디어 불러오기)·`＋`(아이디어 생성) 아이콘 버튼 추가(`title` 툴팁). 하단 텍스트형 `＋ 아이디어 생성`(write-add-block) 제거. 클릭 시 `render()`로 좌측 실시간 반영
  - `sceneBlockCard`: 블록 왼쪽 컬러 바 색상을 불러온 아이디어의 태그 색으로(없으면 기본색). 제목 자체의 왼쪽 액센트선은 제거(중복 방지)
- **style.css** 수정 — `.wd-icon`/`.wd-spacer`(구분선 아이콘), `.scene-block` `border-left:6px`(두꺼운 컬러 바 복원), `.scene-title` `font-size:13px`(−1px)·`font-weight:800`(두껍게)·왼쪽 액센트 제거
- 검증: jsdom — 좌측 불러오기/생성 버튼 0개(플롯단계 추가 유지), 구분선 아이콘 2개·툴팁 문구, 아이콘 생성/불러오기 시 좌측 블록목록 실시간 반영(생성 1→불러오기 후 3) 확인

## 2026-07-16 (33차) · 아이디어 수정 UI 개선(가시성) + 글쓰기 수정버튼 방식 + 좌측 단계별 불러오기
- 사용자 피드백: 아이디어 수정할 버튼이 안 보임 / 글쓰기도 아이디어 생성·수정 필요 / 글쓰기는 ✎ 눌렀을 때만 수정 / 좌측에 아이디어 불러오기도 필요
- **app.js** 수정 —
  - **플롯 생성 가시성**: 배치 아이디어 카드에 `✎` 수정 버튼 추가(누르면 텍스트 포커스). 헤더 안내에 "텍스트 클릭/✎로 수정" 문구 추가
  - **글쓰기 라벨 정리**: 좌측·중앙의 "아이디어 추가"를 **"＋ 아이디어 생성"**으로 변경(불러오기(추가)와 구분)
  - **글쓰기 제목 수정 방식**: 장면 블록 제목을 기본 **읽기전용(잠금)**으로 두고, 헤더의 **`✎ 수정`** 버튼을 눌러야 편집 가능(편집 후 blur 시 다시 잠금). 새로 생성한 블록은 자동으로 편집 상태로 포커스
  - **좌측 단계별 불러오기**: 각 플롯 단계에 `📥 아이디어 불러오기`(그 단계의 플롯 배치 아이디어만 불러옴, `loadSectionIdeas`) + `＋ 아이디어 생성` 버튼을 한 줄로 배치
- **style.css** 수정 — `.plot-idea-text` 편집 affordance(hover/focus 테두리, cursor:text)와 `.plot-idea-edit` 버튼, `.scene-title` 읽기전용/편집 상태 구분 스타일과 `.scene-edit-btn`, 좌측 `.wpl-btnrow`/`.wpl-load` 추가
- 검증: jsdom — 플롯 ✎ 버튼 렌더/클릭, 좌측 단계별 불러오기(2개 로드)·생성 버튼, 제목 기본 readonly=true·✎ 클릭 후 false 확인
- 참고: 정적 배포(Cloudflare Pages)라 반영까지 시간이 걸리거나 브라우저 캐시가 남을 수 있음 → 새로고침(Ctrl/Cmd+Shift+R) 권장

## 2026-07-16 (32차) · 아이디어 독립 수정(글쓰기·플롯 생성) + 좌측 아이디어/플롯 추가 버튼
- 요청 ①: 글쓰기에 불러온 아이디어를 아이디어 수집과 무관하게 수정 가능하게
- 요청 ②: 좌측 플롯 단계에 아이디어 추가·플롯 추가 버튼
- 요청 ③: 플롯 생성에서도 아이디어 수집과 무관하게 아이디어 수정 가능하게
- **app.js** 수정 —
  - **플롯 생성 독립 수정(③)**: `plotDoc.ideaOverrides`(아이디어 id→텍스트) 맵 추가(`fillPlotDoc`/`blankProject`). `plotIdeaText(id)`(오버라이드 있으면 그 값, 없으면 원본)/`setPlotIdeaText`. `plotIdeaCard`의 텍스트를 `contenteditable`로 만들어 편집 시 오버라이드에 저장 → **아이디어 수집 원본 불변**. 태그/색상은 원본 유지. 내보내기 미리보기도 `plotIdeaText` 사용
  - **글쓰기 독립 수정(①)**: 블록에 `title` 필드 추가(`fillWriteDoc`). 참고 라벨(읽기전용)을 **편집 가능한 제목 입력창**으로 교체 → 수정해도 아이디어 수집/플롯 생성과 독립. `loadPlotIntoWrite`는 `plotIdeaText` 스냅샷을 title로 저장. 예전 블록은 `rWrite`에서 1회 스냅샷 마이그레이션. 좌측 블록 라벨도 title 우선 사용
  - **좌측 버튼(②)**: `renderLeftInto`에서 섹션마다 `＋ 아이디어`(해당 섹션에 장면 블록 추가 후 제목 포커스), 좌측 하단에 `＋ 플롯 단계 추가`(plotDoc에 섹션 추가). `writeFocusTitle`로 새 블록 제목 자동 포커스+스크롤(`scrollIntoView` 가드)
- **style.css** 수정 — `.scene-title`(편집 입력창), `.wpl-add`/`.wpl-add-section`(좌측 버튼), `.plot-idea-text` 편집 포커스/빈값 placeholder 추가. 기존 `.scene-ref` 제거
- 검증: jsdom — 플롯 오버라이드 편집 시 원본 불변, 글쓰기 title이 오버라이드 스냅샷 반영·이후 독립, 좌측 ＋아이디어/＋플롯단계 동작, 스크롤 에러 없음 확인

## 2026-07-16 (31차) · 글쓰기 작업영역 왼쪽 정렬 + 미리보기 상시 표시(좁으면 자동 숨김)
- **app.js** 수정 — `미리보기` 토글 버튼과 `writePreviewOn` 상태 제거. 미리보기 패널을 항상 렌더링(넓은 화면 상시 표시), 좁은 화면에서는 CSS로 숨김. `liveRefresh`는 항상 좌측+미리보기 갱신. 툴바에는 `📥 플롯 불러오기`만 유지
- **style.css** 수정 —
  - `.write-layout` 가운데 정렬(max-width/margin auto) 제거 → **왼쪽 정렬**
  - `.write-main` `flex:0 1 800px`(고정 폭, 필요 시 축소) → 블록은 플롯 생성과 유사한 폭 유지
  - `.write-preview` `flex:1 1 0; min-width:300px` → 오른쪽 **남은 공간을 모두 채움**
  - `@media(max-width:1023px)`: 미리보기 `display:none`, 중앙 본문이 남은 폭 사용(좁은 화면 자동 숨김). `@media(max-width:820px)`: 좌측 플롯 목록을 위로 스택
- 검증: jsdom — 미리보기 패널 상시 1개, 토글 버튼 없음, 불러오기 버튼 유지, 편집 시 미리보기 반영 확인

## 2026-07-16 (30차) · 글쓰기 좌측에 섹션별 블록 목록 표시 + 작업영역 폭 조정
- 요청 ①: 좌측 플롯 단계 표시에 섹션별 장면 블록(아이디어)을 순서대로 표시, 중앙에서 순서 변경·수정 시 실시간 반영
- 요청 ②: 본문 작업 화면 폭이 너무 커서 플롯 생성 블록과 같은 크기로
- 요청 ③: 미리보기를 전체 작업화면의 1/3로
- **app.js** 수정 —
  - `renderLeftInto`: 각 섹션 항목 아래 `.wpl-blocks` 목록 추가. 블록 라벨은 `fromIdea`면 원본 아이디어 텍스트, 아니면 첫 본문/대사 미리보기(`blockFirstText`). 클릭 시 해당 블록으로 스크롤. 좌측은 드래그(전체 재렌더)/타이핑(`liveRefresh`) 시 갱신되므로 순서·수정이 실시간 반영
  - `sceneBlockCard`: 각 블록에 `id="wblk-<id>"` 부여(좌측에서 스크롤 이동용)
- **style.css** 수정 —
  - `.write-layout` 최대폭 1120px·가운데 정렬(②: 화면 좌우로 과하게 넓어지지 않게)
  - `.write-main` `max-width:800px`로 제한(② 플롯 생성 블록과 유사한 폭)
  - `.write-plotlist` 고정 200px, `.write-preview` `flex:0 0 33.33%`(③ 1/3)
  - `.wpl-blocks`/`.wpl-block`(들여쓴 목록, 말줄임) 추가
- 검증: jsdom — 좌측 블록목록 순서 표시, 순서 뒤집기 후 라벨 순서 반영, 수동 블록 본문 미리보기, `wblk-` id 부여 확인

## 2026-07-16 (29차) · 글쓰기 본문도 하위블록化 + 하위블록 블록 간 이동, 참고 라벨 개선
- 요청 ①: 원본 아이디어 참고 라벨에서 💡 아이콘 제거 + 폰트 확대(12→14px, 색을 진하게)해 가독성 개선
- 요청 ②: 장면 블록의 본문도 대사처럼 하위 블록으로 만들고, 하위 블록을 다른 장면 블록으로 이동 가능하게
- **app.js** 수정 —
  - **데이터 모델 통합**: 블록의 `text`+`lines`를 하나의 `items` 배열로 통합. 각 항목 `{id, type:"text"|"line", char, text}`(text=본문, line=대사). `fillWriteDoc`에 **구버전 자동 마이그레이션**(기존 text→본문 항목, lines→대사 항목) 포함
  - `sceneBlockCard`: 헤더에 `＋ 본문` 버튼 추가(본문 하위블록 생성), 기존 `💬 대사 추가` 유지. 본문/대사를 공통 `subBlockEl()`로 렌더(본문=인라인 textarea, 대사=캐릭터+대사 표시). 비어있으면 안내 placeholder
  - **하위 블록 드래그**: `setupItemDnD`/`rebuildItemsFromDOM`으로 블록 내 정렬 + **다른 장면 블록으로 이동** 지원(모든 `.scene-items` 컨테이너 공용, 드롭 시 전체 재구성). 블록 순서 드래그(`.scene-block`)와 이벤트 가드로 충돌 방지
  - `blockChars`(items 합산), `dialogueModal`(items에 line push), `renderPreviewInto`(items 순회: text→본문 문단, line→대사 문단), `loadPlotIntoWrite`(빈 items 블록 생성) 반영. 전역 mouseup 리셋에 `.scene-block`/`.sub-block` 추가
- **style.css** 수정 — `.scene-ref` 14px·진한 색, `.scene-add-btn`, `.scene-items`, `.sub-block`(본문/대사 공통, 드래그), `.sub-textarea`, `.sub-empty` 추가. 기존 `.dlg-lines`/`.scene-text` 정리
- 검증: jsdom — 구버전 마이그레이션(본문+대사 2항목), 하위블록 렌더(본문1·대사1), ＋본문 버튼, 참고 라벨 이모지 제거·텍스트, 글자수 합산, **블록 간 하위블록 이동**(b1→b2) 정상, 미리보기 반영 확인

## 2026-07-16 (28차) · [글쓰기]에서 플롯 불러오기
- **app.js** 수정 —
  - `fillWriteDoc`/블록 모델에 `fromIdea`(출처 아이디어 id) 추가
  - 글쓰기 툴바에 `📥 플롯 불러오기` 버튼 + `loadPlotIntoWrite()`: 플롯 생성에서 각 섹션에 배치한 아이디어를 순서대로 장면 블록으로 생성(해당 섹션에 배정). 이미 불러온 아이디어(`fromIdea` 중복)는 건너뜀 → 여러 번 눌러도 중복 생성 안 됨. 결과 개수 알림
  - `sceneBlockCard`: 플롯에서 불러온 블록은 원본 아이디어 텍스트를 참고 라벨(`💡 …`, 첫 태그 색상)로 표시. 원본이 삭제됐으면 "원본 아이디어가 삭제됨" 표기. 본문 textarea는 비워 둬(창작자가 프로즈 작성), 글자수엔 참고 라벨 미포함
- **style.css** 수정 — `.scene-ref` 추가, `.write-toolbar`를 space-between(좌: 불러오기 / 우: 미리보기)
- 검증: jsdom — 불러오기 전 0블록 → 후 2블록(i1·i2), fromIdea 매칭, 참고 라벨 2개·텍스트 확인, 재실행 시 중복 없음, 원본 삭제 시 gone 라벨 1개

## 2026-07-16 (27차) · [글쓰기] 메뉴 신설 — 3분할 레이아웃 + 대사 블록
- 워크플로 3단계(글쓰기) 구현. 좌(플롯 목록+글자수/%)·중앙(장면 블록)·우(미리보기) 3분할
- **app.js** 수정 —
  - `blankProject`에 `writeDoc:{blocks:[]}` 추가, `fillWriteDoc()` 보정 함수 + `fillProject` 반영
  - 사이드바 렌더러에 `write:rWrite` 연결, `render()`에서 글쓰기 탭일 때 `#app`에 `wide` 클래스(최대폭 제한 해제)
  - `rWrite()`: 플롯 미생성 시 안내. 고아 블록(삭제된 섹션 소속)은 첫 섹션으로 회수
    - **좌측**(`renderLeftInto`): 플롯 섹션 목록, 각 섹션 글자수 + 전체 대비 %(막대 그래프), 클릭 시 해당 섹션으로 스크롤. 타이핑 시 전체 재렌더 없이 좌측/미리보기만 실시간 갱신(`liveRefresh`)해 textarea 포커스 유지
    - **중앙**: 플롯 섹션별 가로 구분선(`write-divider`) + 장면 블록 목록. 블록마다 장면 텍스트(textarea), 핸들(⠿)로 섹션 간 이동·정렬, 삭제, `＋ 장면 블록 추가`
    - **우측**(`renderPreviewInto`): `미리보기` 토글 시 작업영역을 나눠 A4 비율 페이지로 문서 표시. 블록 높이를 누적해 A4 세로 높이마다 가로 점선(`wp-pagebreak`)으로 페이지 구분. 순서 변경 시 실시간 반영
  - **대사 블록**: 각 장면 블록에 작은 `💬 대사 추가` 버튼 → 팝업(`dialogueModal`)에서 캐릭터 선택(캐릭터 설정에 등록된 인물 목록, 없으면 이름 직접 입력) + 대사 입력 → 블록 안에 대사 줄 생성. `추가`/`추가하고 계속`(연속 입력). 대사 줄은 핸들로 블록 내 순서 변경(`setupLineDnD`/`rebuildLinesFromDOM`), 삭제 가능. → 이후 "대사만 내보내기"에서 재활용 예정
  - 드래그 rebuild: `rebuildWriteFromDOM`(블록 순서·소속 섹션), `rebuildLinesFromDOM`(대사 순서, 블록 간 이동 지원). `getDragAfterEl` 공용 함수 재사용
- **index.html** 수정 — 사이드바에 `✍️ 글쓰기` 그룹/탭 추가
- **style.css** 수정 — `.write-layout`(3분할, 반응형), `.write-plotlist`(sticky, %막대), `.scene-block`, `.dlg-lines`/`.dlg-line`, `.dlg-modal`, `.wp-page`/`.wp-inner`/`.wp-pagebreak`(A4 미리보기) 등 추가
- 검증: jsdom — 플롯 미생성 가드, 좌측 5항목·그룹 5·app.wide, 장면블록/대사버튼, 팝업 캐릭터 옵션 3(미지정+2인), 대사 2줄(철수/영희), 글자수 합계 21·섹션합 일치, 미리보기 대사 2·본문 1 확인
- **참고**: 블록별 [배경]/[캐릭터] 태그 지정은 배경 메뉴(다중 배경) 신설 후 연동 예정. 대사만 내보내기 기능은 대사 블록 데이터(`writeDoc.blocks[].lines`)를 활용해 다음에 구현

## 2026-07-16 (26차) · 아이디어 선택창을 인라인 확장 → 팝업(모달)으로 변경
- **app.js** 수정 — `plotPicker()`(섹션 하단에 붙던 인라인 패널)를 `plotPickerModal()`로 교체. 이제 ＋ 클릭 시 화면 중앙에 팝업(오버레이+박스)으로 뜸. 배경(오버레이) 클릭 또는 ✕로 닫힘. 팝업 제목에 섹션 이름 표시. `rPlot()` 끝에서 `plotPickerFor`가 있으면 해당 섹션 팝업을 `app`에 렌더. 섹션 카드 내부의 인라인 피커 렌더 제거
- **style.css** 수정 — `.plot-picker` 인라인 스타일 제거, `.plot-modal-overlay`/`.plot-modal`(중앙 정렬, max-height 85vh, 스크롤) 추가
- 검증: jsdom — 닫힘 상태 오버레이 0, 열림 시 오버레이/모달 1·항목 2개, 섹션 내 인라인 피커 0 확인

## 2026-07-16 (25차) · [플롯 생성] UX 개선 — 섹션별 아이디어 피커(태그필터) + 섹션 순서 변경
- 사용자 요청: 미배치 아이디어가 늘어나면 한 번에 보기 어려우므로, 상단 풀 대신 각 섹션에 ＋ 버튼을 두고 누르면 아이디어 목록이 열리게(태그 필터 포함). 섹션 자체 순서 변경도 추가. (첨부 스크린샷 참고)
- **data.js** 수정 — `PLOT_STRUCTURES`의 각 섹션을 `{name, desc}` 형태로 변경(섹션마다 "예) ..." 설명 표시). hero12는 HERO_STAGES의 desc 재사용
- **app.js** 수정 —
  - 상단 "미배치 아이디어 풀" 카드 제거
  - `plotSectionCard()` 신설: 섹션 헤더에 아이콘 버튼(✎ 이름수정 / ＋ 아이디어추가 / ☰ 섹션이동핸들 / ▾▸ 접기 / 🗑 삭제), 예시 설명, 배치된 아이디어 목록, `＋ 아이디어 추가` 대시박스
  - `plotPicker()` 신설: ＋ 클릭 시 섹션 하단에 미배치 아이디어 목록을 펼침. 상단에 **태그 필터 바**(전체 + 태그칩) 제공, 항목 클릭 시 해당 섹션에 추가(피커는 열린 채 유지해 연속 추가 가능). 상태변수 `plotPickerFor`/`plotPickerFilter`
  - 섹션 접기 상태 `plotCollapsed`(Set, 화면 전용)
  - **섹션 순서 변경**: 헤더 ☰ 핸들로 섹션 카드를 드래그해 순서 변경(`sec-dragging`, `getDragAfterEl` 공용 함수). 아이디어 카드 드래그(섹션 간 이동/정렬)와 이벤트 충돌 없도록 각 dragover에서 자기 드래그 대상만 처리하도록 가드
  - 아이디어 미니 카드에 ✕(이 섹션에서 빼기) 추가. `＋ 아이디어 추가` 박스는 드래그 드롭 타깃도 겸함(빈 섹션으로 끌어다 놓기 가능)
  - 전역 mouseup 리셋 대상에 `.plot-idea`/`.plot-section` 추가(draggable 잔류 방지)
- **style.css** 수정 — `.plot-icon-btn`, `.plot-sec-desc`, `.plot-add-box`, `.plot-picker`/`.plot-picker-filter`/`.plot-pick-item`, `.sec-dragging` 등 추가, 기존 풀 스타일 정리
- 검증: jsdom으로 렌더 스모크 테스트 통과 — 섹션 3/설명 3/＋박스 3, 피커 열림·항목 3·필터칩 4(전체+태그3), i1 배치 후 미배치 i2·i3, 접기 시 body 숨김, 내보내기 미리보기 반영 확인
- **다음 단계(예정)**: [글쓰기] 메뉴

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
