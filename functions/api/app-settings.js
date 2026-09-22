import { requireAuth, requireAdmin, jsonResponse } from "./_utils.js";

/* ===== 앱 전역 설정 (2026-09-22) =====
   관리자(byeorie)가 바꿀 수 있는 서버 설정을 server_meta 표(key/value)에 저장한다.
   지금은 "파일 제출 과제의 파일 하나당 최대 용량(MB)" 하나만 쓴다.

   - GET  /api/app-settings : 로그인한 모든 계정. { fileMaxMb, min, max }
   - POST /api/app-settings : 관리자만. body { fileMaxMb: 숫자 } → 저장 후 같은 형태로 반환

   서버 쪽 업로드 API(assignment-file.js · storyboard-image.js)도 getFileMaxBytes()로 이 값을
   읽어서 막으므로, 클라이언트를 우회해도 설정한 용량을 넘길 수 없다. */

export const FILE_MAX_MB_DEFAULT = 1.5;   // 2026-09-22: 1MB → 1.5MB
export const FILE_MAX_MB_MIN = 0.5;
export const FILE_MAX_MB_MAX = 10;
const KEY = "file_max_mb";

/* 저장된 값(MB)을 읽는다. 표가 없거나 값이 이상하면 기본값. */
export async function getFileMaxMb(env) {
  try {
    const row = await env.DB.prepare("SELECT value FROM server_meta WHERE key = ?").bind(KEY).first();
    const mb = row ? Number(row.value) : 0;
    if (mb >= FILE_MAX_MB_MIN && mb <= FILE_MAX_MB_MAX) return mb;
  } catch (e) { /* server_meta 표가 아직 없는 경우 등 — 기본값으로 */ }
  return FILE_MAX_MB_DEFAULT;
}
export async function getFileMaxBytes(env) {
  return Math.round((await getFileMaxMb(env)) * 1024 * 1024);
}
/* 오류 메시지에 쓰는 표기 — 1.5MB / 2MB 처럼 깔끔하게 */
export function mbLabel(mb) {
  return (Math.round(mb * 10) / 10) + "MB";
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  return jsonResponse({ fileMaxMb: await getFileMaxMb(env), min: FILE_MAX_MB_MIN, max: FILE_MAX_MB_MAX });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth) return jsonResponse({ error: "관리자만 변경할 수 있습니다." }, 403);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const mb = Number(body && body.fileMaxMb);
  if (!(mb >= FILE_MAX_MB_MIN && mb <= FILE_MAX_MB_MAX)) {
    return jsonResponse({ error: `${FILE_MAX_MB_MIN}MB ~ ${FILE_MAX_MB_MAX}MB 사이로 정해주세요.` }, 400);
  }

  await env.DB.prepare("CREATE TABLE IF NOT EXISTS server_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)").run();
  await env.DB.prepare(
    "INSERT INTO server_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).bind(KEY, String(mb)).run();

  return jsonResponse({ ok: true, fileMaxMb: mb, min: FILE_MAX_MB_MIN, max: FILE_MAX_MB_MAX });
}
