/**
 * Cohort V24 — Code.gs : settings, one-time setup, Gmail intake (applications AND candidate replies),
 * daily digest & reminders, nightly clean-up, diagnostics.
 *
 * The project has FOUR files: Core.gs, Code.gs, WebApp.gs, AI.gs (all copied from the dashboard Playbook).
 * Edit ONLY the SETTINGS block below. Then: choose "setup" in the toolbar → Run.
 * Optional but recommended (both free): ⊕ Services → add "Drive API" (lets the AI read PDF / Word / scanned CVs)
 * and "Google Calendar API" (interview invites with Google Meet links).
 * After any code change: Deploy → Manage deployments → ✎ Edit → Version: "New version" → Deploy.
 */

/* ============================== SETTINGS ============================== */
const SHEET_ID      = "PASTE_YOUR_SHEET_ID";          // from the Sheet's address, between /d/ and /edit
const CV_FOLDER_ID  = "PASTE_YOUR_DRIVE_FOLDER_ID";   // the "Cohort Files" folder's address, after /folders/
const API_TOKEN     = "PASTE_A_NEW_LONG_SECRET";      // make one with Settings → Sync → "Generate a new token"
const INBOX         = "internship.cbc@gmail.com";     // the applications inbox (the account running this script)

// ---- AI (both free). Best: fill in BOTH keys and leave AI_PROVIDER on "auto" —
//      Gemini reads & scores applications (it reads PDF CVs itself); Groq handles replies, chat and drafts;
//      each covers for the other when busy. With one key, that one does everything.
const AI_PROVIDER    = "auto";                        // "auto" (recommended), "gemini" or "groq"
const GROQ_API_KEY   = "PASTE_YOUR_GROQ_API_KEY";     // console.groq.com → API Keys (starts gsk_)
const GROQ_MODEL     = "openai/gpt-oss-120b";         // any Groq chat model that supports JSON output
const GEMINI_API_KEY = "PASTE_YOUR_GEMINI_API_KEY";   // aistudio.google.com → Get API key (starts AIza)
const GEMINI_MODEL   = "gemini-2.5-flash";            // if Google renames models, put the current "Flash" name here

// Google accounts that may OPEN candidate files. Each must be the account the person is signed into in their browser.
// Example: ["mayank@gmail.com", "pushp@gmail.com"]
const TEAM_EMAILS   = [];

// "team" (recommended): files are private to the owner + TEAM_EMAILS.  "link": CV / cover / email PDF are viewable by
// anyone holding the link. NDAs and Govt IDs are ALWAYS private.
const FILE_SHARING  = "team";

const INTERNAL = [INBOX, "bharatchugh.in"];    // our own addresses/domains: never treated as applicants, never mailed
const INTAKE_WINDOW_DAYS  = 120;   // how far back the inbox is searched for applications
const SWEEP_REJECTED_DAYS = 60;    // Drive files of rejected candidates are trashed after this many days (0 = never)
/* ====================================================================== */

const COHORT_SERVER_VERSION = "v24";
const SHEET_HEADERS = ["Received","Track","Month","Year","Name","Email","CV link","Cover link","NDA link","Email PDF","Other files",
  "Status","Key","Subject","Body","Files","CandidateId","Updated","AI","MessageId","ThreadId"];
const OUR_TRIGGERS = ["processInbox","aiVetPending","nightly","morning","dailyReminders","autoSweepRejected"];

/* ---------------------------- one-time setup ---------------------------- */
/** Run this once after pasting the files (and again any time — it is safe to repeat). */
function setup(){
  const log = [];
  const say = s => { log.push(s); Logger.log(s); };
  checkConfig_(true).forEach(say);
  const sh = appSheet_(); say("✓ Sheet opened: " + sh.getParent().getName());
  const folder = DriveApp.getFolderById(CV_FOLDER_ID); say("✓ Drive folder opened: " + folder.getName());
  if(folder.isTrashed()) say("✗ The Drive folder is IN THE TRASH — restore it from drive.google.com → Trash.");
  ScriptApp.getProjectTriggers().forEach(t => { if(OUR_TRIGGERS.indexOf(t.getHandlerFunction()) > -1) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("processInbox").timeBased().everyMinutes(10).create();
  if(aiEnabled_()) ScriptApp.newTrigger("aiVetPending").timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger("morning").timeBased().everyDays(1).atHour(9).create();
  ScriptApp.newTrigger("nightly").timeBased().everyDays(1).atHour(2).create();
  say("✓ Timers: Gmail every 10 min" + (aiEnabled_() ? ", AI every 15 min" : " (AI off — no key)") + ", 9 AM digest & reminders, 2 AM clean-up");
  const res = withStore_(st => {
    const done = !!st.legacyImportedAt;
    if(done) return { total: Object.keys(st.candidates).length, created: 0, linked: 0, skipped: true };
    const r = importLegacySheet_(st, sh);
    st.legacyImportedAt = Date.now(); st.__dirty = true;
    return r;
  });
  say(res.skipped ? ("✓ Shared data ready (" + res.total + " candidates)")
    : ("✓ Shared data ready (" + res.total + " candidates; " + res.created + " brought across from the old Applications tab, " + res.linked + " linked)"));
  try{ say("✓ Sheet mirror written: tab '" + MIRROR_TAB + "' (" + mirrorToSheet_() + " rows). Nothing reads the Sheet now — edit in the dashboard."); }catch(e){ say("! Could not write the Sheet mirror: " + e.message); }
  say(applyFolderSharing_(folder));
  precreateLabels_(); say("✓ Gmail labels ready (Cohort/Filed, Cohort/Reply, Cohort/Needs fix, Cohort/Not an application, Cohort/Duplicate, Cohort/Problem, plus one per month)");
  const moved = migrateLabels_(60000);
  say(moved ? ("✓ Copied " + moved + " thread(s) from the old Status/… labels onto the new ones — run migrateLabels() again if you have a lot, then delete the old labels in Gmail")
            : "• No old Status/… labels to carry over");
  say(typeof Drive !== "undefined" ? "✓ Drive API service is on — the AI can read PDF, Word and scanned CVs" : "• Drive API service is off — the AI reads email text only. To let it read CVs: ⊕ Services → Drive API → Add, then run setup again.");
  say(typeof Calendar !== "undefined" ? "✓ Calendar API service is on — interview invites get Google Meet links" : "• Calendar API service is off — invites are still sent, without an automatic Meet link (⊕ Services → Google Calendar API to add).");
  try{ const u = ScriptApp.getService().getUrl(); say(u ? ("Web app URL of this project: " + u) : "! Not deployed yet: Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone)"); }catch(e){}
  if(Session.getScriptTimeZone() !== "Asia/Kolkata") say("! Project time zone is " + Session.getScriptTimeZone() + " — set it to (GMT+05:30) India in ⚙ Project Settings.");
  health_("setup", { ok: true, info: log.join("\n") });
  return log.join("\n");
}

/** Prints a full health report to the log. Run it whenever something looks wrong. */
function diagnose(){
  const out = []; const say = s => { out.push(s); Logger.log(s); };
  say("Cohort server " + COHORT_SERVER_VERSION + " — " + new Date());
  checkConfig_(false).forEach(say);
  try{ const st = loadStore_(); say("✓ Shared data OK — " + Object.keys(st.candidates).length + " candidate(s), " + Object.keys(st.cohorts).length + " cohort(s)"); }catch(e){ say("✗ Shared data: " + e.message); }
  try{ say("✓ Sheet mirror: tab '" + MIRROR_TAB + "'"); }catch(e){ say("✗ Sheet: " + e.message); }
  try{
    const f = DriveApp.getFolderById(CV_FOLDER_ID);
    say((f.isTrashed() ? "✗ Folder is in the TRASH: " : "✓ Folder OK: ") + f.getName());
    let trashed = 0; const it = f.searchFiles("trashed = true"); while(it.hasNext() && trashed < 5000){ it.next(); trashed++; }
    say(trashed ? ("! " + trashed + " file(s) from this folder are in the Drive trash — Settings → Files → Check & repair") : "✓ No files in the trash");
    say("✓ Shared data file: " + Math.round(storeFile_().getSize() / 1024) + " KB");
  }catch(e){ say("✗ Drive: " + e.message); }
  try{ say("Mail quota left today: " + MailApp.getRemainingDailyQuota()); }catch(e){ say("✗ Mail quota: " + e.message); }
  say("Timers: " + (ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction()).join(", ") || "NONE — run setup()"));
  say("AI: " + aiProviderInfo_());
  say("Automatic-run time used today: " + Math.round(budgetUsed_() / 60000) + " of ~90 minutes");
  try{ say("Web app URL: " + (ScriptApp.getService().getUrl() || "not deployed")); }catch(e){}
  ["intake","ai","nightly","morning","setup"].forEach(k => { const h = getHealth_(k); if(h) say("Last " + k + ": " + new Date(h.ts) + " — " + (h.ok ? "OK" : "FAILED") + (h.err ? " — " + h.err : "")); });
  return out.join("\n");
}

function checkConfig_(strict){
  const bad = [];
  if(/PASTE/.test(SHEET_ID)) bad.push("SHEET_ID");
  if(/PASTE/.test(CV_FOLDER_ID)) bad.push("CV_FOLDER_ID");
  if(/PASTE/.test(API_TOKEN) || String(API_TOKEN).length < 24) bad.push("API_TOKEN (at least 24 characters)");
  const out = [];
  if(bad.length){ const m = "✗ Fill in these settings at the top of Code.gs: " + bad.join(", "); if(strict) throw new Error(m); out.push(m); }
  else out.push("✓ Settings filled in");
  out.push(aiEnabled_() ? ("✓ AI: " + aiProviderInfo_()) : "• AI is off (no Groq or Gemini key) — everything else works");
  if(FILE_SHARING === "team" && !TEAM_EMAILS.length) out.push("! TEAM_EMAILS is empty — CVs stay openable by link until you add the team's Google accounts");
  return out;
}
function keySet_(k){ return !!k && !/PASTE/.test(k); }
function aiEnabled_(){ return keySet_(GROQ_API_KEY) || keySet_(GEMINI_API_KEY); }
function aiProviderInfo_(){
  const list = [];
  if(keySet_(GROQ_API_KEY)) list.push("Groq (" + GROQ_MODEL + ")");
  if(keySet_(GEMINI_API_KEY)) list.push("Gemini (" + GEMINI_MODEL + ")");
  if(!list.length) return "off";
  const both = list.length === 2;
  return (AI_PROVIDER === "auto" && both ? "auto — Gemini reads applications, Groq handles replies & chat" : ("primary " + (AI_PROVIDER === "auto" ? (keySet_(GEMINI_API_KEY) ? "gemini" : "groq") : AI_PROVIDER))) + " · keys: " + list.join(", ");
}

/* ------------------------------- health & budget ------------------------------- */
function health_(k, o){ try{ o.ts = o.ts || Date.now(); PropertiesService.getScriptProperties().setProperty("health_" + k, JSON.stringify(o).slice(0, 8000)); }catch(e){} }
function getHealth_(k){ try{ return JSON.parse(PropertiesService.getScriptProperties().getProperty("health_" + k) || "null"); }catch(e){ return null; } }
/** Free Google accounts get ~90 minutes of timer-run time per day. We track it and pause optional work near the limit. */
function budgetKey_(){ return "rt_" + Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyyMMdd"); }
function budgetUsed_(){ return parseInt(PropertiesService.getScriptProperties().getProperty(budgetKey_()) || "0", 10); }
function budgetAdd_(ms){ try{ PropertiesService.getScriptProperties().setProperty(budgetKey_(), String(budgetUsed_() + Math.max(0, ms))); }catch(e){} }
function budgetLow_(){ return budgetUsed_() > 75 * 60000; }

/* ------------------------------- sheet -------------------------------- */
/** The old v23 intake ledger. Only the one-time import reads it; nothing writes it any more. */
function appSheet_(){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName("Applications");
  if(!sh){ sh = ss.insertSheet("Applications"); sh.appendRow(SHEET_HEADERS); sh.setFrozenRows(1); }
  return sh;
}
function readRows_(sh){
  const head = sheetHead_(sh);
  const last = sh.getLastRow(); if(last < 2) return { head, rows: [] };
  const vals = sh.getRange(2, 1, last - 1, head.length).getValues();
  return { head, rows: vals.map((r, i) => { const o = { _row: i + 2 }; head.forEach((h, j) => { if(h) o[h] = r[j]; }); return o; }) };
}
function sheetHead_(sh){ return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String); }
function writeRowObj_(sh, head, rowIdx, obj){
  const cur = rowIdx ? sh.getRange(rowIdx, 1, 1, head.length).getValues()[0] : head.map(() => "");
  const vals = head.map((h, j) => (h in obj) ? obj[h] : cur[j]);
  if(rowIdx) sh.getRange(rowIdx, 1, 1, head.length).setValues([vals]);
  else sh.appendRow(vals);
}
function cell_(s, n){ s = String(s == null ? "" : s); return s.length > n ? s.slice(0, n) : s; }
function gmailLink_(threadId){ return threadId ? ("https://mail.google.com/mail/?authuser=" + encodeURIComponent(INBOX) + "#all/" + threadId) : ""; }
function automation_(st){ return Object.assign(defaultAutomation(), getSetting_(st, "automation", {}) || {}); }

/* ------------------------------- intake ------------------------------- */
function processInbox(){
  const t0 = Date.now();
  const h = { ts: t0, ok: true, filed: 0, updated: 0, needsFix: 0, ignored: 0, superseded: 0, late: 0, acked: 0, errors: 0, replies: 0, docs: 0 };
  let folder, snap;
  try{ folder = DriveApp.getFolderById(CV_FOLDER_ID); snap = loadStore_(); }
  catch(e){ health_("intake", { ok: false, err: "Cannot open the Drive folder or the shared data: " + e.message }); throw e; }
  const counselEmails = (getSetting_(snap, "counsels", []) || []).map(c => cleanEmail(c.email)).filter(Boolean);
  const auto = automation_(snap);
  let quota = 0; try{ quota = MailApp.getRemainingDailyQuota(); }catch(e){}
  const mailLogs = [], corr = [], filings = [], ackKeys = [];

  // 1) Candidate replies and documents (NDA, ID, updated CV) — logged on their record, never filed as new applications.
  if(auto.logReplies !== false){ try{ processReplies_(snap, folder, counselEmails, corr, h, t0); }catch(e){ h.replyErr = String(e.message || e).slice(0, 200); } }

  // 2) Applications. What is already on file comes from the shared data — the single source of truth.
  const byKey = {};
  Object.keys(snap.candidates).forEach(id => { const c = snap.candidates[id]; if(!c.key) return;
    byKey[String(c.key)] = { id: c.id, key: c.key, intakeTs: c.intakeTs || 0, cvUrl: c.cvUrl, clUrl: c.clUrl,
      ndaUrl: c.ndaUrl, emailPdfUrl: c.emailPdfUrl, otherUrl: c.otherUrl, appFiles: (snap.applications[id] || {}).files || "" }; });
  const qBase = "newer_than:" + INTAKE_WINDOW_DAYS + "d " + notHandledQuery_();
  const q = "in:inbox has:attachment " + qBase;
  // Soonest months first: search month by month (current month, then the next six), then everything else.
  // (A single "newest 50" search would let a flood of later-month emails hide earlier months' applications.)
  const threads = [], seenTh = {};
  const take = list => list.forEach(t => { const id = t.getId(); if(!seenTh[id]){ seenTh[id] = 1; threads.push(t); } });
  upcomingMonths_(7).forEach(m => { if(threads.length < 120 && Date.now() - t0 < 60000) take(GmailApp.search(q + " (" + monthTerms_(m.month, m.year).join(" OR ") + ")", 0, 40)); });
  if(threads.length < 120) take(GmailApp.search(q, 0, 50));
  // Applications that forgot the attachment (or sent a Drive link instead) used to be invisible: not filed, not
  // labelled, and re-scanned every ten minutes for ever. File them too, with no documents, so a person sees them.
  if(threads.length < 120 && Date.now() - t0 < 90000)
    take(GmailApp.search('in:inbox -has:attachment ' + qBase + ' (subject:"Career - Internship" OR subject:"Career - Associate")', 0, 25));
  const items = threads.map(th => { const s = th.getFirstMessageSubject() || ""; const p = parseApplication(s, ""); return { th, rank: p ? cohortRank_(p.month, p.year) : 999999, date: th.getLastMessageDate().getTime() }; });
  items.sort((a, b) => (a.rank - b.rank) || (a.date - b.date));
  for(let i = 0; i < items.length; i++){
    if(Date.now() - t0 > 240000) break;
    const th = items[i].th;
    try{
      const picked = pickMessage_(th, counselEmails);
      if(!picked){ label_(th, LBL.duplicate); h.superseded++; continue; }
      const msg = picked.msg, origin = picked.origin;
      const subject = msg.getSubject() || "", body = fullBody_(msg);
      if(!isApplicationLike(subject, body)){ label_(th, LBL.notApp); h.ignored++; continue; }
      const p = parseApplication(subject, body);
      if(!p){
        label_(th, LBL.needsFix); h.needsFix++;
        const nfKey = "nf|" + origin.email + "|" + Utilities.formatDate(new Date(), "GMT", "yyyyMM");
        if(quota > 5 && !acked_(snap, ackKeys, nfKey) && !isBlockedAddress(origin.email, INTERNAL.concat(getSetting_(snap, "noReplyList", [])))){
          sendTemplate_(snap, /assoc/i.test(subject) ? "needsfix_associate" : "needsfix_internship", origin.email, { Name: origin.name });
          ackKeys.push(nfKey); quota--;
        }
        continue;
      }
      const key = candidateKey(origin.email, p.track, p.month, p.year);
      if(snap.deletedKeys && snap.deletedKeys[key]){ label_(th, LBL.duplicate); h.superseded++; continue; }
      const existing = byKey[key];
      const msgTs = msg.getDate().getTime();
      if(existing && (existing.intakeTs || 0) >= msgTs){ label_(th, LBL.duplicate); h.superseded++; continue; }
      const coh = cohortFromSnap_(snap, p.month, p.year);
      const sub = candidateFolder_(cohortFolder_(folder, p.month + " " + p.year, p), origin.name, origin.email);
      const files = saveAttachments_(msg, sub, origin.name, p);
      const pdf = saveBodyPdf_(msg, sub, origin.name, p);
      // A later email with no attachments must never wipe documents the applicant already sent.
      const keepDocs = !!(existing && picked.noFiles && (existing.cvUrl || existing.clUrl || existing.otherUrl));
      if(existing && !keepDocs) trashUrls_([existing.cvUrl, existing.clUrl, existing.ndaUrl, existing.emailPdfUrl].concat(String(existing.otherUrl || "").split(" , ")));
      else if(existing) trashUrls_([existing.emailPdfUrl]);
      if(picked.noFiles) h.noDocs = (h.noDocs || 0) + 1;
      const dl = (coh && coh.deadlines) || defaultDeadlines(p.month, p.year);
      const closeTs = dl.applyClose;
      const late = Date.now() > closeTs + 864e5;
      const folderUrl = (function(){ try{ return sub.getUrl ? sub.getUrl() : ""; }catch(e){ return ""; } })();
      const filing = {
        cid: existing ? existing.id : ("c_" + Utilities.getUuid().replace(/-/g, "").slice(0, 14)), key: key, isNew: !existing,
        month: p.month, year: p.year, track: p.track, name: origin.name, email: origin.email,
        cvUrl: keepDocs ? existing.cvUrl : files.cv, clUrl: keepDocs ? existing.clUrl : files.cover,
        ndaUrl: keepDocs ? existing.ndaUrl : files.nda, emailPdfUrl: pdf, otherUrl: keepDocs ? existing.otherUrl : files.other,
        fileNames: keepDocs ? (existing.appFiles || "") : files.names.join(" | "),
        subject: cell_(subject, 500), body: cell_(body, 6000), msgId: msg.getId(), threadId: th.getId(),
        receivedAt: msgTs, late: late, filesFolder: folderUrl
      };
      filings.push(filing);
      // so a second thread for the same applicant in this same run is treated as a repeat, not a new record
      byKey[key] = { id: filing.cid, key: key, intakeTs: msgTs, cvUrl: filing.cvUrl, clUrl: filing.clUrl,
        ndaUrl: filing.ndaUrl, emailPdfUrl: filing.emailPdfUrl, otherUrl: filing.otherUrl, appFiles: filing.fileNames };
      if(filing.isNew) h.filed++; else h.updated++;
      label_(th, LBL.filed); applyMonthLabel_(th, p);
      if(late) h.late++;
      // Every applicant is answered, including one who wrote after the month closed. Before, a late application
      // was filed and then skipped here, so the nearest months — the ones whose deadline has already passed —
      // were the only ones nobody ever heard back from.
      if(filing.isNew && quota > 5 && !acked_(snap, ackKeys, key)){
        const ok = sendTemplate_(snap, "ack", origin.email, { Name: origin.name, FirstName: String(origin.name).split(" ")[0], Month: p.month + " " + p.year,
          Role: p.track === "Associate" ? "Associate role" : "internship",
          ShortlistDate: fmtDateIST(nextFuture_([dl.shortlistBy, dl.interviewBy, dl.approveBy])),
          ReplyBy: replyByPhrase_([dl.shortlistBy, dl.interviewBy, dl.approveBy]),
          LateNote: late ? lateNote_(p.month + " " + p.year, closeTs) : "" }, replyableThread_(th, origin.email));
        ackKeys.push(key); quota--; h.acked++;
        if(ok) mailLogs.push({ cid: filing.cid, mail: { ts: Date.now(), key: "ack", name: "Application acknowledgement", to: origin.email, ok: true, by: "Intake" } });
      }
    }catch(e){
      h.errors++; h.err = String(e && e.message || e).slice(0, 300);
      try{ label_(th, LBL.problem); recordProblem_(th, e); }catch(x){}
    }
  }
  try{
    withStore_(st => {
      filings.forEach(f => applyFiling_(st, f));
      ackKeys.forEach(k => { st.acked[k] = Date.now(); st.__dirty = true; });
      mailLogs.forEach(m => { const c = st.candidates[m.cid]; if(c){ c.mails.push(m.mail); bump_(st, c); } });
      applyCorrespondence_(st, corr);
    });
  }catch(e){ h.ok = false; h.err = "Could not update shared data: " + e.message; }
  // The Sheet is a read-only mirror now, written after the fact and never read back.
  try{ if(filings.length || corr.length) mirrorToSheet_(); }catch(e){ h.mirrorErr = String(e && e.message || e).slice(0, 160); }
  h.ms = Date.now() - t0; budgetAdd_(h.ms);
  health_("intake", h);
}

/** Newest message in the thread that carries real attachments and comes from (or forwards) an applicant.
 *  If no message has attachments, the newest message from an applicant is used instead, so an application
 *  sent without a CV is still filed (and flagged) rather than silently ignored. */
function pickMessage_(th, counselEmails){
  const msgs = th.getMessages();
  let fallback = null;
  for(let i = msgs.length - 1; i >= 0; i--){
    const m = msgs[i];
    const origin = resolveApplicant_(m, counselEmails);
    if(!origin) continue;
    let atts = []; try{ atts = m.getAttachments({ includeInlineImages: false }); }catch(e){}
    atts = atts.filter(a => !(/^image\//.test(a.getContentType()) && a.getSize() < 20000));
    if(atts.length) return { msg: m, origin, noFiles: false };
    if(!fallback) fallback = { msg: m, origin, noFiles: true };
  }
  return fallback;
}
function resolveApplicant_(msg, counselEmails){
  const from = cleanEmail(msg.getFrom());
  const internal = e => isBlockedAddress(e, INTERNAL) || counselEmails.indexOf(e) > -1;
  if(!internal(from)) return { email: from, name: senderName_(msg.getFrom(), from) };
  const body = fullBody_(msg);
  const m = body.match(/From:\s*"?([^"<\n]*?)"?\s*<([^>\s]+@[^>\s]+)>/i) || body.match(/From:\s*()([^\s<>@]+@[^\s<>]+)/i);
  if(!m) return null;
  const e = cleanEmail(m[2]);
  if(internal(e)) return null;
  return { email: e, name: (m[1] || "").trim() || e.split("@")[0] };
}
function senderName_(fromHeader, email){
  const m = String(fromHeader || "").match(/^\s*"?([^"<]+?)"?\s*</);
  let n = m ? m[1].trim() : email.split("@")[0];
  if(n === n.toLowerCase() || n === n.toUpperCase()) n = n.toLowerCase().replace(/(^|[\s.'-])([a-z])/g, (a, b, c) => b + c.toUpperCase());
  return n;
}
function fullBody_(msg){ try{ return msg.getPlainBody() || ""; }catch(e){ return ""; } }
/** The part of a reply the person actually wrote (drops the quoted earlier emails). */
function freshText_(body){
  const lines = String(body || "").split(/\r?\n/), out = [];
  for(const l of lines){ if(/^\s*>/.test(l) || /^On .{6,160} wrote:\s*$/.test(l) || /^-{2,}\s*(Original|Forwarded) Message/i.test(l) || /^From:\s/.test(l)) break; out.push(l); }
  return out.join("\n").trim().slice(0, 3000);
}
/** The current month and the next n-1, soonest first. */
function upcomingMonths_(n){
  const d = new Date(), out = [];
  for(let i = 0; i < n; i++){ const x = new Date(d.getFullYear(), d.getMonth() + i, 1); out.push({ month: MONTHS[x.getMonth()], year: x.getFullYear() }); }
  return out;
}
/** Gmail search phrases that catch the usual ways people write a month ("October 2026", "Oct '26", "10/2026"…). */
function monthTerms_(month, year){
  const m = MONTHS[monthIndex(month)], a = m.slice(0, 3), yy = String(year).slice(2), mm = String(monthIndex(month) + 1).padStart(2, "0");
  const t = ['"' + m + ' ' + year + '"', '"' + a + ' ' + year + '"', '"' + m + ', ' + year + '"', '"' + a + '-' + year + '"', '"' + m + " '" + yy + '"', '"' + a + " '" + yy + '"', '"' + mm + '/' + year + '"', '"' + year + '-' + mm + '"'];
  if(m === "September") t.push('"Sept ' + year + '"');
  return t;
}
/** A cohort still worth working on: its month has not started yet, or it is the current month and not closed. */
function isLiveCohort_(coh){
  if(!coh || coh.status === "closed") return false;
  const nowK = new Date().getFullYear() * 12 + new Date().getMonth();
  return (parseInt(coh.year, 10) * 12 + monthIndex(coh.month)) >= nowK;
}
/** Someone we still act for: in a live cohort, or an intern currently in chambers (incl. extended into a live month). */
function isLiveCandidate_(st, c){
  if(isLiveCohort_(st.cohorts[c.cohortId])) return true;
  if(c.stage === "joined" && (c.extensions || []).some(x => x.status !== "declined" && x.status !== "withdrawn" && isLiveCohort_(st.cohorts[x.targetCohortId]))) return true;
  const coh = st.cohorts[c.cohortId];
  if(c.stage === "joined" && coh){ const nowK = new Date().getFullYear() * 12 + new Date().getMonth(); return (parseInt(coh.year, 10) * 12 + monthIndex(coh.month)) >= nowK - 1; }
  return false;
}
function cohortRank_(month, year){
  const mi = monthIndex(month), y = parseInt(year, 10); if(mi < 0 || !y) return 999999;
  const now = new Date(), nowRank = now.getFullYear() * 12 + now.getMonth(), r = y * 12 + mi;
  return r < nowRank ? 500000 + r : r;
}
function cohortFromSnap_(st, month, year){
  const id = cohortIdFor(month, year);
  if(st.cohorts[id]) return st.cohorts[id];
  const k = Object.keys(st.cohorts).find(i => st.cohorts[i].month === month && String(st.cohorts[i].year) === String(year));
  return k ? st.cohorts[k] : null;
}

/* ----------------------- candidate replies & documents ----------------------- */
/** Recent inbox mail from people who are already candidates: replies become entries on their record; attachments
 *  named like an NDA / ID / CV are filed into the right slot. The AI later reads each reply's intent. */
function processReplies_(snap, folder, counselEmails, corr, h, t0){
  const byEmail = {};
  Object.keys(snap.candidates).forEach(id => { const c = snap.candidates[id]; const e = String(c.email || "").toLowerCase(); if(!e) return;
    if(!isLiveCandidate_(snap, c)) return;   // no work on past cohorts
    const cur = byEmail[e];
    if(!cur || (c.outcome !== "rejected" && (cur.outcome === "rejected" || (c.createdAt || 0) > (cur.createdAt || 0)))) byEmail[e] = c; });
  if(!Object.keys(byEmail).length) return;
  const seen = {};
  Object.keys(snap.candidates).forEach(id => { const c = snap.candidates[id]; (c.inbox || []).forEach(x => { if(x.msgId) seen[x.msgId] = 1; }); if(c.appMsgId) seen[c.appMsgId] = 1; });
  Object.keys(snap.applications || {}).forEach(id => { const a = snap.applications[id]; if(a && a.msgId) seen[String(a.msgId)] = 1; });
  const threads = GmailApp.search('in:inbox newer_than:4d -label:"' + LBL.notApp + '" -label:"Status/Ignored"', 0, 60);
  threads.forEach(th => {
    if(Date.now() - t0 > 120000) return;
    let touched = false;
    th.getMessages().forEach(m => {
      const id = m.getId(); if(seen[id]) return;
      const from = cleanEmail(m.getFrom());
      const c = byEmail[from]; if(!c) return;
      if(isBlockedAddress(from, INTERNAL) || counselEmails.indexOf(from) > -1) return;
      const subject = m.getSubject() || "", body = fullBody_(m);
      let atts = []; try{ atts = m.getAttachments({ includeInlineImages: false }).filter(a => !(/^image\//.test(a.getContentType()) && a.getSize() < 20000)); }catch(e){}
      // A (re-)application in its own thread is left to the application intake (it updates or creates the record),
      // whether or not it carries an attachment — otherwise it would be labelled Correspondence and never filed.
      const p = parseApplication(subject, "");
      if(isApplicationLike(subject, body) && p && th.getId() !== c.gmailThread) return;
      const fresh = freshText_(body);
      const item = { msgId: id, ts: m.getDate().getTime(), subject: cell_(subject, 200), text: fresh, threadId: th.getId(),
        link: gmailLink_(th.getId()), files: [], intent: heuristicIntent_(subject + "\n" + fresh, atts), handled: false, needsAi: true };
      const coh = snap.cohorts[c.cohortId] || {};
      const sub = candidateFolder_(cohortFolder_(folder, coh.label || "", { month: coh.month || "Unknown", year: coh.year || "" }), c.name, c.email);
      atts.forEach(a => {
        const n = (a.getName() || "").toLowerCase();
        let slot = "other";
        if(/(^|[^a-z])(nda|non[ _-]?disclos)/.test(n)) slot = "nda";
        else if(/(aadh?aar|pan[ _-]?card|passport|voter|driving|licen[cs]e|govt|government|identity|(^|[^a-z])id([^a-z]|$))/.test(n)) slot = "govtid";
        else if(/(^|[^a-z])(cv|resume|résumé|curriculum)/.test(n)) slot = "cv";
        else if(/(^|[^a-z])(cover|motivation)/.test(n)) slot = "cover";
        const f = sub.createFile(a.copyBlob()).setName((KIND_LABEL[slot] || "Attachment") + " — " + safeName_(a.getName()));
        shareFile_(f, (slot === "nda" || slot === "govtid") ? "private" : slot);
        item.files.push({ slot, name: a.getName(), url: f.getUrl() }); h.docs++;
      });
      corr.push({ cid: c.id, item }); seen[id] = 1; h.replies++; touched = true;
    });
    // A reply inside the application's own thread needs no label — the thread is already Filed.
    if(touched && !th.getLabels().some(l => l.getName() === LBL.filed || l.getName() === "Status/New")) label_(th, LBL.reply);
  });
}
function heuristicIntent_(text, atts){
  const t = String(text || "").toLowerCase();
  if(atts && atts.length) return "documents";
  if(/\b(withdraw|no longer (interested|available)|not be able to join|decline the offer)\b/.test(t)) return "withdraw";
  if(/\b(reschedul|(another|different|some other) (time|slot|date|day)|can'?t make|cannot make|unable to (attend|make)|not available)/.test(t)) return "rsvp_no";
  if(/\b(confirm|i('| a)?ll be (there|available)|works for me|see you|looking forward to the interview|i am available)/.test(t)) return "rsvp_yes";
  if(/\?/.test(t)) return "question";
  if(/\b(thank you|thanks)\b/.test(t) && t.length < 400) return "thanks";
  return "other";
}
/** Writes replies onto candidate records and reacts: RSVP, documents, withdrawals, questions. */
function applyCorrespondence_(st, corr){
  const now = Date.now();
  corr.forEach(x => {
    const c = st.candidates[x.cid]; if(!c) return;
    if((c.inbox || []).some(i => i.msgId === x.item.msgId)) return;
    c.inbox.push(x.item);
    x.item.files.forEach(f => {
      if(f.slot === "nda"){ if(!c.ndaUrl) applyChange(c, "ndaUrl", f.url, now); if((c.nda || {}).status === "pending") applyChange(c, "nda.status", "received", now); }
      else if(f.slot === "govtid"){ if(!c.govtIdUrl) applyChange(c, "govtIdUrl", f.url, now); }
      else if(f.slot === "cv" && !c.cvUrl) applyChange(c, "cvUrl", f.url, now);
      else if(f.slot === "cover" && !c.clUrl) applyChange(c, "clUrl", f.url, now);
      else applyChange(c, "otherUrl", c.otherUrl ? (c.otherUrl + " , " + f.url) : f.url, now);
    });
    if(x.item.files.some(f => f.slot === "cv" || f.slot === "cover")){ applyChange(c, "aiRequest", now, now); markCvFlag_(c, now); }   // re-read with the new document
    reactToIntent_(c, x.item, now);
    c.hist.push({ ts: now, by: "Gmail", txt: "Candidate wrote: “" + (x.item.subject || "(no subject)") + "”" + (x.item.files.length ? (" with " + x.item.files.map(f => f.name).join(", ")) : "") });
    bump_(st, c);
  });
}
function reactToIntent_(c, item, now){
  const i = item.intent;
  if(i === "rsvp_yes" && c.stage === "interview") applyChange(c, "ivConfirm", "yes", now);
  if(i === "rsvp_no" && c.stage === "interview"){ applyChange(c, "ivConfirm", "no", now); raiseFlag_(c, "rsvp_no", "warn", "Can't make the interview slot / asked to reschedule.", now); }
  if(i === "withdraw") raiseFlag_(c, "withdrew", "warn", "Wrote that they are withdrawing or can't join.", now);
  if(i === "question") raiseFlag_(c, "reply_" + item.msgId, "info", "Asked something — needs a reply: “" + String(item.text || item.subject).slice(0, 160) + "”", now, { msgId: item.msgId });
  if(item.files.some(f => f.slot === "nda")) c.hist.push({ ts: now, by: "Gmail", txt: "Signed NDA received by email — NDA marked 'e-copy received'" });
}
/** A flag is identified by type (+ optional suffix). Raising one that was resolved earlier keeps it resolved. */
function raiseFlag_(c, type, severity, text, now, extra){
  c.aiFlags = c.aiFlags || [];
  const id = type + "_" + c.id;
  const cur = c.aiFlags.find(f => f.id === id);
  if(cur){ if(!cur.resolved){ cur.text = text; cur.severity = severity; cur.ts = now; } return; }
  c.aiFlags.push(Object.assign({ id, type: /^reply_/.test(type) ? "reply" : type, severity, text, ts: now, resolved: false }, extra || {}));
}
function resolveFlag_(c, type, by, now){
  const f = (c.aiFlags || []).find(x => x.id === type + "_" + c.id && !x.resolved);
  if(f){ f.resolved = true; f.resolvedBy = by; f.resolvedAt = now; f.ts = now; }
}

/* ------------------------------ Drive files -----------------------------
 * Cohort Files / 2026-12 December / Aarav Mehta (aarav@example.com) / CV — CV_Aarav.pdf
 * One folder per candidate: their papers stay together, the whole folder can be opened or shared in one go,
 * and a month with two hundred applicants is no longer one flat list of six hundred files.
 */
function cohortFolder_(root, label, p){
  const mi = monthIndex(p.month);
  const name = mi > -1 ? (p.year + "-" + String(mi + 1).padStart(2, "0") + " " + MONTHS[mi]) : "Other";
  return subFolder_(root, name);
}
function subFolder_(parent, name){
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}
function safeName_(s){ return String(s == null ? "" : s).replace(/[\\\/\[\]\*\?:]+/g, " ").replace(/\s+/g, " ").trim(); }
/** The candidate's own folder inside the month. Named so it stays unique even if two people share a name. */
function candidateFolder_(monthFolder, name, email){
  const who = safeName_(name).slice(0, 60) || "Candidate";
  const mail = safeName_(email).toLowerCase();
  return subFolder_(monthFolder, mail ? (who + " (" + mail + ")") : who);
}
/** The first of these dates still to come, so an acknowledgement never promises a date that has passed. */
function nextFuture_(list){
  const now = Date.now();
  const hit = (list || []).filter(t => t && t > now).sort((a, b) => a - b);
  return hit.length ? hit[0] : 0;
}
function lateNote_(label, closeTs){
  return "One thing to be straight with you about: applications for " + label + " closed on " + fmtDateIST(closeTs) +
    ", and yours reached us after that. We will still read it. If a seat opens up for " + label + " we will come back to you, " +
    "and otherwise we will consider you for the month after — do tell us if that works for you.";
}
function effectiveSharing_(){ return (FILE_SHARING === "team" && TEAM_EMAILS.length) ? "team" : "link"; }
function shareFile_(f, kind){
  try{
    if(effectiveSharing_() === "link" && (kind === "cv" || kind === "cover" || kind === "email" || kind === "other")) f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    else f.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  }catch(e){}
}
const KIND_LABEL = { cv: "CV", cover: "Cover letter", nda: "NDA", govtid: "Govt ID", other: "Attachment", email: "Application email" };
function saveAttachments_(msg, folder, who, p){
  const out = { cv: "", cover: "", nda: "", other: "", names: [] };
  msg.getAttachments({ includeInlineImages: false }).forEach(a => {
    if(/^image\//.test(a.getContentType()) && a.getSize() < 20000) return;
    const n = (a.getName() || "").toLowerCase();
    out.names.push(a.getName());
    let kind = "other";
    if(/(^|[^a-z])(nda|non[ _-]?disclos)/.test(n)) kind = "nda";
    else if(/(^|[^a-z])(cover|motivation|statement[ _-]?of[ _-]?purpose|sop[^a-z])|(^|[^a-z])cl[ _.-]/.test(n)) kind = "cover";
    else if(/(^|[^a-z])(cv|resume|résumé|curriculum|bio[ _-]?data)([^a-z]|$)/.test(n)) kind = "cv";
    else if(!out.cv) kind = "cv";
    // The file already sits in this candidate's own folder inside the month, so the name only has to say what it is.
    const f = folder.createFile(a.copyBlob()).setName(KIND_LABEL[kind] + " — " + safeName_(a.getName()));
    shareFile_(f, kind === "nda" ? "private" : kind);
    const url = f.getUrl();
    if(kind === "other") out.other = out.other ? out.other + " , " + url : url;
    else if(!out[kind]) out[kind] = url; else out.other = out.other ? out.other + " , " + url : url;
  });
  return out;
}
function saveBodyPdf_(msg, folder, who, p){
  const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = "<h3>" + esc(msg.getSubject()) + "</h3><p><b>From:</b> " + esc(msg.getFrom()) + "<br><b>Date:</b> " + esc(msg.getDate()) +
    "</p><hr><div style='white-space:pre-wrap;font-family:Arial'>" + esc(fullBody_(msg)) + "</div>";
  const f = folder.createFile(Utilities.newBlob(html, "text/html").getAs("application/pdf").setName("Application email.pdf"));
  shareFile_(f, "email");
  return f.getUrl();
}
function driveId_(url){ const m = String(url || "").match(/[-\w]{25,}/); return m ? m[0] : ""; }
function trashUrls_(urls){ (urls || []).forEach(u => { const id = driveId_(u); if(id){ try{ DriveApp.getFileById(id).setTrashed(true); }catch(e){} } }); }
function applyFolderSharing_(folder){
  const added = [];
  const cur = folder.getViewers().concat(folder.getEditors()).map(u => u.getEmail().toLowerCase());
  TEAM_EMAILS.forEach(e => { e = String(e).trim().toLowerCase(); if(e && cur.indexOf(e) < 0){ try{ folder.addViewer(e); added.push(e); }catch(x){ Logger.log("Could not share with " + e + ": " + x.message); } } });
  if(effectiveSharing_() === "team"){ try{ folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE); }catch(e){} }
  return "✓ Files folder shared with " + TEAM_EMAILS.length + " team account(s)" + (added.length ? " (newly added: " + added.join(", ") + ")" : "") +
    "; file access: " + (effectiveSharing_() === "team" ? "team only" : "anyone with the link for CV/cover/email PDF (IDs and NDAs private)");
}

/* ------------------------------ Gmail labels ---------------------------
 * One family, "Cohort/…", so the whole intake sits together in Gmail's sidebar and nothing clashes with
 * labels you add yourself. Month labels are flat and start with the year-month, so they sort in date order.
 * The old "Status/…" and "Career/…" labels from v23 still work: they are excluded from the search so nothing
 * is re-processed, and migrateLabels() copies them across.
 */
const LBL = {
  filed:    "Cohort/Filed",               // on a candidate record
  reply:    "Cohort/Reply",               // a reply from someone already on file
  needsFix: "Cohort/Needs fix",           // month unreadable; the applicant was asked to resend
  notApp:   "Cohort/Not an application",  // invoice, newsletter, notice
  duplicate:"Cohort/Duplicate",           // an older or repeated copy of something already on file
  problem:  "Cohort/Problem"              // could not be processed — shown in the dashboard, with a Retry
};
const LBL_OLD = { "Status/New": "filed", "Status/Correspondence": "reply", "Status/Needs-fix": "needsFix",
  "Status/Ignored": "notApp", "Status/Superseded": "duplicate", "Status/Error": "problem" };
function label_(th, n){ th.addLabel(getLabel_(n)); }
function unlabel_(th, n){ const l = GmailApp.getUserLabelByName(n); if(l) th.removeLabel(l); }
function getLabel_(n){ return GmailApp.getUserLabelByName(n) || GmailApp.createLabel(n); }
/** "Cohort/2026-12 December" — one flat label per intake month, plus "Cohort/Associate" for the associate track. */
function monthLabel_(p){ const mi = monthIndex(p.month); return "Cohort/" + p.year + "-" + String(mi + 1).padStart(2, "0") + " " + MONTHS[mi]; }
function applyMonthLabel_(th, p){ label_(th, monthLabel_(p)); if(p.track === "Associate") label_(th, "Cohort/Associate"); }
function precreateLabels_(){ Object.keys(LBL).forEach(k => getLabel_(LBL[k])); }
/** Every label that means "the intake has already dealt with this thread" — new scheme and old. */
function handledLabels_(){ return Object.keys(LBL).map(k => LBL[k]).concat(Object.keys(LBL_OLD)); }
function notHandledQuery_(){ return handledLabels_().map(n => '-label:"' + n + '"').join(" "); }
/** One-off: give threads carrying a v23 label the matching new one. Safe to run again; stops after `budget` ms. */
function migrateLabels_(budget){
  const t0 = Date.now(); let moved = 0;
  Object.keys(LBL_OLD).forEach(oldName => {
    const neu = LBL[LBL_OLD[oldName]];
    for(let page = 0; page < 20; page++){
      if(Date.now() - t0 > (budget || 60000)) return moved;
      const hit = GmailApp.search('label:"' + oldName + '" -label:"' + neu + '"', 0, 100);
      if(!hit.length) break;
      hit.forEach(th => { try{ label_(th, neu); moved++; }catch(e){} });
      if(hit.length < 100) break;
    }
  });
  return moved;
}
function migrateLabels(){ const n = migrateLabels_(240000); Logger.log("Copied " + n + " thread(s) onto the new Cohort/… labels. The old Status/… and Career/… labels can now be deleted in Gmail."); return n; }

/* --------------------------- intake problems ---------------------------
 * A thread the intake could not process used to get Status/Error and vanish: excluded from every later search,
 * with nothing anywhere to say so. They are recorded here and shown on the dashboard's Review Desk, with a
 * Retry that takes the label off so the next run picks the thread up again.
 */
function recordProblem_(th, err){
  try{
    const list = intakeProblems_();
    const id = th.getId();
    const m = th.getMessages(), last = m[m.length - 1];
    const row = { threadId: id, subject: String(last.getSubject() || "").slice(0, 160), from: cleanEmail(last.getFrom()),
      when: Date.now(), err: String(err && err.message || err).slice(0, 220), link: gmailLink_(id) };
    const out = [row].concat(list.filter(x => x.threadId !== id)).slice(0, 50);
    PropertiesService.getScriptProperties().setProperty("intake_problems", JSON.stringify(out));
  }catch(e){}
}
function intakeProblems_(){ try{ return JSON.parse(PropertiesService.getScriptProperties().getProperty("intake_problems") || "[]"); }catch(e){ return []; } }
function clearProblem_(threadId){
  const list = intakeProblems_().filter(x => x.threadId !== threadId);
  PropertiesService.getScriptProperties().setProperty("intake_problems", JSON.stringify(list));
}
/** Dashboard action: take the Problem label off these threads so the next intake run tries them again. */
function retryIntake_(p){
  const ids = (p.ids || []).slice(0, 50); let n = 0;
  ids.forEach(id => {
    try{
      const th = GmailApp.getThreadById(id);
      if(th){ unlabel_(th, LBL.problem); unlabel_(th, "Status/Error"); n++; }
      clearProblem_(id);
    }catch(e){}
  });
  return { ok: true, retried: n };
}

const FALLBACK_TEMPLATES = {
  ack: { subject: "We have received your application — Chambers of Bharat Chugh",
    body: "Dear {{Name}},\n\nThank you for writing to us — your application for the {{Month}} {{Role}} has reached the Chambers of Bharat Chugh and has been logged for review.\n\n{{LateNote}}\nYou will hear from us on the outcome {{ReplyBy}}.\n\nWarm regards,\nThe Chambers of Bharat Chugh" },
  needsfix_internship: { subject: "A quick fix needed on your application — Chambers of Bharat Chugh",
    body: "Dear {{Name}},\n\nThank you for writing to us. We could not read the month you are applying for from your email.\n\nPlease send a FRESH email (a reply to this note will not be processed) with the subject exactly as:\nCareer - Internship for [Month] [Year]   (e.g. Career - Internship for September 2026)\n\nWarm regards,\nThe Chambers of Bharat Chugh" },
  needsfix_associate: { subject: "A quick fix needed on your application — Chambers of Bharat Chugh",
    body: "Dear {{Name}},\n\nThank you for writing to us. We could not read the month you wish to start from.\n\nPlease send a FRESH email (a reply to this note will not be processed) with the subject exactly as:\nCareer - Associate from [Month] [Year]   (e.g. Career - Associate from October 2026)\n\nWarm regards,\nThe Chambers of Bharat Chugh" },
  missing_docs: { subject: "Your application — one thing missing",
    body: "Dear {{Name}},\n\nThank you for applying for the {{Month}} {{Role}}. To review your application properly we also need {{MissingDocs}}. Please reply to this email with it attached.\n\nWarm regards,\nThe Chambers of Bharat Chugh" },
  iv_reminder: { subject: "Reminder — your interview tomorrow, {{Time}}",
    body: "Dear {{Name}},\n\nA reminder of your interview with the Chambers of Bharat Chugh tomorrow, {{Date}} at {{Time}}, {{InterviewMode}}.\nJoining details: {{InterviewLink}}\n\nIf anything has changed, please reply to this email.\n\nWarm regards,\nThe Chambers of Bharat Chugh" },
  nda_remind: { subject: "Gentle reminder — your signed NDA for the {{Month}} {{Role}}",
    body: "Dear {{Name}},\n\nA gentle reminder to send us the scanned copy of your signed NDA, and to bring a physical signed copy on your first day. If you have already sent it, please ignore this note.\n\nWarm regards,\nThe Chambers of Bharat Chugh" }
};
/** A thread we may answer in-place: only when its latest message came from the candidate (else a reply would go to a forwarder). */
function replyableThread_(th, email){
  try{ const m = th.getMessages(); return cleanEmail(m[m.length - 1].getFrom()) === cleanEmail(email) ? th : null; }catch(e){ return null; }
}
/** Sends one of the dashboard's email templates (as edited in the Playbook), falling back to built-in text.
 *  With a thread, it replies inside the applicant's own Gmail thread. */
function sendTemplate_(st, key, to, map, thread){
  const list = getSetting_(st, "emailTemplates", []) || [];
  const t = list.find(x => x.key === key) || FALLBACK_TEMPLATES[key];
  if(!t) return false;
  try{
    const subject = fillTokens(t.subject, map);
    const body = fillTokens(t.body, map).replace(/\n{3,}/g, "\n\n");   // an empty optional line leaves no gap
    if(thread && thread.reply) thread.reply(body, { name: "The Chambers of Bharat Chugh", subject: subject });
    else GmailApp.sendEmail(to, subject, body, { name: "The Chambers of Bharat Chugh" });
    return true;
  }catch(e){ Logger.log("Mail to " + to + " failed: " + e.message); return false; }
}
/** Sends a template to a candidate record with every placeholder filled (same values as the dashboard). */
function sendToCandidate_(st, c, key, extra){
  if(!c.email || isBlockedAddress(c.email, INTERNAL.concat(getSetting_(st, "noReplyList", []) || []))) return { ok: false, error: "no usable email" };
  const S = {}; ["officeLocation","reportingDetails","savedOptions"].forEach(k => S[k] = getSetting_(st, k, undefined));
  const map = buildTokens(c, st.cohorts[c.cohortId], S, extra);
  let th = null; if(c.gmailThread){ try{ th = replyableThread_(GmailApp.getThreadById(c.gmailThread), c.email); }catch(e){} }
  const ok = sendTemplate_(st, key, c.email, map, th);
  const tpl = ((getSetting_(st, "emailTemplates", []) || []).find(x => x.key === key) || {}).name || key;
  c.mails.push({ ts: Date.now(), key, name: tpl, to: c.email, ok, by: "Automation", err: ok ? "" : "send failed" });
  return { ok };
}

/* --------------------- an application → the shared data ---------------------
 * The shared data is the only source of truth. The intake does its slow work (Drive, Gmail) first, collects
 * plain objects, and then applies them all under one short lock. The Sheet is written afterwards as a mirror.
 */
function applyFiling_(st, f){
  const now = Date.now();
  const coh = ensureCohort_(st, f.month, f.year);
  let c = st.candidates[f.cid];
  if(!c){
    c = normalizeCandidate({ id: f.cid, key: f.key, cohortId: coh.id, name: f.name, email: f.email,
      track: /assoc/i.test(f.track) ? "associate" : "intern", source: "Application", stage: "applied",
      createdAt: f.receivedAt || now, updatedAt: now,
      hist: [{ ts: now, by: "Intake", txt: "Application filed from Gmail (" + String(f.subject || "").slice(0, 80) + ")" }] });
    st.candidates[f.cid] = c;
  } else {
    c.hist.push({ ts: now, by: "Intake", txt: "A newer application email arrived — the record was updated" });
    applyChange(c, "aiRequest", now, now);           // read it again, the documents may have changed
  }
  if(!c.key) applyChange(c, "key", f.key, now);
  ["cvUrl", "clUrl", "ndaUrl", "emailPdfUrl", "otherUrl"].forEach(k => { const v = String(f[k] || ""); if(v !== c[k]) applyChange(c, k, v, now); });
  if(f.filesFolder && c.filesFolder !== f.filesFolder) applyChange(c, "filesFolder", f.filesFolder, now);
  applyChange(c, "intakeTs", f.receivedAt || now, now);
  applyChange(c, "appMsgId", f.msgId || "", now);
  applyChange(c, "gmailThread", f.threadId || "", now);
  applyChange(c, "gmailUrl", gmailLink_(f.threadId), now);
  if(!!c.late !== !!f.late) applyChange(c, "late", !!f.late, now);
  // The subject, the body and the attachment names stay on the server: they are what the AI reads, and sending
  // several thousand characters per candidate to every device would make the sync many times heavier.
  st.applications[f.cid] = { subject: f.subject || "", body: f.body || "", files: f.fileNames || "",
    msgId: f.msgId || "", threadId: f.threadId || "", receivedAt: f.receivedAt || now };
  markCvFlag_(c, now);
  bump_(st, c);
  return c;
}
/** Has this applicant already been written to? Checks the store and anything queued in this same run. */
function acked_(st, pending, key){ return !!((st.acked && st.acked[key]) || (pending || []).indexOf(key) > -1); }

/* ---------------------------- the Sheet mirror ----------------------------
 * One tab, rewritten from the shared data, for anyone who would rather look at a spreadsheet. Nothing reads it
 * back, so editing it changes nothing — edit in the dashboard.
 */
const MIRROR_TAB = "Candidates";
const MIRROR_HEADERS = ["Cohort", "Received", "Name", "Email", "Phone", "Track", "Mode", "Year / PQE", "College", "City",
  "Stage", "Outcome", "Late", "Score", "AI score", "AI view", "Interview", "Approved", "NDA", "Extension",
  "CV", "Cover letter", "Folder", "Gmail", "Updated", "CandidateId"];
function mirrorToSheet_(st){
  st = st || loadStore_();
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(MIRROR_TAB) || ss.insertSheet(MIRROR_TAB);
  const safe = v => (typeof v === "string" && /^[=+\-@]/.test(v)) ? ("'" + v) : (v == null ? "" : v);
  const rows = Object.keys(st.candidates).map(id => st.candidates[id]).map(c => {
    const coh = st.cohorts[c.cohortId] || {}, ai = c.aiSuggest || {}, x = (c.extensions || []).slice(-1)[0];
    const sc = rubricScore(c.review, c.flags);
    return [coh.label || "", c.intakeTs ? new Date(c.intakeTs) : "", c.name, c.email, c.phone,
      c.track === "associate" ? "Associate" : "Intern", c.grantedMode || c.preferredMode || "",
      c.track === "associate" ? (c.pqe ? c.pqe + " yrs PQE" : "") : c.year, c.college, c.city,
      c.stage, c.outcome || "active", c.late ? "after close" : "", sc == null ? "" : sc,
      ai.score == null ? "" : ai.score, ai.recommendation || "", (c.interview || {}).result || "",
      (c.appr && (c.appr.mayank || c.appr.bypass)) ? "yes" : "", (c.nda || {}).status || "",
      x ? (x.targetLabel + " (" + x.status + ")") : "", c.cvUrl || "", c.clUrl || "", c.filesFolder || "", c.gmailUrl || "",
      new Date(c.updatedAt || 0), c.id];
  }).sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[2]).localeCompare(String(b[2])));
  sh.clearContents();
  sh.getRange(1, 1, 1, MIRROR_HEADERS.length).setValues([MIRROR_HEADERS]);
  if(rows.length) sh.getRange(2, 1, rows.length, MIRROR_HEADERS.length).setValues(rows.map(r => r.map(safe)));
  try{ sh.setFrozenRows(1); }catch(e){}
  return rows.length;
}

/* ----------------- one-time import of the old Applications tab -----------------
 * Up to v24 the Sheet was the intake ledger and the shared data was built from it. Nothing reads the Sheet any
 * more, so this runs once from setup() to carry any rows that are not already on a record across, and then
 * never again. It is safe to run twice: a row whose key is already on file is skipped.
 */
/** Raise (or clear) the "no CV" flag without any AI, so the Review Desk is useful even with the AI switched off. */
function markCvFlag_(c, now){
  if(c.cvUrl) resolveFlag_(c, "missing_cv", "Intake", now);
  else raiseFlag_(c, "missing_cv", "warn", "No CV came with the application. Ask for it, or paste the Drive link on the Profile tab.", now);
}
function importLegacySheet_(st, sh){
  const data = readRows_(sh);
  const idCol = data.head.indexOf("CandidateId") + 1;
  let created = 0, linked = 0, updated = 0;
  const byEmailCohort = {};
  Object.keys(st.candidates).forEach(id => { const c = st.candidates[id]; byEmailCohort[String(c.email).toLowerCase() + "|" + c.cohortId] = c; });
  const now = Date.now();
  data.rows.forEach(r => {
    const email = cleanEmail(r.Email), month = String(r.Month || ""), year = parseInt(r.Year, 10);
    if(!email || monthIndex(month) < 0 || !year) return;
    const key = String(r.Key || candidateKey(email, r.Track, month, year));
    if(st.deletedKeys[key]) return;
    let cid = String(r.CandidateId || "");
    if(cid && st.deleted[cid]) return;
    const coh = ensureCohort_(st, month, year);
    let c = cid ? st.candidates[cid] : null;
    if(!c){
      c = byEmailCohort[email + "|" + coh.id] || null;
      if(c){ if(!cid){ cid = c.id; sh.getRange(r._row, idCol).setValue(cid); } if(!c.key){ applyChange(c, "key", key, now); bump_(st, c); } linked++; }
    }
    const docs = { cvUrl: r["CV link"], clUrl: r["Cover link"], ndaUrl: r["NDA link"], emailPdfUrl: r["Email PDF"], otherUrl: r["Other files"] };
    const rowTs = r.Updated ? new Date(r.Updated).getTime() : (r.Received ? new Date(r.Received).getTime() : 0);
    const thread = String(r.ThreadId || "");
    if(!c){
      if(!cid){ cid = "c_" + Utilities.getUuid().replace(/-/g, "").slice(0, 14); sh.getRange(r._row, idCol).setValue(cid); }
      c = normalizeCandidate({ id: cid, key, cohortId: coh.id, name: String(r.Name || email.split("@")[0]), email,
        track: /assoc/i.test(r.Track) ? "associate" : "intern", source: "Application", stage: "applied",
        preferredMode: "", program: "", createdAt: rowTs || now, updatedAt: now, intakeTs: rowTs, late: String(r.Status) === "Late",
        appMsgId: String(r.MessageId || ""), gmailThread: thread, gmailUrl: gmailLink_(thread),
        hist: [{ ts: now, by: "Intake", txt: "Application filed from Gmail (" + String(r.Subject || "").slice(0, 80) + ")" }] });
      Object.keys(docs).forEach(k => { c[k] = String(docs[k] || ""); });
      st.candidates[cid] = c; markCvFlag_(c, now); bump_(st, c); created++;
      st.applications[cid] = { subject: String(r.Subject || ""), body: String(r.Body || ""), files: String(r.Files || ""),
        msgId: String(r.MessageId || ""), threadId: thread, receivedAt: rowTs || now };
    } else if(rowTs && rowTs > (c.intakeTs || 0)){
      Object.keys(docs).forEach(k => { if(docs[k] && docs[k] !== c[k]) applyChange(c, k, String(docs[k]), now); });
      applyChange(c, "intakeTs", rowTs, now);
      markCvFlag_(c, now);
      if(thread){ applyChange(c, "gmailThread", thread, now); applyChange(c, "gmailUrl", gmailLink_(thread), now); applyChange(c, "appMsgId", String(r.MessageId || ""), now); }
      if(c.intakeTs && (c.hist || []).length) { applyChange(c, "aiRequest", now, now); c.hist.push({ ts: now, by: "Intake", txt: "Newer application email received — documents updated" }); }
      bump_(st, c); updated++;
      st.applications[c.id] = { subject: String(r.Subject || ""), body: String(r.Body || ""), files: String(r.Files || ""),
        msgId: String(r.MessageId || ""), threadId: thread, receivedAt: rowTs || now };
    }
  });
  return { created, linked, updated, total: Object.keys(st.candidates).length };
}

/* ------------------------------ nightly (2 AM) ----------------------------- */
function nightly(){
  const t0 = Date.now(), h = { ok: true };
  try{ h.swept = autoSweepRejected(); }catch(e){ h.ok = false; h.err = e.message; }
  try{ h.mirrored = mirrorToSheet_(); }catch(e){ h.snapErr = e.message; }
  try{ h.ackPruned = pruneAcked_(); }catch(e){}
  h.ms = Date.now() - t0; budgetAdd_(h.ms);
  health_("nightly", h);
}
function autoSweepRejected(){
  if(!SWEEP_REJECTED_DAYS) return 0;
  const cutoff = Date.now() - SWEEP_REJECTED_DAYS * 864e5;
  let n = 0;
  withStore_(st => {
    Object.keys(st.candidates).forEach(id => {
      const c = st.candidates[id];
      if(c.outcome !== "rejected" || c.filesPurged) return;
      const when = (c._f && c._f.outcome) || c.updatedAt || 0;
      if(when > cutoff) return;
      const urls = [c.cvUrl, c.clUrl, c.emailPdfUrl, c.ndaUrl, c.govtIdUrl].concat(String(c.otherUrl || "").split(" , ")).filter(Boolean);
      if(!urls.length) return;
      trashUrls_(urls);
      const now = Date.now();
      ["cvUrl","clUrl","emailPdfUrl","otherUrl","ndaUrl","govtIdUrl"].forEach(k => applyChange(c, k, "", now));
      applyChange(c, "filesPurged", now, now);
      c.hist.push({ ts: now, by: "Auto-sweep", txt: "Drive files trashed (rejected more than " + SWEEP_REJECTED_DAYS + " days ago)" });
      bump_(st, c); n++;
    });
  });
  return n;
}
/** Keep the record of who has been written to from growing without limit. */
function pruneAcked_(){
  let n = 0;
  withStore_(st => {
    const keys = Object.keys(st.acked || {});
    if(keys.length <= 4000) return;
    keys.sort((a, b) => (st.acked[a] || 0) - (st.acked[b] || 0));
    keys.slice(0, keys.length - 3000).forEach(k => { delete st.acked[k]; n++; });
    st.__dirty = true;
  });
  return n;
}

/* ------------------------------ morning (9 AM) ----------------------------- */
/** Daily digest to the team, interview reminders, NDA reminders, and counsel review reminders. */
function morning(){
  const t0 = Date.now(), h = { ok: true, digest: false, ivReminders: 0, ndaReminders: 0, counselReminders: 0 };
  try{
    let quota = MailApp.getRemainingDailyQuota();
    withStore_(st => {
      const auto = automation_(st), now = Date.now();
      const tomorrow = Utilities.formatDate(new Date(now + 864e5), "Asia/Kolkata", "yyyy-MM-dd");
      Object.keys(st.candidates).forEach(id => {
        const c = st.candidates[id]; if(c.outcome === "rejected") return;
        const iv = c.interview || {};
        if(auto.ivReminders && quota > 10 && c.stage === "interview" && iv.date === tomorrow && iv.slot && !(c.mails || []).some(m => m.key === "iv_reminder" && m.ok && now - m.ts < 3 * 864e5)){
          if(sendToCandidate_(st, c, "iv_reminder").ok){ quota--; h.ivReminders++; } bump_(st, c);
        }
        const offer = (c.onboard || {}).offerSentAt || 0;
        const sentNda = (c.mails || []).filter(m => m.key === "nda_remind" && m.ok);
        if(auto.ndaReminders && quota > 10 && c.stage === "joined" && (c.nda || {}).status === "pending" && offer && now - offer > 3 * 864e5 && sentNda.length < 3 && (!sentNda.length || now - sentNda[sentNda.length - 1].ts > 3 * 864e5)){
          if(sendToCandidate_(st, c, "nda_remind").ok){ quota--; h.ndaReminders++; applyChange(c, "nda.remindedAt", now, now); } bump_(st, c);
        }
      });
      h.counselReminders = counselReminders_(st, quota); quota -= h.counselReminders;
      if(auto.digest && quota > 3){ const d = digestText_(st); if(d){ const to = digestRecipients_(st, auto); if(to.length){ GmailApp.sendEmail(to.join(","), d.subject, d.text, { name: "Cohort" }); h.digest = true; } } }
    });
  }catch(e){ h.ok = false; h.err = e.message; }
  h.ms = Date.now() - t0; budgetAdd_(h.ms);
  health_("morning", h);
}
function dailyReminders(){ morning(); }   // older timer name — kept so an old trigger still works
function digestRecipients_(st, auto){
  const tm = getSetting_(st, "teamEmails", {}) || {};
  const list = (auto.digestTo && auto.digestTo.length) ? auto.digestTo : Object.keys(tm).map(k => tm[k]).concat(TEAM_EMAILS);
  return list.map(e => cleanEmail(e)).filter((e, i, a) => /@/.test(e) && a.indexOf(e) === i);
}
/** Plain-text summary of what needs doing today, per open cohort. Returns null when there is nothing to say. */
function digestText_(st){
  const now = Date.now(), today = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd");
  const nowK = new Date().getFullYear() * 12 + new Date().getMonth();
  const cohorts = Object.keys(st.cohorts).map(k => st.cohorts[k]).filter(c => c.status !== "closed" && (c.year * 12 + monthIndex(c.month)) >= nowK)
    .sort((a, b) => (a.year * 12 + monthIndex(a.month)) - (b.year * 12 + monthIndex(b.month))).slice(0, 4);
  const all = Object.keys(st.candidates).map(k => st.candidates[k]);
  const lines = [];
  cohorts.forEach(co => {
    const cc = all.filter(c => c.cohortId === co.id), act = cc.filter(c => c.outcome !== "rejected");
    const fresh = cc.filter(c => now - (c.createdAt || 0) < 864e5);
    const rec = r => fresh.filter(c => c.aiSuggest && c.aiSuggest.recommendation === r).length;
    const applied = act.filter(c => c.stage === "applied");
    const ivToday = act.filter(c => c.stage === "interview" && (c.interview || {}).date === today).sort((a, b) => String(a.interview.slot).localeCompare(String(b.interview.slot)));
    const unmarked = act.filter(c => c.stage === "interview" && c.interview.date && c.interview.date < today && !c.interview.result);
    const awaiting = act.filter(c => c.stage === "final" && !(c.appr && (c.appr.mayank || c.appr.bypass)));
    const offer = act.filter(c => c.stage === "final" && c.appr && (c.appr.mayank || c.appr.bypass));
    const ext = all.filter(c => (c.extensions || []).some(x => x.status === "pending" && (x.targetCohortId === co.id || x.fromCohortId === co.id)));
    const flags = cc.reduce((n, c) => n + (c.aiFlags || []).filter(f => !f.resolved && f.severity !== "info").length, 0);
    const replies = cc.reduce((n, c) => n + (c.inbox || []).filter(i => !i.handled && ["question","rsvp_no","withdraw","reschedule"].indexOf(i.intent) > -1).length, 0);
    const failed = cc.filter(c => { const l = (c.mails || []).slice(-1)[0]; return l && !l.ok; }).length;
    const L = [];
    if(fresh.length) L.push("• " + fresh.length + " new application(s) in the last day" + (rec("shortlist") + rec("maybe") + rec("reject") ? " — AI: " + rec("shortlist") + " shortlist, " + rec("maybe") + " maybe, " + rec("reject") + " not now" : ""));
    if(applied.length) L.push("• " + applied.length + " waiting to be reviewed — shortlist by " + fmtDateIST((co.deadlines || {}).shortlistBy));
    if(ivToday.length) L.push("• Interviews today: " + ivToday.map(c => c.name + " " + fmtTime12(c.interview.slot)).join(", "));
    if(unmarked.length) L.push("• " + unmarked.length + " interview(s) held but not marked");
    if(awaiting.length) L.push("• " + awaiting.length + " finalist(s) awaiting Mayank Sir's approval");
    if(offer.length) L.push("• " + offer.length + " approved — offer not yet sent");
    if(ext.length) L.push("• " + ext.length + " extension request(s) pending");
    if(flags) L.push("• " + flags + " AI flag(s) to look at");
    if(replies) L.push("• " + replies + " candidate repl(ies) needing an answer");
    if(failed) L.push("• " + failed + " email(s) that failed to send");
    if(L.length) lines.push(co.label + "\n" + L.join("\n"));
  });
  if(!lines.length) return null;
  const url = getSetting_(st, "appUrl", "");
  return { subject: "Cohort — today (" + fmtDateIST(now) + ")", text: "Good morning. Here is what needs attention.\n\n" + lines.join("\n\n") + (url ? "\n\nOpen Cohort: " + url : "") + "\n\n— Cohort (switch this email off in Settings → Automation)" };
}
/** Counsel review reminders: every 2 days, at most 5, only to counsels who haven't answered. */
function counselReminders_(st, quota){
  const appUrl = getSetting_(st, "appUrl", ""); if(!appUrl) return 0;
  const endpoint = ScriptApp.getService().getUrl();
  const byKey = {};
  Object.keys(st.candidates).forEach(id => {
    const c = st.candidates[id], rr = c.reviewReq;
    if(!rr || !rr.active || c.stage !== "joined") return;
    (rr.counsels || []).forEach(x => {
      if(!x.key || !x.email) return;
      if((c.reviews || []).some(r => r.by === x.name && (r.round || "") === (rr.round || ""))) return;
      const g = byKey[x.key] || (byKey[x.key] = { x, round: rr.round || "", interns: [], cands: [] });
      g.interns.push({ id: c.id, name: c.name, sub: c.college || "" }); g.cands.push(c);
    });
  });
  const now = Date.now(); let sent = 0;
  Object.keys(byKey).forEach(k => {
    const g = byKey[k], x = g.x;
    const last = Math.max.apply(null, g.cands.map(c => { const e = c.reviewReq.counsels.find(y => y.key === k); return (e && e.lastReminder) || c.reviewReq.sentAt || 0; }));
    const count = Math.max.apply(null, g.cands.map(c => { const e = c.reviewReq.counsels.find(y => y.key === k); return (e && e.reminders) || 0; }));
    if(now - last < 2 * 864e5 - 3600000 || count >= 5 || quota - sent < 5) return;
    const link = reviewLink_(appUrl, endpoint, x, g.round, g.interns);
    const text = "Dear " + x.name + ",\n\nA gentle reminder to review the following intern(s):\n" + g.interns.map(i => "• " + i.name).join("\n") +
      "\n\nYour personal review link (it takes two minutes):\n" + link + "\n\nThank you,\nThe Chambers of Bharat Chugh";
    try{ GmailApp.sendEmail(x.email, "Reminder — intern review pending", text, { name: "The Chambers of Bharat Chugh" }); sent++; }catch(e){ return; }
    g.cands.forEach(c => {
      const arr = c.reviewReq.counsels.map(y => y.key === k ? Object.assign({}, y, { lastReminder: now, reminders: (y.reminders || 0) + 1 }) : y);
      applyChange(c, "reviewReq.counsels", arr, now);
      c.hist.push({ ts: now, by: "Reminder", txt: "Review reminder sent to " + x.name });
      bump_(st, c);
    });
  });
  return sent;
}
function reviewLink_(appUrl, endpoint, counsel, round, interns){
  const payload = JSON.stringify({ v: 2, e: endpoint, k: counsel.key, who: counsel.name, round: round, cohort: round, interns: interns });
  const b64 = Utilities.base64Encode(payload, Utilities.Charset.UTF_8);
  return String(appUrl).replace(/[^\/]*$/, "") + "CohortReview.dc.html#r=" + encodeURIComponent(b64);
}
