// Gemini 연동 — Cloudflare Worker 프록시 경유 (서버가 API키 보관, 학생은 설정 불필요)
// 교수님이 프록시 배포 후 아래 PROXY_URL 만 교체하면 됩니다.
const PROXY_URL = "https://your-worker.workers.dev"; // ← 배포 후 교체

async function askGemini(prompt){
  if(PROXY_URL.includes("your-worker")){
    return {ok:false, text:"⚠️ 아직 AI 서버(프록시)가 연결되지 않았습니다.\n교수님이 gemini.js의 PROXY_URL을 배포 주소로 교체하면 작동합니다."};
  }
  try{
    const r = await fetch(PROXY_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({prompt})
    });
    if(!r.ok) return {ok:false, text:`서버 오류 (${r.status}). 잠시 후 다시 시도하세요.`};
    const j = await r.json();
    return {ok:true, text:(j.text||"").trim()};
  }catch(e){
    return {ok:false, text:"연결 실패: 인터넷 또는 서버 상태를 확인하세요."};
  }
}

// 프롬프트 빌더
function buildAdvicePrompt(p, stageIdx){
  const s = HERO_STAGES[stageIdx];
  const cur = (p.plot && p.plot[stageIdx]) || "";
  return `당신은 웹툰 스토리 멘토입니다. 학생의 작품 설정을 보고 '영웅의 여정' 단계에 대한 조언을 한국어로 간결하게(5문장 이내) 해주세요.\n\n[작품 로그라인] ${p.logline||"(미작성)"}\n[장르] ${(p.genres||[]).join(", ")||"(미정)"}\n[세계관] ${p.world?.summary||"(미작성)"}\n\n[현재 단계] ${stageIdx+1}. ${s.name} — ${s.desc}\n[학생이 쓴 내용] ${cur||"(아직 없음)"}\n\n이 단계를 더 매력적으로 만들 구체적 조언과, 비어있다면 예시 한 가지를 제안해 주세요.`;
}

function buildSimilarPrompt(p){
  const plotText = (p.plot||[]).map((t,i)=>t?`${i+1}.${HERO_STAGES[i].name}: ${t}`:"").filter(Boolean).join("\n");
  return `다음 작품 구상과 비슷한 분위기·구조·주제를 가진 기존 영화/만화/애니메이션을 3~5개 찾아 한국어로 소개해 주세요. 각 작품마다 제목, 매체(영화/만화/애니), 어떤 점이 비슷한지 1~2문장으로 설명하고, 마지막에 '차별화 포인트'로 학생 작품이 기존작과 달라질 수 있는 방향 2가지를 제안하세요.\n\n[로그라인] ${p.logline||"(미작성)"}\n[장르] ${(p.genres||[]).join(", ")}\n[세계관] ${p.world?.summary||""}\n[주요 사건] ${p.event?.main||""}\n[플롯]\n${plotText||"(미작성)"}`;
}
