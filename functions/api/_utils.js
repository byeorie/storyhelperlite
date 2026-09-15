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

/* ===== (2026-09-08) 제출/첨삭 관련 표·컬럼 자동 보정 =====
   그동안 새 기능을 넣을 때마다 schema.sql에 "D1 콘솔에서 한 번 실행하세요"라는 안내만 남겼기 때문에,
   운영 DB에 그 실행을 빠뜨리면 표(또는 컬럼)가 없는 상태가 되고 → 첨삭 저장/조회 API가 통째로 500이
   나면서 "피드백을 눌러도 저장이 안 된다 / 제출물을 열 수 없다"는 증상이 생겼다.
   (2026-09-01에 추가된 submission_feedback_versions가 실제로 그런 상태였던 것으로 보인다)
   이제 제출/첨삭 API가 처음 호출될 때 필요한 표와 컬럼을 스스로 만들어 둔다.
   - CREATE TABLE/INDEX IF NOT EXISTS, ALTER TABLE ADD COLUMN 모두 이미 있으면 그냥 실패 → 무시한다.
   - 어떤 단계가 실패해도 예외를 밖으로 던지지 않는다(조회/저장이 그것 때문에 막히면 안 되므로). */
let submissionSchemaEnsured = false;
export async function ensureSubmissionSchema(env) {
  if (submissionSchemaEnsured) return;
  const stmts = [
    "CREATE TABLE IF NOT EXISTS submission_feedback_versions (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, submission_id INTEGER NOT NULL, version INTEGER NOT NULL, " +
      "feedback TEXT NOT NULL, memos TEXT, created_at INTEGER NOT NULL)",
    "CREATE INDEX IF NOT EXISTS idx_sfv_submission ON submission_feedback_versions(submission_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_sfv_submission_version ON submission_feedback_versions(submission_id, version)",
    /* 2026-09-08: "과제 확인" — 첨삭을 하지 않았어도 교수가 제출물을 확인했음을 표시하는 시각(unix초) */
    "ALTER TABLE submissions ADD COLUMN checked_at INTEGER",
    /* 2026-09-10: "평가" — 첨삭/메모와 별개로 교수가 남기는 총평(선택 입력). 최신 것만 보관한다. */
    "ALTER TABLE submissions ADD COLUMN evaluation TEXT",
    /* 2026-09-11: 알림 — 학생이 교수님의 첨삭/확인 알림을 열어본 시각(unix초). 이 값이 feedback_at
       (또는 checked_at)보다 오래되면 "아직 안 본 알림"으로 보고 토스트를 다시 띄운다. */
    "ALTER TABLE submissions ADD COLUMN feedback_seen_at INTEGER",
    /* 2026-09-15: 재제출 차수(submit_round) — 같은 (과제, 학생, 종류)에 다시 제출하면 덮어쓰지 않고
       1차·2차…로 따로 쌓는다. 예전 제출물은 아래 UPDATE로 제출 순서대로 차수를 채워 넣는다
       (submit_round가 NULL인 줄에만 적용되므로 여러 번 실행해도 안전하다). */
    "ALTER TABLE submissions ADD COLUMN submit_round INTEGER",
    "UPDATE submissions SET submit_round = (SELECT COUNT(*) FROM submissions s2 " +
      "WHERE s2.assignment_id = submissions.assignment_id AND s2.student_id = submissions.student_id " +
      "AND s2.type = submissions.type AND s2.id <= submissions.id) WHERE submit_round IS NULL",
    "CREATE INDEX IF NOT EXISTS idx_submissions_round ON submissions(assignment_id, student_id, type, submit_round)",
  ];
  for (const sql of stmts) {
    try { await env.DB.prepare(sql).run(); } catch (e) {}
  }
  submissionSchemaEnsured = true;
}

/* ===== (2026-09-12) 과제 종류(type) 컬럼 =====
   과제 폴더에 "이 과제는 글쓰기 과제" 처럼 종류를 지정할 수 있게 하면서 추가한 컬럼.
   NULL이면 종류 미지정(예전 과제들 = 모든 종류 제출 가능)이라 기존 데이터는 그대로 동작한다. */
let assignmentSchemaEnsured = false;
export async function ensureAssignmentSchema(env) {
  if (assignmentSchemaEnsured) return;
  try { await env.DB.prepare("ALTER TABLE assignments ADD COLUMN type TEXT").run(); } catch (e) {}
  assignmentSchemaEnsured = true;
}

/* ===== (2026-09-14) 수업 목록 순서(sort_order) 컬럼 =====
   교수가 [수업 관리]에서 수업 카드를 끌어 순서를 바꾸면 그 순서를 여기에 저장한다.
   NULL이면 아직 순서를 정하지 않은 수업 → 목록 끝쪽에 최신 생성순으로 붙는다. */
let classSchemaEnsured = false;
export async function ensureClassSchema(env) {
  if (classSchemaEnsured) return;
  try { await env.DB.prepare("ALTER TABLE classes ADD COLUMN sort_order INTEGER").run(); } catch (e) {}
  classSchemaEnsured = true;
}

/* ===== (2026-09-08) 수강 등록 표 정리 =====
   "수업 코드 입력이 꼬여서 같은 수업에 두 번 등록된 학생이 생겼다"는 신고에 대한 대응.
   원래 schema.sql에는 중복을 막는 UNIQUE 인덱스가 있지만, 그 SQL을 운영 DB에 실행하지 않았다면
   인덱스가 없어 같은 (수업, 학생) 조합이 여러 번 들어갈 수 있다.
   등록/탈퇴 API가 처음 호출될 때 (1) 이미 생긴 중복 행을 하나만 남기고 정리한 뒤 (2) UNIQUE 인덱스를
   만들어 앞으로는 중복이 아예 생기지 않게 한다. 순서가 중요하다 — 중복이 남아 있으면 인덱스 생성이 실패한다. */
let enrollmentSchemaEnsured = false;
export async function ensureEnrollmentSchema(env) {
  if (enrollmentSchemaEnsured) return;
  const stmts = [
    // (1) 중복 정리 — 각 조합에서 가장 먼저 등록된 행(id가 가장 작은 것)만 남긴다
    "DELETE FROM class_students WHERE id NOT IN (SELECT MIN(id) FROM class_students GROUP BY class_id, student_id)",
    "DELETE FROM student_professors WHERE id NOT IN (SELECT MIN(id) FROM student_professors GROUP BY student_id, prof_id)",
    // (2) 앞으로의 중복 차단
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_class_students_pair ON class_students(class_id, student_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_student_professors_pair ON student_professors(student_id, prof_id)",
  ];
  for (const sql of stmts) {
    try { await env.DB.prepare(sql).run(); } catch (e) {}
  }
  enrollmentSchemaEnsured = true;
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

  /* (2026-09-08) 이 정리 작업이 실패해도 데이터 조회(GET /api/data)까지 함께 실패하면 안 된다.
     실제로 2026-09-01 기준일이 지난 뒤, 아래 표 목록 중 운영 DB에 아직 만들어지지 않은 표가 있으면
     DELETE에서 오류가 나며 요청 전체가 500이 되었고, 그 결과 로그인해도 서버 데이터를 못 불러와
     "저장은 됐는데 다시 들어오면 작품이 사라진 것처럼 보이는" 문제가 생겼다(저장 POST는 이 함수를
     호출하지 않으므로 정상 동작했다 = 서버에는 데이터가 남아 있었다).
     이제 모든 단계를 try/catch로 감싸 어떤 경우에도 예외를 밖으로 던지지 않는다. */
  let row = null;
  try {
    row = await env.DB.prepare(
      "SELECT value FROM server_meta WHERE key = 'last_wipe_boundary'"
    ).first();
  } catch (e) {
    return false; // server_meta 표를 읽지 못하면(미생성 등) 함부로 지우지 않고 그냥 넘어간다
  }
  const last = row ? parseInt(row.value, 10) : 0;
  if (last >= boundary) return false;

  /* 기록이 아예 없는 경우(이 안전장치를 처음 켠 직후이거나, 그동안 기록 남기기가 계속 실패해온 경우)
     에는 곧바로 전체 삭제를 하지 않고 "이번 기준일은 처리한 것으로" 기록만 남긴다. 학기 중에 배포하면서
     사용 중인 학생 데이터가 예고 없이 지워지는 사고를 막기 위한 장치 — 다음 기준일부터 정상 동작한다. */
  const firstRun = !row;
  try {
    await env.DB.prepare(
      "INSERT INTO server_meta (key, value) VALUES ('last_wipe_boundary', ?) " +
      "ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).bind(String(boundary)).run();
  } catch (e) {
    return false; // 기록을 남기지 못하면 삭제도 하지 않는다(요청마다 반복 삭제되는 것을 방지)
  }
  if (firstRun) return false;

  /* (2026-09-08) 삭제 대상을 좁혔다. 예전에는 users를 뺀 모든 표를 지웠기 때문에 기준일이 지나면
     수업(classes)·등록 코드·수강생 배정(class_students)·교수 등록(student_professors)·과제(assignments)와
     제출물까지 통째로 사라졌다 — 3/1, 9/1은 바로 개강일이라 학기 초에 만들어둔 수업이 날아갈 수 있었다.
     서버 용량의 대부분은 학생 작품 데이터(user_data)이므로 그것만 정리하면 목적은 달성된다.
     이제 수업·등록 코드·과제·제출물·첨삭 기록은 그대로 보존한다(필요하면 관리자 화면에서 직접 삭제). */
  const tables = [
    "user_data",
    "sessions", "password_resets", "rate_limits",
  ];
  for (const t of tables) {
    // 표가 없거나 삭제에 실패해도 나머지는 계속 진행하고, 요청 자체는 정상 응답한다
    try { await env.DB.prepare(`DELETE FROM ${t}`).run(); } catch (e) {}
  }
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
    "SELECT s.expires_at, u.id, u.school, u.name, u.username, u.email, u.role, u.prof_id " +
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
      role: session.role || "student", profId: session.prof_id || null },
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

/* 2026-09-03: 학생 상단 툴바의 "수업 선택" 드롭다운 + student-assignments 기본값 계산에서 공용으로
   쓰는 "내가 등록한 수업 목록" 조회. 기존엔 student_professors(교수 단위)만 보고 목록을 만들어서,
   같은 교수님의 수업을 2개 이상 등록한 학생은 드롭다운에 교수 1명으로만 뭉뚱그려져 보이고 실제로는
   수업을 구분해 고를 수 없었다(버그 원인). class_students(수업 단위 등록) 기준으로 다시 만들되,
   수업 코드 도입 이전에 교수 단위로만 등록되어 class_students에 아무 행도 없는 옛 학생은
   classId=null(수업 미지정) 항목으로 그대로 포함시켜 이전처럼 동작하게 둔다. */
export async function listStudentClasses(env, studentId) {
  const { results: classRows } = await env.DB.prepare(
    "SELECT cl.id AS class_id, cl.name AS class_name, u.id AS prof_id, u.name AS prof_name, u.school AS prof_school " +
    "FROM class_students cs JOIN classes cl ON cl.id = cs.class_id JOIN users u ON u.id = cl.prof_id " +
    "WHERE cs.student_id = ? ORDER BY u.name, cl.name"
  ).bind(studentId).all();

  const { results: profRows } = await env.DB.prepare(
    "SELECT u.id AS prof_id, u.name AS prof_name, u.school AS prof_school " +
    "FROM student_professors sp JOIN users u ON u.id = sp.prof_id WHERE sp.student_id = ?"
  ).bind(studentId).all();

  const list = (classRows || []).map((r) => ({
    classId: r.class_id, profId: r.prof_id, profName: r.prof_name, profSchool: r.prof_school, className: r.class_name,
  }));
  const coveredProfIds = new Set(list.map((c) => c.profId));
  (profRows || []).forEach((p) => {
    if (!coveredProfIds.has(p.prof_id)) {
      list.push({ classId: null, profId: p.prof_id, profName: p.prof_name, profSchool: p.prof_school, className: null });
      coveredProfIds.add(p.prof_id);
    }
  });
  list.sort((a, b) => (a.profName || "").localeCompare(b.profName) || (a.className || "").localeCompare(b.className || ""));
  return list;
}

/* key(문자열, 프론트엔드의 상단 툴바 선택값과 같은 형식: 수업 있으면 "c"+classId, 없으면 "p"+profId) */
export function classEntryKey(entry) {
  return entry.classId != null ? "c" + entry.classId : "p" + entry.profId;
}

/* listStudentClasses() 결과에서 기본 선택 항목 고르기 — users.prof_id(기본 선택 교수)와 일치하는
   항목을 우선하고, 없으면 첫 번째 항목을 쓴다. */
export function pickDefaultClassEntry(list, preferredProfId) {
  if (!list.length) return null;
  return list.find((c) => c.profId === preferredProfId) || list[0];
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

/* 2026-09-15: 재제출 차수 목록 — 같은 (과제, 학생, 종류)로 제출된 줄들을 1차·2차…로 돌려준다.
   submit_round 컬럼이 없는 예전 DB에서는 제출 순서대로 번호를 매겨 같은 모양으로 맞춘다. */
export async function readSubmitRounds(env, row) {
  let rows = [];
  try {
    const q = "SELECT id, submitted_at, submit_round, (feedback IS NOT NULL) AS has_feedback FROM submissions " +
      "WHERE assignment_id = ? AND student_id = ? AND type = ? ORDER BY submitted_at ASC, id ASC";
    const r = await env.DB.prepare(q).bind(row.assignment_id, row.student_id, row.type).all();
    rows = r.results || [];
  } catch (e) {
    try {
      const r = await env.DB.prepare(
        "SELECT id, submitted_at, (feedback IS NOT NULL) AS has_feedback FROM submissions " +
        "WHERE assignment_id = ? AND student_id = ? AND type = ? ORDER BY submitted_at ASC, id ASC"
      ).bind(row.assignment_id, row.student_id, row.type).all();
      rows = r.results || [];
    } catch (e2) { rows = []; }
  }
  if (!rows.length) return { round: 1, rounds: [{ id: row.id, round: 1, submittedAt: row.submitted_at, hasFeedback: !!row.feedback }] };
  rows.sort((a, b) => (a.submit_round || 0) - (b.submit_round || 0)
    || (a.submitted_at || 0) - (b.submitted_at || 0) || a.id - b.id);
  const rounds = rows.map((x, i) => ({
    id: x.id, round: x.submit_round || (i + 1), submittedAt: x.submitted_at, hasFeedback: !!x.has_feedback,
  }));
  const mine = rounds.find((x) => x.id === row.id);
  return { round: mine ? mine.round : rounds.length, rounds };
}
