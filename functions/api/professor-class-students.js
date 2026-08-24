import { requireProfessor, jsonResponse, nowSec } from "./_utils.js";

/* POST /api/professor-class-students — 수강생 일괄 추가  body: { classId, studentIds:[...] }
   (내 코드로 이미 등록된(student_professors) 학생만 추가할 수 있다 — 그 외 id는 조용히 건너뜀) */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const classId = Number(body && body.classId);
  const studentIds = Array.isArray(body && body.studentIds) ? body.studentIds.map(Number).filter(Boolean) : [];
  if (!classId || !studentIds.length) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const cls = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND prof_id = ?").bind(classId, auth.user.id).first();
  if (!cls) return jsonResponse({ error: "수업을 찾을 수 없습니다." }, 404);

  const now = nowSec();
  let added = 0;
  for (const sid of studentIds) {
    const member = await env.DB.prepare(
      "SELECT id FROM student_professors WHERE student_id = ? AND prof_id = ?"
    ).bind(sid, auth.user.id).first();
    if (!member) continue; // 내 코드로 등록한 학생이 아니면 건너뜀
    const result = await env.DB.prepare(
      "INSERT OR IGNORE INTO class_students (class_id, student_id, added_at) VALUES (?, ?, ?)"
    ).bind(classId, sid, now).run();
    if (result.meta.changes) added++;
  }

  return jsonResponse({ ok: true, added });
}

/* DELETE /api/professor-class-students?classId=1&studentId=2 — 수강생 한 명을 이 수업에서 제외
   (학생 계정 자체·다른 수업 배정·교수 등록에는 영향 없음) */
export async function onRequestDelete({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  const url = new URL(request.url);
  const classId = Number(url.searchParams.get("classId"));
  const studentId = Number(url.searchParams.get("studentId"));
  if (!classId || !studentId) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const cls = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND prof_id = ?").bind(classId, auth.user.id).first();
  if (!cls) return jsonResponse({ error: "수업을 찾을 수 없습니다." }, 404);

  await env.DB.prepare("DELETE FROM class_students WHERE class_id = ? AND student_id = ?").bind(classId, studentId).run();

  return jsonResponse({ ok: true });
}
