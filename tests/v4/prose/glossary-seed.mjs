#!/usr/bin/env node
/**
 * T-V4C2-04 / C-E10-04 — GLOSSARY seed in templates.md covers all 12 terms
 * (PRD, CDP, ATDD/BDD, DoD, xhigh, D4, G0-G4, [REAL], INV, S/M/L, Shape 1-5,
 * topology values); SKILL.md no longer says "15 states".
 *
 * The "15 states" half depends on Epic V4C1 (SKILL.md rewrite), which owns
 * that file and may not have merged into this worktree yet. This script
 * still runs the full check and reports both halves separately so the
 * V4C2-only half (the seed table) is never masked by a V4C1 dependency.
 *
 * Normal exit semantics: exit 0 = PASS (both halves); exit 1 = FAIL, naming
 * every gap, with the "15 states" half labeled as pending-V4C1-merge when
 * that is the specific cause.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const text = readFileSync(join(ROOT, "references", "templates.md"), "utf8");

function extractBlock(name) {
  const re = new RegExp("###\\s+`" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "`[\\s\\S]*?(?=\\n### `|$)");
  const m = text.match(re);
  return m ? m[0] : "";
}

const glossaryBlock = extractBlock("GLOSSARY.md");
const problems = [];
const pendingNotes = [];

const terms = [
  ["PRD", /\bPRD\b/],
  ["CDP", /\bCDP\b/],
  ["ATDD/BDD", /ATDD\/BDD|ATDD.*BDD/],
  ["DoD", /\bDoD\b/],
  ["xhigh", /\bxhigh\b/],
  ["D4", /\bD4\b/],
  ["G0-G4", /G0[–-]G4/],
  ["[REAL]", /\[REAL\]/],
  ["INV", /\bINV\b/],
  ["S/M/L", /S\/M\/L/],
  ["Shape 1-5", /Shape 1[–-]5/],
  ["topology values", /solo.*orchestrator\+squads.*headless/],
];

if (!glossaryBlock) {
  problems.push("GLOSSARY.md skeleton not found in references/templates.md");
} else {
  let found = 0;
  for (const [name, re] of terms) {
    if (re.test(glossaryBlock)) found++;
    else problems.push(`GLOSSARY seed missing term: ${name}`);
  }
  if (found < terms.length) problems.push(`only ${found}/${terms.length} GLOSSARY seed terms found`);
}

// -- "15 states" absence (SKILL.md is Epic V4C1's file; check read-only) ----
const skillPaths = [join(ROOT, "SKILL.md"), join(ROOT, "plugins", "plan-it", "skills", "plan-it", "SKILL.md")];
for (const p of skillPaths) {
  const skillText = readFileSync(p, "utf8");
  if (/15 states/.test(skillText)) {
    const rel = p.replace(ROOT + "/", "");
    problems.push(`${rel} still contains "15 states" (owned by Epic V4C1 — pending its merge into this worktree)`);
    pendingNotes.push(rel);
  }
}

if (problems.length > 0) {
  console.error(`FAIL — glossary-seed (${problems.length}):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  if (pendingNotes.length > 0) {
    console.error(`NOTE: the "15 states" sub-check depends on Epic V4C1 landing in this worktree; not yet merged for: ${pendingNotes.join(", ")}. All other checks are this epic's own responsibility.`);
  }
  process.exit(1);
}
console.log("PASS — GLOSSARY seed covers 12/12 terms; SKILL.md (both copies) no longer says \"15 states\".");
process.exit(0);
