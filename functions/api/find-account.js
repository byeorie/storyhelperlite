import { jsonResponse, nowSec, makeToken, sendEmail } from "./_utils.js";

const RESET_EXPIRE_MIN = 30;

/* POST /api/find-account — 가입 이메일 입력 → 아이디 안내 + 비밀번호 재설정 링크 메일 발송 */
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }

  const email = (body.email || "").trim();
  if (!email) return jsonResponse({ error: "이메일을 입력해주세요." }, 400);

  const user = await env.DB.prepare("SELECT id, username FROM users WHERE email = ?").bind(email).first();
  if (!user) {
    return jsonResponse({ message: "해당 이메일로 등록된 계정을 찾을 수 없습니다." });
  }

  const token = await makeToken();
  const now = nowSec();
  const expires = now + RESET_EXPIRE_MIN * 60;
  await env.DB.prepare(
    "INSERT INTO password_resets (token, user_id, created_at, expires_at, used) VALUES (?, ?, ?, ?, 0)"
  ).bind(token, user.id, now, expires).run();

  const origin = new URL(request.url).origin;
  const resetUrl = `${origin}/?reset=${token}`;
  const text =
    `안녕하세요, ${user.username} 님.\n\n` +
    `글쓰기도우미 계정의 아이디는 "${user.username}" 입니다.\n\n` +
    `아래 링크에서 새 비밀번호를 설정할 수 있습니다. (${RESET_EXPIRE_MIN}분간 유효, 1회만 사용 가능)\n${resetUrl}\n\n` +
    `본인이 요청하지 않았다면 이 메일은 무시하셔도 됩니다.`;

  try {
    await sendEmail(env, { to: email, subject: "[글쓰기도우미] 아이디 안내 및 비밀번호 재설정", text });
  } catch (e) {
    return jsonResponse({ error: "메일 발송에 실패했습니다: " + e.message }, 500);
  }

  return jsonResponse({
    message: "입력하신 이메일로 아이디 안내와 비밀번호 재설정 링크를 보내드렸습니다. 메일함(스팸함도 확인)을 확인해주세요.",
  });
}
