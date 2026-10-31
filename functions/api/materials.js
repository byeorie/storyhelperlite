import { requireProfessor, jsonResponse, nowSec, ensureBoardSchema } from "./_utils.js";

/* ===== 교수 자료실 (2026-10-31) =====
   교수가 수업 시간에 쓸 자료(PDF·PPT·한글·이미지 등)를 올려두고, 수업마다 "공유"를 걸어 학생에게 보여준다.
   자료는 수업이 아니라 교수 계정에 묶여 있어서 3/1·9/1 정기 초기화 때도 지워지지 않고, 다음 학기에
   새 수업을 만들면 공유만 다시 체크하면 된다. 파일은 R2(STORYBOARD_BUCKET), 목록은 materials 표.

   - GET    /api/materials                       : 내 자료 목록 (+ 공유한 수업 id 목록 classIds)
   - POST   /api/materials?name=파일명&title=제목 : 본문(파일 바이트)을 그대로 올린다
   - PUT    /api/materials  { id, title?, classIds? } : 제목 변경 / 공유 수업 다시 지정(내 수업만)
   - DELETE /api/materials?id=..                 : 자료 삭제(R2 파일·공유 기록 함께 삭제)
   내려받기는 material-file.js(교수 본인 + 공유받은 수업의 학생만). */

export const MATERIAL_MAX_MB = 30;
export const MATERIAL_EXT = ["pdf", "ppt", "pptx", "doc", "docx", "hwp", "hwpx", "xls", "xlsx", "txt",
  "zip", "jpg", "jpeg", "png", "gif", "webp", "clip", "psd", "mp4", "mp3"];

function extOf(name) {
  const m = /\.([A-Za-z0-9]+)$/.exec(String(name || ""));
  return m ? m[1].toLowerCase() : "";
}
function safeName(name) {
  return String(name || "file").replace(/[\\/:*?"<>|\r\n]/g, "_").slice(0, 120);
}

async function listMaterials(env, profId) {
  const { results } = await env.DB.prepare(
    "SELECT id, title, file_name, size, created_at FROM materials WHERE prof_id = ? ORDER BY created_at DESC"
  ).bind(profId).all();
  const { results: links } = await env.DB.prepare(
    "SELECT mc.material_id, mc.class_id FROM material_classes mc JOIN materials m ON m.id = mc.material_id WHERE m.prof_id = ?"
  ).bind(profId).all();
  const byMat = {};
  (links || []).forEach((l) => { (byMat[l.material_id] = byMat[l.material_id] || []).push(l.class_id); });
  return (results || []).map((m) => ({ ...m, classIds: byMat[m.id] || [] }));
}

export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);
  await ensureBoardSchema(env);
  return jsonResponse({ materials: await listMaterials(env, auth.user.id), maxMb: MATERIAL_MAX_MB, exts: MATERIAL_EXT });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);
  if (!env.STORYBOARD_BUCKET) return jsonResponse({ error: "파일 저장소(R2)가 아직 연결되지 않았습니다. 관리자에게 문의하세요." }, 500);
  await ensureBoardSchema(env);

  const url = new URL(request.url);
  const name = safeName(url.searchParams.get("name") || "");
  const ext = extOf(name);
  if (!MATERIAL_EXT.includes(ext)) return jsonResponse({ error: `올릴 수 없는 파일 형식입니다(${ext || "확장자 없음"}).` }, 400);
  const title = (url.searchParams.get("title") || "").trim().slice(0, 120) || name.replace(/\.[^.]+$/, "");

  const buf = await request.arrayBuffer();
  if (!buf || buf.byteLength === 0) return jsonResponse({ error: "빈 파일입니다." }, 400);
  if (buf.byteLength > MATERIAL_MAX_MB * 1024 * 1024) {
    return jsonResponse({ error: `자료 파일은 하나당 ${MATERIAL_MAX_MB}MB까지 올릴 수 있습니다.` }, 400);
  }

  const key = `${auth.user.id}/material/${crypto.randomUUID()}.${ext}`;
  await env.STORYBOARD_BUCKET.put(key, buf, {
    httpMetadata: { contentType: "application/octet-stream" },
    customMetadata: { name },
  });
  const created = nowSec();
  const r = await env.DB.prepare(
    "INSERT INTO materials (prof_id, title, file_name, r2_key, size, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(auth.user.id, title, name, key, buf.byteLength, created).run();

  return jsonResponse({ ok: true, material: { id: r.meta.last_row_id, title, file_name: name, size: buf.byteLength, created_at: created, classIds: [] } });
}

export async function onRequestPut({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);
  await ensureBoardSchema(env);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const id = Number(body && body.id);
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  const mat = await env.DB.prepare("SELECT id FROM materials WHERE id = ? AND prof_id = ?").bind(id, auth.user.id).first();
  if (!mat) return jsonResponse({ error: "자료를 찾을 수 없습니다." }, 404);

  if (typeof body.title === "string") {
    const title = body.title.trim().slice(0, 120);
    if (!title) return jsonResponse({ error: "제목을 입력해주세요." }, 400);
    await env.DB.prepare("UPDATE materials SET title = ? WHERE id = ?").bind(title, id).run();
  }

  if (Array.isArray(body.classIds)) {
    /* 내 수업만 골라낸다(다른 교수의 수업 id가 섞여 와도 무시) */
    const { results: mine } = await env.DB.prepare("SELECT id FROM classes WHERE prof_id = ?").bind(auth.user.id).all();
    const mineSet = new Set((mine || []).map((c) => c.id));
    const classIds = [...new Set(body.classIds.map(Number))].filter((c) => mineSet.has(c));
    await env.DB.prepare("DELETE FROM material_classes WHERE material_id = ?").bind(id).run();
    const now = nowSec();
    for (const cid of classIds) {
      await env.DB.prepare("INSERT OR IGNORE INTO material_classes (material_id, class_id, created_at) VALUES (?, ?, ?)").bind(id, cid, now).run();
    }
  }

  const list = await listMaterials(env, auth.user.id);
  return jsonResponse({ ok: true, material: list.find((m) => m.id === id) || null });
}

export async function onRequestDelete({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);
  await ensureBoardSchema(env);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  const mat = await env.DB.prepare("SELECT id, r2_key FROM materials WHERE id = ? AND prof_id = ?").bind(id, auth.user.id).first();
  if (!mat) return jsonResponse({ error: "자료를 찾을 수 없습니다." }, 404);

  if (env.STORYBOARD_BUCKET) { try { await env.STORYBOARD_BUCKET.delete(mat.r2_key); } catch (e) {} }
  await env.DB.prepare("DELETE FROM material_classes WHERE material_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM materials WHERE id = ?").bind(id).run();
  /* 공지에 붙어 있던 자료 id는 그대로 두어도 된다 — 공지 조회 때 남아 있는 자료만 보여준다 */
  return jsonResponse({ ok: true });
}
