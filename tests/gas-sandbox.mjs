// A small fake Apps Script environment so the server code can actually be run and tested here.
// It is deliberately literal: searches really filter, labels really stick, Drive really stores blobs.
import fs from 'fs';
import vm from 'vm';
import { buildCoreGs } from '../cohort-data.js';

import path from 'path';
import { fileURLToPath } from 'url';
const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..') + '/';

export function makeEnv(opts = {}) {
  const now = opts.now || Date.UTC(2026, 10, 10, 6, 0, 0); // 10 Nov 2026, 11:30 IST
  let clock = now;
  const log = [];

  /* ---------------- Drive ---------------- */
  let fileSeq = 0;
  const files = new Map();      // id -> {id,name,mime,bytes,trashed,parent,sharing}
  const folders = new Map();    // id -> {id,name,parent,trashed}
  const mkFolder = (name, parent) => { const id = 'fold' + (++fileSeq); folders.set(id, { id, name, parent, trashed: false }); return folderApi(id); };
  const folderApi = (id) => ({
    getId: () => id, getName: () => folders.get(id).name, isTrashed: () => folders.get(id).trashed,
    getFoldersByName: (n) => { const hit = [...folders.values()].filter(f => f.parent === id && f.name === n && !f.trashed); let i = 0; return { hasNext: () => i < hit.length, next: () => folderApi(hit[i++].id) }; },
    createFolder: (n) => mkFolder(n, id),
    getFilesByName: (n) => { const hit = [...files.values()].filter(f => f.parent === id && f.name === n && !f.trashed); let i = 0; return { hasNext: () => i < hit.length, next: () => fileApi(hit[i++].id) }; },
    createFile: (a, b, c) => {
      let name, bytes, mime;
      if (typeof a === 'string') { name = a; bytes = Buffer.from(String(b ?? ''), 'utf8'); mime = c || 'text/plain'; }
      else { name = a.getName(); bytes = a.getBytes(); mime = a.getContentType(); }
      const fid = 'file' + (++fileSeq);
      files.set(fid, { id: fid, name, mime, bytes, trashed: false, parent: id, sharing: 'private' });
      return fileApi(fid);
    },
    searchFiles: () => ({ hasNext: () => false, next: () => null }),
    getViewers: () => [], getEditors: () => [], addViewer: () => {}, setSharing: () => {},
    getUrl: () => 'https://drive.google.com/drive/folders/' + id,
    getParents: () => { let i = 0; const p = folders.get(id).parent; return { hasNext: () => p && i === 0, next: () => { i++; return folderApi(p); } }; }
  });
  const fileApi = (id) => ({
    getId: () => id, getName: () => files.get(id).name, getMimeType: () => files.get(id).mime,
    getSize: () => files.get(id).bytes.length, isTrashed: () => files.get(id).trashed,
    setTrashed: (v) => { files.get(id).trashed = !!v; return fileApi(id); },
    setName: (n) => { files.get(id).name = n; return fileApi(id); },
    setSharing: (a) => { files.get(id).sharing = String(a); return fileApi(id); },
    getSharingAccess: () => files.get(id).sharing,
    getUrl: () => 'https://drive.google.com/file/d/' + id.padEnd(28, 'x') + '/view',
    getBlob: () => blob(files.get(id).bytes, files.get(id).mime, files.get(id).name),
    setContent: (s) => { files.get(id).bytes = Buffer.from(String(s), 'utf8'); return fileApi(id); },
    getParents: () => { let i = 0; const p = files.get(id).parent; return { hasNext: () => p && i === 0, next: () => { i++; return folderApi(p); } }; },
    getDataAsString: () => files.get(id).bytes.toString('utf8')
  });
  const blob = (bytes, mime, name) => ({
    getBytes: () => bytes, getContentType: () => mime, getName: () => name,
    getDataAsString: () => Buffer.from(bytes).toString('utf8'),
    setName: function (n) { name = n; return this; },
    copyBlob: function () { return blob(bytes, mime, name); },
    getAs: function (m) { return blob(bytes, m, name); }
  });
  const root = mkFolder('Cohort Files', null);
  const ROOT_ID = root.getId();
  const DriveApp = {
    getFolderById: (id) => { if (!folders.has(id)) throw new Error('No folder ' + id); return folderApi(id); },
    getFileById: (id) => { if (!files.has(id)) throw new Error('No item with the given ID could be found'); return fileApi(id); },
    Access: { PRIVATE: 'PRIVATE', ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' },
    Permission: { NONE: 'NONE', VIEW: 'VIEW' }
  };

  /* ---------------- Gmail ---------------- */
  let thSeq = 0, msgSeq = 0;
  const threads = [];           // {id, labels:Set, msgs:[{id,from,subject,body,date,atts:[]}]}
  const labels = new Map();
  const sent = [];
  function addThread(msgs) {
    const id = 'th' + (++thSeq);
    const t = { id, labels: new Set(), msgs: msgs.map(m => Object.assign({ id: 'msg' + (++msgSeq), date: clock, atts: [] }, m)) };
    threads.push(t); return t;
  }
  const attach = (name, mime, size) => ({ name, mime, size: size || 5000 });
  const msgApi = (t, m) => ({
    getId: () => m.id, getFrom: () => m.from, getSubject: () => m.subject,
    getPlainBody: () => m.body || '', getDate: () => new Date(m.date),
    getAttachments: () => (m.atts || []).map(a => blob(Buffer.alloc(a.size, 65), a.mime, a.name))
  });
  const threadApi = (t) => ({
    getId: () => t.id,
    getMessages: () => t.msgs.map(m => msgApi(t, m)),
    getFirstMessageSubject: () => t.msgs[0].subject,
    getLastMessageDate: () => new Date(t.msgs[t.msgs.length - 1].date),
    getLabels: () => [...t.labels].map(n => ({ getName: () => n })),
    addLabel: (l) => { t.labels.add(l.getName()); return threadApi(t); },
    removeLabel: (l) => { t.labels.delete(l.getName()); return threadApi(t); },
    reply: (body, o) => { sent.push({ kind: 'reply', thread: t.id, to: t.msgs[t.msgs.length - 1].from, body, opts: o }); }
  });
  // Honest-enough Gmail query evaluation: in:inbox, has:attachment, -has:attachment, newer_than, -label:, subject:"..", quoted phrases, OR groups.
  function matches(t, q) {
    const toks = tokenize(q);
    return toks.every(tk => evalTok(t, tk));
  }
  function tokenize(q) {
    const out = []; let i = 0;
    while (i < q.length) {
      if (/\s/.test(q[i])) { i++; continue; }
      if (q[i] === '(') { let d = 1, j = i + 1; while (j < q.length && d) { if (q[j] === '(') d++; if (q[j] === ')') d--; j++; } out.push({ or: q.slice(i + 1, j - 1) }); i = j; continue; }
      let j = i, inq = false;
      while (j < q.length && (inq || !/\s/.test(q[j]))) { if (q[j] === '"') inq = !inq; j++; }
      out.push({ t: q.slice(i, j) }); i = j;
    }
    return out;
  }
  function evalTok(t, tk) {
    if (tk.or) return tokenize(tk.or).filter(x => x.t !== 'OR').some(x => evalTok(t, x));
    let s = tk.t, neg = false;
    if (s[0] === '-') { neg = true; s = s.slice(1); }
    const r = term(t, s);
    return neg ? !r : r;
  }
  function term(t, s) {
    if (s === 'in:inbox') return !t.labels.has('__archived');
    if (s === 'has:attachment') return t.msgs.some(m => (m.atts || []).length);
    if (s.startsWith('newer_than:')) { const d = parseInt(s.slice(11), 10) || 400; return t.msgs.some(m => m.date > clock - d * 864e5); }
    if (s.startsWith('label:')) { const n = s.slice(6).replace(/^"|"$/g, '').replace(/-/g, ' ').toLowerCase(); return [...t.labels].some(l => l.replace(/-/g, ' ').toLowerCase() === n); }
    if (s.startsWith('subject:')) { const n = s.slice(8).replace(/^"|"$/g, '').toLowerCase(); return t.msgs.some(m => norm(m.subject).includes(norm(n))); }
    const n = s.replace(/^"|"$/g, '').toLowerCase();
    return t.msgs.some(m => norm(m.subject + ' ' + (m.body || '')).includes(norm(n)));
  }
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const GmailApp = {
    search: (q, start, max) => { const hit = threads.filter(t => matches(t, q)).sort((a, b) => b.msgs[b.msgs.length - 1].date - a.msgs[a.msgs.length - 1].date); return hit.slice(start || 0, (start || 0) + (max || 50)).map(threadApi); },
    getUserLabelByName: (n) => labels.has(n) ? { getName: () => n } : null,
    createLabel: (n) => { labels.set(n, 1); return { getName: () => n }; },
    getThreadById: (id) => { const t = threads.find(x => x.id === id); return t ? threadApi(t) : null; },
    sendEmail: (to, subject, body, o) => { sent.push({ kind: 'new', to, subject, body, opts: o }); },
    getUserLabels: () => [...labels.keys()].map(n => ({ getName: () => n }))
  };
  const MailApp = { getRemainingDailyQuota: () => 100, sendEmail: GmailApp.sendEmail };

  /* ---------------- Sheets ---------------- */
  const sheets = new Map();
  function sheetApi(name) {
    if (!sheets.has(name)) sheets.set(name, []);
    const rows = () => sheets.get(name);
    const api = {
      getName: () => name,
      getParent: () => ({ getName: () => 'Cohort Sheet', getUrl: () => 'https://docs.google.com/x' }),
      getLastRow: () => rows().length, getLastColumn: () => Math.max(1, ...rows().map(r => r.length)),
      appendRow: (r) => { rows().push(r.slice()); },
      setFrozenRows: () => api, clearContents: () => { sheets.set(name, []); }, getSheetId: () => 1,
      getRange: (r, c, nr, nc) => ({
        getValues: () => { const o = []; for (let i = 0; i < (nr || 1); i++) { const row = rows()[r - 1 + i] || []; const line = []; for (let j = 0; j < (nc || 1); j++) line.push(row[c - 1 + j] === undefined ? '' : row[c - 1 + j]); o.push(line); } return o; },
        setValues: (v) => { v.forEach((line, i) => { const ri = r - 1 + i; while (rows().length <= ri) rows().push([]); line.forEach((val, j) => { rows()[ri][c - 1 + j] = val; }); }); },
        setValue: (v) => { const ri = r - 1; while (rows().length <= ri) rows().push([]); rows()[ri][c - 1] = v; }
      })
    };
    return api;
  }
  const SpreadsheetApp = { openById: () => ({ getSheetByName: (n) => sheets.has(n) ? sheetApi(n) : null, insertSheet: (n) => sheetApi(n), getUrl: () => 'https://docs.google.com/x' }) };

  /* ---------------- misc ---------------- */
  const props = new Map();
  const PropertiesService = { getScriptProperties: () => ({ getProperty: (k) => (props.has(k) ? props.get(k) : null), setProperty: (k, v) => props.set(k, v), deleteProperty: (k) => props.delete(k) }) };
  const cache = new Map();
  const CacheService = { getScriptCache: () => ({ get: (k) => cache.get(k) || null, put: (k, v) => cache.set(k, v) }) };
  const LockService = { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) };
  const triggers = [];
  const ScriptApp = {
    getProjectTriggers: () => triggers.map(h => ({ getHandlerFunction: () => h })),
    deleteTrigger: () => {},
    newTrigger: (h) => { const b = { timeBased: () => b, everyMinutes: () => b, everyDays: () => b, atHour: () => b, create: () => triggers.push(h) }; return b; },
    getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/AAAA/exec' })
  };
  const pad = (n, w) => String(n).padStart(w, '0');
  const Utilities = {
    getUuid: () => 'uuid-' + Math.random().toString(16).slice(2) + '-' + Math.random().toString(16).slice(2),
    formatDate: (d, tz, fmt) => {
      const off = tz === 'Asia/Kolkata' ? 330 : 0; const x = new Date(d.getTime() + off * 60000);
      return fmt.replace('yyyy', x.getUTCFullYear()).replace('MMM', ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][x.getUTCMonth()])
        .replace('MM', pad(x.getUTCMonth() + 1, 2)).replace('dd', pad(x.getUTCDate(), 2)).replace('HH', pad(x.getUTCHours(), 2)).replace('mm', pad(x.getUTCMinutes(), 2))
        .replace('d', x.getUTCDate());
    },
    newBlob: (c, m, n) => blob(typeof c === 'string' ? Buffer.from(c, 'utf8') : Buffer.from(c), m, n),
    base64Encode: (s) => Buffer.from(String(s), 'utf8').toString('base64'),
    base64Decode: (s) => Buffer.from(String(s), 'base64'),
    sleep: () => {},
    Charset: { UTF_8: 'utf8' }
  };
  const Session = { getScriptTimeZone: () => 'Asia/Kolkata' };
  const Logger = { log: (s) => log.push(String(s)) };
  const MimeType = { GOOGLE_DOCS: 'application/vnd.google-apps.document', PDF: 'application/pdf' };
  const DocumentApp = { openById: () => ({ getBody: () => ({ getText: () => 'cv text' }) }) };
  const UrlFetchApp = { fetch: () => ({ getResponseCode: () => 200, getContentText: () => '{}' }) };
  const ContentService = { createTextOutput: (s) => ({ setMimeType: () => ({ getContent: () => s }) }), MimeType: { JSON: 'json', JAVASCRIPT: 'js' } };
  const CalendarApp = { getDefaultCalendar: () => ({ createEvent: () => ({ getId: () => 'ev1' }), getEventById: () => null }) };

  const sandbox = {
    DriveApp, GmailApp, MailApp, SpreadsheetApp, PropertiesService, CacheService, LockService, ScriptApp,
    Utilities, Session, Logger, MimeType, DocumentApp, UrlFetchApp, ContentService, CalendarApp,
    console, JSON, Math, Date, Object, Array, String, Number, Boolean, RegExp, Error, isNaN, parseInt, parseFloat, Set, Map, Promise, encodeURIComponent, decodeURIComponent
  };

  let src = buildCoreGs() + '\n';
  for (const f of ['Code.gs', 'WebApp.gs', 'AI.gs']) src += fs.readFileSync(REPO + 'gas/' + f, 'utf8') + '\n';
  // the settings block is placeholder text in the repo; point it at the fake services
  src = src.replace(/const SHEET_ID\s*=\s*"[^"]*"/, 'const SHEET_ID = "sheet1"')
    .replace(/const CV_FOLDER_ID\s*=\s*"[^"]*"/, 'const CV_FOLDER_ID = "' + ROOT_ID + '"')
    .replace(/const API_TOKEN\s*=\s*"[^"]*"/, 'const API_TOKEN = "tok-abcdefghijklmnopqrstuvwxyz"')
    .replace(/const GROQ_API_KEY\s*=\s*"[^"]*"/, 'const GROQ_API_KEY = "PASTE_YOUR_GROQ_API_KEY"')
    .replace(/const GEMINI_API_KEY\s*=\s*"[^"]*"/, 'const GEMINI_API_KEY = "PASTE_YOUR_GEMINI_API_KEY"');

  const ctx = vm.createContext(sandbox);
  vm.runInContext(src, ctx, { filename: 'gas-bundle.js' });

  return {
    ctx, call: (fn, ...args) => ctx[fn](...args),
    addThread, attach, threads, sent, labels, log, files, folders, sheets, ROOT_ID,
    setClock: (t) => { clock = t; },
    now: () => clock,
    store: () => JSON.parse(ctx.storeFile_().getDataAsString() || '{}'),
    labelsOf: (t) => [...t.labels].sort()
  };
}
