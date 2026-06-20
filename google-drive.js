// Google OAuth + Drive API
const GOOGLE_CLIENT_ID = "612980273037-1sv5i8tgv9rduiq7hvg2h0u0d78r1kgp.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const DRIVE_FILE_NAME = "storyhelper_data.json";

let gTokenClient = null;
let gAccessToken = null;
let gDriveFileId = null;

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
  google.accounts.id.prompt();
}

function onGoogleSignIn(resp) {
  const payload = JSON.parse(atob(resp.credential.split(".")[1]));
  updateUserUI(payload.name, payload.picture);
  gTokenClient.requestAccessToken({ prompt: "" });
}

function onTokenResponse(resp) {
  if (resp.error) return;
  gAccessToken = resp.access_token;
  loadFromDrive();
}

function updateUserUI(name, picture) {
  const btn = document.getElementById("googleLoginBtn");
  if (!btn) return;
  btn.innerHTML = `<img src="${picture}" style="width:24px;height:24px;border-radius:50%;vertical-align:middle;margin-right:6px">${name} <span style="opacity:.6;font-size:.8em">로그아웃</span>`;
  btn.onclick = signOut;
  document.getElementById("driveStatus").textContent = "☁️ 드라이브 연결 중…";
}

function signOut() {
  google.accounts.id.disableAutoSelect();
  gAccessToken = null;
  gDriveFileId = null;
  const btn = document.getElementById("googleLoginBtn");
  btn.innerHTML = "Google로 로그인";
  btn.onclick = googleLogin;
  document.getElementById("driveStatus").textContent = "로컬 저장";
}

function googleLogin() {
  google.accounts.id.prompt((n) => {
    if (n.isNotDisplayed() || n.isSkippedMoment()) {
      gTokenClient.requestAccessToken({ prompt: "select_account" });
    }
  });
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
    st.textContent = "☁️ 드라이브 오류";
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
