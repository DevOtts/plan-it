// D-29 — duplicate task ids are renamed consistently (source, status.json, rename map).
// DOIT_STATUS_WRITE=<status-write.mjs> node --test tests/status-json/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildPlan } from "../../plugins/plan-it/scripts/status-from-plan.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, "..", "fixtures", "status-json");
const CLI = path.join(HERE, "..", "..", "plugins", "plan-it", "scripts", "status-from-plan.mjs");
const WRITER = process.env.DOIT_STATUS_WRITE
  || "/Users/macbook/Workspace/Devotts/build-it/plugins/build-it/scripts/status/status-write.mjs";
const SKIP = fs.existsSync(WRITER) && fs.existsSync(path.join(path.dirname(WRITER), "status-render.mjs"))
  ? false : "shared writer not present";
const env = { ...process.env, DOIT_STATUS_WRITE: WRITER };
const sh = (cwd, ...a) => spawnSync(a[0], a.slice(1), { cwd, encoding: "utf8" });

/** Copies the dup fixture to <tmp>/repo/impl; git-inits <tmp>/repo when asked. */
function setup({ git = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "d29-"));
  const repo = path.join(root, "repo");
  const pkg = path.join(repo, "impl");
  fs.cpSync(path.join(FIX, "pkg-dup"), pkg, { recursive: true });
  if (git) {
    sh(repo, "git", "init", "-q");
    sh(repo, "git", "config", "user.email", "t@t");
    sh(repo, "git", "config", "user.name", "t");
  }
  return { repo, pkg, epics: path.join(pkg, "delivery", "epics", "epics.md") };
}
const run = (pkg, ...extra) => spawnSync(process.execPath, [CLI, "--package", pkg, ...extra], { encoding: "utf8", env });
function snapshot(dir) {
  const out = {};
  const go = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === ".git") continue;
      const f = path.join(d, e.name);
      if (e.isDirectory()) go(f); else out[f] = fs.readFileSync(f, "utf8");
    }
  };
  go(dir);
  return out;
}
const ids = (doc) => doc.waves.flatMap((w) => w.tasks).map((t) => t.id);

test("D-29 duplicate id renamed in source, status.json and rename map; references follow", { skip: SKIP }, () => {
  const { pkg, epics } = setup();
  const before = fs.readFileSync(epics, "utf8").split("\n");
  const r = run(pkg);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /renamed ST-01 -> ST-05/);
  const src = fs.readFileSync(epics, "utf8").split("\n");
  // E1 untouched (lines 1-8); E2 item + references renamed
  assert.deepEqual(src.slice(0, 9), before.slice(0, 9));
  assert.match(src[11], /ST-05: Build the surface/);
  assert.match(src[12], /depends on ST-05 and writes evidence\/ST-05\.verdict\.md/);
  const doc = JSON.parse(fs.readFileSync(path.join(pkg, "status.json"), "utf8"));
  const got = ids(doc).sort();
  assert.deepEqual(got, ["ST-01", "ST-02", "ST-04", "ST-05"]);
  const map = JSON.parse(fs.readFileSync(path.join(pkg, "id-renames.json"), "utf8"));
  assert.equal(map.length, 1);
  const m = map[0];
  assert.equal(m.old, "ST-01"); assert.equal(m.new, "ST-05");
  assert.equal(m.file, "delivery/epics/epics.md");
  assert.match(fs.readFileSync(path.join(pkg, m.file), "utf8").split("\n")[m.line - 1], /ST-05/);
  assert.deepEqual(m.references_updated, [{ file: m.file, line: 13 }]);
  // invariants: source ids == status ids; map ids in both; old id defined once
  const plan = buildPlan({ pkg });
  assert.deepEqual(ids(plan).sort(), got);
  assert.ok(got.includes(m.new));
  const defs = fs.readFileSync(epics, "utf8").split("\n").filter((l) => /^\s*[-*]\s+\[[ xX]\]\s+ST-01\b/.test(l));
  assert.equal(defs.length, 1);
  assert.equal(spawnSync(process.execPath, [WRITER, "validate", "--file", path.join(pkg, "status.json")], { encoding: "utf8" }).status, 0);
});

test("D-29 outside reference fails loudly and changes nothing", { skip: SKIP }, () => {
  const { repo, pkg } = setup({ git: true });
  fs.mkdirSync(path.join(repo, "docs"));
  fs.writeFileSync(path.join(repo, "docs", "notes.md"), "line one\nsee ST-01 for details\n");
  sh(repo, "git", "add", "-A");
  const before = snapshot(repo);
  const r = run(pkg);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /docs\/notes\.md:2/);
  assert.deepEqual(snapshot(repo), before);
  assert.ok(!fs.existsSync(path.join(pkg, "status.json")));
  assert.ok(!fs.existsSync(path.join(pkg, "id-renames.json")));
});

test("D-29 inside a git repo with no outside reference the rename succeeds", { skip: SKIP }, () => {
  const { pkg } = setup({ git: true });
  const r = run(pkg);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.ok(!/skipped/.test(r.stdout));
});

test("D-29 not in a git repo: outside check is skipped and says so", { skip: SKIP }, () => {
  const { pkg } = setup();
  const r = run(pkg);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /outside-reference check skipped: not in a git repo/);
});

test("D-29 ambiguous reference (README in package) fails, nothing changed", { skip: SKIP }, () => {
  const { pkg } = setup();
  fs.writeFileSync(path.join(pkg, "README.md"), "Overview\nST-01 is the base task.\n");
  const before = snapshot(pkg);
  const r = run(pkg);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /README\.md:2/);
  assert.deepEqual(snapshot(pkg), before);
});

test("D-29 ambiguous reference inside the kept occurrence's block fails", { skip: SKIP }, () => {
  const { pkg, epics } = setup();
  const t = fs.readFileSync(epics, "utf8").replace("- [ ] ST-02: Add the cache", "- [ ] ST-02: Add the cache (needs ST-01)");
  fs.writeFileSync(epics, t);
  const before = snapshot(pkg);
  const r = run(pkg);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /epics\.md:7/);
  assert.deepEqual(snapshot(pkg), before);
});

test("D-29 a file name containing the old id is ambiguous", { skip: SKIP }, () => {
  const { pkg } = setup();
  fs.mkdirSync(path.join(pkg, "evidence"));
  fs.writeFileSync(path.join(pkg, "evidence", "ST-01.verdict.md"), "ok\n");
  const before = snapshot(pkg);
  const r = run(pkg);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /ST-01\.verdict\.md.*file name contains ST-01/);
  assert.deepEqual(snapshot(pkg), before);
});

test("D-29 --dry-run prints planned renames and writes nothing", { skip: SKIP }, () => {
  const { pkg } = setup();
  const before = snapshot(pkg);
  const r = run(pkg, "--dry-run");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /would rename ST-01 -> ST-05 at delivery\/epics\/epics\.md:12/);
  assert.deepEqual(snapshot(pkg), before);
});

test("D-29 re-run after rename finds no duplicates and keeps the map", { skip: SKIP }, () => {
  const { pkg } = setup();
  assert.equal(run(pkg).status, 0);
  const mapBefore = fs.readFileSync(path.join(pkg, "id-renames.json"), "utf8");
  const srcBefore = snapshot(path.join(pkg, "delivery"));
  const r = run(pkg);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.ok(!/renamed/.test(r.stdout));
  assert.equal(fs.readFileSync(path.join(pkg, "id-renames.json"), "utf8"), mapBefore);
  assert.deepEqual(snapshot(path.join(pkg, "delivery")), srcBefore);
});

test("D-29 live board needing a rename fails loudly, nothing changed", { skip: SKIP }, () => {
  const { pkg, epics } = setup();
  // board created from a clean plan, then a duplicate is introduced by hand
  const clean = fs.readFileSync(epics, "utf8");
  fs.writeFileSync(epics, clean.replace("ST-01: Build the surface", "ST-07: Build the surface"));
  assert.equal(run(pkg).status, 0);
  fs.writeFileSync(epics, fs.readFileSync(epics, "utf8").replace("ST-04: Polish the surface", "ST-02: Polish the surface"));
  const before = snapshot(pkg);
  const r = run(pkg);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /board already exists/);
  assert.deepEqual(snapshot(pkg), before);
});

test("D-29 generated-id collision is renamed in the map only (generated:true)", { skip: SKIP }, () => {
  const { pkg, epics } = setup();
  fs.writeFileSync(epics, [
    "## E1 — Foundation", "wave: W1", "",
    "- [ ] E1-02: Explicit one", "- Untitled bullet is not an item", "- [ ] Plain item without id", "",
  ].join("\n"));
  const r = run(pkg);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const map = JSON.parse(fs.readFileSync(path.join(pkg, "id-renames.json"), "utf8"));
  assert.equal(map.length, 1);
  assert.equal(map[0].old, "E1-02"); assert.equal(map[0].new, "E1-03");
  assert.equal(map[0].generated, true);
  assert.equal(map[0].line, 1);
  const doc = JSON.parse(fs.readFileSync(path.join(pkg, "status.json"), "utf8"));
  assert.deepEqual(ids(doc).sort(), ["E1-02", "E1-03"]);
  assert.match(fs.readFileSync(epics, "utf8"), /E1-02: Explicit one/);
  // idempotent
  const r2 = run(pkg);
  assert.equal(r2.status, 0, r2.stderr);
  assert.equal(JSON.parse(fs.readFileSync(path.join(pkg, "id-renames.json"), "utf8")).length, 1);
});
