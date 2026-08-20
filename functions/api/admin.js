import { requireAdmin, jsonResponse, ADMIN_USERNAME } from "./_utils.js";

/* GET /api/admin — 회원 명단 조회 (관리자 전용) */
export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth) return jsonResponse({ error: "관리자만 접근할 수 있습니다." }, 403);

  const { results } = await env.DB.prepare(
    "SELECT id, school, name, username, email, role, prof_code, created_at FROM users ORDER BY created_at DESC"
  ).all();

  return jsonResponse({ users: results || [] });
}

/* 교수 계정에 부여할 6자리 숫자 코드 — DB 전체에서 겹치지 않을 때까지 새로 뽑는다(최대 20회 시도).
   functions/api/signup.js의 generateProfCode()와 동일 로직 (등급을 교수로 바꿀 때도 코드가 필요해서
   여기서도 필요) */
async function generateProfCode(env) {
  for (let i = 0; i < 20; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const dup = await env.DB.prepare("SELECT id FROM users WHERE prof_code = ?").bind(code).first();
    if (!dup) return code;
  }
  throw new Error("교수 코드 생성에 실패했습니다.");
}

/* POST /api/admin — 서버 초기화 · 회원 등급 변경 (관리자 전용)
   body: { mode: "data" | "all" | "setRole" }
   - "data"   : 모든 회원의 작품 데이터(user_data)만 삭제. 계정은 유지.
   - "all"    : 위 데이터 삭제 + 관리자 본인을 제외한 모든 계정·세션 삭제.
   - "setRole": { userId, role: "student"|"professor" } — 회원 관리 표에서 등급을 바꿀 때 사용.
                교수로 바꾸는데 기존 코드가 없으면 새 6자리 코드를 발급하고, 학생으로 바꾸면 코드를 지운다. */
export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth) return jsonResponse({ error: "관리자만 접근할 수 있습니다." }, 403);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const mode = body && body.mode;

  if (mode === "data") {
    await env.DB.prepare("DELETE FROM user_data").run();
    return jsonResponse({ ok: true, mode: "data" });
  }

  if (mode === "all") {
    await env.DB.prepare("DELETE FROM user_data").run();
    await env.DB.prepare("DELETE FROM sessions WHERE user_id != ?").bind(auth.user.id).run();
    await env.DB.prepare("DELETE FROM users WHERE id != ?").bind(auth.user.id).run();
    return jsonResponse({ ok: true, mode: "all" });
  }

  if (mode === "setRole") {
    const userId = Number(body.userId);
    const role = body.role === "professor" ? "professor" : "student";
    if (!userId) return jsonResponse({ error: "잘못된 요청입니다." }, 400);

    const target = await env.DB.prepare("SELECT id, role, prof_code FROM users WHERE id = ?").bind(userId).first();
    if (!target) return jsonResponse({ error: "회원을 찾을 수 없습니다." }, 404);

    let profCode = target.prof_code;
    if (role === "professor" && !profCode) profCode = await generateProfCode(env);
    if (role === "student") profCode = null;

    // 교수 → 학생으로 강등: 이 교수를 등록해뒀던 학생들의 연결을 정리(다른 등록 교수가 있으면
    // 그 교수를 기본 선택으로 넘기고, 없으면 기본 선택을 비움), student_professors 등록도 삭제
    if (role === "student" && target.role === "professor") {
      await env.DB.prepare(
        "UPDATE users SET prof_id = (SELECT prof_id FROM student_professors WHERE student_id = users.id AND prof_id != ? LIMIT 1) WHERE prof_id = ?"
      ).bind(userId, userId).run();
      await env.DB.prepare("DELETE FROM student_professors WHERE prof_id = ?").bind(userId).run();
    }

    await env.DB.prepare("UPDATE users SET role = ?, prof_code = ? WHERE id = ?")
      .bind(role, profCode, userId).run();

    return jsonResponse({ ok: true, mode: "setRole", userId, role, profCode });
  }

  if (mode === "deleteUser") {
    const userId = Number(body.userId);
    if (!userId) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
    if (userId === auth.user.id) return jsonResponse({ error: "관리자 본인 계정은 삭제할 수 없습니다." }, 400);

    const target = await env.DB.prepare("SELECT id, username, role FROM users WHERE id = ?").bind(userId).first();
    if (!target) return jsonResponse({ error: "회원을 찾을 수 없습니다." }, 404);
    if (target.username === ADMIN_USERNAME) return jsonResponse({ error: "관리자 계정은 삭제할 수 없습니다." }, 400);

    if (target.role === "professor") {
      // 이 교수가 낸 과제들의 제출물부터 지우고, 과제를 지운 뒤, 이 교수를 등록해뒀던 학생들의 연결을 끊는다
      // (다른 등록 교수가 있으면 그 교수를 기본 선택으로 넘겨준다)
      const { results: assigns } = await env.DB.prepare("SELECT id FROM assignments WHERE prof_id = ?").bind(userId).all();
      for (const a of (assigns || [])) {
        await env.DB.prepare("DELETE FROM submissions WHERE assignment_id = ?").bind(a.id).run();
      }
      await env.DB.prepare("DELETE FROM assignments WHERE prof_id = ?").bind(userId).run();
      await env.DB.prepare(
        "UPDATE users SET prof_id = (SELECT prof_id FROM student_professors WHERE student_id = users.id AND prof_id != ? LIMIT 1) WHERE prof_id = ?"
      ).bind(userId, userId).run();
      await env.DB.prepare("DELETE FROM student_professors WHERE prof_id = ?").bind(userId).run();
    }
    // 이 회원이 학생으로서 등록해둔 교수 목록도 정리
    await env.DB.prepare("DELETE FROM student_professors WHERE student_id = ?").bind(userId).run();
    // 학생 계정이든(자신이 제출한 것) 교수 계정이든(교수 자신도 제출자로 남아있을 수 있음) 제출물 정리
    await env.DB.prepare("DELETE FROM submissions WHERE student_id = ?").bind(userId).run();
    await env.DB.prepare("DELETE FROM user_data WHERE user_id = ?").bind(userId).run();
    await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
    await env.DB.prepare("DELETE FROM password_resets WHERE user_id = ?").bind(userId).run();
    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();

    return jsonResponse({ ok: true, mode: "deleteUser", userId });
  }

  return jsonResponse({ error: "mode는 'data', 'all', 'setRole', 'deleteUser' 중 하나여야 합니다." }, 400);
}
