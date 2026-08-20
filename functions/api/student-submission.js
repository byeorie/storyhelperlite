import { requireAuth, jsonResponse } from "./_utils.js";

/* GET /api/student-submission?id=123[&version=N] — 내가 제출한 것의 상세(교수 첨삭 포함) — 본인 것만.
   버전별 저장(2026-08-20 추가): version을 안 주면 최신 버전, 주면 그 버전(과거 기록)을 보여준다.
   professor-submission.js의 GET과 같은 규칙 — 자세한 설명은 그쪽 주석 참고. */
export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  const wantVersion = Number(url.searchParams.get("version")) || null;

  const row = await env.DB.prepare(
    "SELECT s.id, s.type, s.project_name, s.data, s.feedback, s.submitted_at, s.feedback_at, a.title AS assignment_title " +
    "FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.id = ? AND s.student_id = ?"
  ).bind(id, auth.user.id).first();
  if (!row) return jsonResponse({ error: "제출물을 찾을 수 없습니다." }, 404);

  const { results: versionRows } = await env.DB.prepare(
    "SELECT version, created_at FROM submission_feedback_versions WHERE submission_id = ? ORDER BY version ASC"
  ).bind(id).all();
  let versions = (versionRows || []).map((v) => ({ version: v.version, createdAt: v.created_at }));

  let data = null;
  try { data = JSON.parse(row.data); } catch (e) {}

  let feedback = null, memos = [], viewingVersion = null;
  let latestVersion = versions.length ? versions[versions.length - 1].version : 0;

  if (!versions.length && row.feedback) {
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
      submittedAt: row.submitted_at, feedbackAt: row.feedback_at, assignmentTitle: row.assignment_title,
      versions, viewingVersion, latestVersion,
    },
  });
}
