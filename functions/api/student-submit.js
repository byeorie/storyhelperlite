import { requireAuth, jsonResponse, nowSec, ensureAssignmentSchema, ensureSubmissionSchema } from "./_utils.js";

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
  await ensureSubmissionSchema(env);

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

  /* 2026-09-15: 재제출은 "차수"로 분리해서 쌓는다 — 이전 제출물을 덮어쓰지 않는다.
     예전(2026-09-14~09-15)에는 첨삭 전 재제출이면 같은 줄을 덮어써서 이전에 낸 내용이 사라지고,
     교수 제출함에서는 같은 학생의 제출물이 여러 줄로 흩어져 어느 것이 최신인지 섞여 보였다.
     이제 제출할 때마다 submit_round(1차, 2차, …)를 붙여 새 줄로 저장하고, 교수·학생 화면은
     학생당 최신 차수 하나만 보여주며 이전 차수는 드롭다운으로 따로 열어본다. */
  let round = null;
  try {
    const r = await env.DB.prepare(
      "SELECT MAX(submit_round) AS mx, COUNT(*) AS n FROM submissions " +
      "WHERE assignment_id = ? AND student_id = ? AND type = ?"
    ).bind(assignmentId, auth.user.id, type).first();
    // 차수가 아직 안 채워진(NULL) 옛 줄이 있어도 번호가 겹치지 않도록 줄 수와 큰 쪽을 쓴다
    round = Math.max(Number((r && r.mx) || 0), Number((r && r.n) || 0)) + 1;
  } catch (e) { round = null; }

  if (round) {
    try {
      const result = await env.DB.prepare(
        "INSERT INTO submissions (assignment_id, student_id, type, project_name, data, submitted_at, submit_round) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(assignmentId, auth.user.id, type, projectName, dataJson, now, round).run();
      return jsonResponse({ ok: true, submissionId: result.meta.last_row_id, submittedAt: now, round, replaced: false });
    } catch (e) { /* submit_round 컬럼이 아직 없는 DB — 아래 예전 방식으로 저장 */ }
  }

  const result = await env.DB.prepare(
    "INSERT INTO submissions (assignment_id, student_id, type, project_name, data, submitted_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(assignmentId, auth.user.id, type, projectName, dataJson, now).run();

  return jsonResponse({ ok: true, submissionId: result.meta.last_row_id, submittedAt: now, round: null, replaced: false });
}
