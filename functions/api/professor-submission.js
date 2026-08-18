import { requireProfessor, jsonResponse, nowSec } from "./_utils.js";

/* GET /api/professor-submission?id=123 — 제출물 상세(원본 + 첨삭본) — 본인 과제에 속한 것만 */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const row = await env.DB.prepare(
    "SELECT s.id, s.assignment_id, s.type, s.project_name, s.data, s.feedback, s.submitted_at, s.feedback_at, " +
    "  u.name AS student_name, u.username AS student_username, a.title AS assignment_title, a.prof_id " +
    "FROM submissions s JOIN users u ON u.id = s.student_id JOIN assignments a ON a.id = s.assignment_id " +
    "WHERE s.id = ?"
  ).bind(id).first();
  if (!row || row.prof_id !== auth.user.id) return jsonResponse({ error: "제출물을 찾을 수 없습니다." }, 404);

  let data = null, feedback = null;
  try { data = JSON.parse(row.data); } catch (e) {}
  try { feedback = row.feedback ? JSON.parse(row.feedback) : null; } catch (e) {}

  return jsonResponse({
    submission: {
      id: row.id, type: row.type, projectName: row.project_name, data, feedback,
      submittedAt: row.submitted_at, feedbackAt: row.feedback_at,
      studentName: row.student_name, studentUsername: row.student_username, assignmentTitle: row.assignment_title,
    },
  });
}

/* POST /api/professor-submission — 첨삭 저장  body: { id, feedback } (feedback: JSON 가능한 값) */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const id = Number(body && body.id);
  if (!id || typeof body.feedback === "undefined") return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const owner = await env.DB.prepare(
    "SELECT a.prof_id FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.id = ?"
  ).bind(id).first();
  if (!owner || owner.prof_id !== auth.user.id) return jsonResponse({ error: "제출물을 찾을 수 없습니다." }, 404);

  const now = nowSec();
  await env.DB.prepare(
    "UPDATE submissions SET feedback = ?, feedback_at = ? WHERE id = ?"
  ).bind(JSON.stringify(body.feedback), now, id).run();

  return jsonResponse({ ok: true, feedbackAt: now });
}
