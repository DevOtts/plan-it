#!/usr/bin/env node
/**
 * T-C3-07 / D3 — [REAL] mirror-check wired into the release epic checklist.
 *
 * Asserts, against delivery/v3/epics/epics-3-vocab-packaging-release.md
 * (the C4 checklist) + delivery/v3/CONTRACT.md:
 *
 *   1. the C4 checklist carries the gate step: run
 *      `node scripts/gate-check.mjs mirror-check` — must exit 0 before
 *      merge;
 *   2. the merge/tag step (v3.0.0 finalization) appears AFTER that gate
 *      step, so the CHANGELOG/v3.0.0 entry cannot be finalized with drift
 *      present;
 *   3. CONTRACT.md's Definition of SHIPPED demands "mirror-check exit 0";
 *   4. [REAL] the wired command actually runs against the live tree and
 *      exits 0 — if the 8 pairs have drifted, finalization is blocked and
 *      this test failing is the correct behavior, not a flake.
 *
 * Exit codes per AMD-3 (delivery/decisions.md 2026-07-08): 0 = pass,
 * 1 = fail. (Not a CONTRACT `run:` cell — plain harness semantics, same
 * as tests/v3/mirror-drift.mjs.)
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const fails = [];

const epic = readFileSync(
  join(ROOT, "delivery", "v3", "epics", "epics-3-vocab-packaging-release.md"),
  "utf8",
);
const c4 = (epic.match(/^## C4 — [\s\S]*$/m) ?? [""])[0];
if (!c4) fails.push("C4 section not found in epics-3-vocab-packaging-release.md");

// 1. the gate step exists as a checklist item
const gateIdx = c4.search(/- \[[ x]\] Run `node scripts\/gate-check\.mjs mirror-check`[\s\S]*?must\s+exit 0 before\s+merge/);
if (gateIdx === -1)
  fails.push("C4 checklist lacks the 'Run `node scripts/gate-check.mjs mirror-check` — must exit 0 before merge' gate step");

// 2. merge + v3.0.0 tag comes after the gate step (drift blocks finalization)
const mergeIdx = c4.search(/- \[[ x]\] Merge [\s\S]*?tag `v3\.0\.0`/);
if (mergeIdx === -1) fails.push("C4 checklist lacks the merge + tag `v3.0.0` finalization step");
if (gateIdx !== -1 && mergeIdx !== -1 && mergeIdx < gateIdx)
  fails.push("finalization (merge/tag v3.0.0) precedes the mirror-check gate step — drift would not block release");

// 3. CONTRACT SHIPPED definition demands mirror-check exit 0
const contract = readFileSync(join(ROOT, "delivery", "v3", "CONTRACT.md"), "utf8");
if (!/Definition of SHIPPED:[^\n]*mirror-check exit 0/.test(contract))
  fails.push("CONTRACT.md Definition of SHIPPED does not demand 'mirror-check exit 0'");

// 4. [REAL] the wired command runs and exits 0 on the live tree
const res = spawnSync(
  process.execPath,
  [join(ROOT, "scripts", "gate-check.mjs"), "mirror-check"],
  { encoding: "utf8", cwd: ROOT },
);
if (res.status !== 0)
  fails.push(
    `live \`gate-check mirror-check\` exited ${res.status} — drift present, v3.0.0 cannot be finalized:\n${(res.stderr ?? "").trim()}`,
  );

if (fails.length > 0) {
  console.error("FAIL — T-C3-07 mirror-wired-into-release:");
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("PASS — T-C3-07: mirror-check gates the release checklist ahead of merge/tag v3.0.0; SHIPPED definition demands exit 0; live tree clean");
