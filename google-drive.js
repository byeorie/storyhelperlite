// Google OAuth + Drive API
const GOOGLE_CLIENT_ID = "543063091602-injv9mjpavv1gobhrgmgbn7fr2u8jhge.apps.googleusercontent.com";
// drive.file: 이 앱이 만든 파일에만 접근 / userinfo.profile,email: 로그인 버튼에 프로필 사진·이름 표시용
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";
const DRIVE_FILE_NAME = "storyhelper_data.json";
const DRIVE_FOLDER_NAME = "이야기도우미";

let gTokenClient = null;
let gAccessToken = null;
let gDriveFileId = null;
let gDriveFolderId = null;

/* ===== 로그인 유지 + 자동 로그아웃 ===== */
// 새로고침해도 로그인 유지, 1시간 동안 입력(클릭/키/스크롤)이 없으면 자동 로그아웃
const SESSION_KEY = "shl_session";
const ACTIVITY_KEY = "shl_last_activity";
const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 1시간

// access token 자체를 만료시각과 함께 저장해서, 새로고침 시 팝업 없이 즉시 복원한다.
// (구글 OAuth 팝업은 브라우저가 "사용자 클릭 없는 자동 팝업"으로 간주해 차단하므로,
//  새로고침 때 requestAccessToken()을 자동 호출하는 방식은 동작하지 않음 — 이전 방식의 문제였음)
function saveSession(name, email, picture, token, expiresInSec) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      name, email, picture, token,
      expiresAt: Date.now() + (Number(expiresInSec) || 3600) * 1000,
    }));
  } catch (e) {}
  touchActivity();
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(ACTIVITY_KEY); } catch (e) {}
}
function touchActivity() {
  try { localStorage.setItem(ACTIVITY_KEY, String(Date.now())); } catch (e) {}
}
function isSessionFresh() {
  const t = Number(localStorage.getItem(ACTIVITY_KEY) || 0);
  return t > 0 && (Date.now() - t < INACTIVITY_LIMIT_MS);
}

// 로그인된 상태에서만 활동 시각 기록 (너무 자주 쓰지 않도록 30초 간격으로 제한)
let lastActivityWrite = 0;
function onUserActivity() {
  if (!document.body.classList.contains("logged-in")) return;
  const now = Date.now();
  if (now - lastActivityWrite < 30000) return;
  lastActivityWrite = now;
  touchActivity();
}
["click", "keydown", "mousemove", "scroll"].forEach((evt) => {
  document.addEventListener(evt, onUserActivity, { passive: true });
});

// 1분마다 유휴 시간 체크 → 1시간 초과 시 자동 로그아웃
setInterval(() => {
  if (document.body.classList.contains("logged-in") && !isSessionFresh()) {
    signOut();
  }
}, 60 * 1000);

// 새로고침 시: 저장된 토큰이 아직 만료 전이고 1시간 이내 활동이 있었다면
// 팝업 없이 즉시 로그인 상태로 복원 (Drive 토큰이 유효하지 않으면 이후 401에서 자동 로그아웃됨)
function restoreSessionIfFresh() {
  const s = getSession();
  if (s && s.token && s.expiresAt > Date.now() && isSessionFresh()) {
    gAccessToken = s.token;
    document.body.classList.add("logged-in");
    updateUserUI(s.name, s.picture, s.email);
    loadFromDrive();
    return true;
  }
  return false;
}

// Drive API가 401(토큰 만료/무효)을 돌려주면 로그인 세션을 정리
function handleAuthExpired(status) {
  if (status === 401) { signOut(); return true; }
  return false;
}

/* ===== 초기화 ===== */
function initGoogle() {
  gTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: onTokenResponse,
  });
}

function onGoogleSignIn(resp) {
  const payload = JSON.parse(atob(resp.credential.split(".")[1]));
  document.body.classList.add("logged-in");
  updateUserUI(payload.name, payload.picture, payload.email);
  // Drive 접근 토큰 요청
  gTokenClient.requestAccessToken({ prompt: "" });
}

async function onTokenResponse(resp) {
  if (resp.error) return;
  gAccessToken = resp.access_token;
  document.body.classList.add("logged-in");
  // 사용자 정보 가져와 UI 갱신
  try {
    const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: "Bearer " + gAccessToken },
    });
    if (r.ok) {
      const u = await r.json();
      if (u && (u.name || u.email)) {
        updateUserUI(u.name || u.email, u.picture || "", u.email || "");
        saveSession(u.name || u.email, u.email || "", u.picture || "", gAccessToken, resp.expires_in);
      }
    }
  } catch (e) {}
  loadFromDrive();
}

/* ===== UI ===== */
function updateUserUI(name, picture, email) {
  const btn = document.getElementById("googleLoginBtn");
  if (!btn) return;
  const safeName = name || "사용자";
  btn.innerHTML = picture
    ? `<img src="${picture}" alt="${safeName}" onerror="this.parentElement.innerHTML='<span class=&quot;avatar-fallback&quot;>${safeName.charAt(0)}</span>'">`
    : `<span class="avatar-fallback">${safeName.charAt(0)}</span>`;
  btn.title = safeName;
  btn.classList.add("avatar-btn");
  btn.onclick = (e) => { e.stopPropagation(); toggleUserMenu(); };

  const emailEl = document.getElementById("userMenuEmail");
  if (emailEl) emailEl.textContent = email || safeName;

  const st = document.getElementById("driveStatus");
  if (st) st.textContent = "☁️ 드라이브 연결 중…";
}

function toggleUserMenu(forceHide) {
  const menu = document.getElementById("userMenu");
  const btn = document.getElementById("googleLoginBtn");
  if (!menu || !btn) return;
  const hide = forceHide === true || !menu.hidden;
  if (!hide) {
    // 상단바가 overflow-x:auto라 position:absolute로는 메뉴가 잘려서
    // 보이므로, 버튼 위치를 계산해 화면 기준(position:fixed)으로 띄운다
    document.body.appendChild(menu); // 클리핑되는 상위 요소 밖으로 이동
    const r = btn.getBoundingClientRect();
    const menuWidth = 170;
    let top = r.bottom + 8;
    // 아래쪽 공간이 부족하면 버튼 위로 펼친다
    if (top + 150 > window.innerHeight) top = r.top - 8 - 150;
    menu.style.top = top + "px";
    menu.style.right = (window.innerWidth - r.right) + "px";
    menu.style.left = "auto";
    menu.style.minWidth = menuWidth + "px";
  }
  menu.hidden = hide;
}

document.addEventListener("click", (e) => {
  const btn = document.getElementById("googleLoginBtn");
  const menu = document.getElementById("userMenu");
  const insideBtn = btn && btn.contains(e.target);
  const insideMenu = menu && menu.contains(e.target);
  if (!insideBtn && !insideMenu) toggleUserMenu(true);
});

function openSettings() {
  toggleUserMenu(true);
  alert("설정 기능은 준비 중입니다.");
}

function signOut() {
  if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
  document.body.classList.remove("logged-in");
  gAccessToken = null;
  gDriveFileId = null;
  gDriveFolderId = null;
  clearSession();
  toggleUserMenu(true);
  const btn = document.getElementById("googleLoginBtn");
  btn.classList.remove("avatar-btn");
  btn.removeAttribute("title");
  btn.innerHTML = "Google로 로그인";
  btn.onclick = googleLogin;
  document.getElementById("driveStatus").textContent = "로컬 저장";
}

function googleLogin() {
  // 버튼 클릭 시 바로 OAuth 팝업 (One Tap prompt 콜백은 불안정하여 사용 안 함)
  if (!gTokenClient) { alert("구글 로그인 준비 중입니다. 잠시 후 다시 시도해주세요."); return; }
  gTokenClient.requestAccessToken({ prompt: "select_account" });
}

/* ===== 초기화 트리거 ===== */
// 버튼 클릭 핸들러는 라이브러리 로드와 무관하게 즉시 연결
function bindLoginButton() {
  const btn = document.getElementById("googleLoginBtn");
  if (btn) btn.onclick = googleLogin;
  const ov = document.getElementById("overlayLoginBtn");
  if (ov) ov.onclick = googleLogin;
  const settingsBtn = document.getElementById("menuSettingsBtn");
  if (settingsBtn) settingsBtn.onclick = openSettings;
  const logoutBtn = document.getElementById("menuLogoutBtn");
  if (logoutBtn) logoutBtn.onclick = signOut;
}

// GSI 라이브러리(accounts.google.com/gsi/client)는 async/defer 로드되므로
// google.accounts 객체가 준비될 때까지 폴링 후 초기화
function waitForGsiAndInit() {
  if (window.google && google.accounts && google.accounts.oauth2) {
    initGoogle();
  } else {
    setTimeout(waitForGsiAndInit, 200);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bindLoginButton();
  restoreSessionIfFresh(); // 저장된 토큰으로 로그인 창 없이 즉시 복원 시도
  waitForGsiAndInit();
});

/* ===== Drive API ===== */
async function driveRequest(method, url, body) {
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: "Bearer " + gAccessToken,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (handleAuthExpired(r.status)) return null;
  return r.ok ? r.json() : null;
}

async function findOrCreateDriveFolder() {
  const q = `mimeType='application/vnd.google-apps.folder' and name='${DRIVE_FOLDER_NAME}' and trashed=false`;
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    { headers: { Authorization: "Bearer " + gAccessToken } }
  );
  if (handleAuthExpired(r.status)) return null;
  const j = await r.json();
  if (j.files && j.files.length) return j.files[0].id;
  // 폴더 없으면 새로 생성
  const created = await driveRequest("POST", "https://www.googleapis.com/drive/v3/files", {
    name: DRIVE_FOLDER_NAME,
    mimeType: "application/vnd.google-apps.folder",
  });
  return created ? created.id : null;
}

async function findDriveFile() {
  const q = `name='${DRIVE_FILE_NAME}' and '${gDriveFolderId}' in parents and trashed=false`;
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    { headers: { Authorization: "Bearer " + gAccessToken } }
  );
  if (handleAuthExpired(r.status)) return null;
  const j = await r.json();
  return j.files && j.files.length ? j.files[0].id : null;
}

async function loadFromDrive() {
  if (!gAccessToken) return;
  const st = document.getElementById("driveStatus");
  try {
    gDriveFolderId = await findOrCreateDriveFolder();
    if (!gDriveFolderId) { st.textContent = "☁️ 드라이브 오류"; return; }
    gDriveFileId = await findDriveFile();
    if (!gDriveFileId) {
      st.textContent = "☁️ 드라이브 연결됨 (새 파일)";
      saveToDrive(); // 현재 로컬 데이터 업로드
      return;
    }
    const r = await fetch(
      `https://www.googleapis.com/drive/v3/files/${gDriveFileId}?alt=media`,
      { headers: { Authorization: "Bearer " + gAccessToken } }
    );
    if (handleAuthExpired(r.status)) return;
    const data = await r.json();
    if (data && Array.isArray(data.projects) && data.projects.length && typeof fillProject === "function") {
      data.projects = data.projects.map(fillProject);
      if (!data.projects.some(p => p.id === data.current)) data.current = data.projects[0].id;
      DB = data;
      P = currentProject();
      render();
    }
    st.textContent = "☁️ 드라이브에서 불러옴";
  } catch (e) {
    st.textContent = "☁️ 드라이브 오류";
  }
}

async function saveToDrive() {
  if (!gAccessToken) return;
  if (!gDriveFolderId) gDriveFolderId = await findOrCreateDriveFolder();
  if (!gDriveFolderId) return;
  const content = JSON.stringify(DB);
  const boundary = "-------StoryHelper";
  const metadata = gDriveFileId
    ? { name: DRIVE_FILE_NAME }
    : { name: DRIVE_FILE_NAME, parents: [gDriveFolderId] };
  const body =
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
    content +
    `\r\n--${boundary}--`;

  const method = gDriveFileId ? "PATCH" : "POST";
  const url = gDriveFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${gDriveFileId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const r = await fetch(url, {
    method,
    headers: {
      Authorization: "Bearer " + gAccessToken,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (handleAuthExpired(r.status)) return;
  if (r.ok) {
    const j = await r.json();
    if (!gDriveFileId) gDriveFileId = j.id;
    const st = document.getElementById("driveStatus");
    if (st) { st.textContent = "☁️ 드라이브에 저장됨"; }
  }
}
