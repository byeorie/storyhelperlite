import { requireAdmin, jsonResponse } from "./_utils.js";

/* GET /api/admin — 회원 명단 조회 (관리자 전용) */
export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth) return jsonResponse({ error: "관리자만 접근할 수 있습니다." }, 403);

  const { results } = await env.DB.prepare(
    "SELECT id, school, name, username, email, role, prof_code, created_at FROM users ORDER BY created_at DESC"
  ).all();

  return jsonResponse({ users: results || [] });
}

/* POST /api/admin — 서버 초기화 (관리자 전용)
   body: { mode: "data" | "all" }
   - "data": 모든 회원의 작품 데이터(user_data)만 삭제. 계정은 유지.
   - "all" : 위 데이터 삭제 + 관리자 본인을 제외한 모든 계정·세션 삭제. */
export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth) return jsonResponse({ error: "관리자만 접근할 수 있습니다." }, 403);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const mode = body && body.mode;

  if (mode === "data") {
    await env.DB.prepare("DELETE FROM user_data").run();
    return jsonResponse({ ok: true, mode: "data" });
  }

  if (mode === "all") {
    await env.DB.prepare("DELETE FROM user_data").run();
    await env.DB.prepare("DELETE FROM sessions WHERE user_id != ?").bind(auth.user.id).run();
    await env.DB.prepare("DELETE FROM users WHERE id != ?").bind(auth.user.id).run();
    return jsonResponse({ ok: true, mode: "all" });
  }

  return jsonResponse({ error: "mode는 'data' 또는 'all' 이어야 합니다." }, 400);
}
