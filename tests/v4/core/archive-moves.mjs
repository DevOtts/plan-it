#!/usr/bin/env node
/**
 * T-V4B3-08 — `archive alpha --dir <tmp>` moves a `done` run to
 * `.plan-it/done/alpha.state.json` with `archive.archivedAt`/`from`, the
 * source is gone, every other key byte-equal.
 * T-V4B3-09 — `archive beta` on a `discovery` run (portfolio/, no --force):
 * ARCHIVE_REFUSED naming the state, file untouched.
 * T-V4B3-10 — `archive alpha` when `.plan-it/done/alpha.state.json` already
 * exists (portfolio-archived/): ARCHIVE_REFUSED naming "exists", neither
 * file changes; `archive beta --force`: usage error naming "no --force".
 *
 * Works on temp copies where the verb writes to disk.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, mkdtempSync, cpSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const GATECHECK = join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs");
const PORTFOLIO = join(ROOT, "tests/fixtures/v4/portfolio");
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
function copyFixture(src) {
  const dir = mkdtempSync(join(tmpdir(), "planit-archive-"));
  cpSync(src, dir, { recursive: true });
  return dir;
}

// T-V4B3-08
{
  const dir = copyFixture(PORTFOLIO);
  const before = JSON.parse(readFileSync(join(dir, ".plan-it", "alpha.state.json"), "utf8"));
  const r = run(["archive", "alpha", "--dir", dir]);
  assert(r.code === 0, `expected exit 0, got ${r.code}:\n${r.out}`);
  const destPath = join(dir, ".plan-it", "done", "alpha.state.json");
  assert(existsSync(destPath), `expected ${destPath} to exist`);
  assert(!existsSync(join(dir, ".plan-it", "alpha.state.json")), "expected the source to be gone");
  const after = JSON.parse(readFileSync(destPath, "utf8"));
  assert(typeof after.archive?.archivedAt === "string", "expected archive.archivedAt (ISO string)");
  assert(after.archive?.from === join(".plan-it", "alpha.state.json"), `expected archive.from ".plan-it/alpha.state.json", got "${after.archive?.from}"`);
  for (const k of Object.keys(before)) {
    assert(JSON.stringify(after[k]) === JSON.stringify(before[k]), `expected key "${k}" byte-equal after archiving`);
  }
  rmSync(dir, { recursive: true, force: true });
}

// T-V4B3-09
{
  const before = readFileSync(join(PORTFOLIO, ".plan-it", "beta.state.json"), "utf8");
  const r = run(["archive", "beta", "--dir", PORTFOLIO]);
  assert(r.code !== 0, `expected non-zero exit, got 0:\n${r.out}`);
  assert(r.out.includes("ARCHIVE_REFUSED"), `expected ARCHIVE_REFUSED:\n${r.out}`);
  assert(r.out.includes("discovery"), `expected the offending state "discovery" named:\n${r.out}`);
  const after = readFileSync(join(PORTFOLIO, ".plan-it", "beta.state.json"), "utf8");
  assert(after === before, "expected beta.state.json to be byte-identical after a refused archive");
}

// T-V4B3-10
{
  const r1 = run(["archive", "alpha", "--dir", PORTFOLIO_ARCHIVED]);
  assert(r1.code !== 0, `expected non-zero exit, got 0:\n${r1.out}`);
  assert(r1.out.includes("ARCHIVE_REFUSED") && r1.out.includes("exists"), `expected ARCHIVE_REFUSED naming "exists":\n${r1.out}`);

  const r2 = run(["archive", "beta", "--force", "--dir", PORTFOLIO]);
  assert(r2.code !== 0, `expected non-zero exit, got 0:\n${r2.out}`);
  assert(r2.out.includes("no --force"), `expected the usage error naming "no --force":\n${r2.out}`);
}

if (failed) {
  console.error("FAIL — archive-moves.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — archive-moves.mjs: T-V4B3-08, 09, 10 pass");
process.exit(0);
