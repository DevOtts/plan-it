// T-H1-06 (H1-06): `gate-check handoff` must not read plan-it's generated ENV-FACTS.md (PRESENT/ABSENT probe
// table) as a STATUS board when it sits in the delivery folder. A real STATUS board with a bad status must still fail.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const GATE = join(REPO, 'plugins', 'plan-it', 'skills', 'plan-it', 'scripts', 'gate-check.mjs');

// Same first line and probe-table shape that gate-check's envFactsMarkdown() writes.
const ENV_FACTS = `# ENV-FACTS — probed environment facts (never guessed)

- shape: S (2-probe set — formats.md §9)
- generated-by: \`gate-check preflight\` (deterministic; re-run to refresh)
- status vocabulary: PRESENT | ABSENT | TIMEOUT — ABSENT/TIMEOUT fail the preflight gate

| id | check | status | evidence | tool |
|---|---|---|---|---|
| node-present | \`node --version\` | PRESENT | v20.19.2 | |
| git-absent | \`git --version\` | ABSENT | exit 127 | |
`;

function delivery(files) {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'planit-envfacts-')));
  const dir = join(base, 'delivery');
  mkdirSync(dir, { recursive: true });
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return { base, dir };
}

test('T-H1-06 handoff ignores a generated ENV-FACTS.md in the delivery folder (no board-vocabulary failure)', () => {
  const { base, dir } = delivery({ 'ENV-FACTS.md': ENV_FACTS });
  try {
    const r = spawnSync(process.execPath, [GATE, 'handoff', dir], { encoding: 'utf8' });
    const out = r.stdout + r.stderr;
    assert.doesNotMatch(out, /ENV-FACTS\.md:\d+: status "PRESENT"/);
    assert.doesNotMatch(out, /ENV-FACTS\.md[^\n]*outside the 4-term vocabulary/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('T-H1-06 control: a hand-written STATUS board with a non-vocabulary status still fails handoff', () => {
  const board = [
    '# STATUS',
    '',
    '| id | task | Status |',
    '|---|---|---|',
    '| T-A1-01 | first task | PRESENT |',
    '',
  ].join('\n');
  const { base, dir } = delivery({ 'STATUS.md': board, 'ENV-FACTS.md': ENV_FACTS });
  try {
    const r = spawnSync(process.execPath, [GATE, 'handoff', dir], { encoding: 'utf8' });
    const out = r.stdout + r.stderr;
    assert.match(out, /STATUS\.md:\d+: status "PRESENT" outside the 4-term vocabulary/);
    assert.doesNotMatch(out, /ENV-FACTS\.md:\d+: status/);
    assert.equal(r.status, 1);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
