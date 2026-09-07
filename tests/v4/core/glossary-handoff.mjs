#!/usr/bin/env node
/**
 * T-V4B4-10 — `handoff` embeds the glossary check (step 8) and fails on
 * `glossary-unknown-id/delivery/` naming X9-77 with C-E10-01, exactly once
 * (never double-reported). Separately: a v4 state at `handoff`
 * (`machineVersion: "4.0.0"`) with no GLOSSARY.md under its deliveryRoot
 * fails `state --dir … --run r` naming C-E10-02; the same with
 * `machineVersion: "3.0.1"` exits 0 (v3 never triggers the check).
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

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

// Half 1 — handoff embeds the glossary check, reports X9-77 exactly once.
{
  const r = run(["handoff", join(ROOT, "tests/fixtures/v4/glossary-unknown-id/delivery")]);
  assert(r.code !== 0, `expected non-zero exit, got 0:\n${r.out}`);
  const occurrences = (r.out.match(/unknown ID "X9-77"/g) ?? []).length;
  assert(occurrences === 1, `expected X9-77 reported exactly once, saw ${occurrences}:\n${r.out}`);
  assert(r.out.includes("C-E10-01"), `expected C-E10-01 named:\n${r.out}`);
}

// Half 2 — the state verb's own GLOSSARY.md-at-handoff check.
function seedRun(root, { machineVersion }) {
  mkdirSync(join(root, ".plan-it"), { recursive: true });
  mkdirSync(join(root, "delivery"), { recursive: true });
  const state = {
    schemaVersion: 1,
    machineVersion,
    run: { name: "r", mode: "guided" },
    state: "handoff",
    gates: {},
    contract: { version: "1.0", path: "delivery/CONTRACT.md", frozenAt: null },
    history: [],
  };
  writeFileSync(join(root, ".plan-it", "r.state.json"), JSON.stringify(state, null, 2) + "\n");
}

{
  const dir = mkdtempSync(join(tmpdir(), "planit-glossary-handoff-v4-"));
  seedRun(dir, { machineVersion: "4.0.0" });
  const r = run(["state", "--dir", dir, "--run", "r"]);
  assert(r.code !== 0, `expected non-zero exit for v4 at handoff with no GLOSSARY.md, got 0:\n${r.out}`);
  assert(r.out.includes("C-E10-02"), `expected C-E10-02 named:\n${r.out}`);
  rmSync(dir, { recursive: true, force: true });
}
{
  const dir = mkdtempSync(join(tmpdir(), "planit-glossary-handoff-v3-"));
  seedRun(dir, { machineVersion: "3.0.1" });
  const r = run(["state", "--dir", dir, "--run", "r"]);
  assert(r.code === 0, `expected exit 0 for v3 at handoff (machineVersion never triggers C-E10-02), got ${r.code}:\n${r.out}`);
  rmSync(dir, { recursive: true, force: true });
}

if (failed) {
  console.error("FAIL — glossary-handoff.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — glossary-handoff.mjs: T-V4B4-10 passes");
process.exit(0);
