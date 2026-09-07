#!/usr/bin/env node
// C-E2-11 — zero dependencies (G-2): every package.json under plugins/plan-it/ (and the
// repo root, if one exists) declares no dependencies/devDependencies, and every .mjs/.js
// under plugins/plan-it/ (plus the root mirrors under scripts/**) imports/requires only
// node:-prefixed builtins or relative/absolute paths. Node builtins only; zero deps itself.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..', '..');

let failures = 0;
let checks = 0;

function fail(msg) {
  failures++;
  console.error(`FAIL: ${msg}`);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// (a) package.json dependency check — plugins/plan-it/ tree + repo root.
const pkgCandidates = [
  path.join(repoRoot, 'package.json'),
  ...walk(path.join(repoRoot, 'plugins', 'plan-it')).filter((f) => path.basename(f) === 'package.json'),
];
for (const pkgPath of pkgCandidates) {
  if (!fs.existsSync(pkgPath)) continue;
  checks++;
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  } catch (e) {
    fail(`${path.relative(repoRoot, pkgPath)}: unreadable/invalid JSON (${e.message})`);
    continue;
  }
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const depNames = Object.keys(deps);
  if (depNames.length > 0) {
    fail(`${path.relative(repoRoot, pkgPath)}: declares dependencies/devDependencies: ${depNames.join(', ')}`);
  }
}

// (b) import/require scan — every .mjs/.js under plugins/plan-it/, plus the root mirrors
// under scripts/**.
const scanDirs = [path.join(repoRoot, 'plugins', 'plan-it'), path.join(repoRoot, 'scripts')].filter((d) =>
  fs.existsSync(d),
);
const files = scanDirs
  .flatMap((d) => walk(d))
  .filter((f) => f.endsWith('.mjs') || f.endsWith('.js'));

// import ... from '<target>' | import '<target>' | import(<target>) | require(<target>)
const importFromRe = /\bimport\s+(?:[^'"()]*?\bfrom\s+)?['"]([^'"]+)['"]/g;
const dynamicImportRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const requireRe = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function isAllowed(target) {
  if (target.startsWith('node:')) return true;
  if (target.startsWith('.') || target.startsWith('/')) return true;
  return false;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

for (const file of files) {
  checks++;
  const text = fs.readFileSync(file, 'utf-8');
  const rel = path.relative(repoRoot, file);
  for (const re of [importFromRe, dynamicImportRe, requireRe]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const target = m[1];
      if (!isAllowed(target)) {
        fail(`${rel}:${lineOf(text, m.index)}: non-node:/non-relative import "${target}"`);
      }
    }
  }
}

if (checks === 0) {
  fail('no package.json or script files were found to check — scan is not exercising anything real');
}

if (failures > 0) {
  console.error(`zero-deps: ${failures} failure(s) across ${checks} check(s)`);
  process.exit(1);
}
console.log(`PASS C-E2-11 zero-deps: ${checks} check(s), 0 external deps, 0 non-node: imports`);
process.exit(0);
