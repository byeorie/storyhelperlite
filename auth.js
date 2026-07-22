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
  alert("설정 기능은 준비 중입니다.");
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
      DB = data;
      P = currentProject();
      render();
      if (st) st.innerHTML = CLOUD_ICON + " 서버에서 불러옴";
    } else {
      // 서버에 저장된 데이터가 없으면 현재 로컬 데이터를 서버로 업로드
      saveToServer();
      if (st) st.innerHTML = CLOUD_ICON + " 서버 연결됨";
    }
  } else if (st) {
    st.innerHTML = CLOUD_ICON + " 서버 오류";
  }
}

let saveToServerTimer = null;
function saveToServer() {
  if (!getToken()) return;
  clearTimeout(saveToServerTimer);
  saveToServerTimer = setTimeout(async () => {
    const st = document.getElementById("serverStatus");
    const res = await apiFetch("data", { method: "POST", body: JSON.stringify({ data: DB }) });
    if (res.status === 401) { signOut(); return; }
    if (st) st.innerHTML = CLOUD_ICON + (res.ok ? " 서버에 저장됨" : " 서버 저장 실패");
  }, 600);
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
    const errEl = document.getElementById("signupError");
    errEl.textContent = "";
    if (!school || !name || !username || !password || !passwordConfirm || !email) {
      errEl.textContent = "모든 항목을 입력해주세요."; return;
    }
    if (password !== passwordConfirm) { errEl.textContent = "비밀번호가 일치하지 않습니다."; return; }
    if (password.length < 6) { errEl.textContent = "비밀번호는 6자 이상이어야 합니다."; return; }
    const res = await apiFetch("signup", {
      method: "POST",
      body: JSON.stringify({ school, name, username, password, email }),
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
}

document.addEventListener("DOMContentLoaded", () => {
  bindAuthForms();
  if (restoreAuth()) {
    setLoggedInUI();
    loadFromServer();
  }
});
