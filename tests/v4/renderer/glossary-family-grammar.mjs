#!/usr/bin/env node
// T-V4A3-12 (AMD-10) — the renderer's family-pattern matching (familyMatch/isKnownGlossaryId)
// implements CONTRACT §5's placeholders byte-for-byte the way gate-check.mjs's
// familyItemToRegex does: `*` -> [A-Za-z0-9.]+, word-bounded `NN` -> [A-Z0-9]{2,3},
// `<n>`/trailing bare `n` -> \d+ — not just `*`.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'glossary-family-grammar', 'manifest.json');
const dir = tmpDir('glossary-family-grammar');
const out = path.join(dir, 'out.html');

const r = runRenderer([manifest, '--out', out]);
assert(r.status === 2, `exit 2 (exactly one warning, for Q-99), got ${r.status}: ${r.stderr}`);

// P2-11 (AMD-11) is a literal GLOSSARY.md row — must resolve literal-first, never be
// misread as a numeric range ("P2"..."P11"), and produce zero warnings of its own.
const knownIds = ['T-V4B4-17', 'C-E8-01', 'G-7', 'AMD-3', 'LG-16', 'F-A12', 'D-B6', 'P2-11'];
const html = fs.readFileSync(out, 'utf-8');
for (const id of knownIds) {
  assert(html.includes(`<abbr class="gl" title=`) && html.includes(`>${id}</abbr>`), `${id} is expanded on first use (matched by its family row)`);
}

const warningLines = r.stderr.split('\n').filter((l) => /glossary:.*not in GLOSSARY\.md/.test(l));
assert(warningLines.length === 1, `exactly one glossary warning emitted, got ${warningLines.length}: ${JSON.stringify(warningLines)}`);
assert(warningLines[0].includes('Q-99'), `the one warning names Q-99: ${warningLines[0]}`);

report('T-V4A3-12 glossary-family-grammar');
