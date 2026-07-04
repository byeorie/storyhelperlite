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
    <button class="btn ghost" id="saveAsIdea" s