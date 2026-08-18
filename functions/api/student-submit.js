import { requireAuth, jsonResponse, nowSec } from "./_utils.js";

const VALID_TYPES = ["plan", "plot", "write"];

/* POST /api/student-submit — 과제 제출  body: { assignmentId, type, projectName, data } */
export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  if (!auth.user.profId) return jsonResponse({ error: "가입한 교수 그룹이 없습니다. 설정에서 교수 코드를 먼저 입력해주세요." }, 400);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const assignmentId = Number(body && body.assignmentId);
  const type = body && body.type;
  if (!assignmentId || !VALID_TYPES.includes(type)) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  if (typeof body.data === "undefined") return jsonResponse({ error: "제출할 내용이 없습니다." }, 400);

  const assignment = await env.DB.prepare(
    "SELECT id, open FROM assignments WHERE id = ? AND prof_id = ?"
  ).bind(assignmentId, auth.user.profId).first();
  if (!assignment) return jsonResponse({ error: "과제를 찾을 수 없습니다." }, 404);
  if (!assignment.open) return jsonResponse({ error: "제출이 마감된 과제입니다." }, 403);

  const now = nowSec();
  const result = await env.DB.prepare(
    "INSERT INTO submissions (assignment_id, student_id, type, project_name, data, submitted_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(assignmentId, auth.user.id, type, (body.projectName || "").slice(0, 100), JSON.stringify(body.data), now).run();

  return jsonResponse({ ok: true, submissionId: result.meta.last_row_id, submittedAt: now });
}
