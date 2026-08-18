import { jsonResponse, nowSec, hashPassword } from "./_utils.js";

/* POST /api/reset-password — 이메일로 받은 링크의 토큰 + 새 비밀번호로 실제 비밀번호 변경 */
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }

  const token = (body.token || "").trim();
  const newPassword = body.newPassword || "";
  if (!token) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  if (newPassword.length < 6) return jsonResponse({ error: "비밀번호는 6자 이상이어야 합니다." }, 400);

  const row = await env.DB.prepare(
    "SELECT user_id, expires_at, used FROM password_resets WHERE token = ?"
  ).bind(token).first();
  if (!row) return jsonResponse({ error: "유효하지 않은 링크입니다." }, 400);
  if (row.used) return jsonResponse({ error: "이미 사용된 링크입니다. 비밀번호 찾기를 다시 요청해주세요." }, 400);
  if (row.expires_at < nowSec()) return jsonResponse({ error: "링크가 만료되었습니다. 비밀번호 찾기를 다시 요청해주세요." }, 400);

  const { hash, salt } = await hashPassword(newPassword);
  await env.DB.prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?")
    .bind(hash, salt, row.user_id).run();
  await env.DB.prepare("UPDATE password_resets SET used = 1 WHERE token = ?").bind(token).run();
  // 보안: 비밀번호가 바뀌었으니 기존 로그인 세션은 모두 무효화
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(row.user_id).run();

  return jsonResponse({ ok: true });
}
