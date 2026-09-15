import { requireAuth, jsonResponse, nowSec, wipeIfDue } from "./_utils.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  // 매년 3/1, 9/1 기준일이 지나면 계정(users) 정보만 남기고 나머지 서버 데이터를 조회 시점에 정리
  // (요청이 들어올 때마다 확인 — wipeIfDue() 설명 참고, 같은 반기 동안은 한 번만 실행됨)
  // (2026-09-08) 정리 작업이 실패해도 데이터 조회는 반드시 정상 응답하도록 감싼다 —
  // 여기서 오류가 나면 로그인해도 작품을 못 불러오는 심각한 문제가 된다(_utils.js wipeIfDue 주석 참고)
  try { await wipeIfDue(env); } catch (e) {}

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
  /* (2026-09-15) 내용이 이전과 똑같으면 아예 쓰지 않는다(WHERE 절) — Cloudflare D1은 "쓴 행" 수로
     무료 한도를 계산하므로, 바뀐 것이 없는 저장 요청까지 매번 기록하면 한도를 헛되이 소모한다.
     클라이언트(auth.js)도 같은 내용이면 요청 자체를 보내지 않지만, 여러 기기나 예전 버전 화면에서
     오는 요청까지 막으려면 서버에도 이 장치가 있어야 한다. */
  await env.DB.prepare(
    "INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, ?) " +
    "ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at " +
    "WHERE user_data.data <> excluded.data"
  ).bind(auth.user.id, json, now).run();

  return jsonResponse({ ok: true, updatedAt: now });
}
