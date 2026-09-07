#!/usr/bin/env node
/**
 * T-V4B2-01 — an invalid triage verdict is REJECTED naming C-E6-01 and the
 * four allowed verdicts.
 * T-V4B2-03 — with the memo written, `skip` / `build-instead` /
 * `owner-decision` each land at `closedWithoutPlan` cleanly (exit 0,
 * `CLOSED_WITHOUT_PLAN` + `(final state)` in stdout).
 *
 * (T-V4B2-02 is the CONTRACT's own direct gate-check invocation against
 * tests/fixtures/v4/triage-no-memo/ — verified by hand, no wrapper needed.)
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
function run(args) {
  try {
    return { code: 0, out: execFileSync("node", [GATECHECK, ...args], { encoding: "utf8", cwd: ROOT }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}

// T-V4B2-01
{
  const r = run(["state", "--dir", "tests/fixtures/v4/triage-bad-verdict", "--run", "t2"]);
  assert(r.code !== 0, `expected non-zero exit for an invalid verdict, got 0:\n${r.out}`);
  assert(r.out.includes("C-E6-01"), `expected "C-E6-01" in output:\n${r.out}`);
  for (const v of ["plan", "build-instead", "owner-decision", "skip"]) {
    assert(r.out.includes(v), `expected allowed verdict "${v}" listed in output:\n${r.out}`);
  }
}

// T-V4B2-03
for (const slug of ["skip", "build-instead", "owner-decision"]) {
  const r = run(["state", "--dir", "tests/fixtures/v4/triage-closed", "--run", slug]);
  assert(r.code === 0, `expected exit 0 for triage-closed/${slug} (memo present), got ${r.code}:\n${r.out}`);
  assert(r.out.includes("CLOSED_WITHOUT_PLAN"), `expected "CLOSED_WITHOUT_PLAN" in stdout for ${slug}:\n${r.out}`);
  assert(r.out.includes("(final state)"), `expected "(final state)" in stdout for ${slug}:\n${r.out}`);
}

if (failed) {
  console.error("FAIL — triage-closed.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — triage-closed.mjs: T-V4B2-01, 03 pass");
process.exit(0);
