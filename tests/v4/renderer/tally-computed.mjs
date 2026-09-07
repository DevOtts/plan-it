#!/usr/bin/env node
// T-V4A2-04 — tally tiles are counted at render time, never manifest-typed (G-5).
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, copyFixture, assert, report } from './lib/helpers.mjs';

const dir = tmpDir('tally');
copyFixture('tally-three-cards', dir);
const manifestPath = path.join(dir, 'manifest.json');
const out = path.join(dir, 'out.html');

const r1 = runRenderer([manifestPath, '--out', out]);
assert(r1.status <= 2, `first render ok, got ${r1.status} ${r1.stderr}`);
let html = fs.readFileSync(out, 'utf-8');
assert(/<span class="tval">3<\/span>/.test(html), `tile reads 3 before the 4th card: ${html.match(/<span class="tval">\d+<\/span>/)}`);

// Add a 4th triage-card to the same section — no tally "number" field exists to edit.
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
manifest.sections[0].blocks.push({ type: 'triage-card', what: 'a', why: 'b', need: 'c', decide: 'd', depends: 'e', verdict: 'decide' });
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

const r2 = runRenderer([manifestPath, '--out', out]);
assert(r2.status <= 2, `second render ok, got ${r2.status} ${r2.stderr}`);
html = fs.readFileSync(out, 'utf-8');
assert(/<span class="tval">4<\/span>/.test(html), `tile reads 4 after adding the 4th card: ${html.match(/<span class="tval">\d+<\/span>/)}`);

report('T-V4A2-04 tally-computed');
