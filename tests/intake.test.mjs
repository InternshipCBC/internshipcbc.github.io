import { makeEnv } from './gas-sandbox.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('FAIL ' + m); } };
const eq = (a, b, m) => { const s = JSON.stringify(a) === JSON.stringify(b); if (s) pass++; else { fail++; console.log('FAIL ' + m + '\n  got  ' + JSON.stringify(a) + '\n  want ' + JSON.stringify(b)); } };

const E = makeEnv();
const cv = E.attach('CV_Aarav_Mehta_December_2026.pdf', 'application/pdf', 40000);
const cl = E.attach('CoverLetter_Aarav_Mehta.pdf', 'application/pdf', 20000);

// Applications spread over several months, deliberately out of order, newest last.
const mk = (name, email, month, year, atts, extra) => E.addThread([Object.assign({
  from: name + ' <' + email + '>', subject: 'Career - Internship for ' + month + ' ' + year,
  body: 'Dear Sir/Madam,\n\nI wish to apply for an internship. Please find my CV attached.\n\nRegards,\n' + name,
  atts: atts || [cv, cl]
}, extra || {})]);

mk('Far Future', 'far@example.com', 'April', 2027);
mk('Dec One', 'dec1@example.com', 'December', 2026);
mk('Mar One', 'mar@example.com', 'March', 2027);
mk('Jan One', 'jan1@example.com', 'January', 2027);
mk('Dec Two', 'dec2@example.com', 'December', 2026);
E.addThread([{ from: 'Acme <billing@acme.com>', subject: 'Invoice 4417 due', body: 'Payment is due.', atts: [E.attach('invoice.pdf', 'application/pdf')] }]);
E.addThread([{ from: 'Vague Person <vague@example.com>', subject: 'Internship application', body: 'I would like to apply for an internship.', atts: [cv] }]);
mk('No Docs', 'nodocs@example.com', 'December', 2026, []);

E.call('processInbox');

const st = E.store();
const cands = Object.values(st.candidates);
const byName = n => cands.find(c => c.name === n);

console.log('--- filed: ' + cands.map(c => c.name + ' [' + (st.cohorts[c.cohortId] || {}).label + ']').join(', '));

ok(cands.length >= 6, 'applications were filed (' + cands.length + ')');
ok(!!byName('Dec One') && !!byName('Dec Two'), 'December applications are filed');
ok(!!byName('Jan One'), 'January application is filed');
ok(!!byName('No Docs'), 'an application with no attachment is still filed');
eq((byName('No Docs') || {}).cvUrl, '', 'the no-attachment application has no CV link');
ok(((byName('No Docs') || {}).aiFlags || []).some(f => f.type === 'missing_cv' && !f.resolved), 'a "no CV" flag is raised without any AI');
ok(!cands.some(c => /billing@acme/.test(c.email)), 'the invoice was not filed as an application');

const inv = E.threads.find(t => t.msgs[0].subject.startsWith('Invoice'));
const vague = E.threads.find(t => t.msgs[0].subject === 'Internship application');
console.log('--- invoice labels: ' + E.labelsOf(inv).join(', '));
console.log('--- vague labels:   ' + E.labelsOf(vague).join(', '));
console.log('--- a filed thread: ' + E.labelsOf(E.threads[1]).join(', '));

ok(E.labelsOf(inv).length > 0, 'the invoice thread was labelled, so it is not rescanned for ever');
ok(E.labelsOf(vague).length > 0, 'an application with an unreadable month was labelled');

// acknowledgements
console.log('--- emails sent: ' + E.sent.length + ' -> ' + E.sent.map(s => s.to).join(', '));
ok(E.sent.some(s => /dec1@example.com/.test(s.to)), 'the December applicant was acknowledged');
ok(!E.sent.some(s => /billing@acme/.test(s.to)), 'no mail went to the invoice sender');

// documents actually landed in Drive
const stored = [...E.files.values()].filter(f => !f.trashed).map(f => f.name);
console.log('--- drive files: ' + stored.length);
ok(stored.some(n => /Aarav|Dec One/i.test(n) || /CV_/.test(n)), 'attachments were saved to Drive');

// a second run must not re-file anything
const before = Object.keys(E.store().candidates).length, mailsBefore = E.sent.length;
E.call('processInbox');
eq(Object.keys(E.store().candidates).length, before, 'a second run files nothing again');
eq(E.sent.length, mailsBefore, 'a second run sends no duplicate acknowledgements');

const health = JSON.parse(E.ctx.PropertiesService.getScriptProperties().getProperty('health_intake') || '{}');
console.log('--- intake health: ' + JSON.stringify(health));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
