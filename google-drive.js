// Google OAuth + Drive API
const GOOGLE_CLIENT_ID = "612980273037-1sv5i8tgv9rduiq7hvg2h0u0d78r1kgp.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const DRIVE_FILE_NAME = "storyhelper_data.json";
const TOKEN_LS_KEY = "gAccessToken_v1";

let gTokenClient = null;
let gAccessToken = null;
let gDriveFileId = null;

/* ===== 초기화 ===== */
function initGoogle() {
  gTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: onTokenResponse,
  });

  // 저장된 토큰 복원 시도
  const saved = localStorage.getItem(TOKEN_LS_KEY);
  if (saved) {
    try {
      const { token, expiry, name, picture } = JSON.parse(saved);
      if (Date.now() < expiry) {
        gAccessToken = token;
        document.body.classList.add("logged-in");
        updateUserUI(name, picture);
        loadFromDrive();
        return;
      }
    } catch(e) {}
    localStorage.removeItem(TOKEN_LS_KEY);
  }
}

async function onTokenResponse(resp) {
  if (resp.error) return;
  gAccessToken = resp.access_token;
  document.body.classList.add("logged-in");
  try {
    const u = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: "Bearer " + gAccessToken },
    }).then(r => r.json());
    const name = u.name || u.email;
    const picture = u.picture || "";
    updateUserUI(name, picture);
    // 토큰 저장 (1시간 유효)
    localStorage.setItem(TOKEN_LS_KEY, JSON.stringify({
      token: gAccessToken,
      expiry: Date.now() + 55 * 60 * 1000,
      name, picture
    }));
  } catch (e) {}
  loadFromDrive();
}

/* ===== UI ===== */
function updateUserUI(name, picture) {
  const btn = document.getElementById("googleLoginBtn");
  if (!btn) return;
  btn.innerHTML = `<img src="${picture}" style="width:24px;height:24px;border-radius:50%;vertical-align:middle;margin-right:6px">${name} <span style="opacity:.6;font-size:.8em">로그아웃</span>`;
  btn.onclick = signOut;
  document.getElementById("driveStatus").textContent = "☁️ 드라이브 연결 중…";
}

function signOut() {
  google.accounts.id.disableAutoSelect();
  document.body.classList.remove("logged-in");
  gAccessToken = null;
  gDriveFileId = null;
  localStorage.removeItem(TOKEN_LS_KEY);
  const btn = document.getElementById("googleLoginBtn");
  btn.innerHTML = "Google로 로그인";
  btn.onclick = googleLogin;
  document.getElementById("driveStatus").textContent = "로컬 저장";
}

function googleLogin() {
  if (!gTokenClient) { alert("구글 로그인 준비 중입니다. 잠시 후 다시 시도해주세요."); return; }
  gTokenClient.requestAccessToken({ prompt: "select_account" });
}

/* ===== 초기화 트리거 ===== */
function bindLoginButton() {
  const btn = document.getElementById("googleLoginBtn");
  if (btn) btn.onclick = googleLogin;
  const ov = document.getElementById("overlayLoginBtn");
  if (ov) ov.onclick = googleLogin;
}

function waitForGsiAndInit() {
  if (window.google && google.accounts && google.accounts.oauth2) {
    initGoogle();
  } else {
    setTimeout(waitForGsiAndInit, 200);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bindLoginButton();
  waitForGsiAndInit();
});

/* ===== Drive API ===== */
async function findDriveFile() {
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${DRIVE_FILE_NAME}'&fields=files(id)`,
    { headers: { Authorization: "Bearer " + gAccessToken } }
  );
  const j = await r.json();
  return j.files && j.files.length ? j.files[0].id : null;
}

async function loadFromDrive() {
  if (!gAccessToken) return;
  const st = document.getElementById("driveStatus");
  try {
    gDriveFileId = await findDriveFile();
    if (!gDriveFileId) {
      st.textContent = "☁️ 드라이브 연결됨 (새 파일)";
      saveToDrive();
      return;
    }
    const r = await fetch(
      `https://www.googleapis.com/drive/v3/files/${gDriveFileId}?alt=media`,
      { headers: { Authorization: "Bearer " + gAccessToken } }
    );
    const data = await r.json();
    if (data && data.projects) {
      DB = data;
      P = currentProject();
      render();
    }
    st.textContent = "☁️ 드라이브에서 불러옴";
  } catch (e) {
    // 토큰 만료 가능성 — 저장된 토큰 삭제
    localStorage.removeItem(TOKEN_LS_KEY);
    st.textContent = "☁️ 드라이브 오류 (재로그인 필요)";
    document.body.classList.remove("logged-in");
  }
}

async function saveToDrive() {
  if (!gAccessToken) return;
  const content = JSON.stringify(DB);
  const boundary = "-------StoryHelper";
  const body =
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
    JSON.stringify({ name: DRIVE_FILE_NAME, parents: ["appDataFolder"] }) +
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
  if (r.ok) {
    const j = await r.json();
    if (!gDriveFileId) gDriveFileId = j.id;
    const st = document.getElementById("driveStatus");
    if (st) st.textContent = "☁️ 드라이브에 저장됨";
  }
}
