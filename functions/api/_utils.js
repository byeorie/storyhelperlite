/* ===== 공용 유틸 (Cloudflare Pages Functions) ===== */

/* 관리자(서버 초기화/회원 관리) 권한을 가진 단일 계정의 아이디.
   app.js의 ADMIN_USERNAME과 반드시 같은 값으로 유지할 것 */
export const ADMIN_USERNAME = "studio.inknpen";

export function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function nowSec() {
  return Math.floor(Date.now() / 1000);
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
      `From: 글쓰기도우미 <${user}>`,
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
