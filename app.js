/* ===== 상태 & 저장 ===== */
const LS_KEY = "storyhelper_v1";
const ADMIN_USERNAME = "profh";
function isAdmin(){ return typeof currentUser!=="undefined" && currentUser && currentUser.username===ADMIN_USERNAME; }
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
    tagColors: Object.assign({}, b.tagColors, p.tagColors||{}),
    plotDoc: fillPlotDoc(p.plotDoc),
    writeDoc: fillWriteDoc(p.writeDoc),
    explore: Object.assign({}, b.explore, p.explore||{}),
  });
}
function save(){
  localStorage.setItem(LS_KEY, JSON.stringify(DB));
  const el=document.getElementById("saveStatus");
  if(el){ el.textContent="저장됨"; el.style.opacity=1; setTimeout(()=>el.style.opacity=.4,1000); }
  if(typeof saveToServer==="function") saveToServer();
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
    tagColors:{},
    plotDoc:{structure:"", sections:[], ideaOverrides:{}},
    writeDoc:{blocks:[]},
    explore:blankExplore()};
}
/* writeDoc 기본값 보정 (본문/대사를 공통 하위블록 items로 통합) */
function fillWriteDoc(wd){
  const b={blocks:[]};
  if(!wd||typeof wd!=="object") return b;
  return {blocks: Array.isArray(wd.blocks) ? wd.blocks.map(x=>{
    let items=[];
    if(Array.isArray(x.items)){
      items=x.items.map(it=>({id:it.id||uid(), type:(it.type==="line"?"line":"text"), char:it.char||"", text:it.text||""}));
    }else{ /* 구버전(text + lines) 마이그레이션 */
      if(x.text) items.push({id:uid(), type:"text", char:"", text:x.text});
      if(Array.isArray(x.lines)) x.lines.forEach(l=>items.push({id:l.id||uid(), type:"line", char:l.char||"", text:l.text||""}));
    }
    return {id:x.id||uid(), sectionId:x.sectionId||"", fromIdea:x.fromIdea||"", title:x.title||"", items};
  }) : []};
}
/* plotDoc 기본값 보정 (예전 데이터 안전 처리) */
function fillPlotDoc(pd){
  const b={structure:"", sections:[], ideaOverrides:{}};
  if(!pd||typeof pd!=="object") return b;
  return {
    structure: pd.structure||"",
    sections: Array.isArray(pd.sections)
      ? pd.sections.map(s=>({id:s.id||uid(), name:s.name||"섹션", desc:s.desc||"", ideaIds:Array.isArray(s.ideaIds)?s.ideaIds.slice():[]}))
      : [],
    ideaOverrides: (pd.ideaOverrides && typeof pd.ideaOverrides==="object") ? Object.assign({}, pd.ideaOverrides) : {},
  };
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
    app.classList.toggle("wide", activeTab==="write");
    if(!P) P=currentProject();
    if(!P.idea) P.idea={protagonistType:"",protagonistMbti:"",genre:"",endingType:"",logline:""};
    if(!P.explore) P.explore=blankExplore();
    if(!DB.workDB) DB.workDB=fillWorkDB();
    if(activeTab==="admin" && !isAdmin()){
      app.innerHTML='<div class="card"><h2>🔒 접근 권한이 없습니다</h2>'
        +'<p class="hint">이 메뉴는 관리자 계정으로 로그인해야 사용할 수 있습니다.</p></div>';
      return;
    }
    const renderers={idea:rIdea, explore:rExplore, admin:rAdmin, character:rChar, world:rWorld, background:rBg,
      event:rEvent, plot:rPlot, write:rWrite, export:rExport};
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

/* 태그 색상 팔레트 & 유틸 */
const TAG_PALETTE=["#c4654a","#5a8f6b","#4a7fc4","#c4a34a","#8a4ac4","#c44a91","#3fada0","#c47a4a","#6a6ac4","#a0a842"];
function hashStr(s){ let h=0; for(let i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))|0; } return Math.abs(h); }
function getTagColor(tag){
  if(!P.tagColors) P.tagColors={};
  if(P.tagColors[tag]) return P.tagColors[tag];
  return TAG_PALETTE[hashStr(tag)%TAG_PALETTE.length];
}
function setTagColor(tag,color){
  if(!P.tagColors) P.tagColors={};
  P.tagColors[tag]=color; save(); render();
}
function hexToRgba(hex, alpha){
  let h=(hex||"#999999").replace("#","");
  if(h.length===3) h=h.split("").map(c=>c+c).join("");
  const n=parseInt(h,16);
  const r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  return `rgba(${r},${g},${b},${alpha})`;
}
/* 색상 점을 클릭하면 네이티브 컬러피커를 띄워 태그 색을 바꿈 */
function openTagColorPicker(tag){
  const inp=document.createElement("input");
  inp.type="color";
  inp.value=getTagColor(tag);
  inp.style.position="fixed"; inp.style.opacity="0"; inp.style.pointerEvents="none"; inp.style.left="-100px"; inp.style.top="0";
  document.body.appendChild(inp);
  inp.onchange=()=>{ setTagColor(tag, inp.value); inp.remove(); };
  inp.onblur=()=>{ setTimeout(()=>{ if(inp.parentNode) inp.remove(); },300); };
  setTimeout(()=>inp.click(),0);
}
/* 태그 칩 하나 생성 (색상 점 + 라벨 [+ 삭제버튼]) */
function makeTagChip(tag, opts){
  opts=opts||{};
  const wrap=document.createElement("span");
  let cls="idea-tag";
  if(opts.filterStyle) cls+=" filter";
  if(opts.pickStyle) cls+=" pick";
  if(opts.active) cls+=" on";
  wrap.className=cls;
  const color=getTagColor(tag);
  if(opts.active){
    wrap.style.background=color; wrap.style.borderColor=color; wrap.style.color="#fff";
  }else{
    wrap.style.background=hexToRgba(color,0.14);
    wrap.style.borderColor=hexToRgba(color,0.55);
    wrap.style.color=color;
  }
  const dot=document.createElement("span"); dot.className="tag-color-dot";
  dot.style.background=color; dot.title="태그 색상 변경";
  dot.onclick=(e)=>{ e.stopPropagation(); openTagColorPicker(tag); };
  wrap.appendChild(dot);
  const label=document.createElement("span"); label.textContent=tag;
  wrap.appendChild(label);
  if(opts.onClick) wrap.onclick=opts.onClick;
  if(opts.removable){
    const x=document.createElement("span"); x.className="idea-tag-x"; x.textContent="✕";
    x.onclick=(e)=>{ e.stopPropagation(); opts.onRemove&&opts.onRemove(); };
    wrap.appendChild(x);
  }
  return wrap;
}
/* 드래그 정렬: 마우스 y좌표 기준으로 삽입 위치 계산 */
function getDragAfterElement(container, y){
  const els=[...container.querySelectorAll(".idea-block:not(.dragging)")];
  return els.reduce((closest, child)=>{
    const box=child.getBoundingClientRect();
    const offset=y-box.top-box.height/2;
    if(offset<0 && offset>closest.offset) return {offset, element:child};
    return closest;
  }, {offset:-Infinity, element:null}).element;
}
/* 드롭 후 화면에 보이던 순서를 실제 저장 순서(P.ideaBlocks)에 반영 */
function reorderIdeaBlocks(orderedIdsTopToBottom){
  const idToBlock={};
  P.ideaBlocks.forEach(b=>idToBlock[b.id]=b);
  const shownIds=new Set(orderedIdsTopToBottom);
  const newShownStorageOrder=orderedIdsTopToBottom.slice().reverse();
  let si=0;
  P.ideaBlocks=P.ideaBlocks.map(b=> shownIds.has(b.id) ? idToBlock[newShownStorageOrder[si++]] : b);
}
document.addEventListener("mouseup", ()=>{
  document.querySelectorAll(".idea-block[draggable=true], .plot-idea[draggable=true], .plot-section[draggable=true], .scene-block[draggable=true], .sub-block[draggable=true]").forEach(el=>el.draggable=false);
});

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
      pendingRow.appendChild(makeTagChip(t,{
        removable:true,
        onRemove:()=>{ ideaPendingTags=ideaPendingTags.filter(x=>x!==t); renderPending(); renderExisting(); }
      }));
    });
  }
  function renderExisting(){
    if(!existingRow)return;
    existingRow.innerHTML="";
    allTags.forEach(t=>{
      existingRow.appendChild(makeTagChip(t,{
        filterStyle:true,
        active:ideaPendingTags.includes(t),
        onClick:()=>{
          ideaPendingTags=ideaPendingTags.includes(t)?ideaPendingTags.filter(x=>x!==t):[...ideaPendingTags,t];
          renderPending(); renderExisting();
        }
      }));
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
      bar.appendChild(makeTagChip(t,{
        filterStyle:true,
        active:ideaFilterTags.includes(t),
        onClick:()=>{
          ideaFilterTags=ideaFilterTags.includes(t)?ideaFilterTags.filter(x=>x!==t):[...ideaFilterTags,t];
          render();
        }
      }));
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

  /* 드래그로 순서 변경 */
  list.addEventListener("dragover", e=>{
    e.preventDefault();
    const dragging=list.querySelector(".idea-block.dragging");
    if(!dragging) return;
    const after=getDragAfterElement(list, e.clientY);
    if(after==null) list.appendChild(dragging);
    else list.insertBefore(dragging, after);
  });
  list.addEventListener("drop", e=>{
    e.preventDefault();
    const dragging=list.querySelector(".idea-block.dragging");
    if(!dragging) return;
    const ids=[...list.querySelectorAll(".idea-block")].map(el=>el.dataset.id);
    reorderIdeaBlocks(ids);
    save(); render();
  });

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
  const d=document.createElement("div"); d.className="idea-block"; d.dataset.id=b.id;
  d.draggable=false;

  const primaryColor=(b.tags&&b.tags.length)?getTagColor(b.tags[0]):null;
  if(primaryColor){
    d.style.borderLeftColor=primaryColor;
    d.style.background=hexToRgba(primaryColor,0.06);
  }

  const handle=document.createElement("span"); handle.className="idea-handle";
  handle.textContent="⠿"; handle.title="드래그해서 순서 변경";
  handle.addEventListener("mousedown", ()=>{ d.draggable=true; });
  handle.addEventListener("touchstart", ()=>{ d.draggable=true; }, {passive:true});
  d.addEventListener("dragstart", e=>{
    e.dataTransfer.effectAllowed="move";
    e.dataTransfer.setData("text/plain", b.id);
    setTimeout(()=>d.classList.add("dragging"),0);
  });
  d.addEventListener("dragend", ()=>{ d.draggable=false; d.classList.remove("dragging"); });

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
    tagsWrap.appendChild(makeTagChip(t,{
      removable:true,
      onRemove:()=>{ b.tags=b.tags.filter(x=>x!==t); save(); render(); }
    }));
  });
  const addTag=document.createElement("span"); addTag.className="idea-tag add"; addTag.textContent="＋ 태그";
  addTag.onclick=()=>{
    ideaTagPickerFor=(ideaTagPickerFor===b.id)?null:b.id;
    render();
  };
  tagsWrap.appendChild(addTag);
  d.appendChild(handle); d.appendChild(del); d.appendChild(head); d.appendChild(tagsWrap);

  if(ideaTagPickerFor===b.id){
    const picker=document.createElement("div"); picker.className="idea-tag-picker";
    const avail=(allTags||[]).filter(t=>!(b.tags||[]).includes(t));
    avail.forEach(t=>{
      picker.appendChild(makeTagChip(t,{
        pickStyle:true,
        onClick:()=>{
          b.tags=b.tags||[]; if(!b.tags.includes(t)) b.tags.push(t);
          ideaTagPickerFor=null; save(); render();
        }
      }));
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

/* 🔐 관리자 — 작품DB 등록/관리 (아이디: profh 전용) */
function rAdmin(){
  if(!DB.workDB) DB.workDB=fillWorkDB();
  const wdb=DB.workDB;
  const c=document.createElement("div"); c.className="card";
  c.innerHTML=`<h2>🔐 작품DB 관리</h2>
    <p class="hint">관리자 계정(${esc(ADMIN_USERNAME)})으로 로그인된 상태입니다. 여기서 등록한 작품DB는 모든 학생의 "아이디어 탐색" 탭에서 공통으로 사용됩니다.</p>
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

/* ===== 📖 플롯 생성 ===== */
let plotPickerFor=null;       // 현재 아이디어 피커가 열린 섹션 id
let plotPickerFilter=[];      // 피커 내 태그 필터
const plotCollapsed=new Set();// 접힌 섹션 id (화면 상태, 저장 안 함)
/* 아이디어 id로 블록 찾기 */
function findIdea(id){ return (P.ideaBlocks||[]).find(b=>b.id===id); }
/* 플롯에서 표시할 아이디어 텍스트 — 오버라이드가 있으면 그것(아이디어 수집과 독립), 없으면 원본 */
function plotIdeaText(id){
  const ov=P.plotDoc.ideaOverrides||{};
  if(Object.prototype.hasOwnProperty.call(ov,id)) return ov[id];
  const idea=findIdea(id); return idea?(idea.text||""):"";
}
function setPlotIdeaText(id, text){
  if(!P.plotDoc.ideaOverrides) P.plotDoc.ideaOverrides={};
  P.plotDoc.ideaOverrides[id]=text; save();
}
/* 어느 섹션에도 배치되지 않은 아이디어 목록 */
function unplacedIdeas(){
  const placed=new Set();
  (P.plotDoc.sections||[]).forEach(s=>(s.ideaIds||[]).forEach(id=>placed.add(id)));
  return (P.ideaBlocks||[]).filter(b=>!placed.has(b.id));
}
/* 존재하지 않는 아이디어 참조 정리 */
function cleanPlotRefs(){
  const exist=new Set((P.ideaBlocks||[]).map(b=>b.id));
  (P.plotDoc.sections||[]).forEach(s=>{ s.ideaIds=(s.ideaIds||[]).filter(id=>exist.has(id)); });
}

function rPlot(){
  if(!P.plotDoc) P.plotDoc={structure:"", sections:[]};
  cleanPlotRefs();

  /* 아직 구조를 고르지 않았으면 선택 화면 */
  if(!P.plotDoc.structure){
    const c=document.createElement("div"); c.className="card";
    c.innerHTML=`<h2>📖 플롯 생성</h2>
      <p class="hint">먼저 이야기의 뼈대가 될 플롯 구조를 선택하세요. 선택한 구조에 맞춰 기본 섹션이 만들어지고, 그 안에 <b>아이디어 수집</b>에서 모은 아이디어를 끌어다 배치할 수 있습니다.</p>
      <div class="plot-structure-choices" id="structChoices"></div>`;
    app.appendChild(c);
    const box=c.querySelector("#structChoices");
    Object.keys(PLOT_STRUCTURES).forEach(key=>{
      const st=PLOT_STRUCTURES[key];
      const b=document.createElement("button"); b.className="plot-struct-btn";
      b.innerHTML=`<div class="ps-title">${st.label}</div>
        <div class="ps-sub">${st.sections.map(s=>esc(s.name)).join(" · ")}</div>`;
      b.onclick=()=>{
        P.plotDoc={structure:key, sections:st.sections.map(s=>({id:uid(), name:s.name, desc:s.desc||"", ideaIds:[]}))};
        save(); render();
      };
      box.appendChild(b);
    });
    return;
  }

  /* 헤더 */
  const struct=PLOT_STRUCTURES[P.plotDoc.structure];
  const head=document.createElement("div"); head.className="card";
  head.innerHTML=`<h2>📖 플롯 생성</h2>
    <p class="hint">현재 구조: <b>${struct?struct.label:"사용자 구조"}</b> · 각 섹션의 <b>＋ 아이디어 추가</b>로 아이디어를 담고, 핸들(⠿)로 순서를 바꿀 수 있습니다. 아이디어 텍스트를 클릭하거나 <b>✎</b> 버튼을 누르면 바로 수정할 수 있어요(아이디어 수집 원본과 별개).</p>
    <div class="plot-toolbar">
      <button class="btn ghost sm" id="addSection">＋ 섹션 추가</button>
      <button class="btn danger sm" id="changeStruct">구조 변경</button>
    </div>`;
  app.appendChild(head);
  head.querySelector("#addSection").onclick=()=>{
    const name=prompt("새 섹션 이름:","새 섹션"); if(name===null)return;
    P.plotDoc.sections.push({id:uid(), name:name||"새 섹션", desc:"", ideaIds:[]});
    save(); render();
  };
  head.querySelector("#changeStruct").onclick=()=>{
    if(!confirm("구조를 변경하면 현재 섹션 구성이 초기화됩니다. (아이디어 원본은 아이디어 수집에 그대로 남습니다.) 계속할까요?"))return;
    P.plotDoc={structure:"", sections:[]}; save(); render();
  };

  /* 섹션들 */
  const secWrap=document.createElement("div"); secWrap.className="plot-sections";
  app.appendChild(secWrap);
  P.plotDoc.sections.forEach((sec,idx)=>{
    secWrap.appendChild(plotSectionCard(sec, idx, secWrap));
  });

  /* 섹션 순서 드래그 */
  secWrap.addEventListener("dragover", e=>{
    const dragging=secWrap.querySelector(".plot-section.sec-dragging");
    if(!dragging) return;
    e.preventDefault();
    const after=getDragAfterEl(secWrap, e.clientY, ".plot-section:not(.sec-dragging)");
    if(after==null) secWrap.appendChild(dragging);
    else secWrap.insertBefore(dragging, after);
  });
  secWrap.addEventListener("drop", e=>{
    if(!secWrap.querySelector(".plot-section.sec-dragging")) return;
    e.preventDefault();
    const order=[...secWrap.querySelectorAll(".plot-section")].map(el=>el.dataset.secid);
    P.plotDoc.sections.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
    save(); render();
  });

  /* 아이디어 선택 팝업 (열려 있을 때만) */
  if(plotPickerFor){
    const sec=P.plotDoc.sections.find(s=>s.id===plotPickerFor);
    if(sec) app.appendChild(plotPickerModal(sec));
    else plotPickerFor=null;
  }
}

/* 섹션 카드 하나 렌더 */
function plotSectionCard(sec, idx, secWrap){
  const card=document.createElement("div"); card.className="card plot-section"; card.dataset.secid=sec.id;
  const collapsed=plotCollapsed.has(sec.id);

  /* 헤더 */
  const h=document.createElement("div"); h.className="plot-section-head";
  const num=document.createElement("span"); num.className="plot-sec-num"; num.textContent=idx+1;
  const nameEl=document.createElement("span"); nameEl.className="plot-sec-name"; nameEl.textContent=sec.name;
  const spacer=document.createElement("span"); spacer.className="plot-sec-spacer";
  const cnt=document.createElement("span"); cnt.className="plot-sec-count"; cnt.textContent=`${(sec.ideaIds||[]).length}개`;
  // 이름 수정
  const editBtn=iconBtn("✎","이름 수정",()=>{
    const nm=prompt("섹션 이름:",sec.name); if(nm===null)return;
    sec.name=nm||sec.name; save(); render();
  });
  // 아이디어 추가
  const addBtn=iconBtn("＋","아이디어 추가",()=>togglePicker(sec));
  // 섹션 이동 핸들
  const moveBtn=iconBtn("☰","드래그해서 섹션 순서 변경",null);
  moveBtn.classList.add("plot-sec-move");
  moveBtn.addEventListener("mousedown", ()=>{ card.draggable=true; });
  moveBtn.addEventListener("touchstart", ()=>{ card.draggable=true; }, {passive:true});
  card.addEventListener("dragstart", e=>{
    if(!card.draggable) return;
    e.dataTransfer.effectAllowed="move";
    setTimeout(()=>card.classList.add("sec-dragging"),0);
  });
  card.addEventListener("dragend", ()=>{ card.draggable=false; card.classList.remove("sec-dragging"); });
  // 접기/펼치기
  const collBtn=iconBtn(collapsed?"▸":"▾", collapsed?"펼치기":"접기", ()=>{
    if(collapsed) plotCollapsed.delete(sec.id); else plotCollapsed.add(sec.id);
    render();
  });
  // 삭제
  const delBtn=iconBtn("🗑","섹션 삭제",()=>{
    if((sec.ideaIds||[]).length && !confirm("이 섹션의 아이디어 배치가 해제됩니다. (원본은 유지) 삭제할까요?"))return;
    P.plotDoc.sections=P.plotDoc.sections.filter(x=>x.id!==sec.id); save(); render();
  });
  delBtn.classList.add("plot-sec-del");
  h.append(num, nameEl, spacer, cnt, editBtn, addBtn, moveBtn, collBtn, delBtn);
  card.appendChild(h);

  if(collapsed) return card;

  /* 예시 설명 */
  if(sec.desc){ const dsc=document.createElement("p"); dsc.className="plot-sec-desc"; dsc.textContent=sec.desc; card.appendChild(dsc); }

  /* 배치된 아이디어 (드롭존) */
  const body=document.createElement("div"); body.className="plot-drop plot-section-body"; body.dataset.sec=sec.id;
  const ids=(sec.ideaIds||[]);
  ids.forEach(id=>{ const b=findIdea(id); if(b) body.appendChild(plotIdeaCard(b)); });
  card.appendChild(body);
  // 아이디어 카드 드래그(섹션 간 이동/정렬)
  body.addEventListener("dragover", e=>{
    const dragging=document.querySelector(".plot-idea.dragging");
    if(!dragging) return;
    e.preventDefault();
    const after=getDragAfterEl(body, e.clientY, ".plot-idea:not(.dragging)");
    if(after==null) body.appendChild(dragging);
    else body.insertBefore(dragging, after);
  });
  body.addEventListener("drop", e=>{
    if(!document.querySelector(".plot-idea.dragging")) return;
    e.preventDefault();
    rebuildPlotFromDOM(secWrap);
    save(); render();
  });

  /* ＋ 아이디어 추가 박스 (드래그로 이 섹션에 떨어뜨리는 것도 가능) */
  const addBox=document.createElement("div"); addBox.className="plot-add-box";
  addBox.innerHTML=`<span class="plot-add-plus">＋</span><span class="plot-add-label">아이디어 추가</span>`;
  addBox.onclick=()=>togglePicker(sec);
  addBox.addEventListener("dragover", e=>{
    const dragging=document.querySelector(".plot-idea.dragging");
    if(!dragging) return;
    e.preventDefault();
    body.appendChild(dragging); addBox.classList.add("drop-hover");
  });
  addBox.addEventListener("dragleave", ()=>addBox.classList.remove("drop-hover"));
  addBox.addEventListener("drop", e=>{
    if(!document.querySelector(".plot-idea.dragging")) return;
    e.preventDefault();
    rebuildPlotFromDOM(secWrap); save(); render();
  });
  card.appendChild(addBox);

  return card;
}

/* 아이콘 버튼 헬퍼 */
function iconBtn(label, title, onClick){
  const b=document.createElement("button"); b.className="plot-icon-btn"; b.textContent=label; b.title=title;
  if(onClick) b.onclick=onClick;
  return b;
}
/* 피커 토글 (다른 섹션 열면 필터 초기화) */
function togglePicker(sec){
  if(plotPickerFor===sec.id){ plotPickerFor=null; }
  else { plotPickerFor=sec.id; plotPickerFilter=[]; }
  render();
}
/* 아이디어 선택 팝업 (미배치 아이디어 + 태그 필터) */
function plotPickerModal(sec){
  const overlay=document.createElement("div"); overlay.className="plot-modal-overlay";
  overlay.onclick=e=>{ if(e.target===overlay){ plotPickerFor=null; render(); } };
  const box=document.createElement("div"); box.className="plot-modal";
  const avail=unplacedIdeas();
  const tags=[...new Set(avail.flatMap(b=>b.tags||[]))];
  plotPickerFilter=plotPickerFilter.filter(t=>tags.includes(t));

  const top=document.createElement("div"); top.className="plot-picker-top";
  const ttl=document.createElement("span"); ttl.className="plot-picker-title"; ttl.textContent=`아이디어 선택 · ${sec.name}`;
  const closeBtn=iconBtn("✕","닫기",()=>{ plotPickerFor=null; render(); });
  top.append(ttl, closeBtn);
  box.appendChild(top);

  if(tags.length){
    const fbar=document.createElement("div"); fbar.className="plot-picker-filter";
    const all=document.createElement("span");
    all.className="idea-tag filter"+(plotPickerFilter.length===0?" on":"");
    all.textContent="전체";
    all.onclick=()=>{ plotPickerFilter=[]; render(); };
    fbar.appendChild(all);
    tags.forEach(t=>{
      fbar.appendChild(makeTagChip(t,{
        filterStyle:true, active:plotPickerFilter.includes(t),
        onClick:()=>{ plotPickerFilter=plotPickerFilter.includes(t)?plotPickerFilter.filter(x=>x!==t):[...plotPickerFilter,t]; render(); }
      }));
    });
    box.appendChild(fbar);
  }

  const listed=avail.filter(b=>plotPickerFilter.length===0||plotPickerFilter.some(t=>(b.tags||[]).includes(t)));
  const list=document.createElement("div"); list.className="plot-picker-list";
  if(!listed.length){
    const e=document.createElement("p"); e.className="hint plot-empty";
    e.textContent=avail.length?"이 태그에 해당하는 아이디어가 없습니다.":"추가할 아이디어가 없습니다. (아이디어 수집에서 먼저 작성하세요)";
    list.appendChild(e);
  }
  listed.forEach(b=>{
    const it=document.createElement("div"); it.className="plot-pick-item";
    const color=(b.tags&&b.tags.length)?getTagColor(b.tags[0]):"var(--line)";
    it.style.borderLeftColor=color;
    const txt=document.createElement("span"); txt.className="plot-pick-text"; txt.textContent=b.text||"(빈 아이디어)";
    it.appendChild(txt);
    (b.tags||[]).forEach(t=>{
      const chip=document.createElement("span"); chip.className="plot-idea-tag";
      const cc=getTagColor(t);
      chip.style.background=hexToRgba(cc,0.14); chip.style.color=cc; chip.style.borderColor=hexToRgba(cc,0.5);
      chip.textContent=t; it.appendChild(chip);
    });
    it.onclick=()=>{
      sec.ideaIds=sec.ideaIds||[];
      if(!sec.ideaIds.includes(b.id)) sec.ideaIds.push(b.id);
      save(); render(); // 피커는 계속 열린 상태 유지(여러 개 연속 추가)
    };
    list.appendChild(it);
  });
  box.appendChild(list);
  overlay.appendChild(box);
  return overlay;
}
/* 삽입 위치 계산 (selector로 대상 지정) */
function getDragAfterEl(container, y, selector){
  const els=[...container.querySelectorAll(selector)];
  return els.reduce((closest, child)=>{
    const box=child.getBoundingClientRect();
    const offset=y-box.top-box.height/2;
    if(offset<0 && offset>closest.offset) return {offset, element:child};
    return closest;
  }, {offset:-Infinity, element:null}).element;
}
/* 화면(DOM)의 배치 상태를 plotDoc.sections에 반영 */
function rebuildPlotFromDOM(secWrap){
  secWrap.querySelectorAll(".plot-section-body").forEach(body=>{
    const secId=body.dataset.sec;
    const sec=P.plotDoc.sections.find(s=>s.id===secId);
    if(sec) sec.ideaIds=[...body.querySelectorAll(".plot-idea")].map(el=>el.dataset.id);
  });
}
/* 플롯용 아이디어 미니 카드 (드래그 가능, × 로 배치 해제) */
function plotIdeaCard(b){
  const d=document.createElement("div"); d.className="plot-idea"; d.dataset.id=b.id; d.draggable=false;
  const color=(b.tags&&b.tags.length)?getTagColor(b.tags[0]):"var(--line)";
  d.style.borderLeftColor=color;
  const handle=document.createElement("span"); handle.className="plot-idea-handle"; handle.textContent="⠿"; handle.title="드래그해서 이동";
  handle.addEventListener("mousedown", ()=>{ d.draggable=true; });
  handle.addEventListener("touchstart", ()=>{ d.draggable=true; }, {passive:true});
  d.addEventListener("dragstart", e=>{
    e.dataTransfer.effectAllowed="move";
    e.dataTransfer.setData("text/plain", b.id);
    setTimeout(()=>d.classList.add("dragging"),0);
  });
  d.addEventListener("dragend", ()=>{ d.draggable=false; d.classList.remove("dragging"); });
  const content=document.createElement("div"); content.className="plot-idea-content";
  const txt=document.createElement("div"); txt.className="plot-idea-text";
  txt.contentEditable="true"; txt.spellcheck=false; txt.dataset.ph="아이디어 내용";
  txt.textContent=plotIdeaText(b.id);
  txt.oninput=()=>{ setPlotIdeaText(b.id, txt.textContent); };
  content.appendChild(txt);
  if((b.tags||[]).length){
    const tags=document.createElement("div"); tags.className="plot-idea-tags";
    (b.tags||[]).forEach(t=>{
      const chip=document.createElement("span"); chip.className="plot-idea-tag";
      const cc=getTagColor(t);
      chip.style.background=hexToRgba(cc,0.14); chip.style.color=cc; chip.style.borderColor=hexToRgba(cc,0.5);
      chip.textContent=t;
      tags.appendChild(chip);
    });
    content.appendChild(tags);
  }
  const editBtn=document.createElement("button"); editBtn.className="plot-idea-edit"; editBtn.textContent="✎"; editBtn.title="아이디어 수정 (원본과 별개)";
  editBtn.onclick=()=>{
    txt.focus();
    try{ const r=document.createRange(); r.selectNodeContents(txt); r.collapse(false);
      const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(r); }catch(e){}
  };
  const rm=document.createElement("button"); rm.className="plot-idea-rm"; rm.textContent="✕"; rm.title="이 섹션에서 빼기";
  rm.onclick=()=>{
    P.plotDoc.sections.forEach(s=>{ s.ideaIds=(s.ideaIds||[]).filter(x=>x!==b.id); });
    save(); render();
  };
  d.appendChild(handle); d.appendChild(content); d.appendChild(editBtn); d.appendChild(rm);
  return d;
}

/* ===== ✍️ 글쓰기 ===== */
let writeDlgFor=null;       // 대사 추가 팝업이 열린 블록 id
let writeFocusTitle=null;   // 렌더 후 제목 입력에 포커스할 블록 id

/* 섹션에 속한 장면 블록(배열 순서 유지) */
function blocksOfSection(secId){ return (P.writeDoc.blocks||[]).filter(b=>b.sectionId===secId); }
/* 블록 글자수 (모든 하위블록 텍스트 합) */
function blockChars(bl){
  let n=0; (bl.items||[]).forEach(it=>{ n+=(it.text||"").length; });
  return n;
}
/* 섹션별/전체 글자수 */
function sectionCharCounts(){
  const bySection={}; let total=0;
  (P.plotDoc.sections||[]).forEach(s=>{ bySection[s.id]=0; });
  (P.writeDoc.blocks||[]).forEach(b=>{
    const n=blockChars(b);
    if(bySection[b.sectionId]!=null) bySection[b.sectionId]+=n;
    total+=n;
  });
  return {bySection, total};
}

function rWrite(){
  if(!P.writeDoc) P.writeDoc={blocks:[]};
  const pd=P.plotDoc;
  if(!pd || !pd.structure || !pd.sections.length){
    const c=document.createElement("div"); c.className="card";
    c.innerHTML=`<h2>✍️ 글쓰기</h2><p class="hint">먼저 <b>플롯 생성</b>에서 플롯 구조를 만들어 주세요. 플롯 섹션이 글쓰기의 틀이 됩니다.</p>`;
    app.appendChild(c);
    return;
  }
  /* 구조에 없는(고아) 블록은 첫 섹션으로 회수 */
  const secIds=new Set(pd.sections.map(s=>s.id));
  let fixed=false;
  (P.writeDoc.blocks||[]).forEach(b=>{ if(!secIds.has(b.sectionId)){ b.sectionId=pd.sections[0].id; fixed=true; } });
  /* 예전에 불러온 블록(제목 없음)은 원본 아이디어 텍스트를 제목으로 1회 스냅샷 → 이후 독립 수정 */
  (P.writeDoc.blocks||[]).forEach(b=>{ if(b.fromIdea && !b.title){ const t=plotIdeaText(b.fromIdea); if(t){ b.title=t; fixed=true; } } });
  if(fixed) save();

  const layout=document.createElement("div"); layout.className="write-layout";
  app.appendChild(layout);

  /* 좌: 플롯 목록 + 글자수/% */
  const left=document.createElement("div"); left.className="write-plotlist";
  renderLeftInto(left);
  layout.appendChild(left);

  /* 중앙: 장면 블록 */
  const main=document.createElement("div"); main.className="write-main";
  const bar=document.createElement("div"); bar.className="write-toolbar";
  const loadBtn=document.createElement("button"); loadBtn.className="btn ghost sm";
  loadBtn.textContent="📥 플롯 불러오기";
  loadBtn.title="플롯 생성에서 각 섹션에 배치한 아이디어를 장면 블록으로 불러옵니다";
  loadBtn.onclick=loadPlotIntoWrite;
  bar.append(loadBtn);
  main.appendChild(bar);

  /* 우: 미리보기 (넓은 화면에서 상시 표시, 좁으면 CSS로 숨김) */
  const right=document.createElement("div"); right.className="write-preview";

  function liveRefresh(){
    renderLeftInto(left);
    renderPreviewInto(right);
  }

  let writeBlockNo=0; // 섹션 구분 없이 전체 연속 번호
  pd.sections.forEach((sec,i)=>{
    const group=document.createElement("div"); group.className="write-group"; group.id="wsec-"+sec.id;
    const div=document.createElement("div"); div.className="write-divider";
    div.innerHTML=`<span class="wd-num">${i+1}</span><span class="wd-name">${esc(sec.name)}</span><span class="wd-spacer"></span>`;
    const loadBtn=document.createElement("button"); loadBtn.className="wd-icon"; loadBtn.textContent="📥"; loadBtn.title="아이디어 불러오기";
    loadBtn.onclick=()=>loadSectionIdeas(sec);
    const createBtn=document.createElement("button"); createBtn.className="wd-icon"; createBtn.textContent="＋"; createBtn.title="블럭 생성";
    createBtn.onclick=()=>{ const nb={id:uid(), sectionId:sec.id, fromIdea:"", title:"", items:[]}; P.writeDoc.blocks.push(nb); writeFocusTitle=nb.id; save(); render(); };
    div.append(loadBtn, createBtn);
    group.appendChild(div);
    const list=document.createElement("div"); list.className="write-blocklist"; list.dataset.sec=sec.id;
    blocksOfSection(sec.id).forEach((bl)=>list.appendChild(sceneBlockCard(bl, main, liveRefresh, ++writeBlockNo)));
    group.appendChild(list);
    setupBlockDnD(list, main);
    main.appendChild(group);
  });
  layout.appendChild(main);
  renderPreviewInto(right);
  layout.appendChild(right);

  /* 대사 추가 팝업 */
  if(writeDlgFor){
    const bl=(P.writeDoc.blocks||[]).find(b=>b.id===writeDlgFor);
    if(bl) app.appendChild(dialogueModal(bl));
    else writeDlgFor=null;
  }
}

/* 플롯 생성에서 배치한 아이디어를 장면 블록으로 불러오기 (이미 불러온 아이디어는 건너뜀) */
function loadPlotIntoWrite(){
  const existing=new Set((P.writeDoc.blocks||[]).map(b=>b.fromIdea).filter(Boolean));
  let added=0;
  (P.plotDoc.sections||[]).forEach(sec=>{
    (sec.ideaIds||[]).forEach(id=>{
      if(existing.has(id)) return;
      P.writeDoc.blocks.push({id:uid(), sectionId:sec.id, fromIdea:id, title:plotIdeaText(id), items:[]});
      existing.add(id); added++;
    });
  });
  if(added){ save(); render(); alert(`플롯에서 ${added}개의 아이디어를 장면 블록으로 불러왔습니다.`); }
  else alert("새로 불러올 아이디어가 없습니다.\n(플롯 생성 탭에서 각 섹션에 아이디어를 배치해 주세요.)");
}
/* 특정 플롯 단계(섹션)의 배치 아이디어만 불러오기 */
function loadSectionIdeas(sec){
  const existing=new Set((P.writeDoc.blocks||[]).map(b=>b.fromIdea).filter(Boolean));
  let added=0;
  (sec.ideaIds||[]).forEach(id=>{
    if(existing.has(id)) return;
    P.writeDoc.blocks.push({id:uid(), sectionId:sec.id, fromIdea:id, title:plotIdeaText(id), items:[]});
    existing.add(id); added++;
  });
  if(added){ save(); render(); }
  else alert("이 단계에 새로 불러올 아이디어가 없습니다.\n(플롯 생성에서 이 단계에 아이디어를 배치해 주세요.)");
}

/* 좌측 플롯 목록 렌더 (글자수/% 실시간 갱신용으로 분리) */
function renderLeftInto(left){
  left.innerHTML="";
  const counts=sectionCharCounts();
  const total=counts.total;
  const head=document.createElement("div"); head.className="wpl-head";
  head.innerHTML=`<span>플롯 단계</span><span class="wpl-total">${total}자</span>`;
  left.appendChild(head);
  (P.plotDoc.sections||[]).forEach((sec,i)=>{
    const cc=counts.bySection[sec.id]||0;
    const pct= total ? Math.round(cc/total*100) : 0;
    const item=document.createElement("div"); item.className="wpl-item";
    item.innerHTML=`<div class="wpl-name">${i+1}. ${esc(sec.name)}</div>
      <div class="wpl-meta"><span>${cc}자</span><span class="wpl-pct">${pct}%</span></div>
      <div class="wpl-bar"><div class="wpl-bar-fill" style="width:${pct}%"></div></div>`;
    item.onclick=()=>{ const el=document.getElementById("wsec-"+sec.id); if(el) el.scrollIntoView({behavior:"smooth", block:"start"}); };
    /* 섹션에 속한 장면 블록(아이디어)을 순서대로 표시 */
    const blocks=blocksOfSection(sec.id);
    if(blocks.length){
      const bl=document.createElement("div"); bl.className="wpl-blocks";
      blocks.forEach((b,bi)=>{
        let label=(b.title&&b.title.trim())||"";
        if(!label){ const idea=b.fromIdea?findIdea(b.fromIdea):null; label=idea?(idea.text||""):""; }
        if(!label) label=blockFirstText(b)||"(빈 블록)";
        const li=document.createElement("div"); li.className="wpl-block"; li.textContent=`${bi+1}. ${label}`; li.title=label;
        li.onclick=(e)=>{ e.stopPropagation(); const el=document.getElementById("wblk-"+b.id); if(el) el.scrollIntoView({behavior:"smooth", block:"center"}); };
        bl.appendChild(li);
      });
      item.appendChild(bl);
    }
    left.appendChild(item);
  });
  /* 플롯 단계(섹션) 추가 */
  const addSec=document.createElement("button"); addSec.className="wpl-add-section"; addSec.textContent="＋ 플롯 단계 추가";
  addSec.onclick=()=>{
    const name=prompt("새 플롯 단계 이름:","새 단계"); if(name===null)return;
    P.plotDoc.sections.push({id:uid(), name:name||"새 단계", desc:"", ideaIds:[]}); save(); render();
  };
  left.appendChild(addSec);
}
/* 블록의 첫 텍스트(본문/대사) 미리보기용 */
function blockFirstText(bl){
  const it=(bl.items||[]).find(x=>(x.text||"").trim());
  return it? it.text.trim() : "";
}

/* 장면 블록 카드 */
function sceneBlockCard(bl, main, liveRefresh, num){
  const d=document.createElement("div"); d.className="scene-block"; d.dataset.id=bl.id; d.id="wblk-"+bl.id; d.draggable=false;
  /* 블록 왼쪽 컬러 바 — 불러온 아이디어면 태그 색상, 아니면 기본색 */
  if(bl.fromIdea){ const idea=findIdea(bl.fromIdea); if(idea && idea.tags && idea.tags.length) d.style.borderLeftColor=getTagColor(idea.tags[0]); }
  const head=document.createElement("div"); head.className="scene-head";
  const handle=document.createElement("span"); handle.className="scene-handle"; handle.textContent="⠿"; handle.title="드래그해서 블록 이동";
  const numEl=document.createElement("span"); numEl.className="scene-num"; numEl.textContent=(num!=null?num:"");
  handle.addEventListener("mousedown", ()=>{ d.draggable=true; });
  handle.addEventListener("touchstart", ()=>{ d.draggable=true; }, {passive:true});
  d.addEventListener("dragstart", e=>{
    if(!d.draggable) return;
    e.dataTransfer.effectAllowed="move";
    setTimeout(()=>d.classList.add("dragging"),0);
  });
  d.addEventListener("dragend", ()=>{ d.draggable=false; d.classList.remove("dragging"); });
  const spacer=document.createElement("span"); spacer.className="scene-spacer";
  /* 아이디어/제목 — 기본은 잠금(읽기전용), ✎ 수정 버튼을 눌러야 편집. 아이디어 수집·플롯 원본과 독립 */
  const titleEl=document.createElement("input"); titleEl.className="scene-title"; titleEl.type="text"; titleEl.readOnly=true;
  titleEl.placeholder="아이디어 / 제목 (✎ 수정 버튼으로 편집)";
  titleEl.value=bl.title||"";
  titleEl.oninput=()=>{ bl.title=titleEl.value; save(); liveRefresh&&liveRefresh(); };
  titleEl.onblur=()=>{ titleEl.readOnly=true; };
  const editBtn=document.createElement("button"); editBtn.className="scene-edit-btn"; editBtn.textContent="✎ 수정"; editBtn.title="아이디어(제목) 수정";
  editBtn.onclick=()=>{ titleEl.readOnly=false; titleEl.focus(); try{ titleEl.select(); }catch(e){} };
  const addTextBtn=document.createElement("button"); addTextBtn.className="scene-add-btn"; addTextBtn.textContent="＋ 본문";
  addTextBtn.title="본문 하위 블록 추가";
  addTextBtn.onclick=()=>{ bl.items=bl.items||[]; bl.items.push({id:uid(), type:"text", char:"", text:""}); save(); render(); };
  const dlgBtn=document.createElement("button"); dlgBtn.className="scene-dlg-btn"; dlgBtn.textContent="💬 대사 추가";
  dlgBtn.onclick=()=>{ writeDlgFor=bl.id; render(); };
  const delBtn=document.createElement("button"); delBtn.className="scene-del-btn"; delBtn.textContent="✕"; delBtn.title="블록 삭제";
  delBtn.onclick=()=>{ if(!confirm("이 장면 블록을 삭제할까요?"))return; P.writeDoc.blocks=P.writeDoc.blocks.filter(x=>x.id!==bl.id); save(); render(); };
  head.append(handle, numEl, spacer, editBtn, addTextBtn, dlgBtn, delBtn);
  d.appendChild(head);
  d.appendChild(titleEl);
  if(bl.id===writeFocusTitle){ writeFocusTitle=null; setTimeout(()=>{ titleEl.readOnly=false; titleEl.focus(); if(d.scrollIntoView) d.scrollIntoView({behavior:"smooth", block:"center"}); },0); }

  /* 하위 블록(본문/대사) */
  const itemsEl=document.createElement("div"); itemsEl.className="scene-items"; itemsEl.dataset.block=bl.id;
  (bl.items||[]).forEach(it=>itemsEl.appendChild(subBlockEl(bl, it, liveRefresh)));
  if(!(bl.items||[]).length){
    const e=document.createElement("p"); e.className="sub-empty"; e.textContent="＋본문 또는 💬대사로 내용을 추가하세요 (다른 블록에서 끌어와도 됩니다)";
    itemsEl.appendChild(e);
  }
  setupItemDnD(itemsEl, main);
  d.appendChild(itemsEl);
  return d;
}

/* 하위 블록 하나 (본문 type=text / 대사 type=line) */
function subBlockEl(bl, it, liveRefresh){
  const d=document.createElement("div"); d.className="sub-block "+(it.type==="line"?"sub-line":"sub-text"); d.dataset.id=it.id; d.draggable=false;
  const handle=document.createElement("span"); handle.className="sub-handle"; handle.textContent="⠿"; handle.title="드래그해서 이동(다른 블록으로도)";
  handle.addEventListener("mousedown", ()=>{ d.draggable=true; });
  handle.addEventListener("touchstart", ()=>{ d.draggable=true; }, {passive:true});
  d.addEventListener("dragstart", e=>{ if(!d.draggable) return; e.dataTransfer.effectAllowed="move"; setTimeout(()=>d.classList.add("dragging"),0); });
  d.addEventListener("dragend", ()=>{ d.draggable=false; d.classList.remove("dragging"); });

  const del=document.createElement("button"); del.className="sub-del"; del.textContent="✕"; del.title="삭제";
  del.onclick=()=>{ bl.items=(bl.items||[]).filter(x=>x.id!==it.id); save(); render(); };

  if(it.type==="line"){
    const who=document.createElement("span"); who.className="dlg-who"; who.textContent=it.char||"(미지정)";
    const tx=document.createElement("span"); tx.className="dlg-text"; tx.textContent=it.text;
    d.append(handle, who, tx, del);
  }else{
    const ta=document.createElement("textarea"); ta.className="sub-textarea"; ta.placeholder="본문을 써보세요"; ta.value=it.text||"";
    ta.oninput=()=>{ it.text=ta.value; save(); liveRefresh&&liveRefresh(); };
    d.append(handle, ta, del);
  }
  return d;
}

/* 장면 블록 드래그앤드롭 (섹션 간 이동/정렬) */
function setupBlockDnD(list, main){
  list.addEventListener("dragover", e=>{
    const dragging=main.querySelector(".scene-block.dragging");
    if(!dragging) return;
    e.preventDefault();
    const after=getDragAfterEl(list, e.clientY, ".scene-block:not(.dragging)");
    if(after==null) list.appendChild(dragging);
    else list.insertBefore(dragging, after);
  });
  list.addEventListener("drop", e=>{
    if(!main.querySelector(".scene-block.dragging")) return;
    e.preventDefault();
    rebuildWriteFromDOM(main); save(); render();
  });
}
function rebuildWriteFromDOM(main){
  const map={}; (P.writeDoc.blocks||[]).forEach(b=>map[b.id]=b);
  const arr=[];
  main.querySelectorAll(".write-blocklist").forEach(list=>{
    const secId=list.dataset.sec;
    list.querySelectorAll(".scene-block").forEach(el=>{ const b=map[el.dataset.id]; if(b){ b.sectionId=secId; arr.push(b); } });
  });
  (P.writeDoc.blocks||[]).forEach(b=>{ if(arr.indexOf(b)<0) arr.push(b); });
  P.writeDoc.blocks=arr;
}

/* 하위 블록 드래그앤드롭 (블록 내부 정렬 + 다른 블록으로 이동) */
function setupItemDnD(container, main){
  container.addEventListener("dragover", e=>{
    const dragging=document.querySelector(".sub-block.dragging");
    if(!dragging) return;
    e.preventDefault();
    const after=getDragAfterEl(container, e.clientY, ".sub-block:not(.dragging)");
    if(after==null) container.appendChild(dragging);
    else container.insertBefore(dragging, after);
  });
  container.addEventListener("drop", e=>{
    if(!document.querySelector(".sub-block.dragging")) return;
    e.preventDefault();
    rebuildItemsFromDOM(main); save(); render();
  });
}
function rebuildItemsFromDOM(main){
  const map={}; (P.writeDoc.blocks||[]).forEach(b=>(b.items||[]).forEach(it=>map[it.id]=it));
  main.querySelectorAll(".scene-items").forEach(cont=>{
    const b=(P.writeDoc.blocks||[]).find(x=>x.id===cont.dataset.block);
    if(b) b.items=[...cont.querySelectorAll(".sub-block")].map(el=>map[el.dataset.id]).filter(Boolean);
  });
}

/* 대사 추가 팝업 */
function dialogueModal(bl){
  const overlay=document.createElement("div"); overlay.className="plot-modal-overlay";
  overlay.onclick=e=>{ if(e.target===overlay){ writeDlgFor=null; render(); } };
  const box=document.createElement("div"); box.className="plot-modal dlg-modal";
  const top=document.createElement("div"); top.className="plot-picker-top";
  const ttl=document.createElement("span"); ttl.className="plot-picker-title"; ttl.textContent="대사 추가";
  const closeBtn=iconBtn("✕","닫기",()=>{ writeDlgFor=null; render(); });
  top.append(ttl, closeBtn);
  box.appendChild(top);

  const chars=(P.characters||[]).filter(c=>c.name && c.name.trim());
  const lbl1=document.createElement("label"); lbl1.textContent="캐릭터";
  box.appendChild(lbl1);
  let charInput;
  if(chars.length){
    charInput=document.createElement("select");
    charInput.innerHTML=`<option value="">(미지정)</option>`+chars.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}${c.role?` (${esc(c.role)})`:""}</option>`).join("");
  }else{
    charInput=document.createElement("input"); charInput.type="text"; charInput.placeholder="캐릭터 이름 (캐릭터 설정에서 미리 등록하면 목록으로 선택됩니다)";
  }
  box.appendChild(charInput);

  const lbl2=document.createElement("label"); lbl2.textContent="대사"; box.appendChild(lbl2);
  const ta=document.createElement("textarea"); ta.className="dlg-input-text"; ta.placeholder="대사를 입력하세요"; box.appendChild(ta);

  const actions=document.createElement("div"); actions.className="dlg-modal-actions";
  const addBtn=document.createElement("button"); addBtn.className="btn"; addBtn.textContent="추가";
  const addMore=document.createElement("button"); addMore.className="btn ghost"; addMore.textContent="추가하고 계속";
  function doAdd(keepOpen){
    const text=ta.value.trim(); if(!text){ ta.focus(); return; }
    const char=charInput.value.trim();
    bl.items=bl.items||[]; bl.items.push({id:uid(), type:"line", char, text});
    save();
    if(keepOpen){ ta.value=""; ta.focus(); /* 팝업 유지 */ render(); setTimeout(()=>{ const m=document.querySelector(".dlg-modal .dlg-input-text"); if(m) m.focus(); },0); }
    else { writeDlgFor=null; render(); }
  }
  addBtn.onclick=()=>doAdd(false);
  addMore.onclick=()=>doAdd(true);
  actions.append(addMore, addBtn);
  box.appendChild(actions);

  overlay.appendChild(box);
  setTimeout(()=>{ ta.focus(); },0);
  return overlay;
}

/* 미리보기 (A4 페이지, 가로선으로 페이지 구분) */
function renderPreviewInto(right){
  right.innerHTML="";
  const page=document.createElement("div"); page.className="wp-page";
  const inner=document.createElement("div"); inner.className="wp-inner";
  let any=false;
  (P.plotDoc.sections||[]).forEach(sec=>{
    blocksOfSection(sec.id).forEach(bl=>{
      const blk=document.createElement("div"); blk.className="wp-block";
      (bl.items||[]).forEach(it=>{
        if(!(it.text||"").length && it.type!=="line") return;
        if(it.type==="line"){
          const dp=document.createElement("p"); dp.className="wp-line";
          dp.innerHTML=(it.char?`<b>${esc(it.char)}</b>: `:"")+esc(it.text);
          blk.appendChild(dp); any=true;
        }else{
          const p=document.createElement("p"); p.className="wp-text"; p.textContent=it.text; blk.appendChild(p); any=true;
        }
      });
      if(blk.children.length) inner.appendChild(blk);
    });
  });
  if(!any){ const e=document.createElement("p"); e.className="hint"; e.textContent="작성한 내용이 여기에 문서 형태로 표시됩니다."; inner.appendChild(e); }
  page.appendChild(inner);
  right.appendChild(page);
  /* 페이지 구분선 */
  requestAnimationFrame(()=>paginatePreview(right));
}
function paginatePreview(right){
  const inner=right.querySelector(".wp-inner"); if(!inner) return;
  inner.querySelectorAll(".wp-pagebreak").forEach(x=>x.remove());
  const w=inner.clientWidth; if(!w) return;
  const pageH=w*1.414; // A4 세로 비율(297/210)
  const totalH=inner.scrollHeight;
  for(let y=pageH; y<totalH; y+=pageH){
    const hr=document.createElement("div"); hr.className="wp-pagebreak"; hr.style.top=y+"px";
    inner.appendChild(hr);
  }
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
  let plot;
  const pd=P.plotDoc;
  if(pd && pd.structure && Array.isArray(pd.sections) && pd.sections.length){
    const label=(PLOT_STRUCTURES[pd.structure]&&PLOT_STRUCTURES[pd.structure].label)||"사용자 구조";
    plot=`<p class="muted" style="margin:0 0 8px">구조: ${esc(label)}</p>`+
      pd.sections.map((s,i)=>{
        const items=(s.ideaIds||[]).map(id=>{const t=plotIdeaText(id);return t?`<li>${esc(t)}</li>`:"";}).join("");
        return `<p><b>${i+1}. ${esc(s.name)}</b></p>${items?`<ul>${items}</ul>`:`<p><i>(배치된 아이디어 없음)</i></p>`}`;
      }).join("");
  }else{
    plot=`<p><i>(아직 플롯이 생성되지 않았습니다. '플롯 생성' 메뉴에서 구조를 선택하세요.)</i></p>`;
  }
  pv.innerHTML=`<h2 style="border-bottom:2px solid var(--accent);padding-bottom:8px">${esc(P.name)}</h2>
    <p><b>로그라인:</b> ${esc(P.logline)||"-"}<br><b>장르:</b> ${P.genres.join(", ")||"-"}</p>
    <div class="section-title">캐릭터</div>${chars}
    <div class="section-title">세계관</div><p>${esc(P.world.summary)||"-"}<br>시대: ${esc(P.world.era)} / 장소: ${esc(P.world.place)}<br>규칙: ${esc(P.world.rules)}</p>
    <div class="section-title">배경</div><p>사회: ${esc(P.background.social)}<br>분위기: ${esc(P.background.mood)}<br>${esc(P.background.detail)}</p>
    <div class="section-title">사건</div><p>주요 사건: ${esc(P.event.main)}<br>갈등: ${esc(P.event.conflict)}<br>결말: ${esc(P.event.ending)}</p>
    <div class="section-title">플롯</div>${plot}`;
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
