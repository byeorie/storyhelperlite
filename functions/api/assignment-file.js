import { requireAuth, jsonResponse } from "./_utils.js";
import { getFileMaxMb, mbLabel } from "./app-settings.js";

/* ===== 파일 제출 과제의 첨부파일 저장 (Cloudflare R2) — 2026-09-15 =====
   "파일 제출" 과제는 학생이 jpg/png/clip 파일을 올려서 낸다.
   - jpg/png는 이미 있는 /api/storyboard-image 에 올린다(그래야 첨삭 화면에서 크게 보기·
     그림 위 피드백 그리기를 그대로 쓸 수 있다).
   - clip(클립스튜디오)은 이미지가 아니라 브라우저가 열 수 없으므로 여기에 올리고 다운로드만 한다.

   - POST /api/assignment-file?name=파일명.clip : 로그인 필요. 본문(파일 바이트)을 그대로 저장하고 key 반환
   - GET  /api/assignment-file?key=...         : 다운로드(첨부 파일로 내려받기). key가 추측 불가능한
                                                 UUID라 비공개 링크처럼 동작한다(콘티 이미지와 같은 방식).
   - DELETE                                    : 본인이 올린 파일(키 접두사가 자신의 user_id)만 삭제 */

/* 파일 하나당 최대 용량은 관리자(byeorie)가 [관리자] 탭에서 정한다(server_meta.file_max_mb,
   기본 1.5MB). 클라이언트(app.js FILE_MAX_BYTES)에서도 같은 값으로 미리 막는다. */
const ALLOWED_EXT = ["clip"];           // 여기로 올릴 수 있는 확장자(이미지는 storyboard-image로 간다)

function extOf(name) {
  const m = /\.([A-Za-z0-9]+)$/.exec(String(name || ""));
  return m ? m[1].toLowerCase() : "";
}
/* 파일명에서 경로·따옴표 등 헤더를 깨뜨릴 수 있는 글자를 지운다 */
function safeName(name) {
  return String(name || "file").replace(/[\\/:*?"<>|\r\n]/g, "_").slice(0, 120);
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  if (!env.STORYBOARD_BUCKET) return jsonResponse({ error: "파일 저장소(R2)가 아직 연결되지 않았습니다. 관리자에게 문의하세요." }, 500);

  const url = new URL(request.url);
  const name = safeName(url.searchParams.get("name") || "");
  const ext = extOf(name);
  if (!ALLOWED_EXT.includes(ext)) return jsonResponse({ error: "clip 파일만 올릴 수 있습니다." }, 400);

  const maxMb = await getFileMaxMb(env);
  const maxBytes = Math.round(maxMb * 1024 * 1024);
  const buf = await request.arrayBuffer();
  if (!buf || buf.byteLength === 0) return jsonResponse({ error: "빈 파일입니다." }, 400);
  if (buf.byteLength > maxBytes) {
    return jsonResponse({ error: `파일 하나당 ${mbLabel(maxMb)}까지만 올릴 수 있습니다.` }, 400);
  }

  const key = `${auth.user.id}/file/${crypto.randomUUID()}.${ext}`;
  await env.STORYBOARD_BUCKET.put(key, buf, {
    httpMetadata: { contentType: "application/octet-stream" },
    customMetadata: { name },
  });
  return jsonResponse({ ok: true, key, name, size: buf.byteLength });
}

export async function onRequestGet({ request, env }) {
  if (!env.STORYBOARD_BUCKET) return jsonResponse({ error: "파일 저장소(R2)가 아직 연결되지 않았습니다." }, 500);
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) return jsonResponse({ error: "key가 필요합니다." }, 400);

  const obj = await env.STORYBOARD_BUCKET.get(key);
  if (!obj) return jsonResponse({ error: "파일을 찾을 수 없습니다." }, 404);

  const name = safeName((obj.customMetadata && obj.customMetadata.name) || url.searchParams.get("name") || "assignment.clip");
  return new Response(obj.body, {
    headers: {
      "Content-Type": "application/octet-stream",
      /* 한글 파일명은 filename*(UTF-8)로 함께 적어야 깨지지 않는다 */
      "Content-Disposition": `attachment; filename="file.${extOf(name) || "clip"}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function onRequestDelete({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  if (!env.STORYBOARD_BUCKET) return jsonResponse({ error: "파일 저장소(R2)가 아직 연결되지 않았습니다." }, 500);
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) return jsonResponse({ error: "key가 필요합니다." }, 400);
  if (!String(key).startsWith(`${auth.user.id}/`)) return jsonResponse({ error: "권한이 없습니다." }, 403);
  await env.STORYBOARD_BUCKET.delete(key);
  return jsonResponse({ ok: true });
}
