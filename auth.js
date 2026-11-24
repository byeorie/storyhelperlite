/* ===== 자체 로그인/회원가입 (서버: Cloudflare Pages Functions + D1) ===== */
const TOKEN_KEY = "shl_token";
const USERINFO_KEY = "shl_userinfo";
/* 서버 상태 표시용 심플라인 구름 아이콘 */
const CLOUD_ICON = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>';

let authToken = null;
let currentUser = null; // {username, name, school, email}
/* (2026-09-08) "서버에서 내 데이터를 확실히 불러온 뒤에만 서버에 저장한다"는 안전장치.
   서버 조회(GET /api/data)가 실패했거나 아직 끝나지 않은 상태에서 로컬 데이터를 서버로 올리면,
   빈 화면/예전 내용이 서버의 정상 데이터를 덮어써 작품이 통째로 사라질 수 있다.
   불러오기가 성공(또는 "서버에 데이터 없음"을 확인)하기 전까지는 서버 저장을 보류한다. */
let serverDataLoaded = false;
let serverLoadRetryTimer = null;
let serverLoadRetries = 0;
let serverLoadAlerted = false;
function serverSaveReady() { return !!getToken() && serverDataLoaded; }

function getToken() {
  if (authToken) return authToken;
  try { authToken = localStorage.getItem(TOKEN_KEY); } catch (e) {}
  return authToken;
}
function saveAuth(token, user) {
  authToken = token;
  currentUser = user;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERINFO_KEY, JSON.stringify(user));
  } catch (e) {}
}
function clearAuth() {
  authToken = null;
  currentUser = null;
  serverDataLoaded = false;
  serverLoadRetries = 0;
  serverLoadAlerted = false;
  clearTimeout(serverLoadRetryTimer);
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERINFO_KEY);
  } catch (e) {}
}
function restoreAuth() {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    const u = JSON.parse(localStorage.getItem(USERINFO_KEY));
    if (t && u) { authToken = t; currentUser = u; return true; }
  } catch (e) {}
  return false;
}

async function apiFetch(path, options) {
  options = options || {};
  const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  let r, bodyJson = null;
  try {
    r = await fetch("/api/" + path, Object.assign({}, options, { headers }));
    try { bodyJson = await r.json(); } catch (e) {}
  } catch (e) {
    return { ok: false, status: 0, body: { error: "서버에 연결할 수 없습니다." } };
  }
  return { ok: r.ok, status: r.status, body: bodyJson };
}

/* ===== 로그인 상태 UI ===== */
function setLoggedInUI() {
  document.body.classList.add("logged-in");
  // 2026-09-22: 관리자가 정한 파일 제출 용량 제한을 서버에서 받아온다(app.js의 FILE_MAX_MB).
  if (typeof loadAppSettings === "function") loadAppSettings();
  const btn = document.getElementById("userMenuBtn");
  if (btn) {
    btn.hidden = false;
    const initial = (currentUser.name || "?").charAt(0);
    btn.innerHTML = `<span class="avatar-fallback">${initial}</span>`;
    btn.title = currentUser.name || currentUser.username;
    btn.onclick = (e) => { e.stopPropagation(); toggleUserMenu(); };
  }
  const info = document.getElementById("userMenuInfo");
  if (info) info.textContent = `${currentUser.name || ""} · ${currentUser.school || ""}`;
  if (typeof onAuthChanged === "function") onAuthChanged();
}
function setLoggedOutUI() {
  document.body.classList.remove("logged-in");
  const btn = document.getElementById("userMenuBtn");
  if (btn) { btn.hidden = true; btn.onclick = null; }
  toggleUserMenu(true);
  const st = document.getElementById("serverStatus");
  if (st) st.textContent = "로컬 저장";
  if (typeof onAuthChanged === "function") onAuthChanged();
}

function toggleUserMenu(forceHide) {
  const menu = document.getElementById("userMenu");
  const btn = document.getElementById("userMenuBtn");
  if (!menu || !btn) return;
  const hide = forceHide === true || !menu.hidden;
  if (!hide) {
    document.body.appendChild(menu); // 상단바 overflow에 잘리지 않도록 밖으로 이동
    const r = btn.getBoundingClientRect();
    let top = r.bottom + 8;
    if (top + 210 > window.innerHeight) top = r.top - 8 - 210;
    menu.style.top = top + "px";
    menu.style.right = (window.innerWidth - r.right) + "px";
    menu.style.left = "auto";
    menu.style.minWidth = "170px";
  }
  menu.hidden = hide;
}
document.addEventListener("click", (e) => {
  const btn = document.getElementById("userMenuBtn");
  const menu = document.getElementById("userMenu");
  const insideBtn = btn && btn.contains(e.target);
  const insideMenu = menu && menu.contains(e.target);
  if (!insideBtn && !insideMenu) toggleUserMenu(true);
});

// 계정 관련 모달 공통 뼈대 — 2026-08-20: 예전에는 [설정] 버튼 하나가 개인정보/교수 코드/비밀번호
// 변경을 전부 한 모달에 몰아넣어 내용이 길어지면 화면 아래로 잘리는 문제가 있었음. 계정 드롭다운
// 메뉴 자체를 3개 항목으로 나누고, 각 항목은 이 헬퍼로 자기 내용만 담은 작은 모달을 띄운다.
// 2026-09-02: "등록 코드"(수업 코드 입력) 버튼은 왼쪽 사이드 메뉴(#classCodeMenuBtn)로 옮겨졌지만
// 모달 자체는 그대로 이 헬퍼를 재사용한다.
function openAccountModal(title, bodyHtml, onMount) {
  toggleUserMenu(true);
  const overlay=document.createElement("div"); overlay.className="plot-modal-overlay";
  overlay.onclick=e=>{ if(e.target===overlay) document.body.removeChild(overlay); };
  const box=document.createElement("div"); box.className="plot-modal account-modal";
  const top=document.createElement("div"); top.className="plot-picker-top";
  const ttl=document.createElement("span"); ttl.className="plot-picker-title"; ttl.textContent=title;
  const closeBtn=(typeof iconBtn==="function" && typeof ICONS!=="undefined")
    ? iconBtn(ICONS.close, "닫기", ()=>document.body.removeChild(overlay))
    : (()=>{ const b=document.createElement("button"); b.type="button"; b.textContent="닫기"; b.onclick=()=>document.body.removeChild(overlay); return b; })();
  top.append(ttl, closeBtn);
  box.appendChild(top);

  const body=document.createElement("div"); body.className="account-modal-body";
  body.innerHTML = bodyHtml;
  box.appendChild(body);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  if (typeof onMount === "function") onMount(body, overlay);
  return { overlay, body };
}

// 개인정보 수정 — 모든 계정(학생/교수/관리자) 공통. 아이디(username)는 로그인 식별자라 여기서는
// 바꾸지 않는다(비밀번호는 openPasswordChange()에서 이메일로 변경).
function openProfileEdit() {
  const esc2 = typeof esc==="function" ? esc : (s=>String(s==null?"":s));
  const html = `
    <p class="hint">개인정보를 수정할 수 있습니다.</p>
    <div class="plan-block"><label>학교</label><input type="text" id="profileSchoolInput" value="${esc2(currentUser && currentUser.school || "")}"></div>
    <div class="plan-block"><label>이름</label><input type="text" id="profileNameInput" value="${esc2(currentUser && currentUser.name || "")}"></div>
    <div class="plan-block"><label>이메일</label><input type="email" id="profileEmailInput" value="${esc2(currentUser && currentUser.email || "")}"></div>
    <p id="profileMsg" class="hint" style="min-height:18px"></p>
    <button class="btn ghost" id="profileSaveBtn" style="width:100%">개인정보 저장</button>
  `;
  openAccountModal("개인정보 수정", html, () => {
    const profileSaveBtn = document.getElementById("profileSaveBtn");
    if (profileSaveBtn) {
      profileSaveBtn.onclick = async () => {
        const school = document.getElementById("profileSchoolInput").value.trim();
        const name = document.getElementById("profileNameInput").value.trim();
        const email = document.getElementById("profileEmailInput").value.trim();
        const msgEl = document.getElementById("profileMsg");
        if (!school || !name || !email) { msgEl.textContent = "모든 항목을 입력해주세요."; return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msgEl.textContent = "올바른 이메일 형식이 아닙니다."; return; }
        profileSaveBtn.disabled = true;
        msgEl.textContent = "저장 중…";
        const res = await apiFetch("update-profile", { method: "POST", body: JSON.stringify({ school, name, email }) });
        profileSaveBtn.disabled = false;
        if (res.ok && res.body && res.body.user) {
          currentUser = Object.assign({}, currentUser, res.body.user);
          saveAuth(getToken(), currentUser);
          setLoggedInUI();
          if (typeof onAuthChanged === "function") onAuthChanged();
          msgEl.textContent = "저장되었습니다.";
        } else {
          msgEl.textContent = (res.body && res.body.error) || "저장에 실패했습니다.";
        }
      };
    }
  });
}

// 등록 코드 — 2026-09-01: 교수 전체 코드는 폐지, 수업(강의)마다 발급되는 코드만 사용.
// 교수 계정은 [수업 관리]에서 각 수업의 코드를 확인/공유하고, 학생 계정은 등록된 강의 목록 확인 + 코드로 추가 등록.
function openProfCodeManager() {
  const esc2 = typeof esc==="function" ? esc : (s=>String(s==null?"":s));
  let html;
  if (currentUser && currentUser.role === "professor") {
    html = `<p class="hint">학생 등록은 이제 수업마다 발급되는 코드로 받습니다. [수업 관리] 탭에서 수업을 만들면 코드가 자동으로 생기고, 목록/상세 화면의 "코드 크게 보기"로 학생들에게 바로 보여줄 수 있습니다.</p>`;
  } else {
    // 2026-08-20: 학생 1명이 여러 교수를 등록할 수 있도록 변경 — 코드를 입력하면 기존 등록을
    // 대체하지 않고 목록에 추가된다. 실제 어느 교수의 과제를 볼지는 상단 툴바의 교수 표시/
    // 드롭다운(app.js refreshProfBar)에서 고른다.
    html = `
      <div id="settingsProfList"><p class="hint">등록된 강의 목록을 불러오는 중…</p></div>
      <div class="plan-block">
        <label>강의 코드 등록</label>
        <input type="text" id="profCodeInput" maxlength="6" placeholder="예: 123456" inputmode="numeric" style="letter-spacing:2px;font-size:16px">
      </div>
      <p id="profJoinMsg" class="hint" style="min-height:18px"></p>
      <button class="btn" id="profJoinBtn" style="width:100%">등록하기</button>
    `;
  }
  openAccountModal("등록 코드", html, () => {
    if (currentUser && currentUser.role !== "professor") {
      loadSettingsProfList();
      const joinBtn = document.getElementById("profJoinBtn");
      if (joinBtn) {
        joinBtn.onclick = async () => {
          const input = document.getElementById("profCodeInput");
          const msgEl = document.getElementById("profJoinMsg");
          const code = (input.value || "").trim();
          if (!/^\d{6}$/.test(code)) { msgEl.textContent = "6자리 숫자 코드를 입력해주세요."; return; }
          joinBtn.disabled = true;
          msgEl.textContent = "확인 중…";
          const res = await apiFetch("student-join", { method: "POST", body: JSON.stringify({ code }) });
          joinBtn.disabled = false;
          if (res.ok && res.body && res.body.ok) {
            const prof = res.body.prof || {};
            const cls = res.body.class || {};
            if (!currentUser.profId) currentUser.profId = prof.id;
            saveAuth(getToken(), currentUser);
            msgEl.textContent = `${prof.school || ""} ${prof.name || ""} 교수님의 '${cls.name || ""}' 수업에 등록했습니다.`;
            input.value = "";
            loadSettingsProfList();
            if (typeof onAuthChanged === "function") onAuthChanged();
          } else {
            msgEl.textContent = (res.body && res.body.error) || "등록에 실패했습니다.";
          }
        };
      }
    }
  });
}

// 비밀번호 변경 — 모든 계정(학생/교수/관리자) 공통
function openPasswordChange() {
  const esc2 = typeof esc==="function" ? esc : (s=>String(s==null?"":s));
  const html = `
    <p class="hint">가입하신 이메일(<b>${esc2((currentUser && currentUser.email) || "")}</b>)로 비밀번호 변경 링크를 보내드립니다.</p>
    <button class="btn ghost" id="pwChangeBtn" style="width:100%">비밀번호 변경 메일 보내기</button>
    <p id="pwChangeMsg" class="hint" style="min-height:18px"></p>
  `;
  openAccountModal("비밀번호 변경", html, () => {
    const pwBtn = document.getElementById("pwChangeBtn");
    if (pwBtn) {
      pwBtn.onclick = async () => {
        const msgEl = document.getElementById("pwChangeMsg");
        pwBtn.disabled = true;
        msgEl.textContent = "전송 중…";
        const res = await apiFetch("request-password-change", { method: "POST" });
        pwBtn.disabled = false;
        msgEl.textContent = (res.body && (res.body.message || res.body.error)) || "요청에 실패했습니다.";
      };
    }
  });
}

/* [설정]의 학생용 "등록된 강의 목록" — 여러 명 등록 가능해진 뒤(2026-08-20) 추가.
   2026-09-08: 교수 단위(student-professors)가 아니라 수업 단위(student-classes)로 목록을 만든다.
   같은 교수님의 수업을 여러 개 들어도 각각 한 줄로 보이고, 줄마다 [나가기] 버튼이 붙는다 —
   수업 코드를 잘못 입력해 엉뚱한 수업에 등록됐을 때 학생이 교수님을 거치지 않고 스스로 뺄 수 있다. */
async function loadSettingsProfList() {
  const wrap = document.getElementById("settingsProfList");
  if (!wrap) return;
  const esc2 = typeof esc === "function" ? esc : (s => String(s == null ? "" : s));
  const res = await apiFetch("student-classes");
  if (!wrap.isConnected) return;
  const classes = (res.ok && res.body && res.body.classes) || [];
  if (!classes.length) {
    wrap.innerHTML = `<p class="hint">아직 등록된 강의가 없습니다. 교수님께 받은 6자리 강의 코드를 아래에 입력해 등록하세요.</p>`;
    return;
  }
  wrap.innerHTML =
    `<p class="hint">등록된 강의 (${classes.length}건) — 상단 수업 선택 드롭다운에서 고를 수 있습니다.
      잘못 등록한 수업이 있으면 [나가기]로 직접 빼실 수 있습니다.</p>
     <ul class="settings-prof-list">${classes.map((c, i) => `
       <li>
         <span class="settings-prof-name">${c.className ? `<b>${esc2(c.className)}</b> · ` : ""}${esc2(c.profSchool || "")} ${esc2(c.profName || "")}${c.className ? "" : " <span class=\"hint\">(수업 미지정)</span>"}</span>
         <button type="button" class="btn ghost sm settings-class-leave" data-i="${i}">나가기</button>
       </li>`).join("")}</ul>`;

  wrap.querySelectorAll(".settings-class-leave").forEach((btn) => {
    btn.onclick = async () => {
      const c = classes[Number(btn.dataset.i)];
      if (!c) return;
      /* 실수로 눌러 수업에서 빠지는 일이 없도록, 어느 수업인지 분명히 보여주고 확인을 받는다 */
      const label = c.className
        ? `"${c.className}" (${c.profName || ""} 교수님)`
        : `${c.profName || ""} 교수님`;
      const ok = confirm(
        `${label} 수업에서 나가시겠습니까?\n\n` +
        `· 이 수업의 과제와 받아둔 첨삭이 화면에 보이지 않게 됩니다.\n` +
        `· 이미 제출한 과제가 지워지지는 않습니다. 같은 등록 코드로 다시 등록하면 그대로 다시 보입니다.\n\n` +
        `나가려면 [확인], 그만두려면 [취소]를 눌러주세요.`
      );
      if (!ok) return;
      btn.disabled = true; btn.textContent = "처리 중…";
      const payload = c.classId != null ? { classId: c.classId } : { profId: c.profId };
      const r = await apiFetch("student-leave-class", { method: "POST", body: JSON.stringify(payload) });
      if (!r.ok) {
        alert((r.body && r.body.error) || "나가기에 실패했습니다.");
        btn.disabled = false; btn.textContent = "나가기";
        return;
      }
      alert(`${label} 수업에서 나갔습니다.`);
      loadSettingsProfList();
      if (typeof onAuthChanged === "function") onAuthChanged(); // 상단 수업 드롭다운 갱신
    };
  });
}

async function signOut() {
  try { await apiFetch("logout", { method: "POST" }); } catch (e) {}
  /* (2026-09-15) 계정이 바뀌면 "이미 서버에 올린 내용" 기억을 반드시 비운다 —
     남겨두면 다음 계정의 첫 저장이 엉뚱하게 생략될 수 있다. */
  if (typeof resetServerSaveCache === "function") resetServerSaveCache();
  clearAuth();
  setLoggedOutUI();
}

/* ===== 로그인/회원가입/찾기 폼 전환 ===== */
function showAuthPanel(name) {
  document.querySelectorAll(".auth-panel").forEach((p) => { p.hidden = p.id !== name; });
  document.querySelectorAll(".auth-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.panel === name);
  });
}

/* ===== 서버 데이터 저장/불러오기 ===== */

/* ===== (2026-11-18) 저장 버전(rev) + 3방향 합치기 — "다시 접속하면 글이 사라진다" 문제의 근본 수정 =====
   원인: 서버가 받은 내용을 무조건 덮어썼기 때문에, 예전 내용을 들고 있는 다른 화면(실습실 PC에 열어둔 탭,
   같은 브라우저의 두 번째 탭, 휴대폰 등)에서 아무 조작이나 하면 그 예전 내용이 새로 쓴 글을 덮어썼다.
   이제
   (1) 서버에서 받은 rev(저장 번호)를 serverRev에 기억해 두고 저장할 때 baseRev로 함께 보낸다.
       서버의 rev가 앞서 있으면 서버는 덮어쓰지 않고 409 + 최신 내용을 돌려준다(functions/api/data.js).
   (2) 그러면 "마지막으로 서버와 맞춘 상태(syncBase — 작품별 해시)"를 기준으로 내 쪽/서버 쪽 중 어느 쪽이
       바뀌었는지 작품 단위로 가려 합친다(mergeSyncData). 한쪽만 바뀐 작품은 바뀐 쪽을 쓰고,
       양쪽 모두 바뀐 작품은 내 쪽을 그대로 두고 서버 쪽은 "(다른 곳에서 저장된 내용)" 사본으로 따로 보관한다
       — 어떤 경우에도 글을 버리지 않는다.
   (3) syncBase는 localStorage(SYNC_BASE_KEY)에도 남겨, 새로고침/재접속 때 이 브라우저에 남아 있던
       "아직 서버에 못 올라간 내용"(불러오기 전에 쓴 글, 예전 화면에서 거절당한 저장)도 서버 내용과 합쳐 올린다.
   (4) 저장 요청은 한 번에 하나만 보낸다(먼저 보낸 요청이 늦게 도착해 새 내용을 덮어쓰는 일 방지).
   (5) 창으로 돌아오면(visibilitychange/focus) 서버 rev만 가볍게 확인해, 그사이 다른 곳에서 저장됐으면
       예전 내용 위에서 계속 쓰지 않도록 곧바로 최신 내용을 받아 합친다. */
const SYNC_BASE_KEY = "storyhelper_v1_syncbase";
const SYNC_META_KEYS = ["projects", "current", "openIds", "modTimes"]; // 해시로 비교하지 않는 키
let serverRev = null;   // 마지막으로 서버와 맞춘 rev (불러오기 전에는 null)
let syncBase = null;    // {p:{작품id:해시}, k:{키:해시}} — 마지막으로 서버와 맞춘 내용의 해시

/* 짧은 문자열 해시(cyrb53) — 내용 비교용 */
function syncHash(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36) + ":" + str.length;
}
/* 키 순서와 무관한 JSON — 비교용 해시는 이것으로 만든다. fillProject() 같은 보정은 값은 그대로 두고
   키 순서만 바꿀 수 있는데, 일반 JSON.stringify로 비교하면 "내용이 바뀌었다"고 잘못 판단해 사본이 생긴다. */
function syncStable(v) {
  if (v === null || typeof v !== "object") { const s = JSON.stringify(v); return typeof s === "undefined" ? "null" : s; }
  if (Array.isArray(v)) return "[" + v.map(syncStable).join(",") + "]";
  const keys = Object.keys(v).filter((k) => typeof v[k] !== "undefined" && typeof v[k] !== "function").sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + syncStable(v[k])).join(",") + "}";
}
function syncHashOf(v) { return syncHash(syncStable(v)); }
/* DB 전체 JSON과 작품별/키별 해시를 한 번에 만든다. JSON은 JSON.stringify(db)와 똑같은 문자열이다. */
function syncSnapshot(db) {
  const parts = [], base = { p: {}, k: {} };
  Object.keys(db || {}).forEach((key) => {
    const v = db[key];
    if (typeof v === "undefined" || typeof v === "function") return;
    let s;
    if (key === "projects" && Array.isArray(v)) {
      const arr = v.map((p) => {
        const js = JSON.stringify(p);
        if (p && p.id) base.p[p.id] = syncHashOf(p);
        return typeof js === "undefined" ? "null" : js;
      });
      s = "[" + arr.join(",") + "]";
    } else {
      s = JSON.stringify(v);
      if (typeof s === "undefined") return;
      if (SYNC_META_KEYS.indexOf(key) < 0) base.k[key] = syncHashOf(v);
    }
    parts.push(JSON.stringify(key) + ":" + s);
  });
  return { json: "{" + parts.join(",") + "}", base };
}
function setSyncBase(base, rev) {
  syncBase = base;
  serverRev = rev;
  try {
    if (currentUser && currentUser.username)
      localStorage.setItem(SYNC_BASE_KEY, JSON.stringify({ user: currentUser.username, rev, p: base.p, k: base.k }));
  } catch (e) {}
}
function storedSyncBase() {
  try {
    const b = JSON.parse(localStorage.getItem(SYNC_BASE_KEY));
    if (b && currentUser && b.user === currentUser.username && b.p && b.k) return { p: b.p, k: b.k };
  } catch (e) {}
  return null;
}
/* ===== (2026-11-24) 공용 PC의 "남겨진 글" 보관(stash) =====
   실습실 PC처럼 여러 학생이 같은 브라우저를 쓰면, 앞 학생이 서버에 못 올린 글(저장 실패한 채 쓴 글)이
   이 브라우저에만 남아 있다가 다음 학생이 로그인해 저장하는 순간 덮여 사라졌다.
   다른 계정의 로컬 데이터를 버리기 전에 그 계정 이름으로 따로 보관해 두고, 그 학생이 이 브라우저에서
   다시 로그인하면 서버 내용과 합쳐 올린 뒤 지운다. (계정별 1개, 마지막 것만) */
const STASH_PREFIX = "storyhelper_v1_stash_";
function stashLeftoverFor(owner) {
  if (!owner) return;
  try {
    /* 메모리의 DB가 아니라 이 브라우저에 저장된 값(LS_KEY)을 보관한다 — 메모리 쪽은 이미 지금 로그인한
       학생의 서버 데이터로 바뀌었을 수 있다 */
    const local = JSON.parse(localStorage.getItem(typeof LS_KEY !== "undefined" ? LS_KEY : "storyhelper_v1"));
    if (!local || !Array.isArray(local.projects) || !local.projects.length) return;
    let base = null;
    const b = JSON.parse(localStorage.getItem(SYNC_BASE_KEY));
    if (b && b.user === owner && b.p && b.k) base = { p: b.p, k: b.k };
    localStorage.setItem(STASH_PREFIX + owner, JSON.stringify({ at: Date.now(), base, db: local }));
  } catch (e) {}
}
function takeStashFor(user) {
  try {
    const s = JSON.parse(localStorage.getItem(STASH_PREFIX + user));
    if (s && s.db && Array.isArray(s.db.projects) && s.db.projects.length) return s;
  } catch (e) {}
  return null;
}
function dropStashFor(user) { try { localStorage.removeItem(STASH_PREFIX + user); } catch (e) {} }
/* 서버 내용으로 화면을 맞춘 뒤 호출 — 이 계정 이름으로 보관된 글이 있으면 합쳐서 올린다 */
function applyStashIfAny() {
  if (!currentUser || !currentUser.username || !serverDataLoaded || serverRev === null) return;
  const s = takeStashFor(currentUser.username);
  if (!s) return;
  let local;
  try { local = normalizeSyncData(JSON.parse(JSON.stringify(s.db))); } catch (e) { dropStashFor(currentUser.username); return; }
  const keepCurrent = DB.current;
  const m = mergeSyncData(local, DB, s.base || null);
  m.db.current = m.db.projects.some((p) => p.id === keepCurrent) ? keepCurrent : m.db.current;
  if (m.changed || syncSnapshot(m.db).json !== syncSnapshot(DB).json) {
    applyMergedDB(m.db);
    render();
    lastSavedJson = null;
    forceSaveToServer();
  }
  dropStashFor(currentUser.username);
  alertSyncCopies(m.copies);
}
/* 서버에서 받은 데이터를 화면에서 쓰는 형태로 보정(예전 버전 데이터의 빠진 칸 채우기 등) */
function normalizeSyncData(data) {
  if (typeof fillProject === "function") data.projects = data.projects.map(fillProject);
  if (!data.projects.some((p) => p.id === data.current)) data.current = data.projects[0].id;
  if (typeof fillWorkDB === "function") data.workDB = fillWorkDB(data.workDB);
  if (typeof fillOpenIds === "function") fillOpenIds(data);
  if (typeof migrateIdeaBlocksToAccount === "function") migrateIdeaBlocksToAccount(data);
  return data;
}
function syncMaxTime(mt) {
  let m = 0;
  Object.keys(mt || {}).forEach((k) => { if (mt[k] > m) m = mt[k]; });
  return m;
}
/* 내 쪽(local)과 서버 쪽(server)을 base(마지막으로 맞춘 상태의 해시) 기준으로 합친다.
   local의 작품 객체는 가능한 한 그대로 재사용한다(편집 중인 화면이 그 객체를 붙들고 있으므로).
   base가 없으면(이번 수정 전에 쓰던 브라우저) 작품별 마지막 수정 시각(modTimes)으로 판단한다.
   돌려주는 값: {db, changed(내 쪽과 달라졌는지), copies(따로 보관한 사본 이름들)} */
function mergeSyncData(local, server, base) {
  const lmt = (local.modTimes && typeof local.modTimes === "object") ? local.modTimes : {};
  const smt = (server.modTimes && typeof server.modTimes === "object") ? server.modTimes : {};
  const bp = base ? base.p : null, bk = base ? base.k : null;
  const sById = {};
  (server.projects || []).forEach((p) => { if (p && p.id) sById[p.id] = p; });
  const lIds = {};
  const projects = [], copies = [], copyIds = [];
  let changed = false;

  (local.projects || []).forEach((L) => {
    if (!L || !L.id) return;
    lIds[L.id] = true;
    const S = sById[L.id];
    const hl = syncHashOf(L);
    if (!S) {
      // 서버에 없는 작품: 예전에 서버에 있었고 내 쪽이 그대로면 = 다른 곳에서 삭제한 것 → 따른다
      if (bp && bp[L.id] && bp[L.id] === hl) { changed = true; return; }
      projects.push(L); return;
    }
    const hs = syncHashOf(S);
    if (hl === hs) { projects.push(L); return; }
    const b = bp ? bp[L.id] : null;
    if (b && hl === b) { projects.push(S); changed = true; return; }   // 서버 쪽만 바뀜
    if (b && hs === b) { projects.push(L); return; }                   // 내 쪽만 바뀜
    const keepCopy = (src, suffix) => {
      const copy = JSON.parse(JSON.stringify(src));
      copy.id = (typeof uid === "function") ? uid() : ("p" + Date.now() + Math.floor(Math.random() * 1e6));
      copy.name = (src.name || "제목 없음") + suffix;
      copy.isSampleProject = false;
      projects.push(copy);
      copies.push(copy.name); copyIds.push(copy.id);
      changed = true;
    };
    /* 기준 없음(이 브라우저에 맞춘 기록이 없음) + 내용이 다름: 서버가 더 최근이면 서버 쪽을 쓰되,
       이 브라우저에 남아 있던 내용도 반드시 사본으로 남긴다.
       (2026-11-24) 예전에는 서버가 더 최근이면 이 브라우저 내용을 그냥 버렸다 — 배포 전에 열어둔 화면에서
       저장이 거절된 채 쓴 글이 이 브라우저에만 남아 있는데, 그사이 다른 PC에서 조금이라도 저장했으면
       나중에 이 PC로 돌아와 로그인할 때 그 글이 사라졌다. */
    if (!b && (smt[L.id] || 0) >= (lmt[L.id] || 0)) {
      projects.push(S); changed = true;
      keepCopy(L, " (이 컴퓨터에 남아 있던 내용)");
      return;
    }
    // 양쪽 모두 바뀜 → 내 쪽을 유지하고, 서버 쪽은 사본으로 보관(어느 쪽 글도 버리지 않는다)
    projects.push(L);
    keepCopy(S, " (다른 곳에서 저장된 내용)");
  });
  (server.projects || []).forEach((S) => {
    if (!S || !S.id || lIds[S.id]) return;
    // 내 쪽에 없는 작품: 예전에 맞춘 적 있고 서버 쪽이 그대로면 = 내가 삭제한 것 → 다시 살리지 않는다
    if (bp && bp[S.id] && bp[S.id] === syncHashOf(S)) return;
    projects.push(S); changed = true;
  });

  const out = {};
  const keys = [];
  Object.keys(local).concat(Object.keys(server)).forEach((k) => { if (keys.indexOf(k) < 0) keys.push(k); });
  const serverNewer = syncMaxTime(smt) >= syncMaxTime(lmt);
  keys.forEach((k) => {
    if (k === "projects") { out.projects = projects; return; }
    if (k === "modTimes") {
      const m = Object.assign({}, smt);
      Object.keys(lmt).forEach((id) => { if (!(m[id] >= lmt[id])) m[id] = lmt[id]; });
      copyIds.forEach((id) => { m[id] = Date.now(); });
      out.modTimes = m; return;
    }
    if (k === "current" || k === "openIds") { out[k] = (k in local) ? local[k] : server[k]; return; }
    const lv = local[k], sv = server[k];
    if (!(k in server)) { out[k] = lv; return; }
    if (!(k in local)) { out[k] = sv; changed = true; return; }
    const hl = syncHashOf(lv), hs = syncHashOf(sv);
    if (hl === hs) { out[k] = lv; return; }
    const b = bk ? bk[k] : null;
    if (b && hl === b) { out[k] = sv; changed = true; return; }
    if (b && hs === b) { out[k] = lv; return; }
    if (Array.isArray(lv) && Array.isArray(sv) && k === "ideaBlocks") {
      // 아이디어 블록: 양쪽 모두 바뀌었으면 id 기준으로 합친다(내 쪽 우선)
      const seen = {}; const arr = [];
      lv.forEach((x) => { if (x && x.id) seen[x.id] = true; arr.push(x); });
      sv.forEach((x) => { if (x && x.id && !seen[x.id]) { arr.push(x); changed = true; } });
      out[k] = arr; return;
    }
    if (!b && serverNewer) { out[k] = sv; changed = true; return; }
    out[k] = lv;
  });
  if (!Array.isArray(out.projects) || !out.projects.length) out.projects = projects.length ? projects : (server.projects || []);
  if (!Array.isArray(out.openIds)) out.openIds = [];
  copyIds.forEach((id) => { if (out.openIds.indexOf(id) < 0) out.openIds.push(id); });
  if (!out.projects.some((p) => p.id === out.current)) out.current = out.projects[0].id;
  if (typeof fillOpenIds === "function") fillOpenIds(out);
  return { db: out, changed, copies };
}
/* 합친 결과를 지금 쓰는 DB 객체에 그대로 덮어 넣는다(DB 객체 자체는 바꾸지 않음) */
function applyMergedDB(merged) {
  Object.keys(DB).forEach((k) => { if (!(k in merged)) delete DB[k]; });
  Object.assign(DB, merged);
  const prevP = P;
  P = currentProject();
  if (P !== prevP && typeof resetUndoHistory === "function") resetUndoHistory();
  try { localStorage.setItem(typeof LS_KEY !== "undefined" ? LS_KEY : "storyhelper_v1", JSON.stringify(DB)); } catch (e) {}
}
function alertSyncCopies(copies) {
  if (!copies || !copies.length) return;
  alert("같은 작품이 서버와 이 컴퓨터(또는 다른 창)에서 서로 다르게 저장되어 있었습니다.\n\n" +
    "어느 쪽 글도 지우지 않고, 한쪽은 아래 이름의 작품으로 따로 보관했습니다.\n" +
    "[다른 작품 열기]에서 두 작품을 비교해 필요한 부분을 옮긴 뒤, 필요 없는 쪽은 지우시면 됩니다.\n\n· " + copies.join("\n· "));
}

let serverLoadInFlight = false;
async function loadFromServer() {
  if (!getToken()) return;
  if (serverLoadInFlight) return;
  clearTimeout(serverLoadRetryTimer);
  const st = document.getElementById("serverStatus");
  if (st) st.innerHTML = CLOUD_ICON + " 불러오는 중…";
  serverLoadInFlight = true;
  let res;
  try { res = await apiFetch("data"); } finally { serverLoadInFlight = false; }
  if (res.status === 401) { signOut(); return; }
  if (res.ok && res.body) {
    serverLoadRetries = 0;
    const data = res.body.data;
    const rev = Number(res.body.rev) || 0;
    /* 이 브라우저에 남아 있는 내용이 지금 로그인한 계정의 것인지(다른 계정이 쓰던 PC가 아닌지) */
    let localOwner = null;
    try { localOwner = localStorage.getItem(typeof LS_OWNER_KEY !== "undefined" ? LS_OWNER_KEY : "__none__"); } catch (e) {}
    const hasLocalData = DB && Array.isArray(DB.projects) && DB.projects.length > 0;
    const localIsMine = hasLocalData && localOwner && currentUser && localOwner === currentUser.username;
    /* (2026-11-24) 다른 학생이 이 브라우저에 남긴 글은 버리기 전에 그 학생 이름으로 보관(공용 PC) */
    if (!serverDataLoaded && localOwner && currentUser && localOwner !== currentUser.username) stashLeftoverFor(localOwner);

    if (data && Array.isArray(data.projects) && data.projects.length && typeof fillProject === "function") {
      normalizeSyncData(data);
      const serverSnap = syncSnapshot(data);
      const wasLoaded = serverDataLoaded;
      serverDataLoaded = true;
      if (localIsMine) {
        /* (2026-11-18) 서버 내용으로 통째로 바꾸지 않고, 이 브라우저에 남은 "아직 못 올린 글"과 합친다 */
        const base = (wasLoaded && syncBase) ? syncBase : storedSyncBase();
        const m = mergeSyncData(DB, data, base);
        setSyncBase(serverSnap.base, rev);
        if (m.changed || !wasLoaded) {
          applyMergedDB(m.db);
          if (!wasLoaded && typeof resetUndoHistory === "function") resetUndoHistory();
          render();
        }
        if (syncSnapshot(DB).json !== serverSnap.json) {
          lastSavedJson = null;
          if (st) st.innerHTML = CLOUD_ICON + " 서버와 합치는 중…";
          forceSaveToServer();
        } else {
          lastSavedJson = serverSnap.json;
          if (st) st.innerHTML = CLOUD_ICON + " 서버에서 불러옴";
        }
        alertSyncCopies(m.copies);
      } else {
        DB = data;
        P = currentProject();
        setSyncBase(serverSnap.base, rev);
        lastSavedJson = serverSnap.json;
        if (typeof resetUndoHistory === "function") resetUndoHistory();
        render();
        if (st) st.innerHTML = CLOUD_ICON + " 서버에서 불러옴";
      }
      applyStashIfAny();
    } else {
      // 서버에 저장된 데이터가 없는 경우 — 이 시점에 메모리의 DB는 로그인 화면이 뜨기 전 localStorage에서
      // 미리 읽어들인 값이다. 예전엔 이럴 때 무조건 빈 작품으로 새로 시작하며 그 빈 내용을 로컬 저장소에도
      // 덮어썼는데(2026-08-18 "다른 계정 테스트 데이터가 새 계정에 섞이는 문제"의 수정), 이 로직이 같은
      // 계정 자신의 데이터까지 지워버리는 부작용이 있었다 — 예를 들어 방금 이 계정으로 편집한 내용이 아직
      // 서버 동기화 전(0.6초 디바운스 중 창을 닫는 등)이라 서버엔 없지만 이 브라우저 로컬엔 남아있는 경우.
      // (2026-09-03) app.js save()가 로그인 중 저장할 때마다 LS_OWNER_KEY에 계정 아이디를 남겨두므로, 그
      // 태그가 지금 로그인한 계정과 일치하면 "이 계정 자신의 아직 동기화 안 된 데이터"로 보고 지우지 않고
      // 그대로 서버에 복구 업로드한다. 태그가 없거나 다른 계정이면(예: 같은 브라우저에서 다른 계정을
      // 테스트했던 경우) 예전처럼 빈 작품으로 새로 시작한다.
      serverDataLoaded = true; // 서버 응답을 정상적으로 확인했으므로 이제부터 서버 저장 허용
      setSyncBase({ p: {}, k: {} }, rev);
      lastSavedJson = null;

      if (localIsMine) {
        if (typeof fillProject === "function") DB.projects = DB.projects.map(fillProject);
        if (!DB.projects.some((p) => p.id === DB.current)) DB.current = DB.projects[0].id;
        if (typeof fillOpenIds === "function") fillOpenIds(DB);
        if (typeof migrateIdeaBlocksToAccount === "function") migrateIdeaBlocksToAccount(DB);
        P = currentProject();
        if (typeof resetUndoHistory === "function") resetUndoHistory();
        render();
        if (st) st.innerHTML = CLOUD_ICON + " 로컬 데이터를 서버로 복구 중…";
      } else if (typeof blankProject === "function" && typeof uid === "function") {
        const id = uid();
        DB = { current: id, projects: [blankProject(id, "내 첫 작품")], openIds: [id], ideaBlocks: [] };
        P = currentProject();
        if (typeof resetUndoHistory === "function") resetUndoHistory();
        render();
      }
      /* (2026-09-08) 새 계정의 기본 작품("내 첫 작품")과 로컬 복구분은 디바운스 없이 즉시 서버로 올린다 */
      if (typeof forceSaveNow === "function") forceSaveNow();
      else if (typeof save === "function") save();
      else saveToServer();
      if (!localIsMine && st) st.innerHTML = CLOUD_ICON + " 서버 연결됨";
      applyStashIfAny();
    }
  } else {
    /* (2026-09-08) 서버에서 못 불러온 경우 — 예전에는 상태 표시만 바꾸고 그대로 두었기 때문에,
       화면에는 (이 브라우저에 남아있던) 로컬 데이터가 보이고 사용자는 정상인 줄 알았다.
       기록 삭제 등으로 로컬이 비어 있으면 "작품이 사라진" 것처럼 보였다.
       이제 자동으로 다시 시도하고, 계속 실패하면 한 번 분명히 알려준다.
       이 상태에서는 serverDataLoaded가 false이므로 서버 저장(덮어쓰기)도 하지 않는다.
       (2026-11-18) 이미 한 번 불러온 뒤의 "다시 확인"이 실패한 경우에는 저장을 막지 않는다 —
       저장은 rev 확인을 거치므로 덮어쓸 위험이 없다. */
    if (serverDataLoaded) { if (st) st.innerHTML = CLOUD_ICON + " 서버 확인 실패"; return; }
    if (serverLoadRetries < 4) {
      serverLoadRetries++;
      if (st) st.innerHTML = CLOUD_ICON + " 서버 연결 실패 — 다시 시도 중…";
      clearTimeout(serverLoadRetryTimer);
      serverLoadRetryTimer = setTimeout(loadFromServer, 3000);
    } else {
      if (st) st.innerHTML = CLOUD_ICON + " 서버 연결 실패";
      if (!serverLoadAlerted) {
        serverLoadAlerted = true;
        alert("서버에서 작품을 불러오지 못했습니다.\n\n지금 작업한 내용은 이 브라우저에만 저장되고 서버에는 올라가지 않습니다.\n페이지를 새로고침(F5)해 보시고, 계속 같은 메시지가 나오면 담당 교수님께 알려주세요.");
      }
    }
  }
}

let saveToServerTimer = null;
let serverSaveRetryTimer = null;

/* (2026-09-15) Cloudflare D1 쓰기 절약 — 두 가지 장치
   (1) lastSavedJson: 마지막으로 서버에 올리는 데 성공한 내용을 기억해 두고, 보내려는 내용이 그와
       완전히 같으면 요청 자체를 보내지 않는다. app.js의 save()는 109군데에서 호출되는데 그중 상당수는
       탭 전환·접기/펼치기처럼 작품 내용이 전혀 바뀌지 않는 조작이라, 예전에는 그때마다 작품 전체를
       서버에 다시 써서 D1 "쓴 행" 한도를 헛되이 소모했다.
   (2) SAVE_DEBOUNCE_MS: 자동저장 대기시간을 0.6초 → 2.5초로 늘려, 글을 이어 쓰는 동안 발생하는
       저장 횟수를 줄인다. 탭을 닫거나 화면을 벗어날 때는 아래 flushPendingServerSave()가 대기 중이던
       저장을 즉시 내보내므로 유실 위험은 늘지 않는다.
   주의: lastSavedJson은 "서버에 실제로 올라간 내용"만 기억해야 한다. */
const SAVE_DEBOUNCE_MS = 2500;
let lastSavedJson = null;
function dbJson() { try { return JSON.stringify(DB); } catch (e) { return null; } }
function resetServerSaveCache() {
  lastSavedJson = null;
  serverRev = null;
  syncBase = null;
}

/* (2026-11-18) 저장 요청은 한 번에 하나만 — 보내는 중에 또 저장하면 끝난 뒤 최신 내용으로 한 번 더 보낸다 */
let serverSaveInFlight = false;
let serverSaveQueued = false;
let serverConflictStreak = 0;

async function doServerSave(pid, isRetry, keepalive) {
  if (!serverSaveReady() || serverRev === null) return;
  if (serverSaveInFlight) { serverSaveQueued = true; return; }
  const st = document.getElementById("serverStatus");
  let snap;
  try { snap = syncSnapshot(DB); } catch (e) { return; } // 직렬화 자체가 실패하면 보낼 것이 없다
  const payload = snap.json;
  if (!isRetry && payload === lastSavedJson) {
    // 서버에 있는 내용과 똑같다 — 요청을 보내지 않는다(쓰기 절약)
    if (st) st.innerHTML = CLOUD_ICON + " 서버에 저장됨";
    if (typeof projSaveState === "object") projSaveState[pid] = "saved";
    if (typeof updateTabDot === "function") updateTabDot(pid);
    /* 2026-09-15: 이 경로에서만 showSaveToast를 부르지 않아 화면 위 "저장 중…" 배너가 영영 사라지지
       않았다. save()는 이미 "saving"을 띄운 뒤라, 보낼 내용이 없으면 여기서 닫아줘야 한다. */
    if (typeof showSaveToast === "function") showSaveToast("saved");
    return;
  }
  serverSaveInFlight = true;
  const sentRev = serverRev;
  let res;
  try {
    const body = '{"baseRev":' + sentRev + ',"data":' + payload + '}';
    /* (2026-11-18) 화면을 벗어나는 순간의 저장(keepalive) — 탭을 닫아도 브라우저가 끝까지 보내 준다.
       keepalive는 약 64KB까지만 허용되므로 그보다 크면 일반 요청으로 보낸다. */
    const ka = !!keepalive && (typeof TextEncoder === "undefined" || new TextEncoder().encode(body).length < 60000);
    res = await apiFetch("data", ka ? { method: "POST", body, keepalive: true } : { method: "POST", body });
  } finally {
    serverSaveInFlight = false;
  }
  if (res.status === 401) {
    /* (2026-11-18) 로그인이 만료돼 저장이 거절된 경우 — 쓰던 글은 이 브라우저에 남아 있고, 다시 로그인하면
       서버 내용과 합쳐 올라간다(loadFromServer). 학생이 놀라 창을 닫지 않도록 분명히 알려준다. */
    alert("로그인이 만료되어 방금 쓴 내용이 서버에 저장되지 않았습니다.\n\n이 창을 닫지 말고 다시 로그인해 주세요. 쓰던 글은 이 브라우저에 남아 있어, 로그인하면 자동으로 서버에 올라갑니다.");
    signOut(); return;
  }

  if (res.status === 409 && res.body && res.body.conflict && res.body.data && Array.isArray(res.body.data.projects) && res.body.data.projects.length) {
    /* 그사이 다른 화면이 먼저 저장했다 — 덮어쓰지 않고 합친 뒤 다시 저장한다 */
    serverConflictStreak++;
    const server = normalizeSyncData(res.body.data);
    const serverSnap = syncSnapshot(server);
    const m = mergeSyncData(DB, server, syncBase);
    setSyncBase(serverSnap.base, Number(res.body.rev) || 0);
    if (m.changed) { applyMergedDB(m.db); render(); }
    lastSavedJson = null;
    alertSyncCopies(m.copies);
    if (serverConflictStreak <= 3) { serverSaveQueued = false; doServerSave(DB.current, true); return; }
    // 계속 충돌하면(여러 창에서 동시에 쓰는 중) 잠시 쉬었다가 다시 시도한다
    serverConflictStreak = 0;
    clearTimeout(serverSaveRetryTimer);
    serverSaveRetryTimer = setTimeout(() => doServerSave(DB.current, true), 3000);
    return;
  }
  if (res.status === 409 && res.body && res.body.conflict && !res.body.outdatedClient && Number.isInteger(res.body.rev)) {
    // 서버 쪽에 쓸 만한 작품이 없는 충돌(빈 데이터) — 번호만 맞추고 내 내용으로 다시 저장한다
    setSyncBase({ p: {}, k: {} }, res.body.rev);
    lastSavedJson = null;
    if (++serverConflictStreak <= 3) { doServerSave(DB.current, true); return; }
    serverConflictStreak = 0;
  }

  /* (2026-09-08) 일시적인 통신 오류로 저장이 실패하면 2초 뒤 한 번 자동 재시도한다.
     재시도까지 실패했을 때만 "저장 실패"로 표시한다. (2026-11-18) 재시도 때는 그 시점의 최신 내용을 보낸다. */
  if (!res.ok && !isRetry) {
    if (st) st.innerHTML = CLOUD_ICON + " 저장 재시도 중…";
    clearTimeout(serverSaveRetryTimer);
    serverSaveRetryTimer = setTimeout(() => doServerSave(DB.current, true), 2000);
    return;
  }
  if (res.ok) {
    serverConflictStreak = 0;
    lastSavedJson = payload;
    setSyncBase(snap.base, Number(res.body && res.body.rev) || 0);
  }
  if (st) st.innerHTML = CLOUD_ICON + (res.ok ? " 서버에 저장됨" : " 서버 저장 실패");
  if (typeof projSaveState === "object") projSaveState[pid] = res.ok ? "saved" : "error";
  if (typeof updateTabDot === "function") updateTabDot(pid);
  if (typeof showSaveToast === "function") showSaveToast(res.ok ? "saved" : "error");
  if (serverSaveQueued) { serverSaveQueued = false; doServerSave(DB.current); }
}
function saveToServer() {
  if (!serverSaveReady()) return; // 서버에서 아직 못 불러왔으면 덮어쓰지 않는다(2026-09-08)
  const pid = DB.current;
  clearTimeout(saveToServerTimer);
  // (2026-09-03) 타이머가 실제로 발동해 저장을 시작하는 순간 saveToServerTimer를 null로 되돌려서,
  // flushPendingServerSave()가 "지금 대기 중인 저장이 있는지"를 정확히 판단할 수 있게 한다.
  saveToServerTimer = setTimeout(() => { saveToServerTimer = null; doServerSave(pid); }, SAVE_DEBOUNCE_MS);
}
/* Ctrl+S 등 즉시저장 — 디바운스를 건너뛰고 바로 서버에 저장 */
function forceSaveToServer() {
  if (!serverSaveReady()) return; // 위와 같은 이유(2026-09-08)
  clearTimeout(saveToServerTimer);
  saveToServerTimer = null;
  doServerSave(DB.current);
}

/* 2026-09-03: 디바운스 중이던 서버 저장이 창을 닫거나 다른 화면으로 넘어가면서 그대로 취소돼
   버리는 문제 수정. visibilitychange("hidden")는 탭 전환·창 최소화처럼 페이지가 아직 살아있는 대부분의
   경우를 잡아내고, pagehide는 실제로 탭이 닫히는 순간의 보조 안전장치다. pagehide 시점엔 일반 fetch가
   취소될 수 있어 keepalive:true를 준다(대략 64KB까지 보장 — 아주 큰 작품은 못 실릴 수 있음, 알려진 한계).
   (2026-11-18) keepalive 요청은 결과를 확인할 수 없으므로 lastSavedJson을 미리 바꾸지 않는다
   (예전에는 실패해도 "올라간 것"으로 기억해, 페이지가 되살아났을 때 다음 저장이 생략될 수 있었다). */
function flushPendingServerSave(useKeepalive) {
  if (!serverSaveReady() || serverRev === null) return;
  if (saveToServerTimer == null) return;
  clearTimeout(saveToServerTimer);
  saveToServerTimer = null;
  if (useKeepalive) {
    const payload = dbJson();
    if (payload === null || payload === lastSavedJson) return; // 내용이 그대로면 보내지 않는다(2026-09-15)
    try {
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + getToken() },
        body: '{"baseRev":' + serverRev + ',"data":' + payload + '}',
        keepalive: true,
      }).catch(() => {});
    } catch (e) {}
  } else {
    doServerSave(DB.current, false, true);
  }
}

/* (2026-11-18) 창으로 돌아왔을 때 — 그사이 다른 곳(다른 탭·다른 컴퓨터)에서 저장됐는지 rev만 확인하고,
   바뀌었으면 곧바로 최신 내용을 받아 합친다. 예전 내용 위에서 계속 쓰다가 충돌이 나는 일을 줄인다. */
let lastFreshCheck = 0;
async function checkServerFreshness() {
  if (!serverSaveReady() || serverRev === null) return;
  const now = Date.now();
  if (now - lastFreshCheck < 5000) return;
  lastFreshCheck = now;
  const res = await apiFetch("data?meta=1");
  if (res.status === 401) { signOut(); return; }
  if (!res.ok || !res.body) return;
  if ((Number(res.body.rev) || 0) !== serverRev && !serverSaveInFlight) loadFromServer();
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushPendingServerSave(false);
  else checkServerFreshness();
});
window.addEventListener("focus", () => checkServerFreshness());
window.addEventListener("pagehide", () => flushPendingServerSave(true));

/* ===== 폼 바인딩 ===== */
function bindAuthForms() {
  document.querySelectorAll(".auth-tab").forEach((t) => {
    t.onclick = () => showAuthPanel(t.dataset.panel);
  });
  const findLink = document.getElementById("findAccountLink");
  if (findLink) findLink.onclick = (e) => { e.preventDefault(); showAuthPanel("findPanel"); };
  const backLink = document.getElementById("backToLoginLink");
  if (backLink) backLink.onclick = (e) => { e.preventDefault(); showAuthPanel("loginPanel"); };

  const loginForm = document.getElementById("loginPanel");
  if (loginForm) loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errEl = document.getElementById("loginError");
    errEl.textContent = "";
    if (!username || !password) { errEl.textContent = "아이디와 비밀번호를 입력해주세요."; return; }
    const res = await apiFetch("login", { method: "POST", body: JSON.stringify({ username, password }) });
    if (res.ok && res.body && res.body.token) {
      saveAuth(res.body.token, res.body.user);
      setLoggedInUI();
      loadFromServer();
    } else {
      errEl.textContent = (res.body && res.body.error) || "로그인에 실패했습니다.";
    }
  };

  const signupForm = document.getElementById("signupPanel");
  if (signupForm) signupForm.onsubmit = async (e) => {
    e.preventDefault();
    const school = document.getElementById("signupSchool").value.trim();
    const name = document.getElementById("signupName").value.trim();
    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value;
    const passwordConfirm = document.getElementById("signupPasswordConfirm").value;
    const email = document.getElementById("signupEmail").value.trim();
    const role = "student"; // 가입은 항상 학생 — 교수 등급은 관리자가 회원 관리에서만 부여
    const errEl = document.getElementById("signupError");
    errEl.textContent = "";
    if (!school || !name || !username || !password || !passwordConfirm || !email) {
      errEl.textContent = "모든 항목을 입력해주세요."; return;
    }
    if (password !== passwordConfirm) { errEl.textContent = "비밀번호가 일치하지 않습니다."; return; }
    if (password.length < 6) { errEl.textContent = "비밀번호는 6자 이상이어야 합니다."; return; }
    const res = await apiFetch("signup", {
      method: "POST",
      body: JSON.stringify({ school, name, username, password, email, role }),
    });
    if (res.ok && res.body && res.body.token) {
      saveAuth(res.body.token, res.body.user);
      setLoggedInUI();
      loadFromServer();
    } else {
      errEl.textContent = (res.body && res.body.error) || "회원가입에 실패했습니다.";
    }
  };

  const findForm = document.getElementById("findPanel");
  if (findForm) findForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("findEmail").value.trim();
    const resultEl = document.getElementById("findResult");
    resultEl.textContent = "확인 중…";
    const res = await apiFetch("find-account", { method: "POST", body: JSON.stringify({ email }) });
    /* (2026-09-08) 예전에는 서버가 돌려준 error를 통째로 무시하고 무조건 "확인할 수 없습니다."만 띄웠다.
       그래서 요청 횟수 제한(같은 강의실에서 여러 학생이 연달아 시도하면 걸린다)이나 메일 발송 오류처럼
       원인이 분명한 경우에도 이유를 알 수 없었다. 이제 서버가 알려준 이유를 그대로 보여준다. */
    resultEl.textContent = (res.body && (res.body.message || res.body.error))
      || "서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.";
  };

  const profileBtn = document.getElementById("menuProfileBtn");
  if (profileBtn) profileBtn.onclick = openProfileEdit;
  const profCodeBtn = document.getElementById("classCodeMenuBtn");
  if (profCodeBtn) profCodeBtn.onclick = openProfCodeManager;
  const pwMenuBtn = document.getElementById("menuPwBtn");
  if (pwMenuBtn) pwMenuBtn.onclick = openPasswordChange;
  const logoutBtn = document.getElementById("menuLogoutBtn");
  if (logoutBtn) logoutBtn.onclick = signOut;

  const resetForm = document.getElementById("resetPanel");
  if (resetForm) resetForm.onsubmit = async (e) => {
    e.preventDefault();
    const token = new URLSearchParams(location.search).get("reset");
    const pw = document.getElementById("resetPassword").value;
    const pwConfirm = document.getElementById("resetPasswordConfirm").value;
    const errEl = document.getElementById("resetError");
    errEl.textContent = "";
    if (!token) { errEl.textContent = "잘못된 접근입니다. 이메일의 링크로 다시 들어와주세요."; return; }
    if (!pw || !pwConfirm) { errEl.textContent = "새 비밀번호를 입력해주세요."; return; }
    if (pw !== pwConfirm) { errEl.textContent = "비밀번호가 일치하지 않습니다."; return; }
    if (pw.length < 6) { errEl.textContent = "비밀번호는 6자 이상이어야 합니다."; return; }
    const res = await apiFetch("reset-password", { method: "POST", body: JSON.stringify({ token, newPassword: pw }) });
    if (res.ok && res.body && res.body.ok) {
      history.replaceState(null, "", location.pathname);
      alert("비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.");
      showAuthPanel("loginPanel");
    } else {
      errEl.textContent = (res.body && res.body.error) || "재설정에 실패했습니다.";
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  bindAuthForms();
  const resetToken = new URLSearchParams(location.search).get("reset");
  if (resetToken) {
    // 비밀번호 재설정 링크로 들어온 경우 — 새 비밀번호 입력 화면을 우선 보여주고,
    // 기존 로그인 세션 자동 복원은 건너뜀(재설정 전까지 다른 화면과 헷갈리지 않도록)
    document.body.classList.remove("logged-in");
    showAuthPanel("resetPanel");
    return;
  }
  if (restoreAuth()) {
    setLoggedInUI();
    loadFromServer();
  }
});
