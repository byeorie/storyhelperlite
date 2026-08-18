import { requireProfessor, jsonResponse } from "./_utils.js";

/* GET /api/professor-students — 내 코드로 가입한 학생 명단 (교수 전용) */
export async function onRequestGet({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);

  const { results } = await env.DB.prepare(
    "SELECT id, school, name, username, email, created_at FROM users WHERE prof_id = ? ORDER BY name"
  ).bind(auth.user.id).all();

  return jsonResponse({ students: results || [] });
}
