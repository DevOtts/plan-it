#!/usr/bin/env node
// T-V4A2-12 — table computed_footer sums numeric columns; cards render with badge
// b-ok class parity to the ancestor.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, tmpDir, assert, report } from './lib/helpers.mjs';

const dir = tmpDir('smoke');
const manifestPath = path.join(dir, 'manifest.json');
const manifest = {
  schema: 'planit-report/1', kind: 'SCOPE-BRIEF', title: 'Smoke', output: 'out.html',
  glossary: { path: 'GLOSSARY.md' },
  sections: [
    { heading: 'Table', blocks: [
      { type: 'table', headers: ['Item', 'Count'], rows: [['a', '3'], ['b', '4']], computed_footer: true },
    ] },
    { heading: 'Cards', blocks: [
      { type: 'cards', items: [{ id: 'E1', title: 'Shipped', badge: { label: 'shipped', tone: 'ok' }, body_html: '<p>done</p>' }] },
    ] },
  ],
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(dir, 'GLOSSARY.md'), '| ID | Expansion | Where defined |\n|---|---|---|\n| E1 | test card id | fixture |\n');

const out = path.join(dir, 'out.html');
const r = runRenderer([manifestPath, '--out', out]);
assert(r.status === 0, `exit 0, got ${r.status} ${r.stderr}`);
const html = fs.readFileSync(out, 'utf-8');
assert(/<tr class="footer">.*<td>7<\/td>/s.test(html.replace(/\n/g, ' ')) || html.includes('<td>7</td>'), `footer row sums to 7: ${html.match(/<tr class="footer">[\s\S]*?<\/tr>/)}`);
assert(html.includes('badge b-ok'), 'badge b-ok class present (ancestor parity)');
assert(html.includes('class="card"'), 'card class present');

report('T-V4A2-12 block-catalogue-smoke');
