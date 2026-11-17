import { requireProfessor, jsonResponse, nowSec, ensureAssignmentSchema } from "./_utils.js";

/* 과제 종류 — 학생이 그 종류의 탭에서만 제출할 수 있게 제한하는 값. null이면 종류 미지정(모두 허용) */
const VALID_TYPES = ["plan", "plot", "write", "character", "background", "event", "storyboard", "file", "practice"];

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
      "SELECT a.id, a.title, a.due_at, a.open, a.created_at, a.class_id, a.type, a.max_score, " + countCol + tail
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

/* POST /api/professor-assignments — 새 과제 등록  body: { title, dueAt, classIds | classId, type, maxScore }
   (dueAt: unix seconds 또는 null, classIds: 과제를 만들 수업 id 배열 — 수업마다 별도 과제가 생긴다,
    null 원소/classId null은 수업 미지정. 응답 assignments = 만든 과제들, assignment = 첫 번째) */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  await ensureAssignmentSchema(env);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const title = ((body && body.title) || "").trim();
  const type = (body && body.type && VALID_TYPES.includes(body.type)) ? body.type : null;
  const dueAt = (body && Number.isFinite(body.dueAt)) ? body.dueAt : null;
  /* 2026-09-22: 배점(몇 점짜리 과제인지) — 비워두면 NULL = 배점 없음 */
  const maxScore = (body && body.maxScore !== null && body.maxScore !== "" && Number.isFinite(Number(body.maxScore)))
    ? Number(body.maxScore) : null;
  if (!title) return jsonResponse({ error: "과제명을 입력해주세요." }, 400);

  /* 2026-11-17: classIds 배열이면 같은 설정의 과제 폴더를 수업마다 "따로" 하나씩 만든다(합치지 않음 —
     제출함·마감·설정 변경이 수업별로 독립). null 원소는 수업 미지정(전체 공개) 과제. 예전 형식 classId 하나도 받는다. */
  let want;
  if (body && Array.isArray(body.classIds)) want = body.classIds;
  else want = [body && body.classId != null ? body.classId : null];
  const seen = new Set();
  const classIds = [];
  for (const raw of want.slice(0, 50)) {
    const cid = raw == null || raw === "none" ? null : Number(raw);
    if (cid !== null && !cid) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
    const k = cid === null ? "none" : cid;
    if (seen.has(k)) continue;
    seen.add(k);
    classIds.push(cid);
  }
  if (!classIds.length) return jsonResponse({ error: "과제를 만들 수업을 하나 이상 골라주세요." }, 400);
  const realIds = classIds.filter((c) => c !== null);
  if (realIds.length) {
    const { results: mine } = await env.DB.prepare(
      "SELECT id FROM classes WHERE prof_id = ? AND id IN (" + realIds.map(() => "?").join(",") + ")"
    ).bind(auth.user.id, ...realIds).all();
    if ((mine || []).length !== realIds.length) return jsonResponse({ error: "수업을 찾을 수 없습니다." }, 404);
  }

  const created = nowSec();
  const assignments = [];
  for (const classId of classIds) {
    /* max_score는 나중에 추가된 컬럼 — 없는 DB에서도 과제 등록 자체는 되어야 하므로 2단계로 시도한다 */
    let result;
    try {
      result = await env.DB.prepare(
        "INSERT INTO assignments (prof_id, title, due_at, open, class_id, type, max_score, created_at) VALUES (?, ?, ?, 1, ?, ?, ?, ?)"
      ).bind(auth.user.id, title, dueAt, classId, type, maxScore, created).run();
    } catch (e) {
      result = await env.DB.prepare(
        "INSERT INTO assignments (prof_id, title, due_at, open, class_id, type, created_at) VALUES (?, ?, ?, 1, ?, ?, ?)"
      ).bind(auth.user.id, title, dueAt, classId, type, created).run();
    }
    assignments.push({ id: result.meta.last_row_id, title, due_at: dueAt, open: 1, class_id: classId, type, max_score: maxScore, created_at: created, submission_count: 0 });
  }

  return jsonResponse({ ok: true, assignment: assignments[0], assignments });
}
