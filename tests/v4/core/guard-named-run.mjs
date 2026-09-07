#!/usr/bin/env node
/**
 * T-V4B3-13 — guard resolves a named run by longest deliveryRoot prefix on a
 * two-run fixture (frozen v4 + unfrozen generic): a write under
 * delivery/v4/prds/ is ALLOWED, a write under delivery/other/prds/ is DENIED
 * naming the generic file — asserted for BOTH the root and the plugin copy.
 * T-V4B3-15 — regression + fail-open: the legacy docs/implementation/eng/
 * match still resolves eng.state.json; an unparseable named file allows
 * (fail-open); the v2 harness fixtures (T-E6-01…05) keep their decisions.
 *
 * Both shipped guard copies are spawned directly (adversarial-verify: the
 * mirror is not trusted, both copies are actually run).
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
function bothAgree(cwd, filePath, expectDeny, mustInclude) {
  for (const [label, guardPath] of [
    ["plugin", GUARD_PLUGIN],
    ["root", GUARD_ROOT],
  ]) {
    const out = runGuard(guardPath, cwd, filePath);
    const denied = isDeny(out);
    assert(denied === expectDeny, `${label} copy: expected ${expectDeny ? "DENY" : "ALLOW"} for ${filePath}, got: ${out || "(allow)"}`);
    if (mustInclude && denied) assert(out.includes(mustInclude), `${label} copy: expected reason to include "${mustInclude}": ${out}`);
  }
}

// T-V4B3-13
{
  const fx = join(ROOT, "tests/fixtures/v4/guard-two-runs");
  bothAgree(fx, join(fx, "delivery/v4/prds/prd-1.md"), false);
  bothAgree(fx, join(fx, "delivery/other/prds/prd-1.md"), true, join(fx, ".plan-it/state.json"));
}

// T-V4B3-15
{
  const legacy = join(ROOT, "tests/fixtures/v4/guard-legacy-docs");
  bothAgree(legacy, join(legacy, "docs/implementation/eng/prds/p.md"), true, join(legacy, ".plan-it/eng.state.json"));

  const broken = join(ROOT, "tests/fixtures/v4/guard-broken-named");
  bothAgree(broken, join(broken, "delivery/prds/p.md"), false);
}

if (failed) {
  console.error("FAIL — guard-named-run.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — guard-named-run.mjs: T-V4B3-13, 15 pass");
process.exit(0);
