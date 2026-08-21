import { hashPassword, makeToken, jsonResponse, nowSec, checkRateLimit, clientIp } from "./_utils.js";

const SESSION_DAYS = 30;
const MAX_FIELD_LEN = 60; // 학교/이름이 비정상적으로 긴 문자열이 되는 걸 막는 보수적인 상한

/* 가입은 항상 학생으로만 생성된다. 교수 등급은 관리자가 회원 관리 화면에서
   setRole(functions/api/admin.js)로 바꿀 때만 부여된다 — 요청 본문에 role이 와도 무시한다. */
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }

  const school = (body.school || "").trim().slice(0, MAX_FIELD_LEN);
  const name = (body.name || "").trim().slice(0, MAX_FIELD_LEN);
  const username = (body.username || "").trim();
  const password = body.password || "";
  const email = (body.email || "").trim();
  const role = "student";

  if (!school || !name || !username || !password || !email) {
    return jsonResponse({ error: "모든 항목을 입력해주세요." }, 400);
  }

  // 무차별 가입/스팸 방지(2026-08-20 보안 점검 후 추가): 같은 IP에서 1시간에 10건 넘게 가입 못 하게 제한
  const rl = await checkRateLimit(env, `signup:${clientIp(request)}`, 10, 60 * 60);
  if (!rl.allowed) {
    return jsonResponse({ error: `너무 많이 시도했습니다. ${Math.ceil(rl.retryAfterSec / 60)}분 후 다시 시도해주세요.` }, 429);
  }
  if (password.length < 6) {
    return jsonResponse({ error: "비밀번호는 6자 이상이어야 합니다." }, 400);
  }
  if (!/^[A-Za-z0-9_.-]{3,32}$/.test(username)) {
    return jsonResponse({ error: "아이디는 3~32자의 영문/숫자/._- 만 사용할 수 있습니다." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "올바른 이메일 형식이 아닙니다." }, 400);
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
  if (existing) return jsonResponse({ error: "이미 사용 중인 아이디입니다." }, 409);

  const { hash, salt } = await hashPassword(password);
  const created = nowSec();
  const result = await env.DB.prepare(
    "INSERT INTO users (school, name, username, password_hash, password_salt, email, created_at, role, prof_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(school, name, username, hash, salt, email, created, role, null).run();

  const userId = result.meta.last_row_id;
  const token = await makeToken();
  const expires = created + 60 * 60 * 24 * SESSION_DAYS;
  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).bind(token, userId, created, expires).run();

  return jsonResponse({ token, user: { username, name, school, email, role, profCode: "", profId: null } });
}
