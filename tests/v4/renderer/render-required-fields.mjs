#!/usr/bin/env node
// T-V4A1-05 — manifest missing title or output: nothing written, field named on stderr.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const dir = tmpDir('required-fields');

for (const [file, field] of [['missing-title.json', 'title'], ['missing-output.json', 'output']]) {
  const manifest = path.join(fixturesRoot, 'missing-title-output', file);
  const out = path.join(dir, `${field}.html`);
  const r = runRenderer([manifest, '--out', out]);
  assert(r.status === 1, `${file} exits 1, got ${r.status}`);
  assert(!fs.existsSync(out), `${file} writes nothing`);
  assert(r.stderr.includes(field), `${file} stderr names the missing field "${field}": ${r.stderr}`);

  // Also true with --strict.
  const r2 = runRenderer([manifest, '--strict', '--out', out]);
  assert(r2.status === 1, `${file} --strict also exits 1`);
  assert(!fs.existsSync(out), `${file} --strict writes nothing`);
}

report('T-V4A1-05 render-required-fields');
