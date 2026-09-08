import { requireProfessor, jsonResponse, ensureSubmissionSchema } from "./_utils.js";

const TYPE_LABEL = { plan: "기획서", plot: "플롯", write: "글쓰기", character: "캐릭터 설정", background: "배경 설정", event: "사건 설정", storyboard: "콘티" };

/* GET /api/professor-assignment?id=123 — 해당 과제 폴더의 제출 목록 (교수 전용, 본인 과제만) */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  await ensureSubmissionSchema(env);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const assignment = await env.DB.prepare(
    "SELECT id, title, due_at, open, created_at FROM assignments WHERE id = ? AND prof_id = ?"
  ).bind(id, auth.user.id).first();
  if (!assignment) return jsonResponse({ error: "과제를 찾을 수 없습니다." }, 404);

  /* 2026-09-08: 예전에는 제출 목록 한 쿼리 안에서 submission_feedback_versions를 서브쿼리로 세었기 때문에,
     그 표가 운영 DB에 없으면 "제출함" 화면 전체가 열리지 않았다(500). 이제 본 목록과 버전 수 집계를
     분리하고, 집계는 실패해도 그냥 0으로 두고 넘어간다. checked_at(과제 확인)도 컬럼이 없는 DB를
     대비해 2단계로 시도한다. */
  let results = [];
  try {
    const r = await env.DB.prepare(
      "SELECT s.id, s.type, s.project_name, s.submitted_at, s.feedback_at, s.checked_at, " +
      "  (s.feedback IS NOT NULL) AS has_feedback, u.name AS student_name, u.username AS student_username " +
      "FROM submissions s JOIN users u ON u.id = s.student_id " +
      "WHERE s.assignment_id = ? ORDER BY s.submitted_at DESC"
    ).bind(id).all();
    results = r.results || [];
  } catch (e) {
    const r = await env.DB.prepare(
      "SELECT s.id, s.type, s.project_name, s.submitted_at, s.feedback_at, " +
      "  (s.feedback IS NOT NULL) AS has_feedback, u.name AS student_name, u.username AS student_username " +
      "FROM submissions s JOIN users u ON u.id = s.student_id " +
      "WHERE s.assignment_id = ? ORDER BY s.submitted_at DESC"
    ).bind(id).all();
    results = r.results || [];
  }

  const versionCounts = {};
  try {
    const vr = await env.DB.prepare(
      "SELECT v.submission_id AS sid, COUNT(*) AS n FROM submission_feedback_versions v " +
      "JOIN submissions s ON s.id = v.submission_id WHERE s.assignment_id = ? GROUP BY v.submission_id"
    ).bind(id).all();
    (vr.results || []).forEach((x) => { versionCounts[x.sid] = x.n; });
  } catch (e) {}

  const submissions = results.map((r) => ({
    ...r,
    checked_at: r.checked_at || null,
    version_count: versionCounts[r.id] || 0,
    type_label: TYPE_LABEL[r.type] || r.type,
  }));
  return jsonResponse({ assignment, submissions });
}

/* DELETE /api/professor-assignment?id=123 — 과제 폴더 삭제 (본인 과제만, 제출물도 함께 영구 삭제) */
export async function onRequestDelete({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const assignment = await env.DB.prepare(
    "SELECT id FROM assignments WHERE id = ? AND prof_id = ?"
  ).bind(id, auth.user.id).first();
  if (!assignment) return jsonResponse({ error: "과제를 찾을 수 없습니다." }, 404);

  /* 2026-09-08: 첨삭 버전 이력도 함께 지운다(예전에는 제출물만 지워 이력 행이 계속 남았다) */
  try {
    await env.DB.prepare(
      "DELETE FROM submission_feedback_versions WHERE submission_id IN (SELECT id FROM submissions WHERE assignment_id = ?)"
    ).bind(id).run();
  } catch (e) {}
  await env.DB.prepare("DELETE FROM submissions WHERE assignment_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM assignments WHERE id = ? AND prof_id = ?").bind(id, auth.user.id).run();

  return jsonResponse({ ok: true });
}

/* POST /api/professor-assignment — 과제 마감 스위치 토글  body: { id, open: 0|1 } */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const id = Number(body && body.id);
  const open = (body && body.open) ? 1 : 0;
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  const result = await env.DB.prepare(
    "UPDATE assignments SET open = ? WHERE id = ? AND prof_id = ?"
  ).bind(open, id, auth.user.id).run();
  if (!result.meta.changes) return jsonResponse({ error: "과제를 찾을 수 없습니다." }, 404);

  return jsonResponse({ ok: true, open });
}
