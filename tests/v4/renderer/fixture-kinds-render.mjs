#!/usr/bin/env node
// T-V4A4-04 — the 8 per-kind fixtures each render with --strict, exit ≤ 2, non-empty output.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const dir = path.join(fixturesRoot, 'glossary-one-kind-each');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
assert(files.length === 8, `8 per-kind fixtures present, found ${files.length}`);

for (const file of files) {
  const outDir = tmpDir(`kind-render-${file}`);
  const out = path.join(outDir, 'out.html');
  const r = runRenderer([path.join(dir, file), '--strict', '--out', out]);
  assert(r.status <= 2, `${file} renders with --strict, exit ${r.status}: ${r.stderr}`);
  assert(fs.existsSync(out) && fs.statSync(out).size > 0, `${file} produces a non-empty output file`);
}

report('T-V4A4-04 fixture-kinds-render');
