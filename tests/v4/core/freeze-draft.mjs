#!/usr/bin/env node
/**
 * T-V4B2-14 — `freeze --draft --dir <fx>` on a run whose `casesReviewed` is
 * false and `gates.G2.defaults` is non-empty: exit 0, casesReviewed skipped
 * (said so in stdout); `draft-no-defaults/`: exit 1, "gates.G2.defaults is
 * empty"; `draft-no-reap/`: exit 1, RUN-POLICY body missing "reap-on-merge"
 * (structure still checked under --draft).
 *
 * (T-V4B2-13 is the CONTRACT's own direct gate-check invocation — verified
 * by hand, no wrapper needed.)
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GATECHECK = join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs");

let failed = false;
function run(args) {
  try {
    return { code: 0, out: execFileSync("node", [GATECHECK, ...args], { encoding: "utf8", cwd: ROOT }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}

{
  const good = run(["freeze", "--draft", "--dir", "tests/fixtures/v4/draft-header"]);
  assert(good.code === 0, `expected exit 0 for freeze --draft on draft-header/, got ${good.code}:\n${good.out}`);
  assert(good.out.includes("casesReviewed skipped"), `expected stdout to say casesReviewed was skipped:\n${good.out}`);
}

{
  const noDefaults = run(["freeze", "--draft", "--dir", "tests/fixtures/v4/draft-no-defaults"]);
  assert(noDefaults.code !== 0, `expected non-zero exit for draft-no-defaults/, got 0:\n${noDefaults.out}`);
  assert(
    noDefaults.out.includes("freeze --draft refused — gates.G2.defaults is empty"),
    `expected the exact "gates.G2.defaults is empty" reason:\n${noDefaults.out}`
  );
}

{
  const noReap = run(["freeze", "--draft", "--dir", "tests/fixtures/v4/draft-no-reap"]);
  assert(noReap.code !== 0, `expected non-zero exit for draft-no-reap/, got 0:\n${noReap.out}`);
  assert(
    noReap.out.includes('RUN-POLICY body missing the "reap-on-merge" worktree rule'),
    `expected the reap-on-merge structural failure:\n${noReap.out}`
  );
}

if (failed) {
  console.error("FAIL — freeze-draft.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — freeze-draft.mjs: T-V4B2-14 passes");
process.exit(0);
