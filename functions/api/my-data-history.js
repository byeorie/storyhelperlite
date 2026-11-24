import { requireAuth, jsonResponse, ensureHistorySchema, summarizeUserData, snapshotUserData } from "./_utils.js";

/* ===== (2026-11-24) 학생: 내 작품의 이전 버전에서 꺼내오기 =====
   GET /api/my-data-history        → 내 보관본 목록(요약만: 시각·작품 이름·작품 수·아이디어 수·글자 수)
   GET /api/my-data-history?id=N   → 그 보관본의 작품·아이디어(내 것일 때만)
   서버의 지금 데이터는 바꾸지 않는다 — 화면(app.js openMyHistory)이 고른 작품을 "새 작품(사본)"으로 추가하고
   없는 아이디어만 되살린 뒤 평소처럼 저장한다. 그래서 잘못 골라도 지금 글이 사라지지 않는다.
   (보관본은 접속(GET /api/data)·저장(POST) 때 서버가 1시간에 한 번 만들고, 하나도 없으면 이 목록을 열 때 지금 상태를 보관한다 — _utils.js snapshotUserData) */
export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  await ensureHistorySchema(env);
  const userId = auth.user.id;

  const idParam = new URL(request.url).searchParams.get("id");
  if (idParam) {
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
    const h = await env.DB.prepare("SELECT id, data, saved_at FROM user_data_history WHERE id = ? AND user_id = ?").bind(id, userId).first();
    if (!h) return jsonResponse({ error: "그 버전을 찾을 수 없습니다(이미 정리되었을 수 있습니다)." }, 404);
    let d;
    try { d = JSON.parse(h.data); } catch (e) { return jsonResponse({ error: "그 버전의 데이터가 손상되어 꺼낼 수 없습니다." }, 400); }
    return jsonResponse({
      version: { id: h.id, savedAt: h.saved_at },
      data: {
        projects: (Array.isArray(d.projects) ? d.projects : []).filter((p) => p && !p.isSampleProject),
        ideaBlocks: Array.isArray(d.ideaBlocks) ? d.ideaBlocks : [],
      },
    });
  }

  /* (2026-11-24) 목록을 열었는데 보관본이 하나도 없으면, 지금 상태부터 하나 보관해 둔다(그래야 이후에 망가져도 이 시점으로 돌아올 수 있다) */
  const any = await env.DB.prepare("SELECT 1 AS x FROM user_data_history WHERE user_id = ? LIMIT 1").bind(userId).first();
  if (!any) await snapshotUserData(env, userId, "auto", true);
  const { results } = await env.DB.prepare(
    "SELECT id, data, saved_at, reason FROM user_data_history WHERE user_id = ? ORDER BY saved_at DESC, id DESC"
  ).bind(userId).all();
  return jsonResponse({
    versions: (results || []).map((h) => ({ id: h.id, savedAt: h.saved_at, reason: h.reason || "auto", summary: summarizeUserData(h.data) })),
  });
}
