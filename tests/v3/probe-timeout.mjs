#!/usr/bin/env node
/**
 * C-W2-04 — a probe exceeding the 10s budget (`PROBE_TIMEOUT_MS = 10_000`,
 * scripts/gate-check.mjs ~line 156) is killed with SIGKILL, recorded as
 * `TIMEOUT` in ENV-FACTS.md, and the run continues to the remaining probes
 * instead of hanging.
 *
 * JUDGMENT CALL: `PROBE_TIMEOUT_MS` is a hardcoded module-level `const`, not
 * exported and not overridable via env var or CLI arg (checked: no
 * `process.env` read near it, no arg threading it through `cmdPreflight`).
 * Per this case's brief, when no override exists the alternative is to
 * verify the TIMEOUT-recording path with a fast-failing command — but that
 * doesn't actually work here: the catch-block only assigns status TIMEOUT
 * when `e.signal || e.killed || e.code === "ETIMEDOUT"` is true, and a
 * plain fast exit (e.g. `sh -c 'exit 124'`) sets none of those — it would
 * record ABSENT, silently exercising the wrong branch and giving a false
 * green. So this harness takes the real >10s wait (~10-11s wall clock) to
 * exercise the actual timeout branch. It is the slowest of the four
 * harnesses; every assertion below is chosen to bound that cost as tightly
 * as still-correct: exactly one probe sleeps 15s (2 fewer real S-probes
 * would speed nothing further — the wait is intrinsic, not proportional to
 * probe count), and there is no retry/poll loop.
 *
 * Fixture (mkdtempSync, script-managed, no static fixture on disk — same
 * pattern as tests/v3/conventions-idempotent.mjs): the 6-probe S-shape set,
 * 5 fast (`true`) + 1 (`sleep 15`) exceeding the budget.
 *
 * Asserts:
 *   1. wall-clock elapsed is bounded (< 20s) — the run did NOT wait out the
 *      full 15s sleep, i.e. it was actually killed early, and did not hang.
 *   2. ENV-FACTS.md's row for the slow probe reads status `TIMEOUT` with
 *      evidence citing the 10000ms budget.
 *   3. the other 5 probes still ran and were recorded (the run continued
 *      past the timed-out probe rather than aborting the sweep).
 *
 * EXIT-CODE CONVENTION (deliberately inverted — same as
 * tests/v3/conventions-idempotent.mjs, see its header for the full
 * rationale): exit 1 = enforcement held; exit 0 = enforcement BROKEN.
 * Per C-META-01's fail-closed sweep and AMD-3 (delivery/decisions.md
 * 2026-07-08).
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const GC = join(ROOT, "scripts", "gate-check.mjs");

const PROBE_SET_S = [
  "config-reachability",
  "live-registry",
  "deployed-vs-installed",
  "credential-validity",
  "dependency-actual-usage", // the slow one
  "code-vs-external-split",
];
const SLOW_ID = "dependency-actual-usage";

const dir = mkdtempSync(join(tmpdir(), "planit-probe-timeout-"));
const probes = PROBE_SET_S.map((id) => ({ id, check: id === SLOW_ID ? ["sleep", "15"] : ["true"] }));
writeFileSync(join(dir, "ENV-PROBES.json"), JSON.stringify({ probes }));

const t0 = Date.now();
let code = 0, out = "";
try {
  out = execFileSync("node", [GC, "preflight", "S", "--dir", dir], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
} catch (e) {
  code = e.status ?? 1;
  out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
}
const elapsedMs = Date.now() - t0;

let broken = null;
if (elapsedMs >= 20_000) {
  broken = `run took ${elapsedMs}ms — did not appear to be killed at the 10s budget (waited out or beyond the 15s sleep)`;
} else {
  const factsPath = join(dir, "ENV-FACTS.md");
  if (!existsSync(factsPath)) {
    broken = `ENV-FACTS.md was not written to ${dir} — the run did not continue/complete past the timed-out probe`;
  } else {
    const facts = readFileSync(factsPath, "utf8");
    const row = facts.split("\n").find((l) => l.includes(`| ${SLOW_ID} |`));
    if (!row) broken = `no ENV-FACTS.md row found for "${SLOW_ID}"`;
    else if (!row.includes("| TIMEOUT |")) broken = `"${SLOW_ID}" row is not status TIMEOUT: ${row}`;
    else if (!/killed after 10000ms budget/.test(row)) broken = `"${SLOW_ID}" TIMEOUT row missing the 10000ms-budget evidence: ${row}`;
    else {
      const otherRows = PROBE_SET_S.filter((id) => id !== SLOW_ID).filter((id) => facts.includes(`| ${id} |`));
      if (otherRows.length !== PROBE_SET_S.length - 1) {
        broken = `only ${otherRows.length}/${PROBE_SET_S.length - 1} other probes recorded — the run aborted instead of continuing past the timeout`;
      }
    }
  }
}

try {
  rmSync(dir, { recursive: true, force: true });
} catch { /* best-effort cleanup */ }

if (broken) {
  console.log(`BROKEN — ${broken} (gate-check exit ${code}, elapsed ${elapsedMs}ms)`);
  process.exit(0); // enforcement broken → exit 0 (see header)
}
console.log(`OK — the 15s-sleeping probe was killed at the 10s budget (elapsed ${elapsedMs}ms), recorded TIMEOUT in ENV-FACTS.md with the budget evidence, and the run continued through the remaining ${PROBE_SET_S.length - 1} probes (gate-check exit ${code}, as expected — TIMEOUT fails the sweep). Exiting 1 per the C-META-01 fail-closed sweep convention.`);
process.exit(1);
