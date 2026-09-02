import { verifyPassword, makeToken, jsonResponse, nowSec, checkRateLimit, clientIp } from "./_utils.js";

const SESSION_DAYS = 7; // 2026-08-21: 토큰 탈취 시 재사용 가능 기간을 줄이기 위해 30일→7일로 단축
/* 무차별 대입 방지(2026-08-20 보안 점검 후 추가): 같은 IP에서 같은 아이디로 15분 안에 10회 넘게
   틀리면 잠깐 막는다. 성공/실패와 무관하게 "시도" 자체를 센다 — 실패만 세면 공격자가 성공 직전에
   카운트를 리셋시키는 걸 막기 어렵기 때문. 정상적으로 쓰는 학생/교수는 15분에 10번 넘게 틀릴 일이
   거의 없으므로 실사용에는 영향이 없다. */
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }

  const username = (body.username || "").trim();
  const password = body.password || "";
  if (!username || !password) return jsonResponse({ error: "아이디와 비밀번호를 입력해주세요." }, 400);

  const rl = await checkRateLimit(env, `login:${clientIp(request)}:${username}`, 10, 15 * 60);
  if (!rl.allowed) {
    return jsonResponse({ error: `너무 많이 시도했습니다. ${Math.ceil(rl.retryAfterSec / 60)}분 후 다시 시도해주세요.` }, 429);
  }

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
    user: { username: user.username, name: user.name, school: user.school, email: user.email,
      role: user.role || "student", profId: user.prof_id || null },
  });
}
