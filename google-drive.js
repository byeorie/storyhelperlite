// Google OAuth + Drive API
const GOOGLE_CLIENT_ID = "612980273037-1sv5i8tgv9rduiq7hvg2h0u0d78r1kgp.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const DRIVE_FILE_NAME = "storyhelper_data.json";

let gTokenClient = null;
let gAccessToken = null;
let gDriveFileId = null;

/* ===== 초기화 ===== */
function initGoogle() {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: onGoogleSignIn,
    auto_select: true,
  });

  gTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: onTokenResponse,
  });

  // 자동 로그인 시도
  google.accounts.id.prompt();
}

function onGoogleSignIn(resp) {
  const payload = JSON.parse(atob(resp.credential.split(".")[1]));
  document.body.classList.add("logged-in");
  updateUserUI(payload.name, payload.picture);
  // Drive 접근 토큰 요청
  gTokenClient.requestAccessToken({ prompt: "" });
}

function onTokenResponse(resp) {
  if (resp.error) return;
  gAccessToken = resp.access_token;
  document.body.classList.add("logged-in");
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
  const btn = document.getElementById("googleLoginBtn");
  btn.innerHTML = "Google로 로그인";
  btn.onclick = googleLogin;
  document.getElementById("driveStatus").textContent = "로컬 저장";
}

function googleLogin() {
  // One Tap이 차단되면 바로 OAuth 팝업으로 전환
  try {
    google.accounts.id.prompt((n) => {
      if (!n || n.isNotDisplayed() || n.isSkippedMoment() || n.isDismissedMoment()) {
        gTokenClient.requestAccessToken({ prompt: "select_account" });
      }
    });
  } catch(e) {
    gTokenClient.requestAccessToken({ prompt: "select_account" });
  }
}

/* ===== 초기화 트리거 ===== */
// 버튼 클릭 핸들러는 라이브러리 로드와 무관하게 즉시 연결
function bindLoginButton() {
  const btn = document.getElementById("googleLoginBtn");
  if (btn) btn.onclick = googleLogin;
  const ov = document.getElementById("overlayLoginBtn");
  if (ov) ov.onclick = googleLogin;
}

// GSI 라이브러리(accounts.google.com/gsi/client)는 async/defer 로드되므로
// google.accounts 객체가 준비될 때까지 폴링 후 초기화
function waitForGsiAndInit() {
  if (window.google && google.accounts && google.accounts.id) {
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
async function driveRequest(method, url, body) {
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: "Bearer " + gAccessToken,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.ok ? r.json() : null;
}

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
      saveToDrive(); // 현재 로컬 데이터 업로드
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
    st.textContent = 