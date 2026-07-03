// ===== Cloudflare Worker: 스토리헬퍼 Gemini 프록시 =====
// 이 코드를 Cloudflare Worker에 붙여넣고, 환경변수 GEMINI_KEY 에 API키를 넣으세요.
// (설정 방법은 SETUP-GEMINI.md 참고)

const MODEL = "gemini-2.5-flash";

// 학생 사이트 주소만 허용 (CORS). 본인 GitHub Pages 주소로 바꾸세요.
const ALLOW_ORIGIN = "*"; // 예: "https://아이디.github.io"

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return cors(new Response(null, {status:204}));
    if (req.method !== "POST") return cors(new Response("POST only", {status:405}));

    let prompt = "";
    try { prompt = (await req.json()).prompt || ""; } catch(e){}
    if (!prompt) return cors(json({error:"no prompt"}, 400));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_KEY}`;
    const body = { contents:[{ parts:[{ text: prompt }] }] };

    try {
      const g = await fetch(url, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(body)
      });
      const data = await g.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "응답을 생성하지 못했습니다.";
      return cors(json({ text }));
    } catch(e) {
      return cors(json({ error:"upstream failed" }, 502));
    }
  }
};

function json(obj, status=200){
  return new Response(JSON.stringify(obj), {status, headers:{"Content-Type":"application/json"}});
}
function cors(res){
  res.headers.set("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}
