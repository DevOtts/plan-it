#!/usr/bin/env node
// T-V4A2-11 — one flow block emits the pinned cdnjs script + one <pre class="mermaid">;
// zero flow blocks emit no mermaid script tag anywhere.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

{
  const manifest = path.join(fixturesRoot, 'one-flow-block', 'manifest.json');
  const dir = tmpDir('flow-one');
  const out = path.join(dir, 'out.html');
  const r = runRenderer([manifest, '--out', out]);
  assert(r.status <= 2, `renders, got ${r.status} ${r.stderr}`);
  const html = fs.readFileSync(out, 'utf-8');
  assert(html.includes('cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js'), 'pinned cdnjs 10.9.1 script present');
  assert((html.match(/<pre class="mermaid"/g) || []).length === 1, 'exactly one <pre class="mermaid">');
  assert(html.includes("securityLevel:'strict'"), "securityLevel:'strict' present");
  assert(html.includes('<noscript>'), '<noscript> fallback present');
}

{
  const manifest = path.join(fixturesRoot, 'no-flow-block', 'manifest.json');
  const dir = tmpDir('flow-none');
  const out = path.join(dir, 'out.html');
  const r = runRenderer([manifest, '--out', out]);
  assert(r.status <= 2, `renders, got ${r.status} ${r.stderr}`);
  const html = fs.readFileSync(out, 'utf-8');
  assert(!html.includes('<script src="https://cdnjs.cloudflare.com') && !html.includes('mermaid.initialize'), 'zero flow blocks -> zero mermaid script tags anywhere');
}

report('T-V4A2-11 mermaid-fallback');
