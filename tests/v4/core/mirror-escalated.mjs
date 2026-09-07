#!/usr/bin/env node
/**
 * T-V4B4-07 — `handoff --dir <fx> --run r` on `mirror-escalated/` (a v4 run
 * whose `render.outputs[]` records the SHA-256 of the on-disk twin, itself
 * stale against its md) exits 1 with `ESCALATED` and `still stale after
 * re-render` and `C-E2-07`; the same package with a stale twin NOT matching
 * `render.outputs[]` prints `MIRROR_STALE … re-render` instead.
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
const FIXTURE = join(ROOT, "tests/fixtures/v4/mirror-escalated");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}
function run(dir) {
  try {
    return { code: 0, out: execFileSync("node", [GATECHECK, "handoff", "--dir", dir, "--run", "r"], { encoding: "utf8" }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

// Half 1 — the checked-in fixture: recorded render.outputs[] matches the
// on-disk (still stale) twin -> ESCALATED.
{
  const r = run(FIXTURE);
  assert(r.code !== 0, `expected non-zero exit, got 0:\n${r.out}`);
  assert(r.out.includes("ESCALATED"), `expected ESCALATED:\n${r.out}`);
  assert(r.out.includes("still stale after re-render"), `expected the exact "still stale after re-render" phrase:\n${r.out}`);
  assert(r.out.includes("C-E2-07"), `expected C-E2-07 named:\n${r.out}`);
}

// Half 2 — a temp copy whose render.outputs[].sha256 does NOT match the
// on-disk twin -> plain MIRROR_STALE (mechanical re-render, not escalated).
{
  const dir = mkdtempSync(join(tmpdir(), "planit-mirror-escalated-"));
  cpSync(FIXTURE, dir, { recursive: true });
  const statePath = join(dir, ".plan-it", "r.state.json");
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  state.render.outputs[0].sha256 = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
  writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");

  const r = run(dir);
  assert(r.code !== 0, `expected non-zero exit, got 0:\n${r.out}`);
  assert(r.out.includes("MIRROR_STALE"), `expected MIRROR_STALE (not escalated) when render.outputs[] doesn't match:\n${r.out}`);
  assert(!r.out.includes("ESCALATED"), `expected NOT escalated:\n${r.out}`);
  assert(r.out.includes("re-render"), `expected the mechanical "re-render" recovery hint:\n${r.out}`);
  rmSync(dir, { recursive: true, force: true });
}

if (failed) {
  console.error("FAIL — mirror-escalated.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — mirror-escalated.mjs: T-V4B4-07 passes");
process.exit(0);
