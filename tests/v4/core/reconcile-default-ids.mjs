#!/usr/bin/env node
/**
 * T-V4B4-17 (AMD-7) — `reconcile`'s C-W5-02 orphan scan skips `R<n>` tokens
 * recorded in the resolved state file's `gates.G2.defaults[].id`: given
 * `defaults-not-orphans/` (PRD cites R2/R10 as rationale, both recorded;
 * R99 is a real orphan), `reconcile --dir` exits 1 naming ONLY R99. With
 * the defaults list emptied (a temp copy), all three (R2, R10, R99) are
 * reported.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GATECHECK = join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs");
const FIXTURE = join(ROOT, "tests/fixtures/v4/defaults-not-orphans");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}
function run(dir) {
  try {
    return { code: 0, out: execFileSync("node", [GATECHECK, "reconcile", "--dir", dir], { encoding: "utf8" }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

// Defaults recorded: only R99 named.
{
  const r = run(FIXTURE);
  assert(r.code !== 0, `expected non-zero exit, got 0:\n${r.out}`);
  assert(r.out.includes("R99"), `expected R99 named:\n${r.out}`);
  assert(!r.out.includes(" R2 ") && !/\bR2\b.*orphan/.test(r.out), `expected R2 NOT reported as an orphan:\n${r.out}`);
  assert(!/\bR10\b.*orphan/.test(r.out), `expected R10 NOT reported as an orphan:\n${r.out}`);
}

// Defaults list emptied: all three reported.
{
  const dir = mkdtempSync(join(tmpdir(), "planit-defaults-orphans-"));
  cpSync(FIXTURE, dir, { recursive: true });
  const statePath = join(dir, ".plan-it", "state.json");
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  state.gates.G2.defaults = [];
  writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");

  const r = run(dir);
  assert(r.code !== 0, `expected non-zero exit with defaults emptied, got 0:\n${r.out}`);
  for (const id of ["R2", "R10", "R99"]) {
    assert(new RegExp(`\\b${id}\\b.*orphan`).test(r.out), `expected ${id} reported as an orphan once defaults are emptied:\n${r.out}`);
  }
  rmSync(dir, { recursive: true, force: true });
}

if (failed) {
  console.error("FAIL — reconcile-default-ids.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — reconcile-default-ids.mjs: T-V4B4-17 passes");
process.exit(0);
