#!/usr/bin/env node
// T-V4A2-06 — a dropped prior ruling fails naming it; with all present, the table lists them all.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, copyFixture, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'rulings-forward-drop', 'manifest.json');
const dir = tmpDir('rulings-forward-drop');
const out = path.join(dir, 'out.html');
const rDrop = runRenderer([manifest, '--out', out]);
assert(rDrop.status === 2, `drop case exits 2, got ${rDrop.status}`);
assert(rDrop.stderr.includes('D3'), `stderr names the dropped item D3: ${rDrop.stderr}`);

const dir2 = tmpDir('rulings-forward-complete');
copyFixture('rulings-forward-drop', dir2);
const manifestPath2 = path.join(dir2, 'manifest.json');
const m = JSON.parse(fs.readFileSync(manifestPath2, 'utf-8'));
m.sections[0].blocks[0].rows.push({ id: 'D3', your_call: 'agree', state: 'ratified' });
fs.writeFileSync(manifestPath2, JSON.stringify(m, null, 2));
const out2 = path.join(dir2, 'out.html');
const rComplete = runRenderer([manifestPath2, '--out', out2]);
assert(rComplete.status === 0, `complete case exits 0, got ${rComplete.status} ${rComplete.stderr}`);
const html = fs.readFileSync(out2, 'utf-8');
assert(html.includes('Your rulings'), 'renders the "Your rulings" table');
assert(html.includes('D1') && html.includes('D2') && html.includes('D3'), 'lists all 3 items');

report('T-V4A2-06 rulings-forward');
