import { requireProfessor, jsonResponse, nowSec, ensureAssignmentSchema } from "./_utils.js";

/* 과제 종류 — 학생이 그 종류의 탭에서만 제출할 수 있게 제한하는 값. null이면 종류 미지정(모두 허용) */
const VALID_TYPES = ["plan", "plot", "write", "character", "background", "event", "storyboard"];

/* GET /api/professor-assignments[?classId=...] — 내가 등록한 과제 목록(+제출 수)
   2026-08-24: 수업(class) 도입 후 classId로 스코프를 좁힐 수 있다.
   classId="none" → 수업 미지정 과제만, classId=숫자 → 그 수업 과제만, 생략 시 전체(하위 호환용). */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  await ensureAssignmentSchema(env);

  const url = new URL(request.url);
  const classIdParam = url.searchParams.get("classId");
  let where = "a.prof_id = ?";
  const binds = [auth.user.id];
  if (classIdParam === "none") {
    where += " AND a.class_id IS NULL";
  } else if (classIdParam) {
    const cid = Number(classIdParam);
    if (!cid) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
    where += " AND a.class_id = ?";
    binds.push(cid);
  }

  const countCol = "  (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) AS submission_count ";
  const tail = "FROM assignments a WHERE " + where + " ORDER BY a.created_at DESC";
  let results = [];
  try {
    const r = await env.DB.prepare(
      "SELECT a.id, a.title, a.due_at, a.open, a.created_at, a.class_id, a.type, " + countCol + tail
    ).bind(...binds).all();
    results = r.results || [];
  } catch (e) {
    // a.type은 나중에 추가된 컬럼 — 없는 DB에서도 목록은 열려야 한다
    const r = await env.DB.prepare(
      "SELECT a.id, a.title, a.due_at, a.open, a.created_at, a.class_id, " + countCol + tail
    ).bind(...binds).all();
    results = r.results || [];
  }

  return jsonResponse({ assignments: results });
}

/* POST /api/professor-assignments — 새 과제 등록  body: { title, dueAt, classId }
   (dueAt: unix seconds 또는 null, classId: 특정 수업에 속하면 그 수업 id, 수업 미지정이면 null) */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  await ensureAssignmentSchema(env);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const title = ((body && body.title) || "").trim();
  const type = (body && body.type && VALID_TYPES.includes(body.type)) ? body.type : null;
  const dueAt = (body && Number.isFinite(body.dueAt)) ? body.dueAt : null;
  if (!title) return jsonResponse({ error: "과제명을 입력해주세요." }, 400);

  let classId = null;
  if (body && body.classId != null) {
    classId = Number(body.classId);
    if (!classId) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
    const cls = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND prof_id = ?").bind(classId, auth.user.id).first();
    if (!cls) return jsonResponse({ error: "수업을 찾을 수 없습니다." }, 404);
  }

  const created = nowSec();
  const result = await env.DB.prepare(
    "INSERT INTO assignments (prof_id, title, due_at, open, class_id, type, created_at) VALUES (?, ?, ?, 1, ?, ?, ?)"
  ).bind(auth.user.id, title, dueAt, classId, type, created).run();

  return jsonResponse({ ok: true, assignment: { id: result.meta.last_row_id, title, due_at: dueAt, open: 1, class_id: classId, type, created_at: created, submission_count: 0 } });
}
