#!/usr/bin/env node
// tests/v4/prose/local-html-rule.mjs — T-V4C1-03 / C-E1-03 (G-7 prose).
// SKILL.md says twins are created locally, opened only at human gates, and
// never published as a claude.ai artifact. Checks 3 phrases, both copies.
// Prose may wrap mid-phrase across markdown lines, so whitespace (including
// newlines) between words is tolerated.
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

// Each phrase as a sequence of literal words; \s+ tolerates a line wrap.
const PHRASE_WORDS = {
  "local twin (created locally)": ["created", "locally"],
  "never published as a claude.ai artifact": ["never", "published", "as", "a", "claude\\.ai", "artifact"],
};
// Checked independently since "--open" is often immediately followed by
// punctuation (no whitespace) rather than a new word.
const PLAIN_SUBSTRINGS = {
  "--open flag mentioned": "--open",
};
const FLEXIBLE_PHRASES = {
  "only at human gates": ["only", "at", "human", "gates"],
};

const fails = [];

for (const path of COPIES) {
  const rel = path.slice(ROOT.length + 1);
  const text = readFileSync(path, "utf8");
  for (const [label, words] of Object.entries(PHRASE_WORDS)) {
    const re = new RegExp(words.join("\\s+"), "i");
    if (!re.test(text)) fails.push(`${rel}: missing phrase "${label}"`);
  }
  for (const [label, needle] of Object.entries(PLAIN_SUBSTRINGS)) {
    if (!text.includes(needle)) fails.push(`${rel}: missing "${label}"`);
  }
  for (const [label, words] of Object.entries(FLEXIBLE_PHRASES)) {
    const re = new RegExp(words.join("\\s+"), "i");
    if (!re.test(text)) fails.push(`${rel}: missing phrase "${label}"`);
  }
}

if (fails.length > 0) {
  console.error("FAIL T-V4C1-03 local-html-rule:");
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("PASS T-V4C1-03 local-html-rule: local-twin / never-published / --open-at-gates phrases found, both copies.");
process.exit(0);
