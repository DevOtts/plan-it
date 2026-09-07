#!/usr/bin/env node
// T-V4A2-01 — a nonexistent embed renders a visible placeholder, exit 2.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'missing-embed', 'manifest.json');
const dir = tmpDir('missing-embed');
const out = path.join(dir, 'out.html');

const r = runRenderer([manifest, '--out', out]);
assert(r.status === 2, `exit 2, got ${r.status}`);
assert(/WARNING: embed not found: .*missing\.md/.test(r.stderr), `stderr matches embed-not-found regex: ${r.stderr}`);
const html = fs.readFileSync(out, 'utf-8');
assert(html.includes('report file not found at build time'), 'HTML contains the visible placeholder text');

report('T-V4A2-01 missing-embed');
