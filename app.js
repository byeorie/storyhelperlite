/* ===== 상태 & 저장 ===== */
const LS_KEY = "storyhelper_v1";
const ADMIN_USERNAME = "byeorie";

/* ===== 심플라인 아이콘 (24x24 stroke, currentColor) ===== */
const ICONS = {
  plus:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  edit:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  trash:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
  download:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h7"/></svg>',
  upload:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h5l2 2h7a2 2 0 0 1 2 2v2H2V7a2 2 0 0 1 2-2z"/><path d="M2 11h20l-1.7 7a2 2 0 0 1-2 1.5H5.7a2 2 0 0 1-2-1.5z"/></svg>',
  file:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/></svg>',
  pdf:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  chat:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  close:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  check:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  group:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  ungroup:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M14 10 21 3M3 21l7-7" stroke-dasharray="2 2"/></svg>',
  load:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 21h16"/></svg>',
  network:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5 7 16.5M12 7.5l5 9M7.5 19h9"/></svg>',
  bulb:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 3 1.8 4.5 2.8 6s1.2 2 1.2 3h6c0-1 .2-1.5 1.2-3s2.8-3 2.8-6a7 7 0 0 0-7-7z"/></svg>',
  search:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>',
  lock:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  book:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  globe:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  building:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2" width="18" height="20" rx="1"/><path d="M9 22v-6h6v6"/><path d="M9 6h1M9 10h1M9 14h1M14 6h1M14 10h1M14 14h1"/></svg>',
  bolt:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>',
  user:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  gear:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  grip:'<svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="9" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>',
  cloud:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
  image:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
  pencil:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
  eraser:'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3a2 2 0 0 1 0-2.8l9.6-9.6a2 2 0 0 1 2.8 0l5.7 5.7a2 2 0 0 1 0 2.8L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>'
};
function isAdmin(){ return typeof currentUser!=="undefined" && currentUser && currentUser.username===ADMIN_USERNAME; }
function isProfessor(){ return typeof currentUser!=="undefined" && currentUser && currentUser.role==="professor"; }
function refreshAdminTabVisibility(){
  const grp=document.getElementById("adminNavGroup");
  if(grp) grp.style.display=isAdmin()?"":"none";
}
function refreshProfNavVisibility(){
  const grp=document.getElementById("profNavGroup");
  if(grp) grp.style.display=isProfessor()?"":"none";
}
function forceTab(name){
  activeTab=name;
  localStorage.setItem(TAB_KEY, activeTab);
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  const btn=document.querySelector(`.tab[data-tab="${name}"]`);
  if(btn) btn.classList.add("active");
}
function onAuthChanged(){
  refreshAdminTabVisibility();
  refreshProfNavVisibility();
  if(activeTab==="admin" && !isAdmin()) forceTab("idea");
  if((activeTab==="profStudents"||activeTab==="profAssignments") && !isProfessor()) forceTab("idea");
  render();
}
/* ===== 왼쪽 메뉴·플롯 목록·미리보기 접기/펼치기 (곰국을끼리오너라 프로젝트 참고) =====
   작업 공간을 넓게 쓰고 싶을 때 각 패널을 접을 수 있다. 상태는 localStorage에 저장해 다음에도 유지 */
const UI_KEY="storyhelper_ui_v1";
function loadUiCollapse(){ try{ const u=JSON.parse(localStorage.getItem(UI_KEY)); return {sb:!!(u&&u.sb), toc:!!(u&&u.toc), preview:!!(u&&u.preview)}; }catch(e){ return {sb:false, toc:false, preview:false}; } }
let UICOL=loadUiCollapse();
function saveUiCollapse(){ localStorage.setItem(UI_KEY, JSON.stringify(UICOL)); }
function applyUiCollapse(){
  document.body.classList.toggle("sb-collapsed", UICOL.sb);
  document.body.classList.toggle("toc-collapsed", UICOL.toc);
  document.body.classList.toggle("preview-collapsed", UICOL.preview);
}
/* 본문(write-main)·미리보기(write-preview) 경계 드래그로 폭 조절 — 본문 너비를 px로 고정하고
   미리보기(flex:1)가 남은 폭을 자동으로 채우게 둔다. 드래그로 정한 폭은 localStorage에 저장 */
const MAINW_KEY="storyhelper_mainw_v1";
function loadMainWidth(){ const v=parseInt(localStorage.getItem(MAINW_KEY),10); return (v&&v>=360)?v:null; }
function saveMainWidth(w){ localStorage.setItem(MAINW_KEY, String(Math.round(w))); }
function setupPanelResizer(resizer, mainEl){
  resizer.addEventListener("mousedown", e=>{
    e.preventDefault();
    const startX=e.clientX, startW=mainEl.getBoundingClientRect().width;
    document.body.style.cursor="col-resize";
    resizer.classList.add("dragging");
    function onMove(ev){
      const w=Math.max(360, Math.min(startW+(ev.clientX-startX), window.innerWidth-420));
      mainEl.style.flex="0 0 "+w+"px";
    }
    function onUp(){
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor="";
      resizer.classList.remove("dragging");
      saveMainWidth(mainEl.getBoundingClientRect().width);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}

let DB = load();
let P = currentProject();

/* ===== 실행취소/다시실행 (프로젝트 단위 스냅샷) =====
   저장 여부와 무관하게 편집 이력을 되돌리는 기능. save()가 거의 모든 편집 지점에서 호출되므로
   그 안에서 800ms 코얼레싱 타이머를 걸어, 짧게 이어지는 타이핑을 한 번의 되돌리기 단계로 묶는다. */
const UNDO_LIMIT=60, UNDO_COALESCE_MS=800;
let undoStack=[], redoStack=[], undoBaseline=null, undoTimer=null;
function resetUndoHistory(){
  undoBaseline = P ? JSON.stringify(P) : null;
  undoStack=[]; redoStack=[]; clearTimeout(undoTimer); updateUndoButtons();
}
function scheduleUndoCheckpoint(){ clearTimeout(undoTimer); undoTimer=setTimeout(commitUndoCheckpoint, UNDO_COALESCE_MS); }
function commitUndoCheckpoint(){
  clearTimeout(undoTimer);
  const now=JSON.stringify(P);
  if(now===undoBaseline) return;
  undoStack.push(undoBaseline); if(undoStack.length>UNDO_LIMIT) undoStack.shift();
  redoStack=[]; undoBaseline=now; updateUndoButtons();
}
function restoreUndoSnapshot(json){
  const obj=JSON.parse(json);
  Object.keys(P).forEach(k=>delete P[k]); Object.assign(P,obj);
  undoBaseline=json; save(); render();
}
function doUndo(){
  commitUndoCheckpoint();
  if(!undoStack.length) return;
  const prev=undoStack.pop();
  redoStack.push(undoBaseline); if(redoStack.length>UNDO_LIMIT) redoStack.shift();
  restoreUndoSnapshot(prev);
}
function doRedo(){
  if(!redoStack.length) return;
  const next=redoStack.pop();
  undoStack.push(undoBaseline); if(undoStack.length>UNDO_LIMIT) undoStack.shift();
  restoreUndoSnapshot(next);
}
function updateUndoButtons(){
  const ub=document.getElementById("undoBtn"), rb=document.getElementById("redoBtn");
  if(ub) ub.disabled=!undoStack.length;
  if(rb) rb.disabled=!redoStack.length;
}
resetUndoHistory();

/* openIds: 상단 탭에 열려 보이는 작품 id 목록. 탭 닫기는 이 목록에서만 빠지고
   DB.projects엔 그대로 남아 있어 상단 select("다른 작품 열기")로 언제든 다시 열 수 있다 */
function fillOpenIds(d){
  if(!Array.isArray(d.openIds)||!d.openIds.length) d.openIds=d.projects.map(p=>p.id);
  d.openIds=d.openIds.filter(id=>d.projects.some(p=>p.id===id));
  if(!d.openIds.includes(d.current)) d.openIds.push(d.current);
  return d.openIds;
}
function load(){
  try{
    const d=JSON.parse(localStorage.getItem(LS_KEY));
    if(d&&Array.isArray(d.projects)&&d.projects.length){
      d.projects=d.projects.map(fillProject);
      if(!d.projects.some(p=>p.id===d.current)) d.current=d.projects[0].id;
      fillOpenIds(d);
      return d;
    }
  }catch(e){}
  const id=uid();
  return {current:id, projects:[blankProject(id,"내 첫 작품")], openIds:[id]};
}
function blankExplore(){
  const o={}; STORY_GUIDE_SLOTS.forEach(s=>o[s.key]=""); return o;
}
/* 예전 버전 데이터에 누락된 필드를 채워 오류를 방지 */
function fillProject(p){
  const b=blankProject(p.id||uid(), p.name||"제목 없음");
  const world=Object.assign({}, b.world, p.world||{});
  world.glossary=Array.isArray(world.glossary)?world.glossary.map(g=>Object.assign(
    {id:uid(), term:"", definition:"", firstEpisode:"", absoluteRule:"", disclosure:"", resolved:""}, g)):[];
  const event=Object.assign({}, b.event, p.event||{});
  event.log=Array.isArray(event.log)?event.log.map(g=>Object.assign(
    {id:uid(), name:"", characters:"", episode:"", impact:"", nextLink:"", cliffhanger:""}, g)):[];
  return Object.assign({}, b, p, {
    idea: Object.assign({}, b.idea, p.idea||{}),
    world,
    background: Object.assign({}, b.background, p.background||{}),
    event,
    characters: (Array.isArray(p.characters)&&p.characters.length)?p.characters.map(c=>{
      const m=Object.assign({},blankChar(),c);
      /* 예전 "인물 변화(아크)" 단일 필드에 값이 있고 전/후 필드가 비어 있으면 "변화 전"으로 이전 */
      if(m.arc && !m.arcBefore && !m.arcAfter) m.arcBefore=m.arc;
      return m;
    }):b.characters,
    plot: Array.isArray(p.plot)?Object.assign([...b.plot],p.plot):b.plot,
    genres: Array.isArray(p.genres)?p.genres:b.genres,
    ideaBlocks: Array.isArray(p.ideaBlocks)?p.ideaBlocks.map(x=>Object.assign({id:uid(),text:"",tags:[]},x)):b.ideaBlocks,
    tagColors: Object.assign({}, b.tagColors, p.tagColors||{}),
    plotDoc: fillPlotDoc(p.plotDoc),
    writeDoc: fillWriteDoc(p.writeDoc),
    planDoc: fillPlanDoc(p.planDoc),
    explore: Object.assign({}, b.explore, p.explore||{}),
  });
}
/* ===== 탭 저장상태 점(dot) =====
   로컬(localStorage)은 save()마다 바로 기록되므로 항상 최신이지만, 서버 동기화는 디바운스 후
   비동기로 진행된다. 탭의 점 색은 "서버 동기화" 기준: pending(주황)→saved(초록)/error(빨강).
   로그인하지 않은 상태(로컬 전용)에서는 항상 saved로 취급한다. */
let projSaveState={};
function updateTabDot(id){
  const t=document.querySelector(`.ptab-dot[data-pid="${id}"]`); if(!t) return;
  const state=projSaveState[id]||"saved";
  const loggedIn=typeof getToken==="function" && !!getToken();
  const color = state==="pending" ? "#d9a441" : state==="error" ? "#e05050" : "var(--ok)";
  const title = state==="pending" ? "서버에 저장 중…" : state==="error" ? "서버 저장 실패 (로컬에는 저장됨)" : (loggedIn?"서버에 저장됨":"로컬에 저장됨");
  t.style.background=color; t.title=title;
}
function updateAllTabDots(){ (DB.openIds||[]).forEach(id=>updateTabDot(id)); }

function save(){
  localStorage.setItem(LS_KEY, JSON.stringify(DB));
  const el=document.getElementById("saveStatus");
  if(el){ el.textContent="저장됨"; el.style.opacity=1; setTimeout(()=>el.style.opacity=.4,1000); }
  if(typeof getToken==="function" && getToken()){
    projSaveState[DB.current]="pending"; updateTabDot(DB.current);
  }
  if(typeof saveToServer==="function") saveToServer();
  scheduleUndoCheckpoint();
}
function uid(){ return "p"+Date.now()+Math.floor(Math.random()*1000); }
function blankProject(id,name){
  return {id,name,logline:"",genres:[],
    idea:{protagonistType:"",protagonistMbti:"",genre:"",endingType:"",logline:""},
    characters:[blankChar()],
    world:{summary:"",rules:"",era:"",place:"",type:"",regions:"",timeline:"",politics:"",
      factions:"",economy:"",taboo:"",culture:"",language:"",conflict:"",glossary:[]},
    background:{social:"",mood:"",detail:""},
    event:{main:"",conflict:"",ending:"",name:"",characters:"",agency:"",conflictType:"",
      goal:"",disaster:"",reaction:"",decision:"",transform:"",nextLink:"",log:[]},
    plot:Array(12).fill(""),
    ideaBlocks:[],
    tagColors:{},
    plotDoc:{structure:"", sections:[], ideaOverrides:{}},
    writeDoc:{blocks:[], groups:[]},
    planDoc:blankPlanDoc(),
    explore:blankExplore()};
}
/* ===== 📋 기획서 작성 — 기본값/보정 ===== */
function blankPlanDoc(){
  return {date:"", author:"", title:"", genre:"", logline:"", mainReaders:"", length:"",
    material:"", situation:"", characters:"", incident:"", ending:"", intent:"", synopsis:""};
}
function fillPlanDoc(pd){
  const b=blankPlanDoc();
  if(!pd||typeof pd!=="object") return b;
  return Object.assign({}, b, pd);
}
/* writeDoc 기본값 보정 (본문/대사를 공통 하위블록 items로 통합) */
function fillWriteDoc(wd){
  const b={blocks:[], groups:[]};
  if(!wd||typeof wd!=="object") return b;
  const groupIds=new Set((Array.isArray(wd.groups)?wd.groups:[]).map(g=>g&&g.id).filter(Boolean));
  const blocks=(Array.isArray(wd.blocks) ? wd.blocks.map(x=>{
    let items=[];
    if(Array.isArray(x.items)){
      items=x.items.map(it=>({id:it.id||uid(), type:(it.type==="line"?"line":"text"), char:it.char||"", text:it.text||""}));
    }else{ /* 구버전(text + lines) 마이그레이션 */
      if(x.text) items.push({id:uid(), type:"text", char:"", text:x.text});
      if(Array.isArray(x.lines)) x.lines.forEach(l=>items.push({id:l.id||uid(), type:"line", char:l.char||"", text:l.text||""}));
    }
    const groupId=(x.groupId && groupIds.has(x.groupId)) ? x.groupId : "";
    const backgrounds=Array.isArray(x.backgrounds)?x.backgrounds.filter(s=>typeof s==="string"&&s.trim()):[];
    const characters=Array.isArray(x.characters)?x.characters.filter(s=>typeof s==="string"&&s.trim()):[];
    const storyboard=(x.storyboard && typeof x.storyboard==="object" && x.storyboard.key)
      ? {key:String(x.storyboard.key), size:(["large","medium","small"].includes(x.storyboard.size)?x.storyboard.size:"medium")}
      : null;
    return {id:x.id||uid(), sectionId:x.sectionId||"", fromIdea:x.fromIdea||"", title:x.title||"", items, groupId, backgrounds, characters, storyboard};
  }) : []);
  const groups=(Array.isArray(wd.groups)?wd.groups:[]).map(g=>({id:(g&&g.id)||uid(), name:(g&&g.name)||"그룹"}));
  return {blocks, groups};
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
  return {id:uid(), name:"",role:"영웅",age:"",gender:"",mbti:"",enneagram:"",goal:"",flaw:"",arc:"",desc:"", relationships:[], image:"",
    parentsInfo:"", familyRelations:"", arcBefore:"", arcAfter:"",
    appearance:"", speechHabit:"", backstory:"", likes:"", dislikes:"", dialogueSample:""};
}
function currentProject(){
  return DB.projects.find(p=>p.id===DB.current)||DB.projects[0];
}

/* ===== 프로젝트 UI (상단 탭 + "다른 작품 열기" select) =====
   탭의 ×는 작품을 지우지 않고 화면(탭)에서만 뺀다 — DB.openIds에서 id만 제거,
   DB.projects는 그대로 두어 select("다른 작품 열기")로 언제든 다시 열 수 있다. */
function refreshProjSelect(){
  const sel=document.getElementById("projSelect");
  sel.innerHTML=`<option value="" disabled selected hidden>다른 작품 열기…</option>`;
  DB.projects.forEach(p=>{
    const o=document.createElement("option");
    o.value=p.id; o.textContent=(DB.openIds.includes(p.id)?"":"◦ ")+p.name;
    sel.appendChild(o);
  });

  const wrap=document.getElementById("projTabs");
  wrap.innerHTML="";
  DB.projects.filter(p=>DB.openIds.includes(p.id)).forEach(p=>{
    const tab=document.createElement("div");
    tab.className="ptab"+(p.id===DB.current?" active":"");
    tab.title=p.name;
    const dot=document.createElement("span"); dot.className="ptab-dot"; dot.dataset.pid=p.id;
    tab.appendChild(dot);
    const label=document.createElement("span"); label.className="ptab-label"; label.textContent=p.name;
    tab.appendChild(label);
    const close=document.createElement("button"); close.type="button"; close.className="ptab-close";
    close.title="닫기 (삭제 아님)"; close.innerHTML=ICONS.close;
    close.onclick=e=>{ e.stopPropagation(); closeProjTab(p.id); };
    tab.appendChild(close);
    tab.onclick=()=>{ if(p.id!==DB.current) switchProject(p.id); };
    wrap.appendChild(tab);
  });
  updateAllTabDots();
}
function switchProject(id){
  DB.current=id; P=currentProject(); resetUndoHistory(); save(); refreshProjSelect(); render();
}
function openProjectTab(id){
  if(!DB.openIds.includes(id)) DB.openIds.push(id);
  switchProject(id);
}
function closeProjTab(id){
  if(DB.openIds.length<=1){ alert("마지막 탭입니다. 다른 작품을 먼저 열어주세요."); return; }
  DB.openIds=DB.openIds.filter(x=>x!==id);
  if(DB.current===id){ DB.current=DB.openIds[DB.openIds.length-1]; P=currentProject(); resetUndoHistory(); }
  save(); refreshProjSelect(); render();
}
document.getElementById("projSelect").onchange=e=>{
  const id=e.target.value; e.target.value="";
  if(id) openProjectTab(id);
};
document.getElementById("newProjBtn").onclick=()=>{
  const name=prompt("새 작품 이름:","제목 없음"); if(name===null)return;
  const id=uid(); DB.projects.push(blankProject(id,name||"제목 없음"));
  DB.openIds.push(id);
  DB.current=id; P=currentProject(); resetUndoHistory(); save(); refreshProjSelect(); render();
};
document.getElementById("renameProjBtn").onclick=()=>{
  const name=prompt("작품 이름 변경:",P.name); if(name===null)return;
  P.name=name||P.name; save(); refreshProjSelect();
};
document.getElementById("delProjBtn").onclick=()=>{
  if(DB.projects.length<=1){alert("최소 1개의 작품은 있어야 합니다.");return;}
  if(!confirm(`'${P.name}'을(를) 삭제할까요? 되돌릴 수 없습니다.`))return;
  const wasId=P.id;
  DB.projects=DB.projects.filter(p=>p.id!==wasId);
  DB.openIds=DB.openIds.filter(id=>id!==wasId);
  if(!DB.openIds.length) DB.openIds=[DB.projects[0].id];
  DB.current=DB.openIds[0]; P=currentProject(); resetUndoHistory(); save(); refreshProjSelect(); render();
};

/* ===== 실행취소/다시실행 버튼 + 단축키 (Ctrl/Cmd+S 즉시저장, +Z 실행취소, +Shift+Z 또는 +Y 다시실행) ===== */
document.getElementById("undoBtn").onclick=doUndo;
document.getElementById("redoBtn").onclick=doRedo;
function forceSaveNow(){
  localStorage.setItem(LS_KEY, JSON.stringify(DB));
  const el=document.getElementById("saveStatus");
  if(el){ el.textContent="저장됨"; el.style.opacity=1; setTimeout(()=>el.style.opacity=.4,1000); }
  if(typeof getToken==="function" && getToken() && typeof forceSaveToServer==="function") forceSaveToServer();
}
window.addEventListener("keydown", e=>{
  if(!(e.ctrlKey||e.metaKey)) return;
  const k=e.key.toLowerCase();
  if(k==="s"){ e.preventDefault(); forceSaveNow(); }
  else if(k==="z" && !e.shiftKey){ e.preventDefault(); doUndo(); }
  else if((k==="z" && e.shiftKey) || k==="y"){ e.preventDefault(); doRedo(); }
});

/* 상단 툴바 — 저장 / 불러오기 / 내보내기 */
document.getElementById("manualSaveBtn").onclick=()=>forceSaveNow();
document.getElementById("topImportBtn").onclick=()=>document.getElementById("topImportInput").click();
document.getElementById("topImportInput").onchange=e=>importStory(e);
const topExportBtn=document.getElementById("topExportBtn");
const topExportMenu=document.getElementById("topExportMenu");
/* 상단바가 overflow-x:auto라 세로로 넘치는 내용은 잘리므로, 열 때마다 body로 옮겨 position:fixed로 좌표를 직접 계산 (user-menu와 동일 패턴) */
function toggleExportMenu(forceHide){
  const hide=forceHide===true || !topExportMenu.hidden;
  if(!hide){
    document.body.appendChild(topExportMenu);
    const r=topExportBtn.getBoundingClientRect();
    let top=r.bottom+6;
    const menuH=200;
    if(top+menuH>window.innerHeight) top=r.top-6-menuH;
    topExportMenu.style.top=top+"px";
    topExportMenu.style.left=r.left+"px";
  }
  topExportMenu.hidden=hide;
}
topExportBtn.onclick=e=>{ e.stopPropagation(); toggleExportMenu(); };
document.getElementById("topExportPlan").onclick=()=>{ topExportMenu.hidden=true; exportPlan(); };
document.getElementById("topExportScript").onclick=()=>{ topExportMenu.hidden=true; exportScript(); };
document.getElementById("topExportDialogue").onclick=()=>{ topExportMenu.hidden=true; exportDialogueOnly(); };
document.getElementById("topExportStoryboard").onclick=()=>{ topExportMenu.hidden=true; exportStoryboardPdf(); };
document.getElementById("topExportStory").onclick=()=>{ topExportMenu.hidden=true; exportStory(); };
document.addEventListener("click", ()=>{ toggleExportMenu(true); });

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
/* 작업 영역에서는 브라우저 기본 우클릭 메뉴 대신 자체 메뉴만 사용 */
app.addEventListener("contextmenu", e=>{ e.preventDefault(); });
function render(){
  try{
    refreshProjSelect();
    app.innerHTML="";
    app.classList.toggle("wide", activeTab==="write"||activeTab==="storyboard"||activeTab==="background"||activeTab==="event");
    if(!P) P=currentProject();
    if(!P.idea) P.idea={protagonistType:"",protagonistMbti:"",genre:"",endingType:"",logline:""};
    if(!P.explore) P.explore=blankExplore();
    if(!P.planDoc) P.planDoc=blankPlanDoc();
    const renderers={idea:rIdea, explore:rExplore, plan:rPlan, character:rChar, background:rBg,
      event:rEvent, plot:rPlot, write:rWrite, storyboard:rStoryboard, admin:rAdmin,
      profStudents:rProfStudents, profAssignments:rProfAssignments};
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
      P=fresh; resetUndoHistory(); save(); render();
    };
  }
}

/* ===== 💡 아이디어 모음 ===== */
/* 드래그앤드롭 안전장치: 브라우저에 따라 'drop' 이벤트가 안정적으로 발생하지 않는 경우가 있어
   (특히 중첩된 드롭존 위에서 놓았을 때) 'dragend'에서 한 번 더 확인해 반영을 보장한다.
   드래그 하나당 하나씩만 처리되도록 dragstart에서 false로 초기화, drop에서 true로 표시 */
let dndDropHandled=false;

let ideaFilterTags=[];
let ideaPendingTags=[];
let ideaTagPickerFor=null;
let ideaHighlightId=null; // 플롯 생성에서 "아이디어 수집으로 보내기"로 넘어온 뒤 한 번 스크롤·강조할 아이디어 id

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
    const x=document.createElement("span"); x.className="idea-tag-x"; x.innerHTML=ICONS.close;
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
  document.querySelectorAll(".idea-block[draggable=true], .plot-idea[draggable=true], .plot-section[draggable=true], .scene-block[draggable=true], .sub-block[draggable=true], .sub-branch[draggable=true]").forEach(el=>el.draggable=false);
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
  shown.slice().reverse().forEach(b=>list.appendChild(ideaBlockCard(b, allTags, list)));

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
    if(!list.querySelector(".idea-block.dragging")) return;
    commitIdeaOrder(list);
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

/* 아이디어 블록 순서를 화면(DOM) 순서대로 실제 저장 순서에 반영 */
function commitIdeaOrder(list){
  const ids=[...list.querySelectorAll(".idea-block")].map(el=>el.dataset.id);
  reorderIdeaBlocks(ids);
  dndDropHandled=true;
  save(); render();
}

function ideaBlockCard(b, allTags, list){
  const d=document.createElement("div"); d.className="idea-block"; d.dataset.id=b.id;
  d.draggable=false;

  const primaryColor=(b.tags&&b.tags.length)?getTagColor(b.tags[0]):null;
  if(primaryColor){
    d.style.borderLeftColor=primaryColor;
    d.style.background=hexToRgba(primaryColor,0.06);
  }

  const handle=document.createElement("span"); handle.className="idea-handle";
  handle.innerHTML=ICONS.grip; handle.title="드래그해서 순서 변경";
  handle.addEventListener("mousedown", ()=>{ d.draggable=true; });
  handle.addEventListener("touchstart", ()=>{ d.draggable=true; }, {passive:true});
  d.addEventListener("dragstart", e=>{
    dndDropHandled=false;
    e.dataTransfer.effectAllowed="move";
    e.dataTransfer.setData("text/plain", b.id);
    setTimeout(()=>d.classList.add("dragging"),0);
  });
  d.addEventListener("dragend", ()=>{
    d.draggable=false; d.classList.remove("dragging");
    /* 'drop' 이벤트가 발생하지 않은 경우를 대비한 안전장치 */
    if(!dndDropHandled && list && list.isConnected) commitIdeaOrder(list);
  });

  const head=document.createElement("div"); head.className="idea-block-text";
  head.contentEditable="true"; head.spellcheck=false; head.textContent=b.text;
  head.oninput=()=>{ b.text=head.textContent; save(); };
  const del=document.createElement("button"); del.className="idea-del"; del.innerHTML=ICONS.close; del.title="삭제";
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
  /* 플롯 생성에서 "아이디어 수집으로 보내기"로 방금 넘어온 블록이면 스크롤 후 한 번 강조 */
  if(ideaHighlightId===b.id){
    ideaHighlightId=null;
    setTimeout(()=>{
      if(!d.isConnected) return;
      d.scrollIntoView({behavior:"smooth", block:"center"});
      d.classList.add("idea-flash");
      setTimeout(()=>d.classList.remove("idea-flash"),1600);
    },0);
  }
  return d;
}

/* ===== 🔎 아이디어 탐색 (선택형 스토리 작법 가이드) =====
   주인공의 성격/목적/변화/세계관/플롯의 종류/엔딩의 종류를 선택하면,
   선택 조합에 맞춰 이야기를 어떻게 써야 할지 안내 문구를 보여준다. (작품DB 매칭 방식은 폐지) */
function guideOptionFor(key,val){
  const slot=STORY_GUIDE_SLOTS.find(s=>s.key===key);
  return slot&&slot.options.find(o=>o.v===val);
}
/* 옵션 배열([{v,tip,group?}])을 <option>/<optgroup> HTML로 변환.
   group이 있는 항목들은 등장 순서대로 묶어 <optgroup>으로, 없으면 예전처럼 평평한 목록으로 렌더링한다. */
function optionsToHtml(options){
  const groups=[]; const byGroup={};
  options.forEach(o=>{
    const g=o.group||"";
    if(!byGroup[g]){ byGroup[g]={group:g, items:[]}; groups.push(byGroup[g]); }
    byGroup[g].items.push(o);
  });
  return groups.map(gr=>{
    const optsHtml=gr.items.map(o=>`<option value="${esc(o.v)}">${esc(o.v)}</option>`).join("");
    return gr.group ? `<optgroup label="${esc(gr.group)}">${optsHtml}</optgroup>` : optsHtml;
  }).join("");
}
function rExplore(){
  const c=document.createElement("div");
  c.innerHTML=`<div class="card">
    <h2>${ICONS.search} 아이디어 탐색</h2>
    <p class="hint">주인공의 성격·목적·변화, 세계관, 플롯의 종류, 엔딩의 종류를 선택하면 어떻게 이야기를 풀어가면 좋을지 작법을 안내해 드립니다.</p>
  </div>`;
  app.appendChild(c);

  const slotsCard=document.createElement("div"); slotsCard.className="card";
  slotsCard.innerHTML=`<h3>카테고리 선택</h3>
    <div class="explore-grid" id="slotGrid"></div>
    <div class="ai-box" id="loglinePreview"></div>
    <button class="btn ghost" id="saveAsIdea" style="margin-top:10px">＋ 이 줄거리를 아이디어로 저장</button>`;
  app.appendChild(slotsCard);
  const grid=slotsCard.querySelector("#slotGrid");
  function updatePreview(){
    const pv=slotsCard.querySelector("#loglinePreview");
    const sel=P.explore;
    const has=STORY_GUIDE_SLOTS.some(s=>sel[s.key]);
    if(!has){ pv.className="ai-box empty"; pv.textContent="카테고리를 선택하면 줄거리 초안이 여기에 만들어집니다."; return; }
    pv.className="ai-box";
    pv.textContent=`${sel.worldview||"(세계관 미정)"} 세계에서, ${sel.personality||"(성격 미정)"} 주인공이 `
      +`${sel.goal||"(목적 미정)"}을(를) 위해 나아간다. ${sel.plotType||"(플롯 미정)"} 전개 속에서 `
      +`${sel.change||"(변화 미정)"}의 과정을 거치고, 결국 ${sel.endingType||"(결말 미정)"}(으)로 이야기를 맺는다.`;
  }
  STORY_GUIDE_SLOTS.forEach(s=>{
    const wrap=document.createElement("div"); wrap.className="explore-slot";
    wrap.innerHTML=`<label>${s.label}</label>
      <select><option value="">선택 안 함</option>${optionsToHtml(s.options)}<option value="__custom__">직접 입력…</option></select>
      <input type="text" placeholder="${s.ph}" style="display:none;margin-top:6px">`;
    grid.appendChild(wrap);
    const sel=wrap.querySelector("select"), custom=wrap.querySelector("input");
    const cur=P.explore[s.key]||"";
    const opts=s.options.map(o=>o.v);
    if(cur && opts.includes(cur)) sel.value=cur;
    else if(cur){ sel.value="__custom__"; custom.style.display="block"; custom.value=cur; }
    sel.onchange=()=>{
      if(sel.value==="__custom__"){ custom.style.display="block"; custom.focus(); }
      else{ custom.style.display="none"; custom.value=""; P.explore[s.key]=sel.value; save(); updatePreview(); renderGuide(); }
    };
    custom.oninput=()=>{ P.explore[s.key]=custom.value.trim(); save(); updatePreview(); renderGuide(); };
  });
  updatePreview();
  slotsCard.querySelector("#saveAsIdea").onclick=()=>{
    const text=slotsCard.querySelector("#loglinePreview").textContent;
    if(!Array.isArray(P.ideaBlocks)) P.ideaBlocks=[];
    P.ideaBlocks.push({id:uid(), text, tags:["탐색"]});
    save(); alert("아이디어 수집에 저장했습니다.");
  };

  const guideCard=document.createElement("div"); guideCard.className="card";
  guideCard.innerHTML=`<h3>작법 안내</h3><div id="guideResults" class="explore-results"></div>`;
  app.appendChild(guideCard);
  function renderGuide(){
    const box=guideCard.querySelector("#guideResults");
    const active=STORY_GUIDE_SLOTS.filter(s=>(P.explore[s.key]||"").trim());
    if(!active.length){ box.innerHTML=`<p class="hint">위에서 카테고리를 하나 이상 선택하면 각 선택에 맞는 작법 안내가 여기에 나타납니다.</p>`; return; }
    box.innerHTML="";
    active.forEach(s=>{
      const val=P.explore[s.key].trim();
      const opt=guideOptionFor(s.key,val);
      const d=document.createElement("div"); d.className="match-card";
      d.innerHTML=`<div class="match-head"><b>${esc(s.label)}</b><span class="match-score">${esc(val)}</span></div>
        <p class="hint" style="margin-top:8px">${esc(opt?opt.tip:"직접 입력한 항목입니다. 이 요소가 이야기 전체에서 어떤 역할을 하는지 스스로 점검하며 써보세요.")}</p>`;
      box.appendChild(d);
    });
  }
  renderGuide();
}

/* ① 캐릭터 */
let charModalFor=null;      // 신규 생성 팝업이 열린 캐릭터 id
let charDetailFor=null;     // 상세 수정 페이지가 열린 캐릭터 id
let charViewMode="gallery"; // "gallery" | "graph"
/* 존재하지 않는 캐릭터를 가리키는 관계 정리 */
function cleanCharRelationships(){
  const ids=new Set((P.characters||[]).map(c=>c.id));
  (P.characters||[]).forEach(c=>{ c.relationships=(c.relationships||[]).filter(r=>r&&ids.has(r.targetId)); });
}
function rChar(){
  if(!Array.isArray(P.characters)||!P.characters.length) P.characters=[blankChar()];
  cleanCharRelationships();
  if(charDetailFor){
    const dch=P.characters.find(x=>x.id===charDetailFor);
    if(dch){ app.appendChild(charDetailPage(dch)); return; }
    charDetailFor=null;
  }
  const c=document.createElement("div");
  c.innerHTML=`<div class="card"><h2>${ICONS.user} 캐릭터 설정</h2>
    <p class="hint">MBTI와 에니어그램으로 성격의 뼈대를 잡고, 목표·결함·변화, 다른 인물과의 관계를 채워보세요.</p>
    <div class="char-toolbar">
      <div class="char-view-toggle">
        <button type="button" class="char-view-btn${charViewMode==="gallery"?" active":""}" data-view="gallery">${ICONS.group} 갤러리</button>
        <button type="button" class="char-view-btn${charViewMode==="graph"?" active":""}" data-view="graph">${ICONS.network} 관계도</button>
      </div>
      <button class="btn icon-btn" id="addCharBtn">${ICONS.plus} 캐릭터 추가</button>
    </div>
    <div id="charBody"></div></div>`;
  app.appendChild(c);
  c.querySelectorAll(".char-view-btn").forEach(b=>b.onclick=()=>{ charViewMode=b.dataset.view; render(); });
  c.querySelector("#addCharBtn").onclick=()=>{
    const nc=blankChar(); P.characters.push(nc); save(); charModalFor=nc.id; render();
  };
  const body=c.querySelector("#charBody");
  if(charViewMode==="graph"){
    body.appendChild(charRelationshipGraph());
  }else{
    const grid=document.createElement("div"); grid.className="char-gallery";
    if(!P.characters.length){
      grid.innerHTML='<p class="hint">아직 등록된 캐릭터가 없습니다. "＋ 캐릭터 추가"로 시작해 보세요.</p>';
    }else{
      P.characters.forEach(ch=>grid.appendChild(charGalleryCard(ch)));
    }
    body.appendChild(grid);
  }
  if(charModalFor){
    const ch=P.characters.find(x=>x.id===charModalFor);
    if(ch) app.appendChild(charModal(ch)); else charModalFor=null;
  }
}
/* 캐릭터 사진 업로드 — 500KB 이하만 허용, 300x300으로 잘라 압축(JPEG)한 뒤 데이터URL로 저장 */
function handleCharImageFile(file, ch, onDone){
  if(!file) return;
  if(!file.type||!file.type.startsWith("image/")){ alert("이미지 파일만 업로드할 수 있습니다."); return; }
  if(file.size>500*1024){ alert("이미지 용량은 500KB 이하만 업로드할 수 있습니다."); return; }
  const reader=new FileReader();
  reader.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      const SIZE=300;
      const canvas=document.createElement("canvas"); canvas.width=SIZE; canvas.height=SIZE;
      const ctx=canvas.getContext("2d");
      const scale=Math.max(SIZE/img.width, SIZE/img.height);
      const w=img.width*scale, h=img.height*scale;
      ctx.drawImage(img, (SIZE-w)/2, (SIZE-h)/2, w, h);
      ch.image=canvas.toDataURL("image/jpeg", 0.85);
      save(); onDone&&onDone();
    };
    img.onerror=()=>alert("이미지를 불러오지 못했습니다.");
    img.src=reader.result;
  };
  reader.onerror=()=>alert("파일을 읽지 못했습니다.");
  reader.readAsDataURL(file);
}
/* 캐릭터 아바타 HTML(이미지 있으면 이미지, 없으면 이니셜) */
function charAvatarHtml(ch){
  const initial=esc((ch.name||"?").trim().charAt(0)||"?");
  return ch.image ? `<img src="${ch.image}" alt="">` : initial;
}
/* 갤러리 카드 (미리보기, 클릭 시 편집 팝업) */
function charGalleryCard(ch){
  const d=document.createElement("div"); d.className="char-card-mini";
  d.onclick=()=>{ charDetailFor=ch.id; render(); };
  const relCount=(ch.relationships||[]).length;
  d.innerHTML=`<div class="char-avatar"${ch.image?"":` style="background:${TAG_PALETTE[hashStr(ch.id)%TAG_PALETTE.length]}"`}>${charAvatarHtml(ch)}</div>
    <div class="char-card-name">${esc(ch.name)||"이름 없음"}</div>
    <div class="char-card-role">${esc(ch.role)||"-"}</div>
    <div class="char-card-badges">${ch.mbti?`<span class="char-badge">${esc(ch.mbti)}</span>`:""}${ch.enneagram?`<span class="char-badge">${esc(ch.enneagram)}유형</span>`:""}${(ch.arcBefore&&ch.arcAfter)?`<span class="char-badge arc-badge">변화 설정됨</span>`:""}</div>
    ${relCount?`<div class="char-card-rel">관계 ${relCount}개</div>`:""}
    <button type="button" class="char-card-del" title="삭제">${ICONS.trash}</button>`;
  d.querySelector(".char-card-del").onclick=e=>{
    e.stopPropagation();
    if(P.characters.length<=1){ alert("최소 1명의 캐릭터는 있어야 합니다."); return; }
    if(!confirm(`'${ch.name||"이 캐릭터"}'를 삭제할까요?`)) return;
    P.characters=P.characters.filter(c=>c.id!==ch.id);
    P.characters.forEach(c=>{ c.relationships=(c.relationships||[]).filter(r=>r.targetId!==ch.id); });
    save(); render();
  };
  return d;
}
/* 캐릭터 편집 팝업 — 기본 정보 + 다른 캐릭터와의 관계 */
function charModal(ch){
  const overlay=document.createElement("div"); overlay.className="plot-modal-overlay";
  overlay.onclick=e=>{ if(e.target===overlay){ charModalFor=null; render(); } };
  const box=document.createElement("div"); box.className="plot-modal char-modal";
  const top=document.createElement("div"); top.className="plot-picker-top";
  const ttl=document.createElement("span"); ttl.className="plot-picker-title"; ttl.innerHTML=ICONS.edit+" "+esc(ch.name||"새 캐릭터");
  const closeBtn=iconBtn(ICONS.close,"닫기",()=>{ charModalFor=null; render(); });
  top.append(ttl, closeBtn);
  box.appendChild(top);

  const body=document.createElement("div"); body.className="char-modal-body";
  const enOpts=ENNEAGRAM.map(e=>`<option value="${e.n}">${e.n} — ${e.d}</option>`).join("");
  const mbtiOpts=MBTI_TYPES.map(m=>`<option value="${m}">${m}</option>`).join("");
  const roleOpts=VOGLER_ROLES.map(r=>`<option value="${r.n}">${r.n} — ${r.d}</option>`).join("");
  body.innerHTML=`
    <div class="char-img-row">
      <div class="char-avatar char-avatar-lg" id="charImgPreview"${ch.image?"":` style="background:${TAG_PALETTE[hashStr(ch.id)%TAG_PALETTE.length]}"`}>${charAvatarHtml(ch)}</div>
      <div class="char-img-actions">
        <label class="btn ghost sm">사진 선택<input type="file" id="charImgInput" accept="image/*" style="display:none"></label>
        <button type="button" class="btn ghost sm" id="charImgRemove"${ch.image?"":" disabled"}>제거</button>
        <p class="hint" style="margin:4px 0 0">500KB 이하 이미지, 300×300px로 자동 압축됩니다.</p>
      </div>
    </div>
    <div class="row"><div><label>이름</label><input type="text" data-k="name"></div>
    <div><label>역할 (보글러의 8가지 캐릭터 원형)</label><select data-k="role"><option value="">선택</option>${roleOpts}</select></div></div>
    <div class="row"><div><label>MBTI</label><select data-k="mbti"><option value="">선택</option>${mbtiOpts}</select></div>
    <div><label>에니어그램</label><select data-k="enneagram"><option value="">선택</option>${enOpts}</select></div></div>
    <div class="row"><div><label>목표 (원하는 것)</label><input type="text" data-k="goal"></div>
    <div><label>결함 (약점·트라우마)</label><input type="text" data-k="flaw"></div></div>
    <div class="row"><div><label>변화 전 모습</label><textarea data-k="arcBefore" placeholder="이야기 시작 시점의 성격·태도"></textarea></div>
    <div><label>변화 후 모습</label><textarea data-k="arcAfter" placeholder="이야기를 거치며 달라진 모습"></textarea></div></div>
    <label>기타 설명</label><textarea data-k="desc" placeholder="외모, 말투 등"></textarea>
    <label>다른 캐릭터와의 관계</label>
    <div class="char-rel-list" id="charRelList"></div>
    <div class="char-rel-add" id="charRelAdd"></div>`;
  body.querySelectorAll("[data-k]").forEach(el=>bind(el,ch,el.dataset.k));
  const nameInput=body.querySelector('[data-k="name"]');
  nameInput.addEventListener("input", ()=>{ ttl.innerHTML=ICONS.edit+" "+esc(nameInput.value||"새 캐릭터"); });

  const imgPreview=body.querySelector("#charImgPreview");
  const imgInput=body.querySelector("#charImgInput");
  const imgRemoveBtn=body.querySelector("#charImgRemove");
  function refreshImgPreview(){
    imgPreview.innerHTML=charAvatarHtml(ch);
    imgPreview.style.background=ch.image?"":TAG_PALETTE[hashStr(ch.id)%TAG_PALETTE.length];
    imgRemoveBtn.disabled=!ch.image;
  }
  imgInput.onchange=e=>{ handleCharImageFile(e.target.files[0], ch, refreshImgPreview); e.target.value=""; };
  imgRemoveBtn.onclick=()=>{ ch.image=""; save(); refreshImgPreview(); };

  function renderRelList(){
    const listEl=body.querySelector("#charRelList");
    listEl.innerHTML="";
    if(!(ch.relationships||[]).length){ listEl.innerHTML='<p class="hint" style="margin:4px 0">아직 등록된 관계가 없습니다.</p>'; return; }
    ch.relationships.forEach((rel,i)=>{
      const target=P.characters.find(c=>c.id===rel.targetId);
      const row=document.createElement("div"); row.className="char-rel-item";
      const tgt=document.createElement("span"); tgt.className="char-rel-target";
      tgt.textContent=(rel.mutual?"↔ ":"→ ")+(target?target.name||"(이름 없음)":"(삭제된 캐릭터)");
      const lbl=document.createElement("span"); lbl.className="char-rel-label"; lbl.textContent=rel.label||"-";
      const x=document.createElement("button"); x.type="button"; x.className="chip-x"; x.innerHTML=ICONS.close; x.title="삭제";
      x.onclick=()=>{ ch.relationships.splice(i,1); save(); renderRelList(); };
      row.append(tgt, lbl, x);
      listEl.appendChild(row);
    });
  }
  renderRelList();

  const addWrap=body.querySelector("#charRelAdd");
  const others=P.characters.filter(c=>c.id!==ch.id);
  if(others.length){
    const sel=document.createElement("select");
    sel.innerHTML=others.map(c=>`<option value="${c.id}">${esc(c.name)||"(이름 없음)"}</option>`).join("");
    const txt=document.createElement("input"); txt.type="text"; txt.placeholder="관계 (예: 사랑, 증오, 무관심)";
    const mutualWrap=document.createElement("label"); mutualWrap.className="char-rel-mutual";
    const mutualChk=document.createElement("input"); mutualChk.type="checkbox";
    mutualWrap.append(mutualChk, document.createTextNode(" 양방향(서로 같은 관계)"));
    const addBtn=document.createElement("button"); addBtn.type="button"; addBtn.className="btn ghost sm"; addBtn.innerHTML=ICONS.plus+" 관계 추가";
    addBtn.onclick=()=>{
      ch.relationships=ch.relationships||[];
      ch.relationships.push({id:uid(), targetId:sel.value, label:txt.value.trim(), mutual:mutualChk.checked});
      txt.value=""; mutualChk.checked=false; save(); renderRelList();
    };
    addWrap.append(sel, txt, mutualWrap, addBtn);
  }else{
    addWrap.innerHTML='<p class="hint" style="margin:4px 0">관계를 맺으려면 캐릭터가 2명 이상 있어야 합니다.</p>';
  }

  box.appendChild(body);
  overlay.appendChild(box);
  setTimeout(()=>{ nameInput.focus(); },0);
  return overlay;
}
/* 캐릭터 상세 수정 페이지 — 기본 정보 + 관계 + 서사 확장 항목(외모/말투/과거사/취향/대사) */
function charDetailPage(ch){
  const wrap=document.createElement("div"); wrap.className="card char-detail-page";
  const top=document.createElement("div"); top.className="char-detail-top";
  const backBtn=document.createElement("button"); backBtn.type="button"; backBtn.className="btn ghost sm"; backBtn.textContent="← 캐릭터 목록으로";
  backBtn.onclick=()=>{ charDetailFor=null; render(); window.scrollTo(0,0); };
  const ttl=document.createElement("h2"); ttl.innerHTML=ICONS.edit+" "+esc(ch.name||"새 캐릭터");
  top.append(backBtn, ttl);
  wrap.appendChild(top);

  const body=document.createElement("div"); body.className="char-modal-body";
  const enOpts=ENNEAGRAM.map(e=>`<option value="${e.n}">${e.n} — ${e.d}</option>`).join("");
  const mbtiOpts=MBTI_TYPES.map(m=>`<option value="${m}">${m}</option>`).join("");
  const roleOpts=VOGLER_ROLES.map(r=>`<option value="${r.n}">${r.n} — ${r.d}</option>`).join("");
  body.innerHTML=`
    <div class="char-img-row">
      <div class="char-avatar char-avatar-lg" id="charImgPreview"${ch.image?"":` style="background:${TAG_PALETTE[hashStr(ch.id)%TAG_PALETTE.length]}"`}>${charAvatarHtml(ch)}</div>
      <div class="char-img-actions">
        <label class="btn ghost sm">사진 선택<input type="file" id="charImgInput" accept="image/*" style="display:none"></label>
        <button type="button" class="btn ghost sm" id="charImgRemove"${ch.image?"":" disabled"}>제거</button>
        <p class="hint" style="margin:4px 0 0">500KB 이하 이미지, 300×300px로 자동 압축됩니다.</p>
      </div>
    </div>
    <h3 class="char-detail-sub">${ICONS.user} 인물 정보</h3>
    <div class="row"><div><label>이름</label><input type="text" data-k="name"></div>
    <div><label>역할 (보글러의 8가지 캐릭터 원형)</label><select data-k="role"><option value="">선택</option>${roleOpts}</select></div></div>
    <div class="row"><div><label>나이</label><input type="text" data-k="age" placeholder="예: 17세, 20대 초반"></div>
    <div><label>성별</label><input type="text" data-k="gender" placeholder="예: 여성, 남성, 논바이너리 등"></div></div>

    <h3 class="char-detail-sub">${ICONS.bolt} 인물 성격</h3>
    <div class="row"><div><label>MBTI</label><select data-k="mbti"><option value="">선택</option>${mbtiOpts}</select></div>
    <div><label>에니어그램</label><select data-k="enneagram"><option value="">선택</option>${enOpts}</select></div></div>
    <div class="row"><div><label>목표 (원하는 것)</label><input type="text" data-k="goal"></div>
    <div><label>결함 (약점·트라우마)</label><input type="text" data-k="flaw"></div></div>

    <h3 class="char-detail-sub">${ICONS.building} 가족사</h3>
    <label>부모의 정보 및 관계</label><textarea data-k="parentsInfo" placeholder="부모님의 성격, 직업, 캐릭터와의 관계 등"></textarea>
    <label>가족 관계</label><textarea data-k="familyRelations" placeholder="형제자매 등 가족 구성, 갈등이나 유대감 등"></textarea>
    <label>성장배경 / 과거사</label><textarea data-k="backstory" placeholder="자라온 환경, 이야기 이전에 겪은 사건 등"></textarea>

    <h3 class="char-detail-sub">${ICONS.network} 인물의 변화</h3>
    <div class="row"><div><label>변화 전 모습</label><textarea data-k="arcBefore" placeholder="이야기 시작 시점의 성격·태도·상태"></textarea></div>
    <div><label>변화 후 모습</label><textarea data-k="arcAfter" placeholder="이야기를 거치며 달라진 성격·태도·상태"></textarea></div></div>
    <div class="char-arc-preview" id="charArcPreview"></div>

    <h3 class="char-detail-sub">${ICONS.book} 외모 및 특징</h3>
    <label>외모 상세</label><textarea data-k="appearance" placeholder="키, 체형, 헤어스타일, 옷차림, 특징적 외형 등"></textarea>
    <label>말투 / 버릇</label><textarea data-k="speechHabit" placeholder="자주 쓰는 말, 어투, 습관적 행동 등"></textarea>
    <div class="row"><div><label>좋아하는 것</label><input type="text" data-k="likes"></div>
    <div><label>싫어하는 것</label><input type="text" data-k="dislikes"></div></div>
    <label>대사 샘플</label><textarea data-k="dialogueSample" placeholder="이 캐릭터라면 할 법한 대사 예시"></textarea>

    <h3 class="char-detail-sub">기타 메모</h3>
    <textarea data-k="desc" placeholder="위 항목에 넣기 애매한 특이사항"></textarea>

    <label>다른 캐릭터와의 관계</label>
    <div class="char-rel-list" id="charRelList"></div>
    <div class="char-rel-add" id="charRelAdd"></div>`;
  body.querySelectorAll("[data-k]").forEach(el=>bind(el,ch,el.dataset.k));
  const nameInput=body.querySelector('[data-k="name"]');
  nameInput.addEventListener("input", ()=>{ ttl.innerHTML=ICONS.edit+" "+esc(nameInput.value||"새 캐릭터"); });

  const imgPreview=body.querySelector("#charImgPreview");
  const imgInput=body.querySelector("#charImgInput");
  const imgRemoveBtn=body.querySelector("#charImgRemove");
  function refreshImgPreview(){
    imgPreview.innerHTML=charAvatarHtml(ch);
    imgPreview.style.background=ch.image?"":TAG_PALETTE[hashStr(ch.id)%TAG_PALETTE.length];
    imgRemoveBtn.disabled=!ch.image;
  }
  imgInput.onchange=e=>{ handleCharImageFile(e.target.files[0], ch, refreshImgPreview); e.target.value=""; };
  imgRemoveBtn.onclick=()=>{ ch.image=""; save(); refreshImgPreview(); };

  /* 인물의 변화(전/후)를 나란히 보여주는 미리보기 -- 입력할 때마다 즉시 갱신 */
  const arcPreview=body.querySelector("#charArcPreview");
  const arcBox=t=>t?esc(t).replace(/\n/g,"<br>"):'<span class="arc-empty">아직 입력 안 됨</span>';
  function refreshArcPreview(){
    arcPreview.innerHTML=`<div class="arc-box arc-before"><div class="arc-box-label">변화 전</div>${arcBox(ch.arcBefore)}</div>
      <div class="arc-arrow">→</div>
      <div class="arc-box arc-after"><div class="arc-box-label">변화 후</div>${arcBox(ch.arcAfter)}</div>`;
  }
  body.querySelector('[data-k="arcBefore"]').addEventListener("input", refreshArcPreview);
  body.querySelector('[data-k="arcAfter"]').addEventListener("input", refreshArcPreview);
  refreshArcPreview();

  function renderRelList(){
    const listEl=body.querySelector("#charRelList");
    listEl.innerHTML="";
    if(!(ch.relationships||[]).length){ listEl.innerHTML='<p class="hint" style="margin:4px 0">아직 등록된 관계가 없습니다.</p>'; return; }
    ch.relationships.forEach((rel,i)=>{
      const target=P.characters.find(c=>c.id===rel.targetId);
      const row=document.createElement("div"); row.className="char-rel-item";
      const tgt=document.createElement("span"); tgt.className="char-rel-target";
      tgt.textContent=(rel.mutual?"↔ ":"→ ")+(target?target.name||"(이름 없음)":"(삭제된 캐릭터)");
      const lbl=document.createElement("span"); lbl.className="char-rel-label"; lbl.textContent=rel.label||"-";
      const x=document.createElement("button"); x.type="button"; x.className="chip-x"; x.innerHTML=ICONS.close; x.title="삭제";
      x.onclick=()=>{ ch.relationships.splice(i,1); save(); renderRelList(); };
      row.append(tgt, lbl, x);
      listEl.appendChild(row);
    });
  }
  renderRelList();

  const addWrap=body.querySelector("#charRelAdd");
  const others=P.characters.filter(c=>c.id!==ch.id);
  if(others.length){
    const sel=document.createElement("select");
    sel.innerHTML=others.map(c=>`<option value="${c.id}">${esc(c.name)||"(이름 없음)"}</option>`).join("");
    const txt=document.createElement("input"); txt.type="text"; txt.placeholder="관계 (예: 사랑, 증오, 무관심)";
    const mutualWrap=document.createElement("label"); mutualWrap.className="char-rel-mutual";
    const mutualChk=document.createElement("input"); mutualChk.type="checkbox";
    mutualWrap.append(mutualChk, document.createTextNode(" 양방향(서로 같은 관계)"));
    const addBtn=document.createElement("button"); addBtn.type="button"; addBtn.className="btn ghost sm"; addBtn.innerHTML=ICONS.plus+" 관계 추가";
    addBtn.onclick=()=>{
      ch.relationships=ch.relationships||[];
      ch.relationships.push({id:uid(), targetId:sel.value, label:txt.value.trim(), mutual:mutualChk.checked});
      txt.value=""; mutualChk.checked=false; save(); renderRelList();
    };
    addWrap.append(sel, txt, mutualWrap, addBtn);
  }else{
    addWrap.innerHTML='<p class="hint" style="margin:4px 0">관계를 맺으려면 캐릭터가 2명 이상 있어야 합니다.</p>';
  }

  wrap.appendChild(body);
  return wrap;
}
/* 캐릭터 관계도 — SVG 원형 배치, 노드 클릭 시 편집 팝업 */
function charRelationshipGraph(){
  const wrap=document.createElement("div"); wrap.className="char-graph-card";
  const chars=(P.characters||[]).filter(c=>c.name && c.name.trim());
  if(!chars.length){
    wrap.innerHTML='<p class="hint">이름이 입력된 캐릭터가 있어야 관계도를 볼 수 있습니다.</p>';
    return wrap;
  }
  const size=Math.max(420, chars.length*70);
  const cx=size/2, cy=size/2, r=size/2-70;
  const pos={};
  chars.forEach((ch,i)=>{
    const angle=(i/chars.length)*Math.PI*2 - Math.PI/2;
    pos[ch.id]={x:cx+r*Math.cos(angle), y:cy+r*Math.sin(angle)};
  });
  const svgNS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(svgNS,"svg");
  svg.setAttribute("viewBox",`0 0 ${size} ${size}`); svg.setAttribute("width",size); svg.setAttribute("height",size);
  svg.setAttribute("class","char-graph-svg");
  /* 화살촉 마커 정의 */
  const defs=document.createElementNS(svgNS,"defs");
  const marker=document.createElementNS(svgNS,"marker");
  marker.setAttribute("id","charArrowHead"); marker.setAttribute("viewBox","0 0 10 10");
  marker.setAttribute("refX","8"); marker.setAttribute("refY","5");
  marker.setAttribute("markerWidth","7"); marker.setAttribute("markerHeight","7"); marker.setAttribute("orient","auto-start-reverse");
  const arrowPath=document.createElementNS(svgNS,"path");
  arrowPath.setAttribute("d","M0,0 L10,5 L0,10 Z"); arrowPath.setAttribute("class","char-graph-arrowhead");
  marker.appendChild(arrowPath); defs.appendChild(marker); svg.appendChild(defs);
  const NODE_R=26, SPACING=18;
  /* 관계(간선) 목록 수집 — 같은 두 캐릭터 사이에 관계가 여러 개면 평행하게 벌려서 겹치지 않도록 */
  const edges=[];
  chars.forEach(ch=>{
    (ch.relationships||[]).forEach(rel=>{
      if(pos[rel.targetId] && pos[ch.id]) edges.push({from:ch.id, to:rel.targetId, rel});
    });
  });
  const pairGroups={};
  edges.forEach(e=>{ const key=[e.from,e.to].sort().join("|"); (pairGroups[key]=pairGroups[key]||[]).push(e); });
  Object.values(pairGroups).forEach(group=>group.forEach((e,i)=>{ e._idx=i; e._count=group.length; }));
  /* 두 캐릭터 사이의 관계가 여럿이면(방향이 반대여도) 항상 같은 기준(정렬된 id쌍)으로 평행 오프셋을 계산해
     실제로 벌어지도록 한다 — 각 간선 자신의 from/to 방향으로 계산하면 부호가 서로 상쇄되어 겹쳐 보였음 */
  edges.forEach(e=>{
    const [idA,idB]=[e.from,e.to].slice().sort();
    const A=pos[idA], B=pos[idB];
    const dx=B.x-A.x, dy=B.y-A.y, dist=Math.sqrt(dx*dx+dy*dy)||1;
    const ux=dx/dist, uy=dy/dist, px=-uy, py=ux;
    const offset=(e._idx-(e._count-1)/2)*SPACING;
    const Ax=A.x+px*offset, Ay=A.y+py*offset;
    const Bx=B.x+px*offset, By=B.y+py*offset;
    if(e.from===idA){
      e._x1=Ax+ux*(NODE_R+4); e._y1=Ay+uy*(NODE_R+4);
      e._x2=Bx-ux*(NODE_R+10); e._y2=By-uy*(NODE_R+10);
    }else{
      e._x1=Bx-ux*(NODE_R+4); e._y1=By-uy*(NODE_R+4);
      e._x2=Ax+ux*(NODE_R+10); e._y2=Ay+uy*(NODE_R+10);
    }
    /* 라벨 박스는 평행 이동만으로는 폭이 넓어 서로 겹칠 수 있어, 같은 쌍 안에서 선을 따라 위치(t)도 함께 벌린다 */
    const t=Math.max(0.26, Math.min(0.74, 0.5+(e._idx-(e._count-1)/2)*0.18));
    e._mx=Ax+(Bx-Ax)*t; e._my=Ay+(By-Ay)*t;
  });
  /* 1단계: 화살표 선을 모두 그린다 */
  edges.forEach(e=>{
    const line=document.createElementNS(svgNS,"line");
    line.setAttribute("x1",e._x1); line.setAttribute("y1",e._y1); line.setAttribute("x2",e._x2); line.setAttribute("y2",e._y2);
    line.setAttribute("class","char-graph-edge");
    line.setAttribute("marker-end","url(#charArrowHead)");
    if(e.rel.mutual) line.setAttribute("marker-start","url(#charArrowHead)");
    svg.appendChild(line);
  });
  /* 2단계: 관계 라벨 박스를 선 위에 전부 그린다(다른 화살표선에 가려지지 않도록 항상 나중에 그림) */
  edges.forEach(e=>{
    if(!e.rel.label) return;
    const w=Math.max(28, e.rel.label.length*11+14), h=18;
    const rect=document.createElementNS(svgNS,"rect");
    rect.setAttribute("x",e._mx-w/2); rect.setAttribute("y",e._my-h/2);
    rect.setAttribute("width",w); rect.setAttribute("height",h); rect.setAttribute("rx",5);
    rect.setAttribute("class","char-graph-edge-label-bg");
    svg.appendChild(rect);
    const label=document.createElementNS(svgNS,"text");
    label.setAttribute("x",e._mx); label.setAttribute("y",e._my+4);
    label.setAttribute("class","char-graph-edge-label");
    label.textContent=e.rel.label;
    svg.appendChild(label);
  });
  chars.forEach(ch=>{
    const p=pos[ch.id];
    const g=document.createElementNS(svgNS,"g"); g.setAttribute("class","char-graph-node");
    g.setAttribute("transform",`translate(${p.x},${p.y})`);
    g.addEventListener("click", ()=>{ charDetailFor=ch.id; render(); });
    const circle=document.createElementNS(svgNS,"circle"); circle.setAttribute("r","26");
    circle.setAttribute("fill", TAG_PALETTE[hashStr(ch.id)%TAG_PALETTE.length]);
    g.appendChild(circle);
    const text=document.createElementNS(svgNS,"text"); text.setAttribute("y","5");
    text.textContent=ch.name;
    g.appendChild(text);
    svg.appendChild(g);
  });
  const inner=document.createElement("div"); inner.className="char-graph-wrap"; inner.appendChild(svg);
  wrap.appendChild(inner);
  return wrap;
}

/* 기획서 뷰어 — "배경 설정"·"사건 설정" 탭 오른쪽에 "기획서 작성" 내용을 참고용(읽기 전용)으로
   블록 형태로 보여준다. 글쓰기 탭의 좌/우 분할 레이아웃과 같은 방식(.setting-split)을 사용한다. */
function renderPlanViewerInto(container){
  const pd=P.planDoc||blankPlanDoc();
  const items=[{label:"일시", val:pd.date}, {label:"작성자", val:pd.author}]
    .concat(PLAN_FIELDS.map(f=>({label:f.label, val:pd[f.k]})));
  const hasAny=items.some(it=>(it.val||"").trim());
  container.innerHTML=`<div class="card plan-viewer-card">
    <h3>${ICONS.file} 기획서 미리보기</h3>
    <p class="hint">"기획서 작성" 탭에 입력한 내용을 참고용으로 보여드립니다. 여기서는 수정할 수 없습니다.</p>
    ${hasAny ? items.map(it=>`<div class="plan-block plan-view-block">
        <label>${esc(it.label)}</label>
        <div class="plan-view-text${(it.val||"").trim()?"":" empty"}">${(it.val||"").trim()?esc(it.val):"아직 작성하지 않았습니다"}</div>
      </div>`).join("")
      : `<p class="hint">아직 "기획서 작성" 탭에 입력한 내용이 없습니다. 왼쪽 메뉴의 "기획서 작성"에서 먼저 채워보세요.</p>`}
  </div>`;
}
/* 카드 하나를 좌측에, 기획서 뷰어를 우측에 배치하는 분할 화면으로 app에 붙인다 */
function mountWithPlanViewer(cardEl){
  const layout=document.createElement("div"); layout.className="setting-split";
  const left=document.createElement("div"); left.className="setting-main";
  left.appendChild(cardEl);
  const right=document.createElement("div"); right.className="setting-planview";
  renderPlanViewerInto(right);
  layout.append(left, right);
  app.appendChild(layout);
}

/* 배경 설정 (세계관 + 배경을 하나로 통합) */
function rBg(){
  const c=document.createElement("div");
  const worldTypeOpts=(typeof STORY_GUIDE_SLOTS!=="undefined"?((STORY_GUIDE_SLOTS.find(s=>s.key==="worldview")||{}).options||[]):[]);
  c.innerHTML=`<div class="card"><h2>${ICONS.globe} 배경 설정</h2>
    <p class="hint">이야기가 펼쳐지는 세계의 규칙과 분위기, 지리·역사·사회 구조를 정리합니다. 굵은 항목만 채워도 충분하며 나머지는 필요한 만큼만 채우세요.</p>

    <div class="section-title">기본 정보</div>
    <label>한 줄 요약</label><textarea id="w_summary" placeholder="이 세계는 어떤 곳인가"></textarea>
    <div class="row">
      <div><label>세계관 유형</label><select id="w_type"><option value="">선택 안 함</option>${optionsToHtml(worldTypeOpts)}</select></div>
      <div><label>시대</label><input type="text" id="w_era" placeholder="현대/중세/근미래…"></div>
      <div><label>장소</label><input type="text" id="w_place" placeholder="도시/왕국/우주선…"></div>
    </div>
    <label>전체 분위기/톤</label><input type="text" id="b_mood" placeholder="어둡고 진중한 / 밝고 코믹한…">

    <div class="section-title">지리 · 역사 (선택)</div>
    <label>주요 지역/장소</label><textarea id="w_regions" placeholder="이야기의 주 무대가 되는 지역들과 각각의 특징"></textarea>
    <label>연표 · 주요 사건</label><textarea id="w_timeline" placeholder="세계의 역사에서 이야기에 영향을 주는 사건들"></textarea>

    <div class="section-title">사회 구조 (선택)</div>
    <label>정치체제</label><textarea id="w_politics" placeholder="왕정 / 공화정 / 부족연합 등 통치 방식"></textarea>
    <label>계급 · 종족 · 세력 구도</label><textarea id="w_factions" placeholder="신분 구조, 종족, 주요 세력들"></textarea>
    <label>경제</label><textarea id="w_economy" placeholder="화폐, 산업, 계층별 생활수준"></textarea>
    <label>사회 전반 설명</label><textarea id="b_social"></textarea>

    <div class="section-title">규칙 체계</div>
    <label>마법 · 기술 · 초자연 규칙</label><textarea id="w_rules" placeholder="이 세계만의 마법·기술·금기의 기본 원리"></textarea>
    <label>절대 금기</label><textarea id="w_taboo" placeholder="어겨서는 안 되는 규칙과 대가"></textarea>

    <div class="section-title">문화 · 일상 (선택)</div>
    <label>풍습 · 종교</label><textarea id="w_culture"></textarea>
    <label>언어 · 호칭 특징</label><textarea id="w_language"></textarea>

    <div class="section-title">갈등 · 세력 구도 (선택)</div>
    <label>대립 세력 / 전쟁·분쟁 요소</label><textarea id="w_conflict"></textarea>
    <label>기타 세부 묘사</label><textarea id="b_detail"></textarea>

    <div class="section-title">설정 관리 (용어사전)</div>
    <p class="hint" style="margin:0 0 10px">연재 중 설정 실수를 막기 위한 항목입니다. 새로운 세계관 용어(장소·조직·아이템·규칙 등)가 등장할 때마다 카드를 추가해 관리하세요.</p>
    <div class="wv-glossary-list" id="wvGlossaryList"></div>
    <button type="button" class="btn ghost sm" id="wvGlossaryAdd">${ICONS.plus} 용어 추가</button>
  </div>`;
  mountWithPlanViewer(c);
  bind(c.querySelector("#w_summary"),P.world,"summary");
  bind(c.querySelector("#w_type"),P.world,"type");
  bind(c.querySelector("#w_era"),P.world,"era");
  bind(c.querySelector("#w_place"),P.world,"place");
  bind(c.querySelector("#w_regions"),P.world,"regions");
  bind(c.querySelector("#w_timeline"),P.world,"timeline");
  bind(c.querySelector("#w_politics"),P.world,"politics");
  bind(c.querySelector("#w_factions"),P.world,"factions");
  bind(c.querySelector("#w_economy"),P.world,"economy");
  bind(c.querySelector("#w_rules"),P.world,"rules");
  bind(c.querySelector("#w_taboo"),P.world,"taboo");
  bind(c.querySelector("#w_culture"),P.world,"culture");
  bind(c.querySelector("#w_language"),P.world,"language");
  bind(c.querySelector("#w_conflict"),P.world,"conflict");
  bind(c.querySelector("#b_social"),P.background,"social");
  bind(c.querySelector("#b_mood"),P.background,"mood");
  bind(c.querySelector("#b_detail"),P.background,"detail");

  /* 설정 관리(용어사전) — 반복 카드 리스트 */
  function renderGlossary(){
    const listEl=c.querySelector("#wvGlossaryList");
    listEl.innerHTML="";
    P.world.glossary=P.world.glossary||[];
    if(!P.world.glossary.length){
      listEl.innerHTML='<p class="hint" style="margin:0 0 10px">아직 등록된 용어가 없습니다.</p>';
      return;
    }
    P.world.glossary.forEach((g,i)=>{
      const box=document.createElement("div"); box.className="plan-block wv-term";
      box.innerHTML=`
        <div class="wv-term-head">
          <input type="text" class="wv-term-name" placeholder="용어명 (예: 마력석, 붉은 여단…)" value="${esc(g.term||"")}">
          <button type="button" class="chip-x" title="삭제">${ICONS.close}</button>
        </div>
        <label>한 줄 정의</label><input type="text" class="wv-term-def" value="${esc(g.definition||"")}">
        <div class="row">
          <div><label>첫 등장 회차</label><input type="text" class="wv-term-ep" placeholder="예: 12화" value="${esc(g.firstEpisode||"")}"></div>
          <div><label>독자 공개 범위</label><select class="wv-term-disc">
            <option value=""${g.disclosure?"":" selected"}>선택 안 함</option>
            <option value="공개"${g.disclosure==="공개"?" selected":""}>공개</option>
            <option value="일부 공개"${g.disclosure==="일부 공개"?" selected":""}>일부 공개</option>
            <option value="비공개"${g.disclosure==="비공개"?" selected":""}>비공개</option>
          </select></div>
          <div><label>떡밥 회수 여부</label><select class="wv-term-res">
            <option value=""${g.resolved?"":" selected"}>선택 안 함</option>
            <option value="회수완료"${g.resolved==="회수완료"?" selected":""}>회수완료</option>
            <option value="미회수"${g.resolved==="미회수"?" selected":""}>미회수</option>
            <option value="해당없음"${g.resolved==="해당없음"?" selected":""}>해당없음</option>
          </select></div>
        </div>
        <label>절대 규칙 (이 설정이 절대 어겨서는 안 되는 선)</label><textarea class="wv-term-rule">${esc(g.absoluteRule||"")}</textarea>`;
      const nameEl=box.querySelector(".wv-term-name");
      const defEl=box.querySelector(".wv-term-def");
      const epEl=box.querySelector(".wv-term-ep");
      const discEl=box.querySelector(".wv-term-disc");
      const resEl=box.querySelector(".wv-term-res");
      const ruleEl=box.querySelector(".wv-term-rule");
      nameEl.oninput=()=>{ g.term=nameEl.value; save(); };
      defEl.oninput=()=>{ g.definition=defEl.value; save(); };
      epEl.oninput=()=>{ g.firstEpisode=epEl.value; save(); };
      discEl.onchange=()=>{ g.disclosure=discEl.value; save(); };
      resEl.onchange=()=>{ g.resolved=resEl.value; save(); };
      ruleEl.oninput=()=>{ g.absoluteRule=ruleEl.value; save(); };
      box.querySelector(".chip-x").onclick=()=>{ P.world.glossary.splice(i,1); save(); renderGlossary(); };
      listEl.appendChild(box);
    });
  }
  renderGlossary();
  c.querySelector("#wvGlossaryAdd").onclick=()=>{
    P.world.glossary=P.world.glossary||[];
    P.world.glossary.push({id:uid(), term:"", definition:"", firstEpisode:"", absoluteRule:"", disclosure:"", resolved:""});
    save(); renderGlossary();
  };
}

/* 사건 */
const EVENT_AGENCY_OPTS=["주인공 능동 사건 (주인공이 먼저 갈등을 겁니다)","주인공 피동 사건 (적대자가 갈등을 걸어옵니다)"];
const EVENT_CONFLICT_TYPE_OPTS=["내적 갈등 (인물 내면의 심리·도덕적 딜레마)","외적 갈등 — 인물 vs 인물","외적 갈등 — 인물 vs 자신","외적 갈등 — 인물 vs 사회","외적 갈등 — 인물 vs 자연","외적 갈등 — 인물 vs 운명·초자연"];
function rEvent(){
  const c=document.createElement("div");
  const optHtml=(opts)=>opts.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join("");
  c.innerHTML=`<div class="card"><h2>${ICONS.bolt} 사건 설정</h2>
    <p class="hint">이야기 전체의 구조(발단~결말)는 "플롯 생성" 탭에서 다룹니다. 여기서는 사건 하나하나를
    "목표 → 갈등 → 결과 → 다음 사건"의 흐름으로 설계합니다. 굵은 항목만 채워도 충분합니다.</p>

    <div class="section-title">사건 개요</div>
    <label>사건명</label><input type="text" id="e_name" placeholder="예: 왕궁 습격, 첫 만남…">
    <label>사건 설명 (무슨 일이 일어나는가)</label><textarea id="e_main" placeholder="이야기를 시작시키는 사건"></textarea>
    <label>관련 인물</label><textarea id="e_characters" placeholder="이 사건을 주도하는 인물 / 영향을 받는 인물"></textarea>
    <div class="row">
      <div><label>사건 유형</label><select id="e_agency"><option value="">선택 안 함</option>${optHtml(EVENT_AGENCY_OPTS)}</select></div>
      <div><label>갈등 유형</label><select id="e_conflictType"><option value="">선택 안 함</option>${optHtml(EVENT_CONFLICT_TYPE_OPTS)}</select></div>
    </div>

    <div class="section-title">사건 설계 (목표 → 갈등 → 결과)</div>
    <label>목표 (인물이 이 사건에서 원하는 것)</label><textarea id="e_goal"></textarea>
    <label>갈등 · 장애물 (목표를 가로막는 것)</label><textarea id="e_conflict" placeholder="주인공 vs 무엇/누구"></textarea>
    <label>결과 (성공/실패 + 새로 생긴 문제)</label><textarea id="e_disaster"></textarea>

    <div class="section-title">여파 (반응 → 결정, 선택)</div>
    <label>인물의 반응</label><textarea id="e_reaction" placeholder="사건 직후 느끼는 감정적·물리적 반응"></textarea>
    <label>결정 (다음 행동에 대한 결심)</label><textarea id="e_decision" placeholder="이 결심이 다음 사건의 목표가 됩니다"></textarea>

    <div class="section-title">인과 · 전환 (선택)</div>
    <label>이 사건으로 달라진 것</label><textarea id="e_transform" placeholder="가치·지위·관계의 전환 (삶↔죽음, 신뢰↔배신 등)"></textarea>
    <label>다음 사건과의 연결</label><textarea id="e_nextLink"></textarea>
    <label>결말 방향 (선택 — 전체 이야기의 결말 구조는 "플롯 생성" 탭에서 다뤄주세요)</label><textarea id="e_ending" placeholder="이 사건들이 궁극적으로 향하는 방향"></textarea>

    <div class="section-title">사건 관리 (회차 일지)</div>
    <p class="hint" style="margin:0 0 10px">여러 사건이 얽히는 장편 연재에서 인과 사슬을 놓치지 않기 위한 항목입니다. 사건이 하나씩 확정될 때마다 카드를 추가하세요.</p>
    <div class="wv-glossary-list" id="evLogList"></div>
    <button type="button" class="btn ghost sm" id="evLogAdd">${ICONS.plus} 사건 추가</button>
  </div>`;
  mountWithPlanViewer(c);
  bind(c.querySelector("#e_name"),P.event,"name");
  bind(c.querySelector("#e_main"),P.event,"main");
  bind(c.querySelector("#e_characters"),P.event,"characters");
  bind(c.querySelector("#e_agency"),P.event,"agency");
  bind(c.querySelector("#e_conflictType"),P.event,"conflictType");
  bind(c.querySelector("#e_goal"),P.event,"goal");
  bind(c.querySelector("#e_conflict"),P.event,"conflict");
  bind(c.querySelector("#e_disaster"),P.event,"disaster");
  bind(c.querySelector("#e_reaction"),P.event,"reaction");
  bind(c.querySelector("#e_decision"),P.event,"decision");
  bind(c.querySelector("#e_transform"),P.event,"transform");
  bind(c.querySelector("#e_nextLink"),P.event,"nextLink");
  bind(c.querySelector("#e_ending"),P.event,"ending");

  /* 사건 관리(회차 일지) — 반복 카드 리스트 */
  function renderLog(){
    const listEl=c.querySelector("#evLogList");
    listEl.innerHTML="";
    P.event.log=P.event.log||[];
    if(!P.event.log.length){
      listEl.innerHTML='<p class="hint" style="margin:0 0 10px">아직 등록된 사건이 없습니다.</p>';
      return;
    }
    P.event.log.forEach((g,i)=>{
      const box=document.createElement("div"); box.className="plan-block wv-term";
      box.innerHTML=`
        <div class="wv-term-head">
          <input type="text" class="ev-log-name" placeholder="사건명" value="${esc(g.name||"")}">
          <button type="button" class="chip-x" title="삭제">${ICONS.close}</button>
        </div>
        <label>관련 인물</label><input type="text" class="ev-log-char" value="${esc(g.characters||"")}">
        <div class="row">
          <div><label>발생 회차</label><input type="text" class="ev-log-ep" placeholder="예: 12화" value="${esc(g.episode||"")}"></div>
          <div><label>클리프행어 여부</label><select class="ev-log-cliff">
            <option value=""${g.cliffhanger?"":" selected"}>선택 안 함</option>
            <option value="예"${g.cliffhanger==="예"?" selected":""}>예</option>
            <option value="아니오"${g.cliffhanger==="아니오"?" selected":""}>아니오</option>
          </select></div>
        </div>
        <label>파급효과 (이 사건으로 달라진 것)</label><textarea class="ev-log-impact">${esc(g.impact||"")}</textarea>
        <label>다음 사건과의 연결</label><textarea class="ev-log-next">${esc(g.nextLink||"")}</textarea>`;
      const nameEl=box.querySelector(".ev-log-name");
      const charEl=box.querySelector(".ev-log-char");
      const epEl=box.querySelector(".ev-log-ep");
      const cliffEl=box.querySelector(".ev-log-cliff");
      const impactEl=box.querySelector(".ev-log-impact");
      const nextEl=box.querySelector(".ev-log-next");
      nameEl.oninput=()=>{ g.name=nameEl.value; save(); };
      charEl.oninput=()=>{ g.characters=charEl.value; save(); };
      epEl.oninput=()=>{ g.episode=epEl.value; save(); };
      cliffEl.onchange=()=>{ g.cliffhanger=cliffEl.value; save(); };
      impactEl.oninput=()=>{ g.impact=impactEl.value; save(); };
      nextEl.oninput=()=>{ g.nextLink=nextEl.value; save(); };
      box.querySelector(".chip-x").onclick=()=>{ P.event.log.splice(i,1); save(); renderLog(); };
      listEl.appendChild(box);
    });
  }
  renderLog();
  c.querySelector("#evLogAdd").onclick=()=>{
    P.event.log=P.event.log||[];
    P.event.log.push({id:uid(), name:"", characters:"", episode:"", impact:"", nextLink:"", cliffhanger:""});
    save(); renderLog();
  };
}

/* ===== 📋 기획서 작성 =====
   웹툰 기획안 표준 양식(첨부 양식)과 동일한 항목을 블럭 단위로 입력받는다.
   각 블럭 위에는 8pt 크기의 작성 가이드 문구를 붙여 무엇을 적어야 하는지 안내한다.
   내보내기(.docx)는 exportPlan()에서 같은 양식(표) 그대로 출력한다. */
const PLAN_FIELDS=[
  {k:"title", label:"제목", guide:"작품의 제목 또는 가제를 입력하세요.", type:"text"},
  {k:"genre", label:"장르", guide:"로맨스·판타지·액션·스릴러 등 장르와 톤을 적어주세요.", type:"text"},
  {k:"logline", label:"로그라인", guide:"작품 전체를 한두 문장으로 요약하세요. (주인공이 무엇을 원하고, 무엇이 가로막는가)", type:"textarea"},
  {k:"mainReaders", label:"주요 독자", guide:"이 작품을 즐길 핵심 독자층(연령대·성별·취향)을 구체적으로 적어주세요.", type:"textarea"},
  {k:"length", label:"웹툰 분량", guide:"예상 총 화수, 연재 주기, 회당 컷 수 등을 적어주세요.", type:"textarea"},
  {k:"material", label:"중심 소재", guide:"이야기의 핵심이 되는 소재나 컨셉을 적어주세요.", type:"textarea"},
  {k:"situation", label:"상황", guide:"이야기가 시작되는 시점의 배경 상황을 설명하세요.", type:"textarea"},
  {k:"characters", label:"등장인물", guide:"주요 인물의 이름과 특징, 관계를 간단히 소개하세요. (자세한 설정은 '캐릭터 설정' 메뉴를 이용하세요)", type:"textarea"},
  {k:"incident", label:"사건", guide:"이야기를 이끌어가는 핵심 사건과 갈등을 적어주세요.", type:"textarea"},
  {k:"ending", label:"결말", guide:"이야기가 어떻게 마무리되는지 적어주세요.", type:"textarea"},
  {k:"intent", label:"기획의도", guide:"이 작품을 왜 만들고자 하는지, 기획 배경과 목적을 적어주세요.", type:"textarea-lg"},
  {k:"synopsis", label:"시놉시스", guide:"기승전결에 따라 전체 줄거리를 상세하게 서술하세요.", type:"textarea-xl"},
];
function rPlan(){
  if(!P.planDoc) P.planDoc=blankPlanDoc();
  const pd=P.planDoc;
  const c=document.createElement("div");
  c.innerHTML=`<div class="card"><div class="card-h2-row"><h2>${ICONS.file} 기획서 작성</h2>${submitBtnHtml()}</div>
    <p class="hint">항목별로 작성하면 상단 '내보내기 → 기획서 출력(.docx)'에서 정해진 양식의 워드 파일로 받을 수 있습니다.</p>
    <div class="plan-row">
      <div class="plan-block"><label>일시</label><p class="plan-guide">작성한 날짜를 입력하세요. (예: 2026년 8월 18일)</p><input type="text" id="pd_date" placeholder="2026년 8월 18일"></div>
      <div class="plan-block"><label>작성자</label><p class="plan-guide">이름과 학번 등 작성자 정보를 입력하세요.</p><input type="text" id="pd_author" placeholder="홍길동 (2024000000)"></div>
    </div>
    ${PLAN_FIELDS.map(f=>`<div class="plan-block">
      <label>${f.label}</label>
      <p class="plan-guide">${f.guide}</p>
      ${f.type==="text"
        ? `<input type="text" id="pd_${f.k}">`
        : `<textarea id="pd_${f.k}" class="${f.type==="textarea-xl"?"plan-ta-xl":f.type==="textarea-lg"?"plan-ta-lg":""}"></textarea>`}
    </div>`).join("")}
  </div>`;
  app.appendChild(c);
  bind(c.querySelector("#pd_date"),pd,"date");
  bind(c.querySelector("#pd_author"),pd,"author");
  PLAN_FIELDS.forEach(f=> bind(c.querySelector("#pd_"+f.k),pd,f.k));
  wireSubmitBtn(c,"plan");
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
/* 플롯 단계(섹션)별 고정 색상 — 같은 섹션이면 항상 같은 색 (id 해시 기반) */
function getSectionColor(secId){ return TAG_PALETTE[hashStr(secId)%TAG_PALETTE.length]; }
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
    c.innerHTML=`<h2>${ICONS.book} 플롯 생성</h2>
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
  head.innerHTML=`<div class="card-h2-row"><h2>${ICONS.book} 플롯 생성</h2>${submitBtnHtml()}</div>
    <p class="hint">현재 구조: <b>${struct?struct.label:"사용자 구조"}</b> · 각 섹션의 <b>＋ 아이디어 가져오기</b>로 아이디어 수집에서 아이디어를 담거나, <b>＋ 아이디어 생성</b>으로 여기서 바로 새 아이디어를 만들 수 있습니다. 아이디어 카드를 우클릭하면 아이디어 수집 페이지로 보낼 수 있어요. 드래그 핸들로 순서를 바꿀 수 있고, 아이디어 텍스트를 클릭하거나 수정 아이콘을 누르면 바로 수정할 수 있어요(아이디어 수집 원본과 별개).</p>
    <div class="plot-toolbar">
      <button class="btn ghost sm" id="addSection">＋ 섹션 추가</button>
      <button class="btn danger sm" id="changeStruct">구조 변경</button>
    </div>`;
  app.appendChild(head);
  wireSubmitBtn(head,"plot");
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
    commitSectionOrder(secWrap);
  });

  /* 아이디어 선택 팝업 (열려 있을 때만) */
  if(plotPickerFor){
    const sec=P.plotDoc.sections.find(s=>s.id===plotPickerFor);
    if(sec) app.appendChild(plotPickerModal(sec));
    else plotPickerFor=null;
  }
}

/* 화면(DOM) 순서대로 plotDoc.sections 배열 자체를 재정렬 */
function commitSectionOrder(secWrap){
  const order=[...secWrap.querySelectorAll(".plot-section")].map(el=>el.dataset.secid);
  P.plotDoc.sections.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
  dndDropHandled=true;
  save(); render();
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
  const editBtn=iconBtn(ICONS.edit,"이름 수정",()=>{
    const nm=prompt("섹션 이름:",sec.name); if(nm===null)return;
    sec.name=nm||sec.name; save(); render();
  });
  // 아이디어 가져오기 (아이디어 수집에서 골라오기)
  const importBtn=iconBtn(ICONS.download,"아이디어 가져오기",()=>togglePicker(sec));
  // 아이디어 생성 (플롯 생성에서 바로 새 블록 작성)
  const createBtn=iconBtn(ICONS.plus,"아이디어 생성",()=>createIdeaInSection(sec));
  // 섹션 이동 핸들
  const moveBtn=iconBtn(ICONS.grip,"드래그해서 섹션 순서 변경",null);
  moveBtn.classList.add("plot-sec-move");
  moveBtn.addEventListener("mousedown", ()=>{ card.draggable=true; });
  moveBtn.addEventListener("touchstart", ()=>{ card.draggable=true; }, {passive:true});
  card.addEventListener("dragstart", e=>{
    if(!card.draggable) return;
    dndDropHandled=false;
    e.dataTransfer.effectAllowed="move";
    setTimeout(()=>card.classList.add("sec-dragging"),0);
  });
  card.addEventListener("dragend", ()=>{
    card.draggable=false; card.classList.remove("sec-dragging");
    if(!dndDropHandled && secWrap && secWrap.isConnected) commitSectionOrder(secWrap);
  });
  // 접기/펼치기
  const collBtn=iconBtn(collapsed?"▸":"▾", collapsed?"펼치기":"접기", ()=>{
    if(collapsed) plotCollapsed.delete(sec.id); else plotCollapsed.add(sec.id);
    render();
  });
  // 삭제
  const delBtn=iconBtn(ICONS.trash,"섹션 삭제",()=>{
    if((sec.ideaIds||[]).length && !confirm("이 섹션의 아이디어 배치가 해제됩니다. (원본은 유지) 삭제할까요?"))return;
    P.plotDoc.sections=P.plotDoc.sections.filter(x=>x.id!==sec.id); save(); render();
  });
  delBtn.classList.add("plot-sec-del");
  h.append(num, nameEl, spacer, cnt, editBtn, importBtn, createBtn, moveBtn, collBtn, delBtn);
  card.appendChild(h);

  if(collapsed) return card;

  /* 예시 설명 */
  if(sec.desc){ const dsc=document.createElement("p"); dsc.className="plot-sec-desc"; dsc.textContent=sec.desc; card.appendChild(dsc); }

  /* 배치된 아이디어 (드롭존) */
  const body=document.createElement("div"); body.className="plot-drop plot-section-body"; body.dataset.sec=sec.id;
  const ids=(sec.ideaIds||[]);
  ids.forEach(id=>{ const b=findIdea(id); if(b) body.appendChild(plotIdeaCard(b, secWrap)); });
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
    commitPlotIdeaOrder(secWrap);
  });

  /* ＋ 아이디어 가져오기 / ＋ 아이디어 생성 박스 (드래그로 이 섹션에 떨어뜨리는 것도 가능) */
  const addRow=document.createElement("div"); addRow.className="plot-add-row";
  const importBox=document.createElement("div"); importBox.className="plot-add-box";
  importBox.innerHTML=`<span class="plot-add-plus">${ICONS.download}</span><span class="plot-add-label">아이디어 가져오기</span>`;
  importBox.onclick=()=>togglePicker(sec);
  const createBox=document.createElement("div"); createBox.className="plot-add-box";
  createBox.innerHTML=`<span class="plot-add-plus">＋</span><span class="plot-add-label">아이디어 생성</span>`;
  createBox.onclick=()=>createIdeaInSection(sec);
  [importBox, createBox].forEach(box=>{
    box.addEventListener("dragover", e=>{
      const dragging=document.querySelector(".plot-idea.dragging");
      if(!dragging) return;
      e.preventDefault();
      body.appendChild(dragging); box.classList.add("drop-hover");
    });
    box.addEventListener("dragleave", ()=>box.classList.remove("drop-hover"));
    box.addEventListener("drop", e=>{
      if(!document.querySelector(".plot-idea.dragging")) return;
      e.preventDefault();
      commitPlotIdeaOrder(secWrap);
    });
  });
  addRow.append(importBox, createBox);
  card.appendChild(addRow);

  return card;
}

/* 아이콘 버튼 헬퍼 */
function iconBtn(label, title, onClick){
  const b=document.createElement("button"); b.className="plot-icon-btn"; b.innerHTML=label; b.title=title;
  if(onClick) b.onclick=onClick;
  return b;
}
/* 피커 토글 (다른 섹션 열면 필터 초기화) */
function togglePicker(sec){
  if(plotPickerFor===sec.id){ plotPickerFor=null; }
  else { plotPickerFor=sec.id; plotPickerFilter=[]; }
  render();
}
/* 플롯 생성 페이지에서 바로 새 아이디어 블록을 만들어 이 섹션에 배치
   (아이디어 수집과 같은 저장소(P.ideaBlocks)를 쓰므로 아이디어 수집 목록에도 자동으로 나타난다) */
function createIdeaInSection(sec){
  const text=prompt("새 아이디어 내용을 입력하세요:", "");
  if(text===null) return;
  const trimmed=text.trim();
  if(!trimmed) return;
  if(!Array.isArray(P.ideaBlocks)) P.ideaBlocks=[];
  const id=uid();
  P.ideaBlocks.push({id, text:trimmed, tags:[]});
  sec.ideaIds=sec.ideaIds||[];
  sec.ideaIds.push(id);
  save(); render();
}
/* 플롯 생성의 아이디어 블록 우클릭 메뉴 — 아이디어 수집 페이지로 이동해서 보여주기 */
function openPlotIdeaCtxMenu(x, y, b){
  const m=document.getElementById("ctxMenu"); if(!m) return;
  const items=[
    ["아이디어 수집으로 보내기",ICONS.upload,()=>goToIdeaCollection(b.id)]
  ];
  m.innerHTML="";
  items.forEach(([label,icon,fn])=>{
    const btn=document.createElement("button");
    btn.innerHTML=icon+" "+label;
    btn.onclick=()=>{ hideCtxMenu(); fn(); };
    m.appendChild(btn);
  });
  m.hidden=false;
  const vw=window.innerWidth, vh=window.innerHeight;
  m.style.left=Math.min(x, vw-190)+"px";
  m.style.top=Math.min(y, vh-(items.length*36+20))+"px";
}
/* 아이디어 수집 탭으로 전환하고 해당 아이디어 블록으로 스크롤·강조 */
function goToIdeaCollection(id){
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  const btn=document.querySelector('.tab[data-tab="idea"]');
  if(btn) btn.classList.add("active");
  activeTab="idea"; localStorage.setItem(TAB_KEY, activeTab);
  ideaHighlightId=id;
  render();
  window.scrollTo(0,0);
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
  const closeBtn=iconBtn(ICONS.close,"닫기",()=>{ plotPickerFor=null; render(); });
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
function commitPlotIdeaOrder(secWrap){
  rebuildPlotFromDOM(secWrap);
  dndDropHandled=true;
  save(); render();
}
/* 플롯용 아이디어 미니 카드 (드래그 가능, × 로 배치 해제) */
function plotIdeaCard(b, secWrap){
  const d=document.createElement("div"); d.className="plot-idea"; d.dataset.id=b.id; d.draggable=false;
  const color=(b.tags&&b.tags.length)?getTagColor(b.tags[0]):"var(--line)";
  d.style.borderLeftColor=color;
  d.addEventListener("contextmenu", e=>{ e.preventDefault(); e.stopPropagation(); openPlotIdeaCtxMenu(e.clientX, e.clientY, b); });
  const handle=document.createElement("span"); handle.className="plot-idea-handle"; handle.innerHTML=ICONS.grip; handle.title="드래그해서 이동";
  handle.addEventListener("mousedown", ()=>{ d.draggable=true; });
  handle.addEventListener("touchstart", ()=>{ d.draggable=true; }, {passive:true});
  d.addEventListener("dragstart", e=>{
    dndDropHandled=false;
    e.dataTransfer.effectAllowed="move";
    e.dataTransfer.setData("text/plain", b.id);
    setTimeout(()=>d.classList.add("dragging"),0);
  });
  d.addEventListener("dragend", ()=>{
    d.draggable=false; d.classList.remove("dragging");
    if(!dndDropHandled && secWrap && secWrap.isConnected) commitPlotIdeaOrder(secWrap);
  });
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
  const editBtn=document.createElement("button"); editBtn.className="plot-idea-edit"; editBtn.innerHTML=ICONS.edit; editBtn.title="아이디어 수정 (원본과 별개)";
  editBtn.onclick=()=>{
    txt.focus();
    try{ const r=document.createRange(); r.selectNodeContents(txt); r.collapse(false);
      const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(r); }catch(e){}
  };
  const rm=document.createElement("button"); rm.className="plot-idea-rm"; rm.innerHTML=ICONS.close; rm.title="이 섹션에서 빼기";
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
let writeSelectMode=false;  // 본문 블록 선택 모드(그룹화용)
let writeSelectedIds=new Set(); // 선택된 본문 블록 id들
let ctxMenuTargetBlock=null;    // 우클릭 메뉴가 열린 블록

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
  if(!Array.isArray(P.writeDoc.groups)) P.writeDoc.groups=[];
  const pd=P.plotDoc;
  if(!pd || !pd.structure || !pd.sections.length){
    const c=document.createElement("div"); c.className="card";
    c.innerHTML=`<h2>${ICONS.edit} 글쓰기</h2><p class="hint">먼저 <b>플롯 생성</b>에서 플롯 구조를 만들어 주세요. 플롯 섹션이 글쓰기의 틀이 됩니다.</p>`;
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

  /* 목차(플롯 목록)·미리보기 접기/펼치기 버튼 — 각 패널 바로 앞/뒤에 붙여서, 패널이 display:none으로
     접혀도 이 버튼만은 그 자리에 그대로 남는다 (곰국을끼리오너라 프로젝트 참고) */
  const tocToggleBtn=document.createElement("button"); tocToggleBtn.className="panel-toggle toc-toggle"; tocToggleBtn.title="플롯 목록 접기/펼치기";
  tocToggleBtn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>';
  tocToggleBtn.onclick=()=>{ UICOL.toc=!UICOL.toc; saveUiCollapse(); applyUiCollapse(); };
  layout.appendChild(tocToggleBtn);

  /* 좌: 플롯 목록 + 글자수/% */
  const left=document.createElement("div"); left.className="write-plotlist";
  renderLeftInto(left);
  layout.appendChild(left);

  /* 중앙: 장면 블록 */
  const main=document.createElement("div"); main.className="write-main";
  { const savedMainW=loadMainWidth(); if(savedMainW) main.style.flex="0 0 "+savedMainW+"px"; }
  const bar=document.createElement("div"); bar.className="write-toolbar";
  const loadBtn=document.createElement("button"); loadBtn.className="btn ghost sm icon-btn";
  loadBtn.innerHTML=ICONS.load+" 플롯 불러오기";
  loadBtn.title="플롯 생성에서 각 섹션에 배치한 아이디어를 장면 블록으로 불러옵니다";
  loadBtn.onclick=loadPlotIntoWrite;
  bar.append(loadBtn);
  const barRight=document.createElement("div"); barRight.className="write-toolbar-right";
  const selBtn=document.createElement("button"); selBtn.className="btn ghost sm icon-btn"+(writeSelectMode?" wt-selecting":"");
  selBtn.innerHTML=ICONS.check+(writeSelectMode?" 선택 중":" 블록 선택");
  selBtn.title="여러 본문 블록을 선택해 그룹으로 묶을 수 있습니다";
  selBtn.onclick=()=>{ writeSelectMode=!writeSelectMode; if(!writeSelectMode) writeSelectedIds.clear(); render(); };
  barRight.appendChild(selBtn);
  if(writeSelectMode){
    const groupBtn=document.createElement("button"); groupBtn.className="btn ghost sm icon-btn";
    groupBtn.innerHTML=ICONS.group+" 그룹으로 묶기 ("+writeSelectedIds.size+")";
    groupBtn.disabled=writeSelectedIds.size<2;
    if(groupBtn.disabled) groupBtn.style.opacity=.45;
    groupBtn.onclick=groupSelectedBlocks;
    barRight.appendChild(groupBtn);
  }
  if(typeof currentUser!=="undefined" && currentUser && currentUser.role!=="professor"){
    const submitBtn=document.createElement("button"); submitBtn.className="btn ghost sm icon-btn";
    submitBtn.innerHTML=ICONS.upload+" 제출";
    submitBtn.onclick=()=>openSubmitModal("write");
    barRight.appendChild(submitBtn);
  }
  bar.appendChild(barRight);
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
    const loadBtn=document.createElement("button"); loadBtn.className="wd-icon"; loadBtn.innerHTML=ICONS.load; loadBtn.title="아이디어 불러오기";
    loadBtn.onclick=()=>loadSectionIdeas(sec);
    const createBtn=document.createElement("button"); createBtn.className="wd-icon"; createBtn.innerHTML=ICONS.plus; createBtn.title="블럭 생성";
    createBtn.onclick=()=>addSceneBlock(sec);
    div.append(loadBtn, createBtn);
    group.appendChild(div);
    group.addEventListener("contextmenu", e=>{ e.preventDefault(); e.stopPropagation(); openSectionCtxMenu(e.clientX, e.clientY, sec); });
    const list=document.createElement("div"); list.className="write-blocklist"; list.dataset.sec=sec.id;
    let curGroupWrap=null, curGroupId=null;
    blocksOfSection(sec.id).forEach((bl)=>{
      const card=sceneBlockCard(bl, main, liveRefresh, ++writeBlockNo);
      const gid=bl.groupId||"";
      if(gid){
        if(gid!==curGroupId){ curGroupWrap=blockGroupWrap(gid, list); curGroupId=gid; }
        curGroupWrap.querySelector(".wg-body").appendChild(card);
      }else{
        curGroupWrap=null; curGroupId=null;
        list.appendChild(card);
      }
    });
    group.appendChild(list);
    setupBlockDnD(list, main);
    main.appendChild(group);
  });
  layout.appendChild(main);
  const resizer=document.createElement("div"); resizer.className="write-resizer"; resizer.title="드래그해서 폭 조절";
  layout.appendChild(resizer);
  setupPanelResizer(resizer, main);
  renderPreviewInto(right);
  layout.appendChild(right);
  const previewToggleBtn=document.createElement("button"); previewToggleBtn.className="panel-toggle preview-toggle"; previewToggleBtn.title="미리보기 접기/펼치기";
  previewToggleBtn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>';
  previewToggleBtn.onclick=()=>{ UICOL.preview=!UICOL.preview; saveUiCollapse(); applyUiCollapse(); };
  layout.appendChild(previewToggleBtn);
  requestAnimationFrame(()=>{ main.querySelectorAll(".sub-textarea").forEach(autoGrowTextarea); });

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
      P.writeDoc.blocks.push({id:uid(), sectionId:sec.id, fromIdea:id, title:plotIdeaText(id), items:[], groupId:"", backgrounds:[], characters:[]});
      existing.add(id); added++;
    });
  });
  if(added){ save(); render(); alert(`플롯에서 ${added}개의 아이디어를 장면 블록으로 불러왔습니다.`); }
  else alert("새로 불러올 아이디어가 없습니다.\n(플롯 생성 탭에서 각 섹션에 아이디어를 배치해 주세요.)");
}
/* 특정 플롯 단계(섹션)에 빈 장면 블록 하나 생성 */
function addSceneBlock(sec){
  const nb={id:uid(), sectionId:sec.id, fromIdea:"", title:"", items:[], groupId:"", backgrounds:[], characters:[]};
  P.writeDoc.blocks.push(nb); writeFocusTitle=nb.id; save(); render();
}
/* 특정 플롯 단계(섹션)의 배치 아이디어만 불러오기 */
function loadSectionIdeas(sec){
  const existing=new Set((P.writeDoc.blocks||[]).map(b=>b.fromIdea).filter(Boolean));
  let added=0;
  (sec.ideaIds||[]).forEach(id=>{
    if(existing.has(id)) return;
    P.writeDoc.blocks.push({id:uid(), sectionId:sec.id, fromIdea:id, title:plotIdeaText(id), items:[], groupId:"", backgrounds:[], characters:[]});
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

/* contenteditable 요소의 내용을 전체 선택 */
function selectAllEditable(el){
  try{
    const r=document.createRange(); r.selectNodeContents(el);
    const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
  }catch(e){}
}
/* textarea 높이를 내용에 맞춰 자동 조절 (빈 여백 제거) */
function autoGrowTextarea(ta){
  ta.style.height="auto";
  ta.style.height=ta.scrollHeight+"px";
}

/* 여러 본문 블록을 하나의 그룹 상자로 묶어 보여주는 래퍼 생성 */
function blockGroupWrap(gid, list){
  const wrap=document.createElement("div"); wrap.className="write-blockgroup"; wrap.dataset.group=gid;
  const g=(P.writeDoc.groups||[]).find(x=>x.id===gid);
  const head=document.createElement("div"); head.className="wg-head";
  const title=document.createElement("span"); title.className="wg-title"; title.textContent=(g&&g.name)||"그룹";
  const actions=document.createElement("div"); actions.className="wg-actions";
  const renameBtn=document.createElement("button"); renameBtn.title="그룹 이름 변경"; renameBtn.innerHTML=ICONS.edit;
  renameBtn.onclick=()=>{
    const nm=prompt("그룹 이름:", (g&&g.name)||"그룹"); if(nm===null||!nm.trim()) return;
    if(g) g.name=nm.trim(); save(); render();
  };
  const ungroupBtn=document.createElement("button"); ungroupBtn.title="그룹 해제"; ungroupBtn.innerHTML=ICONS.ungroup;
  ungroupBtn.onclick=()=>ungroupBlocks(gid);
  actions.append(renameBtn, ungroupBtn);
  head.append(title, actions);
  const body=document.createElement("div"); body.className="wg-body";
  wrap.append(head, body);
  list.appendChild(wrap);
  return wrap;
}
/* 선택된 본문 블록들을 하나의 그룹으로 묶기 */
function groupSelectedBlocks(){
  if(writeSelectedIds.size<2) return;
  const name=prompt("그룹 이름:", "그룹"); if(name===null) return;
  const gid=uid();
  P.writeDoc.groups=P.writeDoc.groups||[];
  P.writeDoc.groups.push({id:gid, name:name.trim()||"그룹"});
  const selected=new Set(writeSelectedIds);
  /* 선택된 블록들이 목록에서 서로 붙어 보이도록, 첫 선택 블록 위치로 나머지를 모아온다 */
  const blocks=P.writeDoc.blocks||[];
  const picked=blocks.filter(b=>selected.has(b.id));
  const rest=blocks.filter(b=>!selected.has(b.id));
  const firstIdx=blocks.findIndex(b=>selected.has(b.id));
  picked.forEach(b=>{ b.groupId=gid; });
  const insertAt=Math.min(firstIdx, rest.length);
  rest.splice(insertAt, 0, ...picked);
  P.writeDoc.blocks=rest;
  writeSelectedIds.clear(); writeSelectMode=false;
  save(); render();
}
/* 그룹 해제 (그룹 자체 삭제, 소속 블록은 그대로 남음) */
function ungroupBlocks(gid){
  (P.writeDoc.blocks||[]).forEach(b=>{ if(b.groupId===gid) b.groupId=""; });
  P.writeDoc.groups=(P.writeDoc.groups||[]).filter(g=>g.id!==gid);
  save(); render();
}

/* 장면 블록 카드 */
function sceneBlockCard(bl, main, liveRefresh, num){
  const d=document.createElement("div"); d.className="scene-block"+(writeSelectedIds.has(bl.id)?" selected":""); d.dataset.id=bl.id; d.id="wblk-"+bl.id; d.draggable=false;
  d.addEventListener("contextmenu", e=>{ e.preventDefault(); e.stopPropagation(); openBlockCtxMenu(e.clientX, e.clientY, bl); });
  /* 블록 왼쪽 컬러 바 — 같은 플롯 단계(섹션)에 속한 블록은 모두 같은 색 */
  d.style.borderLeftColor=getSectionColor(bl.sectionId);
  const head=document.createElement("div"); head.className="scene-head";
  const handle=document.createElement("span"); handle.className="scene-handle"; handle.innerHTML=ICONS.grip; handle.title="드래그해서 블록 이동";
  const numEl=document.createElement("span"); numEl.className="scene-num"; numEl.textContent=(num!=null?num:"");
  handle.addEventListener("mousedown", ()=>{ d.draggable=true; });
  handle.addEventListener("touchstart", ()=>{ d.draggable=true; }, {passive:true});
  d.addEventListener("dragstart", e=>{
    if(!d.draggable) return;
    dndDropHandled=false;
    e.dataTransfer.effectAllowed="move";
    setTimeout(()=>d.classList.add("dragging"),0);
  });
  d.addEventListener("dragend", ()=>{
    d.draggable=false; d.classList.remove("dragging");
    if(!dndDropHandled && main && main.isConnected) commitWriteBlockOrder(main);
  });
  /* 플롯/제목 — 헤더 한 줄에 배치. 길면 이 칸만 줄바꿈되어 늘어나고, 핸들·번호·버튼은 위치 고정.
     기본은 잠금(읽기전용), 텍스트를 클릭하면 바로 편집 */
  const titleEl=document.createElement("div"); titleEl.className="scene-title"; titleEl.contentEditable="false";
  titleEl.spellcheck=false; titleEl.dataset.ph="플롯 / 제목 (클릭해서 편집)";
  titleEl.textContent=bl.title||"";
  titleEl.oninput=()=>{ bl.title=titleEl.textContent; save(); liveRefresh&&liveRefresh(); };
  titleEl.addEventListener("blur", ()=>{ titleEl.contentEditable="false"; });
  titleEl.addEventListener("click", ()=>{ if(titleEl.contentEditable!=="true"){ titleEl.contentEditable="true"; titleEl.focus(); selectAllEditable(titleEl); } });
  const bgBtn=document.createElement("button"); bgBtn.className="scene-tagbtn"; bgBtn.innerHTML=ICONS.plus+" 배경"; bgBtn.title="배경 메모 추가";
  bgBtn.onclick=e=>{ e.stopPropagation(); const nm=prompt("배경 메모:"); if(nm&&nm.trim()){ bl.backgrounds=bl.backgrounds||[]; bl.backgrounds.push(nm.trim()); save(); render(); } };
  const charBtn=document.createElement("button"); charBtn.className="scene-tagbtn"; charBtn.innerHTML=ICONS.plus+" 캐릭터"; charBtn.title="캐릭터 추가";
  charBtn.onclick=e=>{ e.stopPropagation(); openCharacterPicker(charBtn, bl); };
  const delBtn=document.createElement("button"); delBtn.className="scene-del-btn"; delBtn.innerHTML=ICONS.close; delBtn.title="블록 삭제";
  delBtn.onclick=()=>{ if(!confirm("이 장면 블록을 삭제할까요?"))return; P.writeDoc.blocks=P.writeDoc.blocks.filter(x=>x.id!==bl.id); save(); render(); };
  if(writeSelectMode){
    const chk=document.createElement("input"); chk.type="checkbox"; chk.className="scene-select-chk";
    chk.title="선택해서 그룹으로 묶기"; chk.checked=writeSelectedIds.has(bl.id);
    chk.onclick=e=>e.stopPropagation();
    chk.onchange=()=>{ if(chk.checked) writeSelectedIds.add(bl.id); else writeSelectedIds.delete(bl.id); render(); };
    head.appendChild(chk);
  }
  head.append(handle, numEl, titleEl, bgBtn, charBtn, delBtn);
  d.appendChild(head);
  if(bl.id===writeFocusTitle){ writeFocusTitle=null; setTimeout(()=>{ titleEl.contentEditable="true"; titleEl.focus(); selectAllEditable(titleEl); if(d.scrollIntoView) d.scrollIntoView({behavior:"smooth", block:"center"}); },0); }

  /* 배경/캐릭터 메모 — 플롯/제목 바로 아래 2열, "배경: 이름1, 이름2" 형식으로 라벨은 한 번만 표시 */
  if((bl.backgrounds&&bl.backgrounds.length) || (bl.characters&&bl.characters.length)){
    const metaRow=document.createElement("div"); metaRow.className="scene-meta-row";
    const bgCol=metaCol("배경", bl.backgrounds, i=>{ bl.backgrounds.splice(i,1); save(); render(); });
    const charCol=metaCol("캐릭터", bl.characters, i=>{ bl.characters.splice(i,1); save(); render(); });
    metaRow.append(bgCol||document.createElement("div"), charCol||document.createElement("div"));
    d.appendChild(metaRow);
  }

  /* 하위 블록(본문/대사) */
  const itemsEl=document.createElement("div"); itemsEl.className="scene-items"; itemsEl.dataset.block=bl.id;
  (bl.items||[]).forEach(it=>itemsEl.appendChild(subBlockEl(bl, it, liveRefresh, main)));
  setupItemDnD(itemsEl, main);
  d.appendChild(itemsEl);

  /* 본문 블록 아래 점선 추가 버튼 — 본문/대사 추가를 한 행에 5:5로 배치 */
  const addRow=document.createElement("div"); addRow.className="scene-dashed-row";
  const addTextDashed=document.createElement("button"); addTextDashed.type="button"; addTextDashed.className="scene-dashed-add";
  addTextDashed.innerHTML=ICONS.plus+" 지문추가"; addTextDashed.title="지문 추가";
  addTextDashed.onclick=()=>{ bl.items=bl.items||[]; bl.items.push({id:uid(), type:"text", char:"", text:""}); save(); render(); };
  const addDlgDashed=document.createElement("button"); addDlgDashed.type="button"; addDlgDashed.className="scene-dashed-add";
  addDlgDashed.innerHTML=ICONS.plus+" 대사추가"; addDlgDashed.title="대사 추가";
  addDlgDashed.onclick=()=>{ writeDlgFor=bl.id; render(); };
  addRow.append(addTextDashed, addDlgDashed);
  d.appendChild(addRow);
  return d;
}
/* 배경/캐릭터 열 하나 — "라벨: 이름1, 이름2" 형식, 항목마다 x로 개별 삭제 */
function metaCol(label, list, onRemoveAt){
  if(!list || !list.length) return null;
  const col=document.createElement("div"); col.className="scene-meta-col";
  const lbl=document.createElement("span"); lbl.className="scene-meta-label"; lbl.textContent=label+": ";
  col.appendChild(lbl);
  list.forEach((name,i)=>{
    if(i>0){ const comma=document.createElement("span"); comma.className="scene-meta-comma"; comma.textContent=", "; col.appendChild(comma); }
    const item=document.createElement("span"); item.className="scene-meta-item";
    const txt=document.createElement("span"); txt.textContent=name; item.appendChild(txt);
    const xBtn=document.createElement("button"); xBtn.type="button"; xBtn.className="chip-x"; xBtn.innerHTML=ICONS.close; xBtn.title="삭제";
    xBtn.onclick=e=>{ e.stopPropagation(); onRemoveAt(i); };
    item.appendChild(xBtn);
    col.appendChild(item);
  });
  return col;
}
/* [+캐릭터] 버튼 — 캐릭터 설정에 등록된 인물 드롭다운(+직접입력) */
function openCharacterPicker(btn, bl){
  const m=document.getElementById("ctxMenu"); if(!m) return;
  m.innerHTML="";
  const names=(P.characters||[]).map(c=>c.name).filter(Boolean);
  names.forEach(name=>{
    const b=document.createElement("button"); b.textContent=name;
    b.onclick=()=>{ hideCtxMenu(); bl.characters=bl.characters||[]; if(!bl.characters.includes(name)) bl.characters.push(name); save(); render(); };
    m.appendChild(b);
  });
  if(names.length){ const hr=document.createElement("hr"); m.appendChild(hr); }
  const custom=document.createElement("button"); custom.innerHTML=ICONS.edit+" 직접 입력";
  custom.onclick=()=>{ hideCtxMenu(); const nm=prompt("캐릭터 이름:"); if(nm&&nm.trim()){ bl.characters=bl.characters||[]; bl.characters.push(nm.trim()); save(); render(); } };
  m.appendChild(custom);
  m.hidden=false;
  const rect=btn.getBoundingClientRect();
  const vw=window.innerWidth, vh=window.innerHeight;
  m.style.left=Math.min(rect.left, vw-190)+"px";
  m.style.top=Math.min(rect.bottom+4, vh-((names.length+1)*36+20))+"px";
}

/* 하위 블록 하나 (본문 type=text / 대사 type=line) */
/* 장면 블록 우클릭 메뉴 */
function openBlockCtxMenu(x, y, bl){
  const m=document.getElementById("ctxMenu"); if(!m) return;
  ctxMenuTargetBlock=bl;
  const items=[];
  items.push(["수정",ICONS.edit,()=>{ writeFocusTitle=bl.id; render(); }]);
  items.push(["지문 추가",ICONS.plus,()=>{ bl.items=bl.items||[]; bl.items.push({id:uid(), type:"text", char:"", text:""}); save(); render(); }]);
  items.push(["대사 추가",ICONS.chat,()=>{ writeDlgFor=bl.id; render(); }]);
  if(writeSelectMode && writeSelectedIds.size>=2 && writeSelectedIds.has(bl.id)){
    items.push(["그룹으로 묶기",ICONS.group,groupSelectedBlocks]);
  }
  if(bl.groupId){
    items.push(["그룹 해제",ICONS.ungroup,()=>ungroupBlocks(bl.groupId)]);
  }
  items.push(["삭제",ICONS.trash,()=>{ if(!confirm("이 장면 블록을 삭제할까요?"))return; P.writeDoc.blocks=P.writeDoc.blocks.filter(b=>b.id!==bl.id); save(); render(); },"danger"]);
  m.innerHTML="";
  items.forEach(([label,icon,fn,cls])=>{
    const b=document.createElement("button"); if(cls) b.className=cls;
    b.innerHTML=icon+" "+label;
    b.onclick=()=>{ hideCtxMenu(); fn(); };
    m.appendChild(b);
  });
  m.hidden=false;
  const vw=window.innerWidth, vh=window.innerHeight;
  m.style.left=Math.min(x, vw-190)+"px";
  m.style.top=Math.min(y, vh-(items.length*36+20))+"px";
}
/* 플롯 단계(섹션) 빈 여백 우클릭 메뉴 — 아이디어 불러오기 / 블럭 생성 */
function openSectionCtxMenu(x, y, sec){
  const m=document.getElementById("ctxMenu"); if(!m) return;
  const items=[
    ["아이디어 불러오기",ICONS.load,()=>loadSectionIdeas(sec)],
    ["블럭 생성",ICONS.plus,()=>addSceneBlock(sec)]
  ];
  m.innerHTML="";
  items.forEach(([label,icon,fn])=>{
    const b=document.createElement("button");
    b.innerHTML=icon+" "+label;
    b.onclick=()=>{ hideCtxMenu(); fn(); };
    m.appendChild(b);
  });
  m.hidden=false;
  const vw=window.innerWidth, vh=window.innerHeight;
  m.style.left=Math.min(x, vw-190)+"px";
  m.style.top=Math.min(y, vh-(items.length*36+20))+"px";
}
/* 본문(지문) 블록 우클릭 메뉴 — 분기 만들기 / 분기 블럭 추가
   - 아직 분기가 없으면 [분기 만들기] (누르면 절반 크기 본문 블록 2개를 2열로 생성)
   - 이미 분기된 블록이면 [분기 블럭 추가]만 표시 (분기 나누기는 한 번만) */
function openTextBlockCtxMenu(x, y, bl, it){
  const m=document.getElementById("ctxMenu"); if(!m) return;
  ctxMenuTargetBlock=bl;
  const items=[];
  items.push(["수정",ICONS.edit,()=>{ writeFocusTitle=bl.id; render(); }]);
  items.push(["지문 추가",ICONS.plus,()=>{ bl.items=bl.items||[]; bl.items.push({id:uid(), type:"text", char:"", text:""}); save(); render(); }]);
  items.push(["대사 추가",ICONS.chat,()=>{ writeDlgFor=bl.id; render(); }]);
  const hasBranches=!!(it.branches && it.branches.length);
  if(!hasBranches){
    items.push(["분기 만들기",ICONS.plus,()=>{
      it.branches=[{id:uid(), text:""},{id:uid(), text:""}];
      save(); render();
    }]);
  }else{
    items.push(["분기 블럭 추가",ICONS.plus,()=>{
      /* 한 줄(2개)씩 생성 */
      it.branches.push({id:uid(), text:""},{id:uid(), text:""});
      save(); render();
    }]);
  }
  if(writeSelectMode && writeSelectedIds.size>=2 && writeSelectedIds.has(bl.id)){
    items.push(["그룹으로 묶기",ICONS.group,groupSelectedBlocks]);
  }
  if(bl.groupId){
    items.push(["그룹 해제",ICONS.ungroup,()=>ungroupBlocks(bl.groupId)]);
  }
  items.push(["삭제",ICONS.trash,()=>{ if(!confirm("이 장면 블록을 삭제할까요?"))return; P.writeDoc.blocks=P.writeDoc.blocks.filter(b=>b.id!==bl.id); save(); render(); },"danger"]);
  m.innerHTML="";
  items.forEach(([label,icon,fn,cls])=>{
    const b=document.createElement("button"); if(cls) b.className=cls;
    b.innerHTML=icon+" "+label;
    b.onclick=()=>{ hideCtxMenu(); fn(); };
    m.appendChild(b);
  });
  m.hidden=false;
  const vw=window.innerWidth, vh=window.innerHeight;
  m.style.left=Math.min(x, vw-190)+"px";
  m.style.top=Math.min(y, vh-(items.length*36+20))+"px";
}
/* 대사 블록 우클릭 메뉴 — 텍스트는 클릭으로 바로 편집하므로 "수정" 항목은 없음 */
function openLineBlockCtxMenu(x, y, bl){
  const m=document.getElementById("ctxMenu"); if(!m) return;
  ctxMenuTargetBlock=bl;
  const items=[];
  items.push(["지문 추가",ICONS.plus,()=>{ bl.items=bl.items||[]; bl.items.push({id:uid(), type:"text", char:"", text:""}); save(); render(); }]);
  items.push(["대사 추가",ICONS.chat,()=>{ writeDlgFor=bl.id; render(); }]);
  if(writeSelectMode && writeSelectedIds.size>=2 && writeSelectedIds.has(bl.id)){
    items.push(["그룹으로 묶기",ICONS.group,groupSelectedBlocks]);
  }
  if(bl.groupId){
    items.push(["그룹 해제",ICONS.ungroup,()=>ungroupBlocks(bl.groupId)]);
  }
  items.push(["삭제",ICONS.trash,()=>{ if(!confirm("이 장면 블록을 삭제할까요?"))return; P.writeDoc.blocks=P.writeDoc.blocks.filter(b=>b.id!==bl.id); save(); render(); },"danger"]);
  m.innerHTML="";
  items.forEach(([label,icon,fn,cls])=>{
    const b=document.createElement("button"); if(cls) b.className=cls;
    b.innerHTML=icon+" "+label;
    b.onclick=()=>{ hideCtxMenu(); fn(); };
    m.appendChild(b);
  });
  m.hidden=false;
  const vw=window.innerWidth, vh=window.innerHeight;
  m.style.left=Math.min(x, vw-190)+"px";
  m.style.top=Math.min(y, vh-(items.length*36+20))+"px";
}
function hideCtxMenu(){ const m=document.getElementById("ctxMenu"); if(m){ m.hidden=true; m.innerHTML=""; } ctxMenuTargetBlock=null; }
document.addEventListener("click", ()=>hideCtxMenu());
document.addEventListener("keydown", e=>{ if(e.key==="Escape") hideCtxMenu(); });

function subBlockEl(bl, it, liveRefresh, main){
  const d=document.createElement("div"); d.className="sub-block "+(it.type==="line"?"sub-line":"sub-text"); d.dataset.id=it.id; d.draggable=false;
  const handle=document.createElement("span"); handle.className="sub-handle"; handle.innerHTML=ICONS.grip; handle.title="드래그해서 이동(다른 블록으로도)";
  handle.addEventListener("mousedown", ()=>{ d.draggable=true; });
  handle.addEventListener("touchstart", ()=>{ d.draggable=true; }, {passive:true});
  d.addEventListener("dragstart", e=>{ if(!d.draggable) return; dndDropHandled=false; e.dataTransfer.effectAllowed="move"; setTimeout(()=>d.classList.add("dragging"),0); });
  d.addEventListener("dragend", ()=>{
    d.draggable=false; d.classList.remove("dragging");
    if(!dndDropHandled && main && main.isConnected) commitWriteItemOrder(main);
  });

  const del=document.createElement("button"); del.className="sub-del"; del.innerHTML=ICONS.close; del.title="삭제";
  del.onclick=()=>{ bl.items=(bl.items||[]).filter(x=>x.id!==it.id); save(); render(); };

  if(it.type==="line"){
    const who=document.createElement("span"); who.className="dlg-who"; who.textContent=it.char||"(미지정)";
    /* 대사 텍스트 — 클릭하면 바로 편집(플롯/제목과 동일한 방식) */
    const tx=document.createElement("span"); tx.className="dlg-text"; tx.contentEditable="false"; tx.spellcheck=false;
    tx.textContent=it.text;
    tx.oninput=()=>{ it.text=tx.textContent; save(); liveRefresh&&liveRefresh(); };
    tx.addEventListener("blur", ()=>{ tx.contentEditable="false"; });
    tx.addEventListener("click", ()=>{ if(tx.contentEditable!=="true"){ tx.contentEditable="true"; tx.focus(); selectAllEditable(tx); } });
    d.append(handle, who, tx, del);
    d.addEventListener("contextmenu", e=>{ e.preventDefault(); e.stopPropagation(); openLineBlockCtxMenu(e.clientX, e.clientY, bl); });
  }else{
    const mainRow=document.createElement("div"); mainRow.className="sub-main-row";
    const ta=document.createElement("textarea"); ta.className="sub-textarea"; ta.placeholder="본문을 써보세요"; ta.rows=1; ta.value=it.text||"";
    ta.oninput=()=>{ it.text=ta.value; save(); autoGrowTextarea(ta); liveRefresh&&liveRefresh(); };
    mainRow.append(handle, ta, del);
    d.appendChild(mainRow);
    /* 분기 본문 블록 — 2열로 나열, 폰트 1pt 작게, 핸들을 드래그해서 순서 이동 가능 */
    if(it.branches && it.branches.length){
      const brWrap=document.createElement("div"); brWrap.className="sub-branches";
      it.branches.forEach(br=>{
        const cell=document.createElement("div"); cell.className="sub-branch"; cell.dataset.id=br.id; cell.draggable=false;
        const bHandle=document.createElement("span"); bHandle.className="sub-handle branch-handle"; bHandle.innerHTML=ICONS.grip; bHandle.title="드래그해서 순서 이동";
        bHandle.addEventListener("mousedown", ()=>{ cell.draggable=true; });
        bHandle.addEventListener("touchstart", ()=>{ cell.draggable=true; }, {passive:true});
        cell.addEventListener("dragstart", e=>{ if(!cell.draggable) return; dndDropHandled=false; e.dataTransfer.effectAllowed="move"; setTimeout(()=>cell.classList.add("dragging"),0); });
        cell.addEventListener("dragend", ()=>{
          cell.draggable=false; cell.classList.remove("dragging");
          if(!dndDropHandled && brWrap.isConnected) commitBranchOrder(brWrap, it);
        });
        const bta=document.createElement("textarea"); bta.className="sub-textarea branch-textarea"; bta.placeholder="분기 내용을 써보세요"; bta.rows=1; bta.value=br.text||"";
        bta.oninput=()=>{ br.text=bta.value; save(); autoGrowTextarea(bta); liveRefresh&&liveRefresh(); };
        const bdel=document.createElement("button"); bdel.className="sub-del branch-del"; bdel.innerHTML=ICONS.close; bdel.title="분기 삭제";
        bdel.onclick=()=>{ it.branches=it.branches.filter(x=>x.id!==br.id); save(); render(); };
        cell.append(bHandle, bta, bdel);
        brWrap.appendChild(cell);
      });
      setupBranchDnD(brWrap, it);
      d.appendChild(brWrap);
    }
    d.addEventListener("contextmenu", e=>{ e.preventDefault(); e.stopPropagation(); openTextBlockCtxMenu(e.clientX, e.clientY, bl, it); });
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
    commitWriteBlockOrder(main);
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
function commitWriteBlockOrder(main){
  rebuildWriteFromDOM(main);
  dndDropHandled=true;
  save(); render();
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
    commitWriteItemOrder(main);
  });
}
function rebuildItemsFromDOM(main){
  const map={}; (P.writeDoc.blocks||[]).forEach(b=>(b.items||[]).forEach(it=>map[it.id]=it));
  main.querySelectorAll(".scene-items").forEach(cont=>{
    const b=(P.writeDoc.blocks||[]).find(x=>x.id===cont.dataset.block);
    if(b) b.items=[...cont.querySelectorAll(".sub-block")].map(el=>map[el.dataset.id]).filter(Boolean);
  });
}
function commitWriteItemOrder(main){
  rebuildItemsFromDOM(main);
  dndDropHandled=true;
  save(); render();
}

/* 분기 블록 드래그앤드롭 (2열 그리드 — 커서와 가장 가까운 칸을 기준으로 앞/뒤 삽입) */
function setupBranchDnD(container, it){
  container.addEventListener("dragover", e=>{
    const dragging=container.querySelector(".sub-branch.dragging");
    if(!dragging) return;
    e.preventDefault();
    const els=[...container.querySelectorAll(".sub-branch:not(.dragging)")];
    let closest=null, closestDist=Infinity, insertBefore=true;
    els.forEach(el=>{
      const box=el.getBoundingClientRect();
      const cx=box.left+box.width/2, cy=box.top+box.height/2;
      const dist=Math.hypot(e.clientX-cx, e.clientY-cy);
      if(dist<closestDist){
        closestDist=dist; closest=el;
        insertBefore=(e.clientY<cy) || (Math.abs(e.clientY-cy)<box.height/2 && e.clientX<cx);
      }
    });
    if(!closest) container.appendChild(dragging);
    else if(insertBefore) container.insertBefore(dragging, closest);
    else container.insertBefore(dragging, closest.nextSibling);
  });
  container.addEventListener("drop", e=>{
    if(!container.querySelector(".sub-branch.dragging")) return;
    e.preventDefault();
    commitBranchOrder(container, it);
  });
}
function commitBranchOrder(container, it){
  const map={}; (it.branches||[]).forEach(b=>map[b.id]=b);
  it.branches=[...container.querySelectorAll(".sub-branch")].map(el=>map[el.dataset.id]).filter(Boolean);
  dndDropHandled=true;
  save(); render();
}

/* 대사 추가 팝업 */
function dialogueModal(bl){
  const overlay=document.createElement("div"); overlay.className="plot-modal-overlay";
  overlay.onclick=e=>{ if(e.target===overlay){ writeDlgFor=null; render(); } };
  const box=document.createElement("div"); box.className="plot-modal dlg-modal";
  const top=document.createElement("div"); top.className="plot-picker-top";
  const ttl=document.createElement("span"); ttl.className="plot-picker-title"; ttl.textContent="대사 추가";
  const closeBtn=iconBtn(ICONS.close,"닫기",()=>{ writeDlgFor=null; render(); });
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

/* 내보내기: 대본 출력(.docx) / 대사만 출력(.docx) / 콘티 출력(.pdf) */
function esc(s){return(s||"").replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m])).replace(/\n/g,"<br>");}

/* 플롯 섹션 순서대로 이어붙인 전체 글쓰기 블록 목록(글쓰기 탭에서 보이는 순서와 동일) */
function allWriteBlocksOrdered(){
  const list=[];
  (P.plotDoc.sections||[]).forEach(sec=>{ blocksOfSection(sec.id).forEach(bl=>list.push(bl)); });
  return list;
}
/* 블록 내용 HTML — 지문/대사 블럭을 구분하지 않고 줄바꿈으로만 나열, 대사는 "캐릭터: 대사" 형식 */
function blockBodyHtml(bl){
  const lines=(bl.items||[]).filter(it=>(it.text||"").trim().length)
    .map(it=> it.type==="line" ? (esc(it.char||"(미지정)")+": "+esc(it.text.trim())) : esc(it.text.trim()));
  return lines.join("<br>");
}

/* 블록 내용 → Word 문단 배열(줄바꿈=문단 구분, 대사는 "캐릭터: 대사" 형식, 지문/대사 구분 없이 나열) */
function blockBodyParagraphs(bl){
  const {Paragraph,TextRun}=docx;
  const items=(bl.items||[]).filter(it=>(it.text||"").trim().length);
  if(!items.length) return [new Paragraph("")];
  return items.map(it=> it.type==="line"
    ? new Paragraph({children:[new TextRun({text:(it.char||"(미지정)")+": ", bold:true}), new TextRun({text:it.text.trim(), bold:true})]})
    : new Paragraph({children:[new TextRun(it.text.trim())]})
  );
}

/* 1) 대본 출력 — Word(.docx), 표(번호 | 내용) */
async function exportScript(){
  const blocks=allWriteBlocksOrdered();
  if(!blocks.length){ alert("글쓰기 탭에 작성된 블록이 없습니다."); return; }
  if(typeof docx==="undefined"){ alert("Word 변환 기능을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요."); return; }
  const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,VerticalAlign,AlignmentType,HeadingLevel}=docx;
  /* 표 전체 너비를 dxa(트윕) 고정값으로 지정하고 columnWidths를 함께 명시해야
     tblGrid가 실제 칸 너비와 일치한다. columnWidths를 생략하면 docx 라이브러리가
     기본값(모든 칸 100dxa)으로 tblGrid를 채워버려 tblGrid와 각 셀의 실제 너비(tcW)가
     어긋난 "구조가 깨진" 표가 되고, MS워드는 이를 눈감아주지만 한컴 오피스 등 더 엄격한
     OOXML 파서는 표/문서를 아예 열지 못하거나 빈 것으로 처리한다. 표 너비도 퍼센트(pct)
     대신 dxa 정수로 고정해 파서마다 다르게 해석될 여지를 없앤다. */
  const NUM_COL_W=700, CONTENT_COL_W=8300;
  const rows=blocks.map((bl,i)=> new TableRow({children:[
    new TableCell({
      width:{size:NUM_COL_W,type:WidthType.DXA}, verticalAlign:VerticalAlign.TOP,
      children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun(String(i+1))]})]
    }),
    new TableCell({ width:{size:CONTENT_COL_W,type:WidthType.DXA}, children:blockBodyParagraphs(bl) })
  ]}));
  const doc=new Document({sections:[{children:[
    new Paragraph({text:(P.name||"")+" — 대본", heading:HeadingLevel.HEADING_2}),
    new Table({width:{size:NUM_COL_W+CONTENT_COL_W,type:WidthType.DXA}, columnWidths:[NUM_COL_W,CONTENT_COL_W], rows})
  ]}]});
  const blob=await Packer.toBlob(doc);
  triggerDownload(blob, (P.name||"story")+"_대본.docx");
}

/* 2) 대사만 출력 — Word(.docx), 표 없이 줄바꿈으로만 블록 구분. 같은 블록의 대사는 이어서 출력, 캐릭터명은 제외 */
async function exportDialogueOnly(){
  const blocks=allWriteBlocksOrdered();
  if(typeof docx==="undefined"){ alert("Word 변환 기능을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요."); return; }
  const {Document,Packer,Paragraph,TextRun}=docx;
  const paras=[];
  blocks.forEach(bl=>{
    const lines=(bl.items||[]).filter(it=>it.type==="line" && (it.text||"").trim().length).map(it=>it.text.trim());
    if(lines.length) paras.push(new Paragraph({children:[new TextRun({text:lines.join(" "), bold:true})]}));
  });
  if(!paras.length){ alert("작성된 대사가 없습니다."); return; }
  const doc=new Document({sections:[{children:paras}]});
  const blob=await Packer.toBlob(doc);
  triggerDownload(blob, (P.name||"story")+"_대사.docx");
}

/* 0) 기획서 출력 — Word(.docx), 첨부 양식(표)과 동일한 구성으로 출력 */
async function exportPlan(){
  if(typeof docx==="undefined"){ alert("Word 변환 기능을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요."); return; }
  const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,VerticalAlign,AlignmentType,ShadingType,PageBreak}=docx;
  const pd=P.planDoc||blankPlanDoc();
  const shade={fill:"E8D9C5", type:ShadingType.CLEAR, color:"auto"};
  const LW=1600, VW=3350, LW2=1600, VW2=7500;
  function labelCell(text,width){
    return new TableCell({width:{size:width,type:WidthType.DXA}, shading:shade, verticalAlign:VerticalAlign.CENTER,
      children:[new Paragraph({alignment:AlignmentType.CENTER, children:[new TextRun({text, bold:true})]})]});
  }
  function valueCell(text,width){
    const lines=(text||"").split("\n");
    return new TableCell({width:{size:width,type:WidthType.DXA}, verticalAlign:VerticalAlign.TOP,
      children: lines.length ? lines.map(l=>new Paragraph({children:[new TextRun(l)]})) : [new Paragraph("")]});
  }
  const table1=new Table({width:{size:LW+VW+LW+VW,type:WidthType.DXA}, columnWidths:[LW,VW,LW,VW],
    rows:[new TableRow({children:[labelCell("일 시",LW), valueCell(pd.date,VW), labelCell("작성자",LW), valueCell(pd.author,VW)]})]});
  const table2=new Table({width:{size:LW2+VW2,type:WidthType.DXA}, columnWidths:[LW2,VW2],
    rows:[
      ["제 목",pd.title],["장 르",pd.genre],["로그라인",pd.logline],
    ].map(([label,val])=>new TableRow({children:[labelCell(label,LW2), valueCell(val,VW2)]}))});
  const table3=new Table({width:{size:LW2+VW2,type:WidthType.DXA}, columnWidths:[LW2,VW2],
    rows:[
      ["주요 독자",pd.mainReaders],["웹툰 분량",pd.length],["중심 소재",pd.material],
      ["상 황",pd.situation],["등장인물",pd.characters],["사 건",pd.incident],
      ["결 말",pd.ending],["기획의도",pd.intent],
    ].map(([label,val])=>new TableRow({children:[labelCell(label,LW2), valueCell(val,VW2)]}))});
  const table4=new Table({width:{size:LW2+VW2,type:WidthType.DXA}, columnWidths:[LW2,VW2],
    rows:[new TableRow({children:[labelCell("시놉시스",LW2), valueCell(pd.synopsis,VW2)]})]});
  const doc=new Document({sections:[{children:[
    table1, new Paragraph(""), table2, new Paragraph(""), table3,
    new Paragraph({children:[new PageBreak()]}), table4,
  ]}]});
  const blob=await Packer.toBlob(doc);
  triggerDownload(blob, (P.name||"story")+"_기획서.docx");
}

function triggerDownload(blob, filename){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download=filename; a.click();
}

/* 3) 콘티 출력 — PDF, 표(왼쪽: 글 블록 내용 / 오른쪽: 콘티 이미지). 미리보기를 만든 뒤 인쇄(대상: PDF로 저장) */
function exportStoryboardPdf(){
  const blocks=allWriteBlocksOrdered();
  if(!blocks.length){ alert("글쓰기 탭에 작성된 블록이 없습니다."); return; }
  const pv=document.getElementById("preview"); if(!pv) return;
  const rows=blocks.map(bl=>{
    const title=bl.title?("<b>"+esc(bl.title)+"</b><br>"):"";
    const body=blockBodyHtml(bl);
    const left=title+(body||'<span class="muted">(내용 없음)</span>');
    let right='<span class="muted">(콘티 없음)</span>';
    if(bl.storyboard && bl.storyboard.key){
      right=`<img src="/api/storyboard-image?key=${encodeURIComponent(bl.storyboard.key)}" style="max-width:100%;max-height:260px">`;
    }
    return `<tr><td style="width:50%;vertical-align:top;padding:8px">${left}</td><td style="width:50%;vertical-align:top;padding:8px;text-align:center">${right}</td></tr>`;
  }).join("");
  pv.innerHTML=`<h2 style="border-bottom:2px solid var(--accent);padding-bottom:8px">${esc(P.name)} — 콘티</h2>
    <table border="1" style="border-collapse:collapse;width:100%">${rows}</table>`;
  const imgs=Array.from(pv.querySelectorAll("img"));
  if(!imgs.length){ window.print(); return; }
  let remaining=imgs.length, done=false;
  const finish=()=>{ if(done) return; done=true; window.print(); };
  imgs.forEach(img=>{
    if(img.complete){ remaining--; if(remaining<=0) finish(); return; }
    img.onload=img.onerror=()=>{ remaining--; if(remaining<=0) finish(); };
  });
  setTimeout(finish, 4000);
}

function exportStory(){
  const blob=new Blob([JSON.stringify(P,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download=(P.name||"story")+".story"; a.click();
}
function importStory(e){
  const f=e.target.files[0]; if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    try{
      const obj=JSON.parse(rd.result);
      if(!obj.plot||!obj.characters)throw 0;
      obj.id=uid(); obj.name=(obj.name||"가져온 작품")+" (복원)";
      DB.projects.push(obj); DB.openIds.push(obj.id); DB.current=obj.id; P=currentProject();
      resetUndoHistory(); save(); refreshProjSelect(); render();
      alert("불러오기 완료!");
    }catch(_){ alert("올바른 작품 파일(.story)이 아닙니다."); }
  };
  rd.readAsText(f);
}

/* ===== 🖼 콘티제작 (글쓰기 탭의 장면 블록과 행 단위로 연동) ===== */
/* 그리기 툴 펜 굵기 — 브라우저(개인)별로 마지막에 고른 값을 기억해서 다음에 그릴 때도 그대로 유지 */
const DRAW_WIDTH_KEY = "storyhelper_drawWidth";
function loadDrawWidth(){ const n=Number(localStorage.getItem(DRAW_WIDTH_KEY)); return (n>=1 && n<=24) ? n : 4; }
function saveDrawWidth(n){ try{ localStorage.setItem(DRAW_WIDTH_KEY, String(n)); }catch(e){} }

const SB_SIZES = {
  large: {w:350, h:500, label:"큰 칸"},
  medium:{w:350, h:350, label:"중간 칸"},
  small: {w:350, h:250, label:"작은 칸"}
};

function rStoryboard(){
  if(!P.writeDoc) P.writeDoc={blocks:[], groups:[]};
  const pd=P.plotDoc;
  const head=document.createElement("div"); head.className="card";
  head.innerHTML=`<h2>${ICONS.image} 콘티제작</h2>`
    +'<p class="hint">글쓰기 탭에서 만든 장면 블록과 같은 행에 콘티를 배치합니다. 왼쪽은 글, 오른쪽은 콘티예요. 순서를 옮기면 글과 콘티가 함께 움직입니다.</p>';
  app.appendChild(head);

  if(!pd || !pd.structure || !pd.sections.length || !(P.writeDoc.blocks||[]).length){
    const c2=document.createElement("div"); c2.className="card";
    c2.innerHTML='<p class="hint">먼저 <b>글쓰기</b> 탭에서 장면 블록을 만들어 주세요.</p>';
    app.appendChild(c2);
    return;
  }
  if(typeof getToken!=="function" || !getToken()){
    const c3=document.createElement("div"); c3.className="card";
    c3.innerHTML='<p class="hint">콘티 이미지를 서버에 저장하려면 로그인이 필요합니다.</p>';
    app.appendChild(c3);
    return;
  }

  const layout=document.createElement("div"); layout.className="storyboard-layout";
  app.appendChild(layout);

  let rowNo=0;
  pd.sections.forEach(sec=>{
    const secBlocks=blocksOfSection(sec.id);
    if(!secBlocks.length) return;
    const section=document.createElement("div"); section.className="sb-section";
    const div=document.createElement("div"); div.className="sb-divider";
    div.innerHTML=`<span class="wd-name">${esc(sec.name)}</span>`;
    section.appendChild(div);
    const list=document.createElement("div"); list.className="sb-rowlist"; list.dataset.sec=sec.id;
    secBlocks.forEach(bl=>{ list.appendChild(storyboardRow(bl, ++rowNo)); });
    section.appendChild(list);
    setupStoryboardRowDnD(list, layout);
    layout.appendChild(section);
  });
}

function storyboardRow(bl, no){
  const row=document.createElement("div"); row.className="sb-row"; row.draggable=true; row.dataset.id=bl.id;
  row.addEventListener("dragstart", ()=>{ row.classList.add("dragging"); dndDropHandled=false; });
  row.addEventListener("dragend", ()=>{ row.classList.remove("dragging"); if(!dndDropHandled) commitStoryboardOrder(row.closest(".storyboard-layout")); });

  const handle=document.createElement("span"); handle.className="sb-row-handle"; handle.innerHTML=ICONS.grip; handle.title="드래그해서 순서 이동 (글과 콘티가 함께 이동합니다)";
  row.appendChild(handle);
  const num=document.createElement("span"); num.className="sb-row-num"; num.textContent=no;
  row.appendChild(num);

  const textCell=document.createElement("div"); textCell.className="sb-text-cell";
  const title=document.createElement("div"); title.className="sb-text-title"; title.textContent=bl.title||"(제목 없음)";
  textCell.appendChild(title);
  const body=document.createElement("div"); body.className="sb-text-body";
  const texts=(bl.items||[]).map(it=>(it.text||"").trim()).filter(Boolean);
  body.textContent=texts.length?texts.join(" / "):"(내용 없음)";
  textCell.appendChild(body);
  row.appendChild(textCell);

  const sbCell=document.createElement("div"); sbCell.className="sb-storyboard-cell";
  sbCell.appendChild(storyboardSlot(bl));
  row.appendChild(sbCell);

  return row;
}

function storyboardSlot(bl){
  const wrap=document.createElement("div"); wrap.className="sb-slot";
  if(bl.storyboard && bl.storyboard.key){
    const sz=SB_SIZES[bl.storyboard.size]||SB_SIZES.medium;
    const tw=document.createElement("div"); tw.className="sb-thumb-wrap";
    const img=document.createElement("img");
    img.src="/api/storyboard-image?key="+encodeURIComponent(bl.storyboard.key);
    img.style.width=sz.w+"px"; img.style.height=sz.h+"px";
    img.alt="콘티";
    tw.appendChild(img);
    const actions=document.createElement("div"); actions.className="sb-thumb-actions";
    actions.appendChild(iconBtn(ICONS.pencil, "다시 그리기", ()=>openSizePicker(bl, size=>openDrawModal(bl, size))));
    actions.appendChild(iconBtn(ICONS.upload, "이미지로 교체", ()=>triggerStoryboardUpload(bl)));
    actions.appendChild(iconBtn(ICONS.trash, "삭제", ()=>deleteStoryboardSlot(bl)));
    tw.appendChild(actions);
    wrap.appendChild(tw);
  }else{
    const ph=document.createElement("div"); ph.className="sb-placeholder";
    ph.innerHTML='<span class="hint">아직 콘티가 없습니다</span>';
    const btnRow=document.createElement("div"); btnRow.className="sb-placeholder-actions";
    const upBtn=document.createElement("button"); upBtn.type="button"; upBtn.className="btn ghost sm icon-btn";
    upBtn.innerHTML=ICONS.upload+" 이미지 업로드";
    upBtn.onclick=()=>triggerStoryboardUpload(bl);
    const drawBtn=document.createElement("button"); drawBtn.type="button"; drawBtn.className="btn ghost sm icon-btn";
    drawBtn.innerHTML=ICONS.pencil+" 직접 그리기";
    drawBtn.onclick=()=>openSizePicker(bl, size=>openDrawModal(bl, size));
    btnRow.append(upBtn, drawBtn);
    ph.appendChild(btnRow);
    wrap.appendChild(ph);
  }
  return wrap;
}

/* 콘티 블록 드래그앤드롭 — 글쓰기 탭과 동일한 P.writeDoc.blocks 배열을 그대로 재정렬하므로
   글 블록·콘티 블록이 항상 하나의 그룹으로 함께 움직인다 */
function setupStoryboardRowDnD(list, layout){
  list.addEventListener("dragover", e=>{
    const dragging=layout.querySelector(".sb-row.dragging");
    if(!dragging) return;
    e.preventDefault();
    const after=getDragAfterEl(list, e.clientY, ".sb-row:not(.dragging)");
    if(after==null) list.appendChild(dragging);
    else list.insertBefore(dragging, after);
  });
  list.addEventListener("drop", e=>{
    if(!layout.querySelector(".sb-row.dragging")) return;
    e.preventDefault();
    commitStoryboardOrder(layout);
  });
}
function commitStoryboardOrder(layout){
  const map={}; (P.writeDoc.blocks||[]).forEach(b=>map[b.id]=b);
  const arr=[];
  layout.querySelectorAll(".sb-rowlist").forEach(list=>{
    const secId=list.dataset.sec;
    list.querySelectorAll(".sb-row").forEach(el=>{ const b=map[el.dataset.id]; if(b){ b.sectionId=secId; arr.push(b); } });
  });
  (P.writeDoc.blocks||[]).forEach(b=>{ if(arr.indexOf(b)<0) arr.push(b); });
  P.writeDoc.blocks=arr;
  dndDropHandled=true;
  save(); render();
}

/* 이미지 업로드 — 원본 크기와 무관하게 항상 압축을 거쳐 300KB 이하로 맞춘 뒤 서버(R2)에 저장 */
function triggerStoryboardUpload(bl){
  const input=document.createElement("input");
  input.type="file"; input.accept="image/*"; input.style.display="none";
  document.body.appendChild(input);
  input.onchange=()=>{
    const file=input.files && input.files[0];
    document.body.removeChild(input);
    if(!file) return;
    if(!file.type || !file.type.startsWith("image/")){ alert("이미지 파일만 업로드할 수 있습니다."); return; }
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        compressImageToLimit(img, 300*1024, blob=>{
          if(!blob){ alert("이미지 처리에 실패했습니다."); return; }
          saveStoryboardBlob(bl, blob, (bl.storyboard && bl.storyboard.size) || "medium");
        });
      };
      img.onerror=()=>alert("이미지를 불러오지 못했습니다.");
      img.src=reader.result;
    };
    reader.onerror=()=>alert("파일을 읽지 못했습니다.");
    reader.readAsDataURL(file);
  };
  input.click();
}

/* 업로드 이미지 압축: 화질을 먼저 낮추고, 그래도 크면 크기까지 단계적으로 줄여 300KB 이하로 맞춘다 */
function compressImageToLimit(img, maxBytes, cb){
  const MAX_DIM=1400;
  const scaleCap=Math.min(1, MAX_DIM/Math.max(img.width, img.height, 1));
  let w=Math.max(1, Math.round(img.width*scaleCap)), h=Math.max(1, Math.round(img.height*scaleCap));
  const canvas=document.createElement("canvas");
  const ctx=canvas.getContext("2d");
  function render(cw,ch){
    canvas.width=cw; canvas.height=ch;
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,cw,ch);
    ctx.drawImage(img,0,0,cw,ch);
  }
  render(w,h);
  let quality=0.9, scale=1, attempts=0;
  function attempt(){
    attempts++;
    canvas.toBlob(blob=>{
      if(!blob){ cb(null); return; }
      if(blob.size<=maxBytes || attempts>18){ cb(blob); return; }
      if(quality>0.4){ quality-=0.1; }
      else { scale*=0.85; render(Math.max(1,Math.round(w*scale)), Math.max(1,Math.round(h*scale))); quality=0.7; }
      attempt();
    }, "image/jpeg", quality);
  }
  attempt();
}
/* 캔버스(직접 그리기) 압축 — 화질만 단계적으로 낮춰 300KB 이하로 맞춘다 */
function compressCanvasToLimit(canvas, maxBytes, cb){
  let quality=0.92, attempts=0;
  function attempt(){
    attempts++;
    canvas.toBlob(blob=>{
      if(!blob){ cb(null); return; }
      if(blob.size<=maxBytes || quality<=0.3 || attempts>12){ cb(blob); return; }
      quality-=0.1; attempt();
    }, "image/jpeg", quality);
  }
  attempt();
}

async function uploadStoryboardBlob(blob){
  const token=typeof getToken==="function" ? getToken() : null;
  if(!token) return null;
  try{
    const r=await fetch("/api/storyboard-image", {method:"POST", headers:{"Authorization":"Bearer "+token, "Content-Type":"image/jpeg"}, body:blob});
    if(!r.ok) return null;
    const j=await r.json().catch(()=>null);
    return (j && j.key) || null;
  }catch(e){ return null; }
}
async function deleteStoryboardImage(key){
  const token=typeof getToken==="function" ? getToken() : null;
  if(!token || !key) return;
  try{ await fetch("/api/storyboard-image?key="+encodeURIComponent(key), {method:"DELETE", headers:{"Authorization":"Bearer "+token}}); }catch(e){}
}
async function saveStoryboardBlob(bl, blob, size){
  const oldKey=bl.storyboard && bl.storyboard.key;
  const key=await uploadStoryboardBlob(blob);
  if(!key){ alert("업로드에 실패했습니다. 잠시 후 다시 시도해 주세요."); return; }
  bl.storyboard={key, size:size||"medium"};
  save(); render();
  if(oldKey && oldKey!==key) deleteStoryboardImage(oldKey);
}
function deleteStoryboardSlot(bl){
  if(!confirm("이 콘티를 삭제할까요?")) return;
  const key=bl.storyboard && bl.storyboard.key;
  bl.storyboard=null; save(); render();
  if(key) deleteStoryboardImage(key);
}

/* 캔버스 크기 선택 팝업 (이 팝업은 바깥을 눌러도/×를 눌러도 닫힘 — 그리기 툴 팝업과는 다름) */
function openSizePicker(bl, onPick){
  const overlay=document.createElement("div"); overlay.className="plot-modal-overlay";
  overlay.onclick=e=>{ if(e.target===overlay) document.body.removeChild(overlay); };
  const box=document.createElement("div"); box.className="plot-modal";
  const top=document.createElement("div"); top.className="plot-picker-top";
  const ttl=document.createElement("span"); ttl.className="plot-picker-title"; ttl.textContent="캔버스 크기 선택";
  top.append(ttl, iconBtn(ICONS.close, "닫기", ()=>document.body.removeChild(overlay)));
  box.appendChild(top);
  const list=document.createElement("div"); list.className="sb-size-list";
  Object.keys(SB_SIZES).forEach(k=>{
    const s=SB_SIZES[k];
    const b=document.createElement("button"); b.type="button"; b.className="btn ghost sb-size-btn";
    b.innerHTML=`<b>${s.label}</b><span class="hint">세로 ${s.h}px · 가로 ${s.w}px</span>`;
    b.onclick=()=>{ document.body.removeChild(overlay); onPick(k); };
    list.appendChild(b);
  });
  box.appendChild(list);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

/* 그리기 툴 팝업 — 요구사항: 바깥을 눌러도 절대 닫히지 않으며, "저장 후 종료"를 눌렀을 때만 닫힌다.
   그래서 오버레이 클릭 닫기 핸들러와 × 닫기 버튼을 의도적으로 넣지 않았다. */
function openDrawModal(bl, sizeKey){
  const sz=SB_SIZES[sizeKey] || SB_SIZES.medium;
  const overlay=document.createElement("div"); overlay.className="draw-modal-overlay";
  const box=document.createElement("div"); box.className="draw-modal";

  const top=document.createElement("div"); top.className="plot-picker-top";
  const ttl=document.createElement("span"); ttl.className="plot-picker-title"; ttl.textContent="콘티 그리기 — "+sz.label;
  top.appendChild(ttl);
  box.appendChild(top);

  const toolbar=document.createElement("div"); toolbar.className="draw-toolbar";
  const COLORS=["#2c2a26","#c4654a","#4a7fc4","#5a8f6b","#c4a34a","#8a4ac4","#c44a91"];
  let curColor=COLORS[0], curWidth=loadDrawWidth(), erasing=false;
  const swatchWrap=document.createElement("div"); swatchWrap.className="draw-swatches";
  const swatchEls=[];
  COLORS.forEach((c,i)=>{
    const sw=document.createElement("button"); sw.type="button"; sw.className="draw-color-swatch"+(i===0?" active":"");
    sw.style.background=c; sw.title=c;
    sw.onclick=()=>{ curColor=c; erasing=false; swatchEls.forEach(x=>x.classList.remove("active")); sw.classList.add("active"); eraserBtn.classList.remove("on"); };
    swatchWrap.appendChild(sw); swatchEls.push(sw);
  });
  const customColor=document.createElement("input"); customColor.type="color"; customColor.className="draw-color-custom"; customColor.title="다른 색상";
  customColor.value="#2c2a26";
  customColor.oninput=()=>{ curColor=customColor.value; erasing=false; swatchEls.forEach(x=>x.classList.remove("active")); eraserBtn.classList.remove("on"); };
  swatchWrap.appendChild(customColor);
  toolbar.appendChild(swatchWrap);

  const widthWrap=document.createElement("label"); widthWrap.className="draw-width-wrap"; widthWrap.textContent="굵기";
  const widthInput=document.createElement("input"); widthInput.type="range"; widthInput.min="1"; widthInput.max="24"; widthInput.value=String(curWidth);
  widthInput.oninput=()=>{ curWidth=Number(widthInput.value); saveDrawWidth(curWidth); };
  widthWrap.appendChild(widthInput);
  toolbar.appendChild(widthWrap);

  const eraserBtn=document.createElement("button"); eraserBtn.type="button"; eraserBtn.className="btn ghost sm icon-btn";
  eraserBtn.innerHTML=ICONS.eraser+" 지우개";
  eraserBtn.onclick=()=>{ erasing=!erasing; eraserBtn.classList.toggle("on", erasing); };
  toolbar.appendChild(eraserBtn);

  const clearBtn=document.createElement("button"); clearBtn.type="button"; clearBtn.className="btn ghost sm icon-btn";
  clearBtn.innerHTML=ICONS.trash+" 전체 지우기";
  toolbar.appendChild(clearBtn);
  box.appendChild(toolbar);

  const canvasWrap=document.createElement("div"); canvasWrap.className="draw-canvas-wrap";
  const canvas=document.createElement("canvas"); canvas.className="draw-canvas";
  canvas.width=sz.w; canvas.height=sz.h;
  canvas.style.width=sz.w+"px"; canvas.style.height=sz.h+"px";
  const ctx=canvas.getContext("2d");
  function resetCanvas(){ ctx.fillStyle="#fff"; ctx.fillRect(0,0,canvas.width,canvas.height); }
  resetCanvas();
  clearBtn.onclick=()=>{ if(confirm("캔버스를 모두 지울까요?")) resetCanvas(); };
  /* 기존 콘티가 있으면 이어서 수정할 수 있도록 배경으로 불러온다 (실패해도 빈 캔버스로 계속 진행) */
  if(bl.storyboard && bl.storyboard.key){
    const preload=new Image();
    preload.onload=()=>{ ctx.drawImage(preload,0,0,canvas.width,canvas.height); };
    preload.src="/api/storyboard-image?key="+encodeURIComponent(bl.storyboard.key);
  }
  canvasWrap.appendChild(canvas);
  box.appendChild(canvasWrap);

  let drawing=false, lastX=0, lastY=0;
  function pos(e){
    const r=canvas.getBoundingClientRect();
    return {x:(e.clientX-r.left)*(canvas.width/r.width), y:(e.clientY-r.top)*(canvas.height/r.height)};
  }
  canvas.addEventListener("pointerdown", e=>{
    drawing=true; canvas.setPointerCapture(e.pointerId);
    const p=pos(e); lastX=p.x; lastY=p.y;
    ctx.beginPath(); ctx.arc(p.x,p.y,curWidth/2,0,Math.PI*2);
    ctx.fillStyle=erasing?"#fff":curColor; ctx.fill();
  });
  canvas.addEventListener("pointermove", e=>{
    if(!drawing) return;
    const p=pos(e);
    ctx.strokeStyle=erasing?"#fff":curColor; ctx.lineWidth=curWidth; ctx.lineCap="round"; ctx.lineJoin="round";
    ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(p.x,p.y); ctx.stroke();
    lastX=p.x; lastY=p.y;
  });
  function endStroke(){ drawing=false; }
  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointerleave", endStroke);
  canvas.addEventListener("pointercancel", endStroke);

  const actions=document.createElement("div"); actions.className="dlg-modal-actions";
  const saveBtn=document.createElement("button"); saveBtn.type="button"; saveBtn.className="btn";
  saveBtn.textContent="저장 후 종료";
  saveBtn.onclick=()=>{
    saveBtn.disabled=true; saveBtn.textContent="저장 중…";
    compressCanvasToLimit(canvas, 300*1024, blob=>{
      if(!blob){ alert("저장에 실패했습니다. 다시 시도해 주세요."); saveBtn.disabled=false; saveBtn.textContent="저장 후 종료"; return; }
      saveStoryboardBlob(bl, blob, sizeKey);
      document.body.removeChild(overlay);
    });
  };
  actions.appendChild(saveBtn);
  box.appendChild(actions);

  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

/* ===== 🛠 관리자 — 회원 관리 · 서버 초기화 =====
   /api/admin (GET: 회원 명단, POST {mode:"data"|"all"}: 초기화) 를 사용한다.
   접근 자체는 사이드바에서 isAdmin()으로 이미 가려져 있지만, 서버(functions/api/admin.js)도
   ADMIN_USERNAME으로 한 번 더 확인하므로 다른 계정이 URL을 직접 두드려도 안전하다. */
let adminUsersCache=null;
async function loadAdminUsers(force){
  if(!force && adminUsersCache) return adminUsersCache;
  const res=await apiFetch("admin");
  adminUsersCache=(res.ok && res.body && Array.isArray(res.body.users)) ? res.body.users : [];
  return adminUsersCache;
}
function fmtDate(sec){
  if(!sec) return "-";
  const d=new Date(sec*1000);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
}
function rAdmin(){
  const c=document.createElement("div");
  c.innerHTML=`<div class="card"><h2>${ICONS.user} 회원 관리</h2>
    <p class="hint">가입한 회원 명단입니다. 교수 계정에는 학생이 그룹 가입 시 입력할 6자리 코드가 함께 표시됩니다.</p>
    <div id="adminUsersWrap"><p class="hint">불러오는 중…</p></div>
  </div>
  <div class="card"><h2>${ICONS.trash} 서버 초기화</h2>
    <p class="hint">아래 버튼은 되돌릴 수 없습니다. 눌러도 바로 실행되지 않고, 두 번의 확인을 거쳐야 실행됩니다.</p>
    <div class="admin-reset-row">
      <div class="admin-reset-box">
        <b>데이터 초기화</b>
        <p class="plan-guide">모든 회원의 작품(아이디어·기획서·플롯·글쓰기 등) 데이터만 삭제합니다. 회원 계정(아이디/비밀번호)은 그대로 유지됩니다.</p>
        <button class="btn danger" id="adminResetDataBtn">데이터 초기화</button>
      </div>
      <div class="admin-reset-box">
        <b>계정 + 데이터 초기화</b>
        <p class="plan-guide">관리자(byeorie) 계정을 제외한 모든 회원 계정과 데이터를 전부 삭제합니다. 새 학기를 시작할 때 사용하세요.</p>
        <button class="btn danger" id="adminResetAllBtn">계정 + 데이터 초기화</button>
      </div>
    </div>
  </div>`;
  app.appendChild(c);
  renderAdminUsers();
  c.querySelector("#adminResetDataBtn").onclick=()=>doAdminReset("data");
  c.querySelector("#adminResetAllBtn").onclick=()=>doAdminReset("all");
}
async function renderAdminUsers(){
  const wrap=document.getElementById("adminUsersWrap"); if(!wrap) return;
  const users=await loadAdminUsers();
  if(!wrap.isConnected) return; /* 렌더링 도중 탭을 벗어난 경우 무시 */
  if(!users.length){ wrap.innerHTML=`<p class="hint">회원 명단을 불러오지 못했습니다.</p>`; return; }
  const profCount=users.filter(u=>u.role==="professor").length;
  const rows=users.map(u=>`<tr>
    <td>${esc(u.school)}</td><td>${esc(u.name)}</td><td>${esc(u.username)}</td>
    <td><select class="admin-role-select" data-uid="${u.id}" ${u.username===ADMIN_USERNAME?"disabled":""}>
      <option value="student" ${u.role==="professor"?"":"selected"}>학생</option>
      <option value="professor" ${u.role==="professor"?"selected":""}>교수</option>
    </select></td>
    <td>${u.role==="professor"?esc(u.prof_code||"-"):"-"}</td>
    <td>${esc(u.email)}</td><td>${fmtDate(u.created_at)}</td>
  </tr>`).join("");
  wrap.innerHTML=`<table class="admin-table"><thead><tr>
    <th>학교</th><th>이름</th><th>아이디</th><th>등급</th><th>교수 코드</th><th>이메일</th><th>가입일</th>
  </tr></thead><tbody>${rows}</tbody></table>
  <p class="hint">총 ${users.length}명 (교수 ${profCount}명 · 학생 ${users.length-profCount}명) · 등급을 클릭해 바꿀 수 있습니다.</p>`;
  wrap.querySelectorAll(".admin-role-select").forEach(sel=>{
    sel.onchange=()=>doAdminSetRole(sel);
  });
}
async function doAdminSetRole(selectEl){
  const uid=selectEl.dataset.uid, role=selectEl.value, prevRole=role==="professor"?"student":"professor";
  const label=role==="professor"?"교수":"학생";
  if(!confirm(`이 회원의 등급을 '${label}'(으)로 변경할까요?`)){ selectEl.value=prevRole; return; }
  selectEl.disabled=true;
  const res=await apiFetch("admin", { method:"POST", body: JSON.stringify({mode:"setRole", userId:Number(uid), role}) });
  if(res.ok){ adminUsersCache=null; renderAdminUsers(); }
  else { alert((res.body && res.body.error) || "등급 변경에 실패했습니다."); selectEl.value=prevRole; selectEl.disabled=false; }
}
async function doAdminReset(mode){
  const label = mode==="all" ? "계정 + 데이터 초기화" : "데이터 초기화";
  if(!confirm(`정말 '${label}'를 실행할까요?\n이 작업은 되돌릴 수 없습니다.`)) return;
  const warn = mode==="all"
    ? "마지막 확인입니다.\n관리자 계정을 제외한 모든 회원 계정과 데이터가 영구적으로 삭제됩니다.\n정말 진행할까요?"
    : "마지막 확인입니다.\n모든 회원의 작품 데이터가 영구적으로 삭제됩니다.\n정말 진행할까요?";
  if(!confirm(warn)) return;
  const res=await apiFetch("admin", { method:"POST", body: JSON.stringify({mode}) });
  if(res.ok){ alert("초기화가 완료되었습니다."); adminUsersCache=null; renderAdminUsers(); }
  else alert((res.body && res.body.error) || "초기화에 실패했습니다.");
}

/* ===== 🎓 교수 그룹 설정 — 학생-교수 연결 / 과제 관리 / 제출·첨삭 =====
   학생: 설정에서 교수 코드 입력 → 가입 → 기획서/플롯/글쓰기 탭의 "제출" 버튼으로 과제 폴더 선택해 제출
   교수: 학생 관리(내 코드로 가입한 학생 명단) / 과제 관리(등록·마감 스위치·제출함 열람·첨삭)
   제출물은 교수 계정 자신의 작품(P/DB)에 절대 합쳐지지 않는다 — 항상 /api/professor-* 로 별도 조회해서
   "과제 관리" 탭 안에서 페이지 전환으로 보여주고(과제 폴더 → 제출함 → 첨삭, 팝업 아님) 저장도
   professor-submission API로만 하므로, 교수 자신의 프로젝트 데이터와 완전히 분리되어 있다. */
const TYPE_LABEL={plan:"기획서", plot:"플롯", write:"글쓰기"};
/* "과제 관리" 탭 안의 현재 화면 상태(팝업 대신 같은 탭 안에서 페이지처럼 전환) */
let profAssignFolderId=null; // 열려있는 과제 폴더(제출함) id — null이면 과제 목록 화면
let profReviewId=null;       // 열려있는 첨삭 화면의 제출물 id — null이면 제출함/목록 화면
let reviewSplitIds=new Set();// 첨삭 화면에서 "이전 버전 / 첨삭"으로 위아래 분리된 블록 id 모음

/* 두 텍스트를 단어 단위로 비교해, 이전 텍스트(before)에서 지금(after)과 달라진 부분만
   <span class="diff-bg">로 감싼 HTML을 만든다 (LCS 기반의 간단한 단어 단위 diff) */
function diffPrevHtml(beforeText, afterText){
  const a=(beforeText||"").split(/(\s+)/);
  const b=(afterText||"").split(/(\s+)/);
  const n=a.length, m=b.length;
  if(!n) return '<span class="muted">(내용 없음)</span>';
  const dp=Array.from({length:n+1},()=>new Array(m+1).fill(0));
  for(let i=n-1;i>=0;i--){
    for(let j=m-1;j>=0;j--){
      dp[i][j]= a[i]===b[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
    }
  }
  let i=0,j=0, out="";
  while(i<n && j<m){
    if(a[i]===b[j]){ out+=esc(a[i]); i++; j++; }
    else if(dp[i+1][j]>=dp[i][j+1]){ out+= a[i].trim() ? `<span class="diff-bg">${esc(a[i])}</span>` : esc(a[i]); i++; }
    else { j++; }
  }
  while(i<n){ out+= a[i].trim() ? `<span class="diff-bg">${esc(a[i])}</span>` : esc(a[i]); i++; }
  return out;
}

/* 현재 프로젝트에서 제출용 스냅샷을 만든다 (탭 종류별로 모양이 다름, 서버는 그대로 JSON 저장만 함) */
function buildSubmissionData(type){
  if(type==="plan") return P.planDoc || blankPlanDoc();
  if(type==="plot"){
    const sections=(P.plotDoc.sections||[]).map(s=>({
      id:s.id, name:s.name, desc:s.desc,
      ideaTexts:(s.ideaIds||[]).map(id=>plotIdeaText(id)).filter(t=>t&&t.trim()),
    }));
    return {structure:P.plotDoc.structure||"", sections};
  }
  if(type==="write"){
    return allWriteBlocksOrdered().map(bl=>({
      id:bl.id, title:bl.title||"",
      text:(bl.items||[]).filter(it=>(it.text||"").trim())
        .map(it=> it.type==="line" ? `${it.char||"(미지정)"}: ${it.text.trim()}` : it.text.trim()).join("\n"),
    }));
  }
  return null;
}

/* 제출 버튼(학생 계정에서만 노출) — innerHTML 템플릿 안에서 쓰는 버전 */
function submitBtnHtml(){
  return (typeof currentUser!=="undefined" && currentUser && currentUser.role!=="professor")
    ? `<button type="button" class="btn ghost sm icon-btn submit-tab-btn">${ICONS.upload} 제출</button>` : "";
}
function wireSubmitBtn(container, type){
  const btn=container.querySelector(".submit-tab-btn");
  if(btn) btn.onclick=()=>openSubmitModal(type);
}

/* 제출 대상 과제 선택 모달 (학생) */
async function openSubmitModal(type){
  const overlay=document.createElement("div"); overlay.className="plot-modal-overlay";
  overlay.onclick=e=>{ if(e.target===overlay) document.body.removeChild(overlay); };
  const box=document.createElement("div"); box.className="plot-modal";
  const top=document.createElement("div"); top.className="plot-picker-top";
  const ttl=document.createElement("span"); ttl.className="plot-picker-title"; ttl.textContent=`${TYPE_LABEL[type]} 제출`;
  top.append(ttl, iconBtn(ICONS.close,"닫기",()=>document.body.removeChild(overlay)));
  box.appendChild(top);
  const body=document.createElement("div"); body.innerHTML=`<p class="hint">불러오는 중…</p>`;
  box.appendChild(body);
  overlay.appendChild(box); document.body.appendChild(overlay);

  const res=await apiFetch("student-assignments");
  if(!overlay.isConnected) return;
  if(!res.ok || !res.body){ body.innerHTML=`<p class="hint">불러오지 못했습니다.</p>`; return; }
  const profId=res.body.profId, prof=res.body.prof, assignments=res.body.assignments||[];
  if(!profId){
    body.innerHTML=`<p class="hint">아직 가입한 교수 그룹이 없습니다. 오른쪽 위 사용자 메뉴 → 설정에서 교수 코드를 먼저 입력해주세요.</p>`;
    return;
  }
  const openList=assignments.filter(a=>a.open);
  if(!openList.length){
    body.innerHTML=`<p class="hint">${esc(prof?prof.name:"교수")}님이 등록한, 제출 가능한(마감되지 않은) 과제가 없습니다.</p>`;
    return;
  }
  body.innerHTML=`<p class="hint">제출할 과제 폴더를 선택하세요. (${esc(prof?prof.name:"")} 교수님)</p>
    <div class="submit-assign-list">${openList.map(a=>{
      const mine=(a.mySubmissions||[]).filter(s=>s.type===type);
      const already=mine.length
        ? `<span class="submit-already" data-view-id="${mine[0].id}">이미 ${mine.length}회 제출함${mine[0].has_feedback?" · 첨삭 완료(보기)":""}</span>`
        : "";
      return `<button type="button" class="submit-assign-item" data-id="${a.id}">
        <b>${esc(a.title)}</b>
        <span class="hint">${a.due_at?("제출기한 "+fmtDate(a.due_at)):"제출기한 없음"}</span>
        ${already}
      </button>`;
    }).join("")}</div>`;
  body.querySelectorAll(".submit-already[data-view-id]").forEach(el=>{
    el.onclick=(e)=>{ e.stopPropagation(); openMySubmissionView(Number(el.dataset.viewId)); };
  });
  body.querySelectorAll(".submit-assign-item").forEach(btn=>{
    btn.onclick=async ()=>{
      btn.disabled=true; btn.textContent="제출 중…";
      const data=buildSubmissionData(type);
      const r=await apiFetch("student-submit", {method:"POST", body:JSON.stringify({
        assignmentId:Number(btn.dataset.id), type, projectName:P.name||"", data,
      })});
      if(r.ok){ alert("제출되었습니다."); if(overlay.isConnected) document.body.removeChild(overlay); }
      else{ alert((r.body&&r.body.error)||"제출에 실패했습니다."); btn.disabled=false; btn.textContent=""; btn.innerHTML=`<b>${esc(btn.dataset.title||"")}</b>`; }
    };
  });
}

/* 내가 제출한 것 + 교수 첨삭 결과 읽기 전용 보기 (학생) */
async function openMySubmissionView(id){
  const overlay=document.createElement("div"); overlay.className="plot-modal-overlay";
  overlay.onclick=e=>{ if(e.target===overlay) document.body.removeChild(overlay); };
  const box=document.createElement("div"); box.className="plot-modal wide";
  const top=document.createElement("div"); top.className="plot-picker-top";
  const ttl=document.createElement("span"); ttl.className="plot-picker-title"; ttl.textContent="불러오는 중…";
  top.append(ttl, iconBtn(ICONS.close,"닫기",()=>document.body.removeChild(overlay)));
  box.appendChild(top);
  const body=document.createElement("div"); box.appendChild(body);
  overlay.appendChild(box); document.body.appendChild(overlay);

  const res=await apiFetch("student-submission?id="+id);
  if(!overlay.isConnected) return;
  if(!res.ok || !res.body){ body.innerHTML=`<p class="hint">불러오지 못했습니다.</p>`; return; }
  const sub=res.body.submission;
  ttl.textContent=`${TYPE_LABEL[sub.type]} — ${sub.assignmentTitle}`;
  if(!sub.feedback){ body.innerHTML=`<p class="hint">아직 첨삭 전입니다.</p>`; return; }
  const pairs=buildReviewPairs(sub.type, sub.data, sub.feedback);
  renderReviewPairs(body, pairs, false, null);
}

/* ===== 교수 — 학생 관리 ===== */
async function rProfStudents(){
  const c=document.createElement("div");
  c.innerHTML=`<div class="card"><h2>${ICONS.user} 학생 관리</h2>
    <p class="hint">내 코드(<b>${esc((currentUser&&currentUser.profCode)||"-")}</b>)를 학생에게 알려주면, 학생이 설정에서 그 코드를 입력해 아래 명단에 나타납니다.</p>
    <div id="profStudentsWrap"><p class="hint">불러오는 중…</p></div>
  </div>`;
  app.appendChild(c);
  const res=await apiFetch("professor-students");
  const wrap=document.getElementById("profStudentsWrap"); if(!wrap) return;
  if(!res.ok || !res.body){ wrap.innerHTML=`<p class="hint">불러오지 못했습니다.</p>`; return; }
  const students=res.body.students||[];
  if(!students.length){ wrap.innerHTML=`<p class="hint">아직 가입한 학생이 없습니다.</p>`; return; }
  wrap.innerHTML=`<table class="admin-table"><thead><tr>
    <th>학교</th><th>이름</th><th>아이디</th><th>이메일</th><th>가입일</th>
  </tr></thead><tbody>${students.map(s=>`<tr>
    <td>${esc(s.school)}</td><td>${esc(s.name)}</td><td>${esc(s.username)}</td><td>${esc(s.email)}</td><td>${fmtDate(s.created_at)}</td>
  </tr>`).join("")}</tbody></table><p class="hint">총 ${students.length}명</p>`;
}

/* ===== 교수 — 과제 관리 =====
   팝업이 아니라 이 탭 안에서 화면만 바뀐다: 과제 목록 → (폴더 클릭) 제출함 → (제출물 클릭) 첨삭 화면.
   profAssignFolderId/profReviewId 상태값으로 어느 화면을 보여줄지 결정한다(뒤로가기 버튼이 각각 null로 리셋). */
function rProfAssignments(){
  if(profReviewId){ rProfSubmissionReview(profReviewId); return; }
  if(profAssignFolderId){ rProfAssignmentFolder(profAssignFolderId); return; }
  const c=document.createElement("div");
  c.innerHTML=`<div class="card"><h2>${ICONS.book} 과제 관리</h2>
    <p class="hint">과제를 등록하면 아래에 폴더 형태로 표시됩니다. 폴더를 클릭하면 학생 제출함이 열립니다. 스위치를 끄면 학생이 더 이상 제출할 수 없습니다.</p>
    <button class="btn" id="profNewAssignBtn">${ICONS.plus} 과제 등록</button>
    <div id="profAssignWrap" class="prof-assign-grid"><p class="hint">불러오는 중…</p></div>
  </div>`;
  app.appendChild(c);
  c.querySelector("#profNewAssignBtn").onclick=openNewAssignmentModal;
  renderProfAssignList();
}
async function renderProfAssignList(){
  const wrap=document.getElementById("profAssignWrap"); if(!wrap) return;
  const res=await apiFetch("professor-assignments");
  if(!wrap.isConnected) return;
  if(!res.ok || !res.body){ wrap.innerHTML=`<p class="hint">불러오지 못했습니다.</p>`; return; }
  const list=res.body.assignments||[];
  if(!list.length){ wrap.innerHTML=`<p class="hint">등록된 과제가 없습니다.</p>`; return; }
  wrap.innerHTML=list.map(a=>`<div class="assign-folder" data-id="${a.id}">
    <div class="assign-folder-top">
      <span class="assign-folder-title">${ICONS.book} ${esc(a.title)}</span>
      <label class="assign-switch" title="제출 마감 스위치" onclick="event.stopPropagation()">
        <input type="checkbox" ${a.open?"checked":""} data-id="${a.id}">
        <span class="assign-switch-slider"></span>
      </label>
    </div>
    <div class="hint">${a.due_at?("제출기한 "+fmtDate(a.due_at)):"제출기한 없음"} · 제출 ${a.submission_count}건 · ${a.open?"제출 가능":"마감됨"}</div>
  </div>`).join("");
  wrap.querySelectorAll(".assign-switch input").forEach(inp=>{
    inp.onchange=async ()=>{
      const r=await apiFetch("professor-assignment", {method:"POST", body:JSON.stringify({id:Number(inp.dataset.id), open:inp.checked})});
      if(!r.ok){ alert((r.body&&r.body.error)||"변경에 실패했습니다."); inp.checked=!inp.checked; return; }
      renderProfAssignList();
    };
  });
  wrap.querySelectorAll(".assign-folder").forEach(el=>{
    el.onclick=()=>{ profAssignFolderId=Number(el.dataset.id); render(); };
  });
}
function openNewAssignmentModal(){
  const overlay=document.createElement("div"); overlay.className="plot-modal-overlay";
  overlay.onclick=e=>{ if(e.target===overlay) document.body.removeChild(overlay); };
  const box=document.createElement("div"); box.className="plot-modal";
  const top=document.createElement("div"); top.className="plot-picker-top";
  const ttl=document.createElement("span"); ttl.className="plot-picker-title"; ttl.textContent="과제 등록";
  top.append(ttl, iconBtn(ICONS.close,"닫기",()=>document.body.removeChild(overlay)));
  box.appendChild(top);
  box.insertAdjacentHTML("beforeend",
    `<label>과제명</label><input type="text" id="newAssignTitle" placeholder="예: 1차 기획서 과제">
     <label>제출기한 (선택)</label><input type="date" id="newAssignDue">
     <button class="btn" id="newAssignSaveBtn" style="margin-top:14px;width:100%">등록</button>`);
  overlay.appendChild(box); document.body.appendChild(overlay);
  box.querySelector("#newAssignSaveBtn").onclick=async ()=>{
    const title=box.querySelector("#newAssignTitle").value.trim();
    if(!title){ alert("과제명을 입력해주세요."); return; }
    const dueStr=box.querySelector("#newAssignDue").value;
    const dueAt=dueStr ? Math.floor(new Date(dueStr+"T23:59:59").getTime()/1000) : null;
    const r=await apiFetch("professor-assignments", {method:"POST", body:JSON.stringify({title, dueAt})});
    if(r.ok){ if(overlay.isConnected) document.body.removeChild(overlay); renderProfAssignList(); }
    else alert((r.body&&r.body.error)||"등록에 실패했습니다.");
  };
}

/* 과제 폴더 — 제출한 학생 목록 (교수). "과제 관리" 탭 안에서 페이지처럼 전환(팝업 아님) */
async function rProfAssignmentFolder(id){
  const c=document.createElement("div"); c.className="card";
  c.innerHTML=`<button class="btn ghost sm" id="assignBackBtn" style="margin-bottom:10px">${ICONS.close} 과제 목록으로</button>
    <h2 id="assignFolderTitle">${ICONS.book} 불러오는 중…</h2>
    <div id="assignFolderWrap"><p class="hint">불러오는 중…</p></div>`;
  app.appendChild(c);
  c.querySelector("#assignBackBtn").onclick=()=>{ profAssignFolderId=null; render(); };

  const res=await apiFetch("professor-assignment?id="+id);
  if(!c.isConnected) return;
  const titleEl=document.getElementById("assignFolderTitle");
  const wrap=document.getElementById("assignFolderWrap");
  if(!res.ok || !res.body){ if(titleEl) titleEl.textContent="불러오지 못했습니다"; return; }
  const assignment=res.body.assignment, submissions=res.body.submissions||[];
  if(titleEl) titleEl.textContent=`${ICONS.book} ${esc(assignment.title)} — 제출함`;
  if(!submissions.length){ wrap.innerHTML=`<p class="hint">아직 제출한 학생이 없습니다.</p>`; return; }
  wrap.innerHTML=`<div class="submit-assign-list">${submissions.map(s=>`
    <button type="button" class="submit-assign-item" data-id="${s.id}">
      <b>${esc(s.student_name)}</b> <span class="hint">(${esc(s.student_username)})</span>
      <span class="assign-type-badge">${esc(s.type_label)}</span>
      <span class="hint">제출 ${fmtDate(s.submitted_at)}${s.has_feedback?" · 첨삭 완료":" · 첨삭 전"}</span>
    </button>`).join("")}</div>`;
  wrap.querySelectorAll(".submit-assign-item").forEach(btn=>{
    btn.onclick=()=>{ profReviewId=Number(btn.dataset.id); render(); };
  });
}

/* 제출물 상세 — 첨삭 화면 (교수, 페이지). 기본은 원본 블록만 한 줄로 보여주고,
   블록을 우클릭해 [첨삭]을 선택해야 그 블록만 이전 버전(위)/첨삭 입력란(아래)으로 분리된다.
   이미 첨삭이 저장되어 원본과 달라진 블록은 처음부터 분리된 채로 보여준다. */
async function rProfSubmissionReview(id){
  const c=document.createElement("div"); c.className="card";
  c.innerHTML=`<button class="btn ghost sm" id="reviewBackBtn" style="margin-bottom:10px">${ICONS.close} 제출함으로</button>
    <h2 id="reviewTitle">${ICONS.edit} 불러오는 중…</h2>
    <p class="hint">원본 블록을 <b>우클릭</b>해 <b>첨삭</b>을 선택하면 이전 버전(위)·첨삭 입력란(아래)으로 나뉩니다. 다 마쳤으면 아래 버튼으로 학생에게 피드백을 돌려주세요.</p>
    <div id="reviewPairs"><p class="hint">불러오는 중…</p></div>
    <button class="btn" id="reviewSaveBtn" style="margin-top:14px;width:100%">${ICONS.upload} 피드백 전달</button>`;
  app.appendChild(c);
  c.querySelector("#reviewBackBtn").onclick=()=>{ profReviewId=null; render(); };

  const res=await apiFetch("professor-submission?id="+id);
  if(!c.isConnected) return;
  const titleEl=document.getElementById("reviewTitle");
  const pairsEl=document.getElementById("reviewPairs");
  if(!res.ok || !res.body){ if(titleEl) titleEl.textContent="불러오지 못했습니다"; return; }
  const sub=res.body.submission;
  if(titleEl) titleEl.textContent=`${ICONS.edit} ${esc(sub.studentName)} · ${TYPE_LABEL[sub.type]} — ${esc(sub.assignmentTitle)}`;
  const pairs=buildReviewPairs(sub.type, sub.data, sub.feedback);
  reviewSplitIds=new Set(pairs.filter(p=>p.after!==p.before).map(p=>p.id));
  renderReviewPairs(pairsEl, pairs, true, reviewSplitIds);

  document.getElementById("reviewSaveBtn").onclick=async ()=>{
    const byId={}; pairs.forEach(p=>byId[p.id]=p);
    pairsEl.querySelectorAll(".review-pair.split textarea").forEach(ta=>{
      const wrap=ta.closest(".review-pair");
      const pid=wrap && wrap.dataset.id;
      if(pid!=null && byId[pid]) byId[pid].after=ta.value;
    });
    const afterList=pairs.map(p=>p.after);
    const feedback=buildFeedbackFromPairs(sub.type, sub.data, afterList);
    const r=await apiFetch("professor-submission", {method:"POST", body:JSON.stringify({id, feedback})});
    if(r.ok) alert("피드백을 학생에게 전달했습니다.");
    else alert((r.body&&r.body.error)||"저장에 실패했습니다.");
  };
}

/* 제출 데이터(data) + 기존 첨삭(feedback) → 화면에 그릴 "블럭 쌍" 배열 (타입별로 모양이 다름) */
function buildReviewPairs(type, data, feedback){
  if(type==="plan"){
    const fb=feedback||{};
    return PLAN_FIELDS.map(f=>({
      id:f.k, label:f.label, before:(data&&data[f.k])||"",
      after: Object.prototype.hasOwnProperty.call(fb,f.k) ? fb[f.k] : ((data&&data[f.k])||""),
    }));
  }
  if(type==="plot"){
    const sections=(data&&data.sections)||[];
    const fbArr=Array.isArray(feedback)?feedback:[];
    return sections.map((s,i)=>{
      const before=(s.desc||"")+((s.ideaTexts&&s.ideaTexts.length)?("\n\n[아이디어]\n"+s.ideaTexts.join("\n")):"");
      const fbItem=fbArr[i];
      return { id:s.id||("i"+i), label:s.name||`섹션 ${i+1}`, before, after: fbItem&&typeof fbItem.text==="string" ? fbItem.text : before };
    });
  }
  if(type==="write"){
    const blocks=Array.isArray(data)?data:[];
    const fbArr=Array.isArray(feedback)?feedback:[];
    return blocks.map((b,i)=>{
      const fbItem=fbArr[i];
      return { id:b.id||("i"+i), label:b.title||`블록 ${i+1}`, before:b.text||"", after: fbItem&&typeof fbItem.text==="string" ? fbItem.text : (b.text||"") };
    });
  }
  return [];
}
/* 첨삭 화면 공통 렌더러 — editable=true(교수: 원본 블록 우클릭으로 첨삭 분리, textarea로 입력)
   editable=false(학생: 읽기전용, 원본과 다른 블록만 자동으로 위/아래 분리해서 보여줌) */
function renderReviewPairs(container, pairs, editable, splitIds){
  container.innerHTML="";
  if(!pairs.length){ container.innerHTML=`<p class="hint">내용이 없습니다.</p>`; return; }
  pairs.forEach(p=>{
    const changed=p.after!==p.before;
    const split = editable ? splitIds.has(p.id) : changed;
    const wrap=document.createElement("div"); wrap.className="review-pair"+(split?" split":""); wrap.dataset.id=p.id;
    if(!split){
      const box=document.createElement("div"); box.className="plan-block review-before";
      const lbl=document.createElement("label"); lbl.textContent=p.label;
      const txt=document.createElement("div"); txt.className="review-before-text";
      if(p.before && p.before.trim()) txt.textContent=p.before;
      else txt.innerHTML='<span class="muted">(내용 없음)</span>';
      box.append(lbl, txt);
      wrap.appendChild(box);
      if(editable) wrap.addEventListener("contextmenu", e=>{ e.preventDefault(); e.stopPropagation(); openReviewBlockCtxMenu(e.clientX, e.clientY, p, wrap, container, pairs, splitIds, editable); });
    }else{
      const prev=document.createElement("div"); prev.className="version-prev";
      const toggle=document.createElement("div"); toggle.className="version-prev-toggle";
      const setToggleLabel=()=>{ toggle.textContent=(prev.classList.contains("collapsed")?"▸":"▾")+" 이전 버전 · "+p.label; };
      toggle.onclick=()=>{ prev.classList.toggle("collapsed"); setToggleLabel(); };
      const prevText=document.createElement("div"); prevText.className="version-prev-text";
      setToggleLabel();
      prev.append(toggle, prevText);

      const cur=document.createElement("div"); cur.className="ta-wrap version-current";
      const lbl=document.createElement("label"); lbl.textContent=p.label+(editable?" — 첨삭":" — 교수님 첨삭");
      cur.appendChild(lbl);
      let getAfter;
      if(editable){
        const ta=document.createElement("textarea"); ta.className="plan-ta-lg"; ta.value=p.after;
        ta.oninput=()=>{ prevText.innerHTML=diffPrevHtml(p.before, ta.value); };
        cur.appendChild(ta);
        getAfter=()=>ta.value;
      }else{
        const txt=document.createElement("div"); txt.className="review-before-text";
        if(p.after && p.after.trim()) txt.textContent=p.after; else txt.innerHTML='<span class="muted">(내용 없음)</span>';
        cur.appendChild(txt);
        getAfter=()=>p.after;
      }
      prevText.innerHTML=diffPrevHtml(p.before, getAfter());
      wrap.append(prev, cur);
      if(editable) wrap.addEventListener("contextmenu", e=>{ e.preventDefault(); e.stopPropagation(); openReviewBlockCtxMenu(e.clientX, e.clientY, p, wrap, container, pairs, splitIds, editable); });
    }
    container.appendChild(wrap);
  });
}
/* 첨삭 화면(교수) 블록 우클릭 메뉴 — 원본 블록이면 [첨삭](위/아래로 분리),
   이미 분리된 블록이면 [원본 보기로 되돌리기](입력 중이던 첨삭 내용은 유지한 채 다시 원본 한 줄 보기로) */
function openReviewBlockCtxMenu(x, y, p, wrap, container, pairs, splitIds, editable){
  if(!editable) return;
  const m=document.getElementById("ctxMenu"); if(!m) return;
  const split=splitIds.has(p.id);
  const items = split
    ? [["원본 보기로 되돌리기",ICONS.eraser,()=>{
        const ta=wrap.querySelector("textarea"); if(ta) p.after=ta.value;
        splitIds.delete(p.id); renderReviewPairs(container, pairs, editable, splitIds);
      }]]
    : [["첨삭",ICONS.edit,()=>{ splitIds.add(p.id); renderReviewPairs(container, pairs, editable, splitIds); }]];
  m.innerHTML="";
  items.forEach(([label,icon,fn])=>{
    const b=document.createElement("button");
    b.innerHTML=icon+" "+label;
    b.onclick=()=>{ hideCtxMenu(); fn(); };
    m.appendChild(b);
  });
  m.hidden=false;
  const vw=window.innerWidth, vh=window.innerHeight;
  m.style.left=Math.min(x, vw-190)+"px";
  m.style.top=Math.min(y, vh-(items.length*36+20))+"px";
}
/* 화면에서 편집한 첨삭 텍스트 배열 → 저장용 feedback 구조로 재조립 (buildReviewPairs와 순서가 항상 같음) */
function buildFeedbackFromPairs(type, data, afterList){
  if(type==="plan"){
    const fb={};
    PLAN_FIELDS.forEach((f,i)=>{ fb[f.k]=afterList[i]||""; });
    return fb;
  }
  if(type==="plot"){
    const sections=(data&&data.sections)||[];
    return sections.map((s,i)=>({ id:s.id, text:afterList[i]||"" }));
  }
  if(type==="write"){
    const blocks=Array.isArray(data)?data:[];
    return blocks.map((b,i)=>({ id:b.id, text:afterList[i]||"" }));
  }
  return null;
}

/* 정보 */
document.getElementById("aboutLink").onclick=e=>{
  e.preventDefault();
  alert("스토리텔링 가이드\n웹툰 전공 스토리 제작 도구\n\n- 데이터는 이 브라우저에만 저장됩니다\n- 정기적으로 '백업 파일 내보내기'를 권장합니다");
};

/* 왼쪽 메뉴 접기/펼치기 버튼 + 저장된 접힘 상태 적용 */
document.getElementById("sbToggleBtn").onclick=()=>{ UICOL.sb=!UICOL.sb; saveUiCollapse(); applyUiCollapse(); };
applyUiCollapse();
/* 상단바 실제 높이를 재서 --topbar-h에 반영 — 사이드바·접기 버튼이 툴바에 딱 붙도록 */
(function syncTopbarHeight(){
  const tb=document.querySelector(".topbar");
  if(tb) document.documentElement.style.setProperty("--topbar-h", tb.offsetHeight+"px");
})();

/* 초기 렌더 */
refreshProjSelect();
refreshAdminTabVisibility();
render();
