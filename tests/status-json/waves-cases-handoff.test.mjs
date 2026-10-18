// Waves, case->task mapping and handoff on generated boards (H-12, H-13, H-14).
// DOIT_STATUS_WRITE=<status-write.mjs> node --test tests/status-json/*.test.mjs
// All material below is synthetic.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildPlan, collectTasks, waveOf, splitCells } from "../../plugins/plan-it/scripts/status-from-plan.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const CLI = path.join(ROOT, "plugins", "plan-it", "scripts", "status-from-plan.mjs");
const GATE = path.join(ROOT, "scripts", "gate-check.mjs");
const WRITER = process.env.DOIT_STATUS_WRITE;
const SKIP = WRITER && fs.existsSync(WRITER) ? false : "DOIT_STATUS_WRITE not set to a status-write.mjs";
const env = { ...process.env, DOIT_STATUS_WRITE: WRITER };

// An epic block in the shape plan-it's own packages write: label bold, value outside; checklist without ids;
// a Test Contract with ID | Kind | Given/When/Then | Assertion and neither a Task nor a Check column.
function epic(eid, waveLine, nTasks, nCases, { header = "" } = {}) {
  const tasks = Array.from({ length: nTasks }, (_, i) => `- [ ] do step ${i + 1} of ${eid}`).join("\n");
  const rows = Array.from({ length: nCases }, (_, i) => `| T-${eid}-${String(i + 1).padStart(2, "0")} | unit | Given a, When b, Then c | assert ${i + 1} |`).join("\n");
  return [
    `## ${eid} — synthetic epic ${eid}`,
    `**Branch:** epic/${eid}-x · **Repos:** demo · ${waveLine}${header}`,
    "",
    "### Scope",
    tasks,
    "",
    `### Test Contract — ${eid} (BINDING: 100% pass or /iterate)`,
    `Types: [unit] · Count: ${nCases}`,
    "",
    "| ID | Kind | Given / When / Then | Assertion |",
    "|---|---|---|---|",
    rows,
    "",
  ].join("\n");
}

function mkpkg(epicTexts, { layout = "epics" } = {}) {
  const pkg = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "wch-")), "impl");
  const dir = layout === "delivery" ? path.join(pkg, "delivery", "epics") : path.join(pkg, "epics");
  fs.mkdirSync(dir, { recursive: true });
  epicTexts.forEach((t, i) => fs.writeFileSync(path.join(dir, `epics-${i + 1}.md`), `# Epics ${i + 1}\n\n${t}`));
  return pkg;
}

const SYNTH = () => [
  epic("A1", "**Wave:** W0", 3, 4) + epic("A2", "**Wave:** W0", 2, 2),
  epic("B1", "**Wave:** W1", 4, 4),
  epic("C1", "**Wave:** W2", 2, 5),
  epic("D1", "**Wave:** W3", 1, 1),
];

const cli = (args, extraEnv = {}) => spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", env: { ...env, ...extraEnv } });
const plan = (pkg, opts = {}) => buildPlan({ pkg, defaultWave: true, ...opts });
const waveSizes = (p) => Object.fromEntries(p.waves.map((w) => [w.id, w.tasks.length]));

test("H-12 waveOf accepts every spelling and ignores prose", () => {
  for (const l of ["**Wave:** W0", "**Wave: W0**", "Wave: W0", "- Wave: W0", "x | Wave: W0 | y", "a · **Wave:** W0 · b", "| Wave | W0 |", "| **Wave** | `W0` |", "Wave 0", "wave = W0"]) {
    assert.equal(waveOf(l), "W0", l);
  }
  for (const l of ["the wave is top", "Wave order inside W0: F4 first", "fix at wave end", "waves: none"]) assert.equal(waveOf(l), null, l);
  assert.equal(waveOf("**Wave:** W12"), "W12");
});

test("H-12/H-13 synthetic package in plan-it's own format: waves follow the headers, every task has a case, check is none with the reason", () => {
  const pkg = mkpkg(SYNTH());
  const report = {};
  const p = buildPlan({ pkg, report });
  assert.deepEqual(waveSizes(p), { W0: 5, W1: 4, W2: 2, W3: 1 }, "not all in W1");
  assert.deepEqual(p.waves.map((w) => w.id), ["W0", "W1", "W2", "W3"]);
  const { tasks } = collectTasks({ pkg });
  for (const t of tasks) assert.ok(t.cases.length > 0, `${t.id} has a case`);
  for (const t of p.waves.flatMap((w) => w.tasks)) {
    assert.equal(t.check.kind, "none", t.id);
    assert.equal(t.check.reason, "no Check column in the Test Contract");
  }
  // A1: 4 cases/3 tasks -> 3 by id + 1 epic; A2: 2/2 -> 2 id; B1: 4/4; C1: 5 cases/2 tasks -> 2 id + 3 epic; D1: 1/1
  assert.deepEqual({ ...report.mapping, unmappedList: undefined, badRows: undefined }, { column: 0, id: 3 + 2 + 4 + 2 + 1, epic: 1 + 3, unmapped: 0, inherited: 0, unmappedList: undefined, badRows: undefined });
  // an epic fallback case rides on every task of its epic
  const a1 = tasks.filter((t) => t.epic.eid === "A1");
  assert.ok(a1.every((t) => t.cases.some((c) => c.id === "T-A1-04")));
  assert.ok(!a1.find((t) => t.id === "A1-01").cases.some((c) => c.id === "T-A1-02"), "id-mapped case stays on its own task");
});

test("H-13 more tasks than cases: the leftover tasks carry the epic's Test Contract", () => {
  const pkg = mkpkg([epic("Z1", "**Wave:** W0", 5, 2)]);
  const report = {};
  plan(pkg, { report });
  assert.equal(report.mapping.inherited, 3);
  const { tasks } = collectTasks({ pkg });
  assert.ok(tasks.every((t) => t.cases.length > 0));
  assert.deepEqual(tasks.at(-1).cases.map((c) => c.id), ["T-Z1-01", "T-Z1-02"]);
});

test("H-13 explicit Task and Check columns still win", () => {
  const text = [
    "## K1 — columns", "**Wave:** W0", "", "### Scope", "- [ ] K1-01 first", "- [ ] K1-02 second", "",
    "### Test Contract — K1", "| ID | Task | Check | Assertion |", "|---|---|---|---|",
    "| T-K1-01 | K1-02 | `echo one` | a |", "| T-K1-02 | K1-01 | `echo two` | b |", "| T-K1-03 | K1-NOPE | `echo three` | c |", "",
  ].join("\n");
  const pkg = mkpkg([text]);
  const report = {};
  const p = buildPlan({ pkg, report });
  const t = Object.fromEntries(p.waves[0].tasks.map((x) => [x.id, x]));
  assert.equal(t["K1-01"].check.command, "echo two");
  assert.equal(t["K1-02"].check.command, "echo one");
  assert.equal(report.mapping.column, 2);
  assert.equal(report.mapping.unmapped, 1);
  assert.match(report.mapping.unmappedList[0], /T-K1-03/);
  assert.ok(!JSON.stringify(p).includes("echo three"), "an unmapped case is never guessed onto a task");
});

test("H-12 an epic without a wave while others declare one: refuse, list it with file:line", () => {
  const pkg = mkpkg([epic("A1", "**Wave:** W0", 1, 1) + epic("A2", "", 1, 1) + epic("A3", "", 1, 1)]);
  assert.throws(() => buildPlan({ pkg }), (e) => /2 of 3 epics/.test(e.message) && /epics\/epics-1\.md:\d+\s+A2/.test(e.message) && /A3/.test(e.message) && !/A1\b/.test(e.message.split("\n").slice(1).join("\n")));
  const r = cli(["--package", pkg, "--dry-run"]);
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /epics-1\.md:\d+\s+A2/);
  assert.match(r.stderr, /A3/);
  assert.equal(fs.existsSync(path.join(pkg, "status.json")), false);
});

test("H-12 no wave anywhere: one wave W1 and a one-line warning; --default-wave silences it", () => {
  const pkg = mkpkg([epic("A1", "", 2, 2) + epic("A2", "", 1, 1)]);
  const r = cli(["--package", pkg, "--dry-run"]);
  assert.equal(r.status, 0, r.stderr);
  const p = JSON.parse(r.stdout);
  assert.deepEqual(p.waves.map((w) => w.id), ["W1"]);
  const warns = r.stderr.split("\n").filter((l) => /warning: no epic declares a wave/.test(l));
  assert.equal(warns.length, 1);
  const q = cli(["--package", pkg, "--dry-run", "--default-wave"]);
  assert.equal(q.status, 0, q.stderr);
  assert.ok(!/no epic declares a wave/.test(q.stderr));
});

test("H-12 the three header spellings produce identical boards", () => {
  const boards = ["**Wave:** W2", "**Wave: W2**", "Wave: W2"].map((w) => JSON.stringify(buildPlan({ pkg: mkpkg([epic("S1", w, 3, 3) + epic("S2", "**Wave:** W1", 1, 1)]) , defaultWave: true })));
  assert.equal(boards[0], boards[1]);
  assert.equal(boards[1], boards[2]);
  assert.match(boards[0], /"id":"W2"/);
  const tbl = mkpkg([["## S1 — table", "| Wave | W2 |", "|---|---|", "", "- [ ] a", "- [ ] b", "- [ ] c", "", "### Test Contract — S1", "| ID | Kind |", "|---|---|", "| T-S1-01 | u |", "| T-S1-02 | u |", "| T-S1-03 | u |", ""].join("\n") + epic("S2", "**Wave:** W1", 1, 1)]);
  assert.deepEqual(waveSizes(buildPlan({ pkg: tbl })), waveSizes(JSON.parse(boards[0])));
});

test("H-13 CLI prints the mapping counts and --gate passes on the generated board", { skip: SKIP }, () => {
  const pkg = mkpkg(SYNTH());
  const r = cli(["--package", pkg]);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /cases mapped: 0 by Task column, 12 by id, 4 by epic fallback, 0 unmapped/);
  const g = cli(["--gate", "--package", pkg]);
  assert.equal(g.status, 0, g.stderr + g.stdout);
  assert.match(g.stdout, /every task has a Test Contract case/);
});

test("H-13 --gate fails when a task is left with no case although its epic has cases", { skip: SKIP }, () => {
  const text = [
    "## G1 — gate", "**Wave:** W0", "", "### Scope", "- [ ] G1-01 first", "- [ ] G1-02 second", "",
    "### Test Contract — G1", "| ID | Task | Assertion |", "|---|---|---|", "| T-G1-01 | G1-77 | a |", "",
  ].join("\n");
  const pkg = mkpkg([text]);
  const r = cli(["--package", pkg]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /warning: unmapped case .*T-G1-01/);
  const g = cli(["--gate", "--package", pkg]);
  assert.equal(g.status, 1);
  assert.match(g.stderr, /every task has a Test Contract case/);
  assert.match(g.stderr, /G1-01, G1-02/);
});

// ------------------------------------------------------------------ H-14 handoff
const handoff = (dir) => spawnSync(process.execPath, [GATE, "handoff", dir], { encoding: "utf8" });

test("H-14 handoff passes on a freshly generated package (STATUS.md is the generated one)", { skip: SKIP }, () => {
  const pkg = mkpkg(SYNTH());
  assert.equal(cli(["--package", pkg]).status, 0);
  const md = fs.readFileSync(path.join(pkg, "STATUS.md"), "utf8");
  assert.ok(md.startsWith("<!-- generated from status.json"), "generated marker");
  const h = handoff(pkg);
  assert.equal(h.status, 0, h.stdout + h.stderr);
  assert.match(h.stdout, /generated from status\.json/);
  assert.match(h.stdout, /status\.json: .*valid/);
});

test("H-14 handoff on a generated package fails when status.json is missing or out of step with the epics", { skip: SKIP }, () => {
  const pkg = mkpkg(SYNTH());
  assert.equal(cli(["--package", pkg]).status, 0);
  const file = path.join(pkg, "status.json");
  const good = fs.readFileSync(file, "utf8");
  const doc = JSON.parse(good);
  doc.waves[0].tasks.pop();
  fs.writeFileSync(file, JSON.stringify(doc, null, 2));
  let h = handoff(pkg);
  assert.notEqual(h.status, 0, "task count mismatch must fail");
  assert.match(h.stdout + h.stderr, /task count matches epics|validate/);
  fs.rmSync(file);
  h = handoff(pkg);
  assert.notEqual(h.status, 0);
  assert.match(h.stdout + h.stderr, /no status\.json found/);
});

test("H-14 handoff still fails on a deliberately broken hand-written STATUS.md", { skip: SKIP }, () => {
  const pkg = mkpkg(SYNTH());
  fs.writeFileSync(path.join(pkg, "STATUS.md"), ["# Status", "", "| EID | Epic | Status |", "|---|---|---|", "| A1 | first | not-started |", ""].join("\n"));
  const h = handoff(pkg);
  assert.notEqual(h.status, 0);
  assert.match(h.stdout + h.stderr, /outside the 4-term vocabulary/);
});

test("H-14 a hand-written board that merely imitates the marker lower in the file is still linted", { skip: SKIP }, () => {
  const pkg = mkpkg(SYNTH());
  fs.writeFileSync(path.join(pkg, "STATUS.md"), ["# Status", "<!-- generated from status.json by status-write; do not edit by hand -->", "| EID | Status |", "|---|---|", "| A1 | bogus |", ""].join("\n"));
  const h = handoff(pkg);
  assert.notEqual(h.status, 0);
  assert.match(h.stdout + h.stderr, /outside the 4-term vocabulary/);
});

// ------------------------------------------------------------------ row splitting
const PIPES = [
  "## P1 — pipes", "**Wave:** W0", "", "### Scope", "- [ ] P1-01 first", "- [ ] P1-02 second", "- [ ] P1-03 third", "",
  "### Test Contract — P1", "| ID | Task | Assertion | Check |", "|---|---|---|---|",
  "| T-P1-01 | P1-01 | output matches `a | b` exactly | `node t1.mjs | grep -q ok` |",
  "| T-P1-02 | P1-02 | escaped \\| pipe in prose | `node t2.mjs \\| grep -q ok` |",
  "| T-P1-03 | P1-03 | has | one | cell | too many | `node t3.mjs` |", "",
].join("\n");

test("row splitting: escaped pipe is literal, a pipe inside backticks does not split, a wrong cell count is reported", () => {
  assert.deepEqual(splitCells("| a | `x | y` | c \\| d | e |"), ["a", "`x | y`", "c | d", "e"]);
  assert.deepEqual(splitCells("| a | `` x | y `` | |"), ["a", "`` x | y ``", ""]);
  const pkg = mkpkg([PIPES]);
  const report = {};
  const p = buildPlan({ pkg, report });
  const t = Object.fromEntries(p.waves[0].tasks.map((x) => [x.id, x]));
  assert.equal(t["P1-01"].check.command, "node t1.mjs | grep -q ok");
  assert.equal(t["P1-02"].check.command, "node t2.mjs | grep -q ok");
  assert.equal(t["P1-03"].check.kind, "none");
  assert.match(t["P1-03"].check.unchecked[0].reason, /7 cells, header has 4/);
  assert.equal(report.mapping.unmapped, 0);
  assert.equal(report.mapping.column, 2);
  assert.equal(report.mapping.badRows.length, 1);
  assert.match(report.mapping.badRows[0], /epics-1\.md:\d+ T-P1-03 \(7 cells, header has 4\)/);
  const r = cli(["--package", pkg, "--dry-run"]);
  assert.equal(r.status, 0, "a bad row alone does not change the exit code");
  assert.match(r.stderr, /warning: table row not read .*T-P1-03/);
});

test("row splitting: --gate fails on a row with the wrong cell count", { skip: SKIP }, () => {
  const pkg = mkpkg([PIPES]);
  assert.equal(cli(["--package", pkg]).status, 0);
  const g = cli(["--gate", "--package", pkg]);
  assert.equal(g.status, 1);
  assert.match(g.stderr, /Test Contract rows match their header.*T-P1-03/);
});

test("row splitting: handoff reads the Verify column with the same splitter", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wch-v-"));
  fs.writeFileSync(path.join(dir, "epics.md"), [
    "## V1 — verify", "", "- [ ] V1-01 x", "", "### Test Contract — V1 (BINDING: 100% pass or /iterate)", "Types: [unit] · Count: 1", "",
    "| ID | Check | Verify |", "|---|---|---|", "| T-V1-01 | `a | b` | auto |", "",
  ].join("\n"));
  const h = handoff(dir);
  assert.ok(!/Verify must be/.test(h.stdout + h.stderr), h.stdout + h.stderr);
});
