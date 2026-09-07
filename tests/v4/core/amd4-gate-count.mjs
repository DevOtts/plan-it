#!/usr/bin/env node
/**
 * T-V4B5-01 — AMD-4: the v2 pin has exactly 3 gate states (G1, G2, G3), the
 * live 4.0.0 machine contains those three, and every live `meta.gate` state
 * (5 in 4.0.0) has `meta.human === true`.
 * T-V4B5-02 — a temp machine derived from the live one with
 * `planReview.meta.human` removed, and another with `G2` dropped, each fail
 * the AMD-4 check naming the gate — the amended case still has teeth.
 *
 * This exercises the SAME assertion tests/run-contract.mjs's rewritten
 * T-E1-05 makes, applied here directly to prove the check (not just the
 * live tree) actually discriminates.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const MACHINE_PATH = join(ROOT, "plugins/plan-it/skills/plan-it/machine.json");
const V2_PIN_PATH = join(ROOT, "tests/fixtures/v2/machine.v2.fc6abc8.json");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}

// The AMD-4 check itself, standalone (mirrors tests/run-contract.mjs's
// rewritten T-E1-05 body exactly, so this script can drive it against
// deliberately-broken variants without shelling out to run-contract.mjs).
function checkAmd4(liveMachine, v2Pin) {
  const problems = [];
  const baseGates = Object.values(v2Pin.states)
    .filter((n) => n.meta?.gate)
    .map((n) => ({ gate: n.meta.gate, human: n.meta.human }));
  if (baseGates.length !== 3) problems.push(`expected 3 gate states on the v2 baseline, got ${baseGates.length}`);
  const baseNames = baseGates.map((g) => g.gate).sort();
  if (JSON.stringify(baseNames) !== JSON.stringify(["G1", "G2", "G3"])) problems.push(`v2 baseline gates are ${baseNames}`);
  for (const g of baseGates) if (g.human !== true) problems.push(`v2 baseline gate ${g.gate} not marked human`);

  const liveGates = Object.values(liveMachine.states)
    .filter((n) => n.meta?.gate)
    .map((n) => ({ gate: n.meta.gate, human: n.meta.human }));
  const liveNames = new Set(liveGates.map((g) => g.gate));
  for (const g of ["G1", "G2", "G3"]) if (!liveNames.has(g)) problems.push(`live machine dropped baseline gate ${g}`);
  for (const g of liveGates) if (g.human !== true) problems.push(`live gate ${g.gate} not marked human`);
  return problems;
}

const liveMachine = JSON.parse(readFileSync(MACHINE_PATH, "utf8"));
const v2Pin = JSON.parse(readFileSync(V2_PIN_PATH, "utf8"));

// T-V4B5-01
{
  const problems = checkAmd4(liveMachine, v2Pin);
  assert(problems.length === 0, `expected the live machine + v2 pin to pass AMD-4 cleanly, got:\n${problems.join("\n")}`);
  const gateCount = Object.values(liveMachine.states).filter((n) => n.meta?.gate).length;
  assert(gateCount === 5, `expected 5 meta.gate states in the live 4.0.0 machine, got ${gateCount}`);
}

// T-V4B5-02
{
  const noHuman = JSON.parse(JSON.stringify(liveMachine));
  delete noHuman.states.planReview.meta.human;
  const problems1 = checkAmd4(noHuman, v2Pin);
  assert(problems1.some((p) => p.includes("G4") && p.includes("not marked human")), `expected a failure naming G4 not marked human, got:\n${problems1.join("\n")}`);

  const noG2 = JSON.parse(JSON.stringify(liveMachine));
  delete noG2.states.decisionGate.meta.gate;
  const problems2 = checkAmd4(noG2, v2Pin);
  assert(problems2.some((p) => p.includes("dropped baseline gate G2")), `expected a failure naming dropped G2, got:\n${problems2.join("\n")}`);
}

if (failed) {
  console.error("FAIL — amd4-gate-count.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — amd4-gate-count.mjs: T-V4B5-01, 02 pass");
process.exit(0);
