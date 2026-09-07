#!/usr/bin/env node
/**
 * T-V4B4-14 — `disposition-good/` (VERIFIED rows empty/"—", one owner-gated,
 * one IMPLEMENTED-NOT-VERIFIED, one backlog-with-reason whose path exists,
 * typed tally equal) exits 0; `disposition-bad-path/` exits 1 naming the
 * missing path; `disposition-malformed/` exits 1 naming the closed grammar
 * — and after the cell is corrected in a temp copy, `reconcile` re-verifies
 * to exit 0 (recovery).
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync } from "node:fs";
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
function run(dir) {
  try {
    return { code: 0, out: execFileSync("node", [GATECHECK, "reconcile", "--dir", dir], { encoding: "utf8" }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

{
  const r = run(join(ROOT, "tests/fixtures/v4/disposition-good"));
  assert(r.code === 0, `disposition-good: expected exit 0, got ${r.code}:\n${r.out}`);
}

{
  const r = run(join(ROOT, "tests/fixtures/v4/disposition-bad-path"));
  assert(r.code !== 0, `disposition-bad-path: expected non-zero exit, got 0:\n${r.out}`);
  assert(r.out.includes("does-not-exist.md"), `disposition-bad-path: expected the missing path named:\n${r.out}`);
}

{
  const r = run(join(ROOT, "tests/fixtures/v4/disposition-malformed"));
  assert(r.code !== 0, `disposition-malformed: expected non-zero exit, got 0:\n${r.out}`);
  assert(r.out.includes("no disposition"), `disposition-malformed: expected the closed-grammar reason named:\n${r.out}`);
}

// Recovery: fix the malformed cell in a temp copy, reconcile re-verifies to exit 0.
{
  const dir = mkdtempSync(join(tmpdir(), "planit-disposition-recovery-"));
  cpSync(join(ROOT, "tests/fixtures/v4/disposition-malformed"), dir, { recursive: true });
  const statusPath = join(dir, "delivery", "STATUS.md");
  let text = readFileSync(statusPath, "utf8");
  text = text.replace("deferred: later", "owner-gated: Fernando Ott").replace("0 owner-gated", "1 owner-gated");
  writeFileSync(statusPath, text);
  const r = run(dir);
  assert(r.code === 0, `expected exit 0 after fixing the disposition cell (recovery), got ${r.code}:\n${r.out}`);
  rmSync(dir, { recursive: true, force: true });
}

if (failed) {
  console.error("FAIL — disposition-good.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — disposition-good.mjs: T-V4B4-14 passes");
process.exit(0);
