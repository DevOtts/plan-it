#!/usr/bin/env node
/**
 * C-META-01 — fail-closed umbrella sweep (bound by Epic A1's T-A1-01).
 *
 * Reads delivery/v3/CONTRACT.md directly and extracts every enforcement
 * row's `run:` cell — COMPUTED per the W5 invariant (CONTRACT.md's own
 * Tally line), never a hand-copied list of the 26 rows. For every row
 * except itself (C-META-01 — this script IS the umbrella, it does not
 * recurse into itself):
 *
 *   - if the row's Wave-1 mechanism (fixture dir/file, test script, or
 *     gate-check verb + --dir support) is missing on disk, it is reported
 *     as a named GAP — expected pre-Wave-1, never a silent pass;
 *   - if the mechanism is present, the row's exact `run:` command is
 *     executed and a non-zero exit is asserted (the actual fail-closed
 *     behavior the row promises against its violating fixture).
 *
 * Exit codes per AMD-3 (delivery/decisions.md 2026-07-08): 0 = pass
 * (every row mechanism-ready and fail-closed), 1 = fail (gaps and/or a
 * fail-closed violation exist). Exit code 2 is reserved for testconv's
 * FD-1 "needs registration" case and is not used here.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { execSync } from "node:child_process";
import { parseContractCases, mechanismGap, ROOT } from "./lib/contract-cases.mjs";

const rows = parseContractCases();
if (rows.length === 0) {
  console.error("FAIL — zero case rows parsed out of delivery/v3/CONTRACT.md's '## Cases' table (parser or table shape drifted)");
  process.exit(1);
}

const examined = rows.filter((r) => r.id !== "C-META-01");
const gaps = [];
const violations = [];
const readyPasses = [];

for (const row of examined) {
  const gap = mechanismGap(row);
  if (gap) {
    gaps.push({ id: row.id, reason: gap, run: row.run });
    continue;
  }
  try {
    execSync(row.run, { cwd: ROOT, stdio: "pipe" });
    // Exited 0 against what should be a VIOLATING fixture — fail-closed is broken.
    violations.push({ id: row.id, run: row.run });
  } catch {
    readyPasses.push(row.id);
  }
}

console.log(`C-META-01 fail-closed sweep — ${examined.length} enforcement row(s) examined (excludes self)`);
console.log(`  mechanism-ready and fail-closed: ${readyPasses.length}`);
for (const id of readyPasses) console.log(`    PASS  ${id}`);

console.log(`  mechanism gaps (expected pre-Wave-1, named — not a silent pass): ${gaps.length}`);
for (const g of gaps) console.log(`    GAP   ${g.id}  ${g.reason}  (run: ${g.run})`);

if (violations.length > 0) {
  console.log(`  fail-closed VIOLATIONS (mechanism exists but exited 0 against a violating fixture): ${violations.length}`);
  for (const v of violations) console.log(`    FAIL  ${v.id}  (run: ${v.run})`);
}

if (gaps.length > 0 || violations.length > 0) {
  console.error(`\nFAIL — ${gaps.length} mechanism gap(s), ${violations.length} fail-closed violation(s) out of ${examined.length} enforcement rows`);
  process.exit(1);
}

console.log(`\nPASS — all ${examined.length} enforcement rows are mechanism-ready and fail-closed`);
process.exit(0);
