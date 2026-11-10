import { makeEnv } from './gas-sandbox.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const eq = (a, b, m) => { const s = JSON.stringify(a) === JSON.stringify(b); if (s) pass++; else { fail++; console.log('FAIL ' + m + '\n  got  ' + JSON.stringify(a) + '\n  want ' + JSON.stringify(b)); } };

const E = makeEnv();
const cv = E.attach('CV_Riya.pdf', 'application/pdf', 40000);
const cl = E.attach('CoverLetter_Riya.pdf', 'application/pdf', 18000);

E.addThread([{ from: 'Riya Nair <riya@example.com>', subject: 'Career - Internship for January 2027',
  body: 'Dear Sir,\n\nI would like to apply for an internship. My CV and cover letter are attached.\n\nRiya', atts: [cv, cl] }]);
E.call('processInbox');

let st = E.store();
const riya = Object.values(st.candidates).find(c => c.email === 'riya@example.com');
ok(!!riya, 'the application created a candidate record');

// --- the store is the source of truth, and the heavy text stays off it --------------------------
const apps = E.ctx.loadApps_();
ok(!!apps[riya.id], 'the application body is kept in its own server-only Drive file');
ok(/would like to apply/.test(apps[riya.id].body), 'the body is there for the AI to read');
ok(!('appBody' in riya), 'the body is not on the candidate record, so the sync stays light');
eq(riya.appSubject, 'Career - Internship for January 2027', 'the short subject is on the record');
eq(riya.appFiles, 'CV_Riya.pdf | CoverLetter_Riya.pdf', 'the attachment names are recorded');
ok(riya.cvUrl && riya.clUrl, 'the CV and cover letter are linked on the record');
ok(riya.filesFolder, 'the record links to the candidate folder');
ok(riya.intakeTs > 0, 'the record carries when the application arrived');

// --- pull must never leak the bulk text to devices -----------------------------------------------
const pulled = E.ctx.pull_(0, 500);
const wire = JSON.stringify(pulled);
ok(!/would like to apply/.test(wire), 'the application body is not sent to devices');
ok(/riya@example.com/.test(wire), 'the candidate itself is sent');
ok(!('applications' in pulled) && !('acked' in pulled), 'the server-only sections are not part of a pull');
const whole = JSON.stringify(E.store());
ok(!/would like to apply/.test(whole), 'the body is not even in the file devices download');

// --- acknowledgements are remembered in the store ------------------------------------------------
ok(Object.keys(st.acked || {}).length > 0, 'the acknowledgement is recorded in the shared data');
ok(!E.sheets.has('Acked'), 'the old Acked sheet tab is no longer used');

// --- the Sheet is a mirror ----------------------------------------------------------------------
const mirror = E.sheets.get('Candidates');
ok(!!mirror && mirror.length >= 2, 'the Candidates mirror tab was written');
eq(mirror[0][0], 'Cohort', 'the mirror has a header row');
ok(mirror.some(r => r.includes('riya@example.com')), 'the candidate appears in the mirror');
const idCol = mirror[0].indexOf('CandidateId');
ok(mirror[1][idCol] === riya.id, 'the mirror carries the record id');

// --- a later email with documents replaces them; one without keeps them --------------------------
E.setClock(E.now() + 2 * 864e5);
E.addThread([{ from: 'Riya Nair <riya@example.com>', subject: 'Career - Internship for January 2027',
  body: 'Following up on my application — any update please?', atts: [], date: E.now() }]);
const mailsBefore = E.sent.length;
E.call('processInbox');
st = E.store();
const riya2 = st.candidates[riya.id];
ok(riya2.cvUrl === riya.cvUrl, 'a follow-up with no attachment does not wipe the CV');
ok(riya2.clUrl === riya.clUrl, 'nor the cover letter');
eq(E.sent.length, mailsBefore, 'a follow-up does not trigger a second acknowledgement');
eq(Object.keys(st.candidates).length, 1, 'and does not create a second record');

// --- deleting a candidate takes the application text with it -------------------------------------
E.ctx.withStore_(s => { E.ctx.deleteRecord_(s, riya.id, Date.now(), riya.key); });
st = E.store();
ok(!st.candidates[riya.id], 'the candidate is gone');
ok(!!st.deletedKeys[riya.key], 'and the key is remembered so Gmail does not re-file it');
E.ctx.pruneApplications_();
ok(!E.ctx.loadApps_()[riya.id], 'the nightly prune drops the application body with them');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
