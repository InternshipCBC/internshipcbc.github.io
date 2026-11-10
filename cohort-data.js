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
  { key:'ack', tag:'APPLIED', group:'Applied · acknowledgement', name:'Application acknowledgement',
    when:'Sent automatically by the Gmail intake when a correctly-subjected application is filed (not after the month has closed).',
    subject:'We have received your application — Chambers of Bharat Chugh',
    body:[
      'Dear {{Name}},','',
      'Thank you for writing to us — your application for the {{Month}} {{Role}} has reached the Chambers of Bharat Chugh, and has been logged for review.','',
      '{{LateNote}}',
      'We read every application ourselves, properly, so this takes a little time. You will hear from us on the outcome {{ReplyBy}}. If you are shortlisted, we will write with the next steps.','',
      'If you haven\u2019t already, do read our note on how the Chambers approaches internships and what we look for — it will tell you what we value.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'missing_docs', tag:'APPLIED', group:'Applied · acknowledgement', name:'Missing documents',
    when:'Sent from a "No CV" flag on the Review Desk (preview first), or automatically if you switch that on in Settings \u2192 Automation.',
    subject:'Your application — one thing missing',
    body:[
      'Dear {{Name}},','',
      'Thank you for applying for the {{Month}} {{Role}} at the Chambers of Bharat Chugh. To review your application properly we also need {{MissingDocs}}.','',
      'Please reply to this email with it attached — it will be added to your application automatically.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'p2_accept', tag:'SHORTLISTED', group:'Shortlisted', name:'Shortlisted — interview call',
    when:'Sent from the Interview tab or the candidate\u2019s Decision tab once a date and time are set. Never sent automatically.',
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

  { key:'iv_reminder', tag:'INTERVIEW', group:'Interview', name:'Interview reminder (day before)',
    when:'Sent at 9 AM the day before the interview, only if "Remind candidates the day before" is on in Settings \u2192 Automation.',
    subject:'Reminder — your interview tomorrow, {{Time}}',
    body:[
      'Dear {{Name}},','',
      'A reminder of your interview with the Chambers of Bharat Chugh tomorrow, {{Date}} at {{Time}}, {{InterviewMode}}.',
      'Joining details: {{InterviewLink}}','',
      'If anything has changed, please reply to this email.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'p2_reject', tag:'SHORTLISTED', group:'Shortlisted', name:'Not shortlisted — after review',
    when:'Sent from a rejected candidate\u2019s record or in bulk from the Pipeline. Rejecting alone sends nothing.',
    subject:'Your application for {{Month}} — Chambers of Bharat Chugh',
    body:[
      'Dear {{Name}},','',
      'Thank you for applying, and for the thought you put into your application — we read it in full. This was a genuinely strong field for {{Month}}, and yours was a candidature we considered carefully.','',
      'On this occasion we are not able to take it forward, largely on account of {{Reason}}. That is a reflection of the number of seats and the depth of applications this month — not of your ability.','',
      'We would genuinely welcome an application from you for an upcoming month; please do write to us again. We wish you the very best.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'p3_accept', tag:'INTERVIEW', group:'Interview', name:'Selected after interview',
    when:'Sent by hand from a Finalist\u2019s Decision tab. Says "subject to final confirmation".',
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

  { key:'p3_reject', tag:'INTERVIEW', group:'Interview', name:'Not selected after interview',
    when:'Sent from a rejected candidate\u2019s record (after an interview) or in bulk.',
    subject:'After your interview — {{Month}}, Chambers of Bharat Chugh',
    body:[
      'Dear {{Name}},','',
      'Thank you for taking the time to interview with us — we enjoyed the conversation, and we want you to know the decision was a close one.','',
      'For {{Month}}, we are not able to offer you a place, on account of {{Reason}}. This is truly a function of very limited seats against a strong set of candidates who interviewed.','',
      'We would be happy to see you apply again for a future month — and, should you wish, we are glad to share brief feedback if you write to us. We wish you the very best for what lies ahead.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'offer', tag:'ONBOARDING', group:'Onboarding · the offer', name:'Final confirmation / joining',
    when:'Sent with "Send offer" once Mayank Sir has approved (or a bypass is recorded). Attaches the Handbook & NDA below.',
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

  { key:'nda_remind', tag:'ONBOARDING', group:'Onboarding · paperwork', name:'NDA reminder',
    when:'Sent from Onboarding or the candidate\u2019s Decision tab while the signed NDA is awaited \u2014 or automatically if NDA reminders are on in Settings \u2192 Automation.',
    subject:'Gentle reminder — your signed NDA for the {{Month}} {{Role}}',
    body:[
      'Dear {{Name}},','',
      'A gentle reminder to send us the scanned copy of your signed NDA, and to bring a physical signed copy on your first day. If you have already sent it, please ignore this note.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'ext_approved', tag:'EXTENSION', group:'Extensions', name:'Extension approved',
    when:'Sent (after you confirm) when an extension is approved or bypassed in Approvals \u2192 Extensions.',
    subject:'Your extension at the Chambers of Bharat Chugh',
    body:[
      'Dear {{Name}},','',
      'We\u2019re glad to confirm that your extension with the Chambers has been approved \u2014 you continue with us for {{ExtensionMonth}}. It has been a pleasure having you with us, and we\u2019re happy to have you stay on.','',
      '{{StipendLine}}','',
      'Your supervising counsel will speak with you about the work planned for the extended period.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'needsfix_internship', tag:'DEFECTS', group:'Defects / auto-replies', name:'Defects — Internship (auto)',
    when:'Sent automatically by the intake, at most once a month per sender, when an internship email\u2019s month/year can\u2019t be read.',
    subject:'A quick fix needed on your application — Chambers of Bharat Chugh',
    body:[
      'Dear {{Name}},','',
      'Thank you for writing to us. We could not read the month you are applying for from your email.','',
      'Please send a FRESH email (a reply to this note will not be processed) with the subject exactly as:',
      'Career - Internship for [Month] [Year]   (e.g. Career - Internship for September 2026),',
      'writing the month and year in full.','',
      'Warm regards,','The Chambers of Bharat Chugh'].join('\n') },

  { key:'needsfix_associate', tag:'DEFECTS', group:'Defects / auto-replies', name:'Defects — Associate (auto)',
    when:'Sent automatically by the intake, at most once a month per sender, when an associate email\u2019s month/year can\u2019t be read.',
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
  'Privacy: your application and documents are used only to assess it, are seen only by the Chambers\u2019 team, may be read by an AI screening tool, and are deleted within a few months if you are not selected.','',
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
  'Privacy: your application and documents are used only to assess it, are seen only by the Chambers\u2019 team, may be read by an AI screening tool, and are deleted within a few months if you are not selected.','',
  'Subject line \u2014 this is mandatory. Your subject must read exactly:',
  'Career - Associate from [MONTH] [YEAR]     e.g. Career - Associate from October 2026',
  'The month and year must be written in full. "from" is the month you are available to begin.','',
  '\u2014 The Chambers of Bharat Chugh'].join('\n');

export const GMAIL_STEPS = [
  { n:1, title:'Nothing is required for intake', detail:'The script reads the inbox directly — labels and filters are only for your own tidiness. It files anything that looks like an application, answers every applicant (including one who wrote after the month closed), sends a "quick fix" note when the month cannot be read, and quietly labels everything else (invoices, notices) Cohort/Not an application.' },
  { n:2, title:'The labels it creates', detail:'All of them sit under one "Cohort" family so nothing clashes with your own labels. Cohort/Filed — on a candidate record. Cohort/Reply — a reply from someone already on file. Cohort/Needs fix — the month could not be read, and the applicant has been asked to resend. Cohort/Not an application. Cohort/Duplicate — an older or repeated copy. Cohort/Problem — could not be processed; these are listed on the Review Desk with a Retry button, so nothing disappears. Filed mail also gets a flat month label, Cohort/2026-12 December, which sorts in date order, and Cohort/Associate for the associate track.' },
  { n:3, title:'Upgrading from the old labels', detail:'The old Status/… and Career/… labels still work: the intake skips anything carrying one, so nothing is processed twice. Running setup copies them onto the new labels (run migrateLabels() again if you have thousands). Once the Review Desk and Gmail agree, you can delete the old labels by hand.' },
  { n:4, title:'Where the documents go', detail:'Cohort Files → 2026-12 December → Aarav Mehta (aarav@example.com) → CV — CV_Aarav.pdf. One folder per candidate inside the month, so everything about one person stays together and can be opened or shared in one go. Anything they email later (a signed NDA, an ID, a fresh CV) lands in the same folder. The candidate record has a link straight to it.' },
  { n:5, title:'Optional filter', detail:'Search box → filter icon → Subject contains "Career - Internship for" → Create filter → tick Never send it to Spam. Repeat for "Career - Associate from". This only protects applications from the spam folder.' },
  { n:6, title:'Something was mis-filed?', detail:'Ignored an application by mistake: remove the Cohort/Not an application label from the thread in Gmail — it is picked up again within 10 minutes. Could not be processed: press Retry on the Review Desk. Filed something that is not an application: delete the candidate in the dashboard (it stays deleted).' }
];

/** The four Apps Script files, exactly as the Playbook shows them. Core.gs is generated from cohort-core.js. */
import * as core from './cohort-core.js';
export function buildCoreGs(){
  const lines = ['/**', ' * Cohort ' + core.CORE_VERSION + ' — Core.gs (shared data rules; generated by the dashboard — do not edit).',
    ' * The dashboard runs the very same code, so both sides merge records identically.', ' */',
    'var CORE_VERSION = ' + JSON.stringify(core.CORE_VERSION) + ';', 'var MONTHS = ' + JSON.stringify(core.MONTHS) + ';', ''];
  for(const [k, v] of Object.entries(core)) if(typeof v === 'function') lines.push(v.toString(), '');
  return lines.join('\n');
}
export const SCRIPT_FILES = [
  { file:'Core.gs', name:'Core.gs — shared data rules', desc:'Generated from the dashboard’s own code. Paste as is; never edit.' },
  { file:'Code.gs', name:'Code.gs — settings, setup, Gmail, digest & reminders', desc:'The ONLY file you edit: fill in the SETTINGS block (IDs, token, Gemini/Groq keys, team emails), then Run → setup. Also add the free Drive API and Google Calendar API services (⊕ Services).' },
  { file:'WebApp.gs', name:'WebApp.gs — shared database & API', desc:'The shared data is the single source of truth: one file in Drive that every dashboard reads and writes. Deploy it as a Web app (Execute as Me, access Anyone).' },
  { file:'AI.gs', name:'AI.gs — AI vetting & assistant (Groq)', desc:'Optional. Reads each application’s subject and body, tags it and fills blank profile fields. Never sends mail.' }
];
export async function loadScripts(){
  const out = [];
  for(const s of SCRIPT_FILES){
    let code = '';
    if(s.file === 'Core.gs') code = buildCoreGs();
    else { try{ const r = await fetch('./gas/' + s.file, { cache: 'no-cache' }); code = r.ok ? await r.text() : ''; }catch(e){ code = ''; } }
    out.push(Object.assign({}, s, { code: code || '// Could not load ' + s.file + ' — open the dashboard online and try again.' }));
  }
  return out;
}
