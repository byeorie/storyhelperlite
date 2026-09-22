import { requireAuth, jsonResponse } from "./_utils.js";
import { getFileMaxBytes } from "./app-settings.js";

/* ===== 콘티 이미지 저장 (Cloudflare R2) =====
   D1은 값 하나(행)의 크기가 2MB로 제한되어 있어 이미지를 텍스트(JSON)에 그대로 담을 수 없다.
   그래서 이미지 바이트는 D1이 아닌 R2 버킷(STORYBOARD_BUCKET)에 저장하고,
   프로젝트 데이터(D1)에는 이미지를 가리키는 key 문자열만 남긴다.

   - POST   : 로그인 필요. 요청 본문(이미지, 클라이언트에서 이미 용량을 맞춰 보냄)을 그대로 저장하고 key 반환
              Content-Type이 image/png면 PNG(투명 레이어)로, 그 밖에는 JPEG로 저장한다
   - GET    : 인증 없이 공개 제공 (key가 추측 불가능한 UUID이므로 사실상 비공개 링크와 동일하게 동작)
   - DELETE : 로그인 필요. 본인이 올린 이미지(키 접두사가 자신의 user_id)만 삭제 가능 */

/* 콘티 압축 목표(300~500KB)보다 넉넉하게. 2026-09-15: "파일 제출" 과제의 jpg/png도 이 엔드포인트로
   올라오므로 그쪽 상한에 맞춘다 — 2026-09-22부터 그 상한은 관리자가 정한다(기본 1.5MB).
   다만 콘티·캐릭터 시트 저장이 막히면 안 되므로 항상 1MB 이상은 허용한다. */
const MIN_MAX_BYTES = 1024 * 1024;

export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  if (!env.STORYBOARD_BUCKET) return jsonResponse({ error: "이미지 저장소(R2)가 아직 연결되지 않았습니다. 관리자에게 문의하세요." }, 500);

  const buf = await request.arrayBuffer();
  if (!buf || buf.byteLength === 0) return jsonResponse({ error: "빈 파일입니다." }, 400);
  const maxBytes = Math.max(MIN_MAX_BYTES, await getFileMaxBytes(env));
  if (buf.byteLength > maxBytes) return jsonResponse({ error: "이미지 용량이 너무 큽니다." }, 400);

  /* (2026-09-14) 그리기 레이어(스케치/채색/선)는 투명도를 지켜야 해서 PNG로 올라온다.
     그 외에는 예전처럼 JPEG로 본다. */
  const sent = (request.headers.get("content-type") || "").toLowerCase();
  const isPng = sent.includes("image/png");
  const contentType = isPng ? "image/png" : "image/jpeg";
  const key = `${auth.user.id}/${crypto.randomUUID()}.${isPng ? "png" : "jpg"}`;
  await env.STORYBOARD_BUCKET.put(key, buf, { httpMetadata: { contentType } });

  return jsonResponse({ ok: true, key });
}

export async function onRequestGet({ request, env }) {
  if (!env.STORYBOARD_BUCKET) return jsonResponse({ error: "이미지 저장소(R2)가 아직 연결되지 않았습니다." }, 500);
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) return jsonResponse({ error: "key가 필요합니다." }, 400);

  const obj = await env.STORYBOARD_BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function onRequestDelete({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  if (!env.STORYBOARD_BUCKET) return jsonResponse({ error: "이미지 저장소(R2)가 아직 연결되지 않았습니다." }, 500);

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) return jsonResponse({ error: "key가 필요합니다." }, 400);
  if (!key.startsWith(`${auth.user.id}/`)) return jsonResponse({ error: "본인이 올린 이미지만 삭제할 수 있습니다." }, 403);

  await env.STORYBOARD_BUCKET.delete(key);
  return jsonResponse({ ok: true });
}
