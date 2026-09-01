import { requireAuth, jsonResponse, nowSec } from "./_utils.js";

/* POST /api/student-join — 학생이 6자리 코드를 입력해 등록(여러 개 가능).
   2026-08-20: 기존엔 코드를 입력하면 기존 그룹을 대체했지만, 이제는 student_professors 표에
   추가로 쌓여 여러 교수를 동시에 등록할 수 있다. users.prof_id는 "기본 선택 교수"로만 남아있고
   (첫 등록 시 자동 지정), 실제 과제 조회/제출은 항상 student_professors 등록 여부로 확인한다.
   2026-09-01: 코드가 classes.code(수업별 코드)와 먼저 일치하는지 확인한다 — 일치하면 그 교수를
   등록(student_professors, 이미 등록돼 있으면 건너뜀)함과 동시에 해당 수업의 class_students에도
   바로 배정한다. 일치하지 않으면 기존처럼 교수 전체 코드(users.prof_code)로 처리한다. */
export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const code = ((body && body.code) || "").trim();
  if (!/^\d{6}$/.test(code)) return jsonResponse({ error: "6자리 숫자 코드를 입력해주세요." }, 400);

  const now = nowSec();
  let prof = null;
  let joinedClass = null;

  const cls = await env.DB.prepare(
    "SELECT cl.id AS class_id, cl.name AS class_name, u.id, u.name, u.school " +
    "FROM classes cl JOIN users u ON u.id = cl.prof_id WHERE cl.code = ?"
  ).bind(code).first();

  if (cls) {
    if (cls.id === auth.user.id) return jsonResponse({ error: "본인의 코드는 입력할 수 없습니다." }, 400);
    prof = { id: cls.id, name: cls.name, school: cls.school };
    joinedClass = { id: cls.class_id, name: cls.class_name };
  } else {
    const p = await env.DB.prepare(
      "SELECT id, name, school FROM users WHERE prof_code = ? AND role = 'professor'"
    ).bind(code).first();
    if (!p) return jsonResponse({ error: "일치하는 코드를 찾을 수 없습니다." }, 404);
    if (p.id === auth.user.id) return jsonResponse({ error: "본인의 코드는 입력할 수 없습니다." }, 400);
    prof = p;
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM student_professors WHERE student_id = ? AND prof_id = ?"
  ).bind(auth.user.id, prof.id).first();
  if (!existing) {
    await env.DB.prepare(
      "INSERT INTO student_professors (student_id, prof_id, joined_at) VALUES (?, ?, ?)"
    ).bind(auth.user.id, prof.id, now).run();
  } else if (!joinedClass) {
    return jsonResponse({ error: "이미 등록된 교수입니다." }, 400);
  }

  if (joinedClass) {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO class_students (class_id, student_id, added_at) VALUES (?, ?, ?)"
    ).bind(joinedClass.id, auth.user.id, now).run();
  }

  // 처음 등록하는 교수라면(기본 선택이 아직 없다면) 기본 선택 교수로도 지정 — 구버전 화면 호환용
  if (!auth.user.profId) {
    await env.DB.prepare("UPDATE users SET prof_id = ? WHERE id = ?").bind(prof.id, auth.user.id).run();
  }

  const { results } = await env.DB.prepare(
    "SELECT u.id, u.name, u.school FROM student_professors sp JOIN users u ON u.id = sp.prof_id " +
    "WHERE sp.student_id = ? ORDER BY u.name"
  ).bind(auth.user.id).all();

  return jsonResponse({ ok: true, prof: { id: prof.id, name: prof.name, school: prof.school }, class: joinedClass, professors: results || [] });
}
