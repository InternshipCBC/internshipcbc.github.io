import { makeEnv } from './gas-sandbox.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const eq = (a, b, m) => { const s = JSON.stringify(a) === JSON.stringify(b); if (s) pass++; else { fail++; console.log('FAIL ' + m + '\n  got  ' + JSON.stringify(a) + '\n  want ' + JSON.stringify(b)); } };

const E = makeEnv();
const cv = E.attach('CV.pdf', 'application/pdf', 40000);
const mk = (name, email, month, year) => E.addThread([{
  from: name + ' <' + email + '>', subject: 'Career - Internship for ' + month + ' ' + year,
  body: 'I wish to apply. My CV is attached.', atts: [cv]
}]);
// deliberately filed in the wrong order: far months first
['April 2027', 'March 2027', 'February 2027', 'January 2027', 'December 2026'].forEach((m, i) => {
  const [mo, yr] = m.split(' ');
  for (let k = 0; k < 3; k++) mk(m.replace(' ', '') + '-' + k, 'p' + i + k + '@example.com', mo, yr);
});
E.call('processInbox');

const st = E.store();
const queue = E.ctx.aiQueue_(st).map(c => (st.cohorts[c.cohortId] || {}).label);
console.log('--- AI queue order:\n' + queue.join(' | '));
eq(queue.slice(0, 3), ['December 2026', 'December 2026', 'December 2026'], 'the soonest month is read first');
eq(queue.slice(3, 6), ['January 2027', 'January 2027', 'January 2027'], 'then the month after it');
eq(queue[queue.length - 1], 'April 2027', 'the furthest month is read last');

const byMonth = E.ctx.aiQueueByMonth_(st);
console.log('--- queue by month: ' + byMonth.map(m => m.label + ' applied=' + m.applied + ' unread=' + m.unread + ' late=' + m.late).join(' | '));
eq(byMonth.map(m => m.label), ['December 2026', 'January 2027', 'February 2027', 'March 2027', 'April 2027'], 'the per-month queue is in date order');
ok(byMonth[0].late === 3, 'December is correctly marked late (its deadline has passed)');
ok(byMonth[0].unread === 3, 'December shows three applications still unread');

// the late applicants were still acknowledged, and the note explains the position honestly
const dec = E.sent.find(s => /p40@example.com/.test(s.to) || (s.body && /December 2026/.test(s.body) && /closed on/.test(s.body)));
console.log('--- a December acknowledgement:\n' + (dec ? (dec.body || '').split('\n').slice(0, 8).join('\n') : '(none)'));
ok(!!dec, 'a late December applicant received an acknowledgement');
ok(dec && /closed on/.test(dec.body), 'the acknowledgement says the month had already closed');
ok(dec && !/\{\{/.test(dec.body), 'no placeholder was left unfilled');

// a January applicant (not late) gets no late note and no blank gap
const jan = E.sent.find(s => /p3\d@example.com/.test(s.to));
ok(jan && !/closed on/.test(jan.body), 'an in-time applicant gets no late note');
ok(jan && !/\n\n\n/.test(jan.body), 'the empty late note leaves no gap in the email');

// Drive layout: one folder per candidate, inside the month
const paths = [...E.files.values()].filter(f => !f.trashed).map(f => {
  const names = []; let p = E.folders.get(f.parent);
  while (p) { names.unshift(p.name); p = p.parent ? E.folders.get(p.parent) : null; }
  return names.join(' / ') + ' / ' + f.name;
});
console.log('--- drive sample:\n' + paths.slice(0, 3).join('\n'));
ok(paths.some(p => /2026-12 December \/ .+@example\.com\) \/ /.test(p)), 'each candidate has their own folder inside the month');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
