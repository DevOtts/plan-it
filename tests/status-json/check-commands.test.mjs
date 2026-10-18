// R-1 — plan-it writes a check per task into the committed plan package: a command for mechanical Test Contract
// cases, kind "none" for owner-gated, judgement, live and prod ones. node --test tests/status-json/
// Authored by DevOtts (https://github.com/DevOtts).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildPlan, caseCheck, composeCheck } from "../../plugins/plan-it/scripts/status-from-plan.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, "..", "fixtures", "status-json");
const CLI = path.join(HERE, "..", "..", "plugins", "plan-it", "scripts", "status-from-plan.mjs");
const WRITER_CANDIDATES = [
  "/Users/macbook/Workspace/Devotts/build-it-wt/r1-recheck/plugins/build-it/scripts/status/status-write.mjs",
  "/Users/macbook/Workspace/Devotts/build-it/plugins/build-it/scripts/status/status-write.mjs",
];
const WRITER = process.env.DOIT_STATUS_WRITE || WRITER_CANDIDATES.find((p) => fs.existsSync(p));
// The end-to-end case needs a writer that knows `recheck` (build-it R-1).
const SKIP_E2E = !(WRITER && fs.existsSync(WRITER))
  ? "shared writer (build-it status-write.mjs) not found; set DOIT_STATUS_WRITE"
  : !fs.existsSync(path.join(path.dirname(WRITER), "recheck.mjs"))
    ? "writer found but it has no recheck.mjs (build-it R-1 not merged beside it yet)"
    : false;

const tasksOf = (plan) => Object.fromEntries(plan.waves.flatMap((w) => w.tasks).map((t) => [t.id, t]));

test("R-1 emitted plan carries a check command for mechanical cases", () => {
  const t = tasksOf(buildPlan({ pkg: path.join(FIX, "pkg-checks") }));
  assert.equal(t["C1-01"].check.kind, "command");
  assert.equal(t["C1-01"].check.command, 'node -e "process.exit(0)"');
  assert.deepEqual(t["C1-01"].check.cases, ["T-C1-01"]);
  // run: column, two cases mapped to one checklist task by the Task column; "\|" is a literal pipe.
  assert.deepEqual(t["CK-01"].check, {
    kind: "command", command: "(node tests/parse.mjs) && (node tests/rt.mjs | grep -q ok)", cases: ["T-C2-01", "T-C2-02"],
  });
  // [REAL] opted in with Verify auto is mechanical.
  assert.equal(t["C4-01"].check.kind, "command");
  assert.equal(t["C4-01"].check.command, "node tests/real-file.mjs");
});

test("R-1 owner-gated, judgement, live and prod cases get kind none and never a command", () => {
  const t = tasksOf(buildPlan({ pkg: path.join(FIX, "pkg-checks") }));
  // The mechanical case runs; the attended and judgement cases of the same task are listed unchecked.
  assert.deepEqual(t["C1-01"].check.unchecked, [{ case: "T-C1-02", reason: "owner-gated" }, { case: "T-C1-03", reason: "judgement" }]);
  assert.equal(t["CK-02"].check.kind, "none");
  assert.equal(t["CK-02"].check.reason, "owner-gated");
  assert.equal(t["CK-02"].check.command, undefined);
  assert.equal(t["C3-01"].check.kind, "none");
  assert.deepEqual(t["C3-01"].check.unchecked.map((u) => u.reason), ["live ([REAL] without Verify auto)", "prod"]);
  assert.equal(t["C3-01"].check.command, undefined, "a live/prod command in the cell is never carried");
  assert.equal(t["CK-03"].check.kind, "none", "a checklist task no case names stays unchecked");
  assert.equal(t["C4-02"].check.reason, "no Check column in the Test Contract");
});

test("R-1 every task of an old-style package gets kind none (no check column)", () => {
  const plan = buildPlan({ pkg: path.join(FIX, "pkg-nochecklist") });
  for (const tk of plan.waves.flatMap((w) => w.tasks)) assert.equal(tk.check.kind, "none");
});

test("R-1 caseCheck rules", () => {
  const cols = { check: 3, verify: 2, kind: -1, task: -1 };
  assert.deepEqual(caseCheck(["T-1", "x", "auto", "`npm test`"], cols), { kind: "command", command: "npm test" });
  assert.equal(caseCheck(["T-1", "x", "attended", "`npm test`"], cols).kind, "none");
  assert.equal(caseCheck(["T-1", "x @live", "auto", "`npm test`"], cols).reason, "live");
  assert.equal(caseCheck(["T-1", "x", "auto", "npm test"], cols).reason, "check cell is not a backticked command");
  assert.match(caseCheck(["T-1", "x", "auto", "`a` and `b`"], cols).reason, /more than one backticked span/);
  assert.equal(caseCheck(["T-1", "x", "auto", "none"], cols).reason, "no check command");
  assert.deepEqual(composeCheck([]), { kind: "none", reason: "no Test Contract case maps to this task" });
});

function git(root, ...args) {
  return execFileSync("git", ["-C", root, "-c", "user.email=t@example.com", "-c", "user.name=t", "-c", "commit.gpgsign=false", ...args], { encoding: "utf8" }).trim();
}

test("R-1 CLI keeps plan.json in the package; the writer copies checks and recheck runs the committed one", { skip: SKIP_E2E }, () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "r1-plan-")));
  git(root, "init", "-q");
  const pkg = path.join(root, "docs", "implementations", "pkg-checks");
  fs.cpSync(path.join(FIX, "pkg-checks"), pkg, { recursive: true });
  const env = { ...process.env, DOIT_STATUS_WRITE: WRITER };
  delete env.DOIT_STATUS_FILE;
  const r = spawnSync(process.execPath, [CLI, "--package", pkg], { encoding: "utf8", env });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /3 with a check command/);
  const plan = JSON.parse(fs.readFileSync(path.join(pkg, "plan.json"), "utf8"));
  assert.equal(tasksOf(plan)["C1-01"].check.kind, "command");
  const doc = JSON.parse(fs.readFileSync(path.join(pkg, "status.json"), "utf8"));
  const st = Object.fromEntries(doc.waves.flatMap((w) => w.tasks).map((t) => [t.id, t]));
  assert.deepEqual(st["C1-01"].check, tasksOf(plan)["C1-01"].check);
  assert.equal(st["CK-02"].check.kind, "none");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "plan package");
  const file = path.join(pkg, "status.json");
  const rc = spawnSync(process.execPath, [WRITER, "recheck", "--file", file, "--task", "C1-01"], { encoding: "utf8", env });
  assert.equal(rc.status, 0, rc.stderr + rc.stdout);
  assert.match(rc.stdout, /C1-01 re-check PASS/);
  const un = spawnSync(process.execPath, [WRITER, "recheck", "--file", file, "--task", "CK-02"], { encoding: "utf8", env });
  assert.equal(un.status, 0, un.stderr);
  assert.match(un.stdout, /CK-02 unchecked: kind none \(owner-gated\)/);
  // Re-running plan-it is idempotent against the committed plan and the board.
  const again = spawnSync(process.execPath, [CLI, "--package", pkg], { encoding: "utf8", env });
  assert.equal(again.status, 0, again.stderr + again.stdout);
  assert.equal(git(root, "status", "--porcelain", "--", path.join(pkg, "plan.json")), "");
});
