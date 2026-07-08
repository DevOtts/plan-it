#!/usr/bin/env node
/**
 * C-W6-03 / T-C4-02 — marketplace.json claim text matches reality.
 *
 * G2 decision #1 (delivery/decisions.md 2026-07-07: "Squad C F2 resolution
 * CONFIRMED: claim-softened") resolved the aggregator question by SOFTENING
 * the claim rather than building an aggregator repo — no aggregator exists
 * among DevOtts' repos, and fable-it's own marketplace self-registers only
 * fable-it. This case guards that resolution: the live
 * `.claude-plugin/marketplace.json` must NOT assert it is "also published in
 * the wider DevOtts marketplace" (or any equivalent aggregator claim), and the
 * detector that enforces this must actually catch such a claim when present.
 *
 * The detector is `hasAggregatorClaim(text)` — a false claim is any mention of
 * being published/listed/available in a broader/wider/DevOtts *marketplace*
 * (aggregator), as opposed to this direct-discovery repo. It is exercised
 * against BOTH sides:
 *   - VIOLATING fixture (a description carrying the aggregator claim) → must
 *     be detected;
 *   - the LIVE marketplace.json (claim softened) → must be clean.
 *
 * EXIT-CODE CONVENTION (C-META-01 sweep, tests/v3/fail-closed-sweep.mjs):
 * this script is registered in delivery/v3/CONTRACT.md's "## Cases" table,
 * whose run: cells must exit NON-ZERO when enforcement holds. Therefore:
 * exit 1 = enforcement demonstrated (detector catches the violating claim AND
 * the live file is clean); exit 0 = HOLE (detector missed the violating claim,
 * or the live marketplace.json still carries the un-softened aggregator claim).
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MARKETPLACE = join(ROOT, ".claude-plugin", "marketplace.json");

/**
 * True when `text` claims plan-it is published/listed/available in a
 * broader/wider/DevOtts *marketplace* (an aggregator) — the FALSE claim G2
 * decision #1 softened. Deliberately narrow: "direct-discovery marketplace for
 * the plan-it plugin" (this repo describing itself) must NOT trip it; only a
 * claim of external aggregator publication does.
 */
export function hasAggregatorClaim(text) {
  const t = String(text).toLowerCase();
  // A publication/availability verb near a broader-marketplace noun phrase.
  const verb = /(also\s+)?(published|listed|available|distributed|included|registered)/;
  const aggregator = /(wider|broader|central|umbrella|aggregat\w*|devotts)\s+marketplace/;
  // Only flag when a publication claim and an aggregator noun co-occur in the
  // same statement (same line / clause), not merely anywhere in the file.
  return t
    .split(/[\n;.]/)
    .some((clause) => verb.test(clause) && aggregator.test(clause));
}

const problems = [];
function check(name, fn) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (e) {
    problems.push(`${name}: ${e.message}`);
    console.log(`  HOLE  ${name}: ${e.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// --- VIOLATING side: the detector must catch an aggregator claim. ----------
check("VIOLATING: description asserting wider-marketplace publication → detected", () => {
  const desc =
    "Direct-discovery marketplace for the plan-it plugin. Add this repo to " +
    "install the plugin by itself; it is also published in the wider DevOtts marketplace.";
  assert(hasAggregatorClaim(desc), "detector missed the un-softened aggregator claim");
});

check("VIOLATING: 'listed in the DevOtts marketplace' phrasing → detected", () => {
  assert(hasAggregatorClaim("This plugin is listed in the DevOtts marketplace."), "detector missed a listed-in phrasing");
});

// --- COMPLIANT side: self-describing / softened text must NOT trip. --------
check("COMPLIANT: 'direct-discovery marketplace for the plan-it plugin' (self-description) → clean", () => {
  assert(!hasAggregatorClaim("Direct-discovery marketplace for the plan-it plugin. Add this repo to install the plugin by itself."), "false positive on self-description");
});

check("COMPLIANT: unrelated marketplace-schema mention → clean", () => {
  assert(!hasAggregatorClaim("Conforms to the claude-code-marketplace.json schema."), "false positive on a schema reference");
});

// --- LIVE FILE: the shipped marketplace.json must be clean. ----------------
check("LIVE: .claude-plugin/marketplace.json carries no aggregator claim (G2 decision #1 honored)", () => {
  const raw = readFileSync(MARKETPLACE, "utf8");
  const mk = JSON.parse(raw); // also proves the file is still valid JSON after the edit
  const strings = [mk.description ?? "", ...(mk.plugins ?? []).map((p) => p?.description ?? "")];
  for (const s of strings) {
    assert(!hasAggregatorClaim(s), `live marketplace.json still claims aggregator publication: "${s}"`);
  }
});

if (problems.length > 0) {
  console.error(`\nENFORCEMENT HOLE — ${problems.length} assertion(s) failed; exiting 0 so the C-META-01 sweep flags this row:`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(0); // hole → exit 0 → sweep/run-contract flag C-W6-03
}
console.log("\nENFORCEMENT OK — the aggregator-claim detector catches un-softened claims, and the live marketplace.json is clean (claim softened per G2 decision #1).");
console.log("Exiting 1 per the C-META-01 sweep convention (CONTRACT run: cells exit non-zero when enforcement holds).");
process.exit(1);
