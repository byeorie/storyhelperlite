/* ===== 공용 유틸 (Cloudflare Pages Functions) ===== */

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
    "SELECT s.expires_at, u.id, u.school, u.name, u.username, u.email " +
    "FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?"
  ).bind(token).first();
  if (!session) return null;
  if (session.expires_at < nowSec()) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    return null;
  }
  return {
    token,
    user: { id: session.id, school: session.school, name: session.name, username: session.username, email: session.email },
  };
}
