#!/usr/bin/env node
/**
 * T-C4-03 — CHANGELOG shape ([REAL] release gate, PRD §D9 / F3).
 *
 * Asserts CHANGELOG.md's TOP (most recent) versioned section is dated
 * `## N.N.N — YYYY-MM-DD` and enumerates each shipped item by ID. The required
 * ID set tracks the current release: v3.2.0's adversarial-depth wave shipped the
 * D4 crown-jewel lever and its checks D-A1/D-A2/D-B1/D-B2/D-B3.
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

// The top versioned section: from the first "## N.N.N" heading to the next "## ".
const headIdx = lines.findIndex((l) => /^##\s+\d+\.\d+\.\d+\b/.test(l));
const problems = [];

if (headIdx === -1) {
  problems.push("no '## N.N.N' version section heading found");
} else {
  const head = lines[headIdx];
  const ver = (head.match(/^##\s+(\d+\.\d+\.\d+)\b/) ?? [])[1];
  if (!/^##\s+\d+\.\d+\.\d+\s+—\s+\d{4}-\d{2}-\d{2}\s*$/.test(head)) {
    problems.push(`top version heading is not dated 'YYYY-MM-DD': "${head}"`);
  }
  const end = lines.findIndex((l, i) => i > headIdx && /^##\s/.test(l));
  const section = lines.slice(headIdx, end === -1 ? undefined : end).join("\n");

  // Required ID set for the current (3.2.0) release. When cutting a later
  // release, move these to that release's shipped IDs (same pattern as the
  // version literal in version-triple-match.mjs).
  const required = ["D4", "D-A1", "D-A2", "D-B1", "D-B2", "D-B3"];
  for (const id of required) {
    // Escape regex metachars (the W3.1-x IDs contain '.' and '-').
    const re = new RegExp(`\\b${id.replace(/[.\-]/g, "\\$&")}\\b`);
    if (!re.test(section)) problems.push(`${ver} section does not enumerate "${id}"`);
  }
}

if (problems.length > 0) {
  console.error(`FAIL — CHANGELOG top section shape (${problems.length}):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log("PASS — CHANGELOG.md has a dated top section enumerating the current release's shipped IDs (D4, D-A1/D-A2, D-B1/D-B2/D-B3).");
process.exit(0);
