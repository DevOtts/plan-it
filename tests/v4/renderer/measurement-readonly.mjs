#!/usr/bin/env node
// T-V4A2-09 — measurement read_only:false is RENDER_FAILED, nothing written.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'measurement-writeable', 'manifest.json');
const dir = tmpDir('measurement');
const out = path.join(dir, 'out.html');

const r = runRenderer([manifest, '--out', out]);
assert(r.status === 1, `exit 1, got ${r.status}`);
assert(!fs.existsSync(out), 'nothing written');

report('T-V4A2-09 measurement-readonly');
