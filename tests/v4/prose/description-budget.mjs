#!/usr/bin/env node
// tests/v4/prose/description-budget.mjs — T-V4C1-02 / C-E1-02 (G-15).
// SKILL frontmatter `description` <= 1024 chars, with "/plan-it" and "plan"
// inside the first 250 chars. Checked in both copies.
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

function foldedDescription(text) {
  const m = text.match(/^description: >-\n([\s\S]*?)\n(?=\S+:)/m);
  if (!m) return null;
  const lines = m[1].split("\n").map((l) => l.replace(/^  /, ""));
  return lines.join(" ");
}

const fails = [];

for (const path of COPIES) {
  const rel = path.slice(ROOT.length + 1);
  const text = readFileSync(path, "utf8");
  const desc = foldedDescription(text);
  if (desc == null) {
    fails.push(`${rel}: could not find frontmatter "description: >-" block`);
    continue;
  }
  if (desc.length > 1024) {
    fails.push(`${rel}: description is ${desc.length} chars, exceeds 1024 (G-15)`);
  }
  const first250 = desc.slice(0, 250);
  if (!first250.includes("/plan-it")) {
    fails.push(`${rel}: first 250 chars do not contain "/plan-it"`);
  }
  if (!first250.includes("plan")) {
    fails.push(`${rel}: first 250 chars do not contain "plan"`);
  }
}

if (fails.length > 0) {
  console.error("FAIL T-V4C1-02 description-budget:");
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("PASS T-V4C1-02 description-budget: description <= 1024 chars, /plan-it + plan in first 250, both copies.");
process.exit(0);
