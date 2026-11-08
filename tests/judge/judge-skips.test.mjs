// CP-02 D2: the judge must never turn skipped cases into PASS. Runs with DOC_IT_CLI unset and an empty HOME.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('D2 judge without doc-it: skipped cases are IMPLEMENTED-NOT-VERIFIED and the judge exits non-zero', () => {
  const home = mkdtempSync(join(tmpdir(), 'judge-home-'));
  try {
    const env = { ...process.env, HOME: home };
    delete env.DOC_IT_CLI;
    delete env.NODE_TEST_CONTEXT; // else the judge's own nested node --test runs as a child and reports nothing
    const r = spawnSync(process.execPath, ['tests/run-contract.mjs'], { cwd: REPO, env, encoding: 'utf8' });
    const out = r.stdout + r.stderr;
    assert.notEqual(r.status, 0, 'judge exited 0 with skipped cases');
    assert.match(out, /IMPLEMENTED-NOT-VERIFIED\s+T-L1\/V1\/K2[^\n]*\(\d+ skipped:/);
    assert.doesNotMatch(out, /^PASS\s+T-L1\/V1\/K2/m);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
