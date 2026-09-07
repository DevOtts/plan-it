#!/usr/bin/env node
// T-V4A2-07 — copy-rulings emits every ruled+open decision-card id, in document order,
// as one line each inside one <pre class="copy">.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, tmpDir, assert, report } from './lib/helpers.mjs';

const dir = tmpDir('copy-rulings');
const manifestPath = path.join(dir, 'manifest.json');
const manifest = {
  schema: 'planit-report/1', kind: 'DECISIONS', title: 'Copy Rulings', output: 'out.html',
  glossary: { path: 'GLOSSARY.md' },
  sections: [
    { heading: 'Decisions', blocks: [
      { type: 'decision-card', id: 'D1', status: 'ruled', question_html: '<p>Question one?</p>', ruling: 'granted' },
      { type: 'decision-card', id: 'D2', status: 'open', question_html: '<p>Question two?</p>', recommendation: 'do X', why_yours_html: '<p>because</p>' },
      { type: 'decision-card', id: 'D3', status: 'ruled', question_html: '<p>Question three?</p>', ruling: 'denied' },
      { type: 'decision-card', id: 'D4', status: 'open', question_html: '<p>Question four?</p>', recommendation: 'do Y', why_yours_html: '<p>because too</p>' },
    ] },
    { heading: 'Copy', blocks: [{ type: 'copy-rulings' }] },
  ],
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
fs.writeFileSync(dir + '/GLOSSARY.md', '| ID | Expansion | Where defined |\n|---|---|---|\n| D1 | test decision 1 | fixture |\n| D2 | test decision 2 | fixture |\n| D3 | test decision 3 | fixture |\n| D4 | test decision 4 | fixture |\n');

const out = path.join(dir, 'out.html');
const r = runRenderer([manifestPath, '--out', out]);
assert(r.status === 0, `exit 0, got ${r.status} ${r.stderr}`);
const html = fs.readFileSync(out, 'utf-8');
const preMatch = html.match(/<pre class="copy">([\s\S]*?)<\/pre>/);
assert(!!preMatch, 'exactly one <pre class="copy"> block present');
const lines = preMatch[1].trim().split('\n');
assert(lines.length === 4, `4 lines in the copy block, got ${lines.length}: ${JSON.stringify(lines)}`);
assert(lines[0].startsWith('D1:') && lines[1].startsWith('D2:') && lines[2].startsWith('D3:') && lines[3].startsWith('D4:'), `document order preserved: ${JSON.stringify(lines)}`);

report('T-V4A2-07 copy-rulings');
