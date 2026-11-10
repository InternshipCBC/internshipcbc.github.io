import * as C from '../cohort-core.js';
let pass = 0, fail = 0;
const eq = (a, b, m) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (ok) pass++; else { fail++; console.log('FAIL ' + m + '\n  got ' + JSON.stringify(a) + '\n  want ' + JSON.stringify(b)); } };

// --- subject parsing (the Gmail intake depends entirely on this) ---
const Y = new Date().getFullYear();
eq(C.parseApplication('Career - Internship for September ' + (Y + 1), ''), { track: 'Internship', month: 'September', year: Y + 1 }, 'plain subject');
eq(C.parseApplication('Career - Associate from October ' + (Y + 1), ''), { track: 'Associate', month: 'October', year: Y + 1 }, 'associate subject');
eq(C.parseApplication("Career - Internship for Sept '" + String(Y + 1).slice(2), ''), { track: 'Internship', month: 'September', year: Y + 1 }, "Sept 'YY");
eq(C.parseApplication('Internship ' + (Y + 1) + '-09', ''), { track: 'Internship', month: 'September', year: Y + 1 }, 'YYYY-MM');
eq(C.parseApplication('Application summary', ''), null, '"summary" is not March');
eq(C.parseApplication('Internship application', 'I would like to apply for May ' + (Y + 1)), { track: 'Internship', month: 'May', year: Y + 1 }, 'month from body');
eq(C.parseApplication('Internship for September 1999', ''), null, 'year out of range');

// --- what counts as an application ---
eq(C.isApplicationLike('Career - Internship for May ' + Y, ''), true, 'career subject');
eq(C.isApplicationLike('Invoice 2231', 'Payment due'), false, 'invoice is not an application');
eq(C.isApplicationLike('Re: your newsletter', 'unsubscribe'), false, 'newsletter is not an application');

// --- restricted addresses: exact / domain / sub-domain, never a loose match ---
const list = ['internship.cbc@gmail.com', 'bharatchugh.in'];
eq(C.isBlockedAddress('internship.cbc@gmail.com', list), true, 'exact address');
eq(C.isBlockedAddress('someone@bharatchugh.in', list), true, 'domain');
eq(C.isBlockedAddress('a@mail.bharatchugh.in', list), true, 'sub-domain');
eq(C.isBlockedAddress('a@notbharatchugh.in', list), false, 'not a loose substring');
eq(C.isBlockedAddress('student@gmail.com', list), false, 'ordinary applicant');

// --- cohort ids agree on every device ---
eq(C.cohortIdFor('September', 2026), 'coh_2026_09', 'cohort id');
eq(C.cohortIdFor('sep', '2026'), 'coh_2026_09', 'cohort id from short month');
eq(C.nextMonthOf('December', 2026).label, 'January 2027', 'next month rolls the year');

// --- scoring ---
eq(C.rubricScore({ ind: 5, story: 5, pass: 5, show: 5, orig: 5 }, {}), 100, 'full marks');
eq(C.rubricScore({ ind: 5, story: 5, pass: 5, show: 5, orig: 5 }, { template: true }), 70, 'template penalty');
eq(C.rubricScore({}, {}), null, 'unrated');

// --- merging two devices ---
const a = C.normalizeCandidate({ id: 'c1', name: 'A', stage: 'applied', updatedAt: 100, _f: { $base: 100 } });
const b = JSON.parse(JSON.stringify(a));
C.applyChange(a, 'stage', 'shortlisted', 200);
C.applyChange(b, 'name', 'B', 300);
const m1 = C.mergeRecord(a, b), m2 = C.mergeRecord(b, a);
eq([m1.stage, m1.name], ['shortlisted', 'B'], 'field-level merge keeps both edits');
eq(C.sameJson(m1, m2), true, 'merge is order-independent');

// nested object merge (approvals)
const x = C.normalizeCandidate({ id: 'c2', updatedAt: 10, _f: { $base: 10 } });
const y = JSON.parse(JSON.stringify(x));
C.applyChange(x, 'appr.mayank', 'ok', 20);
C.applyChange(y, 'appr.bharat', 'ok', 30);
const m3 = C.mergeRecord(x, y);
eq([m3.appr.mayank, m3.appr.bharat], ['ok', 'ok'], 'two sign-offs on two devices both survive');

// histories and extensions are unions
const h1 = C.normalizeCandidate({ id: 'c3', hist: [{ ts: 1, txt: 'one' }], extensions: [{ id: 'e1', status: 'pending', ts: 1 }] });
const h2 = C.normalizeCandidate({ id: 'c3', hist: [{ ts: 2, txt: 'two' }], extensions: [{ id: 'e1', status: 'approved', ts: 5 }] });
const m4 = C.mergeRecord(h1, h2);
eq(m4.hist.length, 2, 'history is a union');
eq(m4.extensions[0].status, 'approved', 'the later extension decision wins');

// --- tokens the emails use ---
const coh = C.mkCohort(9, 2026, 1000);
const cand = C.normalizeCandidate({ id: 'c4', name: 'Aarav Mehta', cohortId: coh.id, preferredMode: 'offline', track: 'intern' });
const tk = C.buildTokens(cand, coh, { officeLocation: 'at the Chambers', reportingDetails: '10 AM' }, {});
eq(tk.Name, 'Aarav Mehta', 'Name token');
eq(tk.Month, 'September 2026', 'Month token');
eq(tk.Role, 'internship', 'Role token');
eq(C.fillTokens('Dear {{Name}}, for {{Month}}', tk), 'Dear Aarav Mehta, for September 2026', 'token fill');
eq(/\{\{\w+\}\}/.test(C.fillTokens('Hi {{Nope}}', tk)), true, 'unknown token is left visible');

// every placeholder the Playbook advertises must exist
const advertised = ['Name', 'Month', 'Role', 'Mode', 'InterviewMode', 'GrantMode', 'Date', 'Time', 'InterviewLink', 'ShortlistDate', 'InterviewDate', 'ApproveDate', 'StartDate', 'Duration', 'PreReads', 'Reporting', 'ReportingDetails', 'WhatsAppLink', 'Reason', 'ExtensionMonth', 'StipendAmount', 'StipendLine', 'FirstName', 'MissingDocs'];
const missing = advertised.filter(k => !(k in tk));
eq(missing, [], 'every advertised placeholder is produced');

// --- deadlines ---
const d = C.defaultDeadlines('September', 2026);
eq(C.fmtDateIST(d.applyClose), '18 Jul 2026', 'applications close 45 days before the month');
eq(d.shortlistBy - d.applyClose, 5 * 864e5, 'five days to shortlist');
eq(C.fmtTime12('17:30'), '5:30 pm', '24h → 12h');
eq(C.istTs('2026-09-01', '10:00'), Date.UTC(2026, 8, 1, 10, 0) - 330 * 60000, 'IST timestamp');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
