import { requireProfessor, jsonResponse, ensureSubmissionSchema, ensureAssignmentSchema } from "./_utils.js";

const TYPE_LABEL = { plan: "기획서", plot: "플롯", write: "글쓰기", character: "캐릭터 설정", background: "배경 설정", event: "사건 설정", storyboard: "콘티" };
const VALID_TYPES = Object.keys(TYPE_LABEL);

/* GET /api/professor-assignment?id=123 — 해당 과제 폴더의 제출 목록 (교수 전용, 본인 과제만) */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  await ensureSubmissionSchema(env);
  await ensureAssignmentSchema(env);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  let assignment;
  try {
    assignment = await env.DB.prepare(
      "SELECT id, title, due_at, open, type, created_at FROM assignments WHERE id = ? AND prof_id = ?"
    ).bind(id, auth.user.id).first();
  } catch (e) {
    assignment = await env.DB.prepare(
      "SELECT id, title, due_at, open, created_at FROM assignments WHERE id = ? AND prof_id = ?"
    ).bind(id, auth.user.id).first();
  }
  if (!assignment) return jsonResponse({ error: "과제를 찾을 수 없습니다." }, 404);

  /* 2026-09-08: 예전에는 제출 목록 한 쿼리 안에서 submission_feedback_versions를 서브쿼리로 세었기 때문에,
     그 표가 운영 DB에 없으면 "제출함" 화면 전체가 열리지 않았다(500). 이제 본 목록과 버전 수 집계를
     분리하고, 집계는 실패해도 그냥 0으로 두고 넘어간다. checked_at(과제 확인)도 컬럼이 없는 DB를
     대비해 2단계로 시도한다. */
  let results = [];
  const BASE =
    "SELECT s.id, s.student_id, s.type, s.project_name, s.submitted_at, s.feedback_at, s.checked_at, s.submit_round, " +
    "  (s.feedback IS NOT NULL) AS has_feedback, u.name AS student_name, u.username AS student_username " +
    "FROM submissions s JOIN users u ON u.id = s.student_id " +
    "WHERE s.assignment_id = ? ORDER BY s.submitted_at DESC";
  try {
    const r = await env.DB.prepare(BASE).bind(id).all();
    results = r.results || [];
  } catch (e) {
    try {
      // submit_round 컬럼이 아직 없는 DB
      const r = await env.DB.prepare(BASE.replace("s.checked_at, s.submit_round,", "s.checked_at,")).bind(id).all();
      results = r.results || [];
    } catch (e2) {
      // checked_at 컬럼도 없는 아주 예전 DB
      const r = await env.DB.prepare(
        BASE.replace("s.feedback_at, s.checked_at, s.submit_round,", "s.feedback_at,")
      ).bind(id).all();
      results = r.results || [];
    }
  }

  const versionCounts = {};
  try {
    const vr = await env.DB.prepare(
      "SELECT v.submission_id AS sid, COUNT(*) AS n FROM submission_feedback_versions v " +
      "JOIN submissions s ON s.id = v.submission_id WHERE s.assignment_id = ? GROUP BY v.submission_id"
    ).bind(id).all();
    (vr.results || []).forEach((x) => { versionCounts[x.sid] = x.n; });
  } catch (e) {}

  /* 2026-09-15: 재제출 차수 묶기 — 같은 (학생, 종류)의 제출물은 한 줄로만 보여주고(최신 차수),
     이전 차수는 rounds 목록으로 함께 내려보내 교수 화면의 드롭다운에서 골라볼 수 있게 한다.
     예전에는 재제출할 때마다 제출함에 줄이 하나씩 늘어 같은 학생의 옛 제출물과 새 제출물이
     섞여 보였다. */
  const groups = new Map();
  results.forEach((r) => {
    const key = r.student_id + "|" + r.type;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  });

  const submissions = [];
  groups.forEach((rows) => {
    // 차수가 있으면 차수 순, 없으면 제출 시각(같으면 id) 순
    rows.sort((a, b) => (a.submit_round || 0) - (b.submit_round || 0)
      || (a.submitted_at || 0) - (b.submitted_at || 0) || a.id - b.id);
    const rounds = rows.map((r, i) => ({
      id: r.id,
      round: r.submit_round || (i + 1),
      submitted_at: r.submitted_at,
      has_feedback: r.has_feedback,
      checked_at: r.checked_at || null,
    }));
    const last = rows[rows.length - 1];
    submissions.push({
      ...last,
      checked_at: last.checked_at || null,
      round: last.submit_round || rows.length,
      round_count: rows.length,
      rounds,
      version_count: versionCounts[last.id] || 0,
      type_label: TYPE_LABEL[last.type] || last.type,
    });
  });
  // 최신 제출이 위로
  submissions.sort((a, b) => (b.submitted_at || 0) - (a.submitted_at || 0));

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

  /* 2026-09-08: 첨삭 버전 이력도 함께 지운다(예전에는 제출물만 지워 이력 행이 계속 남았다) */
  try {
    await env.DB.prepare(
      "DELETE FROM submission_feedback_versions WHERE submission_id IN (SELECT id FROM submissions WHERE assignment_id = ?)"
    ).bind(id).run();
  } catch (e) {}
  await env.DB.prepare("DELETE FROM submissions WHERE assignment_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM assignments WHERE id = ? AND prof_id = ?").bind(id, auth.user.id).run();

  return jsonResponse({ ok: true });
}

/* POST /api/professor-assignment — 등록해둔 과제의 설정 변경 (본인 과제만)
   body: { id, open?: 0|1, title?: "새 과제명", dueAt?: unix초 | null, classId?: 수업id | null }
   2026-09-08: 예전에는 마감 스위치(open)만 바꿀 수 있어서, 과제명을 잘못 적거나 제출기한을 바꾸려면
   과제를 지우고 다시 만들어야 했다(제출물까지 함께 사라짐). 이제 보낸 항목만 골라서 수정한다 —
   예전처럼 { id, open }만 보내면 마감 스위치만 바뀌므로 기존 화면도 그대로 동작한다. */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  await ensureAssignmentSchema(env);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const id = Number(body && body.id);
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const current = await env.DB.prepare(
    "SELECT id, title, due_at, open, class_id, type FROM assignments WHERE id = ? AND prof_id = ?"
  ).bind(id, auth.user.id).first();
  if (!current) return jsonResponse({ error: "과제를 찾을 수 없습니다." }, 404);

  const sets = [], binds = [];

  if (Object.prototype.hasOwnProperty.call(body, "open")) {
    sets.push("open = ?"); binds.push(body.open ? 1 : 0);
  }

  if (Object.prototype.hasOwnProperty.call(body, "title")) {
    const title = String(body.title || "").trim();
    if (!title) return jsonResponse({ error: "과제명을 입력해주세요." }, 400);
    sets.push("title = ?"); binds.push(title.slice(0, 200));
  }

  if (Object.prototype.hasOwnProperty.call(body, "dueAt")) {
    // null 또는 빈 값이면 "제출기한 없음"으로 지운다
    const dueAt = (body.dueAt === null || body.dueAt === "" || typeof body.dueAt === "undefined")
      ? null : Number(body.dueAt);
    if (dueAt !== null && !Number.isFinite(dueAt)) return jsonResponse({ error: "제출기한이 올바르지 않습니다." }, 400);
    sets.push("due_at = ?"); binds.push(dueAt);
  }

  // 과제를 다른 수업으로 옮기기(또는 "수업 미지정"으로 빼기) — 내 수업인지 확인한 뒤에만 허용
  if (Object.prototype.hasOwnProperty.call(body, "classId")) {
    let classId = (body.classId === null || body.classId === "" || body.classId === "none") ? null : Number(body.classId);
    if (classId !== null) {
      if (!classId) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
      const cls = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND prof_id = ?").bind(classId, auth.user.id).first();
      if (!cls) return jsonResponse({ error: "수업을 찾을 수 없습니다." }, 404);
    }
    sets.push("class_id = ?"); binds.push(classId);
  }

  /* 2026-09-12: 과제 종류 — 빈 값/null이면 "종류 미지정"(모든 종류 제출 가능)으로 되돌린다 */
  if (Object.prototype.hasOwnProperty.call(body, "type")) {
    const t = (body.type === null || body.type === "" || body.type === "none") ? null : String(body.type);
    if (t !== null && !VALID_TYPES.includes(t)) return jsonResponse({ error: "과제 종류가 올바르지 않습니다." }, 400);
    sets.push("type = ?"); binds.push(t);
  }

  if (!sets.length) return jsonResponse({ error: "변경할 내용이 없습니다." }, 400);

  binds.push(id, auth.user.id);
  await env.DB.prepare(
    "UPDATE assignments SET " + sets.join(", ") + " WHERE id = ? AND prof_id = ?"
  ).bind(...binds).run();

  const updated = await env.DB.prepare(
    "SELECT id, title, due_at, open, class_id, type FROM assignments WHERE id = ? AND prof_id = ?"
  ).bind(id, auth.user.id).first();

  return jsonResponse({ ok: true, assignment: updated, open: updated ? updated.open : null });
}
