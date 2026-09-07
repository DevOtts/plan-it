#!/usr/bin/env node
// T-V4A4-05 — build-report.mjs and every tests/v4/renderer/*.mjs import only node: builtins
// or a same-lane relative path (G-2).
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot, assert, report } from './lib/helpers.mjs';

function scan(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const importRe = /(?:import[^'"]*from\s*|import\s*)['"]([^'"]+)['"]/g;
  const bad = [];
  let m;
  while ((m = importRe.exec(text))) {
    const target = m[1];
    if (target.startsWith('node:')) continue;
    if (target.startsWith('.') || target.startsWith('/')) continue;
    bad.push(target);
  }
  return bad;
}

const files = [
  path.join(repoRoot, 'scripts', 'build-report.mjs'),
  ...fs.readdirSync(path.join(repoRoot, 'tests', 'v4', 'renderer')).filter((f) => f.endsWith('.mjs')).map((f) => path.join(repoRoot, 'tests', 'v4', 'renderer', f)),
  ...fs.readdirSync(path.join(repoRoot, 'tests', 'v4', 'renderer', 'lib')).filter((f) => f.endsWith('.mjs')).map((f) => path.join(repoRoot, 'tests', 'v4', 'renderer', 'lib', f)),
];

let totalBad = 0;
for (const f of files) {
  const bad = scan(f);
  totalBad += bad.length;
  assert(bad.length === 0, `${path.relative(repoRoot, f)}: zero non-node: external imports, found ${JSON.stringify(bad)}`);
}
assert(files.length >= 20, `scanned a real file set, got ${files.length} files`);

report('T-V4A4-05 zero-deps-renderer');
