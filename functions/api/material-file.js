import { requireAuth, jsonResponse, ensureBoardSchema, parseIdList } from "./_utils.js";

/* ===== 자료실 파일 내려받기 (2026-10-31) =====
   GET /api/material-file?id=..  (Authorization 헤더 필요 — 앱이 fetch로 받아 저장한다)
   받을 수 있는 사람:
   - 자료를 올린 교수 본인
   - 그 자료가 공유된 수업(material_classes)의 수강생
   - 그 자료가 첨부된 공지(class_notices.material_ids)가 있는 수업의 수강생
   제출 파일(assignment-file.js)과 달리 "링크만 알면 누구나"가 아니다 — 강의 자료 저작권 보호. */

function safeName(name) {
  return String(name || "file").replace(/[\\/:*?"<>|\r\n]/g, "_").slice(0, 120);
}

async function studentCanRead(env, materialId, studentId) {
  const shared = await env.DB.prepare(
    "SELECT 1 AS ok FROM material_classes mc JOIN class_students cs ON cs.class_id = mc.class_id " +
    "WHERE mc.material_id = ? AND cs.student_id = ? LIMIT 1"
  ).bind(materialId, studentId).first();
  if (shared) return true;
  const { results } = await env.DB.prepare(
    "SELECT n.material_ids FROM class_notices n JOIN class_students cs ON cs.class_id = n.class_id " +
    "WHERE cs.student_id = ? AND n.material_ids IS NOT NULL AND n.material_ids != '[]'"
  ).bind(studentId).all();
  return (results || []).some((r) => parseIdList(r.material_ids).includes(materialId));
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  if (!env.STORYBOARD_BUCKET) return jsonResponse({ error: "파일 저장소(R2)가 아직 연결되지 않았습니다." }, 500);
  await ensureBoardSchema(env);

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  const mat = await env.DB.prepare("SELECT id, prof_id, file_name, r2_key FROM materials WHERE id = ?").bind(id).first();
  if (!mat) return jsonResponse({ error: "자료를 찾을 수 없습니다(삭제되었을 수 있습니다)." }, 404);

  const allowed = mat.prof_id === auth.user.id || await studentCanRead(env, id, auth.user.id);
  if (!allowed) return jsonResponse({ error: "이 자료를 받을 권한이 없습니다." }, 403);

  const obj = await env.STORYBOARD_BUCKET.get(mat.r2_key);
  if (!obj) return jsonResponse({ error: "파일을 찾을 수 없습니다." }, 404);
  const name = safeName(mat.file_name);
  const ext = (/\.([A-Za-z0-9]+)$/.exec(name) || [])[1] || "bin";
  return new Response(obj.body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="file.${ext}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
