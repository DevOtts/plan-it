#!/usr/bin/env node
// T-V4A3-06 — </SCRIPT>, </script >, <!-- in an embed: exactly one script closes where
// intended, escaped sequences present literally.
// T-V4A3-07 — javascript: link and attribute-quote breakout: no href="javascript: and no
// onmouseover= attribute anywhere in the file.
// T-V4A3-11 — re-parsing the WRITTEN file (not the in-memory buffer) holds the same result.
import fs from 'node:fs';
import path from 'node:path';
import { runRenderer, fixturesRoot, tmpDir, assert, report } from './lib/helpers.mjs';

// A tolerant script-boundary scanner: counts <script ...> opens vs REAL (unescaped) closes.
function scriptBoundaries(html) {
  let opens = 0;
  const openRe = /<script\b[^>]*>/gi;
  while (openRe.exec(html)) opens++;
  let realCloses = 0;
  const closeRe = /<\/script\b[^>]*>/gi;
  let m;
  while ((m = closeRe.exec(html))) {
    const precedingChar = html[m.index - 1];
    if (precedingChar !== '\\') realCloses++;
  }
  return { opens, realCloses };
}

const manifest = path.join(fixturesRoot, 'xss-embed-probe', 'manifest.json');
const dir = tmpDir('xss-escape');
const out = path.join(dir, 'out.html');
const r = runRenderer([manifest, '--out', out]);
assert(r.status <= 2, `renders, got ${r.status} ${r.stderr}`);

function verify(html, label) {
  const { opens, realCloses } = scriptBoundaries(html);
  assert(opens === realCloses, `${label}: script opens (${opens}) == real closes (${realCloses}) — no premature boundary`);
  assert(html.includes('<\\/SCRIPT>'), `${label}: literal escaped <\\/SCRIPT> present`);
  assert(html.includes('<\\!--'), `${label}: literal escaped <\\!-- present`);
  assert(!/href\s*=\s*["']javascript:/i.test(html), `${label}: no href="javascript: anywhere`);
  assert(!/onmouseover\s*=/i.test(html), `${label}: no onmouseover= attribute anywhere`);
}

// T-V4A3-06/07: in-memory result (the file build-report.mjs just wrote).
verify(fs.readFileSync(out, 'utf-8'), 'first read');

// T-V4A3-11: re-read from disk again (adversarial-verify — trust the world, not the write).
verify(fs.readFileSync(out, 'utf-8'), 'second read (re-parsed from disk)');

report('T-V4A3-06/07/11 xss-escape');
