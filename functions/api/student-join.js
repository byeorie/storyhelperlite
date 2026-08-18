import { requireAuth, jsonResponse } from "./_utils.js";

/* POST /api/student-join — 학생이 교수의 6자리 코드를 입력해 그 교수 그룹에 가입 */
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

  await env.DB.prepare("UPDATE users SET prof_id = ? WHERE id = ?").bind(prof.id, auth.user.id).run();

  return jsonResponse({ ok: true, prof: { id: prof.id, name: prof.name, school: prof.school } });
}
