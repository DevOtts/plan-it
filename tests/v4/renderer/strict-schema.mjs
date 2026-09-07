#!/usr/bin/env node
// T-V4A1-02 / T-V4A1-03 — schema/kind required under --strict; LEGACY without it.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'no-schema-strict', 'manifest.json');

// T-V4A1-02: --strict rejects a manifest with no schema/kind.
{
  const dir = tmpDir('strict');
  const out = path.join(dir, 'out.html');
  const r = runRenderer([manifest, '--strict', '--out', out]);
  assert(r.status === 1, `--strict exits 1, got ${r.status}`);
  assert(!fs.existsSync(out), '--strict writes nothing');
  assert(/build-report: ERROR:/.test(r.stderr), 'stderr carries the ERROR prefix');
}

// T-V4A1-03: without --strict, renders as kind:LEGACY with a warning.
{
  const dir = tmpDir('legacy');
  const out = path.join(dir, 'out.html');
  const r = runRenderer([manifest, '--out', out]);
  assert(r.status === 2, `no --strict exits 2, got ${r.status}`);
  assert(fs.existsSync(out), 'file is written without --strict');
  const html = fs.readFileSync(out, 'utf-8');
  assert(html.includes('planit-kind" content="LEGACY"'), 'planit-kind meta reads LEGACY');
  assert(/WARNING:/.test(r.stderr), 'a WARNING is printed on stderr');
}

report('T-V4A1-02/03 strict-schema');
