import { requireProfessor, jsonResponse, nowSec, ensureSubmissionSchema } from "./_utils.js";

/* POST /api/professor-submission-check — "과제 확인" 표시 켜기/끄기 (2026-09-08 추가)
   body: { id: 제출물 id, checked: true|false }
   첨삭(피드백)을 하지 않았더라도 교수가 제출물을 읽어봤다는 표시를 남길 수 있게 하는 기능.
   학생 화면에도 "확인함"으로 보인다. 본인이 낸 과제의 제출물만 바꿀 수 있다. */
export async function onRequestPost({ request, env }) {
  const auth = await requireProfessor(request, env);
  if (!auth) return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);
  await ensureSubmissionSchema(env);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }
  const id = Number(body && body.id);
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  const checked = !(body && body.checked === false); // 기본값 true(확인함)

  const owner = await env.DB.prepare(
    "SELECT a.prof_id FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE s.id = ?"
  ).bind(id).first();
  if (!owner || owner.prof_id !== auth.user.id) return jsonResponse({ error: "제출물을 찾을 수 없습니다." }, 404);

  const checkedAt = checked ? nowSec() : null;
  try {
    await env.DB.prepare("UPDATE submissions SET checked_at = ? WHERE id = ?").bind(checkedAt, id).run();
  } catch (e) {
    return jsonResponse({ error: "확인 표시를 저장하지 못했습니다. 잠시 후 다시 시도해주세요." }, 500);
  }

  return jsonResponse({ ok: true, id, checkedAt });
}
