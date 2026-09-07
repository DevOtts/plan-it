#!/usr/bin/env node
/**
 * T-V4B3-11 — `runs --dir portfolio/` lists exactly two rows (alpha done,
 * beta discovery) with a computed "2 run(s) (0 archived)" line; `--json`
 * parses and its rows round-trip to the same slugs/states (adversarial-
 * verify: re-read, not trusted); an empty dir exits 0 with "no plan-it runs".
 * T-V4B3-12 — `runs --dir portfolio-broken/`: exit 1, the good run still
 * listed, the broken file named with ERROR (partial failure, named);
 * `portfolio-archived/` lists the archived run with `archived: yes` and
 * counts `1 archived`.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GATECHECK = join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs");
const PORTFOLIO = join(ROOT, "tests/fixtures/v4/portfolio");
const PORTFOLIO_BROKEN = join(ROOT, "tests/fixtures/v4/portfolio-broken");
const PORTFOLIO_ARCHIVED = join(ROOT, "tests/fixtures/v4/portfolio-archived");

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

// T-V4B3-11
{
  const table = run(["runs", "--dir", PORTFOLIO]);
  assert(table.code === 0, `expected exit 0, got ${table.code}:\n${table.out}`);
  assert(/\balpha\b.*\bdone\b/.test(table.out), `expected alpha … done in the table:\n${table.out}`);
  assert(/\bbeta\b.*\bdiscovery\b/.test(table.out), `expected beta … discovery in the table:\n${table.out}`);
  assert(table.out.includes("2 run(s) (0 archived)"), `expected the computed count line:\n${table.out}`);

  const jsonMode = run(["runs", "--dir", PORTFOLIO, "--json"]);
  assert(jsonMode.code === 0, `expected exit 0 for --json, got ${jsonMode.code}:\n${jsonMode.out}`);
  const parsed = JSON.parse(jsonMode.out);
  const slugs = parsed.runs.map((r) => r.slug).sort();
  assert(JSON.stringify(slugs) === JSON.stringify(["alpha", "beta"]), `expected slugs [alpha, beta], got ${JSON.stringify(slugs)}`);
  const states = Object.fromEntries(parsed.runs.map((r) => [r.slug, r.state]));
  assert(states.alpha === "done" && states.beta === "discovery", `expected alpha=done, beta=discovery, got ${JSON.stringify(states)}`);

  const emptyDir = mkdtempSync(join(tmpdir(), "planit-runs-empty-"));
  const empty = run(["runs", "--dir", emptyDir]);
  assert(empty.code === 0, `expected exit 0 for an empty dir, got ${empty.code}:\n${empty.out}`);
  assert(/no plan-it runs under/.test(empty.out), `expected "no plan-it runs under" message:\n${empty.out}`);
  rmSync(emptyDir, { recursive: true, force: true });
}

// T-V4B3-12
{
  const broken = run(["runs", "--dir", PORTFOLIO_BROKEN]);
  assert(broken.code !== 0, `expected non-zero exit for portfolio-broken/, got 0:\n${broken.out}`);
  assert(/\bgood\b.*\bdiscovery\b/.test(broken.out), `expected the good run still listed:\n${broken.out}`);
  assert(/ERROR .*broken\.state\.json/.test(broken.out), `expected the broken file named with ERROR:\n${broken.out}`);

  const archived = run(["runs", "--dir", PORTFOLIO_ARCHIVED]);
  assert(archived.code === 0, `expected exit 0 for portfolio-archived/, got ${archived.code}:\n${archived.out}`);
  assert(/\byes\b/.test(archived.out), `expected an "archived: yes" row:\n${archived.out}`);
  assert(archived.out.includes("1 archived"), `expected the computed "1 archived" count:\n${archived.out}`);
}

if (failed) {
  console.error("FAIL — runs-list.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — runs-list.mjs: T-V4B3-11, 12 pass");
process.exit(0);
