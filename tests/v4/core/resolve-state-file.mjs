#!/usr/bin/env node
/**
 * T-V4B3-01 — resolveStateFile(root, slug?), imported directly (no
 * subprocess): (a) only a named file, no slug -> the named file; (b) named +
 * generic, no slug -> generic; (c) two named files, no generic, no slug ->
 * the (non-existent) generic path — ambiguous, never guessed — and an
 * explicit slug resolves the right named file; (d) nothing -> generic path.
 * An explicit missing slug is reported (returns null), never silently
 * swapped for the generic file.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { resolveStateFile } from "../../../plugins/plan-it/skills/plan-it/scripts/gate-check.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}

function tmpRoot() {
  return mkdtempSync(join(tmpdir(), "planit-resolve-"));
}
function seed(root, files) {
  const planItDir = join(root, ".plan-it");
  mkdirSync(planItDir, { recursive: true });
  for (const f of files) writeFileSync(join(planItDir, f), "{}");
}

// (a) only v4.state.json
{
  const root = tmpRoot();
  seed(root, ["v4.state.json"]);
  assert(resolveStateFile(root, null) === join(root, ".plan-it", "v4.state.json"), "(a) no slug should resolve the lone named file");
  rmSync(root, { recursive: true, force: true });
}

// (b) v4.state.json + state.json
{
  const root = tmpRoot();
  seed(root, ["v4.state.json", "state.json"]);
  assert(resolveStateFile(root, null) === join(root, ".plan-it", "state.json"), "(b) no slug should resolve the generic file when both exist");
  rmSync(root, { recursive: true, force: true });
}

// (c) two named files, no generic
{
  const root = tmpRoot();
  seed(root, ["alpha.state.json", "beta.state.json"]);
  assert(
    resolveStateFile(root, null) === join(root, ".plan-it", "state.json"),
    "(c) no slug with two named files and no generic should return the (non-existent) generic path — ambiguous, never guessed"
  );
  assert(resolveStateFile(root, "alpha") === join(root, ".plan-it", "alpha.state.json"), '(c) explicit slug "alpha" should resolve the named file');
  assert(resolveStateFile(root, "missing") === null, "(c) an explicit missing slug should return null, never silently swapped");
  rmSync(root, { recursive: true, force: true });
}

// (d) nothing at all
{
  const root = tmpRoot();
  mkdirSync(join(root, ".plan-it"), { recursive: true });
  assert(resolveStateFile(root, null) === join(root, ".plan-it", "state.json"), "(d) nothing at all should return the generic path");
  rmSync(root, { recursive: true, force: true });
}

// Also sanity-check against the real fixtures on disk.
{
  const portfolio = join(ROOT, "tests/fixtures/v4/portfolio");
  assert(resolveStateFile(portfolio, "alpha") === join(portfolio, ".plan-it", "alpha.state.json"), "portfolio/ slug=alpha should resolve alpha.state.json");
  assert(resolveStateFile(portfolio, "missing") === null, "portfolio/ a missing explicit slug should return null");
}

if (failed) {
  console.error("FAIL — resolve-state-file.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — resolve-state-file.mjs: T-V4B3-01 passes");
process.exit(0);
