import { requireProfessor, jsonResponse, nowSec } from "./_utils.js";

/* GET /api/professor-assignments — 내가 등록한 과제 목록(+제출 수) */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  const { results } = await env.DB.prepare(
    "SELECT a.id, a.title, a.due_at, a.open, a.created_at, " +
    "  (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) AS submission_count " +
    "FROM assignments a WHERE a.prof_id = ? ORDER BY a.created_at DESC"
  ).bind(auth.user.id).all();

  return jsonResponse({ assignments: results || [] });
}

/* POST /api/professor-assignments — 새 과제 등록  body: { title, dueAt } (dueAt: unix seconds 또는 null) */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const title = ((body && body.title) || "").trim();
  const dueAt = (body && Number.isFinite(body.dueAt)) ? body.dueAt : null;
  if (!title) return jsonResponse({ error: "과제명을 입력해주세요." }, 400);

  const created = nowSec();
  const result = await env.DB.prepare(
    "INSERT INTO assignments (prof_id, title, due_at, open, created_at) VALUES (?, ?, ?, 1, ?)"
  ).bind(auth.user.id, title, dueAt, created).run();

  return jsonResponse({ ok: true, assignment: { id: result.meta.last_row_id, title, due_at: dueAt, open: 1, created_at: created, submission_count: 0 } });
}
