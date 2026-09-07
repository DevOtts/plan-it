#!/usr/bin/env node
// T-V4A1-06 / T-V4A1-07 — --check reports identical / stale-or-missing, never writes.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, tmpDir, copyFixture, assert, report } from './lib/helpers.mjs';

const dir = tmpDir('check-mode');
copyFixture('check-stale', dir);
const manifest = path.join(dir, 'manifest.json');
const out = path.join(dir, 'out.html');

// Render once, then --check against the identical source.
const r1 = runRenderer([manifest, '--out', out]);
assert(r1.status === 0, `initial render exits 0, got ${r1.status} ${r1.stderr}`);
const mtimeBefore = fs.statSync(out).mtimeMs;

const rCheckOk = runRenderer([manifest, '--check', '--out', out]);
assert(rCheckOk.status === 0, `--check on unchanged source exits 0, got ${rCheckOk.status} ${rCheckOk.stderr}`);
assert(fs.statSync(out).mtimeMs === mtimeBefore, '--check never writes (mtime unchanged)');

// T-V4A1-07: append one byte to the source md, then --check reports stale.
fs.appendFileSync(path.join(dir, 'source.md'), 'x');
const rStale = runRenderer([manifest, '--check', '--out', out]);
assert(rStale.status === 2, `--check on stale source exits 2, got ${rStale.status}`);
assert(/stale-or-missing/.test(rStale.stderr), 'stderr names stale-or-missing');
assert(fs.statSync(out).mtimeMs === mtimeBefore, '--check still never writes after detecting staleness');

// Stale-or-missing also fires when the twin does not exist at all.
const missingOut = path.join(dir, 'missing.html');
const rMissing = runRenderer([manifest, '--check', '--out', missingOut]);
assert(rMissing.status === 2, `--check against a missing twin exits 2, got ${rMissing.status}`);
assert(!fs.existsSync(missingOut), '--check against a missing twin still writes nothing');

report('T-V4A1-06/07 check-mode');
