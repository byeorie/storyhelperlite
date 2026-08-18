import { hashPassword, makeToken, jsonResponse, nowSec } from "./_utils.js";

const SESSION_DAYS = 30;

/* 교수 계정에 부여할 6자리 숫자 코드 — 학생이 이 코드를 입력해 교수 그룹에 가입한다.
   DB 전체에서 겹치지 않을 때까지 새로 뽑는다(최대 20회 시도) */
async function generateProfCode(env) {
  for (let i = 0; i < 20; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const dup = await env.DB.prepare("SELECT id FROM users WHERE prof_code = ?").bind(code).first();
    if (!dup) return code;
  }
  throw new Error("교수 코드 생성에 실패했습니다.");
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }

  const school = (body.school || "").trim();
  const name = (body.name || "").trim();
  const username = (body.username || "").trim();
  const password = body.password || "";
  const email = (body.email || "").trim();
  const role = body.role === "professor" ? "professor" : "student";

  if (!school || !name || !username || !password || !email) {
    return jsonResponse({ error: "모든 항목을 입력해주세요." }, 400);
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
  const profCode = role === "professor" ? await generateProfCode(env) : null;
  const result = await env.DB.prepare(
    "INSERT INTO users (school, name, username, password_hash, password_salt, email, created_at, role, prof_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(school, name, username, hash, salt, email, created, role, profCode).run();

  const userId = result.meta.last_row_id;
  const token = await makeToken();
  const expires = created + 60 * 60 * 24 * SESSION_DAYS;
  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).bind(token, userId, created, expires).run();

  return jsonResponse({ token, user: { username, name, school, email, role, profCode: profCode || "", profId: null } });
}
