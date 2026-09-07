#!/usr/bin/env node
// T-V4A4-10 — each of the 17 @case-renderer CONTRACT rows' fixture is inspected for actual
// content (not just directory existence) and genuinely bears the condition its case describes.
import fs from 'node:fs';
import path from 'node:path';
import { fixturesRoot, repoRoot, assert, report } from './lib/helpers.mjs';

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(fixturesRoot, rel), 'utf-8'));
}
function readText(rel) {
  return fs.readFileSync(path.join(fixturesRoot, rel), 'utf-8');
}

// C-E2-01 determinism — two-embeds-one-flow really has 2 embeds + 1 flow.
{
  const m = readJson('two-embeds-one-flow/decisions.manifest.json');
  const blocks = m.sections.flatMap((s) => s.blocks);
  assert(blocks.filter((b) => b.type === 'embed').length === 2, 'C-E2-01: fixture has exactly 2 embed blocks');
  assert(blocks.filter((b) => b.type === 'flow').length === 1, 'C-E2-01: fixture has exactly 1 flow block');
}

// C-E2-02 missing-embed — the referenced embed path genuinely does not exist.
{
  const m = readJson('missing-embed/manifest.json');
  const embed = m.sections.flatMap((s) => s.blocks).find((b) => b.type === 'embed');
  assert(!!embed, 'C-E2-02: fixture has an embed block');
  assert(!fs.existsSync(path.join(fixturesRoot, 'missing-embed', embed.path)), `C-E2-02: "${embed.path}" genuinely does not exist`);
}

// C-E2-03 strict-schema — no schema/kind keys.
{
  const m = readJson('no-schema-strict/manifest.json');
  assert(!('schema' in m) && !('kind' in m), 'C-E2-03: fixture genuinely omits schema and kind');
}

// C-E2-04 brand-detection — all three brand sources coexist in brand-triple-hit.
{
  const base = path.join(fixturesRoot, 'brand-triple-hit');
  assert(fs.existsSync(path.join(base, '.plan-it', 'brand.json')), 'C-E2-04: .plan-it/brand.json present');
  assert(fs.existsSync(path.join(base, 'assets', 'brand', 'brand.json')), 'C-E2-04: assets/brand/brand.json present');
  assert(fs.existsSync(path.join(base, 'assets', 'brand', 'GUIDE.md')), 'C-E2-04: a markdown guideline present');
}

// C-E2-08 tally-computed — exactly 3 triage-card blocks feeding the tally group.
{
  const m = readJson('tally-three-cards/manifest.json');
  const cardsSection = m.sections.find((s) => s.id === 'cards-section');
  assert(!!cardsSection && cardsSection.blocks.filter((b) => b.type === 'triage-card').length === 3, 'C-E2-08: exactly 3 triage-card blocks in the referenced section');
}

// C-E2-09 model-id-leak — the literal string is present in body_html.
{
  const m = readJson('model-id-leak/manifest.json');
  const text = JSON.stringify(m);
  assert(text.includes('claude-sonnet-5'), 'C-E2-09: fixture body contains the literal model-ID string');
}

// C-E2-10 open-routing — no static fixture dir; the test itself stubs the platform opener.
{
  const src = fs.readFileSync(path.join(repoRoot, 'tests', 'v4', 'renderer', 'open-routing.mjs'), 'utf-8');
  assert(src.includes('PLANIT_TEST_PLATFORM') && src.includes('makeStub'), 'C-E2-10: test genuinely stubs the platform opener rather than asserting nothing');
}

// C-E2-12 xss-escape — the probe embed contains every named breakout attempt.
{
  const text = readText('xss-embed-probe/probe.md');
  for (const needle of ['</SCRIPT>', '</script >', '<!--', 'javascript:alert(1)', 'onmouseover=']) {
    assert(text.includes(needle), `C-E2-12: probe.md contains "${needle}"`);
  }
}

// C-E2-13 theme-tokens — the test genuinely runs the CSS token audit, not a stub assertion.
{
  const src = fs.readFileSync(path.join(repoRoot, 'tests', 'v4', 'renderer', 'theme-tokens.mjs'), 'utf-8');
  assert(src.includes('auditCssTokens'), 'C-E2-13: test imports and calls the real auditCssTokens function');
}

// C-E2-14 mermaid-fallback — one-flow-block has a flow block, no-flow-block has none.
{
  const withFlow = readJson('one-flow-block/manifest.json');
  const withoutFlow = readJson('no-flow-block/manifest.json');
  assert(withFlow.sections.flatMap((s) => s.blocks).some((b) => b.type === 'flow'), 'C-E2-14: one-flow-block genuinely has a flow block');
  assert(!withoutFlow.sections.flatMap((s) => s.blocks).some((b) => b.type === 'flow'), 'C-E2-14: no-flow-block genuinely has none');
}

// C-E3-01 decision-card-complete — one card misses why_yours_html, the other misses ruling.
{
  const m = readJson('decision-card-incomplete/manifest.json');
  const cards = m.sections.flatMap((s) => s.blocks).filter((b) => b.type === 'decision-card');
  const openCard = cards.find((c) => c.status === 'open');
  const ruledCard = cards.find((c) => c.status === 'ruled');
  assert(!!openCard && !openCard.why_yours_html, 'C-E3-01: the open card genuinely lacks why_yours_html');
  assert(!!ruledCard && !ruledCard.ruling, 'C-E3-01: the ruled card genuinely lacks ruling');
}

// C-E3-02 rulings-forward — EARLIER-DECISIONS.md has 3 IDs, current rows[] drops one.
{
  const earlier = readText('rulings-forward-drop/EARLIER-DECISIONS.md');
  const priorIds = [...earlier.matchAll(/\|\s*(D\d+)\s*\|/g)].map((mm) => mm[1]);
  const m = readJson('rulings-forward-drop/manifest.json');
  const currentIds = m.sections.flatMap((s) => s.blocks).find((b) => b.type === 'rulings-forward').rows.map((r) => r.id);
  const dropped = priorIds.filter((id) => !currentIds.includes(id));
  assert(dropped.length === 1, `C-E3-02: exactly one prior item is genuinely dropped, found ${dropped.length}`);
}

// C-E3-03 copy-rulings — the test's inline manifest has 2 ruled + 2 open decision-cards.
{
  const src = fs.readFileSync(path.join(repoRoot, 'tests', 'v4', 'renderer', 'copy-rulings.mjs'), 'utf-8');
  const ruledCount = (src.match(/status:\s*'ruled'/g) || []).length;
  const openCount = (src.match(/status:\s*'open'/g) || []).length;
  assert(ruledCount === 2 && openCount === 2, `C-E3-03: test constructs 2 ruled + 2 open cards, found ${ruledCount}/${openCount}`);
}

// C-E5-01 mockup-provenance — no provenance field.
{
  const m = readJson('mockup-no-provenance/manifest.json');
  const mockup = m.sections.flatMap((s) => s.blocks).find((b) => b.type === 'mockup');
  assert(!!mockup && !mockup.provenance, 'C-E5-01: fixture genuinely omits provenance');
}

// C-E5-02 measurement-readonly — read_only:false.
{
  const m = readJson('measurement-writeable/manifest.json');
  const measurement = m.sections.flatMap((s) => s.blocks).find((b) => b.type === 'measurement');
  assert(measurement && measurement.read_only === false, 'C-E5-02: fixture genuinely sets read_only:false');
}

// C-E5-03 states-triptych — misconfigured key genuinely absent.
{
  const m = readJson('states-missing-one/manifest.json');
  const states = m.sections.flatMap((s) => s.blocks).find((b) => b.type === 'states');
  assert(!!states && !states.misconfigured, 'C-E5-03: fixture genuinely omits the misconfigured key');
}

// C-E10-03 glossary-panel — 8 per-kind fixtures + a missing-glossary fixture both exist and bear content.
{
  const kindFiles = fs.readdirSync(path.join(fixturesRoot, 'glossary-one-kind-each')).filter((f) => f.endsWith('.json'));
  assert(kindFiles.length === 8, 'C-E10-03: 8 per-kind fixtures genuinely present');
  const missing = readJson('glossary-missing/manifest.json');
  assert(!missing.glossary, 'C-E10-03: glossary-missing genuinely has no glossary.path');
}

report('T-V4A4-10 negative-fixture-completeness');
