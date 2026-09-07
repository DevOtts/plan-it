#!/usr/bin/env node
// T-V4A1-14 (AMD-9) — the CSS-token lint scans only rendered <style> blocks; the literal
// text "var(--token)" inside embedded content (e.g. CONTRACT.md's own C-E2-13 wording)
// must never trigger a false "CSS tokens referenced but not declared" warning.
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'css-token-in-embed', 'manifest.json');
const dir = tmpDir('css-token-scope');
const out = path.join(dir, 'out.html');

const r = runRenderer([manifest, '--out', out]);
assert(r.status <= 2, `renders, got ${r.status} ${r.stderr}`);
assert(!/CSS tokens referenced but not declared/.test(r.stderr), `no false CSS-token WARNING from embedded prose: ${r.stderr}`);

report('T-V4A1-14 css-token-scan-scope');
