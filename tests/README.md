# Tests

```
node tests/run.mjs
```

No installation, no build step, no network. Node 18 or later.

## What is here

`gas-sandbox.mjs` is a small stand-in for Apps Script: Gmail, Drive, Sheets, Properties, Lock and the
rest, written so they behave literally — a search really filters, a label really sticks, a file really
holds its bytes. It loads `Core.gs` (generated from `cohort-core.js`), `Code.gs`, `WebApp.gs` and
`AI.gs` into one scope, so the server code can be run and tested outside Google.

| file | covers |
| --- | --- |
| `core.test.mjs` | `cohort-core.js`: subject parsing, restricted addresses, scoring, two-device merging, every email placeholder |
| `intake.test.mjs` | the Gmail intake end to end: what is filed, what is labelled, who is written to, and that a second run repeats nothing |
| `queue.test.mjs` | the reading order (soonest month first), late applications, and the Drive layout |
| `data.test.mjs` | the shared data as the single source of truth, and that application text never goes out over `pull` |
| `server.test.mjs` | `setup()`, replies and documents, per-candidate folders, and intake problems with retry |

## Adding a test

```js
import { makeEnv } from './gas-sandbox.mjs';
const E = makeEnv();                        // clock is 10 Nov 2026 by default
E.addThread([{ from: 'A <a@example.com>', subject: 'Career - Internship for January 2027',
               body: 'Applying.', atts: [E.attach('CV.pdf', 'application/pdf', 40000)] }]);
E.call('processInbox');                     // call any server function by name
const st = E.store();                       // read the shared data back
```

`E.sent` is every email sent, `E.threads` every thread with its labels, `E.files` and `E.folders` the
Drive contents, `E.sheets` the spreadsheet tabs, and `E.ctx` the whole server scope if you need to call
an internal function directly.

The dashboard itself is checked by driving it in a real browser with Playwright; those scripts are not
in the repository because they need a browser and a local web server.
