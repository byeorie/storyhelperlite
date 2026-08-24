import { requireProfessor, jsonResponse } from "./_utils.js";

/* GET /api/professor-class?id=123 — 수업 상세: 수강생 명단 + 추가 가능한(내 코드로 등록됐지만
   아직 이 수업에는 배정되지 않은) 학생 명단을 함께 내려준다 (수강생 추가 화면에서 바로 사용) */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const cls = await env.DB.prepare(
    "SELECT id, name, created_at FROM classes WHERE id = ? AND prof_id = ?"
  ).bind(id, auth.user.id).first();
  if (!cls) return jsonResponse({ error: "수업을 찾을 수 없습니다." }, 404);

  const { results: enrolled } = await env.DB.prepare(
    "SELECT u.id, u.school, u.name, u.username, u.email, cs.added_at " +
    "FROM class_students cs JOIN users u ON u.id = cs.student_id " +
    "WHERE cs.class_id = ? ORDER BY u.name"
  ).bind(id).all();

  const { results: available } = await env.DB.prepare(
    "SELECT u.id, u.school, u.name, u.username, u.email " +
    "FROM student_professors sp JOIN users u ON u.id = sp.student_id " +
    "WHERE sp.prof_id = ? AND u.id NOT IN (SELECT student_id FROM class_students WHERE class_id = ?) " +
    "ORDER BY u.name"
  ).bind(auth.user.id, id).all();

  return jsonResponse({ class: cls, enrolled: enrolled || [], available: available || [] });
}

/* POST /api/professor-class — 수업 이름 변경  body: { id, name } */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const id = Number(body && body.id);
  const name = ((body && body.name) || "").trim().slice(0, 100);
  if (!id || !name) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const result = await env.DB.prepare(
    "UPDATE classes SET name = ? WHERE id = ? AND prof_id = ?"
  ).bind(name, id, auth.user.id).run();
  if (!result.meta.changes) return jsonResponse({ error: "수업을 찾을 수 없습니다." }, 404);

  return jsonResponse({ ok: true, id, name });
}

/* DELETE /api/professor-class?id=123 — 수업 삭제 (수강생 배정·과제·제출물도 함께 영구 삭제,
   학생 계정 자체는 그대로 남고 다른 수업/교수 등록에는 영향 없음) */
export async function onRequestDelete({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const cls = await env.DB.prepare(
    "SELECT id FROM classes WHERE id = ? AND prof_id = ?"
  ).bind(id, auth.user.id).first();
  if (!cls) return jsonResponse({ error: "수업을 찾을 수 없습니다." }, 404);

  const { results: assigns } = await env.DB.prepare("SELECT id FROM assignments WHERE class_id = ?").bind(id).all();
  for (const a of (assigns || [])) {
    await env.DB.prepare(
      "DELETE FROM submission_feedback_versions WHERE submission_id IN (SELECT id FROM submissions WHERE assignment_id = ?)"
    ).bind(a.id).run();
    await env.DB.prepare("DELETE FROM submissions WHERE assignment_id = ?").bind(a.id).run();
  }
  await env.DB.prepare("DELETE FROM assignments WHERE class_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM class_students WHERE class_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM classes WHERE id = ? AND prof_id = ?").bind(id, auth.user.id).run();

  return jsonResponse({ ok: true });
}
