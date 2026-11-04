import { requireAuth, jsonResponse, nowSec, ensureBoardSchema, ensureAssignmentSchema, parseIdList, listStudentClasses, noticeAssignmentIds } from "./_utils.js";

/* ===== 수업 공지 (2026-10-31) =====
   수업마다 공지 게시판. 일반 공지와 과제 공지(kind "assignment" — 과제를 연결할 수 있다)를
   한 목록에서 쓰고, 교수 자료실(materials.js)의 자료를 공지에 첨부할 수 있다.
   2026-11-04: 공지 하나를 여러 수업에 동시 공개한다. 공개 수업은 notice_classes 표.
   과제 공지는 공개 수업마다 그 수업의 과제를 하나씩 연결할 수 있고(assignment_ids), 학생에게는 자기 수업의 과제만 보인다.

   - GET  /api/class-notices?classId=N : 그 수업에 공개된 공지 목록 + 수업에 공유된 자료 목록
                                         (교수: 내 수업만, 각 공지에 공개 수업 목록 classes /
                                          학생: 내가 등록된 수업만, 각 공지에 read 표시)
   - GET  /api/class-notices          : (학생) 내가 등록된 수업 목록 + 수업별 안 읽은 공지 수
   - POST /api/class-notices  { id?, classIds, kind, title, body, assignmentIds, pinned, materialIds } : 교수 — 쓰기/수정
                                         (예전 형식 { classId, assignmentId }도 받는다)
   - POST /api/class-notices  { action:"read", ids:[...] } : 학생 — 읽음 표시(알림에서 빠진다)
   - DELETE /api/class-notices?id=N   : 교수 — 공지 삭제(공개한 모든 수업에서) */

async function ownClass(env, classId, profId) {
  return env.DB.prepare("SELECT id, name FROM classes WHERE id = ? AND prof_id = ?").bind(classId, profId).first();
}
async function enrolledClass(env, classId, studentId) {
  return env.DB.prepare(
    "SELECT c.id, c.name FROM class_students cs JOIN classes c ON c.id = cs.class_id WHERE cs.class_id = ? AND cs.student_id = ?"
  ).bind(classId, studentId).first();
}
const inList = (arr) => arr.map(() => "?").join(",");

async function loadBoard(env, cls, viewer) {
  const { results: rows } = await env.DB.prepare(
    "SELECT n.id, n.kind, n.title, n.body, n.assignment_id, n.assignment_ids, n.pinned, n.material_ids, n.created_at, n.updated_at " +
    "FROM class_notices n JOIN notice_classes nc ON nc.notice_id = n.id WHERE nc.class_id = ? ORDER BY n.pinned DESC, n.created_at DESC"
  ).bind(cls.id).all();
  const notices = rows || [];
  const noticeIds = notices.map((n) => n.id);

  /* 공지에 붙은 자료 + 수업에 공유된 자료를 한 번에 읽는다(삭제된 자료는 자연히 빠진다) */
  const { results: shared } = await env.DB.prepare(
    "SELECT m.id, m.title, m.file_name, m.size, m.created_at FROM material_classes mc JOIN materials m ON m.id = mc.material_id " +
    "WHERE mc.class_id = ? ORDER BY m.created_at DESC"
  ).bind(cls.id).all();
  const attachIds = [...new Set(notices.flatMap((n) => parseIdList(n.material_ids)))];
  const matById = {};
  (shared || []).forEach((m) => { matById[m.id] = m; });
  const missing = attachIds.filter((id) => !matById[id]);
  if (missing.length) {
    const { results } = await env.DB.prepare(
      "SELECT id, title, file_name, size, created_at FROM materials WHERE id IN (" + inList(missing) + ")"
    ).bind(...missing).all();
    (results || []).forEach((m) => { matById[m.id] = m; });
  }

  /* 연결된 과제 중 "지금 보고 있는 수업"의 과제만 보여준다 */
  const assignIds = [...new Set(notices.flatMap(noticeAssignmentIds))];
  const assignById = {};
  if (assignIds.length) {
    await ensureAssignmentSchema(env);
    const { results } = await env.DB.prepare(
      "SELECT id, title, due_at, open, type, class_id FROM assignments WHERE id IN (" + inList(assignIds) + ")"
    ).bind(...assignIds).all();
    (results || []).forEach((a) => { assignById[a.id] = a; });
  }

  let readSet = null, readCounts = null, studentCount = null, classesByNotice = null;
  if (viewer.role === "student") {
    const { results } = await env.DB.prepare(
      "SELECT r.notice_id FROM notice_reads r JOIN notice_classes nc ON nc.notice_id = r.notice_id WHERE nc.class_id = ? AND r.student_id = ?"
    ).bind(cls.id, viewer.id).all();
    readSet = new Set((results || []).map((r) => r.notice_id));
  } else {
    /* 읽은 학생 수는 "이 수업" 수강생 기준 */
    const { results } = await env.DB.prepare(
      "SELECT r.notice_id, COUNT(*) AS cnt FROM notice_reads r JOIN notice_classes nc ON nc.notice_id = r.notice_id " +
      "JOIN class_students cs ON cs.class_id = nc.class_id AND cs.student_id = r.student_id " +
      "WHERE nc.class_id = ? GROUP BY r.notice_id"
    ).bind(cls.id).all();
    readCounts = {};
    (results || []).forEach((r) => { readCounts[r.notice_id] = r.cnt; });
    const c = await env.DB.prepare("SELECT COUNT(*) AS cnt FROM class_students WHERE class_id = ?").bind(cls.id).first();
    studentCount = c ? c.cnt : 0;
    classesByNotice = {};
    if (noticeIds.length) {
      const { results: links } = await env.DB.prepare(
        "SELECT nc.notice_id, c.id, c.name, c.section FROM notice_classes nc JOIN classes c ON c.id = nc.class_id " +
        "WHERE nc.notice_id IN (" + inList(noticeIds) + ") ORDER BY c.name"
      ).bind(...noticeIds).all();
      (links || []).forEach((l) => { (classesByNotice[l.notice_id] = classesByNotice[l.notice_id] || []).push({ id: l.id, name: l.name, section: l.section }); });
    }
  }

  return {
    class: { id: cls.id, name: cls.name },
    studentCount,
    notices: notices.map((n) => {
      const aIds = noticeAssignmentIds(n);
      const out = {
        id: n.id, kind: n.kind === "assignment" ? "assignment" : "notice", title: n.title, body: n.body || "",
        pinned: !!n.pinned, created_at: n.created_at, updated_at: n.updated_at,
        assignment: aIds.map((id) => assignById[id]).find((a) => a && a.class_id === cls.id) || null,
        materials: parseIdList(n.material_ids).map((id) => matById[id]).filter(Boolean),
      };
      if (readSet) out.read = readSet.has(n.id);
      if (readCounts) {
        out.readCount = readCounts[n.id] || 0;
        out.classes = classesByNotice[n.id] || [];
        out.assignmentIds = aIds;
      }
      return out;
    }),
    materials: shared || [],
  };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  await ensureBoardSchema(env);
  const isProf = auth.user.role === "professor";
  const classId = Number(new URL(request.url).searchParams.get("classId"));

  if (!classId) {
    if (isProf) return jsonResponse({ error: "classId가 필요합니다." }, 400);
    const list = (await listStudentClasses(env, auth.user.id)).filter((c) => c.classId != null);
    const { results } = await env.DB.prepare(
      "SELECT nc.class_id, COUNT(*) AS cnt FROM notice_classes nc JOIN class_students cs ON cs.class_id = nc.class_id " +
      "WHERE cs.student_id = ? AND NOT EXISTS (SELECT 1 FROM notice_reads r WHERE r.notice_id = nc.notice_id AND r.student_id = ?) " +
      "GROUP BY nc.class_id"
    ).bind(auth.user.id, auth.user.id).all();
    const unread = {};
    (results || []).forEach((r) => { unread[r.class_id] = r.cnt; });
    return jsonResponse({ classes: list.map((c) => ({ ...c, unread: unread[c.classId] || 0 })) });
  }

  const cls = isProf ? await ownClass(env, classId, auth.user.id) : await enrolledClass(env, classId, auth.user.id);
  if (!cls) return jsonResponse({ error: "수업을 찾을 수 없습니다." }, 404);
  return jsonResponse(await loadBoard(env, cls, { role: isProf ? "professor" : "student", id: auth.user.id }));
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  await ensureBoardSchema(env);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: "잘못된 요청입니다." }, 400); }

  if (body && body.action === "read") {
    const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Boolean).slice(0, 100) : [];
    const now = nowSec();
    for (const nid of ids) {
      /* 내가 등록된 수업에 공개된 공지만 읽음 처리 */
      await env.DB.prepare(
        "INSERT OR IGNORE INTO notice_reads (notice_id, student_id, read_at) " +
        "SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM notice_classes nc JOIN class_students cs ON cs.class_id = nc.class_id " +
        "WHERE nc.notice_id = ? AND cs.student_id = ?)"
      ).bind(nid, auth.user.id, now, nid, auth.user.id).run();
    }
    return jsonResponse({ ok: true });
  }

  if (auth.user.role !== "professor") return jsonResponse({ error: "교수 계정만 공지를 쓸 수 있습니다." }, 403);

  /* 공개할 수업 — 내 수업만 */
  const wantClasses = Array.isArray(body.classIds) ? body.classIds : (body.classId ? [body.classId] : []);
  const { results: mine } = await env.DB.prepare("SELECT id FROM classes WHERE prof_id = ?").bind(auth.user.id).all();
  const mineSet = new Set((mine || []).map((c) => c.id));
  const classIds = [...new Set(wantClasses.map(Number))].filter((c) => mineSet.has(c));
  if (!classIds.length) return jsonResponse({ error: "공개할 수업을 하나 이상 골라주세요." }, 400);

  const title = String((body && body.title) || "").trim().slice(0, 200);
  if (!title) return jsonResponse({ error: "제목을 입력해주세요." }, 400);
  const text = String((body && body.body) || "").slice(0, 20000);
  const kind = body.kind === "assignment" ? "assignment" : "notice";
  const pinned = body.pinned ? 1 : 0;

  /* 과제 연결 — 공개 수업의 과제만, 수업당 하나 */
  let assignmentIds = [];
  if (kind === "assignment") {
    const want = Array.isArray(body.assignmentIds) ? body.assignmentIds : (body.assignmentId ? [body.assignmentId] : []);
    const ids = [...new Set(want.map(Number).filter(Boolean))].slice(0, 50);
    if (ids.length) {
      const { results } = await env.DB.prepare(
        "SELECT id, class_id FROM assignments WHERE prof_id = ? AND id IN (" + inList(ids) + ")"
      ).bind(auth.user.id, ...ids).all();
      const used = new Set();
      for (const id of ids) {
        const a = (results || []).find((x) => x.id === id);
        if (!a || !classIds.includes(a.class_id)) return jsonResponse({ error: "공개할 수업의 과제만 연결할 수 있습니다." }, 400);
        if (used.has(a.class_id)) return jsonResponse({ error: "수업마다 과제는 하나만 연결할 수 있습니다." }, 400);
        used.add(a.class_id);
        assignmentIds.push(id);
      }
    }
  }

  let materialIds = [];
  const wanted = Array.isArray(body.materialIds) ? [...new Set(body.materialIds.map(Number).filter(Boolean))].slice(0, 30) : [];
  if (wanted.length) {
    const { results } = await env.DB.prepare(
      "SELECT id FROM materials WHERE prof_id = ? AND id IN (" + inList(wanted) + ")"
    ).bind(auth.user.id, ...wanted).all();
    const ok = new Set((results || []).map((r) => r.id));
    materialIds = wanted.filter((id) => ok.has(id));
  }

  const now = nowSec();
  let id = Number(body.id);
  if (id) {
    const r = await env.DB.prepare(
      "UPDATE class_notices SET kind = ?, title = ?, body = ?, assignment_id = ?, assignment_ids = ?, pinned = ?, material_ids = ?, updated_at = ? " +
      "WHERE id = ? AND prof_id = ?"
    ).bind(kind, title, text, assignmentIds[0] || null, JSON.stringify(assignmentIds), pinned, JSON.stringify(materialIds), now, id, auth.user.id).run();
    if (!r.meta.changes) return jsonResponse({ error: "공지를 찾을 수 없습니다." }, 404);
    await env.DB.prepare("DELETE FROM notice_classes WHERE notice_id = ?").bind(id).run();
  } else {
    const r = await env.DB.prepare(
      "INSERT INTO class_notices (class_id, prof_id, kind, title, body, assignment_id, assignment_ids, pinned, material_ids, created_at, updated_at) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(classIds[0], auth.user.id, kind, title, text, assignmentIds[0] || null, JSON.stringify(assignmentIds), pinned, JSON.stringify(materialIds), now, now).run();
    id = r.meta.last_row_id;
  }
  for (const cid of classIds) {
    await env.DB.prepare("INSERT OR IGNORE INTO notice_classes (notice_id, class_id) VALUES (?, ?)").bind(id, cid).run();
  }
  return jsonResponse({ ok: true, id, classIds });
}

export async function onRequestDelete({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth || auth.user.role !== "professor") return jsonResponse({ error: "교수 계정만 접근할 수 있습니다." }, 403);
  await ensureBoardSchema(env);
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return jsonResponse({ error: "잘못된 요청입니다." }, 400);
  const r = await env.DB.prepare("DELETE FROM class_notices WHERE id = ? AND prof_id = ?").bind(id, auth.user.id).run();
  if (!r.meta.changes) return jsonResponse({ error: "공지를 찾을 수 없습니다." }, 404);
  await env.DB.prepare("DELETE FROM notice_classes WHERE notice_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM notice_reads WHERE notice_id = ?").bind(id).run();
  return jsonResponse({ ok: true });
}
