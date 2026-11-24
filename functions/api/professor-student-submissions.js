import { requireProfessor, jsonResponse, ensureSubmissionSchema, ensureAssignmentSchema } from "./_utils.js";

/* GET /api/professor-student-submissions — [과제 관리] "학생별" 보기용 (2026-11-24, 교수 전용)
   과제 폴더마다 professor-assignment?id= 를 따로 부르지 않고, 내 과제에 들어온 제출물 전체를 한 번에
   학생 기준으로 묶어 볼 수 있게 내려준다. 화면 쪽에서 학생 → 과제 폴더 → 차수 순서로 묶는다.
   - students    : 내 코드로 등록한 학생(student_professors) + 등록은 풀렸어도 내 과제에 제출한 적 있는 학생
   - memberships : [{class_id, student_id}] — 내 수업의 수강생 배정(분반 필터용)
   - submissions : 내 과제(assignments.prof_id = 나)의 제출물만. 본문(content)·첨삭 내용은 보내지 않는다.
   컬럼이 늦게 추가된 DB(submit_round, checked_at, score)에서도 목록은 열리도록 단계별로 물러선다
   (professor-assignment GET과 같은 방식 — 2026-09-08 GET 500 교훈). */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  await ensureSubmissionSchema(env);
  await ensureAssignmentSchema(env);
  const profId = auth.user.id;

  const BASE =
    "SELECT s.id, s.assignment_id, s.student_id, s.type, s.project_name, s.submitted_at, s.feedback_at, s.checked_at, s.submit_round, " +
    "  (s.feedback IS NOT NULL) AS has_feedback " +
    "FROM submissions s JOIN assignments a ON a.id = s.assignment_id " +
    "WHERE a.prof_id = ? ORDER BY s.submitted_at DESC";
  let submissions = [];
  try {
    submissions = (await env.DB.prepare(BASE).bind(profId).all()).results || [];
  } catch (e) {
    try {
      submissions = (await env.DB.prepare(BASE.replace("s.checked_at, s.submit_round,", "s.checked_at,")).bind(profId).all()).results || [];
    } catch (e2) {
      submissions = (await env.DB.prepare(BASE.replace("s.feedback_at, s.checked_at, s.submit_round,", "s.feedback_at,")).bind(profId).all()).results || [];
    }
  }

  /* 점수는 따로 — score 컬럼이 없는 DB에서도 목록은 열려야 한다 */
  const scoreMap = {};
  try {
    const sr = await env.DB.prepare(
      "SELECT s.id, s.score FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE a.prof_id = ?"
    ).bind(profId).all();
    (sr.results || []).forEach((x) => { scoreMap[x.id] = x.score; });
  } catch (e) {}
  submissions.forEach((s) => {
    const sc = scoreMap[s.id];
    s.score = (sc === undefined || sc === null) ? null : sc;
    s.checked_at = s.checked_at || null;
    s.submit_round = s.submit_round || null;
  });

  /* 학생 명단 */
  const students = new Map();
  try {
    const { results } = await env.DB.prepare(
      "SELECT u.id, u.name, u.username FROM student_professors sp JOIN users u ON u.id = sp.student_id WHERE sp.prof_id = ?"
    ).bind(profId).all();
    (results || []).forEach((u) => students.set(u.id, { id: u.id, name: u.name, username: u.username, registered: true }));
  } catch (e) {}
  const missing = [...new Set(submissions.map((s) => s.student_id))].filter((id) => !students.has(id));
  for (let i = 0; i < missing.length; i += 90) {
    const chunk = missing.slice(i, i + 90);
    try {
      const { results } = await env.DB.prepare(
        "SELECT id, name, username FROM users WHERE id IN (" + chunk.map(() => "?").join(",") + ")"
      ).bind(...chunk).all();
      (results || []).forEach((u) => students.set(u.id, { id: u.id, name: u.name, username: u.username, registered: false }));
    } catch (e) {}
  }

  /* 분반 배정 */
  let memberships = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT cs.class_id, cs.student_id FROM class_students cs JOIN classes cl ON cl.id = cs.class_id WHERE cl.prof_id = ?"
    ).bind(profId).all();
    memberships = results || [];
  } catch (e) {}

  const list = [...students.values()].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ko"));
  return jsonResponse({ students: list, memberships, submissions });
}
