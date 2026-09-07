#!/usr/bin/env node
// T-V4A3-10 — an ID matching the union grammar but absent from GLOSSARY.md is a listed
// warning (soft, exit 2), never silently dropped.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, tmpDir, assert, report } from './lib/helpers.mjs';

const dir = tmpDir('glossary-unknown-id');
fs.writeFileSync(path.join(dir, 'GLOSSARY.md'), '| ID | Expansion | Where defined |\n|---|---|---|\n');
const manifestPath = path.join(dir, 'manifest.json');
const manifest = {
  schema: 'planit-report/1', kind: 'SCOPE-BRIEF', title: 'Unknown ID', output: 'out.html',
  glossary: { path: 'GLOSSARY.md' },
  sections: [{ heading: 'Body', blocks: [{ type: 'html', content: '<p>See W99 for the wave plan.</p>' }] }],
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

const out = path.join(dir, 'out.html');
const r = runRenderer([manifestPath, '--out', out]);
assert(r.status === 2, `exit 2, got ${r.status}`);
assert(/W99/.test(r.stderr) && /not in GLOSSARY\.md/.test(r.stderr), `stderr names the unknown ID W99: ${r.stderr}`);

report('T-V4A3-10 glossary-unknown-id-warn');
