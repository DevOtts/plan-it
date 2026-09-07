#!/usr/bin/env node
/**
 * T-V4B3-02 — `testconv --dir <root> --run v4` on a root with only a named
 * state file writes the receipt into that file and never creates a generic
 * one.
 * T-V4B3-03 — the same, without --run, resolves the single named file
 * (generic still absent); a root with both a named and a generic file (no
 * --run) writes the generic one — legacy behaviour preserved.
 *
 * Works on temp copies of tests/fixtures/v4/testconv-named/ (testconv writes
 * to disk).
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { existsSync, mkdtempSync, rmSync, cpSync, readFileSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GATECHECK = join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs");
const FIXTURE = join(ROOT, "tests/fixtures/v4/testconv-named");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}
function copyFixture() {
  const dir = mkdtempSync(join(tmpdir(), "planit-testconv-"));
  cpSync(FIXTURE, dir, { recursive: true });
  return dir;
}

// T-V4B3-02 — --run v4
{
  const dir = copyFixture();
  const out = execFileSync("node", [GATECHECK, "testconv", "--dir", dir, "--run", "v4"], { encoding: "utf8" });
  assert(!out.includes("FAIL"), `expected success, got:\n${out}`);
  const named = JSON.parse(readFileSync(join(dir, ".plan-it", "v4.state.json"), "utf8"));
  assert(named.testConventions?.registered === true, `expected testConventions.registered:true in v4.state.json, got:\n${JSON.stringify(named.testConventions)}`);
  assert(!existsSync(join(dir, ".plan-it", "state.json")), "expected .plan-it/state.json to NOT exist (generic never created beside a named one)");
  rmSync(dir, { recursive: true, force: true });
}

// T-V4B3-03 (first half) — no --run, single named file resolved
{
  const dir = copyFixture();
  const out = execFileSync("node", [GATECHECK, "testconv", "--dir", dir], { encoding: "utf8" });
  assert(!out.includes("FAIL"), `expected success, got:\n${out}`);
  const named = JSON.parse(readFileSync(join(dir, ".plan-it", "v4.state.json"), "utf8"));
  assert(named.testConventions?.registered === true, "expected the single named file to be resolved and written");
  assert(!existsSync(join(dir, ".plan-it", "state.json")), "expected generic to still be absent");
  rmSync(dir, { recursive: true, force: true });
}

// T-V4B3-03 (second half) — both files present, no --run -> generic written
{
  const dir = copyFixture();
  copyFileSync(join(dir, ".plan-it", "v4.state.json"), join(dir, ".plan-it", "state.json"));
  execFileSync("node", [GATECHECK, "testconv", "--dir", dir], { encoding: "utf8" });
  const generic = JSON.parse(readFileSync(join(dir, ".plan-it", "state.json"), "utf8"));
  assert(generic.testConventions?.registered === true, "expected the generic file to be written when both files coexist (legacy behaviour)");
  rmSync(dir, { recursive: true, force: true });
}

if (failed) {
  console.error("FAIL — testconv-named.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — testconv-named.mjs: T-V4B3-02, 03 pass");
process.exit(0);
