import { requireAuth, jsonResponse, nowSec, ensureAssignmentSchema } from "./_utils.js";

const VALID_TYPES = ["plan", "plot", "write", "character", "background", "event", "storyboard"];
const TYPE_LABEL = { plan: "기획서", plot: "플롯", write: "글쓰기", character: "캐릭터 설정", background: "배경 설정", event: "사건 설정", storyboard: "콘티" };

/* POST /api/student-submit — 과제 제출  body: { assignmentId, type, projectName, data }
   2026-08-20: 학생이 여러 교수를 등록할 수 있게 되면서, "가입 여부" 확인을 auth.user.profId(기본
   선택 교수) 하나가 아니라 student_professors 표에서 그 과제를 낸 교수와의 등록 여부로 직접 확인한다.
   (드롭다운으로 어느 교수 화면에서 제출했든, 그 과제의 실제 prof_id 기준으로만 검증하면 되므로
   요청 본문에 profId를 따로 받을 필요가 없다) */
export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  await ensureAssignmentSchema(env);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const assignmentId = Number(body && body.assignmentId);
  const type = body && body.type;
  if (!assignmentId || !VALID_TYPES.includes(type)) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  if (typeof body.data === "undefined") return jsonResponse({ error: "제출할 내용이 없습니다." }, 400);

  let assignment;
  try {
    assignment = await env.DB.prepare(
      "SELECT id, open, prof_id, class_id, type FROM assignments WHERE id = ?"
    ).bind(assignmentId).first();
  } catch (e) {
    assignment = await env.DB.prepare(
      "SELECT id, open, prof_id, class_id FROM assignments WHERE id = ?"
    ).bind(assignmentId).first();
  }
  if (!assignment) return jsonResponse({ error: "과제를 찾을 수 없습니다." }, 404);

  const member = await env.DB.prepare(
    "SELECT id FROM student_professors WHERE student_id = ? AND prof_id = ?"
  ).bind(auth.user.id, assignment.prof_id).first();
  if (!member) return jsonResponse({ error: "가입한 강의가 없습니다. 설정에서 강의 코드를 먼저 입력해주세요." }, 400);

  // 2026-08-24: 과제가 특정 수업에 속해있다면(class_id) 그 수업의 수강생만 제출할 수 있다.
  if (assignment.class_id) {
    const inClass = await env.DB.prepare(
      "SELECT id FROM class_students WHERE class_id = ? AND student_id = ?"
    ).bind(assignment.class_id, auth.user.id).first();
    if (!inClass) return jsonResponse({ error: "이 과제가 속한 수업의 수강생이 아닙니다." }, 403);
  }
  if (!assignment.open) return jsonResponse({ error: "제출이 마감된 과제입니다." }, 403);

  /* 2026-09-12: 과제에 종류가 지정돼 있으면 그 종류만 받는다 — 학생이 다른 탭(예: 플롯)에서
     글쓰기 과제에 제출해 교수 화면에 엉뚱한 형식이 넘어가던 일을 막는다.
     종류가 비어 있는(예전) 과제는 예전처럼 모든 종류를 받는다. */
  if (assignment.type && assignment.type !== type) {
    return jsonResponse({
      error: "이 과제는 「" + (TYPE_LABEL[assignment.type] || assignment.type) + "」 과제입니다. "
        + (TYPE_LABEL[assignment.type] || assignment.type) + " 탭에서 제출해주세요.",
    }, 400);
  }

  const now = nowSec();
  const projectName = (body.projectName || "").slice(0, 100);
  const dataJson = JSON.stringify(body.data);

  /* 2026-09-14: 아직 교수의 첨삭이 하나도 없는 제출물이 남아 있으면, 새 줄을 쌓지 않고 그것을 최신
     내용으로 덮어쓴다(= 재제출). 학생이 제출 직후 고쳐서 다시 내면 교수 제출함에 같은 과제가 여러 개
     쌓여 어느 것이 최신인지 알기 어렵던 문제를 없앤다.
     - 첨삭이 이미 저장됐거나(feedback) 학생에게 전달된(feedback_at) 제출물은 건드리지 않고 새로 쌓아
       이력을 보존한다.
     - 덮어쓰면 "교수 확인"도 다시 안 한 상태로 되돌려(checked_at=NULL) 교수 알림에 다시 뜨게 한다. */
  let prev = null;
  try {
    prev = await env.DB.prepare(
      "SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ? AND type = ? " +
      "AND feedback IS NULL AND feedback_at IS NULL ORDER BY id DESC LIMIT 1"
    ).bind(assignmentId, auth.user.id, type).first();
  } catch (e) { prev = null; }

  if (prev && prev.id) {
    try {
      await env.DB.prepare(
        "UPDATE submissions SET project_name = ?, data = ?, submitted_at = ?, checked_at = NULL WHERE id = ?"
      ).bind(projectName, dataJson, now, prev.id).run();
    } catch (e) {
      // checked_at 컬럼이 아직 없는 DB에서도 덮어쓰기 자체는 되도록
      await env.DB.prepare(
        "UPDATE submissions SET project_name = ?, data = ?, submitted_at = ? WHERE id = ?"
      ).bind(projectName, dataJson, now, prev.id).run();
    }
    return jsonResponse({ ok: true, submissionId: prev.id, submittedAt: now, replaced: true });
  }

  const result = await env.DB.prepare(
    "INSERT INTO submissions (assignment_id, student_id, type, project_name, data, submitted_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(assignmentId, auth.user.id, type, projectName, dataJson, now).run();

  return jsonResponse({ ok: true, submissionId: result.meta.last_row_id, submittedAt: now, replaced: false });
}
