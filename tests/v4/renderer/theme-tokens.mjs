#!/usr/bin/env node
// T-V4A3-08 — every var(--token) referenced in the assembled <style> is declared in the
// bare, un-themed :root block.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';
import { auditCssTokens } from '../../../scripts/build-report.mjs';

const manifest = path.join(fixturesRoot, 'two-embeds-one-flow', 'decisions.manifest.json');
const dir = tmpDir('theme-tokens');
const out = path.join(dir, 'out.html');
const r = runRenderer([manifest, '--out', out]);
assert(r.status <= 2, `renders, got ${r.status} ${r.stderr}`);
const html = fs.readFileSync(out, 'utf-8');
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
assert(!!styleMatch, 'a <style> block is present');
const { missing, declared, referenced } = auditCssTokens(styleMatch ? styleMatch[1] : '');
assert(referenced.size > 0, 'at least one var(--token) is referenced');
assert(declared.size > 0, 'the bare :root block declares at least one token');
assert(missing.length === 0, `zero tokens referenced-but-undeclared, got: ${missing.join(', ')}`);

report('T-V4A3-08 theme-tokens');
