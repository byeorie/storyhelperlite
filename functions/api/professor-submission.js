import { requireProfessor, jsonResponse, nowSec } from "./_utils.js";

/* GET /api/professor-submission?id=123[&version=N] — 제출물 상세(원본 + 첨삭본) — 본인 과제에 속한 것만.
   버전별 저장(2026-08-20 추가): 첨삭 내용/메모는 submission_feedback_versions에 매번 새 버전으로 쌓이고,
   submissions.feedback/feedback_at은 항상 "최신 버전"의 캐시로 함께 갱신되어 과제 목록 등 기존 기능은
   그대로 동작한다. version을 안 주면 최신 버전을 돌려준다.
   이 기능 이전에 저장된 feedback(버전 테이블에 아무 행도 없는 경우)은 "버전 1"로 간주해 그대로 보여준다. */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  const wantVersion = Number(url.searchParams.get("version")) || null;

  const row = await env.DB.prepare(
    "SELECT s.id, s.assignment_id, s.type, s.project_name, s.data, s.feedback, s.submitted_at, s.feedback_at, " +
    "  u.name AS student_name, u.username AS student_username, a.title AS assignment_title, a.prof_id " +
    "FROM submissions s JOIN users u ON u.id = s.student_id JOIN assignments a ON a.id = s.assignment_id " +
    "WHERE s.id = ?"
  ).bind(id).first();
  if (!row || row.prof_id !== auth.user.id) return jsonResponse({ error: "제출물을 찾을 수 없습니다." }, 404);

  const { results: versionRows } = await env.DB.prepare(
    "SELECT version, created_at FROM submission_feedback_versions WHERE submission_id = ? ORDER BY version ASC"
  ).bind(id).all();
  let versions = (versionRows || []).map((v) => ({ version: v.version, createdAt: v.created_at }));

  let data = null;
  try { data = JSON.parse(row.data); } catch (e) {}

  let feedback = null, memos = [], viewingVersion = null;
  let latestVersion = versions.length ? versions[versions.length - 1].version : 0;

  if (!versions.length && row.feedback) {
    // 버전 테이블 도입 이전에 저장된 첨삭 — 버전 1로 간주
    try { feedback = JSON.parse(row.feedback); } catch (e) {}
    viewingVersion = 1; latestVersion = 1;
    versions = [{ version: 1, createdAt: row.feedback_at || row.submitted_at }];
  } else if (versions.length) {
    const targetVersion = wantVersion && versions.some((v) => v.version === wantVersion) ? wantVersion : latestVersion;
    const vr = await env.DB.prepare(
      "SELECT feedback, memos FROM submission_feedback_versions WHERE submission_id = ? AND version = ?"
    ).bind(id, targetVersion).first();
    if (vr) {
      try { feedback = JSON.parse(vr.feedback); } catch (e) {}
      try { memos = vr.memos ? JSON.parse(vr.memos) : []; } catch (e) {}
    }
    viewingVersion = targetVersion;
  }

  return jsonResponse({
    submission: {
      id: row.id, type: row.type, projectName: row.project_name, data, feedback, memos,
      submittedAt: row.submitted_at, feedbackAt: row.feedback_at,
      studentName: row.student_name, studentUsername: row.student_username, assignmentTitle: row.assignment_title,
      versions, viewingVersion, latestVersion,
    },
  });
}

/* POST /api/professor-submission — 첨삭 저장(=새 버전 추가)  body: { id, feedback, memos? }
   (feedback: JSON 가능한 값, memos: [{id,pairId,start,end,text}, ...] 배열, 없으면 빈 배열로 저장) */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const id = Number(body && body.id);
  if (!id || typeof body.feedback === "undefined") return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  const memos = Array.isArray(body.memos) ? body.memos : [];

  const owner = await env.DB.prepare(
    "SELECT a.prof_id FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.id = ?"
  ).bind(id).first();
  if (!owner || owner.prof_id !== auth.user.id) return jsonResponse({ error: "제출물을 찾을 수 없습니다." }, 404);

  // 이 기능 이전에 저장된 첨삭이 있는데 아직 버전 테이블에 반영 안 됐다면(레거시), 그 내용을 먼저
  // "버전 1"로 채워넣어서 지금 저장하는 내용이 그 뒤 버전으로 이어지게 한다(안 하면 예전 첨삭이 사라짐).
  const existingCount = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM submission_feedback_versions WHERE submission_id = ?"
  ).bind(id).first();
  if (!existingCount || !existingCount.n) {
    const legacy = await env.DB.prepare(
      "SELECT feedback, feedback_at, submitted_at FROM submissions WHERE id = ?"
    ).bind(id).first();
    if (legacy && legacy.feedback) {
      await env.DB.prepare(
        "INSERT INTO submission_feedback_versions (submission_id, version, feedback, memos, created_at) VALUES (?, 1, ?, '[]', ?)"
      ).bind(id, legacy.feedback, legacy.feedback_at || legacy.submitted_at).run();
    }
  }

  const maxRow = await env.DB.prepare(
    "SELECT MAX(version) AS mx FROM submission_feedback_versions WHERE submission_id = ?"
  ).bind(id).first();
  const nextVersion = (maxRow && maxRow.mx ? maxRow.mx : 0) + 1;

  const now = nowSec();
  await env.DB.prepare(
    "INSERT INTO submission_feedback_versions (submission_id, version, feedback, memos, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(id, nextVersion, JSON.stringify(body.feedback), JSON.stringify(memos), now).run();
  await env.DB.prepare(
    "UPDATE submissions SET feedback = ?, feedback_at = ? WHERE id = ?"
  ).bind(JSON.stringify(body.feedback), now, id).run();

  return jsonResponse({ ok: true, feedbackAt: now, version: nextVersion });
}
