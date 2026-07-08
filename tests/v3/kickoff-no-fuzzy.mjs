#!/usr/bin/env node
/**
 * T-C3-03 / C-W6-05 — KICKOFF fuzzy-resume ban (PRD §D4-D5).
 *
 * Asserts, against the KICKOFF template block in references/templates.md:
 *   - the pinned-resume + fuzzy-resume-ban sentence is present
 *     ("pinned-only" … "fuzzy-resume" … "banned");
 *   - the literal `/read-chat` token NEVER appears inside the KICKOFF
 *     template block — it may only live in SKILL.md's pre-grounding
 *     composability note (SKILL.md:520), never as a resume mechanism in
 *     the template a fresh session copies from.
 *
 * Exit codes per the C-META-01 sweep convention (precedent:
 * tests/v3/guard-status-vocab.mjs): enforcement holds → exit 1 (non-zero,
 * what the sweep asserts); assertion hole → exit 0 so the sweep flags the
 * row. Never a silent green.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const fails = [];

const tpl = readFileSync(join(ROOT, "references", "templates.md"), "utf8");
const m = tpl.match(/### `KICKOFF\.md`[\s\S]*?(?=\n### )/);
const block = m ? m[0] : "";
if (!block) fails.push("KICKOFF template block not found in references/templates.md");

for (const [what, re] of [
  ["pinned-only resume sentence", /pinned-only/],
  ["fuzzy-resume ban", /fuzzy-resume[\s\S]*?banned/],
  ["block-0 + state.json as the only re-entry path", /block 0 \+ state\.json/],
]) {
  if (!re.test(block)) fails.push(`KICKOFF block missing ${what}`);
}

if (/\/read-chat/.test(block))
  fails.push("literal `/read-chat` found inside the KICKOFF template block — fuzzy-resume mechanism leaked into the template");

// Chat-archaeology instructions are only tolerable inside the ban sentence
// itself (a line/sentence that also says "banned" or "never").
const fuzzyLines = block
  .split("\n")
  .filter((l) => /continue (from )?where we left off|scroll(ing)? (up|back)|re-read(ing)? old sessions/i.test(l));
const banContext = /banned|never/;
for (const l of fuzzyLines) {
  // allow if the surrounding ban sentence (this line ± neighbors) carries the ban marker
  const i = block.split("\n").indexOf(l);
  const ctx = block.split("\n").slice(Math.max(0, i - 2), i + 3).join("\n");
  if (!banContext.test(ctx))
    fails.push(`fuzzy-resume language outside a ban context: "${l.trim()}"`);
}

if (fails.length > 0) {
  console.error(`ENFORCEMENT HOLE — T-C3-03 kickoff-no-fuzzy: ${fails.length} assertion(s) failed; exiting 0 so the C-META-01 sweep flags this row:`);
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(0); // hole → exit 0 → sweep/run-contract flag C-W6-05
}
console.log("ENFORCEMENT OK — T-C3-03: KICKOFF template is pinned-resume only; no /read-chat, fuzzy language only inside the ban sentence.");
console.log("Exiting 1 per the C-META-01 sweep convention (CONTRACT run: cells exit non-zero when enforcement holds).");
process.exit(1);
