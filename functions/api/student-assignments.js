import { requireAuth, jsonResponse } from "./_utils.js";

/* GET /api/student-assignments[?profId=123] — 내가 등록한 교수들 중 하나(드롭다운으로 고른 교수,
   안 주면 기본 선택 교수 또는 첫 번째 등록 교수)의 과제 목록 + 내 제출 현황.
   응답의 professors는 내가 등록한 전체 교수 목록(드롭다운 구성용), profId는 이번 응답이 어느
   교수 기준인지를 알려준다. (2026-08-20: 학생 1명이 여러 교수를 등록할 수 있도록 확장) */
export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  const url = new URL(request.url);
  const reqProfId = Number(url.searchParams.get("profId")) || null;

  const { results: roster } = await env.DB.prepare(
    "SELECT u.id, u.name, u.school FROM student_professors sp JOIN users u ON u.id = sp.prof_id " +
    "WHERE sp.student_id = ? ORDER BY u.name"
  ).bind(auth.user.id).all();
  const professors = roster || [];

  let profId = null;
  if (reqProfId && professors.some((p) => p.id === reqProfId)) profId = reqProfId;
  else if (auth.user.profId && professors.some((p) => p.id === auth.user.profId)) profId = auth.user.profId;
  else if (professors.length) profId = professors[0].id;

  if (!profId) return jsonResponse({ profId: null, prof: null, assignments: [], professors });

  const prof = professors.find((p) => p.id === profId) || null;

  /* 2026-08-24: 수업(class) 도입 — class_id가 없는(수업 미지정) 과제는 예전처럼 전체 공개,
     class_id가 있으면 그 수업의 수강생(class_students)에게만 보인다. */
  const { results } = await env.DB.prepare(
    "SELECT a.id, a.title, a.due_at, a.open, a.created_at, c.name AS class_name " +
    "FROM assignments a LEFT JOIN classes c ON c.id = a.class_id " +
    "WHERE a.prof_id = ? AND (a.class_id IS NULL OR a.class_id IN (SELECT class_id FROM class_students WHERE student_id = ?)) " +
    "ORDER BY a.created_at DESC"
  ).bind(profId, auth.user.id).all();

  const { results: mine } = await env.DB.prepare(
    "SELECT id, assignment_id, type, submitted_at, (feedback IS NOT NULL) AS has_feedback, feedback_at " +
    "FROM submissions WHERE student_id = ? ORDER BY submitted_at DESC"
  ).bind(auth.user.id).all();

  const byAssignment = {};
  (mine || []).forEach((s) => {
    (byAssignment[s.assignment_id] = byAssignment[s.assignment_id] || []).push(s);
  });
  const assignments = (results || []).map((a) => ({ ...a, mySubmissions: byAssignment[a.id] || [] }));

  return jsonResponse({ profId, prof, assignments, professors });
}
