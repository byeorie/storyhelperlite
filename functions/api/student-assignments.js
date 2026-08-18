import { requireAuth, jsonResponse } from "./_utils.js";

/* GET /api/student-assignments — 내가 가입한 교수의 과제 목록 + 내 제출 현황 */
export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  if (!auth.user.profId) return jsonResponse({ profId: null, prof: null, assignments: [] });

  const prof = await env.DB.prepare("SELECT id, name, school FROM users WHERE id = ?").bind(auth.user.profId).first();

  const { results } = await env.DB.prepare(
    "SELECT id, title, due_at, open, created_at FROM assignments WHERE prof_id = ? ORDER BY created_at DESC"
  ).bind(auth.user.profId).all();

  const { results: mine } = await env.DB.prepare(
    "SELECT id, assignment_id, type, submitted_at, (feedback IS NOT NULL) AS has_feedback, feedback_at " +
    "FROM submissions WHERE student_id = ? ORDER BY submitted_at DESC"
  ).bind(auth.user.id).all();

  const byAssignment = {};
  (mine || []).forEach((s) => {
    (byAssignment[s.assignment_id] = byAssignment[s.assignment_id] || []).push(s);
  });
  const assignments = (results || []).map((a) => ({ ...a, mySubmissions: byAssignment[a.id] || [] }));

  return jsonResponse({ profId: auth.user.profId, prof: prof || null, assignments });
}
