/* ===== 상태 & 저장 ===== */
const LS_KEY = "storyhelper_v1";
let DB = load();
let P = currentProject();

function load(){
  try{
    const d=JSON.parse(localStorage.getItem(LS_KEY));
    if(d&&Array.isArray(d.projects)&&d.projects.length){
      d.projects=d.projects.map(fillProject);
      if(!d.projects.some(p=>p.id===d.current)) d.current=d.projects[0].id;
      return d;
    }
  }catch(e){}
  const id=uid();
  return {current:id, projects:[blankProject(id,"내 첫 작품")]};
}
/* 예전 버전 데이터에 누락된 필드를 채워 오류를 방지 */
function fillProject(p){
  const b=blankProject(p.id||uid(), p.name||"제목 없음");
  return Object.assign({}, b, p, {
    idea: Object.assign({}, b.idea, p.idea||{}),
    world: Object.assign({}, b.world, p.world||{}),
    background: Object.assign({}, b.background, p.background||{}),
    event: Object.assign({}, b.event, p.event||{}),
    characters: (Array.isArray(p.characters)&&p.characters.length)?p.characters.map(c=>Object.assign({},blankChar(),c)):b.characters,
    plot: Array.isArray(p.plot)?Object.assign([...b.plot],p.plot):b.plot,
    genres: Array.isArray(p.genres)?p.genres:b.genres,
  });
}
function save(){
  localStorage.setItem(LS_KEY, JSON.stringify(DB));
  const el=document.getElementById("saveStatus");
  if(el){ el.textContent="저장됨"; el.style.opacity=1; setTimeout(()=>el.style.opacity=.4,1000); }
  if(typeof saveToDrive==="function") saveToDrive();
}
function uid(){ return "p"+Date.now()+Math.floor(Math.random()*1000); }
function blankProject(id,name){
  return {id,name,logline:"",genres:[],
    idea:{protagonistType:"",protagonistMbti:"",genre:"",endingType:"",logline:""},
    characters:[blankChar()],
    world:{summary:"",rules:"",era:"",place:""},
    background:{social:"",mood:"",detail:""},
    event:{main:"",conflict:"",ending:""},
    plot:Array(12).fill("")};
}
function blankChar(){
  return {name:"",role:"주인공",mbti:"",enneagram:"",goal:"",flaw:"",arc:"",desc:""};
}
function currentProject(){
  return DB.projects.find(p=>p.id===DB.current)||DB.projects[0];
}

/* ===== 프로젝트 UI ===== */
function refreshProjSelect(){
  const sel=document.getElementById("projSelect");
  sel.innerHTML="";
  DB.projects.forEach(p=>{
    const o=document.createElement("option");
    o.value=p.id; o.textContent=p.name; if(p.id===DB.current)o.selected=true;
    sel.appendChild(o);
  });
}
document.getElementById("projSelect").onchange=e=>{
  DB.current=e.target.value; P=currentProject(); save(); render();
};
document.getElementById("newProjBtn").onclick=()=>{
  const name=prompt("새 작품 이름:","제목 없음"); if(name===null)return;
  const id=uid(); DB.projects.push(blankProject(id,name||"제목 없음"));
  DB.current=id; P=currentProject(); save(); refreshProjSelect(); render();
};
document.getElementById("renameProjBtn").onclick=()=>{
  const name=prompt("작품 이름 변경:",P.name); if(name===null)return;
  P.name=name||P.name; save(); refreshProjSelect();
};
document.getElementById("delProjBtn").onclick=()=>{
  if(DB.projects.length<=1){alert("최소 1개의 작품은 있어야 합니다.");return;}
  if(!confirm(`'${P.name}'을(를) 삭제할까요? 되돌릴 수 없습니다.`))return;
  DB.projects=DB.projects.filter(p=>p.id!==P.id);
  DB.current=DB.projects[0].id; P=currentProject(); save(); refreshProjSelect(); render();
};

/* Google 로그인 */
document.getElementById("googleLoginBtn").onclick=()=>{
  if(typeof googleLogin==="function") googleLogin();
  else alert("Google 라이브러리 로딩 중입니다. 잠시 후 다시 눌러주세요.");
};

/* ===== 탭 ===== */
let activeTab="idea";
document.querySelectorAll(".tab").forEach(t=>{
  t.onclick=()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    t.classList.add("active"); activeTab=t.dataset.tab; render();
    window.scrollTo(0,0);
  };
});

/* 입력 바인딩 헬퍼 */
function bind(el,obj,key){
  el.value=obj[key]||"";
  el.oninput=()=>{ obj[key]=el.value; save(); };
}

/* 옵션 버튼 그룹 (단일선택) */
function optGroup(container, options, obj, key){
  options.forEach(v=>{
    const b=document.createElement("button");
    b.className="opt-btn"+(obj[key]===v?" on":"");
    b.textContent=v;
    b.onclick=()=>{ obj[key]=v; save(); container.querySelectorAll(".opt-btn").forEach(x=>x.classList.remove("on")); b.classList.add("on"); };
    container.appendChild(b);
  });
}

/* ===== 렌더 ===== */
const app=document.getElementById("app");
function render(){
  try{
    refreshProjSelect();
    app.innerHTML="";
    if(!P) P=currentProject();
    if(!P.idea) P.idea={protagonistType:"",protagonistMbti:"",genre:"",endingType:"",logline:""};
    const renderers={idea:rIdea, character:rChar, world:rWorld, background:rBg,
      event:rEvent, plot:rPlot, export:rExport};
    (renderers[activeTab]||rIdea)();
  }catch(e){
    console.error("렌더링 오류:", e);
    app.innerHTML='<div class="card"><h2>문제가 발생했습니다</h2>'
      +'<p class="hint">데이터를 불러오는 중 오류가 발생했습니다. 아래 버튼으로 저장 데이터를 초기화할 수 있습니다 (다른 작품은 유지됩니다).</p>'
      +'<button class="btn danger" id="resetProjBtn">이 작품 초기화</button></div>';
    const rb=document.getElementById("resetProjBtn");
    if(rb) rb.onclick=()=>{
      const i=DB.projects.findIndex(x=>x.id===P.id);
      const fresh=blankProject(P.id,P.name);
      if(i>=0) DB.projects[i]=fresh; else DB.projects.push(fresh);
      P=fresh; save(); render();
    };
  }
}

/* ===== 💡 아이디어 탐색 ===== */
const PROTAGONIST_TYPES=["영웅형","반영웅형","평범한 주인공","성장형","복수자","탐정/조사자","생존자","이상주의자","냉소주의자"];
const ENDING_TYPES=["해피엔딩","새드엔딩","열린 결말","비극적 성장","권선징악","아이러닉 엔딩","순환 구조"];
const IDEA_GENRES=["판타지","SF","로맨스","액션","미스터리","스릴러","호러","일상","스포츠","역사","학원","이세계"];

function rIdea(){
  if(!P.idea) P.idea={protagonistType:"",protagonistMbti:"",genre:"",endingType:"",logline:""};
  const id=P.idea;
  const c=document.createElement("div");
  c.innerHTML=`<div class="card">
    <h2>💡 아이디어 탐색</h2>
    <p class="hint">주인공과 이야기 방향을 설정해보세요.</p>

    <label>주인공 유형</label>
    <div class="option-grid" id="typeGrid"></div>

    <label>주인공 MBTI (선택)</label>
    <div class="option-grid" id="mbtiGrid"></div>

    <label>장르</label>
    <div class="option-grid" id="genreGrid"></div>

    <label>엔딩 형식</label>
    <div class="option-grid" id="endingGrid"></div>

    <label>로그라인 (한 줄 요약)</label>
    <textarea id="ideaLogline" placeholder="누가, 무엇을 원하지만, 어떤 장애물 때문에… 한 문장으로"></textarea>

    <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn ghost" id="clearIdeaBtn">초기화</button>
    </div>
  </div>`;
  app.appendChild(c);

  optGroup(c.querySelector("#typeGrid"), PROTAGONIST_TYPES, id, "protagonistType");
  optGroup(c.querySelector("#mbtiGrid"), MBTI_TYPES, id, "protagonistMbti");
  optGroup(c.querySelector("#genreGrid"), IDEA_GENRES, id, "genre");
  optGroup(c.querySelector("#endingGrid"), ENDING_TYPES, id, "endingType");
  bind(c.querySelector("#ideaLogline"), id, "logline");

  c.querySelector("#clearIdeaBtn").onclick=()=>{
    P.idea={protagonistType:"",protagonistMbti:"",genre:"",endingType:"",logline:""};
    save(); render();
  };
}

/* ① 캐릭터 */
function rChar(){
  const c=document.createElement("div");
  c.innerHTML=`<div class="card"><h2>👤 캐릭터 설정</h2>
    <p class="hint">MBTI와 에니어그램으로 성격의 뼈대를 잡고, 목표·결함·변화를 채워보세요.</p>
    <div class="charlist" id="charlist"></div>
    <button class="btn ghost" id="addChar">＋ 캐릭터 추가</button></div>`;
  app.appendChild(c);
  const list=c.querySelector("#charlist");
  P.characters.forEach((ch,i)=>list.appendChild(charCard(ch,i)));
  c.querySelector("#addChar").onclick=()=>{P.characters.push(blankChar());save();render();};
}
function charCard(ch,i){
  const d=document.createElement("div"); d.className="char-item";
  const enOpts=ENNEAGRAM.map(e=>`<option value="${e.n}">${e.n} — ${e.d}</option>`).join("");
  const mbtiOpts=MBTI_TYPES.map(m=>`<option value="${m}">${m}</option>`).join("");
  d.innerHTML=`<div class="char-head"><h3>인물 ${i+1}</h3>
    ${P.characters.length>1?`<button class="btn sm danger" data-del="${i}">삭제</button>`:""}</div>
    <div class="row"><div><label>이름</label><input type="text" data-k="name"></div>
    <div><label>역할</label><input type="text" data-k="role" placeholder="주인공/조력자/적대자"></div></div>
    <div class="row"><div><label>MBTI</label><select data-k="mbti"><option value="">선택</option>${mbtiOpts}</select></div>
    <div><label>에니어그램</label><select data-k="enneagram"><option value="">선택</option>${enOpts}</select></div></div>
    <div class="row"><div><label>목표 (원하는 것)</label><input type="text" data-k="goal"></div>
    <div><label>결함 (약점·트라우마)</label><input type="text" data-k="flaw"></div></div>
    <label>인물 변화 (아크)</label><textarea data-k="arc" placeholder="이야기를 거치며 어떻게 달라지는가"></textarea>
    <label>기타 설명</label><textarea data-k="desc" placeholder="외모, 말투, 관계 등"></textarea>`;
  d.querySelectorAll("[data-k]").forEach(el=>bind(el,ch,el.dataset.k));
  const del=d.querySelector("[data-del]");
  if(del)del.onclick=()=>{P.characters.splice(i,1);save();render();};
  return d;
}

/* 세계관 */
function rWorld(){
  const c=document.createElement("div");
  c.innerHTML=`<div class="card"><h2>🌍 세계관 설정</h2>
    <p class="hint">이야기가 펼쳐지는 세계의 규칙과 분위기를 정합니다.</p>
    <label>한 줄 요약</label><textarea id="w_summary" placeholder="이 세계는 어떤 곳인가"></textarea>
    <div class="row"><div><label>시대</label><input type="text" id="w_era" placeholder="현대/중세/근미래…"></div>
    <div><label>장소</label><input type="text" id="w_place" placeholder="도시/왕국/우주선…"></div></div>
    <label>세계의 규칙 (마법·기술·금기 등)</label><textarea id="w_rules"></textarea></div>`;
  app.appendChild(c);
  bind(c.querySelector("#w_summary"),P.world,"summary");
  bind(c.querySelector("#w_era"),P.world,"era");
  bind(c.querySelector("#w_place"),P.world,"place");
  bind(c.querySelector("#w_rules"),P.world,"rules");
}

/* 배경 */
function rBg(){
  const c=document.createElement("div");
  c.innerHTML=`<div class="card"><h2>🏙 배경 설정</h2>
    <p class="hint">세계관 속에서 이야기가 시작되는 구체적 상황입니다.</p>
    <label>사회·정치적 배경</label><textarea id="b_social"></textarea>
    <label>전체 분위기/톤</label><input type="text" id="b_mood" placeholder="어둡고 진중한 / 밝고 코믹한…">
    <label>세부 묘사</label><textarea id="b_detail"></textarea></div>`;
  app.appendChild(c);
  bind(c.querySelector("#b_social"),P.background,"social");
  bind(c.querySelector("#b_mood"),P.background,"mood");
  bind(c.querySelector("#b_detail"),P.background,"detail");
}

/* 사건 */
function rEvent(){
  const c=document.createElement("div");
  c.innerHTML=`<div class="card"><h2>⚡ 사건 설정</h2>
    <p class="hint">이야기를 굴러가게 하는 핵심 사건과 갈등, 결말 방향입니다.</p>
    <label>주요 사건 (발단)</label><textarea id="e_main" placeholder="이야기를 시작시키는 사건"></textarea>
    <label>핵심 갈등</label><textarea id="e_conflict" placeholder="주인공 vs 무엇/누구"></textarea>
    <label>결말 방향</label><textarea id="e_ending" placeholder="어떻게 끝나는가 (열린 결말도 OK)"></textarea></div>`;
  app.appendChild(c);
  bind(c.querySelector("#e_main"),P.event,"main");
  bind(c.querySelector("#e_conflict"),P.event,"conflict");
  bind(c.querySelector("#e_ending"),P.event,"ending");
}

/* 플롯 */
function rPlot(){
  const filled=P.plot.filter(Boolean).length;
  const c=document.createElement("div");
  c.innerHTML=`<div class="card"><h2>📖 플롯 — 영웅의 여정 12단계</h2>
    <p class="hint">${filled}/12 단계 작성됨. 각 단계를 눌러 펼치고 내용을 채우세요.</p>
    <label>🎬 로그라인 (한 문장 요약)</label>
    <textarea id="logline" placeholder="누가, 무엇을 원하지만, 어떤 장애물 때문에…"></textarea>
    <div class="row"><div><label>장르 (복수 선택)</label><div id="genreTags"></div></div></div>
    </div>
    <div id="stages"></div>`;
  app.appendChild(c);
  bind(c.querySelector("#logline"),P,"logline");
  const gt=c.querySelector("#genreTags");
  GENRES.forEach(g=>{
    const on=P.genres.includes(g);
    const b=document.createElement("span");
    b.className="tag"; b.style.cursor="pointer";
    b.style.opacity=on?1:.45; b.textContent=(on?"✓ ":"")+g;
    b.onclick=()=>{ if(on)P.genres=P.genres.filter(x=>x!==g); else P.genres.push(g); save(); render(); };
    gt.appendChild(b);
  });
  const st=c.querySelector("#stages");
  HERO_STAGES.forEach((s,i)=>{
    const wrap=document.createElement("div"); wrap.className="stage";
    const done=!!P.plot[i];
    wrap.innerHTML=`<div class="stage-head">
      <span class="stage-num">${i+1}</span>
      <div><div class="st-name">${s.name}</div><div class="st-desc">${s.desc}</div></div>
      <span class="filled-dot">${done?"● 작성됨":""}</span></div>
      <div class="stage-body"><textarea data-stage="${i}" placeholder="이 단계에서 일어나는 일을 써보세요"></textarea></div>`;
    st.appendChild(wrap);
    wrap.querySelector(".stage-head").onclick=e=>{ if(e.target.closest("button"))return; wrap.classList.toggle("open"); };
    const ta=wrap.querySelector("textarea");
    ta.value=P.plot[i]||"";
    ta.oninput=()=>{P.plot[i]=ta.value;save();};
  });
}

/* 내보내기 */
function rExport(){
  const c=document.createElement("div");
  c.innerHTML=`<div class="card"><h2>📤 내보내기 / 백업</h2>
    <p class="hint">완성본을 PDF로 저장하거나, 데이터를 파일로 백업·복원할 수 있습니다.</p>
    <button class="btn" id="pdfBtn">📄 PDF로 내보내기</button>
    <button class="btn ghost" id="jsonOut">💾 백업 파일 내보내기 (.json)</button>
    <label class="btn ghost" style="display:inline-block">📂 백업 불러오기
      <input type="file" id="jsonIn" accept=".json" style="display:none"></label>
    <p class="muted" style="margin-top:14px;font-size:12px;color:var(--muted)">※ PDF는 인쇄 창에서 '대상'을 'PDF로 저장'으로 선택하세요.</p>
    </div>
    <div id="preview" class="card"></div>`;
  app.appendChild(c);
  c.querySelector("#pdfBtn").onclick=()=>{ buildPreview(); window.print(); };
  c.querySelector("#jsonOut").onclick=exportJSON;
  c.querySelector("#jsonIn").onchange=importJSON;
  buildPreview();
}
function buildPreview(){
  const pv=document.getElementById("preview"); if(!pv)return;
  const chars=P.characters.map((ch,i)=>`
    <p><b>인물 ${i+1}: ${esc(ch.name)||"-"}</b> (${esc(ch.role)})<br>
    MBTI: ${esc(ch.mbti)||"-"} / 에니어그램: ${esc(ch.enneagram)||"-"}<br>
    목표: ${esc(ch.goal)||"-"} / 결함: ${esc(ch.flaw)||"-"}<br>
    아크: ${esc(ch.arc)||"-"}<br>${esc(ch.desc)||""}</p>`).join("");
  const plot=HERO_STAGES.map((s,i)=>`<p><b>${i+1}. ${s.name}</b><br>${esc(P.plot[i])||"<i>(미작성)</i>"}</p>`).join("");
  pv.innerHTML=`<h2 style="border-bottom:2px solid var(--accent);padding-bottom:8px">${esc(P.name)}</h2>
    <p><b>로그라인:</b> ${esc(P.logline)||"-"}<br><b>장르:</b> ${P.genres.join(", ")||"-"}</p>
    <div class="section-title">캐릭터</div>${chars}
    <div class="section-title">세계관</div><p>${esc(P.world.summary)||"-"}<br>시대: ${esc(P.world.era)} / 장소: ${esc(P.world.place)}<br>규칙: ${esc(P.world.rules)}</p>
    <div class="section-title">배경</div><p>사회: ${esc(P.background.social)}<br>분위기: ${esc(P.background.mood)}<br>${esc(P.background.detail)}</p>
    <div class="section-title">사건</div><p>주요 사건: ${esc(P.event.main)}<br>갈등: ${esc(P.event.conflict)}<br>결말: ${esc(P.event.ending)}</p>
    <div class="section-title">플롯 — 영웅의 여정</div>${plot}`;
}
function esc(s){return(s||"").replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m])).replace(/\n/g,"<br>");}

function exportJSON(){
  const blob=new Blob([JSON.stringify(P,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download=(P.name||"story")+".json"; a.click();
}
function importJSON(e){
  const f=e.target.files[0]; if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    try{
      const obj=JSON.parse(rd.result);
      if(!obj.plot||!obj.characters)throw 0;
      obj.id=uid(); obj.name=(obj.name||"가져온 작품")+" (복원)";
      DB.projects.push(obj); DB.current=obj.id; P=currentProject();
      save(); refreshProjSelect(); render();
      alert("불러오기 완료!");
    }catch(_){ alert("올바른 백업 파일이 아닙니다."); }
  };
  rd.readAsText(f);
}

/* 정보 */
document.getElementById("aboutLink"