// gate-check glossary and a STATUS.md generated from status.json (finding H-23).
// A generated board lists task ids that the epics define; the glossary check must not read it as prose,
// but a hand-written STATUS.md is still checked, and so is a file that only claims to be generated.
// Run: node --test tests/status-json/glossary-generated.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const GATE = join(here, '../../plugins/plan-it/skills/plan-it/scripts/gate-check.mjs');
const MARK = '<!-- generated from status.json by status-write; do not edit by hand -->';

function pkg(status) {
  const d = mkdtempSync(join(tmpdir(), 'glossary-gen-'));
  writeFileSync(join(d, 'GLOSSARY.md'), '# Glossary\n\n| ID | Meaning | Where |\n|---|---|---|\n| AMD-1 | an amendment | decisions |\n');
  writeFileSync(join(d, 'STATUS.md'), status);
  return d;
}
const glossary = (d) => spawnSync(process.execPath, [GATE, 'glossary', d], { encoding: 'utf8' });
const board = (first) => `${first}\n# STATUS\n\n| Task | Status |\n|---|---|\n| F4-01 | not-started |\n| M2-07 | not-started |\n\nSee AMD-1.\n`;

test('a generated STATUS.md with task ids the glossary does not list passes', () => {
  const d = pkg(board(MARK));
  const r = glossary(d);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /PASS — glossary/);
  rmSync(d, { recursive: true, force: true });
});

test('the same board WITHOUT the marker is hand-written prose: its unknown ids fail', () => {
  const d = pkg(board('# status board'));
  const r = glossary(d);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /unknown ID "F4-01"/);
  assert.match(r.stderr, /unknown ID "M2-07"/);
  rmSync(d, { recursive: true, force: true });
});

test('a marker that is not on the first line does not exempt the file', () => {
  const d = pkg(board('# title first\n' + MARK));
  const r = glossary(d);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /unknown ID "F4-01"/);
  rmSync(d, { recursive: true, force: true });
});

test('other files are still checked when STATUS.md is generated', () => {
  const d = pkg(board(MARK));
  writeFileSync(join(d, 'DECISIONS.md'), '# Decisions\n\nWe follow ZZ-9.\n');
  const r = glossary(d);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /DECISIONS\.md:\d+: unknown ID "ZZ-9"/);
  rmSync(d, { recursive: true, force: true });
});
