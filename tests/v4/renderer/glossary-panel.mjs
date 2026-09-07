#!/usr/bin/env node
// T-V4A3-01 — every kind renders exactly one <details class="glossary" before the first <h2>.
// T-V4A3-02 — GLOSSARY.md absent -> panel text reads "not generated yet".
// T-V4A3-03 — first prose occurrence of a glossary ID is wrapped <abbr class="gl">, later ones bare.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

// T-V4A3-01: one minimal manifest per each of the 8 report-family kinds.
{
  const dir = path.join(fixturesRoot, 'glossary-one-kind-each');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  assert(files.length === 8, `8 per-kind manifests present, found ${files.length}`);
  for (const file of files) {
    const outDir = tmpDir(`glossary-kind-${file}`);
    const out = path.join(outDir, 'out.html');
    const r = runRenderer([path.join(dir, file), '--out', out]);
    assert(r.status <= 2, `${file} renders (exit ${r.status}): ${r.stderr}`);
    const html = fs.readFileSync(out, 'utf-8');
    const detailsIdx = html.indexOf('<details class="glossary"');
    const h2Idx = html.indexOf('<h2>');
    assert(detailsIdx !== -1, `${file}: glossary panel present`);
    assert((html.match(/<details class="glossary"/g) || []).length === 1, `${file}: exactly one glossary panel`);
    assert(h2Idx === -1 || detailsIdx < h2Idx, `${file}: glossary panel occurs before the first <h2>`);
  }
}

// T-V4A3-02: GLOSSARY.md absent entirely.
{
  const manifest = path.join(fixturesRoot, 'glossary-missing', 'manifest.json');
  const dir = tmpDir('glossary-missing');
  const out = path.join(dir, 'out.html');
  const r = runRenderer([manifest, '--out', out]);
  assert(r.status === 2, `exit 2, got ${r.status}`);
  const html = fs.readFileSync(out, 'utf-8');
  assert(html.includes('not generated yet'), 'panel text reads "not generated yet"');
}

// T-V4A3-03: first-use expansion, code spans untouched, later occurrences bare.
{
  const dir = tmpDir('glossary-firstuse');
  fs.writeFileSync(path.join(dir, 'GLOSSARY.md'), '| ID | Expansion | Where defined |\n|---|---|---|\n| V4A1 | renderer core epic | delivery/v4/epics/epics-a-renderer.md |\n');
  const manifestPath = path.join(dir, 'manifest.json');
  const manifest = {
    schema: 'planit-report/1', kind: 'SCOPE-BRIEF', title: 'First Use', output: 'out.html',
    glossary: { path: 'GLOSSARY.md' },
    sections: [{ heading: 'Body', blocks: [
      { type: 'html', content: '<p>See V4A1 for detail. Also <code>V4A1</code> in code. And V4A1 again.</p>' },
    ] }],
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  const out = path.join(dir, 'out.html');
  const r = runRenderer([manifestPath, '--out', out]);
  assert(r.status <= 2, `renders, got ${r.status} ${r.stderr}`);
  const html = fs.readFileSync(out, 'utf-8');
  assert(html.includes('<abbr class="gl" title="renderer core epic">V4A1</abbr>'), 'first prose occurrence wrapped with title + gl class');
  assert(html.includes('<span class="gl-x">'), 'one .gl-x expansion emitted');
  assert(html.includes('<code>V4A1</code>'), 'code-span occurrence untouched');
  assert(html.includes('<abbr>V4A1</abbr>'), 'a later occurrence is a bare <abbr>');
}

// AMD-11: a `glossary` block's own rendered table (escaped family-pattern cells like
// "V4A&lt;n&gt;") must never be re-scanned by the first-use pass as if it were prose.
{
  const dir = tmpDir('glossary-block-noscan');
  fs.writeFileSync(path.join(dir, 'GLOSSARY.md'), '| ID | Expansion | Where defined |\n|---|---|---|\n| V4A<n> | SQ-A epic ID | delivery/v4/epics/epics-a-renderer.md |\n');
  const manifestPath = path.join(dir, 'manifest.json');
  const manifest = {
    schema: 'planit-report/1', kind: 'GLOSSARY', title: 'Glossary Block No-Scan', output: 'out.html',
    glossary: { path: 'GLOSSARY.md' },
    sections: [{ heading: 'Vocabulary', blocks: [{ type: 'glossary' }] }],
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  const out = path.join(dir, 'out.html');
  const r = runRenderer([manifestPath, '--out', out]);
  assert(r.status <= 2, `renders, got ${r.status} ${r.stderr}`);
  const html = fs.readFileSync(out, 'utf-8');
  assert(html.includes('V4A&lt;n&gt;'), 'the glossary block displays the escaped family-pattern cell verbatim');
  assert(!/glossary: ID "V4A" used but not in GLOSSARY\.md/.test(r.stderr), `no bogus "V4A" warning from the block's own table: ${r.stderr}`);
}

report('T-V4A3-01/02/03 glossary-panel');
