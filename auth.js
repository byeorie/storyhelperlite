/* ===== 자체 로그인/회원가입 (서버: Cloudflare Pages Functions + D1) ===== */
const TOKEN_KEY = "shl_token";
const USERINFO_KEY = "shl_userinfo";
/* 서버 상태 표시용 심플라인 구름 아이콘 */
const CLOUD_ICON = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>';

let authToken = null;
let currentUser = null; // {username, name, school, email}

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
    if (top + 150 > window.innerHeight) top = r.top - 8 - 150;
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

function openSettings() {
  toggleUserMenu(true);
  const overlay=document.createElement("div"); overlay.className="plot-modal-overlay";
  overlay.onclick=e=>{ if(e.target===overlay) document.body.removeChild(overlay); };
  const box=document.createElement("div"); box.className="plot-modal";
  const top=document.createElement("div"); top.className="plot-picker-top";
  const ttl=document.createElement("span"); ttl.className="plot-picker-title"; ttl.textContent="설정";
  const closeBtn=(typeof iconBtn==="function" && typeof ICONS!=="undefined")
    ? iconBtn(ICONS.close, "닫기", ()=>document.body.removeChild(overlay))
    : (()=>{ const b=document.createElement("button"); b.type="button"; b.textContent="닫기"; b.onclick=()=>document.body.removeChild(overlay); return b; })();
  top.append(ttl, closeBtn);
  box.appendChild(top);

  const body=document.createElement("div");
  const esc2 = typeof esc==="function" ? esc : (s=>String(s==null?"":s));

  if (currentUser && currentUser.role === "professor") {
    body.innerHTML = `
      <p class="hint">학생들에게 아래 코드를 알려주면, 학생이 [설정]에서 이 코드를 입력해 내 그룹에 가입할 수 있습니다.</p>
      <div class="prof-code-display">${esc2(currentUser.profCode || "코드 없음")}</div>
      <p class="hint">${esc2(currentUser.school || "")} · ${esc2(currentUser.name || "")}</p>
    `;
  } else {
    const joined = !!(currentUser && currentUser.profId);
    body.innerHTML = `
      <p class="hint">${joined ? "이미 교수 그룹에 가입되어 있습니다. 다른 코드를 입력하면 그룹이 변경됩니다." : "교수님께 받은 6자리 코드를 입력하면 과제 제출 그룹에 가입됩니다."}</p>
      <div class="plan-block">
        <label>교수 코드</label>
        <input type="text" id="profCodeInput" maxlength="6" placeholder="예: 123456" inputmode="numeric" style="letter-spacing:2px;font-size:16px">
      </div>
      <p id="profJoinMsg" class="hint" style="min-height:18px"></p>
      <button class="btn" id="profJoinBtn" style="width:100%">가입하기</button>
    `;
  }
  box.appendChild(body);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

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
        currentUser.profId = prof.id;
        currentUser.profCode = currentUser.profCode; // 학생 계정은 원래 없음
        saveAuth(getToken(), currentUser);
        msgEl.textContent = `${prof.school || ""} ${prof.name || ""} 교수님 그룹에 가입되었습니다.`;
        if (typeof onAuthChanged === "function") onAuthChanged();
      } else {
        msgEl.textContent = (res.body && res.body.error) || "가입에 실패했습니다.";
      }
    };
  }
}

async function signOut() {
  try { await apiFetch("logout", { method: "POST" }); } catch (e) {}
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
async function loadFromServer() {
  if (!getToken()) return;
  const st = document.getElementById("serverStatus");
  if (st) st.innerHTML = CLOUD_ICON + " 불러오는 중…";
  const res = await apiFetch("data");
  if (res.status === 401) { signOut(); return; }
  if (res.ok && res.body) {
    const data = res.body.data;
    if (data && Array.isArray(data.projects) && data.projects.length && typeof fillProject === "function") {
      data.projects = data.projects.map(fillProject);
      if (!data.projects.some((p) => p.id === data.current)) data.current = data.projects[0].id;
      if (typeof fillWorkDB === "function") data.workDB = fillWorkDB(data.workDB);
      if (typeof fillOpenIds === "function") fillOpenIds(data);
      DB = data;
      P = currentProject();
      if (typeof resetUndoHistory === "function") resetUndoHistory();
      render();
      if (st) st.innerHTML = CLOUD_ICON + " 서버에서 불러옴";
    } else {
      // 서버에 저장된 데이터가 없는 계정(신규 가입 등) — 이 시점에 메모리의 DB는 로그인 화면이 뜨기 전
      // localStorage에서 미리 읽어들인 값이라, 같은 브라우저에서 다른 계정으로 테스트했던 내용이 그대로
      // 남아있을 수 있다. 그걸 그대로 서버에 올리면 새 계정에 다른 계정 내용이 넘어가 버리므로(2026-08-18
      // 발견된 버그), 서버에 데이터가 없을 땐 항상 빈 작품 하나로 새로 시작한다.
      if (typeof blankProject === "function" && typeof uid === "function") {
        const id = uid();
        DB = { current: id, projects: [blankProject(id, "내 첫 작품")], openIds: [id] };
        P = currentProject();
        if (typeof resetUndoHistory === "function") resetUndoHistory();
        render();
      }
      if (typeof save === "function") save(); else saveToServer();
      if (st) st.innerHTML = CLOUD_ICON + " 서버 연결됨";
    }
  } else if (st) {
    st.innerHTML = CLOUD_ICON + " 서버 오류";
  }
}

let saveToServerTimer = null;
async function doServerSave(pid) {
  const st = document.getElementById("serverStatus");
  const res = await apiFetch("data", { method: "POST", body: JSON.stringify({ data: DB }) });
  if (res.status === 401) { signOut(); return; }
  if (st) st.innerHTML = CLOUD_ICON + (res.ok ? " 서버에 저장됨" : " 서버 저장 실패");
  if (typeof projSaveState === "object") projSaveState[pid] = res.ok ? "saved" : "error";
  if (typeof updateTabDot === "function") updateTabDot(pid);
  if (typeof showSaveToast === "function") showSaveToast(res.ok ? "saved" : "error");
}
function saveToServer() {
  if (!getToken()) return;
  const pid = DB.current;
  clearTimeout(saveToServerTimer);
  saveToServerTimer = setTimeout(() => doServerSave(pid), 600);
}
/* Ctrl+S 등 즉시저장 — 디바운스를 건너뛰고 바로 서버에 저장 */
function forceSaveToServer() {
  if (!getToken()) return;
  clearTimeout(saveToServerTimer);
  doServerSave(DB.current);
}

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
    resultEl.textContent = (res.body && res.body.message) || "확인할 수 없습니다.";
  };

  const settingsBtn = document.getElementById("menuSettingsBtn");
  if (settingsBtn) settingsBtn.onclick = openSettings;
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
