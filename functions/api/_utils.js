/* ===== 공용 유틸 (Cloudflare Pages Functions) ===== */

/* 관리자(서버 초기화/회원 관리) 권한을 가진 단일 계정의 아이디.
   app.js의 ADMIN_USERNAME과 반드시 같은 값으로 유지할 것 */
export const ADMIN_USERNAME = "byeorie";

export function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function nowSec() {
  return Math.floor(Date.now() / 1000);
}

/* 2026-08-20(2): 데이터 자동 삭제 방식을 "미접속 기간 기반 삭제"에서 "매년 3월 1일·9월 1일,
   두 고정 기준일에 계정(users) 정보만 남기고 나머지 서버 저장 데이터를 전부 초기화"로 변경.
   서버 용량을 일정하게 유지하려는 목적으로, 미접속 여부와 무관하게 기준일이 되면 무조건 지운다.
   Cloudflare Pages Functions에는 지정 시각에 저절로 실행되는 cron이 없어(요청이 들어올 때만
   코드가 실행됨), 대신 요청이 들어올 때마다 "지금 기준으로 가장 최근에 지난 기준일"을 계산하고,
   server_meta 표에 기록된 "마지막으로 초기화를 실행한 기준일"과 다르면 그때 한 번만 전체 삭제를
   실행한다(같은 반기 동안 여러 번 요청이 와도 중복 실행되지 않음). */
export function latestWipeBoundarySec(nowSecVal) {
  const now = new Date(nowSecVal * 1000);
  const y = now.getUTCFullYear();
  const boundaries = [
    Date.UTC(y - 1, 8, 1), // 작년 9/1 (월은 0-indexed → 8 = 9월)
    Date.UTC(y, 2, 1),     // 올해 3/1
    Date.UTC(y, 8, 1),     // 올해 9/1
  ];
  const passed = boundaries.filter((t) => t <= now.getTime());
  const latest = passed[passed.length - 1];
  return Math.floor(latest / 1000);
}

/* users 테이블을 제외한 모든 표를 비운다. server_meta에 마지막 실행 기준일을 기록해 같은 반기
   동안 중복 실행되지 않게 한다. 실제로 삭제를 실행했으면 true, 이미 처리된 기준일이면 false. */
export async function wipeIfDue(env) {
  const boundary = latestWipeBoundarySec(nowSec());
  const row = await env.DB.prepare(
    "SELECT value FROM server_meta WHERE key = 'last_wipe_boundary'"
  ).first();
  const last = row ? parseInt(row.value, 10) : 0;
  if (last >= boundary) return false;

  const tables = [
    "assignments", "submissions", "submission_feedback_versions",
    "user_data", "student_professors", "classes", "class_students",
    "sessions", "password_resets", "rate_limits",
  ];
  for (const t of tables) {
    await env.DB.prepare(`DELETE FROM ${t}`).run();
  }
  await env.DB.prepare(
    "INSERT INTO server_meta (key, value) VALUES ('last_wipe_boundary', ?) " +
    "ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).bind(String(boundary)).run();
  return true;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

/* PBKDF2-SHA256, 100,000회 반복 — Workers 런타임(Web Crypto)에서 동작 */
export async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return { hash: bytesToHex(new Uint8Array(bits)), salt: bytesToHex(salt) };
}

export async function verifyPassword(password, storedHashHex, storedSaltHex) {
  const { hash } = await hashPassword(password, storedSaltHex);
  if (hash.length !== storedHashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ storedHashHex.charCodeAt(i);
  return diff === 0;
}

export async function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(bytes);
}

/* ===== 요청 횟수 제한 (2026-08-20 보안 점검 후 추가) =====
   로그인/가입/비밀번호 찾기처럼 악용(무차별 대입, 메일 폭탄 등) 소지가 있는 API에서 공통으로 쓰는
   고정 윈도우(fixed-window) 방식 제한기. rate_limits 표(schema.sql 참고)에 key별로 "이번 창에서
   몇 번 시도했는지"만 기록한다 — IP 주소 자체는 저장하지 않고, 호출하는 쪽에서 만든 key(예:
   "login:1.2.3.4:studio.inknpen")의 해시가 아니라 원문을 그대로 쓰므로, key를 만들 때 굳이 IP를
   그대로 남기고 싶지 않다면 호출부에서 알아서 가공하면 된다(현재는 필요 이상으로 복잡해지지
   않도록 원문 그대로 사용). */
export function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

/* key별로 windowSec(초) 동안 최대 maxAttempts회까지 허용. 한도를 넘으면
   { allowed:false, retryAfterSec }, 아니면 { allowed:true }를 반환한다.
   "fail open": rate_limits 표가 아직 D1에 반영되지 않았거나(마이그레이션 전) DB에 일시적인 문제가
   있어도 여기서 에러를 던지면 로그인/가입 자체가 전부 막혀버린다. 이 함수는 어디까지나 추가 방어선일
   뿐이므로, 내부 오류가 나면 제한 없이 통과시키고(제한 기능만 잠깐 꺼진 셈) 원래 기능은 지킨다. */
export async function checkRateLimit(env, key, maxAttempts, windowSec) {
  try {
    const now = nowSec();
    const row = await env.DB.prepare(
      "SELECT count, window_start FROM rate_limits WHERE rl_key = ?"
    ).bind(key).first();

    if (!row || now - row.window_start >= windowSec) {
      // 새 창 시작 (또는 처음 요청) — 카운트를 1로 리셋
      await env.DB.prepare(
        "INSERT INTO rate_limits (rl_key, count, window_start) VALUES (?, 1, ?) " +
        "ON CONFLICT(rl_key) DO UPDATE SET count = 1, window_start = excluded.window_start"
      ).bind(key, now).run();
      return { allowed: true };
    }

    if (row.count >= maxAttempts) {
      return { allowed: false, retryAfterSec: Math.max(1, windowSec - (now - row.window_start)) };
    }

    await env.DB.prepare("UPDATE rate_limits SET count = count + 1 WHERE rl_key = ?").bind(key).run();
    return { allowed: true };
  } catch (e) {
    return { allowed: true };
  }
}

/* Authorization: Bearer <token> 헤더로 로그인된 사용자 조회 */
export async function requireAuth(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const session = await env.DB.prepare(
    "SELECT s.expires_at, u.id, u.school, u.name, u.username, u.email, u.role, u.prof_code, u.prof_id " +
    "FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?"
  ).bind(token).first();
  if (!session) return null;
  if (session.expires_at < nowSec()) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    return null;
  }
  return {
    token,
    user: { id: session.id, school: session.school, name: session.name, username: session.username, email: session.email,
      role: session.role || "student", profCode: session.prof_code || "", profId: session.prof_id || null },
  };
}

/* 관리자 전용 API에서 공통으로 사용 — 관리자가 아니면 null */
export async function requireAdmin(request, env) {
  const auth = await requireAuth(request, env);
  if (!auth || auth.user.username !== ADMIN_USERNAME) return null;
  return auth;
}

/* 교수 전용 API — role이 professor가 아니면 null */
export async function requireProfessor(request, env) {
  const auth = await requireAuth(request, env);
  if (!auth || auth.user.role !== "professor") return null;
  return auth;
}

/* ===== 이메일 발송 (Gmail SMTP, 465/TLS) =====
   Cloudflare Pages 프로젝트의 환경변수(Settings → Environment variables)에
   GMAIL_USER(보내는 사람 gmail 주소), GMAIL_APP_PASSWORD(구글 계정의 "앱 비밀번호")를
   등록해야 동작합니다. 두 값이 없으면 sendEmail()이 에러를 던집니다. */

function b64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function encodeHeaderUtf8(text) {
  return "=?UTF-8?B?" + b64(text) + "?=";
}

class SmtpClient {
  constructor(socket) {
    this.writer = socket.writable.getWriter();
    this.reader = socket.readable.getReader();
    this.buf = "";
    this.dec = new TextDecoder();
    this.enc = new TextEncoder();
  }
  async _fill() {
    const { value, done } = await this.reader.read();
    if (done) throw new Error("SMTP 서버와의 연결이 끊어졌습니다.");
    this.buf += this.dec.decode(value, { stream: true });
  }
  /* SMTP는 파이프라이닝 없이 명령마다 응답하므로, 버퍼가 CRLF로 끝나고
     마지막 줄이 "250 " 처럼 대시(-)가 아닌 공백으로 시작하면 완전한 응답으로 간주 */
  async readResponse() {
    while (true) {
      if (this.buf.endsWith("\r\n")) {
        const lines = this.buf.split("\r\n").filter(Boolean);
        if (lines.length && /^\d{3} /.test(lines[lines.length - 1])) {
          const resp = this.buf;
          this.buf = "";
          return resp;
        }
      }
      await this._fill();
    }
  }
  async writeLine(line) {
    await this.writer.write(this.enc.encode(line + "\r\n"));
  }
  async cmd(line, expectCode) {
    if (line !== null) await this.writeLine(line);
    const resp = await this.readResponse();
    if (expectCode && !resp.startsWith(String(expectCode))) {
      throw new Error("SMTP 오류: " + resp.trim());
    }
    return resp;
  }
}

export async function sendEmail(env, { to, subject, text }) {
  const user = env.GMAIL_USER;
  const pass = env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("이메일 발송 설정이 되어있지 않습니다 (GMAIL_USER / GMAIL_APP_PASSWORD 환경변수 필요)");
  }
  const { connect } = await import("cloudflare:sockets");
  const socket = connect({ hostname: "smtp.gmail.com", port: 465 }, { secureTransport: "on" });
  try {
    const c = new SmtpClient(socket);
    await c.readResponse(); // 220 인사말
    await c.cmd("EHLO storyhelperlite.pages.dev", 250);
    await c.cmd("AUTH LOGIN", 334);
    await c.cmd(b64(user), 334);
    await c.cmd(b64(pass), 235);
    await c.cmd(`MAIL FROM:<${user}> BODY=8BITMIME`, 250);
    await c.cmd(`RCPT TO:<${to}>`, 250);
    await c.cmd("DATA", 354);
    const bodyLines = String(text).split("\n").map((l) => (l.startsWith(".") ? "." + l : l));
    const headers = [
      `From: 스토리 가이드 <${user}>`,
      `To: <${to}>`,
      `Subject: ${encodeHeaderUtf8(subject)}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
    ];
    const raw = headers.join("\r\n") + "\r\n\r\n" + bodyLines.join("\r\n") + "\r\n.";
    await c.cmd(raw, 250);
    await c.cmd("QUIT", 221);
  } finally {
    try { await socket.close(); } catch (e) {}
  }
}
