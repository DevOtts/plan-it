#!/usr/bin/env node
/**
 * C-W4-01 / T-C1-01 — planit-guard status-vocabulary hard guard.
 *
 * Drives scripts/hooks/planit-guard.mjs over inline hook-input fixtures
 * (violating AND compliant sides) and asserts:
 *   - "done"/"complete"/"✅" in a deliverable write WITHOUT a VERIFIED token
 *     + case reference nearby → DENY, reason names the phrase + the closed
 *     4-term vocabulary (NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED
 *     · VERIFIED);
 *   - compliant writes (VERIFIED + case ref adjacent, code-fenced mentions,
 *     non-deliverable paths, unrecognized shapes) → ALLOW (fail-open kept).
 *
 * EXIT-CODE CONVENTION (C-META-01 sweep, tests/v3/fail-closed-sweep.mjs):
 * this script is registered in delivery/v3/CONTRACT.md's "## Cases" table,
 * whose run: cells must exit NON-ZERO when enforcement holds against the
 * violating fixture. Therefore: exit 1 = enforcement demonstrated (all
 * assertions hold); exit 0 = enforcement HOLE detected (a violating write
 * was allowed, or a compliant write was wrongly denied).
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const GUARD = join(ROOT, "scripts", "hooks", "planit-guard.mjs");

function runGuard(hookInput) {
  return execFileSync("node", [GUARD], { encoding: "utf8", input: JSON.stringify(hookInput) }).trim();
}

// cwd with a FROZEN contract, so the pre-existing freeze guard cannot be the
// reason for any deny below — only the new W4 vocabulary check can fire.
function frozenCwd() {
  const dir = mkdtempSync(join(tmpdir(), "planit-vocab-"));
  mkdirSync(join(dir, ".plan-it"), { recursive: true });
  writeFileSync(join(dir, ".plan-it", "state.json"), JSON.stringify({ contract: { version: "1.0" } }));
  return dir;
}

const problems = [];
function check(name, fn) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (e) {
    problems.push(`${name}: ${e.message}`);
    console.log(`  HOLE  ${name}: ${e.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
const isDeny = (out) => out.includes('"permissionDecision":"deny"') || out.includes('"permissionDecision": "deny"');

const cwd = frozenCwd();
const prd = (c) => ({ tool_name: "Write", cwd, tool_input: { file_path: join(cwd, "delivery/prds/prd-1-core.md"), content: c } });

check("VIOLATING: 'done ✅' in a deliverable Write without VERIFIED+case ref → deny", () => {
  const out = runGuard(prd("## Epic E1\n\nEpic E1 is done ✅.\n"));
  assert(isDeny(out), `expected deny, got: ${out || "(allow)"}`);
  assert(/NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED/.test(out), "reason does not name the closed vocabulary");
  assert(/done/i.test(out), "reason does not name the offending phrase");
});

check("VIOLATING: 'complete' via Edit new_string → deny", () => {
  const out = runGuard({
    tool_name: "Edit",
    cwd,
    tool_input: { file_path: join(cwd, "delivery/epics/epics-1-core.md"), old_string: "x", new_string: "All tasks are complete." },
  });
  assert(isDeny(out), `expected deny, got: ${out || "(allow)"}`);
});

check("VIOLATING: 'done' via MultiEdit edits[].new_string → deny", () => {
  const out = runGuard({
    tool_name: "MultiEdit",
    cwd,
    tool_input: { file_path: join(cwd, "delivery/prds/prd-2.md"), edits: [{ old_string: "a", new_string: "Everything done." }] },
  });
  assert(isDeny(out), `expected deny, got: ${out || "(allow)"}`);
});

check("COMPLIANT: 'done' WITH VERIFIED + case ref on the same line → allow", () => {
  const out = runGuard(prd("T-E1-01 VERIFIED — done (run output in the case row).\n"));
  assert(out === "", `expected allow (no output), got: ${out}`);
});

check("COMPLIANT: VERIFIED + case ref on the adjacent line → allow", () => {
  const out = runGuard(prd("Epic E1 is done.\nVERIFIED per T-E1-01 run output.\n"));
  assert(out === "", `expected allow (no output), got: ${out}`);
});

check("COMPLIANT: trigger word only inside a fenced code block → allow", () => {
  const out = runGuard(prd("Status notes:\n```\nechoes the word done inside a fence\n```\n"));
  assert(out === "", `expected allow (no output), got: ${out}`);
});

check("COMPLIANT: 4-term vocabulary itself (IMPLEMENTED-NOT-VERIFIED) → allow", () => {
  const out = runGuard(prd("status: IMPLEMENTED-NOT-VERIFIED\n"));
  assert(out === "", `expected allow (no output), got: ${out}`);
});

check("SCOPE: 'done' in a NON-deliverable path → allow", () => {
  const out = runGuard({ tool_name: "Write", cwd, tool_input: { file_path: join(cwd, "docs/notes.md"), content: "done ✅" } });
  assert(out === "", `expected allow (no output), got: ${out}`);
});

check("FAIL-OPEN: MultiEdit with unrecognized edits shape → allow", () => {
  const out = runGuard({ tool_name: "MultiEdit", cwd, tool_input: { file_path: join(cwd, "delivery/prds/prd-3.md"), edits: [{ weird: true }, null] } });
  assert(out === "", `expected allow (no output), got: ${out}`);
});

check("REGRESSION: freeze guard untouched — unfrozen contract still denies with freeze reason", () => {
  const bare = mkdtempSync(join(tmpdir(), "planit-vocab-"));
  mkdirSync(join(bare, ".plan-it"), { recursive: true });
  writeFileSync(join(bare, ".plan-it", "state.json"), JSON.stringify({ contract: { version: null } }));
  const out = runGuard({ tool_name: "Write", cwd: bare, tool_input: { file_path: join(bare, "delivery/prds/prd-1.md") } });
  assert(isDeny(out) && /freeze/i.test(out), `expected freeze deny, got: ${out || "(allow)"}`);
});

if (problems.length > 0) {
  console.error(`\nENFORCEMENT HOLE — ${problems.length} assertion(s) failed; exiting 0 so the C-META-01 sweep flags this row:`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(0); // hole → exit 0 → sweep/run-contract flag C-W4-01
}
console.log("\nENFORCEMENT OK — W4 status-vocabulary guard is fail-closed (deny on violating writes, allow on compliant/fail-open shapes).");
console.log("Exiting 1 per the C-META-01 sweep convention (CONTRACT run: cells exit non-zero when enforcement holds).");
process.exit(1);
