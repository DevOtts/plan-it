#!/usr/bin/env node
// T-V4A1-01 — same manifest rendered twice yields byte-identical HTML.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'two-embeds-one-flow', 'decisions.manifest.json');
const dir = tmpDir('determinism');
const out1 = path.join(dir, 'one.html');
const out2 = path.join(dir, 'two.html');

const r1 = runRenderer([manifest, '--out', out1]);
const r2 = runRenderer([manifest, '--out', out2]);

assert(r1.status === 0, `first run exit 0, got ${r1.status} stderr=${r1.stderr}`);
assert(r2.status === 0, `second run exit 0, got ${r2.status} stderr=${r2.stderr}`);

const buf1 = fs.readFileSync(out1);
const buf2 = fs.readFileSync(out2);
assert(Buffer.compare(buf1, buf2) === 0, 'two renders are byte-identical');

const stamp1 = (r1.stdout.match(/stamp=sha256:[0-9a-f]{12}/) || [])[0];
const stamp2 = (r2.stdout.match(/stamp=sha256:[0-9a-f]{12}/) || [])[0];
assert(stamp1 && stamp1 === stamp2, `stdout stamp prefixes match: ${stamp1} vs ${stamp2}`);

report('T-V4A1-01 determinism');
