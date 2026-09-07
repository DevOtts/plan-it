#!/usr/bin/env node
// T-V4A2-13 — a triage-card verdict outside plan|build|decide|skip: nothing written, exit 1.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'triage-bad-verdict', 'manifest.json');
const dir = tmpDir('triage-verdict');
const out = path.join(dir, 'out.html');

const r = runRenderer([manifest, '--out', out]);
assert(r.status === 1, `exit 1, got ${r.status}`);
assert(!fs.existsSync(out), 'nothing written');

report('T-V4A2-13 triage-card-verdict');
