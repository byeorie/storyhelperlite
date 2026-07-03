# AI(Gemini) 연결 설정 가이드 — 교수님용

학생들은 아무 설정도 필요 없습니다. **교수님이 아래 한 번만** 설정하면, 모든 학생이 자기 사이트에서 AI 기능을 쓸 수 있습니다.
(코딩 지식 없이 따라할 수 있도록 작성했습니다. 약 15분 소요.)

---

## 1단계 · Gemini 무료 API키 발급

1. https://aistudio.google.com/apikey 접속 (구글 로그인)
2. **"Create API key"** 클릭
3. 만들어진 키(`AIza...`로 시작하는 긴 문자열)를 복사해 메모장에 잠깐 보관

> 무료 등급으로 충분합니다(분당 약 10회, 하루 약 500회). 수업용으로 적절합니다.

---

## 2단계 · Cloudflare Worker 만들기 (AI 중계 서버, 무료)

이 서버가 API키를 숨겨서 보관하고, 학생 사이트의 요청을 Gemini에 전달합니다.

1. https://dash.cloudflare.com 에서 무료 회원가입 / 로그인
2. 왼쪽 메뉴 **Compute (Workers)** → **Workers & Pages** → **Create application** → **Create Worker**
3. 이름을 정하고(예: `storyhelper-ai`) **Deploy** 클릭
4. 배포되면 **Edit code** 클릭
5. 편집창의 기존 코드를 모두 지우고, 이 폴더의 **`cloudflare-worker.js`** 내용을 전부 복사해 붙여넣기
6. 오른쪽 위 **Deploy** 클릭

---

## 3단계 · API키를 서버에 안전하게 넣기

1. Worker 페이지에서 **Settings** → **Variables and Secrets**
2. **Add** 클릭 → Type을 **Secret** 으로 선택
3. 이름(Name)에 정확히 `GEMINI_KEY` 입력
4. 값(Value)에 1단계에서 복사한 API키 붙여넣기 → **Save / Deploy**

---

## 4단계 · 사이트에 서버 주소 연결

1. Worker 페이지 상단에 있는 주소를 복사합니다 (예: `https://storyhelper-ai.본인계정.workers.dev`)
2. 이 폴더의 **`gemini.js`** 파일을 열어 맨 위 줄을 찾습니다:

   ```js
   const PROXY_URL = "https://your-worker.workers.dev";
   ```
3. 따옴표 안의 주소를 복사한 Worker 주소로 교체하고 저장
4. GitHub에 다시 올리면(푸시) 끝!

---

## 확인

학생 사이트에서 **⑤ 플롯 탭 → AI 조언** 또는 **⑥ AI 도움 → 비슷한 작품 찾기**를 눌러
답변이 나오면 정상입니다.

문제가 생기면: Worker 주소가 맞는지, `GEMINI_KEY` 이름이 정확한지, gemini.js를 저장 후 푸시했는지 확인하세요.
