import { requireAuth, jsonResponse, listStudentClasses, pickDefaultClassEntry } from "./_utils.js";

/* GET /api/student-assignments[?classId=123 | ?profId=45] — 상단 툴바에서 고른 "수업"(또는 옛 방식
   등록이면 교수) 기준 과제 목록 + 내 제출 현황. 둘 다 안 주면 기본 선택(등록된 것 중 users.prof_id와
   일치하는 항목 우선, 없으면 첫 번째)을 쓴다.
   2026-09-03: 기존엔 profId 하나로만 걸러서, 같은 교수님의 수업을 2개 이상 등록한 학생은 어느 수업을
   골라도 그 교수님의 모든 수업 과제가 섞여서 나왔다(사실상 "수업 선택"이 아니라 "교수 선택"이었던
   버그). classId가 오면 그 수업에 딸린 과제(a.class_id = classId)와 수업 미지정(전체 공개) 과제만
   내려주도록 바꿨다. classId 없이 profId만 오는 경우는 수업 코드 도입 이전에 교수 단위로만 등록된
   옛 학생을 위한 것으로, 그때처럼 수업 미지정 과제만 보여준다. */
export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  const url = new URL(request.url);
  const reqClassId = Number(url.searchParams.get("classId")) || null;
  const reqProfId = Number(url.searchParams.get("profId")) || null;

  let profId = null, classId = null, prof = null;

  if (reqClassId) {
    const cls = await env.DB.prepare(
      "SELECT cl.id, cl.name, cl.prof_id, u.name AS prof_name, u.school AS prof_school " +
      "FROM classes cl JOIN users u ON u.id = cl.prof_id " +
      "WHERE cl.id = ? AND cl.id IN (SELECT class_id FROM class_students WHERE student_id = ?)"
    ).bind(reqClassId, auth.user.id).first();
    if (cls) { classId = cls.id; profId = cls.prof_id; prof = { id: cls.prof_id, name: cls.prof_name, school: cls.prof_school }; }
  }
  if (!profId && reqProfId) {
    const p = await env.DB.prepare(
      "SELECT u.id, u.name, u.school FROM student_professors sp JOIN users u ON u.id = sp.prof_id " +
      "WHERE sp.student_id = ? AND sp.prof_id = ?"
    ).bind(auth.user.id, reqProfId).first();
    if (p) { profId = p.id; prof = p; }
  }
  if (!profId) {
    const list = await listStudentClasses(env, auth.user.id);
    const def = pickDefaultClassEntry(list, auth.user.profId);
    if (def) { profId = def.profId; classId = def.classId; prof = { id: def.profId, name: def.profName, school: def.profSchool }; }
  }

  if (!profId) return jsonResponse({ profId: null, classId: null, prof: null, assignments: [] });

  /* 2026-08-24: 수업(class) 도입 — class_id가 없는(수업 미지정) 과제는 예전처럼 전체 공개,
     class_id가 있으면 지금 고른 그 수업의 과제만 보여준다(다른 수업 과제는 섞이지 않음). */
  const query = classId
    ? "SELECT a.id, a.title, a.due_at, a.open, a.created_at, c.name AS class_name " +
      "FROM assignments a LEFT JOIN classes c ON c.id = a.class_id " +
      "WHERE a.prof_id = ? AND (a.class_id = ? OR a.class_id IS NULL) ORDER BY a.created_at DESC"
    : "SELECT a.id, a.title, a.due_at, a.open, a.created_at, c.name AS class_name " +
      "FROM assignments a LEFT JOIN classes c ON c.id = a.class_id " +
      "WHERE a.prof_id = ? AND a.class_id IS NULL ORDER BY a.created_at DESC";
  const stmt = classId ? env.DB.prepare(query).bind(profId, classId) : env.DB.prepare(query).bind(profId);
  const { results } = await stmt.all();

  const { results: mine } = await env.DB.prepare(
    "SELECT id, assignment_id, type, submitted_at, (feedback IS NOT NULL) AS has_feedback, feedback_at " +
    "FROM submissions WHERE student_id = ? ORDER BY submitted_at DESC"
  ).bind(auth.user.id).all();

  const byAssignment = {};
  (mine || []).forEach((s) => {
    (byAssignment[s.assignment_id] = byAssignment[s.assignment_id] || []).push(s);
  });
  const assignments = (results || []).map((a) => ({ ...a, mySubmissions: byAssignment[a.id] || [] }));

  return jsonResponse({ profId, classId, prof, assignments });
}
