#!/usr/bin/env node
// T-V4A1-12 — the five planit-* metas are present and hash-correct.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { runRenderer, fixturesRoot, tmpDir, assert, report, repoRoot } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'two-embeds-one-flow', 'decisions.manifest.json');
const dir = tmpDir('stamp-format');
const out = path.join(dir, 'out.html');

const r = runRenderer([manifest, '--out', out]);
assert(r.status === 0, `render exits 0, got ${r.status} ${r.stderr}`);
const html = fs.readFileSync(out, 'utf-8');

function meta(name) {
  const m = html.match(new RegExp(`<meta name="${name}" content="([^"]*)">`));
  return m ? m[1] : null;
}

const source = meta('planit-source');
assert(!!source, 'planit-source meta present');
const sourceHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(fixturesRoot, 'two-embeds-one-flow', 'source.md'))).digest('hex');
assert(source.includes(sourceHash), `planit-source hash matches source.md sha256 (${sourceHash})`);

const embeds = meta('planit-embeds');
assert(embeds !== null, 'planit-embeds meta present');
assert(embeds.includes('embed1.md') && embeds.includes('embed2.md'), 'planit-embeds names both embeds');
for (const part of embeds.split(';').filter(Boolean)) {
  assert(!part.includes('/./') && !part.startsWith('./'), `embed relpath has no ./ prefix: ${part}`);
  assert(!part.includes('\\'), `embed relpath is forward-slash: ${part}`);
}

const brand = meta('planit-brand');
assert(!!brand && /sha256=[0-9a-f]{64}/.test(brand), `planit-brand has a 64-hex hash: ${brand}`);

const renderer = meta('planit-renderer');
assert(!!renderer && renderer.startsWith('build-report.mjs/4.0.0'), `planit-renderer names build-report.mjs/4.0.0: ${renderer}`);
const templateHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, 'scripts', 'report-template.html'))).digest('hex');
assert(renderer.includes(templateHash), 'planit-renderer names the template\'s own hash');

const kind = meta('planit-kind');
assert(kind === 'DECISIONS', `planit-kind reads DECISIONS: ${kind}`);

report('T-V4A1-12 stamp-format');
