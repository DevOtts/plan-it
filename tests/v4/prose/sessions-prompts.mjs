#!/usr/bin/env node
/**
 * T-V4C2-03 / C-E4-02 — SESSIONS.md launch prompts each carry all 7 required
 * elements (package path, law, lane, branch pattern, DoD, register-handshake,
 * gotcha) plus the worktrees-only line (G-10); no "wait for" a notification
 * anywhere in SESSIONS.md (G-11); KICKOFF.md still carries exactly 1
 * launch prompt.
 *
 * Normal exit semantics: exit 0 = PASS; exit 1 = FAIL, naming every gap.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const text = readFileSync(join(ROOT, "references", "templates.md"), "utf8");

/** Every file literally named SESSIONS.md anywhere in the repo (skip .git/node_modules). */
function findSessionsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === ".git" || entry === "node_modules") continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...findSessionsFiles(p));
    else if (entry === "SESSIONS.md") out.push(p);
  }
  return out;
}

function extractBlock(name) {
  const re = new RegExp("###\\s+`" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "`[\\s\\S]*?(?=\\n### `|$)");
  const m = text.match(re);
  return m ? m[0] : "";
}

const problems = [];

const sessionsBlock = extractBlock("SESSIONS.md");
if (!sessionsBlock) {
  problems.push("SESSIONS.md skeleton not found in references/templates.md");
} else {
  // -- every fenced launch-prompt code block carries all 7 elements + G-10 --
  const fences = [...sessionsBlock.matchAll(/```\n([\s\S]*?)```/g)].map((m) => m[1]);
  // The launch prompts are the fences that look like a prompt (contain "Law:"),
  // not the bare table/skeleton fences.
  const prompts = fences.filter((f) => /Law:/.test(f));
  if (prompts.length < 2) {
    problems.push(`expected ≥2 launch prompts in SESSIONS.md (one per session), found ${prompts.length}`);
  }
  const required = [
    ["package path", /package path/i],
    ["law", /^Law:/m],
    ["lane", /^Lane:/m],
    ["branch pattern", /^Branch pattern:/m],
    ["DoD", /^DoD:/m],
    ["register-handshake", /Register handshake:/],
    ["gotcha", /Gotcha:/i],
  ];
  prompts.forEach((prompt, i) => {
    for (const [what, re] of required) {
      if (!re.test(prompt)) problems.push(`launch prompt #${i + 1} in SESSIONS.md missing ${what}`);
    }
    if (!/every session works in its own git worktree, never the shared\s*\n?\s*checkout \(G-10\)/.test(prompt)) {
      problems.push(`launch prompt #${i + 1} in SESSIONS.md missing the verbatim worktrees-only line (G-10)`);
    }
  });

  // -- G-11: no "wait for" a notification anywhere in SESSIONS.md -----------
  const waitForHits = [...sessionsBlock.matchAll(/wait for/gi)];
  if (waitForHits.length > 0) {
    problems.push(`templates.md's SESSIONS.md skeleton contains "wait for" ${waitForHits.length} time(s) (G-11 requires "poll", never "wait for")`);
  }
}

// -- G-11, repo-wide: no actual SESSIONS.md file anywhere says "wait for" --
for (const path of findSessionsFiles(ROOT)) {
  const hits = [...readFileSync(path, "utf8").matchAll(/wait for/gi)];
  if (hits.length > 0) problems.push(`${path.replace(ROOT + "/", "")} contains "wait for" ${hits.length} time(s) (G-11)`);
}

// -- KICKOFF.md still carries exactly 1 launch prompt ------------------------
const kickoffBlock = extractBlock("KICKOFF.md");
if (!kickoffBlock) {
  problems.push("KICKOFF.md skeleton not found in references/templates.md");
} else {
  const kickoffFences = [...kickoffBlock.matchAll(/```\n[\s\S]*?```/g)];
  if (kickoffFences.length !== 1) {
    problems.push(`KICKOFF.md skeleton must carry exactly 1 launch-prompt block, found ${kickoffFences.length}`);
  }
  if (!/SESSIONS\.md/.test(kickoffBlock)) {
    problems.push('KICKOFF.md skeleton missing its new reading-order line pointing at "SESSIONS.md"');
  }
}

if (problems.length > 0) {
  console.error(`FAIL — sessions-prompts (${problems.length}):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log("PASS — SESSIONS.md launch prompts carry all 7 elements + the worktrees-only line, 0 \"wait for\" hits, and KICKOFF.md still carries exactly 1 launch prompt.");
process.exit(0);
