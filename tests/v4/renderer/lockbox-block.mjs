#!/usr/bin/env node
// T-V4A2-14 — a lockbox block lists all items verbatim, in the order given.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, tmpDir, assert, report } from './lib/helpers.mjs';

const dir = tmpDir('lockbox');
const manifestPath = path.join(dir, 'manifest.json');
const manifest = {
  schema: 'planit-report/1', kind: 'CONTRACT', title: 'Lockbox', output: 'out.html',
  glossary: { path: 'GLOSSARY.md' },
  sections: [
    { heading: 'Lockbox', blocks: [
      { type: 'lockbox', owner: 'Fernando Ott', date: '2026-09-07', items: ['first item', 'second item', 'third item'] },
    ] },
  ],
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(dir, 'GLOSSARY.md'), '| ID | Expansion | Where defined |\n|---|---|---|\n');

const out = path.join(dir, 'out.html');
const r = runRenderer([manifestPath, '--out', out]);
assert(r.status === 0, `exit 0, got ${r.status} ${r.stderr}`);
const html = fs.readFileSync(out, 'utf-8');
const lockboxMatch = html.match(/<div class="lockbox">[\s\S]*?<\/div>/);
assert(!!lockboxMatch, 'a .lockbox div is present');
const liMatch = [...(lockboxMatch ? lockboxMatch[0] : '').matchAll(/<li>([^<]*)<\/li>/g)].map((m) => m[1]);
assert(liMatch.join('|') === 'first item|second item|third item', `items in order: ${JSON.stringify(liMatch)}`);

report('T-V4A2-14 lockbox-block');
