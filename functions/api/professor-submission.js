import { requireProfessor, jsonResponse, nowSec, ensureSubmissionSchema } from "./_utils.js";

/* 첨삭 버전 목록/내용 읽기 — submission_feedback_versions 표가 없거나 조회에 실패해도 예외를 밖으로
   던지지 않고 "버전 없음"으로 돌려준다. 예전에는 이 표가 운영 DB에 없으면 제출물 상세 조회 자체가
   500으로 실패해서 교수가 제출물을 아예 열 수 없었다(2026-09-08 수정). */
async function readFeedbackVersions(env, id, wantVersion, row) {
  let versionRows = [];
  try {
    const r = await env.DB.prepare(
      "SELECT version, created_at FROM submission_feedback_versions WHERE submission_id = ? ORDER BY version ASC"
    ).bind(id).all();
    versionRows = r.results || [];
  } catch (e) { versionRows = []; }

  let versions = versionRows.map((v) => ({ version: v.version, createdAt: v.created_at }));
  let feedback = null, memos = [], viewingVersion = null;
  let latestVersion = versions.length ? versions[versions.length - 1].version : 0;

  if (!versions.length && row.feedback) {
    // 버전 표 도입 이전(또는 표가 없던 기간)에 저장된 첨삭 — 버전 1로 간주
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
  return { versions, feedback, memos, viewingVersion, latestVersion };
}

/* GET /api/professor-submission?id=123[&version=N] — 제출물 상세(원본 + 첨삭본) — 본인 과제에 속한 것만.
   버전별 저장(2026-08-20 추가): 첨삭 내용/메모는 submission_feedback_versions에 매번 새 버전으로 쌓이고,
   submissions.feedback/feedback_at은 항상 "최신 버전"의 캐시로 함께 갱신되어 과제 목록 등 기존 기능은
   그대로 동작한다. version을 안 주면 최신 버전을 돌려준다. */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);
  await ensureSubmissionSchema(env);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  const wantVersion = Number(url.searchParams.get("version")) || null;

  const row = await env.DB.prepare(
    "SELECT s.id, s.assignment_id, s.type, s.project_name, s.data, s.feedback, s.submitted_at, s.feedback_at, s.checked_at, s.evaluation, " +
    "  u.name AS student_name, u.username AS student_username, a.title AS assignment_title, a.prof_id " +
    "FROM submissions s JOIN users u ON u.id = s.student_id JOIN assignments a ON a.id = s.assignment_id " +
    "WHERE s.id = ?"
  ).bind(id).first();
  if (!row || row.prof_id !== auth.user.id) return jsonResponse({ error: "제출물을 찾을 수 없습니다." }, 404);

  let data = null;
  try { data = JSON.parse(row.data); } catch (e) {}

  const v = await readFeedbackVersions(env, id, wantVersion, row);

  return jsonResponse({
    submission: {
      id: row.id, type: row.type, projectName: row.project_name, data,
      feedback: v.feedback, memos: v.memos,
      submittedAt: row.submitted_at, feedbackAt: row.feedback_at, checkedAt: row.checked_at || null,
      evaluation: row.evaluation || "",
      studentName: row.student_name, studentUsername: row.student_username, assignmentTitle: row.assignment_title,
      versions: v.versions, viewingVersion: v.viewingVersion, latestVersion: v.latestVersion,
    },
  });
}

/* POST /api/professor-submission — 첨삭 저장(=새 버전 추가)  body: { id, feedback, memos?, evaluation? }
   2026-09-10: "평가"(총평) 추가. feedback 없이 evaluation만 보내면 새 첨삭 버전을 만들지 않고
   총평만 갱신한다(콘티처럼 "피드백 전달" 버튼이 없는 화면에서도 총평을 남길 수 있게).
   (feedback: JSON 가능한 값, memos: [{id,pairId,start,end,text}, ...] 배열, 없으면 빈 배열로 저장)

   2026-09-08: 버전 표에 기록하는 단계가 실패해도 submissions.feedback(최신 첨삭 본문) 갱신은 반드시
   수행하도록 순서를 바꿨다. 예전에는 버전 표가 없으면 여기서 예외가 나서 첨삭이 아예 저장되지 않았고,
   교수 화면에는 "저장에 실패했습니다"만 떴다. 이제는 어떤 경우에도 첨삭 본문은 서버에 남는다.
   또 첨삭을 저장하면 "과제 확인"도 자동으로 된 것으로 표시한다. */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);
  await ensureSubmissionSchema(env);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const id = Number(body && body.id);
  const hasEvaluation = typeof body.evaluation === "string";
  /* 2026-09-11: "피드백 전달"만 누른 경우(콘티처럼 그림을 그릴 때마다 이미 저장된 타입).
     새 버전을 만들지 않고, 지금까지 저장된 첨삭을 "학생에게 보냄"으로 표시(=feedback_at 갱신)만 한다. */
  const wantDeliver = body.deliver === true;
  if (!id || (typeof body.feedback === "undefined" && !hasEvaluation && !wantDeliver)) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  const memos = Array.isArray(body.memos) ? body.memos : [];

  const owner = await env.DB.prepare(
    "SELECT a.prof_id FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.id = ?"
  ).bind(id).first();
  if (!owner || owner.prof_id !== auth.user.id) return jsonResponse({ error: "제출물을 찾을 수 없습니다." }, 404);

  const now = nowSec();

  /* 총평 저장 — 컬럼이 아직 없는 DB에서도 첨삭 저장까지 막지 않도록 따로 감싼다 */
  if (hasEvaluation) {
    try {
      await env.DB.prepare("UPDATE submissions SET evaluation = ? WHERE id = ?").bind(body.evaluation, id).run();
    } catch (e) {}
  }

  /* 첨삭 본문 없이 들어온 요청 — 평가만 저장했거나, "피드백 전달"만 누른 경우 */
  if (typeof body.feedback === "undefined") {
    let delivered = false;
    try {
      if (wantDeliver) {
        /* 그려둔 첨삭이 있을 때만 "전달 시각"을 새로 찍는다(그래야 학생 화면에 알림이 뜬다).
           아직 아무것도 그리지 않았다면 평가 저장 + 확인 표시까지만 한다. */
        await env.DB.prepare(
          "UPDATE submissions SET feedback_at = CASE WHEN feedback IS NOT NULL THEN ? ELSE feedback_at END, " +
          "checked_at = COALESCE(checked_at, ?) WHERE id = ?"
        ).bind(now, now, id).run();
        const row = await env.DB.prepare("SELECT (feedback IS NOT NULL) AS hasFb FROM submissions WHERE id = ?").bind(id).first();
        delivered = !!(row && row.hasFb);
      } else {
        await env.DB.prepare("UPDATE submissions SET checked_at = COALESCE(checked_at, ?) WHERE id = ?").bind(now, id).run();
      }
    } catch (e) {}
    return jsonResponse({ ok: true, evaluationOnly: !wantDeliver, delivered, checkedAt: now, feedbackAt: delivered ? now : null });
  }

  const feedbackJson = JSON.stringify(body.feedback);

  /* (1) 버전 이력 남기기 — 실패해도 아래 (2)는 반드시 실행되므로 첨삭 자체는 저장된다. */
  let nextVersion = 1;
  try {
    // 버전 표가 비어있는데 예전 첨삭이 남아있으면 그것을 먼저 "버전 1"로 채워 넣는다(안 하면 이력이 끊김)
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
    nextVersion = (maxRow && maxRow.mx ? maxRow.mx : 0) + 1;
    await env.DB.prepare(
      "INSERT INTO submission_feedback_versions (submission_id, version, feedback, memos, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, nextVersion, feedbackJson, JSON.stringify(memos), now).run();
  } catch (e) {
    // 버전 이력만 못 남긴 상태 — 아래에서 첨삭 본문은 그대로 저장된다
  }

  /* (2) "최신 첨삭 본문" 저장 — 이것만 성공하면 학생은 피드백을 받아볼 수 있다(가장 중요).
     checked_at 컬럼이 아직 없는 DB에서도 실패하지 않도록 2단계로 나눠 시도한다. */
  try {
    await env.DB.prepare(
      "UPDATE submissions SET feedback = ?, feedback_at = ?, checked_at = COALESCE(checked_at, ?) WHERE id = ?"
    ).bind(feedbackJson, now, now, id).run();
  } catch (e) {
    await env.DB.prepare(
      "UPDATE submissions SET feedback = ?, feedback_at = ? WHERE id = ?"
    ).bind(feedbackJson, now, id).run();
  }

  return jsonResponse({ ok: true, feedbackAt: now, checkedAt: now, version: nextVersion });
}
