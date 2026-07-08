#!/usr/bin/env node
/**
 * T-C4-03 — CHANGELOG shape ([REAL] release gate, PRD §D9 / F3).
 *
 * Asserts CHANGELOG.md has a dated `## 3.0.0 — YYYY-MM-DD` section that
 * enumerates FD-1, FD-2, and each shipped backlog item by ID. "Shipped" is the
 * enforcement set the three epics actually delivered (v3-architecture.md §4
 * map): the FD mandates (FD-1/M1, FD-2/M2) and the six write-time invariant
 * families W1..W6. The section must be the top (most recent) entry.
 *
 * This is a [REAL] case against the live CHANGELOG — NOT a fail-closed sweep
 * row. NORMAL exit semantics per AMD-3: exit 0 = the section is present and
 * enumerates every required ID; exit 1 = missing/undated section or a missing
 * required ID.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const text = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
const lines = text.split("\n");

// The 3.0.0 section: from its dated heading to the next "## " heading.
const headIdx = lines.findIndex((l) => /^##\s+3\.0\.0\b/.test(l));
const problems = [];

if (headIdx === -1) {
  problems.push("no '## 3.0.0' section heading found");
} else {
  if (!/^##\s+3\.0\.0\s+—\s+\d{4}-\d{2}-\d{2}\s*$/.test(lines[headIdx])) {
    problems.push(`3.0.0 heading is not dated 'YYYY-MM-DD': "${lines[headIdx]}"`);
  }
  // Must be the top (most recent) versioned entry.
  const firstVersionHeading = lines.findIndex((l) => /^##\s+\d+\.\d+\.\d+\b/.test(l));
  if (firstVersionHeading !== headIdx) {
    problems.push("3.0.0 is not the top (most recent) versioned entry");
  }
  const end = lines.findIndex((l, i) => i > headIdx && /^##\s/.test(l));
  const section = lines.slice(headIdx, end === -1 ? undefined : end).join("\n");

  const required = ["FD-1", "FD-2", "M1", "M2", "W1", "W2", "W3", "W4", "W5", "W6"];
  for (const id of required) {
    // word-boundary match so "W1" doesn't match "W12" etc.
    const re = new RegExp(`\\b${id.replace(/[-]/g, "\\-")}\\b`);
    if (!re.test(section)) problems.push(`3.0.0 section does not enumerate "${id}"`);
  }
}

if (problems.length > 0) {
  console.error(`FAIL — CHANGELOG 3.0.0 section shape (${problems.length}):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log("PASS — CHANGELOG.md has a dated 3.0.0 top section enumerating FD-1, FD-2, and shipped IDs (M1/M2, W1..W6).");
process.exit(0);
