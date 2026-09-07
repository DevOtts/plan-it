#!/usr/bin/env node
/**
 * T-V4B2-12 — `state --dir <fx> --run v4` resumes after a crash: exit 0,
 * `state: parallelPlanning`, next events `AMENDMENT, SQUADS_COMPLETE`
 * (untagged, both modes) with every optional §4.6 key populated and
 * tolerated; at `render` in autonomous-draft, only `REVIEW_READY` is printed,
 * never `RENDERED`.
 *
 * T-V4B2-15 — regression: the v2 fixture `tests/fixtures/state-valid.json`
 * and the v3 state fixtures (gaps-*, credentials-*, no-review-file,
 * review-no-ack) produce byte-identical exit codes and reason strings under
 * the 4.0.0 machine — the new checks never fire without their keys.
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
const MACHINE = join(ROOT, "plugins/plan-it/skills/plan-it/machine.json");

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

// T-V4B2-12
{
  const r = run(["state", "--dir", "tests/fixtures/v4/state-run", "--run", "v4"]);
  assert(r.code === 0, `expected exit 0 resuming state-run/v4, got ${r.code}:\n${r.out}`);
  assert(r.out.includes("state: parallelPlanning"), `expected "state: parallelPlanning" in stdout:\n${r.out}`);
  assert(/next events:\s*AMENDMENT, SQUADS_COMPLETE\s*$/m.test(r.out), `expected "next events: AMENDMENT, SQUADS_COMPLETE" in stdout:\n${r.out}`);

  const atRender = run(["state", "--dir", "tests/fixtures/v4/state-run", "--run", "at-render"]);
  assert(atRender.code === 0, `expected exit 0 at render (autonomous-draft), got ${atRender.code}:\n${atRender.out}`);
  assert(/next events:\s*REVIEW_READY\s*$/m.test(atRender.out), `expected only REVIEW_READY listed at render:\n${atRender.out}`);
  assert(!/\bRENDERED\b/.test(atRender.out), `expected RENDERED never printed for an autonomous-draft run at render:\n${atRender.out}`);
}

// T-V4B2-15 — regression fixtures, exact 3.0.1-era exit codes and messages.
const REGRESSION_CASES = [
  {
    name: "gaps-undispositioned",
    file: "tests/fixtures/v3/gaps-undispositioned/.plan-it/state.json",
    code: 1,
    contains: ['G3 known-gap 1 ("GAP-1"): disposition missing — every gap needs fix, waive, or case-ify (EC-B7)'],
  },
  {
    name: "gaps-dispositioned",
    file: "tests/fixtures/v3/gaps-dispositioned/.plan-it/state.json",
    code: 0,
    contains: ["state: freezeGate — Delivery gate", "next events: G3_APPROVED"],
  },
  {
    name: "credentials-unprocured",
    file: "tests/fixtures/v3/credentials-unprocured/.plan-it/state.json",
    code: 1,
    contains: ['credential "third-party-api-key": status "unprocured" — must be procured or GATED-with-owner'],
  },
  {
    name: "credentials-gated",
    file: "tests/fixtures/v3/credentials-gated/.plan-it/state.json",
    code: 1, // B1 (FD-2) still fires — no TEST-CONTRACT-REVIEW.md in this fixture, same as 3.0.1
    contains: ["GATED-with-owner (owner: Fernando Ott) — cross-checked in delivery/v3/CONTRACT.md"],
  },
  {
    name: "no-review-file",
    file: "tests/fixtures/v3/no-review-file/.plan-it/state.json",
    code: 1,
    contains: ["B1 (FD-2): gates.G2.approved is true but"],
  },
  {
    name: "review-no-ack",
    file: "tests/fixtures/v3/review-no-ack/.plan-it/state.json",
    code: 1,
    contains: ['lacks the "Reviewed-by: <name> <date>" acknowledgment line'],
  },
  {
    name: "state-valid.json (v2)",
    file: "tests/fixtures/state-valid.json",
    code: 0,
    contains: ["state: specAuthoring — Spec authoring", "next events: SPECS_DRAFTED"],
    excludes: ["SPECS_DRAFTED_AUTONOMOUS"],
  },
];

for (const c of REGRESSION_CASES) {
  const r = run(["state", c.file, MACHINE]);
  assert(r.code === c.code, `${c.name}: expected exit ${c.code}, got ${r.code}:\n${r.out}`);
  for (const s of c.contains) {
    assert(r.out.includes(s), `${c.name}: expected output to contain "${s}":\n${r.out}`);
  }
  for (const s of c.excludes ?? []) {
    assert(!r.out.includes(s), `${c.name}: expected output NOT to contain "${s}" (byte-identical to 3.0.1):\n${r.out}`);
  }
}

if (failed) {
  console.error("FAIL — state-run-flag.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — state-run-flag.mjs: T-V4B2-12, 15 pass");
process.exit(0);
