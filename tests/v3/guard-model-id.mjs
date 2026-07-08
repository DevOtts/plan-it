#!/usr/bin/env node
/**
 * C-W3-02 / T-B?-?? — planit-guard hardcoded-model-ID hard guard.
 *
 * Drives scripts/hooks/planit-guard.mjs over inline hook-input fixtures
 * (violating AND compliant sides) and asserts:
 *   - a literal model ID matching /claude-[a-z0-9-]+/ (verbatim regex from
 *     CONTRACT.md C-W3-02) in a deliverable Write/Edit/MultiEdit → DENY, reason
 *     names W3 + the offending model ID;
 *   - compliant writes (tier references, code-fenced / inline-code mentions,
 *     non-deliverable paths) → ALLOW (mention-vs-use + fail-open preserved);
 *   - the pre-existing W4 vocabulary guard is untouched (regression).
 *
 * EXIT-CODE CONVENTION (C-META-01 sweep, tests/v3/fail-closed-sweep.mjs):
 * this script is registered in delivery/v3/CONTRACT.md's "## Cases" table,
 * whose run: cells must exit NON-ZERO when enforcement holds against the
 * violating fixture. Therefore: exit 1 = enforcement demonstrated (all
 * assertions hold); exit 0 = enforcement HOLE detected (a violating write was
 * allowed, or a compliant write was wrongly denied).
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
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
// reason for any deny below — and so compliant writes actually reach ALLOW.
function frozenCwd() {
  const dir = mkdtempSync(join(tmpdir(), "planit-modelid-"));
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

check("VIOLATING: hardcoded model ID in a deliverable Write → deny (names W3 + the ID)", () => {
  const out = runGuard(prd("## Tiering\n\nRun this squad on claude-fable-5 for the hard reasoning.\n"));
  assert(isDeny(out), `expected deny, got: ${out || "(allow)"}`);
  assert(/W3/.test(out), "reason does not name the W3 rule");
  assert(/claude-fable-5/.test(out), "reason does not name the offending model ID");
});

check("VIOLATING: model ID via Edit new_string → deny", () => {
  const out = runGuard({
    tool_name: "Edit",
    cwd,
    tool_input: { file_path: join(cwd, "delivery/epics/epics-1-core.md"), old_string: "x", new_string: "coordinator: claude-opus-4-8" },
  });
  assert(isDeny(out), `expected deny, got: ${out || "(allow)"}`);
});

check("VIOLATING: model ID via MultiEdit edits[].new_string → deny", () => {
  const out = runGuard({
    tool_name: "MultiEdit",
    cwd,
    tool_input: { file_path: join(cwd, "delivery/prds/prd-2.md"), edits: [{ old_string: "a", new_string: "builder = claude-sonnet-5" }] },
  });
  assert(isDeny(out), `expected deny, got: ${out || "(allow)"}`);
});

check("COMPLIANT: tier reference (top/mid/low) instead of a model ID → allow", () => {
  const out = runGuard(prd("## Tiering\n\nCoordinator = top; builders = mid; fixtures = low.\n"));
  assert(out === "", `expected allow (no output), got: ${out}`);
});

check("COMPLIANT: model ID only inside a fenced code block → allow (mention, not use)", () => {
  const out = runGuard(prd("Guard rejects hardcoded IDs like:\n```\nmodel: claude-fable-5\n```\n"));
  assert(out === "", `expected allow (no output), got: ${out}`);
});

check("COMPLIANT: model ID only inside an inline code span → allow (mention, not use)", () => {
  const out = runGuard(prd("The W3 regex `claude-[a-z0-9-]+` catches literals like `claude-fable-5`.\n"));
  assert(out === "", `expected allow (no output), got: ${out}`);
});

check("SCOPE: model ID in a NON-deliverable path → allow", () => {
  const out = runGuard({ tool_name: "Write", cwd, tool_input: { file_path: join(cwd, "docs/notes.md"), content: "we used claude-fable-5" } });
  assert(out === "", `expected allow (no output), got: ${out}`);
});

check("REGRESSION: W4 vocabulary guard untouched — 'done' without VERIFIED still denies", () => {
  const out = runGuard(prd("## Epic E1\n\nEpic E1 is done.\n"));
  assert(isDeny(out) && /W4/.test(out), `expected W4 deny, got: ${out || "(allow)"}`);
});

if (problems.length > 0) {
  console.error(`\nENFORCEMENT HOLE — ${problems.length} assertion(s) failed; exiting 0 so the C-META-01 sweep flags this row:`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(0); // hole → exit 0 → sweep/run-contract flag C-W3-02
}
console.log("\nENFORCEMENT OK — W3 hardcoded-model-ID guard is fail-closed (deny on violating writes, allow on tier refs / code mentions / non-deliverables).");
console.log("Exiting 1 per the C-META-01 sweep convention (CONTRACT run: cells exit non-zero when enforcement holds).");
process.exit(1);
