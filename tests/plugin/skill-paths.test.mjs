// T-H1-04 (H1-06): every `node ${CLAUDE_PLUGIN_ROOT}/…` command documented in plan-it SKILL.md resolves in the
// installed layout. The installed plugin root is the marketplace cache folder for plugins/plan-it/ — so we copy
// that folder to a temp dir and run each documented command from there, with a cwd that is NOT the plugin.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PLUGIN = join(REPO, 'plugins', 'plan-it');
const SKILL = readFileSync(join(PLUGIN, 'skills', 'plan-it', 'SKILL.md'), 'utf8');

const documented = [...new Set(
  [...SKILL.matchAll(/node \$\{CLAUDE_PLUGIN_ROOT\}\/([^\s`'"]+)/g)].map((m) => m[1]),
)];

function cacheCopy() {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'planit-cache-')));
  const root = join(base, 'plan-it');
  cpSync(PLUGIN, root, { recursive: true });
  const cwd = join(base, 'user-project'); // a project cwd, deliberately not the plugin root
  mkdirSync(cwd);
  return { base, root, cwd };
}

test('T-H1-04 SKILL.md documents at least the known plugin-root commands', () => {
  assert.ok(documented.length >= 3, `expected >=3 documented commands, found ${documented.length}: ${documented.join(', ')}`);
  assert.ok(documented.includes('skills/plan-it/scripts/gate-check.mjs'));
});

test('T-H1-04 each documented plugin-root command path exists in a cache-shaped copy', () => {
  const { base, root } = cacheCopy();
  try {
    for (const rel of documented) {
      assert.ok(existsSync(join(root, rel)), `documented path does not exist in the installed layout: ${rel}`);
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('T-H1-04 each documented command runs with --help and exits 0 from a cache-shaped copy', () => {
  const { base, root, cwd } = cacheCopy();
  try {
    for (const rel of documented) {
      const r = spawnSync(process.execPath, [join(root, rel), '--help'], {
        cwd, encoding: 'utf8', input: '', env: { ...process.env, CLAUDE_PLUGIN_ROOT: root },
      });
      assert.equal(r.status, 0, `node ${rel} --help exited ${r.status}: ${r.stderr}`);
      assert.ok((r.stdout + r.stderr).trim().length > 0, `node ${rel} --help printed nothing`);
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test('T-H1-04 no documented node command points outside the plugin root (no bare node scripts/…)', () => {
  assert.doesNotMatch(SKILL, /node scripts\//, 'bare `node scripts/…` resolves against the user project, not the plugin');
  assert.doesNotMatch(SKILL, /node skills\//);
});
