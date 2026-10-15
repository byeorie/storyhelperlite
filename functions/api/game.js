import { requireAuth, jsonResponse, nowSec, makeToken, ensureGameSchema } from "./_utils.js";

/* ===== (2026-10-15) RPG 게임 연동 =====
   GET  /api/game — 내 게임 정보
        학생: 게임이 켜진 내 수업 목록 → [RPG 게임] 메뉴를 보일지 결정
        교수: GM 지정 여부 + (GM이면) 내 수업 전체와 게임 켜짐 여부
   POST /api/game { mode:"toggleClass", classId, on }  — GM 교수가 자기 수업의 게임을 켜고 끈다
   POST /api/game { mode:"ticket", classId }           — 게임 접속용 1회용 입장권(60초)을 만들고 게임 주소를 돌려준다
        학생: 그 수업 수강생 + 수업에 게임이 켜져 있어야 함 / GM 교수: 자기 수업 + 게임이 켜져 있어야 함
   게임 주소는 Pages 환경 변수 GAME_URL (예: https://island-mud-world.<계정>.workers.dev) */
const TICKET_SEC = 60;

async function isGm(env, userId) {
  try {
    const r = await env.DB.prepare("SELECT game_gm FROM users WHERE id = ?").bind(userId).first();
    return !!(r && r.game_gm);
  } catch (e) { return false; }
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  await ensureGameSchema(env);
  const u = auth.user;
  if (u.role === "professor") {
    const gm = await isGm(env, u.id);
    if (!gm) return jsonResponse({ gm: false, classes: [] });
    const { results } = await env.DB.prepare(
      "SELECT id, name, school_name, section, class_day, class_time, game_on, " +
      "(SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = classes.id) AS student_count " +
      "FROM classes WHERE prof_id = ? ORDER BY CASE WHEN sort_order IS NULL THEN 1 ELSE 0 END, sort_order, created_at DESC"
    ).bind(u.id).all().catch(() => env.DB.prepare(
      "SELECT id, name, school_name, section, class_day, class_time, game_on, 0 AS student_count FROM classes WHERE prof_id = ? ORDER BY created_at DESC"
    ).bind(u.id).all());
    return jsonResponse({ gm: true, classes: (results || []).map(c => ({ ...c, game_on: !!c.game_on })) });
  }
  const { results } = await env.DB.prepare(
    "SELECT cl.id, cl.name, cl.school_name, cl.section, cl.class_day, cl.class_time, u.name AS prof_name " +
    "FROM class_students cs JOIN classes cl ON cl.id = cs.class_id JOIN users u ON u.id = cl.prof_id " +
    "WHERE cs.student_id = ? AND cl.game_on = 1 ORDER BY cl.name"
  ).bind(u.id).all().catch(() => ({ results: [] }));
  return jsonResponse({ gm: false, classes: results || [] });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  await ensureGameSchema(env);
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const u = auth.user, classId = Number(body && body.classId);
  if (!classId) return jsonResponse({ error: "수업을 골라주세요." }, 400);

  if (body.mode === "toggleClass") {
    if (u.role !== "professor" || !(await isGm(env, u.id))) return jsonResponse({ error: "RPG 게임 GM으로 지정된 교수만 바꿀 수 있습니다." }, 403);
    const cl = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND prof_id = ?").bind(classId, u.id).first();
    if (!cl) return jsonResponse({ error: "내 수업이 아닙니다." }, 404);
    await env.DB.prepare("UPDATE classes SET game_on = ? WHERE id = ?").bind(body.on ? 1 : 0, classId).run();
    return jsonResponse({ ok: true, classId, on: !!body.on });
  }

  if (body.mode === "ticket") {
    if (!env.GAME_URL) return jsonResponse({ error: "게임 주소(GAME_URL)가 아직 설정되지 않았습니다. 관리자에게 알려주세요." }, 503);
    let role;
    if (u.role === "professor") {
      if (!(await isGm(env, u.id))) return jsonResponse({ error: "RPG 게임 GM으로 지정된 교수만 들어갈 수 있습니다." }, 403);
      const cl = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND prof_id = ? AND game_on = 1").bind(classId, u.id).first();
      if (!cl) return jsonResponse({ error: "게임이 켜진 내 수업이 아닙니다." }, 404);
      role = "gm";
    } else {
      const cl = await env.DB.prepare(
        "SELECT cl.id FROM class_students cs JOIN classes cl ON cl.id = cs.class_id WHERE cs.student_id = ? AND cl.id = ? AND cl.game_on = 1"
      ).bind(u.id, classId).first();
      if (!cl) return jsonResponse({ error: "이 수업에서는 게임을 할 수 없습니다." }, 404);
      role = "student";
    }
    const now = nowSec(), ticket = await makeToken();
    // 오래된 입장권 정리(쓰지 않고 만료된 것까지 함께)
    try { await env.DB.prepare("DELETE FROM game_tickets WHERE expires_at < ?").bind(now - 3600).run(); } catch (e) {}
    await env.DB.prepare(
      "INSERT INTO game_tickets (ticket, user_id, class_id, role, created_at, expires_at, used) VALUES (?, ?, ?, ?, ?, ?, 0)"
    ).bind(ticket, u.id, classId, role, now, now + TICKET_SEC).run();
    const base = String(env.GAME_URL).replace(/\/+$/, "");
    return jsonResponse({ ok: true, url: base + (role === "gm" ? "/gm.html" : "/") + "#ticket=" + ticket });
  }

  return jsonResponse({ error: "mode는 'toggleClass' 또는 'ticket'이어야 합니다." }, 400);
}
