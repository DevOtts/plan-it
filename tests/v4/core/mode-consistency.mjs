#!/usr/bin/env node
/**
 * T-V4B2-05 — a default row with source "guessed" is REJECTED naming its id
 * and C-E7-07; every row "recommended" passes.
 * T-V4B2-07 — PLAN-REVIEW.md present without a "Reviewed-by:" line is
 * REJECTED naming C-E7-03.
 * T-V4B2-08 — a partial contradiction (one matched, one not) passes; an
 * unmatched contradiction is REJECTED naming the id.
 * T-V4B2-10 — mode-inconsistent history (autonomous+decisionGate,
 * guided+planReview) is REJECTED naming C-E7-06 and the offending state.
 * T-V4B2-11 — a default contradicted once (recovery loop) passes; contradicted
 * twice with an ESCALATED card passes and prints the ESCALATED line;
 * contradicted twice without a card is REJECTED.
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

// T-V4B2-05
{
  const bad = run(["state", "tests/fixtures/v4/defaults-bad-source/.plan-it/bad.state.json"]);
  assert(bad.code !== 0, `expected non-zero exit for a "guessed" default row, got 0:\n${bad.out}`);
  assert(bad.out.includes("C-E7-07") && bad.out.includes("D2"), `expected "C-E7-07" and row id "D2" in output:\n${bad.out}`);

  const good = run(["state", "tests/fixtures/v4/defaults-bad-source/.plan-it/good.state.json"]);
  assert(good.code === 0, `expected exit 0 when every default row is "recommended", got ${good.code}:\n${good.out}`);
}

// T-V4B2-07
{
  const r = run(["state", "--dir", "tests/fixtures/v4/planreview-no-ack", "--run", "v4"]);
  assert(r.code !== 0, `expected non-zero exit for PLAN-REVIEW.md missing the ack line, got 0:\n${r.out}`);
  assert(r.out.includes("C-E7-03"), `expected "C-E7-03" in output:\n${r.out}`);
}

// T-V4B2-08
{
  const good = run(["state", "--dir", "tests/fixtures/v4/planreview-good", "--run", "v4"]);
  assert(good.code === 0, `expected exit 0 for a partial (matched) contradiction, got ${good.code}:\n${good.out}`);

  const unmatched = run(["state", "--dir", "tests/fixtures/v4/planreview-unmatched-contradiction", "--run", "v4"]);
  assert(unmatched.code !== 0, `expected non-zero exit for an unmatched contradiction, got 0:\n${unmatched.out}`);
  assert(unmatched.out.includes("D2"), `expected offending id "D2" named in output:\n${unmatched.out}`);
}

// T-V4B2-10
{
  const auto = run(["state", "tests/fixtures/v4/mode-mixed/.plan-it/autonomous-with-decisiongate.state.json"]);
  assert(auto.code !== 0, `expected non-zero exit for autonomous-draft + decisionGate in history, got 0:\n${auto.out}`);
  assert(auto.out.includes("C-E7-06") && auto.out.includes("decisionGate"), `expected "C-E7-06" and "decisionGate" named in output:\n${auto.out}`);

  const guided = run(["state", "tests/fixtures/v4/mode-mixed/.plan-it/guided-with-planreview.state.json"]);
  assert(guided.code !== 0, `expected non-zero exit for guided + planReview in history, got 0:\n${guided.out}`);
  assert(guided.out.includes("C-E7-06") && guided.out.includes("planReview"), `expected "C-E7-06" and "planReview" named in output:\n${guided.out}`);
}

// T-V4B2-11
{
  const recovery = run(["state", "tests/fixtures/v4/contradiction-recovery/.plan-it/v4.state.json"]);
  assert(recovery.code === 0, `expected exit 0 for a single REVIEW_CONTRADICTED recovery loop, got ${recovery.code}:\n${recovery.out}`);
  assert(recovery.out.includes("AMENDMENT"), `expected the recovery edge (AMENDMENT) listed among next events:\n${recovery.out}`);

  const escalated = run(["state", "tests/fixtures/v4/contradiction-twice/.plan-it/escalated.state.json"]);
  assert(escalated.code === 0, `expected exit 0 when the twice-contradicted default is escalated with a card, got ${escalated.code}:\n${escalated.out}`);
  assert(escalated.out.includes("ESCALATED: D1 → cards/D1-escalation.md"), `expected the ESCALATED line in stdout:\n${escalated.out}`);

  const noCard = run(["state", "tests/fixtures/v4/contradiction-twice/.plan-it/no-card.state.json"]);
  assert(noCard.code !== 0, `expected non-zero exit when contradicted twice without a card, got 0:\n${noCard.out}`);
  assert(
    noCard.out.includes("contradicted twice without ESCALATED card — never re-default"),
    `expected the exact "never re-default" reason in output:\n${noCard.out}`
  );
}

if (failed) {
  console.error("FAIL — mode-consistency.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — mode-consistency.mjs: T-V4B2-05, 07, 08, 10, 11 pass");
process.exit(0);
