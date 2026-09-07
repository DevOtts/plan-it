#!/usr/bin/env node
// T-V4A1-13 (AMD-9) — a manifest stored in a subfolder still stamps twin-relative relpaths,
// never manifest-relative ones (CONTRACT §4.3).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runRenderer, fixturesRoot, repoRoot, assert, report } from './lib/helpers.mjs';

const manifest = path.join(fixturesRoot, 'manifest-in-subdir', 'manifests', 'report.manifest.json');
const outHtml = path.join(fixturesRoot, 'manifest-in-subdir', 'REPORT.html');
try { fs.unlinkSync(outHtml); } catch (e) { /* ok if absent */ }

const r = runRenderer([manifest]);
assert(r.status <= 2, `renders, got ${r.status} ${r.stderr}`);
assert(fs.existsSync(outHtml), 'twin written next to REPORT.md, not next to the manifest');

const html = fs.readFileSync(outHtml, 'utf-8');
const source = (html.match(/<meta name="planit-source" content="([^"]*)">/) || [])[1] || '';
const embeds = (html.match(/<meta name="planit-embeds" content="([^"]*)">/) || [])[1] || '';
assert(source.startsWith('REPORT.md sha256='), `planit-source is twin-relative ("REPORT.md ..."), got: ${source}`);
assert(!source.includes('..'), `planit-source has no "../" — it is relative to the twin's own directory, not the manifest's: ${source}`);
assert(embeds.startsWith('EMBED.md sha256='), `planit-embeds is twin-relative ("EMBED.md ..."), got: ${embeds}`);

// gate-check mirror (V4B4 verb) must also see them as a fresh pair. That verb lives on
// epic/v4b-lints, not yet on main — try main first (future-proof once it merges), else the
// worktree, else mark this one sub-assertion INV rather than hard-failing the whole case.
// Black-box probe: does this gate-check.mjs copy's own usage line list "mirror" as a known
// verb? (Its enumerated verb list is piped: "<verify|freeze|...|mirror|...>" — "mirror-check"
// is a different, always-present verb and never matches this bounded pattern.)
function knowsMirrorVerb(gateCheckPath) {
  const r = spawnSync(process.execPath, [gateCheckPath], { encoding: 'utf-8' });
  const combined = `${r.stdout || ''}${r.stderr || ''}`;
  return /[|<]mirror[|>]/.test(combined);
}

function findGateCheck() {
  // In-tree first (true post-W2-merge, and in any fresh worktree cut from main after that) —
  // probed black-box by behavior, not by reading source, so a rename/refactor can't fool it.
  const onMain = path.join(repoRoot, 'plugins', 'plan-it', 'skills', 'plan-it', 'scripts', 'gate-check.mjs');
  if (fs.existsSync(onMain) && knowsMirrorVerb(onMain)) return onMain;

  // Fallback only while V4B4 hasn't merged yet: v4b-lints is a sibling worktree, not nested
  // under this one — ask git for the shared checkout's worktree list rather than assuming a
  // fixed absolute path (this branch also naturally stops matching anything once that
  // worktree is pruned post-merge, at which point the in-tree copy above already covers it).
  const wt = spawnSync('git', ['worktree', 'list', '--porcelain'], { encoding: 'utf-8', cwd: repoRoot });
  const worktreePaths = (wt.stdout || '').split('\n').filter((l) => l.startsWith('worktree ')).map((l) => l.slice('worktree '.length));
  const v4bLints = worktreePaths.find((p) => p.endsWith('v4b-lints'));
  if (v4bLints) {
    const onWorktree = path.join(v4bLints, 'plugins', 'plan-it', 'skills', 'plan-it', 'scripts', 'gate-check.mjs');
    if (fs.existsSync(onWorktree) && knowsMirrorVerb(onWorktree)) return onWorktree;
  }
  return null;
}

const gateCheckPath = findGateCheck();
if (gateCheckPath) {
  const mr = spawnSync(process.execPath, [gateCheckPath, 'mirror', path.join(fixturesRoot, 'manifest-in-subdir', 'REPORT.md'), outHtml], { encoding: 'utf-8' });
  assert(mr.status === 0, `gate-check mirror REPORT.md REPORT.html exits 0 (fresh pair), got ${mr.status}: ${mr.stdout}${mr.stderr}`);
} else {
  console.log('INV: gate-check mirror verb (V4B4) not found on main or in .claude/worktrees/v4b-lints — sub-assertion skipped until that lane merges');
}

report('T-V4A1-13 stamp-relpath-subdir');
