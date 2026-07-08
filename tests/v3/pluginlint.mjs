#!/usr/bin/env node
// tests/v3/pluginlint.mjs — combined harness for T-C2-01..04 (EC-D7 pluginlint).
// Each violating fixture must FAIL with the right named reason; the real
// plugins/plan-it tree is the passing control. Exit 0 = all expectations hold.
import { spawnSync } from "node:child_process";

const GATE = "scripts/gate-check.mjs";
let bad = 0;
function check(label, args, wantFail, mustMatch) {
  const r = spawnSync("node", [GATE, "pluginlint", ...args], { encoding: "utf8" });
  const out = r.stdout + r.stderr;
  const failed = r.status !== 0;
  const matched = mustMatch ? mustMatch.test(out) : true;
  if (failed === wantFail && matched) {
    console.log(`  ok  ${label}`);
  } else {
    bad++;
    console.error(`  BAD ${label} — exit=${r.status}, wantFail=${wantFail}, matched=${matched}\n${out}`);
  }
}
check("T-C2-01 unquoted colon in frontmatter -> FAIL naming the line",
  ["tests/fixtures/v3/pluginlint-bad-colon"], true, /plain scalar containing a colon.*Offending line/s);
check("T-C2-02 plugin.json missing version -> FAIL",
  ["tests/fixtures/v3/pluginlint-bad-plugin-json"], true, /missing required field "version"/);
check("T-C2-02 control: real plugins/plan-it -> PASS",
  ["plugins/plan-it"], false, /PASS/);
check("T-C2-03 marketplace source path missing on disk -> FAIL",
  ["tests/fixtures/v3/pluginlint-bad-source"], true, /source "\.\/plugins\/demo" does not exist/);
check("T-C2-04 skill name != directory name -> FAIL",
  ["tests/fixtures/v3/pluginlint-name-mismatch"], true, /name "foo" ≠ directory name "bar"/);
if (bad) { console.error(`${bad} pluginlint expectation(s) violated`); process.exit(1); }
console.log("PLUGINLINT OK — 4 violating classes fail-closed, real plugin tree passes");
