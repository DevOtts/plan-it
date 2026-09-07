#!/usr/bin/env node
/**
 * T-V4B1-01, 02, 03, 13, 14 — the 4.0.0 machine is a 25-state additive
 * superset of both pinned baselines: shape (states/finals/targets), the two
 * machine-diff runs (v3 pin, v2 pin), the closed gate/guard set, and the
 * mode-tag placement.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const MACHINE = join(ROOT, "plugins/plan-it/skills/plan-it/machine.json");
const GATECHECK = join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs");
const V3_PIN = join(ROOT, "tests/fixtures/v3/machine.v3.7fcff27.json");
const V2_PIN = join(ROOT, "tests/fixtures/v2/machine.v2.fc6abc8.json");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}

const machine = JSON.parse(readFileSync(MACHINE, "utf8"));
const edge = (t) => (Array.isArray(t) ? t[0] : t) ?? {};

// T-V4B1-01 — shape: version, initial, 25 states, exactly two finals, every
// transition target exists.
assert(machine.version === "4.0.0", `version is "${machine.version}", expected "4.0.0"`);
assert(machine.initial === "intake", `initial is "${machine.initial}", expected "intake"`);
const stateNames = Object.keys(machine.states ?? {});
assert(stateNames.length === 25, `expected exactly 25 states, found ${stateNames.length}: ${stateNames.join(", ")}`);
const finals = stateNames.filter((s) => machine.states[s].type === "final").sort();
assert(
  JSON.stringify(finals) === JSON.stringify(["closedWithoutPlan", "done"]),
  `expected exactly closedWithoutPlan+done as final states, found: ${finals.join(", ")}`
);
for (const [name, node] of Object.entries(machine.states)) {
  for (const [ev, t] of Object.entries(node.on ?? {})) {
    const target = edge(t).target;
    assert(target in machine.states, `transition ${name}.on.${ev} targets unknown state "${target}"`);
  }
}

// T-V4B1-02 — machine-diff vs the 3.0.1 pin: exit 0 + PASS message.
{
  const out = execFileSync("node", [GATECHECK, "machine-diff", MACHINE, V3_PIN], { encoding: "utf8" });
  assert(out.includes("PASS — machine additive-only vs baseline"), `machine-diff vs v3 pin did not report PASS:\n${out}`);
}

// T-V4B1-03 — machine-diff vs the v2 pin: exit 0 + PASS message.
{
  const out = execFileSync("node", [GATECHECK, "machine-diff", MACHINE, V2_PIN], { encoding: "utf8" });
  assert(out.includes("PASS — machine additive-only vs baseline"), `machine-diff vs v2 pin did not report PASS:\n${out}`);
}

// T-V4B1-13 — gate ids exactly G0..G4, every gate state meta.human:true,
// planReview.meta.records === ["G2","G3"], the three new guards check:"state",
// and the closed guard-check set (T-E1-03) is unchanged.
{
  const gateEntries = Object.entries(machine.states).filter(([, n]) => n.meta?.gate);
  const gateIds = gateEntries.map(([, n]) => n.meta.gate).sort();
  assert(
    JSON.stringify(gateIds) === JSON.stringify(["G0", "G1", "G2", "G3", "G4"]),
    `gate ids ${JSON.stringify(gateIds)} != ["G0","G1","G2","G3","G4"]`
  );
  for (const [name, n] of gateEntries) {
    assert(n.meta.human === true, `gate state "${name}" (${n.meta.gate}) missing meta.human:true`);
  }
  assert(
    JSON.stringify(machine.states.planReview?.meta?.records) === JSON.stringify(["G2", "G3"]),
    `planReview.meta.records is ${JSON.stringify(machine.states.planReview?.meta?.records)}, expected ["G2","G3"]`
  );
  for (const g of ["triageRecorded", "defaultsRecorded", "planReviewed"]) {
    assert(machine.meta?.guards?.[g]?.check === "state", `guard "${g}" check is "${machine.meta?.guards?.[g]?.check}", expected "state"`);
  }
  const closedSet = new Set(Object.values(machine.meta?.guards ?? {}).map((g) => g.check));
  const expected = new Set(["verify", "freeze", "handoff", "state", "adversary"]);
  assert(
    closedSet.size === expected.size && [...closedSet].every((c) => expected.has(c)),
    `closed guard-check set changed: {${[...closedSet].sort().join(", ")}} != {${[...expected].sort().join(", ")}}`
  );
}

// T-V4B1-14 — mode tags land on exactly the six expected transitions and
// nowhere else; closedWithoutPlan.meta.title; freeze.REVIEW_CONTRADICTED
// targets parallelPlanning (the recovery edge exists).
{
  const modeOf = (state, ev) => edge(machine.states[state]?.on?.[ev]).meta?.mode ?? null;
  const AUTONOMOUS = [
    ["specAuthoring", "SPECS_DRAFTED_AUTONOMOUS"],
    ["coherencePass", "COHERENT_AUTONOMOUS"],
    ["render", "REVIEW_READY"],
  ];
  const GUIDED = [
    ["specAuthoring", "SPECS_DRAFTED"],
    ["coherencePass", "COHERENT"],
    ["render", "RENDERED"],
  ];
  for (const [s, ev] of AUTONOMOUS) {
    assert(modeOf(s, ev) === "autonomous-draft", `${s}.${ev} mode tag is "${modeOf(s, ev)}", expected "autonomous-draft"`);
  }
  for (const [s, ev] of GUIDED) {
    assert(modeOf(s, ev) === "guided", `${s}.${ev} mode tag is "${modeOf(s, ev)}", expected "guided"`);
  }
  const tagged = new Set([...AUTONOMOUS, ...GUIDED].map(([s, ev]) => `${s}.${ev}`));
  for (const [name, node] of Object.entries(machine.states)) {
    for (const [ev, t] of Object.entries(node.on ?? {})) {
      const key = `${name}.${ev}`;
      if (tagged.has(key)) continue;
      const mode = edge(t).meta?.mode;
      assert(!mode, `transition ${key} carries an unexpected meta.mode "${mode}" — every other transition must be untagged`);
    }
  }
  assert(
    machine.states.closedWithoutPlan?.meta?.title === "CLOSED_WITHOUT_PLAN",
    `closedWithoutPlan.meta.title is "${machine.states.closedWithoutPlan?.meta?.title}", expected "CLOSED_WITHOUT_PLAN"`
  );
  const rcTarget = edge(machine.states.freeze?.on?.REVIEW_CONTRADICTED).target;
  assert(rcTarget === "parallelPlanning", `freeze.on.REVIEW_CONTRADICTED targets "${rcTarget}", expected "parallelPlanning"`);
}

if (failed) {
  console.error("FAIL — machine-additive.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — machine-additive.mjs: T-V4B1-01, 02, 03, 13, 14 all pass");
process.exit(0);
