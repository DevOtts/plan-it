#!/usr/bin/env node
/**
 * T-V4B4-15 — `envfacts-tool-only/` (ENV-FACTS row `node scripts/check-gh.mjs`
 * ABSENT, `tool: gh`; CONTRACT cases `node …` and `gh …`): `contract --dir`
 * does NOT flag the `node …` case, DOES flag the `gh …` case naming "gh"
 * and C-E6-03; the same file without a `tool` column blacklists only
 * `node` (argv[0]) — never `scripts/check-gh.mjs`.
 * T-V4B4-16 — regression: the v3 preflight fixtures still exit 0 as at
 * 3.0.1, and the emitted ENV-FACTS.md carries the 5th `tool` column with
 * the probe count unchanged (6 / 9).
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GATECHECK = join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}
function run(args) {
  try {
    return { code: 0, out: execFileSync("node", [GATECHECK, ...args], { encoding: "utf8" }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

// T-V4B4-15
{
  const withTool = run(["contract", "--dir", join(ROOT, "tests/fixtures/v4/envfacts-tool-only")]);
  assert(withTool.code !== 0, `expected non-zero exit, got 0:\n${withTool.out}`);
  assert(!withTool.out.includes("C-F1-01"), `expected the node-based case NOT flagged:\n${withTool.out}`);
  assert(withTool.out.includes("C-F1-02") && withTool.out.includes('"gh"') && withTool.out.includes("C-E6-03"), `expected the gh-based case flagged naming "gh" and C-E6-03:\n${withTool.out}`);

  const noColumn = run(["contract", "--dir", join(ROOT, "tests/fixtures/v4/envfacts-tool-only-no-column")]);
  assert(noColumn.code !== 0, `expected non-zero exit, got 0:\n${noColumn.out}`);
  assert(noColumn.out.includes("C-F2-01") && noColumn.out.includes('"node"'), `expected the node case flagged (argv[0] blacklisted), got:\n${noColumn.out}`);
  assert(!noColumn.out.includes("C-F2-02"), `expected "scripts/check-gh.mjs" itself to NEVER be blacklisted:\n${noColumn.out}`);
}

// T-V4B4-16 — regression: the v3 preflight fixtures still exit 0 as at 3.0.1.
{
  let out;
  try {
    out = execFileSync("node", [join(ROOT, "tests/v3/preflight-tiering.mjs")], { encoding: "utf8" });
  } catch (e) {
    out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
  assert(/^OK —/m.test(out), `expected tests/v3/preflight-tiering.mjs to report OK (3.0.1 behaviour unchanged):\n${out}`);
}
{
  let out;
  try {
    out = execFileSync("node", [join(ROOT, "tests/v3/probe-timeout.mjs")], { encoding: "utf8" });
  } catch (e) {
    out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
  assert(/^OK —/m.test(out), `expected tests/v3/probe-timeout.mjs to report OK (3.0.1 behaviour unchanged):\n${out}`);
}
// The emitted ENV-FACTS.md header now carries the 5th "tool" column.
{
  const probesDir = mkdtempSync(join(tmpdir(), "planit-envfacts-shape-"));
  const probes = {
    probes: [
      "config-reachability",
      "live-registry",
      "deployed-vs-installed",
      "credential-validity",
      "dependency-actual-usage",
      "code-vs-external-split",
    ].map((id) => ({ id, check: ["node", "-e", "process.exit(0)"] })),
  };
  const { writeFileSync } = await import("node:fs");
  writeFileSync(join(probesDir, "ENV-PROBES.json"), JSON.stringify(probes));
  run(["preflight", "S", "--dir", probesDir]);
  const facts = readFileSync(join(probesDir, "ENV-FACTS.md"), "utf8");
  assert(/\|\s*id\s*\|\s*check\s*\|\s*status\s*\|\s*evidence\s*\|\s*tool\s*\|/.test(facts), `expected the 5-column header (…|tool|) in the emitted ENV-FACTS.md:\n${facts}`);
  assert((facts.match(/^\|\s*config-reachability/gm) ?? []).length === 1, `expected the 6-probe S-shape count unchanged`);
  rmSync(probesDir, { recursive: true, force: true });
}

if (failed) {
  console.error("FAIL — envfacts-tool-only.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — envfacts-tool-only.mjs: T-V4B4-15, 16 pass");
process.exit(0);
