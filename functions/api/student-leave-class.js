import { requireAuth, jsonResponse, ensureEnrollmentSchema, listStudentClasses } from "./_utils.js";

/* POST /api/student-leave-class — 학생이 등록한 수업에서 스스로 나간다 (2026-09-08 추가)
   body: { classId: 수업 id }  또는  { profId: 교수 id }  (수업 코드 도입 이전에 교수 단위로만 등록된 옛 학생용)

   - 같은 (수업, 학생) 조합이 실수로 여러 번 등록돼 있어도 한 번에 모두 정리된다.
   - 그 교수의 수업이 하나도 남지 않으면 교수 등록(student_professors)도 함께 끊는다.
     (드롭다운에 교수 이름만 덩그러니 남는 것을 막기 위함)
   - 기본 선택 교수(users.prof_id)가 방금 끊은 교수였다면, 남아있는 다른 교수로 옮기고 없으면 비운다.
   - 이미 제출한 과제와 받은 첨삭은 서버에서 지우지 않는다. 다만 그 수업을 나가면 화면에서는 더 이상
     보이지 않으므로, 같은 코드로 다시 등록하면 그대로 다시 보인다. */
export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  await ensureEnrollmentSchema(env);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const classId = Number(body && body.classId) || null;
  const reqProfId = Number(body && body.profId) || null;
  if (!classId && !reqProfId) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

  let profId = reqProfId;
  let leftClassName = null;

  if (classId) {
    const cls = await env.DB.prepare(
      "SELECT cl.id, cl.name, cl.prof_id FROM classes cl WHERE cl.id = ?"
    ).bind(classId).first();
    if (!cls) return jsonResponse({ error: "수업을 찾을 수 없습니다." }, 404);

    const mine = await env.DB.prepare(
      "SELECT id FROM class_students WHERE class_id = ? AND student_id = ?"
    ).bind(classId, auth.user.id).first();
    if (!mine) return jsonResponse({ error: "등록되어 있지 않은 수업입니다." }, 404);

    // 중복 등록이 있어도 전부 지운다
    await env.DB.prepare(
      "DELETE FROM class_students WHERE class_id = ? AND student_id = ?"
    ).bind(classId, auth.user.id).run();

    profId = cls.prof_id;
    leftClassName = cls.name;
  }

  /* 이 교수의 수업이 하나도 남지 않았으면 교수 등록도 함께 끊는다.
     (profId만 받은 옛 방식 요청은 수업이 애초에 없으므로 바로 이 경로를 탄다) */
  if (profId) {
    const remain = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM class_students cs JOIN classes cl ON cl.id = cs.class_id " +
      "WHERE cs.student_id = ? AND cl.prof_id = ?"
    ).bind(auth.user.id, profId).first();

    if (!remain || !remain.n) {
      await env.DB.prepare(
        "DELETE FROM student_professors WHERE student_id = ? AND prof_id = ?"
      ).bind(auth.user.id, profId).run();

      // 기본 선택 교수가 방금 끊은 교수였다면 남아있는 다른 교수로 옮긴다(없으면 NULL)
      if (auth.user.profId === profId) {
        const other = await env.DB.prepare(
          "SELECT prof_id FROM student_professors WHERE student_id = ? LIMIT 1"
        ).bind(auth.user.id).first();
        await env.DB.prepare("UPDATE users SET prof_id = ? WHERE id = ?")
          .bind(other ? other.prof_id : null, auth.user.id).run();
      }
    }
  }

  const classes = await listStudentClasses(env, auth.user.id);
  return jsonResponse({ ok: true, leftClassName, classes });
}
