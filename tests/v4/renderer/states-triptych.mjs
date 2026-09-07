#!/usr/bin/env node
// T-V4A2-10 — a states block missing one of good/empty/misconfigured renders that column
// grey with "not enumerated", exit 2.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'states-missing-one', 'manifest.json');
const dir = tmpDir('states');
const out = path.join(dir, 'out.html');

const r = runRenderer([manifest, '--out', out]);
assert(r.status === 2, `exit 2, got ${r.status}`);
const html = fs.readFileSync(out, 'utf-8');
assert(html.includes('not enumerated — this state has not been designed'), 'HTML contains the grey "not enumerated" text');

report('T-V4A2-10 states-triptych');
