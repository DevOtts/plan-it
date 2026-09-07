#!/usr/bin/env node
// T-V4A2-08 — a mockup without provenance renders the visible red chip, exit 2.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'mockup-no-provenance', 'manifest.json');
const dir = tmpDir('mockup');
const out = path.join(dir, 'out.html');

const r = runRenderer([manifest, '--out', out]);
assert(r.status === 2, `exit 2, got ${r.status}`);
const html = fs.readFileSync(out, 'utf-8');
assert(html.includes('provenance missing — not drawn from measured rows'), 'HTML contains the red chip text');

report('T-V4A2-08 mockup-provenance');
