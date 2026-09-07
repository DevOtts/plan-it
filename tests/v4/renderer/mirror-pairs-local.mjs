#!/usr/bin/env node
// T-V4A4-06 — the three new mirror-pair files are byte-identical, plugin path vs root path.
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot, assert, report } from './lib/helpers.mjs';

const PAIRS = [
  ['plugins/plan-it/skills/plan-it/scripts/build-report.mjs', 'scripts/build-report.mjs'],
  ['plugins/plan-it/skills/plan-it/scripts/report-template.html', 'scripts/report-template.html'],
  ['plugins/plan-it/skills/plan-it/assets/brand/default.brand.json', 'assets/brand/default.brand.json'],
];

for (const [pluginRel, rootRel] of PAIRS) {
  const a = fs.readFileSync(path.join(repoRoot, pluginRel));
  const b = fs.readFileSync(path.join(repoRoot, rootRel));
  assert(Buffer.compare(a, b) === 0, `${pluginRel} == ${rootRel} (byte-identical)`);
}

report('T-V4A4-06 mirror-pairs-local');
