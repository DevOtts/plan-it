#!/usr/bin/env node
// T-V4A2-02 — detection precedence: .plan-it/brand.json > assets/brand/brand.json > guideline-only > default.
// T-V4A2-03 — an empty fixture root uses the bundled default, hash matches, badge names it.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { runRenderer, fixturesRoot, tmpDir, copyFixture, assert, report, repoRoot } from './lib/helpers.mjs';

function meta(html, name) {
  const m = html.match(new RegExp(`<meta name="${name}" content="([^"]*)">`));
  return m ? m[1] : null;
}

// T-V4A2-02a: all three present — .plan-it/brand.json wins.
{
  const dir = tmpDir('brand-triple');
  copyFixture('brand-triple-hit', dir);
  const out = path.join(dir, 'out.html');
  const r = runRenderer([path.join(dir, 'manifest.json'), '--out', out], { cwd: dir, noDefaultBrand: true });
  assert(r.status <= 2, `renders, got ${r.status} ${r.stderr}`);
  const html = fs.readFileSync(out, 'utf-8');
  const expectedHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, '.plan-it', 'brand.json'))).digest('hex');
  assert((meta(html, 'planit-brand') || '').includes(expectedHash), `.plan-it/brand.json wins: ${meta(html, 'planit-brand')}`);
}

// T-V4A2-02b: remove .plan-it/brand.json — assets/brand/brand.json wins.
{
  const dir = tmpDir('brand-second');
  copyFixture('brand-triple-hit', dir);
  fs.rmSync(path.join(dir, '.plan-it'), { recursive: true, force: true });
  const out = path.join(dir, 'out.html');
  const r = runRenderer([path.join(dir, 'manifest.json'), '--out', out], { cwd: dir, noDefaultBrand: true });
  assert(r.status <= 2, `renders, got ${r.status} ${r.stderr}`);
  const html = fs.readFileSync(out, 'utf-8');
  const expectedHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, 'assets', 'brand', 'brand.json'))).digest('hex');
  assert((meta(html, 'planit-brand') || '').includes(expectedHash), `assets/brand/brand.json wins once .plan-it/ is gone: ${meta(html, 'planit-brand')}`);
}

// T-V4A2-02c: only the markdown guideline remains — default used, badge says so, exit 2.
{
  const dir = tmpDir('brand-guideline');
  copyFixture('brand-guideline-only', dir);
  const out = path.join(dir, 'out.html');
  const r = runRenderer([path.join(dir, 'manifest.json'), '--out', out], { cwd: dir, noDefaultBrand: true });
  assert(r.status === 2, `guideline-only exits 2, got ${r.status}`);
  assert(/guideline present, not tokenised/.test(r.stderr), `badge/warning text present: ${r.stderr}`);
  const html = fs.readFileSync(out, 'utf-8');
  assert(html.includes('brand: Her0 default'), 'badge reads "brand: Her0 default"');
}

// T-V4A2-03: an empty repo root uses the bundled default; hash equals sha256(default.brand.json).
{
  const dir = tmpDir('brand-none');
  copyFixture('brand-none', dir);
  const out = path.join(dir, 'out.html');
  const r = runRenderer([path.join(dir, 'manifest.json'), '--out', out], { cwd: dir, noDefaultBrand: true });
  assert(r.status === 0, `empty root exits 0, got ${r.status} ${r.stderr}`);
  const html = fs.readFileSync(out, 'utf-8');
  const defaultHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, 'assets', 'brand', 'default.brand.json'))).digest('hex');
  assert((meta(html, 'planit-brand') || '') === `default sha256=${defaultHash}`, `planit-brand = default sha256=<hash of default.brand.json>: ${meta(html, 'planit-brand')}`);
  assert(html.includes('brand: Her0 default'), 'badge reads "brand: Her0 default"');
}

report('T-V4A2-02/03 brand-detection');
