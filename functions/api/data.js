import { requireAuth, jsonResponse, nowSec, wipeIfDue, snapshotUserData } from "./_utils.js";

/* ===== (2026-11-18) 저장 버전(rev) — "다시 접속하면 글이 사라진다" 문제의 근본 수정 =====
   예전에는 POST /api/data가 받은 내용을 무조건 덮어썼다. 그래서 학생이
   (1) 실습실 PC에 열어둔 채로 둔 예전 탭, (2) 같은 브라우저의 두 번째 탭, (3) 휴대폰 등
   "예전 내용을 들고 있는 화면"에서 아무 조작이나 한 번 하면(save()는 탭 전환에도 불린다) 그 예전 내용이
   다른 곳에서 새로 쓴 글을 통째로 덮어써 버렸다. 저장 자체는 매번 "저장됨"으로 성공하므로 아무도 눈치채지 못했다.
   이제 user_data에 rev(저장할 때마다 1씩 오르는 번호)를 두고, 클라이언트는 "내가 마지막으로 본 rev(baseRev)"를
   함께 보낸다. 서버의 rev가 그보다 앞서 있으면(=그사이 다른 화면이 저장함) 덮어쓰지 않고 409와 함께 최신 내용을
   돌려준다 → 클라이언트(auth.js)가 두 내용을 합친 뒤 다시 저장한다.
   baseRev가 없는 요청(이번 수정 전의 예전 화면이 아직 열려 있는 경우)도 같은 이유로 거절한다 — 그 화면의 내용은
   그 브라우저에 남아 있고, 새로고침하면 새 화면이 서버 내용과 합쳐서 올린다. */
let revColumnEnsured = false;
async function ensureRevColumn(env) {
  if (revColumnEnsured) return;
  try { await env.DB.prepare("ALTER TABLE user_data ADD COLUMN rev INTEGER").run(); } catch (e) {}
  revColumnEnsured = true;
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  await ensureRevColumn(env);

  // 매년 3/1, 9/1 기준일이 지나면 계정(users) 정보만 남기고 나머지 서버 데이터를 조회 시점에 정리
  // (요청이 들어올 때마다 확인 — wipeIfDue() 설명 참고, 같은 반기 동안은 한 번만 실행됨)
  // (2026-09-08) 정리 작업이 실패해도 데이터 조회는 반드시 정상 응답하도록 감싼다 —
  // 여기서 오류가 나면 로그인해도 작품을 못 불러오는 심각한 문제가 된다(_utils.js wipeIfDue 주석 참고)
  try { await wipeIfDue(env); } catch (e) {}

  /* ?meta=1: 내용 없이 rev만 — 화면으로 돌아왔을 때 "그사이 다른 곳에서 저장됐는지"만 가볍게 확인하는 용도 */
  const metaOnly = new URL(request.url).searchParams.get("meta") === "1";
  if (metaOnly) {
    const m = await env.DB.prepare("SELECT rev, updated_at FROM user_data WHERE user_id = ?")
      .bind(auth.user.id).first();
    return jsonResponse({ rev: m ? (m.rev || 0) : 0, updatedAt: m ? m.updated_at : null, exists: !!m });
  }

  /* (2026-11-24) 접속해서 작품을 불러갈 때도 지금 상태를 보관한다(1시간에 한 번) — 예전에는 새로 저장할 때만 보관해서,
     배포 뒤 아직 저장하지 않은 학생은 보관본이 하나도 없었다. 실패해도 불러오기는 계속한다. */
  await snapshotUserData(env, auth.user.id, "auto", false);

  const row = await env.DB.prepare(
    "SELECT data, updated_at, rev FROM user_data WHERE user_id = ?"
  ).bind(auth.user.id).first();

  if (!row) return jsonResponse({ data: null, rev: 0 });
  let data = null;
  try { data = JSON.parse(row.data); } catch (e) {}
  return jsonResponse({ data, updatedAt: row.updated_at, rev: row.rev || 0 });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  await ensureRevColumn(env);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  if (!body || typeof body.data === "undefined") return jsonResponse({ error: "저장할 데이터가 없습니다." }, 400);

  const baseRev = Number.isInteger(body.baseRev) && body.baseRev >= 0 ? body.baseRev : null;
  if (baseRev === null) {
    // 예전 화면(이번 수정 전 app.js)에서 온 저장 — 최신 내용을 덮어쓸 수 있으므로 받지 않는다(위 설명 참고)
    return jsonResponse({
      error: "화면이 예전 버전입니다. 새로고침(F5)한 뒤 다시 저장해주세요.",
      conflict: true, outdatedClient: true,
    }, 409);
  }

  const json = JSON.stringify(body.data);
  const now = nowSec();
  /* (2026-11-24) 덮어쓰기 직전 상태를 이전 버전으로 보관(1시간에 한 번) — 관리자 화면에서 학생별로 되돌릴 수 있다(_utils.js snapshotUserData) */
  await snapshotUserData(env, auth.user.id, "auto", false);
  /* (2026-09-15) 내용이 이전과 똑같으면 아예 쓰지 않는다 — D1 "쓴 행" 한도 절약.
     (2026-11-18) 서버의 rev가 baseRev와 같을 때만 덮어쓴다(그사이 다른 화면이 저장했으면 쓰지 않음).
     한 문장(upsert)으로 비교와 쓰기를 함께 하므로 두 요청이 동시에 와도 둘 다 덮어쓰는 일은 없다.
     기존 행의 rev는 NULL이므로 0으로 본다. */
  const res = await env.DB.prepare(
    "INSERT INTO user_data (user_id, data, updated_at, rev) VALUES (?, ?, ?, 1) " +
    "ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, " +
    "rev = COALESCE(user_data.rev, 0) + 1 " +
    "WHERE COALESCE(user_data.rev, 0) = ? AND user_data.data <> excluded.data " +
    "RETURNING rev"
  ).bind(auth.user.id, json, now, baseRev).all();

  const written = res && Array.isArray(res.results) && res.results[0];
  if (written) return jsonResponse({ ok: true, updatedAt: now, rev: written.rev });

  // 쓰지 않은 경우: (a) 내용이 이미 같음(정상) 또는 (b) 그사이 다른 화면이 저장함(충돌)
  const cur = await env.DB.prepare("SELECT data, updated_at, rev FROM user_data WHERE user_id = ?")
    .bind(auth.user.id).first();
  const curRev = cur ? (cur.rev || 0) : 0;
  if (cur && cur.data === json) return jsonResponse({ ok: true, updatedAt: cur.updated_at, rev: curRev });
  if (cur && curRev !== baseRev) {
    let data = null;
    try { data = JSON.parse(cur.data); } catch (e) {}
    return jsonResponse({ error: "다른 화면에서 먼저 저장된 내용이 있습니다.", conflict: true, rev: curRev, data }, 409);
  }
  return jsonResponse({ error: "저장하지 못했습니다." }, 500);
}
