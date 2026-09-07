#!/usr/bin/env node
/**
 * T-V4B3-16 — `parseAllContractCases()` returns the v3 rows plus every
 * `C-E\d+-\d{2}` row of `delivery/v4/CONTRACT.md`, tagged
 * `source: delivery/v4/CONTRACT.md`; the count equals the number of
 * `| C-E` rows in that file (computed); `parseContractCases()` still
 * returns only v3 rows; `refPaths("node tests/v4/core/x.mjs")` yields the
 * path; `node tests/run-contract.mjs`'s output contains a "-- v4" section
 * header with computed totals.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseContractCases, parseAllContractCases, refPaths } from "../../v3/lib/contract-cases.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const V4_CONTRACT = join(ROOT, "delivery/v4/CONTRACT.md");
const V3_CONTRACT = join(ROOT, "delivery/v3/CONTRACT.md");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}

const all = parseAllContractCases();
const v4Rows = all.filter((r) => r.source === V4_CONTRACT);
const v3RowsFromAll = all.filter((r) => r.source === V3_CONTRACT);

const v4Text = readFileSync(V4_CONTRACT, "utf8");
const casesStart = v4Text.indexOf("\n## Cases");
const block = casesStart === -1 ? "" : v4Text.slice(casesStart);
const declaredCERows = (block.match(/^\|\s*C-E\d+-\d{2}\s*\|/gm) || []).length;

assert(v4Rows.length === declaredCERows, `expected ${declaredCERows} v4 rows (computed from | C-E rows), got ${v4Rows.length}`);
assert(v4Rows.every((r) => /^C-E\d+-\d{2}$/.test(r.id)), `expected every v4 row id to match C-E\\d+-\\d{2}, saw: ${v4Rows.map((r) => r.id).join(", ")}`);
assert(v4Rows.every((r) => r.source === V4_CONTRACT), "expected every v4 row tagged source: delivery/v4/CONTRACT.md");

const v3Only = parseContractCases();
assert(v3Only.length === v3RowsFromAll.length, `expected parseContractCases() to return only the v3 rows (${v3RowsFromAll.length}), got ${v3Only.length}`);
assert(!v3Only.some((r) => /^C-E\d+-\d{2}$/.test(r.id)), "expected parseContractCases() default to carry NO C-E* (v4) rows");

const paths = refPaths("node tests/v4/core/x.mjs");
assert(paths.includes("tests/v4/core/x.mjs"), `expected refPaths to find the tests/v4/ path literal, got: ${JSON.stringify(paths)}`);

let rcOut;
try {
  rcOut = execFileSync("node", [join(ROOT, "tests/run-contract.mjs")], { encoding: "utf8" });
} catch (e) {
  // run-contract.mjs may exit non-zero for unrelated reasons (e.g. the
  // pre-W2 C-E11-01 version-skew gap) — this case only cares about its
  // stdout shape.
  rcOut = e.stdout ?? "";
}
assert(/-- v4 \(from delivery\/v4\/CONTRACT\.md's Cases table\) --/.test(rcOut), `expected a "-- v4" section header in run-contract.mjs output`);
assert(/\d+\/\d+ mechanism-ready cases correct/.test(rcOut), `expected a computed v4 totals line in run-contract.mjs output`);

if (failed) {
  console.error("FAIL — contract-cases-v4.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — contract-cases-v4.mjs: T-V4B3-16 passes");
process.exit(0);
