import { jsonResponse, nowSec, makeToken, sendEmail, checkRateLimit, clientIp } from "./_utils.js";

const RESET_EXPIRE_MIN = 30;
/* 응답 메시지는 이메일 가입 여부와 무관하게 항상 동일하게 돌려준다(2026-08-20 보안 점검 후 수정).
   예전에는 "등록된 계정을 찾을 수 없습니다"처럼 가입 여부에 따라 메시지가 달라서, 이 API를 여러
   이메일로 반복 호출해보면 어떤 이메일이 가입되어 있는지 알아낼 수 있었다(계정 존재 여부 추측
   공격). 실제 안내 메일은 가입된 이메일일 때만 발송되므로 정상 사용자 경험은 그대로다. */
const GENERIC_MESSAGE = "입력하신 이메일이 가입되어 있다면, 아이디 안내와 비밀번호 재설정 링크를 보내드렸습니다. 메일함(스팸함도 확인)을 확인해주세요.";

/* POST /api/find-account — 가입 이메일 입력 → 아이디 안내 + 비밀번호 재설정 링크 메일 발송 */
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }

  const email = (body.email || "").trim();
  if (!email) return jsonResponse({ error: "이메일을 입력해주세요." }, 400);

  /* 요청 횟수 제한 — 2026-09-08 조정.
     예전에는 "같은 IP에서 1시간에 5건"이었는데, 한 강의실의 학생들은 학교 와이파이를 통해 IP가 하나로
     묶이기 때문에 6번째 학생부터 무조건 막혔다(회원가입 제한을 완화했던 것과 같은 이유 — 2026-09-03).
     이제 IP 기준은 40건으로 넉넉히 두고, 대신 "한 이메일 주소로 1시간에 5건"이라는 제한을 따로 두어
     특정인에게 메일을 퍼붓는 악용은 계속 막는다. */
  const rl = await checkRateLimit(env, `find-account:${clientIp(request)}`, 40, 60 * 60);
  if (!rl.allowed) {
    return jsonResponse({ error: `이 네트워크에서 비밀번호 찾기를 너무 많이 시도했습니다. ${Math.ceil(rl.retryAfterSec / 60)}분 후 다시 시도해주세요.` }, 429);
  }
  const rlEmail = await checkRateLimit(env, `find-account-mail:${email.toLowerCase()}`, 5, 60 * 60);
  if (!rlEmail.allowed) {
    return jsonResponse({ error: `이 이메일로 안내 메일을 이미 여러 번 보냈습니다. 메일함(스팸함 포함)을 먼저 확인해주시고, ${Math.ceil(rlEmail.retryAfterSec / 60)}분 후 다시 시도해주세요.` }, 429);
  }

  /* 가입할 때 대문자로 입력했거나 지금 대문자로 입력한 경우에도 찾아지도록 대소문자를 무시하고 조회한다
     (2026-09-08 — 예전에는 정확히 일치할 때만 찾아서, 학생이 "Hong@Gmail.com"으로 가입했다가
      "hong@gmail.com"으로 입력하면 안내 메일이 오지 않았다) */
  const user = await env.DB.prepare(
    "SELECT id, username, email FROM users WHERE lower(email) = lower(?)"
  ).bind(email).first();
  if (!user) {
    return jsonResponse({ message: GENERIC_MESSAGE });
  }

  const token = await makeToken();
  const now = nowSec();
  const expires = now + RESET_EXPIRE_MIN * 60;
  await env.DB.prepare(
    "INSERT INTO password_resets (token, user_id, created_at, expires_at, used) VALUES (?, ?, ?, ?, 0)"
  ).bind(token, user.id, now, expires).run();

  const origin = new URL(request.url).origin;
  const resetUrl = `${origin}/?reset=${token}`;
  const text =
    `안녕하세요, ${user.username} 님.\n\n` +
    `스토리 가이드 계정의 아이디는 "${user.username}" 입니다.\n\n` +
    `아래 링크에서 새 비밀번호를 설정할 수 있습니다. (${RESET_EXPIRE_MIN}분간 유효, 1회만 사용 가능)\n${resetUrl}\n\n` +
    `본인이 요청하지 않았다면 이 메일은 무시하셔도 됩니다.`;

  try {
    await sendEmail(env, { to: user.email || email, subject: "[스토리 가이드] 아이디 안내 및 비밀번호 재설정", text });
  } catch (e) {
    /* 메일 발송 설정(GMAIL_USER / GMAIL_APP_PASSWORD)이 빠졌거나 구글 앱 비밀번호가 만료되면 여기로 온다.
       학생에게는 "무엇을 해야 하는지"를 알려주고, 원인은 뒤에 덧붙인다. */
    return jsonResponse({
      error: "안내 메일을 보내지 못했습니다. 담당 교수님께 알려주세요. (원인: " + ((e && e.message) || e) + ")",
    }, 500);
  }

  return jsonResponse({ message: GENERIC_MESSAGE });
}
