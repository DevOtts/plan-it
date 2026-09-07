#!/usr/bin/env node
// tests/v4/prose/skill-sections.mjs — T-V4C1-01 / C-E1-01.
// SKILL.md (both copies) contains exactly one "## Output discipline for
// humans" section, and Phase 2's scope-brief sentence precedes the G1 menu
// sentence. Exit 0 = both hold in both copies; non-zero = named failure.
//
// Authored by DevOtts (https://github.com/DevOtts).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const COPIES = [
  join(ROOT, "SKILL.md"),
  join(ROOT, "plugins", "plan-it", "skills", "plan-it", "SKILL.md"),
];

const fails = [];

for (const path of COPIES) {
  const rel = path.slice(ROOT.length + 1);
  const text = readFileSync(path, "utf8");

  const headerMatches = text.match(/^## Output discipline for humans$/gm) || [];
  if (headerMatches.length !== 1) {
    fails.push(`${rel}: expected exactly 1 "## Output discipline for humans" header, found ${headerMatches.length}`);
  }

  const phase2Match = text.match(/^## Phase 2[\s\S]*?(?=^## Phase 3)/m);
  if (!phase2Match) {
    fails.push(`${rel}: could not locate Phase 2 section (## Phase 2 ... ## Phase 3)`);
    continue;
  }
  const phase2 = phase2Match[0];
  const scopeBriefIdx = phase2.indexOf("SCOPE-BRIEF");
  const g1MenuIdx = phase2.indexOf("shape + topology + the numbered DoD");
  if (scopeBriefIdx === -1) {
    fails.push(`${rel}: Phase 2 does not mention SCOPE-BRIEF`);
  } else if (g1MenuIdx === -1) {
    fails.push(`${rel}: Phase 2 does not contain the G1 menu sentence ("...shape + topology + the numbered DoD")`);
  } else if (!(scopeBriefIdx < g1MenuIdx)) {
    fails.push(`${rel}: SCOPE-BRIEF sentence (idx ${scopeBriefIdx}) does not precede the G1 menu sentence (idx ${g1MenuIdx})`);
  }
}

if (fails.length > 0) {
  console.error("FAIL T-V4C1-01 skill-sections:");
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("PASS T-V4C1-01 skill-sections: exactly 1 Output-discipline header + scope-brief precedes G1 menu, both copies.");
process.exit(0);
