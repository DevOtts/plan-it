#!/usr/bin/env node
/**
 * Hand-stamp helper (CONTRACT §4.3) — used by SQ-B to build the mirror
 * fixtures before SQ-A's renderer exists / regardless of it (V4B4 is
 * independent of SQ-A, PRD prd-b-core.md §7). Computes SHA-256 over raw
 * bytes exactly the way `gate-check mirror` recomputes them — never
 * trusted, always re-derived from disk.
 *
 * Usage: node _stamp.mjs <md> [--embed <relpath>] [--brand default|repo:<relpath>]
 * Prints the three `<meta>` lines to stdout (paste into the twin's <head>).
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const args = process.argv.slice(2);
const mdPath = args[0];
if (!mdPath) {
  console.error("usage: node _stamp.mjs <md> [--twin-dir <dir>] [--embed <relpath>]... [--brand default|repo:<relpath>]");
  process.exit(1);
}
let twinDir = dirname(resolve(mdPath));
const embeds = [];
let brand = null;
for (let i = 1; i < args.length; i++) {
  if (args[i] === "--twin-dir") twinDir = resolve(args[++i]);
  else if (args[i] === "--embed") embeds.push(args[++i]);
  else if (args[i] === "--brand") brand = args[++i];
}

const mdRel = relative(twinDir, resolve(mdPath));
console.log(`<meta name="planit-source" content="${mdRel} sha256=${sha256(mdPath)}">`);
if (embeds.length > 0) {
  const pairs = embeds.map((e) => {
    const abs = resolve(twinDir, e);
    return `${e} sha256=${sha256(abs)}`;
  });
  console.log(`<meta name="planit-embeds" content="${pairs.join("; ")}">`);
}
if (brand) {
  let brandAbs;
  if (brand === "default") {
    brandAbs = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "plugins/plan-it/skills/plan-it/assets/brand/default.brand.json");
  } else {
    brandAbs = resolve(twinDir, brand.replace(/^repo:/, ""));
  }
  console.log(`<meta name="planit-brand" content="${brand} sha256=${sha256(brandAbs)}">`);
}
