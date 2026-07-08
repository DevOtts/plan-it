#!/usr/bin/env node
/**
 * C-W2-02 — `gate-check preflight <S|M|L>` is shape-tiered (Epic E2 / W2,
 * formats.md §9): S requires exactly the 6-probe minimal set; M and L
 * require the same 6 plus 3 more (9 total). Reads `ENV-PROBES.json` from
 * `--dir <target>` (see `cmdPreflight`, scripts/gate-check.mjs ~line 179):
 * `{"probes":[{"id":"...","check":["argv","..."]},...]}`.
 *
 * Script-managed temp dirs (mkdtempSync, same pattern as
 * tests/v3/conventions-idempotent.mjs) — no static fixture on disk, and
 * ENV-FACTS.md (written by a passing run) never lands in a tracked
 * directory. Six sub-checks, all must hold for enforcement to be "held":
 *   1. full 6-probe S-shape set → `preflight S` exits 0 (accepts complete set)
 *   2. 5-of-6 S-shape set (one required probe missing) → `preflight S` exits
 *      non-zero (rejects incomplete set)
 *   3. full 9-probe set run as S-shape (3 extra probes) → `preflight S`
 *      exits non-zero (rejects extra probes — "exactly" the 6-set)
 *   4. full 9-probe set → `preflight M` exits 0, `preflight L` exits 0
 *      (both accept the full set)
 *   5. 8-of-9 set (one of the extra 3 missing) → `preflight M` exits
 *      non-zero (rejects incomplete M/L set)
 *
 * EXIT-CODE CONVENTION (deliberately inverted — same as
 * tests/v3/conventions-idempotent.mjs, see its header for the full
 * rationale): exit 1 = enforcement held; exit 0 = enforcement BROKEN.
 * Per C-META-01's fail-closed sweep and AMD-3 (delivery/decisions.md
 * 2026-07-08).
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const GC = join(ROOT, "scripts", "gate-check.mjs");

// Mirrors gate-check.mjs's PROBE_SET_S / PROBE_SET_ML (formats.md §9) — this
// is fixture data describing what the mechanism ought to require, not the
// mechanism itself.
const PROBE_SET_S = [
  "config-reachability",
  "live-registry",
  "deployed-vs-installed",
  "credential-validity",
  "dependency-actual-usage",
  "code-vs-external-split",
];
const PROBE_SET_ML = [...PROBE_SET_S, "tool-availability", "caller-consumer-surface", "secret-scan-on-import"];

function probesFile(ids) {
  return JSON.stringify({ probes: ids.map((id) => ({ id, check: ["true"] })) });
}

function mkFixture(ids) {
  const dir = mkdtempSync(join(tmpdir(), "planit-preflight-"));
  writeFileSync(join(dir, "ENV-PROBES.json"), probesFile(ids));
  return dir;
}

function run(shape, dir) {
  try {
    return { code: 0, out: execFileSync("node", [GC, "preflight", shape, "--dir", dir], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

const sFull = mkFixture(PROBE_SET_S);
const sIncomplete = mkFixture(PROBE_SET_S.slice(0, -1)); // missing "code-vs-external-split"
const mlFull = mkFixture(PROBE_SET_ML);
const mlIncomplete = mkFixture(PROBE_SET_ML.slice(0, -1)); // missing "secret-scan-on-import"

const dirs = [sFull, sIncomplete, mlFull, mlIncomplete];
let broken = null;

const r1 = run("S", sFull);
if (r1.code !== 0) broken = `full 6-probe S-shape set rejected by 'preflight S' (should accept): ${r1.out}`;

const r2 = !broken && run("S", sIncomplete);
if (!broken && r2.code === 0) broken = `5-of-6 S-shape set (missing a required probe) wrongly ACCEPTED by 'preflight S'`;

const r3 = !broken && run("S", mlFull);
if (!broken && r3.code === 0) broken = `full 9-probe set (3 extra probes) wrongly ACCEPTED by 'preflight S' — S must require EXACTLY the 6-probe set`;

const r4m = !broken && run("M", mlFull);
if (!broken && r4m.code !== 0) broken = `full 9-probe set rejected by 'preflight M' (should accept): ${r4m.out}`;

const r4l = !broken && run("L", mlFull);
if (!broken && r4l.code !== 0) broken = `full 9-probe set rejected by 'preflight L' (should accept): ${r4l.out}`;

const r5 = !broken && run("M", mlIncomplete);
if (!broken && r5.code === 0) broken = `8-of-9 set (missing a required extra probe) wrongly ACCEPTED by 'preflight M'`;

for (const d of dirs) {
  try {
    rmSync(d, { recursive: true, force: true });
  } catch { /* best-effort cleanup */ }
}

if (broken) {
  console.log(`BROKEN — ${broken}`);
  process.exit(0); // enforcement broken → exit 0 (see header)
}
console.log("OK — preflight S accepts exactly the 6-probe set (rejects both a missing probe and the 9-probe superset); preflight M/L accept the full 9-probe set and reject an 8-probe incomplete set. Exiting 1 per the C-META-01 fail-closed sweep convention.");
process.exit(1);
