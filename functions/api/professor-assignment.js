import { requireProfessor, jsonResponse } from "./_utils.js";

const TYPE_LABEL = { plan: "기획서", plot: "플롯", write: "글쓰기" };

/* GET /api/professor-assignment?id=123 — 해당 과제 폴더의 제출 목록 (교수 전용, 본인 과제만) */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const assignment = await env.DB.prepare(
    "SELECT id, title, due_at, open, created_at FROM assignments WHERE id = ? AND prof_id = ?"
  ).bind(id, auth.user.id).first();
  if (!assignment) return jsonResponse({ error: "과제를 찾을 수 없습니다." }, 404);

  const { results } = await env.DB.prepare(
    "SELECT s.id, s.type, s.project_name, s.submitted_at, s.feedback_at, " +
    "  (s.feedback IS NOT NULL) AS has_feedback, u.name AS student_name, u.username AS student_username " +
    "FROM submissions s JOIN users u ON u.id = s.student_id " +
    "WHERE s.assignment_id = ? ORDER BY s.submitted_at DESC"
  ).bind(id).all();

  const submissions = (results || []).map((r) => ({ ...r, type_label: TYPE_LABEL[r.type] || r.type }));
  return jsonResponse({ assignment, submissions });
}

/* DELETE /api/professor-assignment?id=123 — 과제 폴더 삭제 (본인 과제만, 제출물도 함께 영구 삭제) */
export async function onRequestDelete({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const assignment = await env.DB.prepare(
    "SELECT id FROM assignments WHERE id = ? AND prof_id = ?"
  ).bind(id, auth.user.id).first();
  if (!assignment) return jsonResponse({ error: "과제를 찾을 수 없습니다." }, 404);

  await env.DB.prepare("DELETE FROM submissions WHERE assignment_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM assignments WHERE id = ? AND prof_id = ?").bind(id, auth.user.id).run();

  return jsonResponse({ ok: true });
}

/* POST /api/professor-assignment — 과제 마감 스위치 토글  body: { id, open: 0|1 } */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const id = Number(body && body.id);
  const open = (body && body.open) ? 1 : 0;
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const result = await env.DB.prepare(
    "UPDATE assignments SET open = ? WHERE id = ? AND prof_id = ?"
  ).bind(open, id, auth.user.id).run();
  if (!result.meta.changes) return jsonResponse({ error: "과제를 찾을 수 없습니다." }, 404);

  return jsonResponse({ ok: true, open });
}
