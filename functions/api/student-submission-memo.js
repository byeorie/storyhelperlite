import { requireAuth, jsonResponse } from "./_utils.js";

/* POST /api/student-submission-memo — 학생이 자기 제출물에 달린 교수님 메모를 하나 지운다.
   body: { id: 제출물 id, version: 그 메모가 들어있는 버전 번호, memoId }
   (첨삭 텍스트 자체는 학생이 못 고치지만, 메모는 학생이 직접 지울 수 있다는 요구사항 — 2026-08-20 추가)
   버전 테이블 도입 이전의 "레거시 버전 1"은 애초에 메모가 있을 수 없으므로 그 경우는 404로 처리해도 안전. */
export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const id = Number(body && body.id);
  const version = Number(body && body.version);
  const memoId = body && body.memoId;
  if (!id || !version || !memoId) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const owner = await env.DB.prepare("SELECT student_id FROM submissions WHERE id = ?").bind(id).first();
  if (!owner || owner.student_id !== auth.user.id) return jsonResponse({ error: "제출물을 찾을 수 없습니다." }, 404);

  const vr = await env.DB.prepare(
    "SELECT memos FROM submission_feedback_versions WHERE submission_id = ? AND version = ?"
  ).bind(id, version).first();
  if (!vr) return jsonResponse({ error: "해당 버전을 찾을 수 없습니다." }, 404);

  let memos = [];
  try { memos = vr.memos ? JSON.parse(vr.memos) : []; } catch (e) {}
  const next = memos.filter((m) => m.id !== memoId);

  await env.DB.prepare(
    "UPDATE submission_feedback_versions SET memos = ? WHERE submission_id = ? AND version = ?"
  ).bind(JSON.stringify(next), id, version).run();

  return jsonResponse({ ok: true });
}
