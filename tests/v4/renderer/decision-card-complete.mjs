#!/usr/bin/env node
// T-V4A2-05 — status:open without why_yours_html/recommendation, or status:ruled without
// ruling, each fail naming the card id.
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'decision-card-incomplete', 'manifest.json');
const dir = tmpDir('decision-card');
const out = path.join(dir, 'out.html');

const r = runRenderer([manifest, '--out', out]);
assert(r.status === 2, `exit 2, got ${r.status}`);
assert(r.stderr.includes('D1'), `stderr names D1 (open, missing why_yours_html): ${r.stderr}`);
assert(r.stderr.includes('D2'), `stderr names D2 (ruled, missing ruling): ${r.stderr}`);

report('T-V4A2-05 decision-card-complete');
