import { requireAuth, jsonResponse, ensureSubmissionSchema } from "./_utils.js";

/* GET /api/student-submission?id=123[&version=N] — 내가 제출한 것의 상세(교수 첨삭 포함) — 본인 것만.
   버전별 저장(2026-08-20 추가): version을 안 주면 최신 버전, 주면 그 버전(과거 기록)을 보여준다.
   2026-09-08: submission_feedback_versions 표가 운영 DB에 없어도(또는 조회에 실패해도) 500이 나지 않고
   submissions.feedback(최신 첨삭)을 그대로 보여주도록 방어. 예전에는 이 표가 없으면 학생이 첨삭을
   아예 열어볼 수 없었다. */
export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  await ensureSubmissionSchema(env);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  const wantVersion = Number(url.searchParams.get("version")) || null;

  const row = await env.DB.prepare(
    "SELECT s.id, s.type, s.project_name, s.data, s.feedback, s.submitted_at, s.feedback_at, s.checked_at, s.evaluation, a.title AS assignment_title " +
    "FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.id = ? AND s.student_id = ?"
  ).bind(id, auth.user.id).first();
  if (!row) return jsonResponse({ error: "제출물을 찾을 수 없습니다." }, 404);

  /* 2026-09-11: 학생이 이 첨삭을 열어봤음을 기록 — 오른쪽 위 알림 토스트가 사라지는 기준이 된다.
     (실패해도 첨삭 보기 자체는 그대로 동작해야 하므로 조용히 넘어간다) */
  try {
    await env.DB.prepare("UPDATE submissions SET feedback_seen_at = ? WHERE id = ? AND student_id = ?")
      .bind(Math.floor(Date.now() / 1000), id, auth.user.id).run();
  } catch (e) {}

  let versionRows = [];
  try {
    const r = await env.DB.prepare(
      "SELECT version, created_at FROM submission_feedback_versions WHERE submission_id = ? ORDER BY version ASC"
    ).bind(id).all();
    versionRows = r.results || [];
  } catch (e) { versionRows = []; }
  let versions = versionRows.map((v) => ({ version: v.version, createdAt: v.created_at }));

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
    let vr = null;
    try {
      vr = await env.DB.prepare(
        "SELECT feedback, memos FROM submission_feedback_versions WHERE submission_id = ? AND version = ?"
      ).bind(id, targetVersion).first();
    } catch (e) {}
    if (vr) {
      try { feedback = JSON.parse(vr.feedback); } catch (e) {}
      try { memos = vr.memos ? JSON.parse(vr.memos) : []; } catch (e) {}
    } else if (row.feedback) {
      try { feedback = JSON.parse(row.feedback); } catch (e) {}
    }
    viewingVersion = targetVersion;
  }

  return jsonResponse({
    submission: {
      id: row.id, type: row.type, projectName: row.project_name, data, feedback, memos,
      submittedAt: row.submitted_at, feedbackAt: row.feedback_at, checkedAt: row.checked_at || null,
      evaluation: row.evaluation || "",
      assignmentTitle: row.assignment_title,
      versions, viewingVersion, latestVersion,
    },
  });
}
