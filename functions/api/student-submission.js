import { requireAuth, jsonResponse } from "./_utils.js";

/* GET /api/student-submission?id=123 — 내가 제출한 것의 상세(교수 첨삭 포함) — 본인 것만 */
export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const row = await env.DB.prepare(
    "SELECT s.id, s.type, s.data, s.feedback, s.submitted_at, s.feedback_at, a.title AS assignment_title " +
    "FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.id = ? AND s.student_id = ?"
  ).bind(id, auth.user.id).first();
  if (!row) return jsonResponse({ error: "제출물을 찾을 수 없습니다." }, 404);

  let data = null, feedback = null;
  try { data = JSON.parse(row.data); } catch (e) {}
  try { feedback = row.feedback ? JSON.parse(row.feedback) : null; } catch (e) {}

  return jsonResponse({
    submission: { id: row.id, type: row.type, data, feedback, submittedAt: row.submitted_at, feedbackAt: row.feedback_at, assignmentTitle: row.assignment_title },
  });
}
