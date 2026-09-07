#!/usr/bin/env node
// T-V4A2-15 — stdout's html-blocks=<n> counts only "html"-typed blocks.
import path from 'node:path';
import fs from 'node:fs';
import { runRenderer, tmpDir, assert, report } from './lib/helpers.mjs';

const dir = tmpDir('html-count');
const manifestPath = path.join(dir, 'manifest.json');
const manifest = {
  schema: 'planit-report/1', kind: 'SCOPE-BRIEF', title: 'HTML Count', output: 'out.html',
  glossary: { path: 'GLOSSARY.md' },
  sections: [
    { heading: 'Mixed', blocks: [
      { type: 'html', content: '<p>raw one</p>' },
      { type: 'table', headers: ['A'], rows: [['1']] },
      { type: 'html', content: '<p>raw two</p>' },
      { type: 'copy', content: 'copy me' },
    ] },
  ],
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(dir, 'GLOSSARY.md'), '| ID | Expansion | Where defined |\n|---|---|---|\n');

const out = path.join(dir, 'out.html');
const r = runRenderer([manifestPath, '--out', out]);
assert(r.status === 0, `exit 0, got ${r.status} ${r.stderr}`);
assert(/html-blocks=2$/m.test(r.stdout.trim()), `stdout html-blocks=2: ${r.stdout}`);

report('T-V4A2-15 html-passthrough-count');
