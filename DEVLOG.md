# 개발 로그 (DEVLOG)

프로젝트 파일이 생성/수정/삭제될 때마다 이 파일을 갱신합니다.

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
