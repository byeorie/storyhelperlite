import { jsonResponse } from "./_utils.js";

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }

  const email = (body.email || "").trim();
  if (!email) return jsonResponse({ error: "이메일을 입력해주세요." }, 400);

  const user = await env.DB.prepare("SELECT username FROM users WHERE email = ?").bind(email).first();
  if (!user) {
    return jsonResponse({ message: "해당 이메일로 등록된 계정을 찾을 수 없습니다." });
  }
  // 이메일 자동 발송은 아직 연결되어 있지 않아, 안내만 제공합니다.
  return jsonResponse({
    message: "등록된 계정이 확인되었습니다. 이메일 자동 발송 기능은 준비 중이니, 담당 교수(황기연)에게 문의해 아이디/비밀번호를 확인해주세요.",
  });
}
