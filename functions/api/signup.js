import { hashPassword, makeToken, jsonResponse, nowSec } from "./_utils.js";

const SESSION_DAYS = 7; // 2026-08-21: 토큰 탈취 시 재사용 가능 기간을 줄이기 위해 30일→7일로 단축
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

  // (2026-09-03) IP당 가입 횟수 제한(2026-08-20 추가, 이후 60→100건으로 완화)을 완전히 제거함 — 학교
  // 와이파이처럼 여러 학생이 같은 공인 IP를 쓰는 환경에서 반 인원이 몰리면 계속 걸릴 수 있어서, 사용자
  // 요청으로 이 제한 자체를 없앰. 가입 자체는 여전히 비밀번호 길이·아이디 형식·이메일 형식 검증과
  // "아이디 중복 불가"로 최소한의 방어는 되어 있음.
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
    "INSERT INTO users (school, name, username, password_hash, password_salt, email, created_at, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(school, name, username, hash, salt, email, created, role).run();

  const userId = result.meta.last_row_id;
  const token = await makeToken();
  const expires = created + 60 * 60 * 24 * SESSION_DAYS;
  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).bind(token, userId, created, expires).run();

  return jsonResponse({ token, user: { username, name, school, email, role, profId: null } });
}
