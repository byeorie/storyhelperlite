import { requireAuth, jsonResponse } from "./_utils.js";

/* GET /api/student-professors — 내가 등록한 교수 목록(여러 명 가능) + 기본 선택 교수 id.
   [설정]의 등록된 강의 목록, 제출/첨삭 화면의 교수 드롭다운, 상단 툴바에서 공통으로 사용한다.
   2026-09-01: 각 교수 항목에 className(내가 그 교수의 수업 중 실제로 속한 수업명, class_students
   기준 — 여러 수업이면 쉼표로 나열, 하나도 없으면 null)을 함께 내려줘서 상단 툴바 등에서
   "강의명-교수이름" 형태로 보여줄 수 있게 한다. */
export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  const { results } = await env.DB.prepare(
    "SELECT u.id, u.name, u.school, " +
    "  (SELECT GROUP_CONCAT(cl.name, ', ') FROM class_students cs JOIN classes cl ON cl.id = cs.class_id " +
    "   WHERE cs.student_id = sp.student_id AND cl.prof_id = sp.prof_id) AS class_name " +
    "FROM student_professors sp JOIN users u ON u.id = sp.prof_id WHERE sp.student_id = ? ORDER BY u.name"
  ).bind(auth.user.id).all();
  const professors = (results || []).map((p) => ({ id: p.id, name: p.name, school: p.school, className: p.class_name || null }));
  const defaultProfId = (auth.user.profId && professors.some((p) => p.id === auth.user.profId))
    ? auth.user.profId
    : (professors[0] ? professors[0].id : null);

  return jsonResponse({ professors, defaultProfId });
}
