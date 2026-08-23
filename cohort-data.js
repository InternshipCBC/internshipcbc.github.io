// Cohort — reference content: email templates, invitation posts, Apps Script sources.
// Business-logic/data only; all styling lives in the DC.

export const REVIEW_PARAMS = [
  {k:'drafting', label:'Drafting', hint:'Notes, applications, research memos'},
  {k:'research', label:'Legal research', hint:'Finds the right law, quickly'},
  {k:'punctuality', label:'Punctuality & reliability', hint:'On time, delivers when promised'},
  {k:'diligence', label:'Diligence & ownership', hint:'Sees a task through without chasing'},
  {k:'court', label:'Attention in court', hint:'Follows proceedings, takes useful notes'},
  {k:'analysis', label:'Analytical ability', hint:'Comprehends and solves complex problems'},
  {k:'initiative', label:'Initiative & street-smartness', hint:'Thinks ahead, resourceful'},
  {k:'zeal', label:'Zeal for law & work', hint:'Genuine hunger to learn and contribute'}
];
export const RECOMMEND_OPTIONS = [
  {v:'rec', label:'Worked with them — recommend', tone:'#34d399'},
  {v:'rec_no', label:'Worked with them — don\u2019t recommend', tone:'#fb7185'},
  {v:'no_op', label:'Worked with them — no strong view', tone:'#9fabb8'},
  {v:'na', label:'Haven\u2019t worked with them', tone:'#66727f'}
];

export const DEFAULT_TEMPLATES = [
  { key:'ack', tag:'ACK', group:'Acknowledgement', name:'Application acknowledgement',
    when:'Auto-sent the moment an application is filed',
    subject:'We have received your application — Chambers of Bharat Chugh',
    body:[
      'Dear {{Name}},','',
      'Thank you for writing to us — your application for the {{Month}} {{Role}} has reached the Chambers of Bharat Chugh, and has been logged for review.','',
      'We read every application ourselves, properly, so this takes a little time. You will hear from us on the outcome by {{ShortlistDate}}. If you are shortlisted, we will write with the next steps.','',
      'If you haven\u2019t already, do read our note on how the Chambers approaches internships and what we look for — it will tell you what we value.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'p2_accept', tag:'PHASE 2', group:'Phase 2 · Shortlisting', name:'Shortlisted — interview call',
    when:'Sent when a candidate is moved to the Interview stage',
    subject:'Your application for {{Month}} — an interview with the Chambers',
    body:[
      'Dear {{Name}},','',
      'We\u2019ve read your application closely, and we\u2019d like to take it forward. Congratulations — you\u2019ve been shortlisted for an interview for the {{Month}} {{Role}} at the Chambers of Bharat Chugh.','',
      'What happens next:',
      '1. A short interview, held {{InterviewMode}}, where we\u2019ll talk law, and about you. Your slot: {{Date}}, {{Time}}.',
      '   Joining details: {{InterviewLink}}',
      '2. If it goes well, you move to the final list, confirmed by {{ApproveDate}}.',
      '3. The internship runs for {{Duration}}.','',
      'Please reply to confirm the slot works for you. A few pointers: be ready to think aloud, to disagree with a proposition, and to talk about something you have actually read or worked on — not adjectives about yourself.','',
      'Looking forward to speaking with you.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'p2_reject', tag:'PHASE 2', group:'Phase 2 · Shortlisting', name:'Not shortlisted — after review',
    when:'Sent when an application is declined at Phase 2',
    subject:'Your application for {{Month}} — Chambers of Bharat Chugh',
    body:[
      'Dear {{Name}},','',
      'Thank you for applying, and for the thought you put into your application — we read it in full. This was a genuinely strong field for {{Month}}, and yours was a candidature we considered carefully.','',
      'On this occasion we are not able to take it forward, largely on account of {{Reason}}. That is a reflection of the number of seats and the depth of applications this month — not of your ability.','',
      'We would genuinely welcome an application from you for an upcoming month; please do write to us again. We wish you the very best.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'p3_accept', tag:'PHASE 3', group:'Phase 3 · Interview', name:'Selected after interview',
    when:'Sent when a candidate clears the interview (Finalist)',
    subject:'After your interview — {{Month}} {{Role}}, Chambers of Bharat Chugh',
    body:[
      'Dear {{Name}},','',
      'It was a pleasure speaking with you. Following your interview, we\u2019re glad to tell you that you have been selected for the {{Month}} {{Role}} at the Chambers of Bharat Chugh, subject to final confirmation.','',
      'What to expect:',
      '- Your place is being confirmed on the final list (by {{ApproveDate}}). We\u2019ll then send a short joining note with reporting details and {{Mode}} logistics.',
      '- The internship runs for {{Duration}}, starting {{StartDate}}.','',
      'Please reply to confirm you are able to join for {{Month}}.','',
      'Welcome aboard — we\u2019re looking forward to working with you.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'p3_reject', tag:'PHASE 3', group:'Phase 3 · Interview', name:'Not selected after interview',
    when:'Sent when a candidate is declined post-interview',
    subject:'After your interview — {{Month}}, Chambers of Bharat Chugh',
    body:[
      'Dear {{Name}},','',
      'Thank you for taking the time to interview with us — we enjoyed the conversation, and we want you to know the decision was a close one.','',
      'For {{Month}}, we are not able to offer you a place, on account of {{Reason}}. This is truly a function of very limited seats against a strong set of candidates who interviewed.','',
      'We would be happy to see you apply again for a future month — and, should you wish, we are glad to share brief feedback if you write to us. We wish you the very best for what lies ahead.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'offer', tag:'OFFER', group:'Phase 4 · Offer & joining', name:'Final confirmation / joining',
    when:'Sent once the candidate is confirmed. Attaches the Handbook & NDA below.',
    subject:'Confirmed — your {{Month}} {{Role}} at the Chambers of Bharat Chugh',
    body:[
      'Dear {{Name}},','',
      'This is to confirm your {{Role}} with the Chambers of Bharat Chugh for {{Month}}. Welcome — we are glad to have you with us.','',
      'Your joining details:',
      '- Duration: {{Duration}}, starting {{StartDate}}.',
      '- Mode: {{GrantMode}}.',
      '- Reporting: {{Reporting}}','',
      'Two attachments accompany this email:',
      '1. The CBC Handbook — our guide to the do\u2019s and don\u2019ts of the Chambers. Going through it is a great way to begin, and will help you find your feet quickly.',
      '2. The Non-Disclosure Agreement (NDA). This is mandatory. Please fill, sign, scan and email the signed copy back to us within one week of this mail, and bring a physical signed copy with you on your first day.','',
      '3. A copy of one valid Government photo ID (Aadhaar preferred) — please email a scan and bring it on Day 1.',
      'Do read {{PreReads}} before you start.','',
      'All coordination from here runs on our {{Month}} WhatsApp group — join here: {{WhatsAppLink}}','',
      'Please reply confirming the above works for you. If anything needs adjusting (dates or mode), tell us now and we\u2019ll sort it.','',
      'We look forward to working with you.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'nda_remind', tag:'NDA', group:'Phase 5 · Onboarding', name:'NDA reminder',
    when:'Sent from a candidate\u2019s NDA tracker when the signed copy is still awaited',
    subject:'Gentle reminder — your signed NDA for the {{Month}} {{Role}}',
    body:[
      'Dear {{Name}},','',
      'A gentle reminder to send us the scanned copy of your signed NDA, and to bring a physical signed copy on your first day. If you have already sent it, please ignore this note.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'ext_approved', tag:'PHASE 5', group:'Phase 5 · Onboarding', name:'Extension approved',
    when:'Sent when an internship extension is approved',
    subject:'Your extension at the Chambers of Bharat Chugh',
    body:[
      'Dear {{Name}},','',
      'We\u2019re glad to confirm that your extension with the Chambers has been approved. It has been a pleasure having you with us, and we\u2019re happy to have you stay on.','',
      'Your supervising counsel will speak with you about the work planned for the extended period.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'needsfix_internship', tag:'DEFECTS', group:'Defects / auto-replies', name:'Defects — Internship (auto)',
    when:'Auto-sent when an internship email\u2019s month/year can\u2019t be read',
    subject:'A quick fix needed on your application — Chambers of Bharat Chugh',
    body:[
      'Dear {{Name}},','',
      'Thank you for writing to us. We could not read the month you are applying for from your email.','',
      'Please send a FRESH email (a reply to this note will not be processed) with the subject exactly as:',
      'Career - Internship for [Month] [Year]   (e.g. Career - Internship for September 2026),',
      'writing the month and year in full.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'needsfix_associate', tag:'DEFECTS', group:'Defects / auto-replies', name:'Defects — Associate (auto)',
    when:'Auto-sent when an associate email\u2019s month/year can\u2019t be read',
    subject:'A quick fix needed on your application — Chambers of Bharat Chugh',
    body:[
      'Dear {{Name}},','',
      'Thank you for writing to us. We could not read the month you wish to start from from your email.','',
      'Please send a FRESH email (a reply to this note will not be processed) with the subject exactly as:',
      'Career - Associate from [Month] [Year]   (e.g. Career - Associate from October 2026),',
      'writing the month and year in full.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') }
];

export const DEFAULT_INVITE = [
  'The Chambers of Bharat Chugh — Internship Applications','',
  'The Chambers of Bharat Chugh invites applications for internships.','',
  'Duration: Minimum four weeks.',
  'Mode: Physical (office in Defence Colony, New Delhi) or Online.','',
  'Who may apply: Students from all years of a law programme are welcome to apply. While we consider every application on its merit, preference is ordinarily given to candidates in the 3rd year or above of a five-year programme, or the 2nd year or above of a three-year programme.','',
  'Before applying, please read how the Chambers approaches internships and what we look for in an application:',
  'https://bharatchugh.in/2021/03/13/internships-and-career-opportunities-at-the-chambers-of-bharat-chugh/','',
  'How to apply: Email your CV and a brief cover letter (both as PDF) to internship.cbc@gmail.com, indicating your preferred mode (physical/online).','',
  'Please name your files exactly as below, so we can process your application without delay:',
  '  \u2022 CV \u2014 CV_FirstName_LastName_Month_Year.pdf   (e.g. CV_Aarav_Mehta_September_2026.pdf)',
  '  \u2022 Cover letter \u2014 CoverLetter_FirstName_LastName_Month_Year.pdf','',
  'Subject line \u2014 this is mandatory. Your subject must read exactly:',
  'Career - Internship for [MONTH] [YEAR]     e.g. Career - Internship for September 2026',
  'The month and year must be written in full \u2014 "September 2026", not "Sept \u201926", "September-26" or "09/2026". Applications with an incorrect subject line may be delayed.','',
  '\u2014 The Chambers of Bharat Chugh'].join('\n');

export const DEFAULT_ASSOC_INVITE = [
  'The Chambers of Bharat Chugh — Associate Applications','',
  'The Chambers of Bharat Chugh invites applications for the role of Associate.','',
  'Who may apply: Law graduates and early-career advocates looking to build a litigation and advisory practice with the Chambers.',
  'Mode: Physical (office in Defence Colony, New Delhi).','',
  'Before applying, please read how the Chambers approaches careers and what we look for:',
  'https://bharatchugh.in/2021/03/13/internships-and-career-opportunities-at-the-chambers-of-bharat-chugh/','',
  'How to apply: Email your CV and a brief cover letter (both as PDF) to internship.cbc@gmail.com, mentioning the month you can start from.','',
  'Please name your files exactly as below:',
  '  \u2022 CV \u2014 CV_FirstName_LastName.pdf',
  '  \u2022 Cover letter \u2014 CoverLetter_FirstName_LastName.pdf','',
  'Subject line \u2014 this is mandatory. Your subject must read exactly:',
  'Career - Associate from [MONTH] [YEAR]     e.g. Career - Associate from October 2026',
  'The month and year must be written in full. "from" is the month you are available to begin.','',
  '\u2014 The Chambers of Bharat Chugh'].join('\n');

export const GMAIL_STEPS = [
  { n:1, title:'Create the label tree', detail:'Settings \u2192 See all settings \u2192 Labels \u2192 Create label. Build Career/Internship/2026/09 September and so on, plus the Status/ set. (Or let the Apps Script create them automatically on first run.)' },
  { n:2, title:'Filter incoming applications', detail:'Search box \u2192 filter icon \u2192 Subject contains "Career - Internship for" \u2192 Create filter \u2192 apply the Career/Internship label, Never send to Spam, Mark as important. Repeat for "Career - Associate from".' },
  { n:3, title:'Catch malformed subjects', detail:'A second filter: to:internship.cbc@gmail.com excluding the two correct subjects \u2192 apply Status/Needs-fix, so wrong-format applications stay visible and get an automatic nudge.' },
  { n:4, title:'Turn on Templates', detail:'Settings \u2192 Advanced \u2192 Templates: Enable. Save the accept/reject drafts as templates for any manual sends.' },
  { n:5, title:'Deploy the Apps Script', detail:'Paste both files at script.google.com, set the Sheet ID and Drive folder, run installTrigger() once and approve access. Applications now file themselves \u2014 no manual entry.' },
  { n:6, title:'Connect Cohort', detail:'Deploy the web app and paste its /exec URL plus the token into Settings \u2192 Sync. Share that same URL and token with the team so every device sees the same data.' }
];

export const SCRIPT_INTAKE = String.raw`/**
 * Cohort — Gmail intake automation (Code.gs)
 * Files applications automatically: reads month & year out of almost any subject,
 * keeps only the latest email per applicant per month, saves CV / cover / NDA to
 * Drive by fuzzy filename match, renders the email body to PDF, and pre-creates
 * 5 years of labels.
 * SETUP: 1) set SHEET_ID + CV_FOLDER_ID  2) Run > installTrigger once  3) approve access.
 */
const SHEET_ID     = "PASTE_YOUR_SHEET_ID";
const CV_FOLDER_ID = "PASTE_YOUR_DRIVE_FOLDER_ID";
const MONTHS = ["January","February","March","April","May","June","July",
  "August","September","October","November","December"];
const MON_ABBR = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,sept:8,oct:9,nov:10,dec:11};
const INTERNAL = ["internship.cbc@gmail.com", "bharatchugh.in", "contact@bharatchugh.in"];
var SWEEP_DAYS = 60;

function installTrigger(){
  ScriptApp.getProjectTriggers().forEach(function(t){ ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("processInbox").timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger("autoSweepRejected").timeBased().everyDays(1).atHour(3).create();
  precreateLabels();
}

/** ONE-SHOT: delete every Career/* and Status/* label and rebuild the clean tree. */
function resetLabels(){
  GmailApp.getUserLabels().forEach(function(l){
    var n = l.getName();
    if(n.indexOf("Career") === 0 || n.indexOf("Status") === 0){ try{ l.deleteLabel(); }catch(e){} }
  });
  precreateLabels();
}

function precreateLabels(){
  var y = new Date().getFullYear();
  getLabel("Career");
  ["Internship","Associate"].forEach(function(track){
    getLabel("Career/"+track);
    for(var yr=y; yr<=y+5; yr++){
      getLabel("Career/"+track+"/"+yr);
      for(var m=0;m<12;m++) getLabel("Career/"+track+"/"+yr+"/"+((m<9?"0":"")+(m+1)+" "+MONTHS[m]));
    }
  });
  getLabel("Status");
  ["New","Needs-fix","Superseded"].forEach(function(s){ getLabel("Status/"+s); });
}

function processInbox(){
  var sheet   = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Applications") || setupSheet();
  var folder  = DriveApp.getFolderById(CV_FOLDER_ID);
  var q = 'newer_than:400d to:internship.cbc@gmail.com -label:Status/New -label:Status/Needs-fix -label:Status/Superseded';
  var start = Date.now();
  var quota = MailApp.getRemainingDailyQuota();
  var reserve = 5;
  loadCaches(sheet);

  while(Date.now() - start < 280000){
    var threads = GmailApp.search(q, 0, 100);
    if(!threads.length) break;
    threads.sort(function(a,b){ return a.getMessages()[0].getDate() - b.getMessages()[0].getDate(); });

    for(var i=0;i<threads.length;i++){
      if(Date.now() - start > 280000) return;
      var th = threads[i];
      var msgs = th.getMessages();
      var msg = msgs[msgs.length-1];
      var subjBody = (msg.getSubject()||"") + "  " + fullBody(msg);

      var origin = resolveApplicant(msg);
      if(!origin){ label(th,"Status/Superseded"); continue; }

      var p = parseApplication(subjBody);
      var track = /assoc/.test(subjBody.toLowerCase()) ? "Associate" : "Internship";

      if(!p){
        label(th,"Status/Needs-fix");
        var nfKey = "nf|" + origin.email.toLowerCase();
        if(quota > reserve && !alreadyAckedKey(nfKey)){ sendNeedsFix(origin, track); recordAckKey(nfKey); quota--; }
        continue;
      }

      var email = origin.email;
      var key   = email.toLowerCase()+"|"+p.track+"|"+p.month+"|"+p.year;
      applyLabels(th, p);

      var existing = findRowByKey(sheet, key);
      if(existing && existing.date > msg.getDate().getTime()){ label(th,"Status/Superseded"); continue; }

      var files = classifyAndSave(msg, folder, origin.name, p);
      var bodyPdf = saveBodyPdf(msg, folder, origin.name, p);
      var row = [new Date(msg.getDate()), p.track, p.month, p.year, origin.name, email,
        files.cv, files.cover, files.nda, bodyPdf, files.other, "New", key];
      if(existing){ writeRow(sheet, existing.rowIndex, row); }
      else { sheet.appendRow(row); _keyMap[key]={rowIndex:sheet.getLastRow(), date:msg.getDate().getTime()}; }

      label(th,"Status/New");
      if(quota > reserve && !alreadyAcked(email, p)){ sendAck(origin, p); recordAck(email, p); quota--; }
    }
  }
}

/** Trash Drive files of candidates rejected more than SWEEP_DAYS ago. */
function autoSweepRejected(){
  var raw = readState(); if(!raw) return;
  var st; try{ st = JSON.parse(raw); }catch(e){ return; }
  var cutoff = Date.now() - SWEEP_DAYS*24*60*60*1000, changed = false;
  ((st && st.candidates) || []).forEach(function(c){
    if(c.outcome !== "rejected" || c.filesPurged) return;
    if((c.updatedAt || 0) > cutoff) return;
    var urls = [c.cvUrl, c.clUrl, c.emailPdfUrl, c.otherUrl, c.ndaUrl].filter(Boolean);
    if(!urls.length) return;
    purgeFiles(urls);
    c.cvUrl=""; c.clUrl=""; c.emailPdfUrl=""; c.otherUrl=""; c.ndaUrl="";
    c.filesPurged = Date.now();
    c.hist = c.hist || [];
    c.hist.push({ts:Date.now(), by:"Auto-sweep", txt:"Drive files purged (rejected > "+SWEEP_DAYS+" days)"});
    c.updatedAt = Date.now();
    changed = true;
  });
  if(changed){ st.updatedAt = Date.now(); writeState(JSON.stringify(st), st.updatedAt); }
}

/* ---------- subject / body parsing ---------- */
function parseApplication(text){
  var t = String(text||"").toLowerCase();
  var track = /assoc/.test(t) ? "Associate" : "Internship";
  var month = -1, year = -1;

  var y4 = t.match(/\b(20\d{2})\b/);
  if(y4) year = parseInt(y4[1],10);

  var mMatch = t.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*/);
  if(mMatch) month = MON_ABBR[mMatch[1]];

  if(month<0){
    var full = t.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
    if(full){
      var mm = parseInt(full[2],10);
      if(mm>=1 && mm<=12) month = mm-1;
      if(year<0){ var yy=full[3]; year = yy.length===4?parseInt(yy,10):2000+parseInt(yy,10); }
    } else {
      var num = t.match(/\b(0?[1-9]|1[0-2])[\/\-.](20\d{2}|\d{2})\b/);
      if(num){ month = parseInt(num[1],10)-1; if(year<0) year = num[2].length===4?parseInt(num[2],10):2000+parseInt(num[2],10); }
    }
  }

  if(year<0){
    var y2 = t.match(/['\u2019\u2018](\d{2})\b/) || t.match(/\b(?:sept?|[a-z]{3,9})[ ,.\-]+(\d{2})\b/);
    if(y2) year = 2000 + parseInt(y2[1],10);
  }

  if(month<0 || year<0) return null;
  if(year < 2024 || year > 2100) return null;
  return { track:track, month:MONTHS[month], year:year };
}

/* ---------- attachments ---------- */
function classifyAndSave(msg, folder, who, p){
  var out = { cv:"", cover:"", nda:"", other:"" };
  msg.getAttachments().forEach(function(a){
    var n = (a.getName()||"").toLowerCase();
    var f = folder.createFile(a.copyBlob()).setName(who+" - "+p.month+" "+p.year+" - "+a.getName());
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var url = f.getUrl();
    if(/\b(nda|non[ _-]?disclos)/.test(n)) out.nda = url;
    else if(/\b(cover|covering|motivation|\bcl[ _.-])/.test(n)) out.cover = url;
    else if(/\b(cv|resume|r\u00e9sum\u00e9|curriculum|bio[ _-]?data)/.test(n)) out.cv = url;
    else if(!out.cv) out.cv = url;
    else out.other = out.other ? out.other+" , "+url : url;
  });
  return out;
}
function saveBodyPdf(msg, folder, who, p){
  var html = "<h3>"+escapeHtml(msg.getSubject())+"</h3>"
    + "<p><b>From:</b> "+escapeHtml(msg.getFrom())+"<br><b>Date:</b> "+msg.getDate()+"</p><hr>"
    + "<div style='white-space:pre-wrap;font-family:Arial'>"+escapeHtml(msg.getPlainBody()||"")+"</div>";
  var pdf = Utilities.newBlob(html, "text/html").getAs("application/pdf")
              .setName(who+" - "+p.month+" "+p.year+" - Email.pdf");
  var f = folder.createFile(pdf);
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return f.getUrl();
}

/* ---------- sheet caches ---------- */
var _keyMap = null, _ackSet = null;
function loadCaches(sheet){
  _keyMap = {};
  var rows = sheet.getDataRange().getValues();
  for(var i=1;i<rows.length;i++){
    var k = String(rows[i][12]);
    if(k) _keyMap[k] = { rowIndex:i+1, date:new Date(rows[i][0]).getTime() };
  }
  _ackSet = {};
  var av = ackSheet().getRange("A:A").getValues();
  for(var j=0;j<av.length;j++){ if(av[j][0]) _ackSet[av[j][0]] = true; }
}
function findRowByKey(sheet, key){ return _keyMap ? (_keyMap[key]||null) : null; }
function writeRow(sheet, rowIndex, row){ sheet.getRange(rowIndex,1,1,row.length).setValues([row]); }
function setupSheet(){
  var sh = SpreadsheetApp.openById(SHEET_ID).insertSheet("Applications");
  sh.appendRow(["Received","Track","Month","Year","Name","Email","CV link","Cover link","NDA link","Email PDF","Other files","Status","Key"]);
  return sh;
}

/* ---------- labels & acknowledgements ---------- */
function label(th,n){ th.addLabel(getLabel(n)); }
function getLabel(n){ return GmailApp.getUserLabelByName(n) || GmailApp.createLabel(n); }
function applyLabels(th, p){
  var mi = MONTHS.indexOf(p.month);
  label(th, "Career/"+p.track+"/"+p.year+"/"+((mi<9?"0":"")+(mi+1)+" "+p.month));
}
function sendAck(origin, p){
  GmailApp.sendEmail(origin.email, "We have received your application — Chambers of Bharat Chugh",
    "Dear "+origin.name+",\n\nThank you for writing to us — your application for the "+p.track+" ("+p.month+" "+p.year+
    ") has reached the Chambers and has been logged for review.\n\nWarm regards,\nThe Chambers of Bharat Chugh",
    {name:"The Chambers of Bharat Chugh"});
}
function ackSheet(){
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName("Acked");
  if(!sh){ sh = ss.insertSheet("Acked"); sh.appendRow(["Key"]); }
  return sh;
}
function ackKey(email, p){ return String(email).toLowerCase()+"|"+p.track+"|"+p.month+"|"+p.year; }
function alreadyAcked(email, p){ return alreadyAckedKey(ackKey(email, p)); }
function recordAck(email, p){ recordAckKey(ackKey(email, p)); }
function alreadyAckedKey(key){ return _ackSet ? !!_ackSet[key] : false; }
function recordAckKey(key){ if(_ackSet) _ackSet[key]=true; ackSheet().appendRow([key]); }
function sendNeedsFix(origin, track){
  var line = track === "Associate"
    ? "Career - Associate from [Month] [Year]  (e.g. Career - Associate from October 2026)"
    : "Career - Internship for [Month] [Year]  (e.g. Career - Internship for September 2026)";
  GmailApp.sendEmail(origin.email, "A quick fix needed on your application — Chambers of Bharat Chugh",
    "Dear "+origin.name+",\n\nThank you for writing to us. We could not read the month you are applying for from your "+
    "email. Please send a FRESH email (a reply to this note will not be processed) with the subject exactly as:\n"+line+
    ",\nwriting the month and year in full.\n\nWarm regards,\nThe Chambers of Bharat Chugh",
    {name:"The Chambers of Bharat Chugh"});
}

/* ---------- applicant resolution ---------- */
function senderName(msg){ var m=msg.getFrom().match(/^"?([^"<]+?)"?\s*</); return m?m[1].trim():cleanEmail(msg.getFrom()); }
function cleanEmail(s){ var m=String(s||"").match(/<([^>]+)>/); return m?m[1]:String(s||"").trim(); }
function fullBody(msg){ try{ return msg.getPlainBody()||""; }catch(e){ return ""; } }
var _noReply = null;
function noReplyList(){
  if(_noReply) return _noReply;
  var list = INTERNAL.slice();
  try{
    var raw = readState();
    if(raw){
      var st = JSON.parse(raw);
      var extra = (st && (st.noReplyList || (st.settings && st.settings.noReplyList))) || [];
      extra.forEach(function(e){ if(e) list.push(String(e).toLowerCase()); });
    }
  }catch(e){}
  _noReply = list; return list;
}
function isNoReply(email){
  var e=String(email||"").toLowerCase();
  return noReplyList().some(function(d){ return e===d || e.indexOf(d)>-1; });
}
/** Direct email -> the sender. Forwarded by a counsel -> the original applicant. */
function resolveApplicant(msg){
  var from = cleanEmail(msg.getFrom());
  if(!isNoReply(from)) return { email:from, name:senderName(msg) };
  var body = fullBody(msg);
  var m = body.match(/From:\s*"?([^"<\n]*?)"?\s*<([^>]+@[^>]+)>/i);
  if(!m){
    var m2 = body.match(/From:\s*([^\s<>@]+@[^\s<>]+)/i);
    if(m2) return { email:m2[1].trim(), name:m2[1].split("@")[0] };
    return null;
  }
  var oemail = m[2].trim();
  if(isNoReply(oemail)) return null;
  return { email:oemail, name:(m[1]||"").trim() || oemail.split("@")[0] };
}
function escapeHtml(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }`;

export const SCRIPT_WEBAPP = String.raw`/**
 * Cohort — web-app endpoint (WebApp.gs)
 * Serves applications + the shared team state to every device, saves state back,
 * and sends emails (with Drive attachments) on the Chambers' behalf.
 * Deploy: Deploy > New deployment > Web app > Execute as Me, Access: Anyone.
 * Paste the /exec URL + this token into Cohort > Settings > Sync — and give the
 * same two values to every teammate so all devices share one dataset.
 */
const API_TOKEN = "set-a-long-secret-and-match-it-in-cohort";   // <-- change me
const STATE_SHEET = "State";

function doGet(e){
  var p = (e && e.parameter) || {};
  if((p.token||"") !== API_TOKEN) return reply(e, {error:"unauthorized"});
  if(p.action === "aiChat") return reply(e, (typeof aiChatFn==="function") ? aiChatFn(p.q, p.cohort) : {error:"AI.gs not installed"});
  if(p.action === "vetMail") return reply(e, (typeof aiVetMailFn==="function") ? aiVetMailFn(p.subject, p.body, p.ctx) : {error:"AI.gs not installed"});
  return reply(e, { ok:true, state: readState(), applications: readApplications(), updatedAt: readUpdatedAt() });
}
/** JSONP-aware: a ?callback= wraps the JSON so a <script> tag can read it cross-origin. */
function reply(e, obj){
  var s = JSON.stringify(obj);
  var cb = e && e.parameter && e.parameter.callback;
  if(cb) return ContentService.createTextOutput(cb+"("+s+")").setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e){
  var body = {};
  try { body = JSON.parse(e.postData.contents||"{}"); } catch(err){ return json({error:"bad json"}); }
  if((body.token||"") !== API_TOKEN) return json({error:"unauthorized"});
  switch(body.action){
    case "saveState":    writeState(body.state, body.updatedAt); return json({ok:true});
    case "sendEmail":    sendEmail(body); return json({ok:true});
    case "updateStatus": setStatus(body.email, body.status); return json({ok:true});
    case "purgeFiles":   purgeFiles(body.urls); return json({ok:true});
    case "saveReview":   saveReview(body); return json({ok:true});
    case "vetPending":   return json((typeof aiVetPending==="function")?aiVetPending():{ok:false,reason:"AI.gs not installed"});
    case "uploadFile":   return json(uploadFile(body));
    default: return json({error:"unknown action"});
  }
}
function saveReview(body){
  var raw = readState(); if(!raw) return;
  var st; try{ st = JSON.parse(raw); }catch(e){ return; }
  var rv = body.review||{}; rv.ts = Date.now();
  (st.candidates||[]).forEach(function(c){
    if(c.id !== body.id) return;
    c.reviews = c.reviews || [];
    var i = -1; for(var k=0;k<c.reviews.length;k++){ if((c.reviews[k].by||"") === (rv.by||"")) { i=k; break; } }
    if(i>=0) c.reviews[i] = rv; else c.reviews.push(rv);   // one review per counsel, latest wins
    c.updatedAt = Date.now();
  });
  st.updatedAt = Date.now();
  writeState(JSON.stringify(st), st.updatedAt);
}
function sendEmail(body){
  var opts = { name:"The Chambers of Bharat Chugh" };
  var to = cleanEmail(body.to);
  if(!to || isBlocked_(to)) return;   // server-side backstop: never email a restricted/internal address
  var att = (body.attachments||[]).map(driveBlob).filter(function(b){ return b; });
  if(att.length) opts.attachments = att;
  GmailApp.sendEmail(to, body.subject, body.text, opts);
}
// Restricted-recipient backstop. INTERNAL (our inbox + Chambers domains) is always blocked;
// the rest is read from the shared State's noReplyList, so the dashboard's Restricted-emails list is enforced here too.
function isBlocked_(email){
  var e = String(email||"").toLowerCase().trim();
  if(!e) return true;
  var list = INTERNAL.slice();
  try{ var st = JSON.parse(readState()||"{}"); (st.noReplyList||[]).forEach(function(x){ if(x) list.push(String(x).toLowerCase()); }); }catch(err){}
  return list.some(function(d){ return e === d || e.split("@")[1] === d || e.indexOf(d) > -1; });
}
function driveBlob(url){
  try{ var m=String(url).match(/[-\w]{25,}/); if(!m) return null; return DriveApp.getFileById(m[0]).getBlob(); }
  catch(e){ return null; }
}
function purgeFiles(urls){
  (urls||[]).forEach(function(u){
    try{ var m=String(u).match(/[-\w]{25,}/); if(m) DriveApp.getFileById(m[0]).setTrashed(true); }catch(e){}
  });
}
/** Save a dashboard upload to Drive and write its link into the shared State. */
function uploadFile(body){
  var folder = DriveApp.getFolderById(CV_FOLDER_ID);
  var bytes = Utilities.base64Decode(body.dataBase64||"");
  var blob = Utilities.newBlob(bytes, body.mime||"application/octet-stream", body.name||"upload");
  var nm = (body.who||"Candidate")+" - "+(body.month||"")+" - "+(body.slot||"file")+" - "+(body.name||"upload");
  var f = folder.createFile(blob).setName(nm);
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = f.getUrl();
  var field = {cv:"cvUrl", cover:"clUrl", nda:"ndaUrl", govtid:"govtIdUrl", other:"otherUrl"}[body.slot] || "otherUrl";
  var raw = readState();
  if(raw){
    var st = null;
    try{ st = JSON.parse(raw); }catch(e){}
    if(st){
      (st.candidates||[]).forEach(function(c){ if(c.id===body.id){ c[field]=url; c.updatedAt=Date.now(); } });
      st.updatedAt = Date.now();
      writeState(JSON.stringify(st), st.updatedAt);
    }
  }
  return {ok:true, url:url, slot:body.slot, id:body.id};
}

function stateSheet(){ var ss=SpreadsheetApp.openById(SHEET_ID); return ss.getSheetByName(STATE_SHEET)||ss.insertSheet(STATE_SHEET); }
function readState(){ return stateSheet().getRange("A1").getValue()||""; }
function readUpdatedAt(){ return stateSheet().getRange("B1").getValue()||0; }
function writeState(j,u){ var sh=stateSheet(); sh.getRange("A1").setValue(j||""); sh.getRange("B1").setValue(u||Date.now()); }
function readApplications(){
  var sh=SpreadsheetApp.openById(SHEET_ID).getSheetByName("Applications"); if(!sh) return [];
  var rows=sh.getDataRange().getValues(); if(rows.length<2) return [];
  var head=rows.shift();
  return rows.map(function(r){ var o={}; head.forEach(function(h,i){ o[h]=r[i]; }); return o; });
}
function setStatus(email,status){
  var sh=SpreadsheetApp.openById(SHEET_ID).getSheetByName("Applications"); if(!sh) return;
  var rows=sh.getDataRange().getValues();
  for(var i=1;i<rows.length;i++){ if(String(rows[i][5]).indexOf(email)>-1) sh.getRange(i+1,12).setValue(status); }
}
function cleanEmail(s){ var m=String(s||"").match(/<([^>]+)>/); return m?m[1]:String(s||"").trim(); }
function json(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }`;

export const SCRIPT_GROQ = String.raw`/**
 * Cohort — AI vetting (AI.gs)  ·  Qwen2.5-32B via Groq (cloud, free tier)
 * Runs on Google's servers: a time trigger vets new applications 24/7; the dashboard
 * can also trigger an immediate pass when any device comes online.
 * SETUP: 1) paste this file  2) set GROQ_API_KEY  3) Run > installAiTrigger once (approve access).
 * It shares SHEET_ID / readState / writeState with your other two files (same project).
 */
const GROQ_API_KEY = "PASTE_YOUR_GROQ_API_KEY";     // <-- from console.groq.com/keys
const GROQ_MODEL   = "qwen-2.5-32b";                // Qwen2.5-32B on Groq
const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions";
const AI_BATCH     = 20;                              // per pass (well under free-tier limits)

// The rulebook Qwen follows. Edit wording here to change how it judges — no code change needed.
const AI_SYSTEM = [
  "You are the intake officer for the Chambers of Bharat Chugh, an Indian law office.",
  "You read one incoming email (subject + body + sender) and return STRICT JSON only.",
  "Classify the email's TYPE as exactly one of:",
  "  fresh      — a genuine first-time application from the candidate themselves.",
  "  followup   — a reply/follow-up/reminder from someone who has already applied (NOT a new application).",
  "  forward    — a candidate's application forwarded in by a third party (a counsel, a referrer).",
  "  automated  — a no-reply/system/marketing mail (Google, GitHub, LinkedIn, calendar, etc.). Never a person applying.",
  "  duplicate  — same person, same month, already seen.",
  "Understand meaning, synonyms, misspellings, acronyms and odd phrasing — do NOT rely on keywords or word order.",
  "For fresh/forward, extract the ORIGINAL APPLICANT (not the forwarder): name, email.",
  "Extract when present: track (internship|associate), month, year (4-digit), preferredMode (offline|online),",
  "  yearOfStudy (e.g. '3rd Year' or 'Graduated'), program ('5yr'|'3yr'), college, city, phone.",
  "If TYPE is followup and no original application is evident, set originalMissing=true so a human can locate it.",
  "Also return: needsFix=true if month/year cannot be determined; hasCV, hasCover, hasNDA, hasGovtId (booleans from attachment names/mentions);",
  "  rsvp = 'yes'|'no'|'' if the email confirms/declines an interview slot; confidence 0-1; and a one-line summary.",
  "Return ONLY this JSON shape, no prose:",
  '{"type":"","applicant":{"name":"","email":""},"track":"","month":"","year":"","preferredMode":"","yearOfStudy":"","program":"","college":"","city":"","phone":"","originalMissing":false,"needsFix":false,"hasCV":false,"hasCover":false,"hasNDA":false,"hasGovtId":false,"rsvp":"","confidence":0,"summary":""}'
].join("\n");

function installAiTrigger(){
  ScriptApp.getProjectTriggers().forEach(function(t){ if(t.getHandlerFunction()==="aiVetPending") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("aiVetPending").timeBased().everyMinutes(10).create();
}

/** Called by the time trigger AND by the dashboard (doPost action:"vetPending"). Safe to call often. */
function aiVetPending(){
  var lock = LockService.getScriptLock();
  if(!lock.tryLock(1000)) return {ok:true, skipped:"busy"};
  try{
    var sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Applications");
    if(!sh) return {ok:false, reason:"no Applications sheet"};
    var rows = sh.getDataRange().getValues();
    var head = rows[0];
    var aiCol = head.indexOf("AI");                       // one column stores the AI JSON; created if missing
    if(aiCol < 0){ aiCol = head.length; sh.getRange(1, aiCol+1).setValue("AI"); }
    var done = 0;
    for(var i=1; i<rows.length && done<AI_BATCH; i++){
      if(rows[i][aiCol]) continue;                         // already vetted
      var subject = rows[i][head.indexOf("Subject")] || rows[i][head.indexOf("Name")] || "";
      var body    = rows[i][head.indexOf("Body")] || rows[i][head.indexOf("Email PDF")] || "";
      var from    = rows[i][head.indexOf("Email")] || "";
      var out = aiClassify(subject + "\nFrom: " + from + "\n\n" + body);
      if(out){
        if(out.type==="followup" && out.originalMissing) out = findOriginal(out, from);
        sh.getRange(i+1, aiCol+1).setValue(JSON.stringify(out));
        mergeAiIntoState(rows[i][head.indexOf("Key")] || from, out);
        done++;
      }
    }
    return {ok:true, vetted:done};
  } finally { lock.releaseLock(); }
}

function aiClassify(text){
  try{
    var res = UrlFetchApp.fetch(GROQ_URL, {
      method:"post", contentType:"application/json", muteHttpExceptions:true,
      headers:{ Authorization:"Bearer " + GROQ_API_KEY },
      payload: JSON.stringify({
        model: GROQ_MODEL, temperature: 0.1, response_format:{type:"json_object"},
        messages:[ {role:"system", content:AI_SYSTEM}, {role:"user", content:String(text).slice(0, 8000)} ]
      })
    });
    var j = JSON.parse(res.getContentText());
    if(j.error) return null;
    return JSON.parse(j.choices[0].message.content);
  }catch(e){ return null; }
}

/** When a follow-up has no original, search the inbox by the candidate's address so a human can find it. */
function findOriginal(out, email){
  try{
    var addr = (out.applicant && out.applicant.email) || email;
    var th = GmailApp.search('from:' + addr + ' subject:(Career) -in:trash', 0, 5);
    out.originalFound = th.length > 0;
    out.originalHint  = th.length ? th[0].getFirstMessageSubject() : "";
  }catch(e){}
  return out;
}

/** Write the AI verdict into the shared State so the dashboard shows it (flags, extracted fields). */
function mergeAiIntoState(key, out){
  var raw = readState(); if(!raw) return;
  var st; try{ st = JSON.parse(raw); }catch(e){ return; }
  var email = (out.applicant && out.applicant.email) || "";
  (st.candidates||[]).forEach(function(c){
    if(String(c.key||"")!==String(key) && String(c.email||"").toLowerCase()!==email.toLowerCase()) return;
    c.ai = { type:out.type, originalMissing:!!out.originalMissing, originalFound:!!out.originalFound,
             confidence:out.confidence, summary:out.summary, rsvp:out.rsvp||"", at:Date.now() };
    // Only fill blanks — never overwrite what a human typed.
    if(!c.year && out.yearOfStudy) c.year = out.yearOfStudy;
    if(!c.college && out.college) c.college = out.college;
    if(!c.city && out.city) c.city = out.city;
    if(!c.program && out.program) c.program = out.program;
    if(!c.preferredMode && out.preferredMode) c.preferredMode = out.preferredMode;
    if(!c.phone && out.phone) c.phone = out.phone;
    if(out.rsvp) c.ivConfirm = out.rsvp;
    c.docsReq = c.docsReq || {}; if(out.hasGovtId) c.govtIdSeen = true;
    c.updatedAt = Date.now();
  });
  st.updatedAt = Date.now();
  writeState(JSON.stringify(st), st.updatedAt);
}

/** Lessons the user has taught the assistant (corrections). Fed into every AI prompt. */
function aiLessons_(){
  try{ var st=JSON.parse(readState()||"{}"); var L=(st.aiLessons||[]); if(!L.length) return "";
    return "\n\nLESSONS THE USER HAS TAUGHT YOU (obey these; they correct past mistakes):\n- " + L.slice(-30).map(function(x){return x.text||x;}).join("\n- "); }
  catch(e){ return ""; }
}
/** Review an outgoing email before it is sent. Returns {verdict:'ok'|'flag', issue}. */
function aiVetMailFn(subject, body, ctx){
  var sys = [
    "You review an OUTGOING email before the Chambers of Bharat Chugh sends it to a candidate.",
    "Given the email and CONTEXT (the candidate's stage / what it responds to), decide if it is appropriate, correct and safe to send.",
    "Flag it if: wrong stage or recipient, wrong or clumsy tone, it contradicts the context, has missing/incorrect details, or anything that could embarrass the Chambers.",
    "If it is fine, verdict 'ok'. If not, verdict 'flag' with a short 'issue'.",
    "Return STRICT JSON only: {\"verdict\":\"ok\",\"issue\":\"\"}"
  ].join("\n") + aiLessons_();
  try{
    var res = UrlFetchApp.fetch(GROQ_URL, { method:"post", contentType:"application/json", muteHttpExceptions:true,
      headers:{ Authorization:"Bearer " + GROQ_API_KEY },
      payload: JSON.stringify({ model: GROQ_MODEL, temperature: 0.1, response_format:{type:"json_object"},
        messages:[ {role:"system", content:sys}, {role:"user", content:"CONTEXT: "+(ctx||"")+"\nSUBJECT: "+(subject||"")+"\n\nBODY:\n"+String(body||"").slice(0,4000)} ] }) });
    var j = JSON.parse(res.getContentText());
    if(j.error) return {verdict:"ok", issue:"", note:j.error.message};   // fail-open so mail is never silently lost
    var out = JSON.parse(j.choices[0].message.content);
    return {verdict: out.verdict==="flag"?"flag":"ok", issue: out.issue||""};
  }catch(e){ return {verdict:"ok", issue:""}; }
}
function aiChatFn(question, cohortLabel){
  if(!question) return {reply:"Ask me anything about this cohort \u2014 numbers, breakdowns, or interview questions."};
  var brief = "No data available.";
  try{
    var st = JSON.parse(readState()||"{}");
    var cands = (st.candidates||[]);
    if(cohortLabel){ var coh=(st.cohorts||[]).find(function(c){return c.label===cohortLabel;});
      if(coh) cands = cands.filter(function(c){return c.cohortId===coh.id;}); }
    var by = function(f){ var m={}; cands.forEach(function(c){ var k=f(c)||"\u2014"; m[k]=(m[k]||0)+1; }); return m; };
    brief = JSON.stringify({
      cohort: cohortLabel||"all",
      total: cands.length,
      byStage: by(function(c){return c.stage;}),
      byTrack: by(function(c){return c.track;}),
      byMode: by(function(c){return c.grantedMode||c.preferredMode;}),
      byYear: by(function(c){return c.year;}),
      byCollege: by(function(c){return c.college;}),
      byCity: by(function(c){return c.city;}),
      rejected: cands.filter(function(c){return c.outcome==="rejected";}).length,
      candidates: cands.slice(0,120).map(function(c){return {name:c.name,track:c.track,stage:c.stage,mode:c.grantedMode||c.preferredMode,year:c.year,college:c.college,city:c.city,rejected:c.outcome==="rejected"};})
    });
  }catch(e){}
  var sys = [
    "You are the assistant INSIDE the Chambers of Bharat Chugh intern/associate dashboard. You both answer questions AND operate the dashboard.",
    "The dashboard has these tabs: cohorts, overview, pipeline, applied, shortlisted, interview (interviews), approvals, onboarding, running (running cohort), extensions, analytics, ai, timeline, playbook, settings.",
    "A candidate moves through stages: applied -> shortlisted -> interview -> final (finalist) -> joined. They can also be rejected.",
    "Answer the user's question using ONLY the DATA brief (the live database for the selected cohort). For counts/breakdowns be exact.",
    "When the user asks you to DO something in the dashboard, propose one or more ACTIONS. Each action is an object with 'op' and a short 'label' (what the button will say). Supported ops and fields:",
    "  navigate {tab}  ; filterStage {stage}  ; move {name, stage}  ; star {name}  ; grantMode {name, mode:'online'|'offline'}",
    "  schedule {name, date:'YYYY-MM-DD', time:'HH:MM'}  ; note {name, text}  ; email {name, template:'p2_accept'|'p2_reject'|'p3_accept'|'p3_reject'|'offer'}  ; reject {name}  ; learn {text}",
    "Use 'learn' when the user corrects you or teaches a rule (e.g. 'never send X before Y') \u2014 store the rule verbatim in text; you will be shown these lessons every time.",
    "Only propose actions the user clearly intends. Never invent candidate names not in the DATA. Put a friendly explanation in 'reply' and the actions in 'actions' (empty array if none).",
    "For interview-question requests or explanations, just fill 'reply' with actions empty. Be concise, plain text.",
    "Return STRICT JSON only: {\"reply\":\"\",\"actions\":[]}"
  ].join("\n") + aiLessons_();
  try{
    var res = UrlFetchApp.fetch(GROQ_URL, {
      method:"post", contentType:"application/json", muteHttpExceptions:true,
      headers:{ Authorization:"Bearer " + GROQ_API_KEY },
      payload: JSON.stringify({ model: GROQ_MODEL, temperature: 0.3, response_format:{type:"json_object"},
        messages:[ {role:"system", content:sys}, {role:"user", content:"DATA:\n"+brief+"\n\nQUESTION:\n"+String(question).slice(0,2000)} ] })
    });
    var j = JSON.parse(res.getContentText());
    if(j.error) return {error: j.error.message||"Groq error"};
    var parsed; try{ parsed = JSON.parse(j.choices[0].message.content); }catch(e){ parsed = {reply:j.choices[0].message.content, actions:[]}; }
    return {reply: parsed.reply||"", actions: parsed.actions||[]};
  }catch(e){ return {error:String(e)}; }
}
`;

export const SCRIPTS = [
  { name:'Code.gs — application intake (runs every 5 min)',
    desc:'Fuzzy subject/year parsing, repeat-applicant de-dupe, CV/cover/NDA classification, email-to-PDF, 5-year labels, 60-day file sweep.',
    code:SCRIPT_INTAKE },
  { name:'WebApp.gs — shared-data endpoint',
    desc:'Serves applications + the shared state to every device, saves state back, sends emails with Drive attachments.',
    code:SCRIPT_WEBAPP },
  { name:'AI.gs — Qwen2.5-32B vetting via Groq (cloud, 24/7)',
    desc:'Classifies fresh / follow-up / forward / automated, extracts profile fields, flags missing originals, checks documents & interview RSVPs. Runs on a Google time trigger and on device sync.',
    code:SCRIPT_GROQ }
];
