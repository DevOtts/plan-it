// ST-02 — plan-it creates status.json from epics via the shared writer.
// node --test tests/status-json/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildPlan, parseEpicText, resolveWriter, MARKER,
} from "../../plugins/plan-it/scripts/status-from-plan.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, "..", "fixtures", "status-json");
const CLI = path.join(HERE, "..", "..", "plugins", "plan-it", "scripts", "status-from-plan.mjs");
const WRITER_CANDIDATES = [
  "/Users/macbook/Workspace/Devotts/build-it-wt/st01/plugins/build-it/scripts/status/status-write.mjs",
  "/Users/macbook/Workspace/Devotts/build-it/plugins/build-it/scripts/status/status-write.mjs",
];
const WRITER = process.env.DOIT_STATUS_WRITE || WRITER_CANDIDATES.find((p) => fs.existsSync(p));
const SKIP = !(WRITER && fs.existsSync(WRITER))
  ? "shared writer (build-it status-write.mjs) not present yet; re-run after it merges"
  : !fs.existsSync(path.join(path.dirname(WRITER), "status-render.mjs"))
    ? "writer found but status-render.mjs (ST-06) not merged beside it yet; re-run after it merges"
    : false;

function copyPkg(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "st02-"));
  const dest = path.join(dir, "impl");
  fs.cpSync(path.join(FIX, name), dest, { recursive: true });
  return dest;
}
const runWriter = (args) => spawnSync(process.execPath, [WRITER, ...args], { encoding: "utf8" });

test("AT-01 / T-B-16 plan-it on fixture: parse yields 6 tasks", () => {
  const plan = buildPlan({ pkg: path.join(FIX, "pkg") });
  const tasks = plan.waves.flatMap((w) => w.tasks);
  assert.equal(tasks.length, 6);
  assert.equal(new Set(tasks.map((t) => t.id)).size, 6);
  assert.ok(tasks.some((t) => t.id === "FX-03"), "explicit id kept");
  assert.deepEqual(plan.waves.map((w) => w.id), ["W1", "W2"]);
  assert.equal(plan.pieces.length, 3);
  assert.ok(!JSON.stringify(plan).match(/"status"|done|verified/));
});

test("AT-01 / T-B-16 plan-it on fixture: full CLI writes valid status.json", { skip: SKIP }, () => {
  const pkg = copyPkg("pkg");
  const r = spawnSync(process.execPath, [CLI, "--package", pkg], {
    encoding: "utf8", env: { ...process.env, DOIT_STATUS_WRITE: WRITER },
  });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const doc = JSON.parse(fs.readFileSync(path.join(pkg, "status.json"), "utf8"));
  assert.equal(doc.schema, 1);
  const tasks = doc.waves.flatMap((w) => w.tasks);
  assert.equal(tasks.length, 6);
  assert.ok(tasks.every((t) => t.status === "not-started"));
  assert.deepEqual(doc.sessions, []);
  assert.deepEqual(doc.history, []);
  const v = runWriter(["validate", "--file", path.join(pkg, "status.json")]);
  assert.equal(v.status, 0, v.stderr);
});

test("re-running plan-it on an existing board merges and keeps build progress", { skip: SKIP }, () => {
  const pkg = copyPkg("pkg");
  const env = { ...process.env, DOIT_STATUS_WRITE: WRITER };
  assert.equal(spawnSync(process.execPath, [CLI, "--package", pkg], { encoding: "utf8", env }).status, 0);
  const file = path.join(pkg, "status.json");
  const first = JSON.parse(fs.readFileSync(file, "utf8")).waves.flatMap((w) => w.tasks)[0].id;
  const s = runWriter(["set", first, "--status", "in-progress", "--by", "build-it", "--file", file]);
  assert.equal(s.status, 0, s.stderr);
  const r = spawnSync(process.execPath, [CLI, "--package", pkg], { encoding: "utf8", env });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const tasks = JSON.parse(fs.readFileSync(file, "utf8")).waves.flatMap((w) => w.tasks);
  assert.equal(tasks.length, 6);
  assert.equal(tasks.find((t) => t.id === first).status, "in-progress");
  assert.equal(runWriter(["validate", "--file", file]).status, 0);
});

test("AT-02 STATUS.md rendered from JSON", { skip: SKIP }, () => {
  const pkg = copyPkg("pkg");
  const r = spawnSync(process.execPath, [CLI, "--package", pkg], {
    encoding: "utf8", env: { ...process.env, DOIT_STATUS_WRITE: WRITER },
  });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const md = fs.readFileSync(path.join(pkg, "delivery", "STATUS.md"), "utf8");
  assert.equal(md.split("\n")[0], MARKER);
  assert.match(md, /6\s+not-started|not-started[^\n]*6/i, "counts line shows 6 not-started");
  const view = JSON.parse(runWriter(["view", "--file", path.join(pkg, "status.json"), "--json"]).stdout);
  assert.equal(view.counts["not-started"], 6);
  assert.equal(view.total, 6);
});

test("resolver order: env wins; missing env target and nothing found are errors", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "st02-res-"));
  const w = path.join(dir, "w.mjs");
  fs.writeFileSync(w, "");
  const empty = { home: dir, pluginRoot: path.join(dir, "p", "plan-it"), repoRoot: path.join(dir, "r", "plan-it") };
  assert.deepEqual(resolveWriter({ ...empty, env: { DOIT_STATUS_WRITE: w } }), { path: w, source: "env" });
  assert.throws(() => resolveWriter({ ...empty, env: { DOIT_STATUS_WRITE: path.join(dir, "nope.mjs") } }), /DOIT_STATUS_WRITE/);
  assert.throws(() => resolveWriter({ ...empty, env: {} }), /status writer not found/);
  // sibling checkout is found when nothing else is
  const co = path.join(dir, "r", "build-it", "plugins", "build-it", "scripts", "status");
  fs.mkdirSync(co, { recursive: true });
  fs.writeFileSync(path.join(co, "status-write.mjs"), "");
  assert.equal(resolveWriter({ ...empty, env: {} }).source, "sibling-checkout");
  // env still wins over it
  assert.equal(resolveWriter({ ...empty, env: { DOIT_STATUS_WRITE: w } }).source, "env");
});

test("CLI exits non-zero with a clear message when the writer is missing", () => {
  const pkg = copyPkg("pkg");
  const r = spawnSync(process.execPath, [CLI, "--package", pkg], {
    encoding: "utf8", env: { ...process.env, DOIT_STATUS_WRITE: "/nonexistent/status-write.mjs" },
  });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /status writer not found/);
  assert.ok(!fs.existsSync(path.join(pkg, "status.json")));
});

test("epic with no checklist falls back to Test Contract groups", () => {
  const plan = buildPlan({ pkg: path.join(FIX, "pkg-nochecklist") });
  const tasks = plan.waves.flatMap((w) => w.tasks);
  assert.deepEqual(tasks.map((t) => t.id), ["E9-01", "E9-02"]);
  const sub = parseEpicText("## E5 — x\n\n### Test Contract — E5\n#### Happy\n| T-E5-01 | a |\n#### Edge\n| T-E5-02 | a |\n");
  assert.equal(sub[0].groups.length, 2);
});

test("--dry-run prints plan.json only and touches nothing", () => {
  const pkg = copyPkg("pkg");
  const r = spawnSync(process.execPath, [CLI, "--package", pkg, "--dry-run"], { encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).waves.flatMap((w) => w.tasks).length, 6);
  assert.ok(!fs.existsSync(path.join(pkg, "status.json")));
});
