#!/usr/bin/env node
/**
 * T-C4-01 — version triple-match ([REAL] release gate, PRD §D9 / F1).
 *
 * Asserts the shipped version agrees across every place it is declared:
 *   plugin.json  ==  SKILL.md frontmatter  ==  CHANGELOG.md top entry
 * and that the marketplace.json plugins[] version keeps parity, and that
 * machine.json's version field is reconciled to the same value (v3 chose to
 * bump-to-track rather than take an `--audit` waiver — decisions.md 2026-07-08).
 * SKILL.md and machine.json are mirrored, so both root and plugin copies are
 * checked and must agree with each other too.
 *
 * This is a [REAL] case against the live post-bump tree — NOT a fail-closed
 * sweep row. NORMAL exit semantics per AMD-3: exit 0 = every declared version
 * matches (and equals the expected 3.0.1); exit 1 = a mismatch/skew exists.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const EXPECTED = "3.0.1";
const r = (p) => readFileSync(join(ROOT, p), "utf8");

function pluginJsonVersion(p) {
  return JSON.parse(r(p)).version ?? null;
}
function marketplacePluginVersion(p) {
  const mk = JSON.parse(r(p));
  return mk.plugins?.[0]?.version ?? null;
}
function skillFrontmatterVersion(p) {
  // frontmatter is the first --- ... --- block; version: is a top-level key.
  const text = r(p);
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  const scope = fm ? fm[1] : text;
  const m = scope.match(/^version:\s*(\S+)\s*$/m);
  return m ? m[1] : null;
}
function changelogTopVersion(p) {
  // First "## X.Y.Z" heading in the file, with a required ISO ship date.
  for (const line of r(p).split("\n")) {
    const m = line.match(/^##\s+(\d+\.\d+\.\d+)\s+—\s+(\d{4}-\d{2}-\d{2})\s*$/);
    if (m) return { version: m[1], date: m[2] };
  }
  return null;
}

const sources = {
  "plugin.json": pluginJsonVersion("plugins/plan-it/.claude-plugin/plugin.json"),
  "marketplace.json plugins[0]": marketplacePluginVersion(".claude-plugin/marketplace.json"),
  "SKILL.md (root)": skillFrontmatterVersion("SKILL.md"),
  "SKILL.md (mirror)": skillFrontmatterVersion("plugins/plan-it/skills/plan-it/SKILL.md"),
  "machine.json (root)": pluginJsonVersion("machine.json"),
  "machine.json (mirror)": pluginJsonVersion("plugins/plan-it/skills/plan-it/machine.json"),
};
const changelog = changelogTopVersion("CHANGELOG.md");

const problems = [];
console.log("version triple-match — declared versions on the live tree:");
for (const [name, v] of Object.entries(sources)) {
  const ok = v === EXPECTED;
  console.log(`  ${ok ? "ok " : "BAD"}  ${name}: ${v ?? "(unreadable)"}`);
  if (!ok) problems.push(`${name} = ${v ?? "(unreadable)"}, expected ${EXPECTED}`);
}
if (!changelog) {
  problems.push("CHANGELOG.md has no dated '## X.Y.Z — YYYY-MM-DD' top entry");
  console.log("  BAD  CHANGELOG.md top entry: (none / undated)");
} else {
  const ok = changelog.version === EXPECTED;
  console.log(`  ${ok ? "ok " : "BAD"}  CHANGELOG.md top entry: ${changelog.version} (${changelog.date})`);
  if (!ok) problems.push(`CHANGELOG.md top entry = ${changelog.version}, expected ${EXPECTED}`);
}

if (problems.length > 0) {
  console.error(`\nFAIL — version skew (${problems.length}):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`\nPASS — plugin.json = marketplace = SKILL.md (both mirrors) = machine.json (both mirrors) = CHANGELOG top = ${EXPECTED}`);
process.exit(0);
