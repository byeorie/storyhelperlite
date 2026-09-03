import { requireAuth, jsonResponse, listStudentClasses, classEntryKey, pickDefaultClassEntry } from "./_utils.js";

/* GET /api/student-classes — 내가 등록한 "수업" 목록(같은 교수님의 수업을 여러 개 등록했어도
   각각 구분해서 내려줌). 상단 툴바의 수업 선택 드롭다운에서 쓴다.
   2026-09-03: 기존 student-professors(교수 단위)를 그대로 드롭다운에 쓰다 보니, 같은 교수님의
   수업 코드를 2개 이상 등록한 학생은 드롭다운이 교수 1명으로만 묶여서 실제로는 수업을 구분해
   고를 수 없는 버그가 있었다 — 이 엔드포인트로 교체. */
export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  const list = await listStudentClasses(env, auth.user.id);
  const classes = list.map((c) => ({ ...c, key: classEntryKey(c) }));
  const defaultEntry = pickDefaultClassEntry(list, auth.user.profId);

  return jsonResponse({ classes, defaultKey: defaultEntry ? classEntryKey(defaultEntry) : null });
}
