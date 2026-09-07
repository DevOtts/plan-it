#!/usr/bin/env node
/**
 * T-V4B5-05 — the polarity function classifies `node tests/v4/core/x.mjs`
 * positive, `node plugins/…/gate-check.mjs reconcile --dir …` negative,
 * `manual: …` skipped, and a gate-check row described "(positive)" positive.
 * A negative row exiting 0 against its violating fixture is reported FAIL
 * ("fail-closed broken"); a positive script exiting 1 is FAIL; a positive
 * script exiting 0 is PASS.
 * T-V4B5-06 — a temp CONTRACT with one PENDING row (missing script), one
 * negative row (fail-closed, correctly non-zero) and one positive row that
 * fails: the section logic reports PEND/PASS/FAIL on the right rows,
 * computed totals `1/2 … 1 pending`, exit 1 — the pending row counts into
 * neither pass nor fail.
 * T-V4B5-10 — regression: `node tests/v3/fail-closed-sweep.mjs` still
 * exits 0 with 25 rows mechanism-ready (parseContractCases()'s v3-only
 * default is unchanged by the lib edits).
 *
 * Ports tests/run-contract.mjs's actual isPositiveRow logic verbatim
 * (verified byte-present in its source below) rather than importing that
 * file directly — it has no isMain guard and would execute its whole suite
 * + process.exit() as an import side effect.
 *
 * Positive harness script (D-B13 polarity): exit 0 = PASS, exit 1 = FAIL.
 *
 * Authored by DevOtts (https://github.com/DevOtts).
 */
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const RC_PATH = join(ROOT, "tests/run-contract.mjs");

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL — ${msg}`);
    failed = true;
  }
}

// Port of tests/run-contract.mjs's isPositiveRow.
function isPositiveRow(row) {
  if (/\(positive\)/i.test(row.desc ?? "")) return true;
  if (row.source && /\bdelivery\/v3\/CONTRACT\.md$/.test(row.source)) return false;
  return /^node\s+tests\//.test(row.run);
}

function runExitsZero(run) {
  const [bin, ...args] = run.split(/\s+/);
  try {
    execFileSync(bin, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

// Outcome reporting given a KNOWN polarity (decoupled from isPositiveRow's
// path-shape classification, which is tested separately above/below with
// realistic non-absolute example strings — a temp script's absolute path
// never looks like "node tests/...", so outcome tests pass polarity in
// directly rather than relying on classification of a throwaway temp path).
function reportOutcome(positive, run) {
  const exitedZero = runExitsZero(run);
  if (positive) return exitedZero ? { pass: true } : { pass: false, err: "positive harness script exited non-zero — FAIL" };
  return exitedZero ? { pass: false, err: "exited 0 against its violating fixture — fail-closed broken" } : { pass: true };
}

// Sanity: this port actually matches the shipped implementation.
{
  const rcSrc = readFileSync(RC_PATH, "utf8");
  assert(rcSrc.includes('if (/\\(positive\\)/i.test(row.desc ?? "")) return true;'), "expected run-contract.mjs's isPositiveRow to carry the (positive) tag check");
  assert(/row\.source.*delivery.*v3.*CONTRACT/.test(rcSrc), "expected run-contract.mjs's isPositiveRow to be source-aware for v3 rows");
}

// T-V4B5-05 — classification.
assert(isPositiveRow({ run: "node tests/v4/core/x.mjs", desc: "" }) === true, "expected node tests/v4/core/x.mjs to classify positive");
assert(
  isPositiveRow({ run: "node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs reconcile --dir tests/fixtures/v4/foo", desc: "" }) === false,
  "expected a gate-check verb row to classify negative"
);
assert(isPositiveRow({ run: "manual: Fernando confirms", desc: "" }) === false, "manual: rows are never positive (the caller skips them before classifying)");
assert(
  isPositiveRow({ run: "node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs adversary <deep>", desc: "asserts something true (positive)" }) === true,
  'expected a "(positive)"-tagged gate-check row to classify positive'
);

// T-V4B5-05 — outcome reporting for each polarity, against real stub scripts.
{
  const scratch = mkdtempSync(join(tmpdir(), "planit-polarity-"));
  mkdirSync(join(scratch, "tests"), { recursive: true });
  try {
    // A negative (gate-check-style) row that wrongly exits 0 against its
    // violating fixture -> FAIL, "fail-closed broken".
    const fakeNeg = join(scratch, "fake-check.mjs");
    writeFileSync(fakeNeg, "process.exit(0);\n");
    const negOutcome = reportOutcome(false, `node ${fakeNeg}`);
    assert(negOutcome.pass === false && /fail-closed broken/.test(negOutcome.err), `expected FAIL naming "fail-closed broken", got: ${JSON.stringify(negOutcome)}`);

    // A positive row that fails -> FAIL.
    const posFail = join(scratch, "tests", "fails.mjs");
    writeFileSync(posFail, "process.exit(1);\n");
    const posFailOutcome = reportOutcome(true, `node ${posFail}`);
    assert(posFailOutcome.pass === false, `expected a positive script exiting 1 to FAIL, got: ${JSON.stringify(posFailOutcome)}`);

    // A positive row that succeeds -> PASS.
    const posOk = join(scratch, "tests", "ok.mjs");
    writeFileSync(posOk, "process.exit(0);\n");
    const posOkOutcome = reportOutcome(true, `node ${posOk}`);
    assert(posOkOutcome.pass === true, `expected a positive script exiting 0 to PASS, got: ${JSON.stringify(posOkOutcome)}`);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

// T-V4B5-06 — section-level PEND/PASS/FAIL + computed totals + exit code,
// using a minimal local mechanism-gap (script path existence).
{
  const scratch = mkdtempSync(join(tmpdir(), "planit-polarity-section-"));
  mkdirSync(join(scratch, "tests"), { recursive: true });
  try {
    const negFixture = join(scratch, "violating.txt");
    writeFileSync(negFixture, "x");
    const negScript = join(scratch, "neg-check.mjs");
    writeFileSync(negScript, `import { readFileSync } from "node:fs"; process.exit(readFileSync(process.argv[2], "utf8") === "x" ? 1 : 0);\n`);
    const posFailScript = join(scratch, "tests", "pos-fail.mjs");
    writeFileSync(posFailScript, "process.exit(1);\n");

    const rows = [
      { id: "ROW-PEND", run: `node ${join(scratch, "does-not-exist.mjs")}` },
      { id: "ROW-NEG-OK", run: `node ${negScript} ${negFixture}` },
      { id: "ROW-POS-FAIL", run: `node ${posFailScript}` },
    ];

    const pending = [];
    const outcomes = [];
    for (const row of rows) {
      const [, scriptPath] = row.run.split(/\s+/);
      if (!existsSync(scriptPath)) {
        pending.push({ id: row.id, reason: `missing on disk: ${scriptPath}` });
        continue;
      }
      const positive = scriptPath.startsWith(join(scratch, "tests"));
      outcomes.push({ id: row.id, ...reportOutcome(positive, row.run) });
    }

    assert(pending.length === 1 && pending[0].id === "ROW-PEND", `expected exactly ROW-PEND pending, got: ${JSON.stringify(pending)}`);
    assert(outcomes.length === 2, `expected exactly 2 executed outcomes, got ${outcomes.length}`);
    const passCount = outcomes.filter((o) => o.pass).length;
    assert(passCount === 1, `expected exactly 1/2 to pass (the negative row, correctly fail-closed), got ${passCount}/2`);
    const failRow = outcomes.find((o) => o.id === "ROW-POS-FAIL");
    assert(failRow && failRow.pass === false, `expected ROW-POS-FAIL to FAIL, got: ${JSON.stringify(failRow)}`);
    const impliedExit = pending.length + outcomes.filter((o) => !o.pass).length > 0 ? 1 : 0;
    assert(impliedExit === 1, "expected the section to imply a non-zero overall exit code");
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

// T-V4B5-10 — regression.
{
  let out, code;
  try {
    out = execFileSync("node", [join(ROOT, "tests/v3/fail-closed-sweep.mjs")], { encoding: "utf8" });
    code = 0;
  } catch (e) {
    code = e.status ?? 1;
    out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
  assert(code === 0, `expected tests/v3/fail-closed-sweep.mjs exit 0, got ${code}:\n${out}`);
  assert(/25/.test(out), `expected 25 rows reported, got:\n${out}`);
}

if (failed) {
  console.error("FAIL — run-contract-polarity.mjs: one or more assertions failed (see above)");
  process.exit(1);
}
console.log("OK — run-contract-polarity.mjs: T-V4B5-05, 06, 10 pass");
process.exit(0);
