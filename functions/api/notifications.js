import { requireAuth, jsonResponse, nowSec, ensureSubmissionSchema } from "./_utils.js";

/* ===== 제출 / 첨삭 알림 (2026-09-11 추가) =====
   화면 오른쪽 위(상단바 아래)에 토스트 팝업으로 띄울 알림 목록을 내려준다.
   앱이 20초마다 이 API를 불러서 "가능한 실시간"으로 알림을 갱신한다.

   - 교수: 내가 낸 과제 중 "아직 확인하지 않은(checked_at 없음 · 첨삭도 없음)" 제출물을
           과제 단위로 묶어서 [과목명-과제명 제출 n개] 형태로 내려준다.
           제출물을 "과제 확인"하거나 첨삭을 전달하면 그 건은 자동으로 목록에서 빠진다.
   - 학생: 교수님이 첨삭을 전달했거나(feedback_at) 과제 확인 표시를 한(checked_at) 제출물 중
           내가 아직 열어보지 않은 것(feedback_seen_at이 없거나 그보다 오래된 것)을 내려준다.
           학생이 첨삭 상세 화면을 열면 student-submission.js가 feedback_seen_at을 찍어준다.

   토스트의 [x] 버튼은 교수 쪽에서는 브라우저에만 기억되고(그 과제에 새 제출이 또 들어오면 다시 뜬다),
   학생 쪽에서는 아래 POST로 "확인함"을 서버에 남긴다(다른 컴퓨터에서도 다시 뜨지 않게). */

export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  await ensureSubmissionSchema(env);

  const isProf = auth.user.role === "professor";

  try {
    if (isProf) {
      const { results } = await env.DB.prepare(
        "SELECT a.id AS assignment_id, a.title AS assignment_title, a.class_id, c.name AS class_name, " +
        "  COUNT(*) AS cnt, MAX(s.id) AS last_id, MAX(s.submitted_at) AS last_at " +
        "FROM submissions s JOIN assignments a ON a.id = s.assignment_id " +
        "LEFT JOIN classes c ON c.id = a.class_id " +
        "WHERE a.prof_id = ? AND s.checked_at IS NULL AND s.feedback IS NULL " +
        "GROUP BY a.id ORDER BY last_at DESC LIMIT 20"
      ).bind(auth.user.id).all();

      const items = (results || []).map((r) => ({
        key: "a" + r.assignment_id,
        kind: "submission",
        assignmentId: r.assignment_id,
        classId: r.class_id || null,
        className: r.class_name || "수업 미지정",
        assignmentTitle: r.assignment_title,
        count: r.cnt,
        lastId: r.last_id,
        lastAt: r.last_at,
      }));
      return jsonResponse({ role: "professor", items });
    }

    /* 학생 — 첨삭/확인이 도착했지만 아직 열어보지 않은 제출물 */
    const { results } = await env.DB.prepare(
      "SELECT s.id, s.type, s.assignment_id, s.feedback_at, s.checked_at, " +
      "  (s.feedback IS NOT NULL) AS has_feedback, a.title AS assignment_title, c.name AS class_name " +
      "FROM submissions s JOIN assignments a ON a.id = s.assignment_id " +
      "LEFT JOIN classes c ON c.id = a.class_id " +
      "WHERE s.student_id = ? AND (s.feedback_at IS NOT NULL OR s.checked_at IS NOT NULL) " +
      "  AND (s.feedback_seen_at IS NULL OR s.feedback_seen_at < MAX(COALESCE(s.feedback_at,0), COALESCE(s.checked_at,0))) " +
      "ORDER BY MAX(COALESCE(s.feedback_at,0), COALESCE(s.checked_at,0)) DESC LIMIT 20"
    ).bind(auth.user.id).all();

    const items = (results || []).map((r) => ({
      key: "s" + r.id,
      kind: r.has_feedback ? "feedback" : "checked",
      submissionId: r.id,
      type: r.type,
      assignmentId: r.assignment_id,
      className: r.class_name || "수업 미지정",
      assignmentTitle: r.assignment_title,
      count: 1,
      lastAt: Math.max(r.feedback_at || 0, r.checked_at || 0),
    }));
    return jsonResponse({ role: "student", items });
  } catch (e) {
    /* 알림은 부가 기능이므로, 표/컬럼이 아직 없는 DB에서도 앱이 멈추지 않도록 빈 목록으로 응답 */
    return jsonResponse({ role: isProf ? "professor" : "student", items: [] });
  }
}

/* POST /api/notifications — 학생이 알림을 확인(또는 [x]로 닫음)했음을 기록
   body: { ids: [제출물 id, ...] } */
export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  await ensureSubmissionSchema(env);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const ids = Array.isArray(body && body.ids) ? body.ids.map(Number).filter(Boolean).slice(0, 50) : [];
  if (!ids.length) return jsonResponse({ ok: true, updated: 0 });

  const now = nowSec();
  const marks = ids.map(() => "?").join(",");
  try {
    await env.DB.prepare(
      "UPDATE submissions SET feedback_seen_at = ? WHERE student_id = ? AND id IN (" + marks + ")"
    ).bind(now, auth.user.id, ...ids).run();
  } catch (e) {
    return jsonResponse({ ok: false, error: "알림 확인 표시를 저장하지 못했습니다." }, 500);
  }
  return jsonResponse({ ok: true, updated: ids.length, seenAt: now });
}
