/* ===== 상태 & 저장 ===== */
const LS_KEY = "storyhelper_v1";
const ADMIN_EMAIL = "studio.inknpen@gmail.com";
function isAdmin(){ return typeof gUserEmail!=="undefined" && gUserEmail===ADMIN_EMAIL; }
function refreshAdminTabVisibility(){
  const grp=document.getElementById("adminNavGroup");
  if(grp) grp.style.display=isAdmin()?"":"none";
}
function onAuthChanged(){
  refreshAdminTabVisibility();
  if(activeTab==="admin" && !isAdmin()){
    activeTab="idea";
    localStorage.setItem(TAB_KEY, activeTab);
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    const ideaBtn=document.querySelector('.tab[data-tab="idea"]');
    if(ideaBtn) ideaBtn.classList.add("active");
  }
  render();
}
let DB = load();
let P = currentProject();

function load(){
  try{
    const d=JSON.parse(localStorage.getItem(LS_KEY));
    if(d&&Array.isArray(d.projects)&&d.projects.length){
      d.projects=d.projects.map(fillProject);
      if(!d.projects.some(p=>p.id===d.current)) d.current=d.projects[0].id;
      d.workDB=fillWorkDB(d.workDB);
      return d;
    }
  }catch(e){}
  const id=uid();
  return {current:id, projects:[blankProject(id,"내 첫 작품")], workDB:fillWorkDB()};
}
/* 작품DB(아이디어 탐색용) 기본값 보정 */
function fillWorkDB(w){
  return Object.assign({fileName:"", uploadedAt:"", works:[]}, w||{});
}
function blankExplore(){
  const o={}; LOGLINE_SLOTS.forEach(s=>o[s.key]=""); return o;
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
    ideaBlocks: Array.isArray(p.ideaBlocks)?p.ideaBlocks.map(x=>Object.assign({id:uid(),text:"",tags:[]},x)):b.ideaBlocks,
    explore: Object.assign({}, b.explore, p.explore||{}),
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
    plot:Array(12).fill(""),
    ideaBlocks:[],
    explore:blankExplore()};
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
const TAB_KEY = "storyhelper_activeTab";
const TAB_NAMES = [...document.querySelectorAll(".tab")].map(t=>t.dataset.tab);
let activeTab = (function(){
  const saved = localStorage.getItem(TAB_KEY);
  return TAB_NAMES.includes(saved) ? saved : "idea";
})();
document.querySelectorAll(".tab").forEach(t=>{
  t.classList.toggle("active", t.dataset.tab===activeTab);
  t.onclick=()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    t.classList.add("active"); activeTab=t.dataset.tab; localStorage.setItem(TAB_KEY, activeTab); render();
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
    if(!P.explore) P.explore=blankExplore();
    if(!DB.workDB) DB.workDB=fillWorkDB();
    if(activeTab==="admin" && !isAdmin()){
      app.innerHTML='<div class="card"><h2>🔒 접근 권한이 없습니다</h2>'
        +'<p class="hint">이 메뉴는 관리자 계정(studio.inknpen@gmail.com)으로 로그인해야 사용할 수 있습니다.</p></div>';
      return;
    }
    const renderers={idea:rIdea, explore:rExplore, admin:rAdmin, character:rChar, world:rWorld, background:rBg,
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

/* ===== 💡 아이디어 모음 ===== */
let ideaFilterTags=[];
let ideaPendingTags=[];
let ideaTagPickerFor=null;

function rIdea(){
  if(!Array.isArray(P.ideaBlocks)) P.ideaBlocks=[];
  const allTags=[...new Set(P.ideaBlocks.flatMap(b=>b.tags||[]))];

  const c=document.createElement("div");
  c.innerHTML=`<div class="card">
    <input type="text" id="ideaNewInput" placeholder="아이디어를 작성해보세요">
    <div class="idea-compose-row">
      <input type="text" id="ideaNewTagInput" placeholder="태그 입력 후 Enter">
    </div>
    <div class="idea-tag-row" id="ideaPendingTagRow"></div>
    ${allTags.length?'<label>기존 태그에서 선택</label><div class="idea-tag-row" id="ideaExistingTagRow"></div>':""}
  </div>`;
  app.appendChild(c);

  const pendingRow=c.querySelector("#ideaPendingTagRow");
  const existingRow=c.querySelector("#ideaExistingTagRow");
  function renderPending(){
    pendingRow.innerHTML="";
    ideaPendingTags.forEach(t=>{
      const tp=document.createElement("span"); tp.className="idea-tag";
      tp.innerHTML=`${esc(t)} <span class="idea-tag-x">✕</span>`;
      tp.querySelector(".idea-tag-x").onclick=()=>{ ideaPendingTags=ideaPendingTags.filter(x=>x!==t); renderPending(); renderExisting(); };
      pendingRow.appendChild(tp);
    });
  }
  function renderExisting(){
    if(!existingRow)return;
    existingRow.innerHTML="";
    allTags.forEach(t=>{
      const b=document.createElement("span");
      b.className="idea-tag filter"+(ideaPendingTags.includes(t)?" on":"");
      b.textContent=t;
      b.onclick=()=>{
        ideaPendingTags=ideaPendingTags.includes(t)?ideaPendingTags.filter(x=>x!==t):[...ideaPendingTags,t];
        renderPending(); renderExisting();
      };
      existingRow.appendChild(b);
    });
  }
  renderPending(); renderExisting();

  const tagInput=c.querySelector("#ideaNewTagInput");
  tagInput.onkeydown=e=>{
    if(e.key==="Enter" && tagInput.value.trim()){
      const t=tagInput.value.trim();
      if(!ideaPendingTags.includes(t)) ideaPendingTags.push(t);
      tagInput.value=""; renderPending(); renderExisting();
    }
  };

  ideaFilterTags=ideaFilterTags.filter(t=>allTags.includes(t));
  if(allTags.length){
    const fc=document.createElement("div"); fc.className="card idea-filter-card";
    fc.innerHTML=`<div class="idea-filter-bar" id="ideaFilterBar"></div>`;
    app.appendChild(fc);
    const bar=fc.querySelector("#ideaFilterBar");
    const allBtn=document.createElement("span");
    allBtn.className="idea-tag filter"+(ideaFilterTags.length===0?" on":"");
    allBtn.textContent="전체";
    allBtn.onclick=()=>{ ideaFilterTags=[]; render(); };
    bar.appendChild(allBtn);
    allTags.forEach(t=>{
      const b=document.createElement("span");
      b.className="idea-tag filter"+(ideaFilterTags.includes(t)?" on":"");
      b.textContent=t;
      b.onclick=()=>{
        ideaFilterTags=ideaFilterTags.includes(t)?ideaFilterTags.filter(x=>x!==t):[...ideaFilterTags,t];
        render();
      };
      bar.appendChild(b);
    });
  }

  const list=document.createElement("div"); list.className="idea-block-list";
  app.appendChild(list);
  const shown=P.ideaBlocks.filter(b=>ideaFilterTags.length===0||ideaFilterTags.some(t=>(b.tags||[]).includes(t)));
  if(!shown.length){
    const e=document.createElement("p"); e.className="hint";
    e.textContent=P.ideaBlocks.length?"이 태그에 해당하는 아이디어가 없습니다.":"위 입력창에 첫 아이디어를 적어보세요.";
    list.appendChild(e);
  }
  shown.slice().reverse().forEach(b=>list.appendChild(ideaBlockCard(b, allTags)));

  const input=c.querySelector("#ideaNewInput");
  input.onkeydown=e=>{
    if(e.key==="Enter" && input.value.trim()){
      P.ideaBlocks.push({id:uid(), text:input.value.trim(), tags:[...ideaPendingTags]});
      ideaPendingTags=[];
      input.value="";
      save(); render();
    }
  };
}

function ideaBlockCard(b, allTags){
  const d=document.createElement("div"); d.className="idea-block";
  const head=document.createElement("div"); head.className="idea-block-text";
  head.contentEditable="true"; head.spellcheck=false; head.textContent=b.text;
  head.oninput=()=>{ b.text=head.textContent; save(); };
  const del=document.createElement("button"); del.className="idea-del"; del.textContent="✕"; del.title="삭제";
  del.onclick=()=>{
    if(!confirm("이 아이디어를 삭제할까요?"))return;
    P.ideaBlocks=P.ideaBlocks.filter(x=>x.id!==b.id); save(); render();
  };
  const tagsWrap=document.createElement("div"); tagsWrap.className="idea-block-tags";
  (b.tags||[]).forEach(t=>{
    const tp=document.createElement("span"); tp.className="idea-tag";
    tp.innerHTML=`${esc(t)} <span class="idea-tag-x">✕</span>`;
    tp.querySelector(".idea-tag-x").onclick=()=>{ b.tags=b.tags.filter(x=>x!==t); save(); render(); };
    tagsWrap.appendChild(tp);
  });
  const addTag=document.createElement("span"); addTag.className="idea-tag add"; addTag.textContent="＋ 태그";
  addTag.onclick=()=>{
    ideaTagPickerFor=(ideaTagPickerFor===b.id)?null:b.id;
    render();
  };
  tagsWrap.appendChild(addTag);
  d.appendChild(del); d.appendChild(head); d.appendChild(tagsWrap);

  if(ideaTagPickerFor===b.id){
    const picker=document.createElement("div"); picker.className="idea-tag-picker";
    const avail=(allTags||[]).filter(t=>!(b.tags||[]).includes(t));
    avail.forEach(t=>{
      const chip=document.createElement("span"); chip.className="idea-tag pick";
      chip.textContent=t;
      chip.onclick=()=>{
        b.tags=b.tags||[]; if(!b.tags.includes(t)) b.tags.push(t);
        ideaTagPickerFor=null; save(); render();
      };
      picker.appendChild(chip);
    });
    const newInput=document.createElement("input");
    newInput.type="text"; newInput.placeholder="새 태그 입력 후 Enter";
    newInput.onkeydown=e=>{
      if(e.key==="Enter" && newInput.value.trim()){
        const t=newInput.value.trim();
        b.tags=b.tags||[]; if(!b.tags.includes(t)) b.tags.push(t);
        ideaTagPickerFor=null; save(); render();
      }
    };
    picker.appendChild(newInput);
    d.appendChild(picker);
  }
  return d;
}

/* ===== 🔎 아이디어 탐색 (작품DB 매칭) ===== */
function splitRow(line){
  return line.split("|").map(s=>s.trim()).filter((s,i,a)=>!(i===0&&s==="")&&!(i===a.length-1&&s===""));
}
function rowsToWorks(headers, rows){
  const idx={};
  headers.forEach((h,i)=>{
    const clean=(h||"").trim();
    if(clean==="제목"||clean.toLowerCase()==="title") idx.title=i;
    LOGLINE_SLOTS.forEach(s=>{ if(clean===s.label) idx[s.key]=i; });
  });
  return rows.map(cells=>{
    const w={title:(idx.title!=null?(cells[idx.title]||""):"").trim(), slots:{}};
    LOGLINE_SLOTS.forEach(s=>{
      const raw=idx[s.key]!=null?(cells[idx[s.key]]||""):"";
      w.slots[s.key]=raw.split(/[,\/·]/).map(x=>x.trim()).filter(Boolean);
    });
    return w;
  }).filter(w=>w.title);
}
function parseMarkdownTable(text){
  const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.startsWith("|"));
  if(lines.length<2) return [];
  const headers=splitRow(lines[0]);
  const dataLines=lines.slice(1).filter(l=>!/^\|[\s\-:|]+\|$/.test(l));
  return rowsToWorks(headers, dataLines.map(splitRow));
}
function parseExcelBuffer(buf){
  const wb=XLSX.read(buf,{type:"array"});
  const sheet=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:""});
  if(!rows.length) return [];
  const headers=rows[0].map(h=>String(h||"").trim());
  const dataRows=rows.slice(1).map(r=>headers.map((_,i)=>String(r[i]!=null?r[i]:"")));
  return rowsToWorks(headers, dataRows);
}
function handleWorkDBFile(file){
  const name=file.name||"업로드파일";
  if(/\.(md|txt)$/i.test(name)){
    const rd=new FileReader();
    rd.onload=()=>applyWorkDB(parseMarkdownTable(rd.result), name);
    rd.readAsText(file,"utf-8");
  }else if(/\.(xlsx|xls)$/i.test(name)){
    if(typeof XLSX==="undefined"){ alert("엑셀 파싱 기능을 불러오지 못했습니다. 인터넷 연결을 확인 후 새로고침 해주세요."); return; }
    const rd=new FileReader();
    rd.onload=()=>applyWorkDB(parseExcelBuffer(new Uint8Array(rd.result)), name);
    rd.readAsArrayBuffer(file);
  }else{
    alert(".md 또는 .xlsx 파일만 업로드할 수 있습니다.");
  }
}
function applyWorkDB(works,name){
  if(!works.length){ alert("작품을 하나도 인식하지 못했습니다. 열 이름(제목/주인공 특성/시대/공간/사건 유형/위기 유형/원인·동기/해결 방식/결말)을 확인해주세요."); return; }
  DB.workDB={fileName:name, uploadedAt:new Date().toLocaleString(), works};
  save(); render();
}
function keywordOptions(key){
  const set=new Set();
  ((DB.workDB&&DB.workDB.works)||[]).forEach(w=>(w.slots[key]||[]).forEach(v=>v&&set.add(v)));
  return [...set].sort((a,b)=>a.localeCompare(b,"ko"));
}
function matchWorks(sel){
  const activeKeys=LOGLINE_SLOTS.map(s=>s.key).filter(k=>(sel[k]||"").trim());
  if(!activeKeys.length) return [];
  return ((DB.workDB&&DB.workDB.works)||[]).map(w=>{
    const matched=activeKeys.filter(k=>(w.slots[k]||[]).some(v=>v.toLowerCase()===sel[k].trim().toLowerCase()));
    return {work:w, matched, score:matched.length};
  }).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,10);
}
function rExplore(){
  if(!DB.workDB) DB.workDB=fillWorkDB();
  const wdb=DB.workDB;
  const c=document.createElement("div");
  c.innerHTML=`<div class="card">
    <h2>🔎 아이디어 탐색</h2>
    <p class="hint">슬롯을 선택해 로그라인을 조합하고, 등록된 작품DB에서 비슷한 작품을 찾아봅니다.</p>
  </div>`;
  app.appendChild(c);

  const slotsCard=document.createElement("div"); slotsCard.className="card";
  slotsCard.innerHTML=`<h3>로그라인 슬롯 선택</h3>
    <div class="explore-grid" id="slotGrid"></div>
    <div class="ai-box" id="loglinePreview"></div>
    <button class="btn ghost" id="saveAsIdea" style="margin-top:10px">＋ 이 로그라인을 아이디어로 저장</button>`;
  app.appendChild(slotsCard);
  const grid=slotsCard.querySelector("#slotGrid");
  function updatePreview(){
    const pv=slotsCard.querySelector("#loglinePreview");
    const sel=P.explore;
    const has=LOGLINE_SLOTS.some(s=>sel[s.key]);
    if(!has){ pv.className="ai-box empty"; pv.textContent="슬롯을 선택하면 로그라인 초안이 여기에 만들어집니다."; return; }
    pv.className="ai-box";
    pv.textContent=`${sel.era||"(시대 미정)"} ${sel.place||"(공간 미정)"}, ${sel.protagonist||"(특성 미정)"} 주인공이 `
      +`${sel.eventType||"(사건 미정)"}(으)로 ${sel.crisisType||"(위기 미정)"}을 겪지만, `
      +`${sel.motive||"(동기 미정)"} 때문에 ${sel.resolution||"(해결 미정)"}(으)로 맞서 결국 ${sel.ending||"(결말 미정)"}을 맞는다.`;
  }
  LOGLINE_SLOTS.forEach(s=>{
    const opts=keywordOptions(s.key);
    const wrap=document.createElement("div"); wrap.className="explore-slot";
    wrap.innerHTML=`<label>${s.label}</label>
      <select>${`<option value="">선택 안 함</option>`}${opts.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join("")}<option value="__custom__">직접 입력…</option></select>
      <input type="text" placeholder="${s.ph}" style="display:none;margin-top:6px">`;
    grid.appendChild(wrap);
    const sel=wrap.querySelector("select"), custom=wrap.querySelector("input");
    const cur=P.explore[s.key]||"";
    if(cur && opts.includes(cur)) sel.value=cur;
    else if(cur){ sel.value="__custom__"; custom.style.display="block"; custom.value=cur; }
    sel.onchange=()=>{
      if(sel.value==="__custom__"){ custom.style.display="block"; custom.focus(); }
      else{ custom.style.display="none"; custom.value=""; P.explore[s.key]=sel.value; save(); updatePreview(); }
    };
    custom.oninput=()=>{ P.explore[s.key]=custom.value.trim(); save(); updatePreview(); };
  });
  updatePreview();
  slotsCard.querySelector("#saveAsIdea").onclick=()=>{
    const text=slotsCard.querySelector("#loglinePreview").textContent;
    if(!Array.isArray(P.ideaBlocks)) P.ideaBlocks=[];
    P.ideaBlocks.push({id:uid(), text, tags:["탐색"]});
    save(); alert("아이디어 수집에 저장했습니다.");
  };

  const resultCard=document.createElement("div"); resultCard.className="card";
  resultCard.innerHTML=`<h3>비슷한 작품 찾기</h3>
    <button class="btn" id="matchBtn">🔍 매칭 작품 찾기</button>
    <div id="matchResults" class="explore-results"></div>`;
  app.appendChild(resultCard);
  resultCard.querySelector("#matchBtn").onclick=()=>{
    const box=resultCard.querySelector("#matchResults");
    if(!wdb.works.length){ box.innerHTML=`<p class="hint">먼저 작품DB를 업로드해주세요.</p>`; return; }
    const results=matchWorks(P.explore);
    if(!results.length){ box.innerHTML=`<p class="hint">일치하는 작품이 없습니다. 슬롯을 더 선택하거나 다르게 선택해보세요.</p>`; return; }
    box.innerHTML="";
    results.forEach(r=>{
      const d=document.createElement("div"); d.className="match-card";
      const pct=Math.round(r.score/LOGLINE_SLOTS.length*100);
      d.innerHTML=`<div class="match-head"><b>${esc(r.work.title)}</b><span class="match-score">${r.score}/${LOGLINE_SLOTS.length} 일치 (${pct}%)</span></div>
        <div class="match-tags">${r.matched.map(k=>{
          const slot=LOGLINE_SLOTS.find(x=>x.key===k);
          return `<span class="idea-tag">${esc(slot.label)}: ${esc(P.explore[k])}</span>`;
        }).join("")}</div>`;
      box.appendChild(d);
    });
  };
}

/* 🔐 관리자 — 작품DB 등록/관리 (studio.inknpen@gmail.com 전용) */
function rAdmin(){
  if(!DB.workDB) DB.workDB=fillWorkDB();
  const wdb=DB.workDB;
  const c=document.createElement("div"); c.className="card";
  c.innerHTML=`<h2>🔐 작품DB 관리</h2>
    <p class="hint">관리자 계정(${esc(ADMIN_EMAIL)})으로 로그인된 상태입니다. 여기서 등록한 작품DB는 모든 학생의 "아이디어 탐색" 탭에서 공통으로 사용됩니다.</p>
    <div class="explore-dbstatus">${wdb.works.length
      ?`📚 <b>${esc(wdb.fileName)}</b> — 작품 ${wdb.works.length}개 (${esc(wdb.uploadedAt)})`
      :`아직 작품DB가 없습니다. 아래에서 파일을 업로드하세요.`}</div>
    <label class="btn ghost" style="display:inline-block;margin-top:8px">📂 작품DB 업로드 (.md / .xlsx)
      <input type="file" id="wdbIn" accept=".md,.txt,.xlsx,.xls" style="display:none"></label>
    ${wdb.works.length?`<button class="btn sm danger" id="wdbClear" style="margin-left:8px">DB 비우기</button>`:""}
    <p class="hint" style="margin-top:10px">파일 형식: 첫 행(헤더)에 <b>제목, 주인공 특성, 시대, 공간, 사건 유형, 위기 유형, 원인·동기, 해결 방식, 결말</b> 열을 두고, 한 칸에 키워드가 여러 개면 쉼표(,)로 구분하세요. (md는 표 형식, xlsx는 첫 시트 사용)</p>
    <div id="wdbList"></div>`;
  app.appendChild(c);
  c.querySelector("#wdbIn").onchange=e=>{ const f=e.target.files[0]; if(f) handleWorkDBFile(f); e.target.value=""; };
  const clearBtn=c.querySelector("#wdbClear");
  if(clearBtn) clearBtn.onclick=()=>{ if(confirm("업로드한 작품DB를 모두 삭제할까요?")){ DB.workDB=fillWorkDB(); save(); render(); } };
  const listBox=c.querySelector("#wdbList");
  if(wdb.works.length){
    listBox.innerHTML=`<label style="margin-top:16px">등록된 작품 목록 (${wdb.works.length})</label>
      <div class="hint" style="max-height:220px;overflow-y:auto;border:1px solid var(--line);border-radius:8px;padding:10px 12px">
        ${wdb.works.map(w=>esc(w.title)).join(", ")}
      </div>`;
  }
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
document.getElementById("aboutLink").onclick=e=>{
  e.preventDefault();
  alert("글쓰기도우미\n웹툰 전공 스토리 제작 도구\n\n- 데이터는 이 브라우저에만 저장됩니다\n- 정기적으로 '백업 파일 내보내기'를 권장합니다");
};

/* 초기 렌더 */
refreshProjSelect();
refreshAdminTabVisibility();
render();
window.addEventListener("load",()=>{ if(typeof initGoogle==="function") initGoogle(); });
