#!/usr/bin/env node
/**
 * T-V4C2-02 / C-E4-01 — GATE.md template shape: every "Answered" row's Type
 * is decision|authorization|owner-action, and all 3 sections exist.
 *
 * Normal exit semantics: exit 0 = PASS; exit 1 = FAIL, naming every gap.
 *
 * Self-test (run first, always): an in-memory fixture with an untyped
 * Answered row is fed through the same row-checker used against the real
 * file, and this script aborts with a harness error if that row is NOT
 * flagged — proving the real run below would genuinely fail on it.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const VALID_TYPES = new Set(["decision", "authorization", "owner-action"]);

/** Extract the "### `GATE.md` ..." block up to the next "### " heading. */
function extractGateBlock(text) {
  const m = text.match(/###\s+`GATE\.md`[\s\S]*?(?=\n### `|$)/);
  return m ? m[0] : "";
}

/**
 * Parse the "## Answered" table's rows and return the list of rows whose
 * Type cell is empty or outside VALID_TYPES. Rows are `| # | Type | ... |`.
 */
function badTypedRows(block) {
  const answeredIdx = block.search(/##\s*Answered/);
  if (answeredIdx === -1) return null; // section missing entirely
  const rest = block.slice(answeredIdx);
  const nextSection = rest.slice(1).search(/\n##\s/);
  const section = nextSection === -1 ? rest : rest.slice(0, nextSection + 1);
  const rows = [...section.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|.*\|\s*$/gm)]
    // Skip the header row and the `|---|` separator row.
    .filter((m) => !/^#/.test(m[1]) && !/^-+$/.test(m[1]) && m[1] !== "#");
  return rows.filter((m) => !VALID_TYPES.has(m[2].trim()));
}

// -- self-test: prove the checker genuinely fails on an untyped row --------
const brokenGate = [
  "### `GATE.md` — the autonomy contract (build-time)",
  "```",
  "## Answered (owner: <name> · <date>)",
  "| # | Type | Decision / authorization | Answer |",
  "|---|------|---------------------------|--------|",
  "| G-1 | decision | ... | ... |",
  "| G-9 |  | an untyped row | ... |",
  "## Still human, but NOT blocking the run",
  "| # | Item | Owner | When |",
  "## Standing rules the orchestrator enforces",
  "- ...",
  "```",
].join("\n");
const selfTestBad = badTypedRows(brokenGate);
if (!selfTestBad || selfTestBad.length === 0) {
  console.error("HARNESS ERROR: self-test fixture (an untyped Answered row) was NOT flagged — the checker is not sound; aborting before it can vacuously pass.");
  process.exit(1);
}

// -- real run ---------------------------------------------------------------
const text = readFileSync(join(ROOT, "references", "templates.md"), "utf8");
const block = extractGateBlock(text);
const problems = [];

if (!block) {
  problems.push("GATE.md skeleton not found in references/templates.md");
} else {
  for (const [what, re] of [
    ["## Answered section", /##\s*Answered/],
    ["Still human, but NOT blocking the run section", /Still human.*NOT blocking/],
    ["Standing rules section", /Standing rules/],
  ]) {
    if (!re.test(block)) problems.push(`missing ${what}`);
  }
  const bad = badTypedRows(block);
  if (bad) {
    for (const row of bad) problems.push(`Answered row "${row[0].trim()}" has an invalid/empty Type ("${row[2] ?? ""}"); must be decision|authorization|owner-action`);
  }
}

if (problems.length > 0) {
  console.error(`FAIL — gate-shape (${problems.length}):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log("PASS — GATE.md template has 3/3 sections and every Answered row's Type is decision|authorization|owner-action.");
process.exit(0);
