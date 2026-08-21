import { requireAuth, jsonResponse } from "./_utils.js";

/* POST /api/update-profile — 로그인한 계정의 개인정보(학교/이름/이메일) 수정.
   아이디(username)는 로그인 식별자이고 다른 여러 테이블에서 참조되므로 여기서는 바꾸지 않는다
   (비밀번호는 request-password-change.js로 이메일을 통해 별도로 변경). */
export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const school = (body.school || "").trim().slice(0, 60);
  const name = (body.name || "").trim().slice(0, 60);
  const email = (body.email || "").trim();
  if (!school || !name || !email) return jsonResponse({ error: "모든 항목을 입력해주세요." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse({ error: "올바른 이메일 형식이 아닙니다." }, 400);

  await env.DB.prepare("UPDATE users SET school = ?, name = ?, email = ? WHERE id = ?")
    .bind(school, name, email, auth.user.id).run();

  return jsonResponse({
    ok: true,
    user: {
      username: auth.user.username, name, school, email,
      role: auth.user.role, profCode: auth.user.profCode, profId: auth.user.profId,
    },
  });
}
