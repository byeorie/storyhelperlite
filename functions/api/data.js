import { requireAuth, jsonResponse, nowSec, dataRetentionCutoffSec } from "./_utils.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  // 매년 3/1, 9/1 기준으로 그 이전 반기 동안 갱신되지 않은 데이터를 조회 시점에 정리
  // (요청이 들어올 때마다 자동 청소 — dataRetentionCutoffSec() 설명 참고)
  const cutoff = dataRetentionCutoffSec(nowSec());
  await env.DB.prepare("DELETE FROM user_data WHERE updated_at < ?").bind(cutoff).run();

  const row = await env.DB.prepare(
    "SELECT data, updated_at FROM user_data WHERE user_id = ?"
  ).bind(auth.user.id).first();

  if (!row) return jsonResponse({ data: null });
  let data = null;
  try { data = JSON.parse(row.data); } catch (e) {}
  return jsonResponse({ data, updatedAt: row.updated_at });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  if (!body || typeof body.data === "undefined") return jsonResponse({ error: "저장할 데이터가 없습니다." }, 400);

  const json = JSON.stringify(body.data);
  const now = nowSec();
  await env.DB.prepare(
    "INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, ?) " +
    "ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at"
  ).bind(auth.user.id, json, now).run();

  return jsonResponse({ ok: true, updatedAt: now });
}
