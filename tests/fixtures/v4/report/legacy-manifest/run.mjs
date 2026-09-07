#!/usr/bin/env node
// T-V4A1-04 — legacy conclude-it manifest shape renders with ancestor-parity class names.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..', '..');
const renderer = path.join(repoRoot, 'scripts', 'build-report.mjs');
const manifest = path.join(__dirname, 'manifest.json');
const out = '/tmp/legacy.html';

const r = spawnSync(process.execPath, [renderer, manifest, '--out', out, '--brand', 'default'], { encoding: 'utf-8' });
if (r.error || r.status === null || r.status > 2) {
  console.error('FAIL: exit', r.status, r.error, r.stderr);
  process.exit(1);
}
const html = fs.readFileSync(out, 'utf-8');
const need = ['class="card"', 'badge b-ok', 'class="more"', 'class="mdout"'];
const missing = need.filter((n) => !html.includes(n));
const rows = (html.match(/<tr>/g) || []).length;
if (missing.length) {
  console.error('FAIL: missing class names', missing);
  process.exit(1);
}
if (rows < 2) { // header row + 1 data row
  console.error('FAIL: expected at least 1 data row in scoreboard table');
  process.exit(1);
}
console.log('PASS T-V4A1-04');
process.exit(0);
