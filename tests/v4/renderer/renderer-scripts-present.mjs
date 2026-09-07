#!/usr/bin/env node
// T-V4A4-03 — every run: cell of the 17 @case-renderer CONTRACT rows names a
// tests/v4/renderer/*.mjs file that exists and loads without module-not-found.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { repoRoot, assert, report } from './lib/helpers.mjs';
import { extractCaseRendererRows } from './lib/contract-cases.mjs';

const rows = extractCaseRendererRows(repoRoot);
assert(rows.length === 17, `17 @case-renderer CONTRACT rows found, got ${rows.length}`);

for (const row of rows) {
  const m = row.run.match(/node (tests\/v4\/renderer\/[\w.-]+\.mjs)/);
  assert(!!m, `${row.id}: run cell names a tests/v4/renderer/*.mjs file: ${row.run}`);
  if (!m) continue;
  const scriptPath = path.join(repoRoot, m[1]);
  assert(fs.existsSync(scriptPath), `${row.id}: ${m[1]} exists on disk`);
}

// "directly executable via node <file> without throwing a module-not-found error" — spawn
// each script exactly as CONTRACT invokes it; a real test pass/fail is not this case's concern,
// only that the module graph resolves (no ERR_MODULE_NOT_FOUND / Cannot find module).
const scripts = new Set(rows.map((r) => r.run.match(/node (tests\/v4\/renderer\/[\w.-]+\.mjs)/)?.[1]).filter(Boolean));
for (const rel of scripts) {
  const r = spawnSync(process.execPath, [path.join(repoRoot, rel)], { encoding: 'utf-8', cwd: repoRoot });
  const brokenModule = /Cannot find module|ERR_MODULE_NOT_FOUND/.test(r.stderr || '');
  assert(!brokenModule, `${rel} loads without a module-not-found error: ${r.stderr}`);
}

report('T-V4A4-03 renderer-scripts-present');
