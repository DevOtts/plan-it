#!/usr/bin/env node
/**
 * Regression — epic case IDs may carry a 1-3 letter prefix (`T-DS1-01`), not
 * only one letter (`T-A4-01`). The six case-ID patterns in gate-check.mjs were
 * `T-[A-Z]\d+`, so a 2-letter epic prefix was silently rejected (the Verify
 * linter ignored its rows). Exercised through the exported lintVerifyColumn.
 *
 * Positive harness script: exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { lintVerifyColumn } from "../../../plugins/plan-it/skills/plan-it/scripts/gate-check.mjs";

const table = (id) => [
  "| Case | Verify |",
  "|---|---|",
  `| ${id} | BOGUS |`,
].join("\n");

let failed = false;
const check = (label, id, expectErr) => {
  const errs = lintVerifyColumn(table(id));
  const hit = errs.some((e) => e.startsWith(`${id}:`));
  if (hit !== expectErr) {
    console.error(`FAIL — ${label}: ${id} ${expectErr ? "should be linted" : "should be ignored"}, got ${JSON.stringify(errs)}`);
    failed = true;
  }
};

check("one-letter prefix", "T-A4-01", true);
check("two-letter prefix (DS)", "T-DS1-01", true);
check("three-letter prefix", "T-ABC2-03", true);
check("non-case row is ignored", "C-W1-04", false);

if (failed) { process.exit(1); }
console.log("OK — case-id-two-letter-prefix.mjs: 1-3 letter epic prefixes are linted");
