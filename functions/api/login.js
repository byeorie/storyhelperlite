import { verifyPassword, makeToken, jsonResponse, nowSec } from "./_utils.js";

const SESSION_DAYS = 30;

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }

  const username = (body.username || "").trim();
  const password = body.password || "";
  if (!username || !password) return jsonResponse({ error: "아이디와 비밀번호를 입력해주세요." }, 400);

  const user = await env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
  if (!user) return jsonResponse({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, 401);

  const ok = await verifyPassword(password, user.password_hash, user.password_salt);
  if (!ok) return jsonResponse({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, 401);

  const now = nowSec();
  const token = await makeToken();
  const expires = now + 60 * 60 * 24 * SESSION_DAYS;
  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).bind(token, user.id, now, expires).run();

  return jsonResponse({
    token,
    user: { username: user.username, name: user.name, school: user.school, email: user.email },
  });
}
