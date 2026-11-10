import { makeEnv } from './gas-sandbox.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const eq = (a, b, m) => { const s = JSON.stringify(a) === JSON.stringify(b); if (s) pass++; else { fail++; console.log('FAIL ' + m + '\n  got  ' + JSON.stringify(a) + '\n  want ' + JSON.stringify(b)); } };

const E = makeEnv();
const cv = E.attach('CV.pdf', 'application/pdf', 40000);

// ---- setup() runs clean on an empty project -----------------------------------------------------
const setupLog = E.call('setup');
console.log('--- setup():\n' + setupLog.split('\n').map(l => '    ' + l).join('\n'));
ok(/Shared data ready/.test(setupLog), 'setup prepares the shared data');
ok(/Gmail labels ready/.test(setupLog), 'setup creates the labels');
ok(/Sheet mirror written/.test(setupLog), 'setup writes the mirror tab');
ok(!/✗/.test(setupLog), 'setup reports no failures');
ok([...E.labels.keys()].includes('Cohort/Filed'), 'the new labels exist in Gmail');

// ---- an application, then a reply carrying a signed NDA ----------------------------------------
E.addThread([{ from: 'Arjun Rao <arjun@example.com>', subject: 'Career - Internship for January 2027',
  body: 'I wish to apply for an internship at the Chambers. CV attached.', atts: [cv] }]);
E.call('processInbox');
let st = E.store();
const arjun = Object.values(st.candidates).find(c => c.email === 'arjun@example.com');
ok(!!arjun, 'the application was filed');

// the AI's reading material comes from the store
const pack = E.ctx.applicationPack_(arjun, st.applications[arjun.id], false);
ok(pack.hasMaterial, 'the AI has something to read');
ok(/I wish to apply/.test(pack.text), 'the AI sees the email body');
ok(/Career - Internship for January 2027/.test(pack.text), 'the AI sees the subject');

// a reply with an NDA attached, in a new thread
E.setClock(E.now() + 36e5);
E.addThread([{ from: 'Arjun Rao <arjun@example.com>', subject: 'Re: my internship — signed NDA',
  body: 'Please find my signed NDA attached. Thank you!', atts: [E.attach('NDA_signed_Arjun.pdf', 'application/pdf', 30000)], date: E.now() }]);
E.call('processInbox');
st = E.store();
const arjun2 = st.candidates[arjun.id];
console.log('--- inbox entries: ' + (arjun2.inbox || []).length + ', ndaUrl set: ' + !!arjun2.ndaUrl + ', nda status: ' + arjun2.nda.status);
ok((arjun2.inbox || []).length === 1, 'the reply is on the record');
ok(!!arjun2.ndaUrl, 'the signed NDA was filed into the NDA slot');
eq(arjun2.nda.status, 'received', 'the NDA is marked as an e-copy received');
eq(Object.keys(st.candidates).length, 1, 'the reply did not create a second candidate');
const replyThread = E.threads[E.threads.length - 1];
ok(E.labelsOf(replyThread).includes('Cohort/Reply'), 'the reply thread is labelled Cohort/Reply');

// the NDA landed in the same candidate folder as the CV
const paths = [...E.files.values()].filter(f => !f.trashed).map(f => {
  const names = []; let p = E.folders.get(f.parent);
  while (p) { names.unshift(p.name); p = p.parent ? E.folders.get(p.parent) : null; }
  return names.join('/') + '/' + f.name;
});
const arjunFiles = paths.filter(p => /arjun@example\.com/.test(p));
console.log('--- Arjun\'s folder:\n' + arjunFiles.map(p => '    ' + p).join('\n'));
ok(arjunFiles.some(p => /NDA — /.test(p)), 'the NDA is named by what it is');
ok(new Set(arjunFiles.map(p => p.slice(0, p.lastIndexOf('/')))).size === 1, 'everything of his is in one folder');

// ---- a thread the intake chokes on is recorded and can be retried --------------------------------
E.addThread([{ from: 'Broken Person <broken@example.com>', subject: 'Career - Internship for February 2027',
  body: 'Applying, CV attached.', atts: [E.attach('CV.pdf', 'application/pdf', 1000)], date: E.now() }]);
const realCreate = E.ctx.saveAttachments_;
E.ctx.saveAttachments_ = () => { throw new Error('Service Drive timed out'); };
E.call('processInbox');
E.ctx.saveAttachments_ = realCreate;
const probs = E.ctx.intakeProblems_();
console.log('--- problems: ' + JSON.stringify(probs.map(p => p.subject + ' / ' + p.err)));
ok(probs.length === 1, 'the failure was recorded instead of vanishing');
ok(/timed out/.test(probs[0].err), 'the reason is kept');
const brokenThread = E.threads.find(t => /broken@example/.test(t.msgs[0].from));
ok(E.labelsOf(brokenThread).includes('Cohort/Problem'), 'the thread is labelled Cohort/Problem');

const health = E.ctx.healthReport_();
ok((health.problems || []).length === 1, 'the dashboard can see the problem through health');
ok(Array.isArray(health.queue), 'the dashboard can see the reading order through health');

E.ctx.retryIntake_({ ids: [brokenThread.id] });
ok(!E.labelsOf(brokenThread).includes('Cohort/Problem'), 'Retry takes the label off');
ok(E.ctx.intakeProblems_().length === 0, 'and clears it from the list');
E.call('processInbox');
st = E.store();
ok(!!Object.values(st.candidates).find(c => c.email === 'broken@example.com'), 'the retried application is filed on the next run');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
