#!/usr/bin/env node
// tests/v4/prose/docs-coherence.mjs — T-V4C3-01 / C-E11-03.
// README names anamnesis/topology/autonomous-draft; docs/usage.md documents
// both postures (guided + autonomous-draft); docs/methodology.md's rule count
// equals SKILL.md's rule count (both parsed from their own "## The N
// non-negotiable rules" section, never hand-typed).
//
// Authored by DevOtts (https://github.com/DevOtts).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const readme = readFileSync(join(ROOT, "README.md"), "utf8");
const usage = readFileSync(join(ROOT, "docs", "usage.md"), "utf8");
const methodology = readFileSync(join(ROOT, "docs", "methodology.md"), "utf8");
const skill = readFileSync(join(ROOT, "SKILL.md"), "utf8");

const fails = [];

// 1. README names anamnesis, topology, autonomous-draft (at least one clause each).
for (const term of ["anamnesis", "topology", "autonomous-draft"]) {
  const re = new RegExp(`\\b${term}\\b`, "i");
  if (!re.test(readme)) fails.push(`README.md: does not mention "${term}"`);
}

// 2. docs/usage.md documents both postures.
if (!/guided mode/i.test(usage)) {
  fails.push(`docs/usage.md: no "guided mode" section found`);
}
if (!/autonomous-draft/i.test(usage)) {
  fails.push(`docs/usage.md: no "autonomous-draft" mode section found`);
}

// 3. docs/methodology.md's rule count equals SKILL.md's rule count.
const WORD_TO_NUM = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

function ruleSection(text, label) {
  const headingRe = /^##\s+The\s+(\w+)\s+non-negotiable rules.*$/m;
  const m = headingRe.exec(text);
  if (!m) {
    fails.push(`${label}: no "## The <N> non-negotiable rules" heading found`);
    return null;
  }
  const start = m.index + m[0].length;
  const rest = text.slice(start);
  const nextHeading = rest.search(/^##\s/m);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  const word = m[1].toLowerCase();
  const declared = WORD_TO_NUM[word];
  if (declared === undefined) {
    fails.push(`${label}: heading rule-count word "${word}" is not a recognized number word`);
  }
  return { section, declared, word };
}

const skillRules = ruleSection(skill, "SKILL.md");
const methodologyRules = ruleSection(methodology, "docs/methodology.md");

if (skillRules && methodologyRules) {
  const skillCount = (skillRules.section.match(/^\d+\.\s/gm) || []).length;
  const methodologyCount = (methodologyRules.section.match(/^###\s*\d+\./gm) || []).length;

  if (skillCount === 0) fails.push(`SKILL.md: found 0 numbered rules in its rules section`);
  if (methodologyCount === 0) fails.push(`docs/methodology.md: found 0 numbered rules in its rules section`);

  if (skillRules.declared !== undefined && skillCount !== skillRules.declared) {
    fails.push(`SKILL.md: heading says "${skillRules.word}" (${skillRules.declared}) but ${skillCount} numbered rules were found`);
  }
  if (methodologyRules.declared !== undefined && methodologyCount !== methodologyRules.declared) {
    fails.push(`docs/methodology.md: heading says "${methodologyRules.word}" (${methodologyRules.declared}) but ${methodologyCount} numbered rules were found`);
  }
  if (skillCount !== methodologyCount) {
    fails.push(`rule count mismatch: SKILL.md has ${skillCount}, docs/methodology.md has ${methodologyCount}`);
  }
  if (methodologyRules.word === "four") {
    fails.push(`docs/methodology.md: heading still says "four non-negotiable rules"`);
  }
}

if (fails.length > 0) {
  console.error(`FAIL T-V4C3-01 / C-E11-03 docs-coherence (${fails.length}):`);
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("PASS T-V4C3-01 / C-E11-03 docs-coherence: README names anamnesis/topology/autonomous-draft; usage.md documents both modes; methodology.md's rule count equals SKILL.md's.");
process.exit(0);
