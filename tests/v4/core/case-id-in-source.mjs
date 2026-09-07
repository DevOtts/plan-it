#!/usr/bin/env node
/**
 * T-V4B5-12 (D-B15, F-B17) — for every `@case-machine`/`@case-guard` row of
 * `delivery/v4/CONTRACT.md` whose `run:` invokes `gate-check.mjs`, that
 * row's ID appears somewhere in gate-check.mjs's own source — so
 * `mechanismGap` reports it ready, never PENDING, once the check exists.
 * The list of missing IDs is printed and must be empty.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAllContractCases } from "../../v3/lib/contract-cases.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GATECHECK_PATH = join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs");
const V4_CONTRACT_PATH = join(ROOT, "delivery/v4/CONTRACT.md");

const gcSrc = readFileSync(GATECHECK_PATH, "utf8");
const rows = parseAllContractCases().filter(
  (r) => r.source === V4_CONTRACT_PATH && (r.tag === "@case-machine" || r.tag === "@case-guard") && /gate-check\.mjs\s+\S+/.test(r.run)
);

const missing = rows.filter((r) => !gcSrc.includes(r.id));

if (missing.length > 0) {
  for (const r of missing) console.error(`missing: ${r.id} (run: ${r.run})`);
  console.error(`FAIL — case-id-in-source.mjs: ${missing.length} of ${rows.length} gate-check-invoking @case-machine/@case-guard rows have no source reference`);
  process.exit(1);
}
console.log(`OK — case-id-in-source.mjs: all ${rows.length} gate-check-invoking @case-machine/@case-guard rows are named in gate-check.mjs (T-V4B5-12)`);
process.exit(0);
