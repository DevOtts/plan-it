#!/usr/bin/env node
/**
 * T-C3-02 / C-W6-02 — KICKOFF re-derive-first (PRD §D5).
 *
 * Asserts, against the KICKOFF template block in references/templates.md:
 *   - the numbered list opens with the "0. Pinning" anchor;
 *   - the FIRST numbered instruction (step 1) is "Re-derive tally +
 *     reconcile from disk";
 *   - the step carries the stop-and-report mismatch clause.
 *
 * Exit codes per the C-META-01 sweep convention (precedent:
 * tests/v3/guard-status-vocab.mjs): enforcement holds → exit 1 (non-zero,
 * what the sweep asserts); assertion hole → exit 0 so the sweep flags the
 * row. Never a silent green.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const fails = [];

const tpl = readFileSync(join(ROOT, "references", "templates.md"), "utf8");
const m = tpl.match(/### `KICKOFF\.md`[\s\S]*?(?=\n### )/);
const block = m ? m[0] : "";
if (!block) fails.push("KICKOFF template block not found in references/templates.md");

const steps = block.match(/^\d+\..*$/gm) ?? [];
if (steps.length === 0) fails.push("KICKOFF block has no numbered steps at all");
if (steps[0] && !/^0\. Pinning/.test(steps[0]))
  fails.push(`the list must open with the '0. Pinning' anchor, got: "${steps[0]}"`);
if (steps[1] && !/^1\. Re-derive tally \+ reconcile from disk/.test(steps[1]))
  fails.push(`step 1 must be 'Re-derive tally + reconcile from disk', got: "${steps[1]}"`);
if (steps.length >= 2 && !steps[1]) fails.push("step 1 missing");

// The stop-and-report clause lives in the step-1 body (which wraps lines) —
// scope the search to the text between step 1 and step 2.
const step1Body = (block.match(/^1\. Re-derive[\s\S]*?(?=^2\. )/m) ?? [""])[0];
if (!/stop and report/.test(step1Body))
  fails.push("step 1 lacks the 'stop and report' mismatch clause");
if (!/reconcile/.test(step1Body)) fails.push("step 1 lacks the reconcile instruction");

if (fails.length > 0) {
  console.error(`ENFORCEMENT HOLE — T-C3-02 kickoff-rederive: ${fails.length} assertion(s) failed; exiting 0 so the C-META-01 sweep flags this row:`);
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(0); // hole → exit 0 → sweep/run-contract flag C-W6-02
}
console.log("ENFORCEMENT OK — T-C3-02: re-derive tally + reconcile from disk is the builder's first numbered step, stop-and-report on mismatch.");
console.log("Exiting 1 per the C-META-01 sweep convention (CONTRACT run: cells exit non-zero when enforcement holds).");
process.exit(1);
