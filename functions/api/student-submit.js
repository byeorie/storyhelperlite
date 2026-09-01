import { requireAuth, jsonResponse, nowSec } from "./_utils.js";

const VALID_TYPES = ["plan", "plot", "write", "character", "background", "event", "storyboard"];

/* POST /api/student-submit — 과제 제출  body: { assignmentId, type, projectName, data }
   2026-08-20: 학생이 여러 교수를 등록할 수 있게 되면서, "가입 여부" 확인을 auth.user.profId(기본
   선택 교수) 하나가 아니라 student_professors 표에서 그 과제를 낸 교수와의 등록 여부로 직접 확인한다.
   (드롭다운으로 어느 교수 화면에서 제출했든, 그 과제의 실제 prof_id 기준으로만 검증하면 되므로
   요청 본문에 profId를 따로 받을 필요가 없다) */
export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const assignmentId = Number(body && body.assignmentId);
  const type = body && body.type;
  if (!assignmentId || !VALID_TYPES.includes(type)) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  if (typeof body.data === "undefined") return jsonResponse({ error: "제출할 내용이 없습니다." }, 400);

  const assignment = await env.DB.prepare(
    "SELECT id, open, prof_id, class_id FROM assignments WHERE id = ?"
  ).bind(assignmentId).first();
  if (!assignment) return jsonResponse({ error: "과제를 찾을 수 없습니다." }, 404);

  const member = await env.DB.prepare(
    "SELECT id FROM student_professors WHERE student_id = ? AND prof_id = ?"
  ).bind(auth.user.id, assignment.prof_id).first();
  if (!member) return jsonResponse({ error: "가입한 교수 그룹이 없습니다. 설정에서 교수 코드를 먼저 입력해주세요." }, 400);

  // 2026-08-24: 과제가 특정 수업에 속해있다면(class_id) 그 수업의 수강생만 제출할 수 있다.
  if (assignment.class_id) {
    const inClass = await env.DB.prepare(
      "SELECT id FROM class_students WHERE class_id = ? AND student_id = ?"
    ).bind(assignment.class_id, auth.user.id).first();
    if (!inClass) return jsonResponse({ error: "이 과제가 속한 수업의 수강생이 아닙니다." }, 403);
  }
  if (!assignment.open) return jsonResponse({ error: "제출이 마감된 과제입니다." }, 403);

  const now = nowSec();
  const result = await env.DB.prepare(
    "INSERT INTO submissions (assignment_id, student_id, type, project_name, data, submitted_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(assignmentId, auth.user.id, type, (body.projectName || "").slice(0, 100), JSON.stringify(body.data), now).run();

  return jsonResponse({ ok: true, submissionId: result.meta.last_row_id, submittedAt: now });
}
