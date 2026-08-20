import { requireProfessor, jsonResponse } from "./_utils.js";

/* GET /api/professor-students — 내 코드로 등록한 학생 명단 (교수 전용)
   2026-08-20: 학생이 여러 교수를 등록할 수 있게 되면서, users.prof_id(기본 선택 교수) 기준이 아니라
   student_professors 표(등록 전체 목록) 기준으로 조회한다 — 학생이 지금 다른 교수를 기본으로
   선택해뒀어도 내 코드로 등록한 학생이면 계속 이 명단에 나온다. */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  const { results } = await env.DB.prepare(
    "SELECT u.id, u.school, u.name, u.username, u.email, sp.joined_at AS created_at " +
    "FROM student_professors sp JOIN users u ON u.id = sp.student_id " +
    "WHERE sp.prof_id = ? ORDER BY u.name"
  ).bind(auth.user.id).all();

  return jsonResponse({ students: results || [] });
}
