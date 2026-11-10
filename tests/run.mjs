// node tests/run.mjs   — runs every test. No dependencies, no build step.
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const files = fs.readdirSync(here).filter(f => f.endsWith('.test.mjs')).sort();
let bad = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [path.join(here, f)], { encoding: 'utf8' });
  const last = (r.stdout || '').trim().split('\n').pop() || '';
  const okRun = r.status === 0;
  if (!okRun) bad++;
  console.log((okRun ? '  ok  ' : ' FAIL ') + f.padEnd(22) + last);
  if (!okRun) console.log((r.stdout || '') + (r.stderr || ''));
}
console.log(bad ? ('\n' + bad + ' file(s) failed') : '\nall green');
process.exit(bad ? 1 : 0);
