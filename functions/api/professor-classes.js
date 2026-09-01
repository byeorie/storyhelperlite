import { requireProfessor, jsonResponse, nowSec } from "./_utils.js";

/* GET /api/professor-classes — 내 수업 목록(+수강생 수·과제 수) + 수업 미지정 과제 수
   2026-08-24: 교수가 여러 과목을 진행할 때 학생을 수업별로 나눌 수 있도록 "수업" 개념을 새로 도입.
   과거부터 있던 과제(class_id NULL)는 계속 모든 등록 학생에게 공개되는 "수업 미지정" 과제로 남는다. */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  const { results } = await env.DB.prepare(
    "SELECT cl.id, cl.name, cl.code, cl.created_at, " +
    "  (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = cl.id) AS student_count, " +
    "  (SELECT COUNT(*) FROM assignments a WHERE a.class_id = cl.id) AS assignment_count " +
    "FROM classes cl WHERE cl.prof_id = ? ORDER BY cl.created_at DESC"
  ).bind(auth.user.id).all();

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

/* POST /api/professor-classes — 새 수업 만들기  body: { name }
   2026-09-01: 학생이 이 수업에 바로 등록할 수 있도록 수업마다 6자리 코드를 함께 발급한다
   (기존 교수 전체 코드(users.prof_code)는 그대로 두고, 수업 코드는 추가 등록 경로). */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const name = ((body && body.name) || "").trim().slice(0, 100);
  if (!name) return jsonResponse({ error: "수업명을 입력해주세요." }, 400);

  const created = nowSec();
  const code = await generateClassCode(env);
  const result = await env.DB.prepare(
    "INSERT INTO classes (prof_id, name, code, created_at) VALUES (?, ?, ?, ?)"
  ).bind(auth.user.id, name, code, created).run();

  return jsonResponse({ ok: true, class: { id: result.meta.last_row_id, name, code, created_at: created } });
}
