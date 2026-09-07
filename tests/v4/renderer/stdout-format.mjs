#!/usr/bin/env node
// T-V4A1-11 — stdout matches exactly one line of the frozen built: format.
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'two-embeds-one-flow', 'decisions.manifest.json');
const dir = tmpDir('stdout-format');
const out = path.join(dir, 'out.html');

const r = runRenderer([manifest, '--out', out]);
const lines = r.stdout.trim().split('\n').filter(Boolean);
assert(lines.length === 1, `stdout is exactly one line, got ${lines.length}: ${JSON.stringify(lines)}`);
const re = /^built: .+ \(\d+ bytes\) brand=(default|repo:.+) stamp=sha256:[0-9a-f]{12} html-blocks=\d+$/;
assert(re.test(lines[0] || ''), `line matches frozen format: ${lines[0]}`);

report('T-V4A1-11 stdout-format');
