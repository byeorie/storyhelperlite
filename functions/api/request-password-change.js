import { requireAuth, jsonResponse, nowSec, makeToken, sendEmail } from "./_utils.js";

const RESET_EXPIRE_MIN = 30;

/* POST /api/request-password-change — 로그인 상태에서 [설정] 화면의 "비밀번호 변경" 버튼으로
   본인 가입 이메일로 비밀번호 재설정 링크를 보낸다. 이메일을 다시 입력할 필요가 없다는 점만 빼면
   find-account.js(로그인 전 "아이디/비밀번호를 잊으셨나요")와 동일한 방식(같은 password_resets 표,
   같은 reset-password.js로 실제 변경) — 모든 계정(학생/교수/관리자)에서 동일하게 사용 가능. */
export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);

  const token = await makeToken();
  const now = nowSec();
  const expires = now + RESET_EXPIRE_MIN * 60;
  await env.DB.prepare(
    "INSERT INTO password_resets (token, user_id, created_at, expires_at, used) VALUES (?, ?, ?, ?, 0)"
  ).bind(token, auth.user.id, now, expires).run();

  const origin = new URL(request.url).origin;
  const resetUrl = `${origin}/?reset=${token}`;
  const text =
    `안녕하세요, ${auth.user.username} 님.\n\n` +
    `[설정]에서 비밀번호 변경을 요청하셨습니다. 아래 링크에서 새 비밀번호를 설정할 수 있습니다. ` +
    `(${RESET_EXPIRE_MIN}분간 유효, 1회만 사용 가능)\n${resetUrl}\n\n` +
    `본인이 요청하지 않았다면 이 메일은 무시하셔도 됩니다.`;

  try {
    await sendEmail(env, { to: auth.user.email, subject: "[스토리텔링 가이드] 비밀번호 변경 링크", text });
  } catch (e) {
    return jsonResponse({ error: "메일 발송에 실패했습니다: " + e.message }, 500);
  }

  return jsonResponse({ message: `${auth.user.email} 로 비밀번호 변경 링크를 보내드렸습니다. 메일함(스팸함도 확인)을 확인해주세요.` });
}
