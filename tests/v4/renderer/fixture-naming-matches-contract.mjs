#!/usr/bin/env node
// T-V4A4-07 — every fixture directory name a @case-renderer test file implies (by naming it
// literally when joining fixturesRoot) exists verbatim under tests/fixtures/v4/report/ — no
// invented/drifted directory names. Names are extracted mechanically from the test sources
// that the 17 CONTRACT run: cells point at, never hand-typed (G-5).
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot, fixturesRoot, assert, report } from './lib/helpers.mjs';
import { extractCaseRendererRows } from './lib/contract-cases.mjs';

const rows = extractCaseRendererRows(repoRoot);
const actualDirs = new Set(fs.readdirSync(fixturesRoot).filter((f) => fs.statSync(path.join(fixturesRoot, f)).isDirectory()));

let totalImplied = 0;
for (const row of rows) {
  const m = row.run.match(/node (tests\/v4\/renderer\/[\w.-]+\.mjs)/);
  if (!m) continue;
  const src = fs.readFileSync(path.join(repoRoot, m[1]), 'utf-8');
  const impliedRe = /fixturesRoot,\s*'([\w.-]+)'/g;
  const implied = new Set([...src.matchAll(impliedRe)].map((mm) => mm[1]));
  for (const name of implied) {
    totalImplied++;
    assert(actualDirs.has(name), `${row.id} (${m[1]}) implies fixture dir "${name}", which exists verbatim under tests/fixtures/v4/report/`);
  }
}
assert(totalImplied > 0, `at least one fixture-dir reference was extracted from the 17 test files, found ${totalImplied}`);

report('T-V4A4-07 fixture-naming-matches-contract');
