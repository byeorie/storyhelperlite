// Google OAuth + Drive API
const GOOGLE_CLIENT_ID = "543063091602-injv9mjpavv1gobhrgmgbn7fr2u8jhge.apps.googleusercontent.com";
// drive.file 스코프: 이 앱이 만든 파일에만 접근 (OAuth 심사 시 비민감 스코프, 무료)
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_FILE_NAME = "storyhelper_data.json";
const DRIVE_FOLDER_NAME = "이야기도우미";

let gTokenClient = null;
let gAccessToken = null;
let gDriveFileId = null;
let gDriveFolderId = null;

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
  updateUserUI(payload.name, payload.picture);
  // Drive 접근 토큰 요청
  gTokenClient.requestAccessToken({ prompt: "" });
}

async function onTokenResponse(resp) {
  if (resp.error) return;
  gAccessToken = resp.access_token;
  document.body.classList.add("logged-in");
  // 사용자 정보 가져와 UI 갱신
  try {
    const u = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: "Bearer " + gAccessToken },
    }).then(r => r.json());
    updateUserUI(u.name || u.email, u.picture || "");
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
  gDriveFolderId = null;
  const btn = document.getElementById("googleLoginBtn");
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

async function findOrCreateDriveFolder() {
  const q = `mimeType='application/vnd.google-apps.folder' and name='${DRIVE_FOLDER_NAME}' and trashed=false`;
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    { headers: { Authorization: "Bearer " + gAccessToken } }
  );
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
    const data = await r.json();
    if (data && data.projects) {
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
  if (r.ok) {
    const j = await r.json();
    if (!gDriveFileId) gDriveFileId = j.id;
    const st = document.getElementById("driveStatus");
    if (st) { st.textContent = "☁️ 드라이브에 저장됨"; }
  }
}
