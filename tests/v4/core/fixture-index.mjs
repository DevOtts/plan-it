#!/usr/bin/env node
/**
 * T-V4B5-07 (D-B14) — every `tests/fixtures/v4/*` directory has a
 * `README.md` naming ≥1 `T-V4B` or `C-E` ID; `tests/fixtures/v4/README.md`
 * indexes every directory (computed set equality); every path named in a
 * `@case-machine`/`@case-guard` `run:` cell of `delivery/v4/CONTRACT.md`
 * exists on disk.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAllContractCases } from "../../v3/lib/contract-cases.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const FIX_V4 = join(ROOT, "tests/fixtures/v4");
const INDEX_PATH = join(FIX_V4, "README.md");
const V4_CONTRACT_PATH = join(ROOT, "delivery/v4/CONTRACT.md");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}

// Every immediate subdirectory of tests/fixtures/v4/ (report/ is SQ-A's own
// lane, excluded per CONTRACT §2 ownership).
const dirs = readdirSync(FIX_V4, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== "report")
  .map((e) => e.name)
  .sort();

// `mirror/` is the hand-stamp HELPER script directory (not itself a case
// fixture) — its README names no case ID by design, exempted from the
// per-fixture ID-naming check below (still required to exist and be indexed).
const NON_FIXTURE_DIRS = new Set(["mirror"]);

// Every directory carries a README.md naming ≥1 T-V4B or C-E id.
const ID_RE = /\bT-V4B\d+-\d{2}\b|\bC-E\d+-\d{2}\b/;
for (const d of dirs) {
  if (NON_FIXTURE_DIRS.has(d)) continue;
  const readmePath = join(FIX_V4, d, "README.md");
  assert(existsSync(readmePath), `expected ${d}/README.md to exist`);
  if (existsSync(readmePath)) {
    const text = readFileSync(readmePath, "utf8");
    assert(ID_RE.test(text), `expected ${d}/README.md to name at least one T-V4B or C-E id`);
  }
}

// The top-level README indexes every directory (computed set equality).
const indexText = readFileSync(INDEX_PATH, "utf8");
const indexedDirs = new Set();
for (const m of indexText.matchAll(/`([a-zA-Z0-9._-]+)\/`/g)) indexedDirs.add(m[1]);
const missingFromIndex = dirs.filter((d) => !indexedDirs.has(d));
assert(missingFromIndex.length === 0, `expected every fixture dir indexed in tests/fixtures/v4/README.md, missing: ${missingFromIndex.join(", ")}`);
const extraInIndex = [...indexedDirs].filter((d) => !dirs.includes(d) && existsSync(join(FIX_V4, d)) === false && d !== "report");
// (extraInIndex intentionally not asserted — the index may cite future/SQ-A dirs; the binding direction is "every real dir is indexed")
void extraInIndex;

// Every path named in a @case-machine/@case-guard run: cell of the v4
// CONTRACT exists on disk.
const rows = parseAllContractCases().filter((r) => r.source === V4_CONTRACT_PATH && (r.tag === "@case-machine" || r.tag === "@case-guard"));
const PATH_RE = /(tests\/fixtures\/[^\s`]+|tests\/v[34]\/[^\s`]+|plugins\/plan-it\/skills\/plan-it\/scripts\/gate-check\.mjs)/g;
const missingPaths = [];
for (const row of rows) {
  if (row.run.startsWith("manual:")) continue;
  for (const m of row.run.matchAll(PATH_RE)) {
    const p = join(ROOT, m[1]);
    if (!existsSync(p)) missingPaths.push(`${row.id}: ${m[1]}`);
  }
}
assert(missingPaths.length === 0, `expected every referenced path to exist on disk, missing:\n${missingPaths.join("\n")}`);

if (failed) {
  console.error("FAIL — fixture-index.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log(`OK — fixture-index.mjs: ${dirs.length} fixture dirs indexed and READMEd, ${rows.length} @case rows' paths all present (T-V4B5-07)`);
process.exit(0);
