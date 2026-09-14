import { requireProfessor, jsonResponse, nowSec, ensureClassSchema } from "./_utils.js";

/* GET /api/professor-classes — 내 수업 목록(+수강생 수·과제 수) + 수업 미지정 과제 수
   2026-08-24: 교수가 여러 과목을 진행할 때 학생을 수업별로 나눌 수 있도록 "수업" 개념을 새로 도입.
   과거부터 있던 과제(class_id NULL)는 계속 모든 등록 학생에게 공개되는 "수업 미지정" 과제로 남는다. */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  await ensureClassSchema(env);
  /* 2026-09-14: 교수가 직접 정한 순서(sort_order)가 먼저, 아직 순서를 정하지 않은 수업은 뒤에 최신순.
     혹시 sort_order 컬럼이 없는 DB에서도 목록이 통째로 500이 되지 않도록 예전 정렬로 되돌린다. */
  const COLS =
    "SELECT cl.id, cl.name, cl.code, cl.created_at, cl.school_name, cl.section, cl.class_day, cl.class_time, " +
    "  (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = cl.id) AS student_count, " +
    "  (SELECT COUNT(*) FROM assignments a WHERE a.class_id = cl.id) AS assignment_count " +
    "FROM classes cl WHERE cl.prof_id = ? ";
  let results;
  try {
    ({ results } = await env.DB.prepare(
      COLS + "ORDER BY CASE WHEN cl.sort_order IS NULL THEN 1 ELSE 0 END, cl.sort_order ASC, cl.created_at DESC"
    ).bind(auth.user.id).all());
  } catch (e) {
    ({ results } = await env.DB.prepare(COLS + "ORDER BY cl.created_at DESC").bind(auth.user.id).all());
  }

  const unassigned = await env.DB.prepare(
    "SELECT COUNT(*) AS c FROM assignments WHERE prof_id = ? AND class_id IS NULL"
  ).bind(auth.user.id).first();

  return jsonResponse({ classes: results || [], unassignedCount: (unassigned && unassigned.c) || 0 });
}

/* 6자리 숫자 수업 코드를 생성 — classes.code는 UNIQUE라서 겹치면 다시 뽑는다(최대 20회). */
async function generateClassCode(env) {
  for (let i = 0; i < 20; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const dup = await env.DB.prepare("SELECT id FROM classes WHERE code = ?").bind(code).first();
    if (!dup) return code;
  }
  return String(Date.now()).slice(-6);
}

/* POST /api/professor-classes — 새 수업 만들기  body: { name, school, section, day, time }
   2026-09-01: 학생이 이 수업에 바로 등록할 수 있도록 수업마다 6자리 코드를 함께 발급한다.
   (같은 날 추가) 교수 전체 코드(users.prof_code) 등록은 폐지 — 학생 등록은 이제 이 수업 코드로만 받는다.
   2026-09-01 (2): 수업명과 별개로 학교이름/분반/요일/시간을 함께 입력할 수 있게 함(모두 선택 입력). */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const name = ((body && body.name) || "").trim().slice(0, 100);
  if (!name) return jsonResponse({ error: "수업명을 입력해주세요." }, 400);
  const school = ((body && body.school) || "").trim().slice(0, 100) || null;
  const section = ((body && body.section) || "").trim().slice(0, 50) || null;
  const day = ((body && body.day) || "").trim().slice(0, 20) || null;
  const time = ((body && body.time) || "").trim().slice(0, 50) || null;

  const created = nowSec();
  const code = await generateClassCode(env);
  const result = await env.DB.prepare(
    "INSERT INTO classes (prof_id, name, code, created_at, school_name, section, class_day, class_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(auth.user.id, name, code, created, school, section, day, time).run();

  return jsonResponse({ ok: true, class: { id: result.meta.last_row_id, name, code, created_at: created, school_name: school, section, class_day: day, class_time: time } });
}

/* PUT /api/professor-classes — 수업 목록 순서 저장  body: { order: [수업id, ...] }
   2026-09-14: [수업 관리]에서 수업 카드를 끌어 순서를 바꿀 수 있게 하며 추가.
   화면에 보이는 순서 그대로 1,2,3… 을 classes.sort_order에 적는다(내 수업만 갱신). */
export async function onRequestPut({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);
  await ensureClassSchema(env);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const order = (body && Array.isArray(body.order)) ? body.order.map(Number).filter(n => n > 0) : [];
  if (!order.length) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  try {
    for (let i = 0; i < order.length; i++) {
      await env.DB.prepare("UPDATE classes SET sort_order = ? WHERE id = ? AND prof_id = ?")
        .bind(i + 1, order[i], auth.user.id).run();
    }
  } catch (e) {
    return jsonResponse({ error: "순서를 저장하지 못했습니다." }, 500);
  }
  return jsonResponse({ ok: true });
}
