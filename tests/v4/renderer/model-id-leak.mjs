#!/usr/bin/env node
// T-V4A3-04 — a claude-* model ID in rendered HTML fails naming the exact string.
// T-V4A3-05 — the same token in allow_tokens no longer warns for that token.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

{
  const manifest = path.join(fixturesRoot, 'model-id-leak', 'manifest.json');
  const dir = tmpDir('model-id-leak');
  const out = path.join(dir, 'out.html');
  const r = runRenderer([manifest, '--out', out]);
  assert(r.status === 2, `exit 2, got ${r.status}`);
  assert(/model ID "claude-sonnet-5" in rendered HTML/.test(r.stderr), `stderr matches expected message: ${r.stderr}`);
}

{
  const manifest = path.join(fixturesRoot, 'model-id-allowlisted', 'manifest.json');
  const dir = tmpDir('model-id-allowlisted');
  const out = path.join(dir, 'out.html');
  const r = runRenderer([manifest, '--out', out]);
  assert(!/model ID "claude-cli-runner"/.test(r.stderr), `no warning for the allow-listed token: ${r.stderr}`);
}

report('T-V4A3-04/05 model-id-leak');
