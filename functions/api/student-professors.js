import { requireAuth, jsonResponse } from "./_utils.js";

/* GET /api/student-professors — 내가 등록한 교수 목록(여러 명 가능) + 기본 선택 교수 id.
   [설정]의 등록된 교수 목록, 제출/첨삭 화면의 교수 드롭다운에서 공통으로 사용한다. */
export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  const { results } = await env.DB.prepare(
    "SELECT u.id, u.name, u.school FROM student_professors sp JOIN users u ON u.id = sp.prof_id " +
    "WHERE sp.student_id = ? ORDER BY u.name"
  ).bind(auth.user.id).all();
  const professors = results || [];
  const defaultProfId = (auth.user.profId && professors.some((p) => p.id === auth.user.profId))
    ? auth.user.profId
    : (professors[0] ? professors[0].id : null);

  return jsonResponse({ professors, defaultProfId });
}
