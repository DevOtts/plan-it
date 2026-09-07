#!/usr/bin/env node
// tests/v4/prose/anamnesis-section.mjs — T-V4C1-05.
// Phase 0's anamnesis questionnaire carries all six items: access &
// credentials, fences, naming conventions, topology preference, live-probe
// authorization, decisions already known. Checked in both copies.
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

const ITEMS = {
  "access & credentials": /access\s*&\s*credentials/i,
  "fences": /\bfences\b/i,
  "naming conventions": /naming\s+conventions/i,
  "topology preference": /topology\s+preference/i,
  "live-probe authorization": /live-probe\s+authorization/i,
  "decisions already known": /decisions\s+already\s+known/i,
};

const fails = [];

for (const path of COPIES) {
  const rel = path.slice(ROOT.length + 1);
  const text = readFileSync(path, "utf8");

  const phase0Match = text.match(/^## Phase 0[\s\S]*?(?=^## Phase 1)/m);
  if (!phase0Match) {
    fails.push(`${rel}: could not locate Phase 0 section`);
    continue;
  }
  const phase0 = phase0Match[0];

  if (!/\banamnesis\b/i.test(phase0)) {
    fails.push(`${rel}: Phase 0 does not mention "anamnesis"`);
  }
  if (!/\bG0\b/.test(phase0)) {
    fails.push(`${rel}: Phase 0 does not mention gate "G0"`);
  }

  let found = 0;
  for (const [label, re] of Object.entries(ITEMS)) {
    if (re.test(phase0)) {
      found++;
    } else {
      fails.push(`${rel}: Phase 0 anamnesis questionnaire missing item "${label}"`);
    }
  }
  if (found !== 6) {
    fails.push(`${rel}: found ${found}/6 anamnesis questionnaire items`);
  }
}

if (fails.length > 0) {
  console.error("FAIL T-V4C1-05 anamnesis-section:");
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("PASS T-V4C1-05 anamnesis-section: 6/6 questionnaire items + anamnesis/G0 present, both copies.");
process.exit(0);
