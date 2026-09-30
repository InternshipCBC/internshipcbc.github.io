// Cohort core — pure data functions shared by the dashboard AND the Google Apps Script.
// The Playbook embeds the source of every function below into Core.gs, so the browser and the
// server merge records, parse subjects and build cohorts with exactly the same code.
// Rules: every function is self-contained (no imports, no DOM, no Apps Script services),
// and only refers to MONTHS or to other functions in this file.

export const CORE_VERSION = 'v23';
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/** 'sept', 'September', 'SEP', 9 → 8 ; unknown → -1 */
export function monthIndex(m){
  if(typeof m === 'number') return (m >= 1 && m <= 12) ? m - 1 : -1;
  const s = String(m || '').trim().toLowerCase();
  if(!s) return -1;
  if(/^\d{1,2}$/.test(s)){ const n = parseInt(s, 10); return (n >= 1 && n <= 12) ? n - 1 : -1; }
  const k = s.slice(0, 3);
  return ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(k);
}

/** Deterministic cohort id — every device and the server agree without talking to each other. */
export function cohortIdFor(month, year){
  const mi = monthIndex(month), y = parseInt(year, 10);
  if(mi < 0 || !y) return '';
  return 'coh_' + y + '_' + String(mi + 1).padStart(2, '0');
}

/** Midnight IST of a calendar date, independent of the device / script time zone. */
export function istMidnight(year, monthIdx, day){
  return Date.UTC(year, monthIdx, day) - 330 * 60000;
}

/** Applications close 45 days before the month starts, then 5 days each for shortlist, interviews, approvals. */
export function defaultDeadlines(month, year){
  const mi = monthIndex(month), y = parseInt(year, 10);
  const start = istMidnight(y, mi, 1), D = 864e5;
  const close = start - 45 * D;
  return { applyClose: close, shortlistBy: close + 5 * D, interviewBy: close + 10 * D, approveBy: close + 15 * D };
}

export function mkCohort(month, year, now){
  const mi = monthIndex(month), y = parseInt(year, 10);
  const t = now || Date.now();
  return {
    id: cohortIdFor(mi + 1, y), month: MONTHS[mi], year: y, label: MONTHS[mi] + ' ' + y, status: 'active',
    targets: { offline: 8, online: 4, stipendOffline: 2, stipendOnline: 0, associate: 1 },
    onboard: { duration: 'a minimum of four weeks', startDate: istMidnight(y, mi, 1), whatsapp: '', preReads: 'the CBC Handbook (attached)', reporting: '', mapsLink: '' },
    deadlines: defaultDeadlines(mi + 1, y),
    createdAt: t, updatedAt: t, _f: {}
  };
}

export function nextMonthOf(month, year){
  let mi = monthIndex(month), y = parseInt(year, 10);
  mi++; if(mi > 11){ mi = 0; y++; }
  return { month: MONTHS[mi], year: y, label: MONTHS[mi] + ' ' + y, id: cohortIdFor(mi + 1, y) };
}

export function normalizeCohort(c){
  if(!c) return c;
  const mi = monthIndex(c.month);
  const y = parseInt(c.year, 10) || new Date().getFullYear();
  c.year = y;
  if(mi >= 0) c.month = MONTHS[mi];
  if(!c.label) c.label = c.month + ' ' + y;
  if(!c.status) c.status = 'active';
  const t = c.targets || (c.targets = {});
  ['offline','online','stipendOffline','stipendOnline','associate'].forEach((k, i) => { if(t[k] == null) t[k] = [8, 4, 2, 0, 1][i]; });
  const d = c.deadlines || (c.deadlines = {});
  if(mi >= 0){ const dd = defaultDeadlines(mi + 1, y); Object.keys(dd).forEach(k => { if(d[k] == null) d[k] = dd[k]; }); }
  const o = c.onboard || (c.onboard = {});
  if(o.duration == null) o.duration = 'a minimum of four weeks';
  if(o.startDate == null && mi >= 0) o.startDate = istMidnight(y, mi, 1);
  ['whatsapp','reporting','mapsLink'].forEach(k => { if(o[k] == null) o[k] = ''; });
  if(o.preReads == null) o.preReads = 'the CBC Handbook (attached)';
  if(c.createdAt == null) c.createdAt = c.updatedAt || Date.now();
  if(c.updatedAt == null) c.updatedAt = c.createdAt;
  if(!c._f) c._f = {};
  return c;
}

/** Fill every field a candidate record may need; migrates older record shapes in place. */
export function normalizeCandidate(c){
  if(!c) return c;
  const str = ['key','cohortId','name','email','phone','track','grantedMode','processMode','year','college','city','source','referredBy',
    'pqe','barEnrol','gradYear','currentRole','cvUrl','clUrl','emailPdfUrl','otherUrl','ndaUrl','govtIdUrl','stage','outcome','rejectReason','rejectedBy','notes','ivConfirm'];
  str.forEach(k => { if(c[k] == null) c[k] = ''; });
  if(c.preferredMode == null || c.preferredMode === undefined) c.preferredMode = c.mode === 'online' ? 'online' : (c.mode === 'offline' ? 'offline' : '');
  if(c.program == null) c.program = '';
  if(!c.track) c.track = 'intern';
  if(!c.stage) c.stage = 'applied';
  if(!c.processMode) c.processMode = 'online';
  if(!c.grantedMode && (c.stage === 'final' || c.stage === 'joined') && c.mode) c.grantedMode = c.mode;
  if(!c.interview) c.interview = {};
  const iv = c.interview;
  ['date','slot','by','link','result','notes'].forEach(k => { if(iv[k] == null) iv[k] = ''; });
  if(!iv.scores) iv.scores = { legal: null, clarity: null, curiosity: null, fit: null, integrity: null };
  if(!c.review) c.review = { ind: null, story: null, pass: null, show: null, orig: null };
  if(!c.flags) c.flags = {};
  ['template','sirMadam','nobody','shoddy'].forEach(k => { if(c.flags[k] == null) c.flags[k] = false; });
  if(!c.appr) c.appr = { mayank: '', bharat: '', bypass: null };
  if(!c.nda) c.nda = { status: 'pending', remindedAt: 0 };
  if(!c.stip) c.stip = { grant: false };
  if(!c.onboard) c.onboard = { offerSentAt: 0 };
  if(c.fav == null) c.fav = false;
  if(c.assocStar == null) c.assocStar = !!c.fav;
  ['reviews','apprNotes','hist','mails','extensions','inbox','aiFlags'].forEach(k => { if(!Array.isArray(c[k])) c[k] = []; });
  if(c.aiSuggest === undefined) c.aiSuggest = null;
  if(c.gmailThread == null) c.gmailThread = '';
  if(c.aiRequest == null) c.aiRequest = 0;
  if(!c.reviewReq) c.reviewReq = { active: false, sentAt: 0, round: '', counsels: [] };
  if(!Array.isArray(c.reviewReq.counsels)) c.reviewReq.counsels = [];
  if(c.ai === undefined) c.ai = null;
  // Old single-slot extension → the extensions list
  if(c.ext && !c.extensions.length && (c.ext.req || c.ext.decision || c.ext.appr === 'ok' || c.outcome === 'extended')){
    const e = c.ext;
    const approved = e.decision === 'approved' || e.appr === 'ok' || c.outcome === 'extended';
    c.extensions.push({ id: 'ext_' + c.id + '_1', fromCohortId: c.cohortId, targetCohortId: '', targetLabel: e.targetMonth || '',
      status: approved ? 'approved' : (e.decision === 'declined' ? 'declined' : 'pending'),
      requestedAt: e.requestedAt || c.updatedAt || 0, requestedBy: '', mayank: e.mayank || ((e.appr === 'ok' || (approved && !e.bypass)) ? 'ok' : ''), bharat: e.bharat || '',
      bypass: e.bypass || null, stipend: e.stipend || '', amount: e.stipendAmount || 11000, decidedAt: approved ? (c.updatedAt || 0) : 0, decidedBy: '', ts: c.updatedAt || 0 });
  }
  if(c.outcome === 'extended') c.outcome = '';
  if(c.createdAt == null) c.createdAt = c.updatedAt || Date.now();
  if(c.updatedAt == null) c.updatedAt = c.createdAt;
  if(!c._f) c._f = {};
  return c;
}

/** Set a (possibly nested, dot-separated) field and stamp when it changed — the unit of merging. */
export function applyChange(rec, path, value, ts){
  const parts = String(path).split('.');
  let o = rec;
  for(let i = 0; i < parts.length - 1; i++){ if(o[parts[i]] == null || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]]; }
  o[parts[parts.length - 1]] = value;
  if(!rec._f) rec._f = {};
  if(rec._f.$base == null) rec._f.$base = rec.updatedAt || 0;   // stamp for every field not yet individually stamped
  const key = parts.length > 2 ? parts[0] + '.' + parts[1] : path;
  rec._f[key] = ts;
  Object.keys(rec._f).forEach(k => { if(k.indexOf(key + '.') === 0) rec._f[k] = ts; });   // a whole-object write supersedes its sub-fields
  if(!(rec.updatedAt >= ts)) rec.updatedAt = ts;
  return rec;
}

/**
 * Merge two copies of the same record (candidate or cohort). Field-level last-writer-wins using the
 * per-field stamps in _f; nested objects merge per sub-field; histories, emails, notes, reviews and
 * extensions are unions. Ties keep `a`. Deterministic, so every device converges.
 */
export function mergeRecord(a, b){
  if(!a) return b; if(!b) return a;
  const NESTED = { interview: 1, appr: 1, nda: 1, review: 1, flags: 1, stip: 1, onboard: 1, targets: 1, deadlines: 1, reviewReq: 1 };
  const SPECIAL = { id: 1, _f: 1, _rev: 1, updatedAt: 1, hist: 1, mails: 1, reviews: 1, apprNotes: 1, extensions: 1, inbox: 1, aiFlags: 1 };
  const fa = a._f || {}, fb = b._f || {};
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const stamp = (r, f, p) => { if(f[p] != null) return f[p]; const top = p.split('.')[0]; if(f[top] != null) return f[top]; return f.$base != null ? f.$base : (r.updatedAt || 0); };
  const out = { id: a.id || b.id };
  const keys = {}; Object.keys(a).forEach(k => keys[k] = 1); Object.keys(b).forEach(k => keys[k] = 1);
  Object.keys(keys).forEach(k => {
    if(SPECIAL[k]) return;
    if(NESTED[k] && isObj(a[k]) && isObj(b[k])){
      const o = {}, sk = {};
      Object.keys(a[k]).forEach(s => sk[s] = 1); Object.keys(b[k]).forEach(s => sk[s] = 1);
      Object.keys(sk).forEach(s => {
        const p = k + '.' + s, ta = stamp(a, fa, p), tb = stamp(b, fb, p);
        o[s] = tb > ta ? b[k][s] : (s in a[k] ? a[k][s] : b[k][s]);
      });
      out[k] = o;
    } else {
      const ta = stamp(a, fa, k), tb = stamp(b, fb, k);
      out[k] = tb > ta ? b[k] : (k in a ? a[k] : b[k]);
    }
  });
  const f = {};
  Object.keys(fa).forEach(k => { f[k] = fa[k]; });
  Object.keys(fb).forEach(k => { f[k] = k === '$base' ? Math.min(f[k] != null ? f[k] : fb[k], fb[k]) : Math.max(f[k] || 0, fb[k]); });
  out._f = f;
  out.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
  const union = (la, lb, keyOf, pick) => {
    const m = {}, order = [];
    (la || []).concat(lb || []).forEach(x => {
      if(!x) return; const k = keyOf(x);
      if(!(k in m)){ m[k] = x; order.push(k); } else m[k] = pick ? pick(m[k], x) : m[k];
    });
    return order.map(k => m[k]);
  };
  if(a.hist || b.hist) out.hist = union(a.hist, b.hist, x => (x.ts || 0) + '|' + (x.txt || '')).sort((x, y) => (x.ts || 0) - (y.ts || 0));
  if(a.mails || b.mails) out.mails = union(a.mails, b.mails, x => (x.ts || 0) + '|' + (x.key || '') + '|' + (x.to || '')).sort((x, y) => (x.ts || 0) - (y.ts || 0));
  if(a.apprNotes || b.apprNotes) out.apprNotes = union(a.apprNotes, b.apprNotes, x => x.id || ((x.ts || 0) + '|' + (x.by || '')),
    (x, y) => Object.assign({}, x, y, { deleted: !!(x.deleted || y.deleted) })).sort((x, y) => (x.ts || 0) - (y.ts || 0));
  if(a.reviews || b.reviews) out.reviews = union(a.reviews, b.reviews, x => (x.by || '') + '|' + (x.round || ''), (x, y) => ((y.ts || 0) > (x.ts || 0) ? y : x));
  if(a.extensions || b.extensions) out.extensions = union(a.extensions, b.extensions, x => x.id, (x, y) => ((y.ts || 0) > (x.ts || 0) ? y : x));
  if(a.inbox || b.inbox) out.inbox = union(a.inbox, b.inbox, x => x.msgId || ((x.ts || 0) + '|' + (x.subject || '')),
    (x, y) => Object.assign({}, x, y, { handled: !!(x.handled || y.handled), handledBy: x.handledBy || y.handledBy || '' })).sort((x, y) => (x.ts || 0) - (y.ts || 0));
  if(a.aiFlags || b.aiFlags) out.aiFlags = union(a.aiFlags, b.aiFlags, x => x.id, (x, y) => {
    const n = (y.ts || 0) >= (x.ts || 0) ? y : x, o = n === y ? x : y;
    return Object.assign({}, o, n, { resolved: !!(x.resolved || y.resolved), resolvedBy: x.resolvedBy || y.resolvedBy || '', resolvedAt: Math.max(x.resolvedAt || 0, y.resolvedAt || 0) }); });
  return out;
}

export function candidateKey(email, track, month, year){
  return String(email || '').toLowerCase().trim() + '|' + (/assoc/i.test(String(track)) ? 'Associate' : 'Internship') + '|' + month + '|' + year;
}

export function cleanEmail(s){
  const m = String(s || '').match(/<([^>]+)>/);
  return (m ? m[1] : String(s || '')).trim().toLowerCase();
}

/** Exact address, exact domain, or a sub-domain of a listed domain. Never a loose substring match. */
export function isBlockedAddress(email, list){
  const e = cleanEmail(email);
  if(!e || e.indexOf('@') < 0) return true;
  const dom = e.split('@')[1];
  return (list || []).some(x => {
    const d = String(x || '').toLowerCase().trim(); if(!d) return false;
    if(d.indexOf('@') > -1) return e === d;
    return dom === d || dom.slice(-(d.length + 1)) === '.' + d;
  });
}

/**
 * Month / year / track from an application. The subject is trusted first; the body is only used for an
 * explicit "Month Year" pair. Month words must be whole words ("summary" is not March).
 * Returns {track, month, year} or null.
 */
export function parseApplication(subject, body){
  const MONRE = '(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)';
  const nowY = new Date().getFullYear();
  const okYear = y => y >= nowY - 1 && y <= nowY + 3;
  const toYear = s => { s = String(s).replace(/[^0-9]/g, ''); return s.length === 2 ? 2000 + parseInt(s, 10) : parseInt(s, 10); };
  const mIdx = w => ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(String(w).slice(0, 3).toLowerCase());
  function fromText(raw, strict){
    const t = ' ' + String(raw || '').toLowerCase().replace(/[‘’`]/g, "'").replace(/\s+/g, ' ') + ' ';
    let m = t.match(new RegExp('\\b' + MONRE + "\\b\\.?[\\s,\\-\\/]*('?)((?:20)\\d{2}|\\d{2})\\b"));
    if(m && (m[3].length === 4 || m[2] === "'" || /[\-\/]/.test(t.slice(m.index, m.index + m[0].length)))){
      const y = toYear(m[3]); if(okYear(y)) return { mi: mIdx(m[1]), y };
    }
    m = t.match(new RegExp('\\b(20\\d{2})[\\s,\\-\\/]*' + MONRE + '\\b'));
    if(m){ const y = toYear(m[1]); if(okYear(y)) return { mi: mIdx(m[2]), y }; }
    m = t.match(/\b(20\d{2})[\-\/.](0?[1-9]|1[0-2])\b/);
    if(m){ const y = toYear(m[1]); if(okYear(y)) return { mi: parseInt(m[2], 10) - 1, y }; }
    m = t.match(/\b(0?[1-9]|1[0-2])[\-\/.](20\d{2})\b/);
    if(m){ const y = toYear(m[2]); if(okYear(y)) return { mi: parseInt(m[1], 10) - 1, y }; }
    if(strict) return null;
    const words = t.match(new RegExp('\\b' + MONRE + '\\b', 'g')) || [];
    const mw = words.filter(w => w !== 'may')[0];
    const yy = t.match(/\b(20\d{2})\b/);
    if(mw && yy){ const y = toYear(yy[1]); if(okYear(y)) return { mi: mIdx(mw), y }; }
    return null;
  }
  const s = String(subject || '');
  let r = fromText(s, false);
  if(!r) r = fromText(String(body || '').slice(0, 1200), true);
  if(!r || r.mi < 0) return null;
  let track = 'Internship';
  if(/\bassociate\b/i.test(s)) track = 'Associate';
  else if(!/\bintern(ship)?s?\b/i.test(s) && /\b(associate (position|role|opening|opportunit)|position of (an )?associate|role of (an )?associate)/i.test(String(body || '').slice(0, 1500))) track = 'Associate';
  return { track: track, month: MONTHS[r.mi], year: r.y };
}

/** Does this email look like someone applying (as opposed to an invoice, a notice, a newsletter)? */
export function isApplicationLike(subject, body){
  const s = String(subject || '').toLowerCase();
  const b = String(body || '').slice(0, 1500).toLowerCase();
  if(/\bcareer\b/.test(s) && /\b(intern|internship|associate)\b/.test(s)) return true;
  if(/\b(intern|internship|internships|associate)\b/.test(s) && /\b(apply|applying|application|cv|resume|opportunit|position|role|for)\b/.test(s)) return true;
  if(/\b(intern|internship|associate position|associate role)\b/.test(b) && /\b(apply|applying|application|curriculum vitae|cv|resume|résumé|cover letter)\b/.test(b)) return true;
  return false;
}

export function fillTokens(text, map){
  return String(text || '').replace(/\{\{(\w+)\}\}/g, (m, k) => (map && map[k] != null) ? String(map[k]) : m);
}

/** Deep structural equality for plain JSON data (used to decide whether a merge changed anything). */
export function sameJson(a, b){
  return JSON.stringify(a) === JSON.stringify(b);
}

/** "1 Oct 2026" in Indian time, without relying on the runtime's locale support. */
export function fmtDateIST(ts){
  if(!ts) return 'TBC';
  const d = new Date(Number(ts) + 330 * 60000);
  return d.getUTCDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()] + ' ' + d.getUTCFullYear();
}
/** '17:30' → '5:30 pm' */
export function fmtTime12(hhmm){
  const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})/); if(!m) return 'TBC';
  const h = parseInt(m[1], 10); return ((h % 12) || 12) + ':' + m[2] + ' ' + (h < 12 ? 'am' : 'pm');
}
/** 'YYYY-MM-DD' (+ optional 'HH:MM') read as Indian time → epoch ms. */
export function istTs(dateStr, hhmm){
  const d = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})/); if(!d) return 0;
  const t = String(hhmm || '').match(/^(\d{1,2}):(\d{2})/);
  return Date.UTC(+d[1], +d[2] - 1, +d[3], t ? +t[1] : 0, t ? +t[2] : 0) - 330 * 60000;
}
/** The 0–100 score used everywhere: rubric average as a percentage, minus the red-line penalties. null if unrated. */
export function rubricScore(review, flags){
  const v = ['ind','story','pass','show','orig'].map(k => (review || {})[k]).filter(x => typeof x === 'number');
  if(!v.length) return null;
  let s = Math.round(v.reduce((a, b) => a + b, 0) / v.length / 5 * 100);
  const f = flags || {};
  if(f.template) s -= 30; if(f.sirMadam) s -= 30; if(f.nobody) s -= 20; if(f.shoddy) s -= 20;
  return Math.max(0, Math.min(100, s));
}
/** Fill-in values for every email template placeholder. Shared by the dashboard and the Google script. */
export function buildTokens(c, coh, S, extra){
  coh = coh || {}; S = S || {}; extra = extra || {};
  const dl = coh.deadlines || {}, ob = coh.onboard || {}, iv = c.interview || {};
  const office = S.officeLocation || 'at the Chambers in Defence Colony, New Delhi';
  const eff = c.grantedMode || c.preferredMode || 'offline';
  const reasons = (S.savedOptions && S.savedOptions.rejectReasons) || [];
  const map = {
    Name: c.name || 'Candidate', FirstName: String(c.name || 'there').split(' ')[0], Month: coh.label || '',
    Role: c.track === 'associate' ? 'Associate role' : 'internship',
    Mode: eff === 'online' ? 'online' : 'in person, ' + office,
    InterviewMode: c.processMode === 'online' ? 'online — over a video call (link below)' : 'in person, ' + office,
    GrantMode: eff === 'online' ? 'online' : 'in person (offline)',
    InterviewLink: iv.link || (c.processMode === 'online' ? '(link to follow)' : (S.reportingDetails || '')),
    Date: iv.date ? fmtDateIST(istTs(iv.date)) : 'TBC', Time: fmtTime12(iv.slot),
    ShortlistDate: fmtDateIST(dl.shortlistBy), InterviewDate: fmtDateIST(dl.interviewBy), ApproveDate: fmtDateIST(dl.approveBy),
    StartDate: fmtDateIST(ob.startDate), Duration: ob.duration || 'a minimum of four weeks', PreReads: ob.preReads || 'the CBC Handbook (attached)',
    Reporting: (ob.reporting || S.reportingDetails || '') + (ob.mapsLink ? ('\nLocation: ' + ob.mapsLink) : ''), ReportingDetails: S.reportingDetails || '',
    WhatsAppLink: ob.whatsapp || '(group link to follow)', Reason: c.rejectReason || reasons[0] || 'a very high volume of strong applications this month',
    MissingDocs: extra.missing || [(!c.cvUrl ? 'your CV' : ''), (!c.clUrl ? 'a short cover letter' : '')].filter(Boolean).join(' and ') || 'the missing documents'
  };
  const x = extra.ext || (c.extensions || []).filter(e => e.status === 'approved').slice(-1)[0];
  map.ExtensionMonth = x ? (x.targetLabel || 'the coming month') : 'the coming month';
  map.ExtensionMonths = map.ExtensionMonth;
  map.StipendAmount = '₹' + Number((x && x.amount) || 11000).toLocaleString('en-IN');
  map.StipendLine = x && x.stipend === 'yes' ? ('For the extended period you will receive a stipend of ' + map.StipendAmount + ' per month.') : '';
  return map;
}
/** Default automation switches (the dashboard can change every one of them). */
export function defaultAutomation(){
  return { aiFill: true, aiScore: true, autoShortlist: false, autoShortlistMin: 80, autoRejectIneligible: false,
    autoMissingDocs: false, ivReminders: false, ndaReminders: false, digest: true, digestTo: [], logReplies: true, calendarOnSchedule: false };
}
