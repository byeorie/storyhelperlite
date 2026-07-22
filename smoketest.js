const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const dir = process.cwd();
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");

const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/", pretendToBeVisual: true });
const { window } = dom;

// stub things not available / not needed in jsdom
window.URL.createObjectURL = () => "blob:stub";
window.print = () => {};
window.htmlDocx = { asBlob: () => new Blob(["stub"]) };
window.alert = (msg) => { console.log("[alert]", msg); };
window.confirm = () => true;
window.prompt = (msg, def) => (def !== undefined ? def : "테스트그룹");
window.fetch = () => Promise.reject(new Error("no network in test"));

const errors = [];
window.addEventListener("error", (e) => errors.push(e.error || e.message));

for (const f of ["data.js", "auth.js", "app.js"]) {
  const code = fs.readFileSync(path.join(dir, f), "utf8");
  window.eval(code);
}

const doc = window.document;

// force write tab active + seed data
const w = window;
w.activeTab = "write";
w.P.plotDoc = { structure: "test", sections: [{ id: "s1", name: "1막", desc: "", ideaIds: [] }], ideaOverrides: {} };
w.P.writeDoc = {
  blocks: [
    { id: "b1", sectionId: "s1", fromIdea: "", title: "블록1", items: [], groupId: "" },
    { id: "b2", sectionId: "s1", fromIdea: "", title: "블록2", items: [], groupId: "" },
    { id: "b3", sectionId: "s1", fromIdea: "", title: "블록3", items: [], groupId: "" }
  ],
  groups: []
};
w.render();

console.log("scene-block count (no select mode):", doc.querySelectorAll(".scene-block").length);
console.log("checkbox count (should be 0):", doc.querySelectorAll(".scene-select-chk").length);

// toggle select mode
w.writeSelectMode = true;
w.render();
console.log("checkbox count (select mode):", doc.querySelectorAll(".scene-select-chk").length);

// select two blocks and group them
w.writeSelectedIds.add("b1");
w.writeSelectedIds.add("b2");
w.groupSelectedBlocks();
console.log("groups after grouping:", JSON.stringify(w.P.writeDoc.groups));
console.log("block groupIds:", w.P.writeDoc.blocks.map(b => b.id + ":" + b.groupId));
console.log("write-blockgroup count:", doc.querySelectorAll(".write-blockgroup").length);
console.log("scene-block count after grouping:", doc.querySelectorAll(".scene-block").length);

// right-click context menu on a block
const blockEl = doc.querySelector('.scene-block[data-id="b1"]');
const ev = new w.MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 50, clientY: 50 });
blockEl.dispatchEvent(ev);
const ctx = doc.getElementById("ctxMenu");
console.log("ctxMenu hidden after right-click:", ctx.hidden, "buttons:", ctx.querySelectorAll("button").length);

// ungroup via button in group wrapper
const ungroupBtn = doc.querySelector(".wg-actions button[title='그룹 해제']");
console.log("ungroup button found:", !!ungroupBtn);
if (ungroupBtn) ungroupBtn.click();
console.log("groups after ungroup:", JSON.stringify(w.P.writeDoc.groups));

// export tab
w.activeTab = "export";
w.render();
const docxBtn = doc.getElementById("docxBtn"), pdfBtn = doc.getElementById("pdfBtn"), storyOut = doc.getElementById("storyOut"), storyIn = doc.getElementById("storyIn");
console.log("export buttons found:", !!docxBtn, !!pdfBtn, !!storyOut, !!storyIn);
try { docxBtn.click(); console.log("docx export click: OK"); } catch (e) { console.log("docx export click ERROR:", e.message); }
try { storyOut.click(); console.log("story export click: OK"); } catch (e) { console.log("story export click ERROR:", e.message); }

console.log("window errors:", errors.length, errors.map(e=>String(e&&e.stack||e)));
process.exit(0);
