import { requireAdmin, jsonResponse, nowSec, ensureHistorySchema, snapshotUserData } from "./_utils.js";

/* ===== (2026-11-24) 관리자: 학생 작품 데이터 이전 버전 보기·되돌리기 =====
   GET  /api/admin-data-history?username=아이디  → 지금 상태 + 보관된 이전 버전 목록(내용 대신 요약만)
   GET  /api/admin-data-history                  → 전체 보관 용량만
   POST /api/admin-data-history {userId, historyId} → 그 버전으로 되돌린다.
        되돌리기 직전 상태도 먼저 보관(reason "before-restore")하므로, 되돌리기 자체도 다시 되돌릴 수 있다.
        rev를 1 올리므로 학생이 열어 둔 화면은 다음 저장 때 덮어쓰지 않고 이 내용을 받아 합친다(auth.js). */

/* 작품 데이터 요약 — 관리자가 어느 버전이 맞는지 고를 수 있도록 작품 이름·아이디어 수·글자 수를 보여준다 */
function summarize(json) {
  let d;
  try { d = JSON.parse(json); } catch (e) { return { broken: true }; }
  const projects = Array.isArray(d && d.projects) ? d.projects : [];
  let chars = 0;
  const walk = (v, depth) => {
    if (depth > 40 || v == null) return;
    if (typeof v === "string") { if (!v.startsWith("data:")) chars += v.length; return; }
    if (Array.isArray(v)) { v.forEach((x) => walk(x, depth + 1)); return; }
    // id·…Id·…Ids·key 같은 내부 값은 글자 수에서 뺀다("idea…" 같은 진짜 내용 칸은 센다)
    if (typeof v === "object") Object.keys(v).forEach((k) => { if (k !== "id" && k !== "key" && !/Ids?$/.test(k)) walk(v[k], depth + 1); });
  };
  walk(projects, 0);
  walk(d.ideaBlocks, 0);
  return {
    projects: projects.filter((p) => p && !p.isSampleProject).map((p) => String(p.name || "제목 없음")).slice(0, 20),
    projectCount: projects.filter((p) => p && !p.isSampleProject).length,
    ideaCount: Array.isArray(d.ideaBlocks) ? d.ideaBlocks.length : 0,
    chars,
  };
}

async function totals(env) {
  try {
    const t = await env.DB.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(length(data)), 0) AS bytes FROM user_data_history").first();
    return { count: (t && t.n) || 0, bytes: (t && t.bytes) || 0 };
  } catch (e) { return { count: 0, bytes: 0 }; }
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth) return jsonResponse({ error: "관리자만 접근할 수 있습니다." }, 403);
  await ensureHistorySchema(env);

  const username = (new URL(request.url).searchParams.get("username") || "").trim();
  const total = await totals(env);
  if (!username) return jsonResponse({ total });

  const user = await env.DB.prepare("SELECT id, name, username, school FROM users WHERE username = ?").bind(username).first();
  if (!user) return jsonResponse({ error: "그 아이디의 회원이 없습니다.", total }, 404);

  const cur = await env.DB.prepare("SELECT data, rev, updated_at FROM user_data WHERE user_id = ?").bind(user.id).first();
  const { results } = await env.DB.prepare(
    "SELECT id, data, rev, saved_at, reason FROM user_data_history WHERE user_id = ? ORDER BY saved_at DESC, id DESC"
  ).bind(user.id).all();

  return jsonResponse({
    total,
    user,
    current: cur ? { rev: cur.rev || 0, updatedAt: cur.updated_at, size: cur.data.length, summary: summarize(cur.data) } : null,
    versions: (results || []).map((h) => ({
      id: h.id, rev: h.rev || 0, savedAt: h.saved_at, reason: h.reason || "auto", size: h.data.length, summary: summarize(h.data),
    })),
  });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth) return jsonResponse({ error: "관리자만 접근할 수 있습니다." }, 403);
  await ensureHistorySchema(env);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const userId = Number(body && body.userId), historyId = Number(body && body.historyId);
  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(historyId) || historyId <= 0)
    return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const h = await env.DB.prepare("SELECT id, data FROM user_data_history WHERE id = ? AND user_id = ?").bind(historyId, userId).first();
  if (!h) return jsonResponse({ error: "그 버전을 찾을 수 없습니다(이미 정리되었을 수 있습니다)." }, 404);
  try { JSON.parse(h.data); } catch (e) { return jsonResponse({ error: "그 버전의 데이터가 손상되어 되돌릴 수 없습니다." }, 400); }

  // 되돌리기 직전 상태를 먼저 보관(간격 무시) — 잘못 되돌렸을 때 다시 이 상태로 돌아올 수 있게
  await snapshotUserData(env, userId, "before-restore", true);

  const now = nowSec();
  const exists = await env.DB.prepare("SELECT user_id FROM user_data WHERE user_id = ?").bind(userId).first();
  if (exists) {
    await env.DB.prepare(
      "UPDATE user_data SET data = (SELECT data FROM user_data_history WHERE id = ? AND user_id = ?), " +
      "updated_at = ?, rev = COALESCE(rev, 0) + 1 WHERE user_id = ?"
    ).bind(historyId, userId, now, userId).run();
  } else {
    await env.DB.prepare(
      "INSERT INTO user_data (user_id, data, updated_at, rev) SELECT ?, data, ?, 1 FROM user_data_history WHERE id = ? AND user_id = ?"
    ).bind(userId, now, historyId, userId).run();
  }
  const after = await env.DB.prepare("SELECT rev FROM user_data WHERE user_id = ?").bind(userId).first();
  return jsonResponse({ ok: true, rev: after ? after.rev : null });
}
