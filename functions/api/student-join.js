import { requireAuth, jsonResponse, nowSec } from "./_utils.js";

/* POST /api/student-join — 학생이 교수의 6자리 코드를 입력해 그 교수를 등록(여러 명 가능).
   2026-08-20: 기존엔 코드를 입력하면 기존 그룹을 대체했지만, 이제는 student_professors 표에
   추가로 쌓여 여러 교수를 동시에 등록할 수 있다. users.prof_id는 "기본 선택 교수"로만 남아있고
   (첫 등록 시 자동 지정), 실제 과제 조회/제출은 항상 student_professors 등록 여부로 확인한다. */
export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const code = ((body && body.code) || "").trim();
  if (!/^\d{6}$/.test(code)) return jsonResponse({ error: "6자리 숫자 코드를 입력해주세요." }, 400);

  const prof = await env.DB.prepare(
    "SELECT id, name, school FROM users WHERE prof_code = ? AND role = 'professor'"
  ).bind(code).first();
  if (!prof) return jsonResponse({ error: "일치하는 교수 코드를 찾을 수 없습니다." }, 404);
  if (prof.id === auth.user.id) return jsonResponse({ error: "본인의 코드는 입력할 수 없습니다." }, 400);

  const existing = await env.DB.prepare(
    "SELECT id FROM student_professors WHERE student_id = ? AND prof_id = ?"
  ).bind(auth.user.id, prof.id).first();
  if (existing) return jsonResponse({ error: "이미 등록된 교수입니다." }, 400);

  const now = nowSec();
  await env.DB.prepare(
    "INSERT INTO student_professors (student_id, prof_id, joined_at) VALUES (?, ?, ?)"
  ).bind(auth.user.id, prof.id, now).run();

  // 처음 등록하는 교수라면(기본 선택이 아직 없다면) 기본 선택 교수로도 지정 — 구버전 화면 호환용
  if (!auth.user.profId) {
    await env.DB.prepare("UPDATE users SET prof_id = ? WHERE id = ?").bind(prof.id, auth.user.id).run();
  }

  const { results } = await env.DB.prepare(
    "SELECT u.id, u.name, u.school FROM student_professors sp JOIN users u ON u.id = sp.prof_id " +
    "WHERE sp.student_id = ? ORDER BY u.name"
  ).bind(auth.user.id).all();

  return jsonResponse({ ok: true, prof: { id: prof.id, name: prof.name, school: prof.school }, professors: results || [] });
}
