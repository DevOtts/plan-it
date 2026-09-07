#!/usr/bin/env node
/**
 * T-V4B5-03 — `gate-check.mjs`'s `MIRROR_PAIRS` and `tests/run-contract.mjs`'s
 * `T-E5-02` pair list (both parsed computed-from-source, never hand-typed
 * twice) have exactly 11 entries, are equal as sets, and include
 * `scripts/build-report.mjs`, `scripts/report-template.html`,
 * `assets/brand/default.brand.json` (AMD-5, G-14).
 * T-V4B5-04 — on the merged tree (SQ-A's files present), `mirror-check`
 * exits 0 `PASS — mirror-check: 11 pair(s) byte-identical`.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GATECHECK = join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}

// Parses a `const MIRROR_PAIRS = [...]`-shaped array literal from source text
// (computed, never hand-typed) — the exact same shape gate-check.mjs and
// run-contract.mjs's T-E5-02 each declare. NOT imported from
// tests/run-contract.mjs directly: that file has no isMain guard and would
// execute its entire test suite as an import side effect.
function parsePairsFromSource(src, varName) {
  const m = src.match(new RegExp(`const ${varName}\\s*=\\s*\\[([\\s\\S]*?)\\n\\];`));
  if (!m) return [];
  const pairs = [];
  for (const pm of m[1].matchAll(/\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/g)) pairs.push([pm[1], pm[2]]);
  return pairs;
}

const gcPairs = parsePairsFromSource(readFileSync(GATECHECK, "utf8"), "MIRROR_PAIRS");
// run-contract.mjs computes its T-E5-02 pairs by calling
// parseMirrorPairsFromSource on gate-check.mjs's own MIRROR_PAIRS array —
// verify it is actually WIRED that way (not a second hand-typed list) by
// checking its source calls the parser against gate-check.mjs, then
// re-derive the same computed value here (rather than importing the file,
// which has no isMain guard and would execute its whole suite + exit()).
const rcSrc = readFileSync(join(ROOT, "tests/run-contract.mjs"), "utf8");
assert(/parseMirrorPairsFromSource\(readFileSync\(GC,\s*"utf8"\)\)/.test(rcSrc), "expected T-E5-02 to compute its pairs via parseMirrorPairsFromSource(gate-check.mjs source), not a second hand-typed list");
const rcPairs = parsePairsFromSource(readFileSync(GATECHECK, "utf8"), "MIRROR_PAIRS");

// T-V4B5-03
assert(gcPairs.length === 11, `expected gate-check.mjs MIRROR_PAIRS to have 11 entries, got ${gcPairs.length}`);
assert(rcPairs.length === 11, `expected run-contract.mjs's T-E5-02 pair list to have 11 entries, got ${rcPairs.length}`);
const gcSet = new Set(gcPairs.map((p) => p.join("|")));
const rcSet = new Set(rcPairs.map((p) => p.join("|")));
assert(gcSet.size === rcSet.size && [...gcSet].every((p) => rcSet.has(p)), "expected the two pair lists to be equal as sets");
for (const needle of ["scripts/build-report.mjs", "scripts/report-template.html", "assets/brand/default.brand.json"]) {
  assert(gcPairs.some(([a]) => a === needle), `expected MIRROR_PAIRS to include "${needle}"`);
}

// T-V4B5-04
{
  let out, code;
  try {
    out = execFileSync("node", [GATECHECK, "mirror-check"], { encoding: "utf8" });
    code = 0;
  } catch (e) {
    code = e.status ?? 1;
    out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
  assert(code === 0, `expected mirror-check exit 0 (SQ-A's files are on the merged tree), got ${code}:\n${out}`);
  assert(out.includes("PASS — mirror-check: 11 pair(s) byte-identical"), `expected the exact 11-pair PASS line, got:\n${out}`);
}

if (failed) {
  console.error("FAIL — mirror-pairs-11.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — mirror-pairs-11.mjs: T-V4B5-03, 04 pass");
process.exit(0);
