#!/usr/bin/env node
/**
 * T-C3-06 — `mirror-check` drift detection (Epic 3, PRD §D7).
 *
 * Runs `gate-check mirror-check --dir tests/fixtures/v3/mirror-drift`
 * against the deliberate 1-value drift fixture (root/machine.json vs
 * plugins/plan-it/machine.json) and asserts:
 *
 *   - exit code 2 — the distinct drift exit, never a silent 0/1;
 *   - stderr lists the drifted machine.json pair by name;
 *   - stderr names the first differing byte offset.
 *
 * The POSITIVE direction (T-C3-05) dogfoods the live repo tree via the
 * CONTRACT row's own `run:` cell (`node scripts/gate-check.mjs
 * mirror-check`) and deliberately has no harness here — this file stays
 * scoped to the violating fixture so mid-edit working trees cannot flake
 * it.
 *
 * Exit codes per AMD-3 (delivery/decisions.md 2026-07-08): 0 = pass,
 * 1 = fail.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const res = spawnSync(
  process.execPath,
  [
    join(ROOT, "scripts", "gate-check.mjs"),
    "mirror-check",
    "--dir",
    join(ROOT, "tests", "fixtures", "v3", "mirror-drift"),
  ],
  { encoding: "utf8", cwd: ROOT },
);

const stderr = res.stderr ?? "";
const fails = [];
if (res.status !== 2) fails.push(`expected exit 2 (drift), got ${res.status}`);
if (!/machine\.json/.test(stderr)) fails.push("stderr does not list the drifted machine.json pair");
if (!/drift at byte offset \d+/.test(stderr)) fails.push("stderr does not name the first differing byte offset");
if (!/FAIL — mirror-check: 1 of 1 pair\(s\) drifted/.test(stderr)) fails.push("stderr does not carry the '1 of 1 pair(s) drifted' summary");

if (fails.length > 0) {
  console.error("FAIL — T-C3-06 mirror-drift:");
  for (const f of fails) console.error(`  ✗ ${f}`);
  console.error("--- captured output ---");
  console.error((res.stdout ?? "") + stderr);
  process.exit(1);
}
console.log("PASS — T-C3-06: mirror-check exits 2 and lists the drifted pair with byte offset");
