// Shared test helpers for tests/v4/renderer/*.mjs — zero-dep (node: builtins only, G-2).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
export const rendererPath = path.join(repoRoot, 'scripts', 'build-report.mjs');
export const fixturesRoot = path.join(repoRoot, 'tests', 'fixtures', 'v4', 'report');

export function runRenderer(args, opts = {}) {
  const env = { ...process.env, ...(opts.env || {}) };
  // Unless the caller is specifically testing brand detection, pin --brand default so
  // fixture runs are decoupled from this repo's own assets/brand/*.md guideline (V4A2 concern).
  const finalArgs = args.includes('--brand') || opts.noDefaultBrand ? args : [...args, '--brand', 'default'];
  return spawnSync(process.execPath, [rendererPath, ...finalArgs], { encoding: 'utf-8', env, cwd: opts.cwd || repoRoot });
}

export function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `planit-${prefix}-`));
}

let failures = 0;
let passed = 0;

export function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error(`FAIL: ${msg}`);
  } else {
    passed++;
  }
}

export function report(name) {
  if (failures > 0) {
    console.error(`${name}: ${failures} failure(s), ${passed} passed`);
    process.exit(1);
  }
  console.log(`PASS ${name} (${passed} assertions)`);
  process.exit(0);
}

export function copyFixture(name, destDir) {
  const src = path.join(fixturesRoot, name);
  fs.cpSync(src, destDir, { recursive: true });
  return destDir;
}
