#!/usr/bin/env node
/**
 * T-V4B1-07 … T-V4B1-12 — six negative machine fixtures (each a full 4.0.0
 * machine with exactly one mutation applied) must each FAIL `machine-diff`
 * against the 3.0.1 pin with the exact named reason.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS (every negative
 * fixture correctly fails machine-diff with its named reason), exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GATECHECK = join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs");
const V3_PIN = join(ROOT, "tests/fixtures/v3/machine.v3.7fcff27.json");
const NEG_DIR = join(ROOT, "tests/fixtures/v4/machine");

const CASES = [
  { id: "T-V4B1-07", file: "neg-initial-changed.json", reason: 'initial changed: "intake" → "triage"' },
  { id: "T-V4B1-08", file: "neg-state-dropped.json", reason: 'baseline state missing/renamed in live machine: "adversaryGate"' },
  { id: "T-V4B1-09", file: "neg-event-dropped.json", reason: "baseline transition dropped: dodLock.on.DOD_LOCKED" },
  { id: "T-V4B1-10", file: "neg-guard-swapped.json", reason: 'guard mapping changed on scopeGate.on.G1_APPROVED: "gateRecorded" → "artifactsOnDisk"' },
  {
    id: "T-V4B1-11",
    file: "neg-retarget-baseline.json",
    reason: "onto a pre-existing baseline state — only insertion of NEW states is additive",
  },
  { id: "T-V4B1-12", file: "neg-guard-removed.json", reason: 'baseline guard missing/renamed in live machine: "adversarialDepth"' },
];

let failed = false;
for (const c of CASES) {
  const fixture = join(NEG_DIR, c.file);
  let stdout = "",
    stderr = "",
    status = 0;
  try {
    stdout = execFileSync("node", [GATECHECK, "machine-diff", fixture, V3_PIN], { encoding: "utf8" });
  } catch (e) {
    status = e.status ?? 1;
    stdout = e.stdout ?? "";
    stderr = e.stderr ?? "";
  }
  const out = `${stdout}${stderr}`;
  if (status === 0) {
    console.error(`FAIL — ${c.id} (${c.file}): expected non-zero exit from machine-diff, got 0`);
    failed = true;
    continue;
  }
  if (!out.includes(c.reason)) {
    console.error(`FAIL — ${c.id} (${c.file}): expected reason "${c.reason}" in output, got:\n${out}`);
    failed = true;
    continue;
  }
  console.log(`  ok — ${c.id} (${c.file}): exit ${status}, reason matched`);
}

if (failed) {
  console.error("FAIL — machine-negatives.mjs: one or more negative fixtures did not fail as expected");
  process.exit(1);
}
console.log("OK — machine-negatives.mjs: T-V4B1-07 … T-V4B1-12 all pass");
process.exit(0);
