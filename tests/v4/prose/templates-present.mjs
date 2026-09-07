#!/usr/bin/env node
/**
 * T-V4C2-01 / C-E1-04 — templates.md carries the 7 new document skeletons,
 * each with its required sub-headings.
 *
 * Normal exit semantics: exit 0 = PASS (7/7 skeletons found, each with all
 * its required sub-headings); exit 1 = FAIL, naming every gap.
 *
 * Self-test (run first, always): a synthetic GATE.md block with its
 * "Standing rules" section deleted is fed through the same checker used
 * against the real file, and this script aborts with a harness error if
 * the checker does NOT flag it — proving the real run below would
 * genuinely fail on that fixture rather than passing vacuously.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** Extract the "### `<name>`" ... next "### " block from templates.md. */
function extractBlock(text, name) {
  const re = new RegExp("###\\s+`" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "`[\\s\\S]*?(?=\\n### `|$)");
  const m = text.match(re);
  return m ? m[0] : "";
}

/** Return the list of required headings/markers NOT found in block. */
function missingHeadings(block, required) {
  return required.filter((re) => !re.test(block));
}

// -- self-test: prove the checker genuinely fails on a broken fixture ------
const brokenGate = [
  "### `GATE.md` — the autonomy contract (build-time)",
  "```",
  "## Answered (owner: <name> · <date>)",
  "| # | Type | Decision / authorization | Answer |",
  "## Still human, but NOT blocking the run",
  "| # | Item | Owner | When |",
  "```",
].join("\n");
const selfTestMissing = missingHeadings(brokenGate, [/##\s*Answered/, /Still human/, /Standing rules/]);
if (!selfTestMissing.some((re) => String(re).includes("Standing rules"))) {
  console.error("HARNESS ERROR: self-test fixture (GATE.md without 'Standing rules') was NOT flagged as missing — the checker is not sound; aborting before it can vacuously pass.");
  process.exit(1);
}

// -- real run ---------------------------------------------------------------
const text = readFileSync(join(ROOT, "references", "templates.md"), "utf8");

const skeletons = [
  { name: "SCOPE-BRIEF.md", required: [/What this looks like at each size/, /What this looks like at each shape/, /Topology/, /What this costs you/, /When this is the wrong choice/] },
  { name: "ANAMNESIS.md", required: [/1\. Access & credentials/, /2\. Fences/, /3\. Naming/, /4\. Topology preference/, /5\. Live-probe authorization/, /6\. Decisions you already know/] },
  { name: "DECISIONS.md", required: [/##\s*Ruled/, /##\s*Open/, /Rulings carried forward/, /Copy-your-rulings/] },
  { name: "GATE.md", required: [/##\s*Answered/, /Still human.*NOT blocking/, /Standing rules/] },
  { name: "SESSIONS.md", required: [/\|\s*#\s*\|\s*Session name\s*\|/, /##\s*Launch prompts/, /##\s*Orchestrator runbook/] },
  { name: "PLAN-REVIEW.md", required: [/Defaults applied/, /Package tree/, /States if you answer nothing/, /Copy-your-rulings/] },
  { name: "GLOSSARY.md", required: [/plan-it vocabulary/, /This run's invented IDs/] },
];

const problems = [];
for (const { name, required } of skeletons) {
  const block = extractBlock(text, name);
  if (!block) {
    problems.push(`skeleton "${name}" not found in references/templates.md`);
    continue;
  }
  const missing = missingHeadings(block, required);
  for (const re of missing) problems.push(`skeleton "${name}" missing required sub-heading matching ${re}`);
}

if (problems.length > 0) {
  console.error(`FAIL — templates-present (${problems.length}):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`PASS — templates.md carries all 7/7 new skeletons (${skeletons.map((s) => s.name).join(", ")}), each with its required sub-headings.`);
process.exit(0);
