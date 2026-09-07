#!/usr/bin/env node
/**
 * T-V4B3-14 — guard denies a genuinely unfrozen named run (WRITE_DENIED
 * names v4.state.json); after recording contract.version the same write is
 * ALLOWED (recovery) — both shipped copies.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GUARD_PLUGIN = join(ROOT, "plugins/plan-it/scripts/hooks/planit-guard.mjs");
const GUARD_ROOT = join(ROOT, "scripts/hooks/planit-guard.mjs");
const UNFROZEN = join(ROOT, "tests/fixtures/v4/guard-unfrozen-named");
const FROZEN = join(ROOT, "tests/fixtures/v4/guard-unfrozen-named-frozen");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}
function runGuard(guardPath, cwd, filePath) {
  const input = JSON.stringify({ tool_name: "Write", cwd, tool_input: { file_path: filePath } });
  return execFileSync("node", [guardPath], { encoding: "utf8", input }).trim();
}
function isDeny(out) {
  return /"permissionDecision"\s*:\s*"deny"/.test(out);
}

for (const [label, guardPath] of [
  ["plugin", GUARD_PLUGIN],
  ["root", GUARD_ROOT],
]) {
  const denied = runGuard(guardPath, UNFROZEN, join(UNFROZEN, "delivery/v4/prds/prd-1.md"));
  assert(isDeny(denied), `${label} copy: expected DENY for the unfrozen named run, got: ${denied || "(allow)"}`);
  assert(denied.includes("v4.state.json"), `${label} copy: expected the reason to name v4.state.json: ${denied}`);

  const allowed = runGuard(guardPath, FROZEN, join(FROZEN, "delivery/v4/prds/prd-1.md"));
  assert(!isDeny(allowed), `${label} copy: expected ALLOW after recording contract.version, got: ${allowed}`);
}

if (failed) {
  console.error("FAIL — guard-unfrozen-named.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — guard-unfrozen-named.mjs: T-V4B3-14 passes");
process.exit(0);
