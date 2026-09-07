#!/usr/bin/env node
// tests/v4/prose/posture-tables.mjs — T-V4C1-06.
// Both autonomy-posture tables exist ("guided mode" / "autonomous-draft
// mode" headers) and CONTRACT §3.1's exact state names (anamnesis,
// scopeGate, decisionGate, freezeGate, planReview) all appear, unrenamed.
// Checked in both copies.
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

const HEADERS = [
  /^## Autonomy posture — guided mode$/m,
  /^## Autonomy posture — autonomous-draft mode$/m,
];

const STATE_NAMES = ["anamnesis", "scopeGate", "decisionGate", "freezeGate", "planReview"];

const fails = [];

for (const path of COPIES) {
  const rel = path.slice(ROOT.length + 1);
  const text = readFileSync(path, "utf8");

  if (!HEADERS[0].test(text)) fails.push(`${rel}: missing "## Autonomy posture — guided mode" header`);
  if (!HEADERS[1].test(text)) fails.push(`${rel}: missing "## Autonomy posture — autonomous-draft mode" header`);

  for (const name of STATE_NAMES) {
    const re = new RegExp(`\\b${name}\\b`);
    if (!re.test(text)) {
      fails.push(`${rel}: state name "${name}" not found (CONTRACT §3.1 requires it verbatim)`);
    }
  }
}

if (fails.length > 0) {
  console.error("FAIL T-V4C1-06 posture-tables:");
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("PASS T-V4C1-06 posture-tables: both headers + all 5 CONTRACT §3.1 state names present, both copies.");
process.exit(0);
