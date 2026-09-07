#!/usr/bin/env node
/**
 * T-V4B3-17 — the widened epic-heading grammar ([A-Z]{1,3}\d+[A-Z]?\d*) sees
 * a bare "## V4B1 — sample" heading (no leading "Epic" word — 3.0.1's
 * [A-Z]\d+ couldn't); `reconcile --dir <fx>` fails naming C-W3-01 and
 * "V4B1". The v3 regression fixtures (tier-table-good, no-tier,
 * epic-no-cases) keep their unchanged exit codes.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GATECHECK = join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}
function run(args) {
  try {
    return { code: 0, out: execFileSync("node", [GATECHECK, ...args], { encoding: "utf8" }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

// T-V4B3-17 — the bare "V4B1" heading fixture.
{
  const r = run(["reconcile", "--dir", join(ROOT, "tests/fixtures/v4/epic-heading-v4")]);
  assert(r.code !== 0, `expected non-zero exit, got 0:\n${r.out}`);
  assert(r.out.includes("C-W3-01"), `expected C-W3-01 named:\n${r.out}`);
  assert(r.out.includes("V4B1"), `expected the epic id "V4B1" named:\n${r.out}`);
}

// Regression: v3 fixtures keep their unchanged exit codes.
const V3_EXPECTED = {
  "tier-table-good": 0,
  "no-tier": 1,
  "epic-no-cases": 1,
};
for (const [name, expectedCode] of Object.entries(V3_EXPECTED)) {
  const r = run(["reconcile", "--dir", join(ROOT, "tests/fixtures/v3", name)]);
  assert(r.code === expectedCode, `${name}: expected exit ${expectedCode}, got ${r.code}:\n${r.out}`);
}

if (failed) {
  console.error("FAIL — epic-heading-grammar.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — epic-heading-grammar.mjs: T-V4B3-17 passes");
process.exit(0);
