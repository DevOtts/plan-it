#!/usr/bin/env node
/**
 * T-V4B1-05 — every baseline state, event and guard from the 3.0.1 pin is
 * present in the live 4.0.0 machine with identical guard names; the only
 * differing targets are the three documented retargets, each landing on a
 * state absent from the pin (i.e. a NEW state, additive insertion).
 *
 * T-V4B1-06 — a guided fixture run (G0/G1/G2 recorded, currently sitting at
 * freezeGate) resumes correctly: `state` exits 0, reports `state: freezeGate`
 * and lists only `G3_APPROVED` as the next event — a guided run's own gate
 * chain and printout are byte-for-byte what 3.0.1 would have produced.
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
const GUIDED_FIXTURE = join(ROOT, "tests/fixtures/v4/machine/guided-run/.plan-it/g1.state.json");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}

const edge = (t) => (Array.isArray(t) ? t[0] : t) ?? {};
const live = JSON.parse(readFileSync(MACHINE, "utf8"));
const base = JSON.parse(readFileSync(V3_PIN, "utf8"));

// T-V4B1-05
const baseStates = Object.keys(base.states ?? {});
assert(baseStates.length === 17, `pin has ${baseStates.length} states, expected 17`);
let baseEventCount = 0;
const retargets = [];
for (const [name, bNode] of Object.entries(base.states ?? {})) {
  const lNode = live.states?.[name];
  assert(!!lNode, `baseline state "${name}" missing from live machine`);
  if (!lNode) continue;
  for (const [ev, bT] of Object.entries(bNode.on ?? {})) {
    baseEventCount++;
    const lT = lNode.on?.[ev];
    assert(!!lT, `baseline transition ${name}.on.${ev} missing from live machine`);
    if (!lT) continue;
    const b = edge(bT),
      l = edge(lT);
    assert(
      (b.guard ?? null) === (l.guard ?? null),
      `guard on ${name}.on.${ev} changed: "${b.guard ?? "(none)"}" → "${l.guard ?? "(none)"}"`
    );
    if (l.target !== b.target) retargets.push({ key: `${name}.${ev}`, from: b.target, to: l.target });
  }
}
assert(baseEventCount === 17, `pin has ${baseEventCount} baseline events (counted over states), expected 17`);
for (const g of Object.keys(base.meta?.guards ?? {})) {
  assert(!!live.meta?.guards?.[g], `baseline guard "${g}" missing from live machine`);
}
assert(Object.keys(base.meta?.guards ?? {}).length === 5, `pin has ${Object.keys(base.meta?.guards ?? {}).length} guards, expected 5`);

const expectedRetargets = [
  { key: "intake.INTAKE_CAPTURED", from: "dodLock", to: "triage" },
  { key: "dodLock.DOD_LOCKED", from: "scopeGate", to: "scopeBrief" },
  { key: "adversaryGate.ADVERSARY_CLEAN", from: "handoff", to: "render" },
];
assert(
  retargets.length === expectedRetargets.length,
  `expected exactly ${expectedRetargets.length} retargeted baseline edges, found ${retargets.length}: ${JSON.stringify(retargets)}`
);
for (const exp of expectedRetargets) {
  const found = retargets.find((r) => r.key === exp.key);
  assert(!!found, `expected retarget on ${exp.key}, not found among ${JSON.stringify(retargets)}`);
  if (found) {
    assert(found.from === exp.from, `${exp.key} baseline target was "${found.from}", expected "${exp.from}"`);
    assert(found.to === exp.to, `${exp.key} retargeted to "${found.to}", expected "${exp.to}"`);
    assert(!(found.to in base.states), `${exp.key} retargeted onto "${found.to}" which already exists in the pin — not a NEW state`);
  }
}

// T-V4B1-06
{
  const out = execFileSync("node", [GATECHECK, "state", GUIDED_FIXTURE, MACHINE], { encoding: "utf8" });
  assert(out.includes("state: freezeGate"), `expected "state: freezeGate" in stdout, got:\n${out}`);
  assert(/next events:\s*G3_APPROVED\s*$/m.test(out), `expected "next events: G3_APPROVED" (only) in stdout, got:\n${out}`);
  assert(!/autonomous/i.test(out), `guided-run printout unexpectedly mentions an autonomous event:\n${out}`);
}

if (failed) {
  console.error("FAIL — guided-unchanged.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — guided-unchanged.mjs: T-V4B1-05, 06 pass");
process.exit(0);
