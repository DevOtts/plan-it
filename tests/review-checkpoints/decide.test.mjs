// Table-driven tests for the review-checkpoint policy (CHECKPOINT-POLICY v1).
// Run: node --test tests/review-checkpoints/
import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { decideCheckpoints, checkBlock, sizePoints, InputError } from "../../plugins/plan-it/scripts/review-checkpoints.mjs";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../plugins/plan-it/scripts/review-checkpoints.mjs");

const HST_FLAGS = {
  cross_cutting: "one shared writer called by plan-it, build-it, review-it and conclude-it; touches the build-it run loop",
  new_surface: "new status.json schema, status-write CLI and the /doit-status mod",
  data: "status.json is the persisted source of truth for progress; a bad write shows a fake percent",
  prod_facing: "ships inside the plan-it and build-it plugins every session loads",
};

const CASES = [
  { name: "zero tasks", input: { tasks: 0 }, level: "none", score: 0, kinds: [] },
  { name: "single trivial task", input: { tasks: 1, waves: 1 }, level: "light", score: 0, kinds: ["pre-merge"] },
  {
    name: "high-importance small task (security + prod-facing)",
    input: { tasks: 1, flags: { security: "rotates the API signing secret", prod_facing: "live on the public API" } },
    level: "standard", score: 2, kinds: ["adversarial", "pre-merge", "pre-release"],
  },
  { name: "small money task", input: { tasks: 2, flags: { money: "changes the invoice rounding" } }, level: "light", score: 1, kinds: ["adversarial", "pre-merge"] },
  { name: "medium, no flags", input: { tasks: 6, waves: 2 }, level: "light", score: 1, kinds: ["pre-merge"] },
  { name: "medium, cross-cutting: first wave boundary only", input: { tasks: 6, waves: 3, flags: { cross_cutting: "shared schema" } }, level: "standard", score: 2, kinds: ["wave", "pre-merge"], at0: "after W1" },
  {
    name: "single wave, 6 tasks, new surface: phase checkpoint at the halfway task",
    input: { tasks: ["t1", "t2", "t3", "t4", "t5", "t6"], waves: 1, flags: { new_surface: "new CLI verb" } },
    level: "standard", score: 2, kinds: ["phase", "pre-merge"], at0: "after t3",
  },
  {
    name: "single wave with a declared interface lock",
    input: { tasks: 6, waves: 1, interface_lock_after: "t1", flags: { new_surface: "new CLI verb" } },
    level: "standard", score: 2, kinds: ["phase", "pre-merge"], at0: "after t1",
  },
  { name: "large, no flags, 5 waves: every wave boundary (size 3)", input: { tasks: 30, waves: 5 }, level: "standard", score: 3, kinds: ["wave", "wave", "wave", "wave", "pre-merge"] },
  { name: "wide plan: 3 tasks across 4 epics gets a size point", input: { tasks: 3, epics: 4 }, level: "light", score: 1, kinds: ["pre-merge"] },
  { name: "tasks but no waves declared count as one wave", input: { tasks: 2, waves: 0 }, level: "light", score: 0, kinds: ["pre-merge"] },
  {
    name: "worked example: harness-status-tracking",
    input: { tasks: 9, epics: 1, waves: 3, flags: HST_FLAGS },
    level: "heightened", score: 5, kinds: ["wave", "wave", "adversarial", "pre-merge", "pre-release"],
  },
  {
    name: "worked example: harness-status-tracking with its adversarial wave W3 (last wave)",
    input: { tasks: 9, epics: 1, waves: 3, adversarial_wave: "W3", flags: HST_FLAGS },
    level: "heightened", score: 5, kinds: ["wave", "wave", "adversarial", "pre-merge", "pre-release"], at2: "after W3, before pre-merge",
  },
  {
    name: "do-it 1.0.1 package, no adversarial wave declared",
    input: { tasks: 16, epics: 3, waves: 4, flags: { ...HST_FLAGS, owner_gated: "version bump, release and visibility need Fernando" } },
    level: "full", score: 7, kinds: ["wave", "wave", "wave", "adversarial", "pre-merge", "pre-release"],
  },
  {
    name: "worked example: do-it 1.0.1 package, adversarial wave W3 folds into its boundary",
    input: { tasks: 16, epics: 3, waves: 4, adversarial_wave: "W3", flags: { ...HST_FLAGS, owner_gated: "version bump, release and visibility need Fernando" } },
    level: "full", score: 7, kinds: ["wave", "wave", "adversarial", "pre-merge", "pre-release"], at2: "after W3",
  },
  {
    name: "adversarial wave declared but no adversarial trigger: stays a plain wave checkpoint",
    input: { tasks: 12, waves: 3, adversarial_wave: "W2", flags: { new_surface: "new verb" } },
    level: "standard", score: 3, kinds: ["wave", "pre-merge"],
  },
];

for (const c of CASES) {
  test(`decide: ${c.name}`, () => {
    const b = decideCheckpoints(c.input);
    assert.equal(b.level, c.level);
    assert.equal(b.score.total, c.score);
    assert.deepEqual(b.checkpoints.map((x) => x.kind), c.kinds);
    assert.equal(b.count, c.kinds.length);
    if (c.at0) assert.equal(b.checkpoints[0].at, c.at0);
    if (c.at2) assert.equal(b.checkpoints[2].at, c.at2);
    assert.deepEqual(checkBlock(b), []);
    b.checkpoints.forEach((cp, i) => {
      assert.equal(cp.id, `CP-${String(i + 1).padStart(2, "0")}`);
      assert.match(cp.evidence, /^plan\/reviews\/CP-\d{2}-[a-z-0-9]+\.md$/);
    });
  });
}

test("size points: bands and the epic bonus cap at 3", () => {
  const rows = [[0, 1, 0], [3, 1, 0], [4, 1, 1], [10, 1, 1], [11, 1, 2], [25, 1, 2], [26, 1, 3], [26, 9, 3], [11, 4, 3]];
  for (const [t, e, want] of rows) assert.equal(sizePoints(t, e), want, `tasks ${t}, epics ${e}`);
});

test("pre-merge is always present when there is at least one task", () => {
  for (let t = 1; t <= 40; t += 3) {
    assert.ok(decideCheckpoints({ tasks: t, waves: 3 }).checkpoints.some((c) => c.kind === "pre-merge"), `tasks ${t}`);
  }
});

test("inputs that cannot be trusted are refused", () => {
  const bad = [
    { tasks: 3, flags: { security: true } },
    { tasks: 3, flags: { security: "  " } },
    { tasks: 3, flags: { vibes: "it feels risky" } },
    { tasks: -1 },
    { tasks: 1.5 },
    { tasks: 3, epics: -2 },
    { tasks: 3, waves: 2, adversarial_wave: "W9", flags: { security: "auth change" } },
  ];
  for (const input of bad) assert.throws(() => decideCheckpoints(input), InputError, JSON.stringify(input));
});

test("checkBlock catches a tampered count and a missing pre-merge", () => {
  const b = decideCheckpoints({ tasks: 9, waves: 3, flags: HST_FLAGS });
  assert.match(checkBlock({ ...b, count: 1 }).join("\n"), /does not match/);
  const noMerge = { ...b, checkpoints: b.checkpoints.filter((c) => c.kind !== "pre-merge").map((c, i) => ({ ...c, id: `CP-0${i + 1}` })) };
  noMerge.count = noMerge.checkpoints.length;
  assert.match(checkBlock(noMerge).join("\n"), /pre-merge/);
});

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "planit-cp-"));
}
const run = (...a) => spawnSync(process.execPath, [SCRIPT, ...a], { encoding: "utf8" });

test("CLI decide --write merges into READINESS.json, keeps other keys, check passes", () => {
  const d = tmpdir();
  const readiness = path.join(d, "READINESS.json");
  const inputs = path.join(d, "inputs.json");
  fs.writeFileSync(readiness, JSON.stringify({ schema: "do-it-readiness/1", decisions: [{ id: "D1", status: "RESOLVED" }], preflight: { passed: true }, owner_dependent_slices: 0 }));
  fs.writeFileSync(inputs, JSON.stringify({ tasks: 9, waves: 3, flags: HST_FLAGS }));
  const r = run("decide", "--inputs", inputs, "--write", readiness, "--evidence-dir", "docs/implementations/hst/reviews");
  assert.equal(r.status, 0, r.stderr);
  const doc = JSON.parse(fs.readFileSync(readiness, "utf8"));
  assert.equal(doc.schema, "do-it-readiness/1");
  assert.equal(doc.decisions.length, 1);
  assert.equal(doc.review_checkpoints.count, 5);
  assert.equal(doc.review_checkpoints.checkpoints[0].evidence, "docs/implementations/hst/reviews/CP-01-wave-w1.md");
  assert.equal(run("check", readiness).status, 0);
  // Idempotent: a second decide gives the same block.
  assert.equal(run("decide", "--inputs", inputs, "--write", readiness, "--evidence-dir", "docs/implementations/hst/reviews").status, 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(readiness, "utf8")).review_checkpoints, doc.review_checkpoints);
  fs.rmSync(d, { recursive: true, force: true });
});

test("CLI decide --status derives tasks and waves from status.json", () => {
  const d = tmpdir();
  const inputs = path.join(d, "inputs.json");
  const status = path.join(d, "status.json");
  fs.writeFileSync(inputs, JSON.stringify({ tasks: 0, flags: { cross_cutting: "shared writer" } }));
  fs.writeFileSync(status, JSON.stringify({ schema: 1, waves: [{ id: "W1", tasks: [{ id: "A" }, { id: "B" }, { id: "C" }] }, { id: "W2", tasks: [{ id: "D" }, { id: "E" }] }] }));
  const r = run("decide", "--inputs", inputs, "--status", status);
  assert.equal(r.status, 0, r.stderr);
  const b = JSON.parse(r.stdout);
  assert.equal(b.inputs.tasks, 5);
  assert.deepEqual(b.inputs.waves, ["W1", "W2"]);
  assert.deepEqual(b.checkpoints.map((c) => c.kind), ["wave", "pre-merge"]);
  fs.rmSync(d, { recursive: true, force: true });
});

test("CLI exit codes: missing READINESS is 2, flag without reason is 1, no block is 1", () => {
  const d = tmpdir();
  const inputs = path.join(d, "inputs.json");
  fs.writeFileSync(inputs, JSON.stringify({ tasks: 2 }));
  assert.equal(run("decide", "--inputs", inputs, "--write", path.join(d, "nope.json")).status, 2);
  fs.writeFileSync(inputs, JSON.stringify({ tasks: 2, flags: { data: true } }));
  const r = run("decide", "--inputs", inputs);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /without a reason/);
  const readiness = path.join(d, "R.json");
  fs.writeFileSync(readiness, "{}");
  assert.equal(run("check", readiness).status, 1);
  fs.rmSync(d, { recursive: true, force: true });
});

// H-10: a wave checkpoint holds the dependents and the promotion of the work it
// covers, never the whole next wave.
const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

test("gates and covers: wave checkpoints hold dependents and promotion of the covered wave only", () => {
  const b = decideCheckpoints(JSON.parse(fs.readFileSync(path.join(FIX, "three-waves.inputs.json"), "utf8")));
  assert.deepEqual(b.checkpoints.map((c) => [c.id, c.kind]), [["CP-01", "wave"], ["CP-02", "wave"], ["CP-03", "pre-merge"], ["CP-04", "pre-release"]]);
  const [cp1, cp2, cp3, cp4] = b.checkpoints;
  assert.deepEqual(cp1.gates, ["dependents", "promotion"]);
  assert.deepEqual(cp1.covers, ["W0"]);
  assert.equal(cp1.blocks, "slices that depend on W0 work, and promotion of W0 work");
  assert.deepEqual(cp2.covers, ["W1"]);
  assert.deepEqual(cp3.gates, ["merge"]);
  assert.deepEqual(cp4.gates, ["release"]);
  assert.deepEqual(cp3.covers, ["W0", "W1", "W2"]);
  for (const c of b.checkpoints) assert.doesNotMatch(c.blocks, /^start of/);
  assert.deepEqual(checkBlock(b), []);
});

test("gates: an adversarial wave mid-plan holds dependents; the closing adversarial holds merge", () => {
  const mid = decideCheckpoints({ tasks: 16, epics: 3, waves: 4, adversarial_wave: "W3", flags: { ...HST_FLAGS, owner_gated: "release needs the owner" } });
  const adv = mid.checkpoints.find((c) => c.kind === "adversarial");
  assert.deepEqual(adv.gates, ["dependents"]);
  assert.deepEqual(adv.covers, ["W3"]);
  assert.equal(adv.blocks, "slices that depend on W3 work");
  const last = decideCheckpoints({ tasks: 9, waves: 3, flags: HST_FLAGS }).checkpoints.find((c) => c.kind === "adversarial");
  assert.deepEqual(last.gates, ["merge"]);
  assert.equal(last.blocks, "merge to main");
});

test("gates: a phase checkpoint covers the tasks up to the lock, or leaves covers out when only a count is known", () => {
  const withIds = decideCheckpoints({ tasks: ["t1", "t2", "t3", "t4", "t5", "t6"], waves: 1, flags: { new_surface: "new CLI verb" } }).checkpoints[0];
  assert.deepEqual(withIds.gates, ["dependents", "promotion"]);
  assert.deepEqual(withIds.covers, ["t1", "t2", "t3"]);
  const countOnly = decideCheckpoints({ tasks: 6, waves: 1, flags: { new_surface: "new CLI verb" } }).checkpoints[0];
  assert.equal(countOnly.covers, undefined);
  const lock = decideCheckpoints({ tasks: 6, waves: 1, interface_lock_after: "t1", flags: { new_surface: "new CLI verb" } }).checkpoints[0];
  assert.deepEqual(lock.covers, ["t1"]);
});

test("checkBlock refuses unknown gates and malformed covers", () => {
  const b = decideCheckpoints({ tasks: 6, waves: 3, flags: { cross_cutting: "shared schema" } });
  const bad = JSON.parse(JSON.stringify(b));
  bad.checkpoints[0].gates = ["next-wave"];
  assert.match(checkBlock(bad).join("\n"), /gates must be/);
  bad.checkpoints[0].gates = ["dependents"];
  bad.checkpoints[0].covers = "W1";
  assert.match(checkBlock(bad).join("\n"), /covers must be/);
});

test("CLI decide --write tags each READINESS slice with its wave", () => {
  const d = tmpdir();
  const readiness = path.join(d, "READINESS.json");
  fs.copyFileSync(path.join(FIX, "three-waves.READINESS.json"), readiness);
  const r = run("decide", "--inputs", path.join(FIX, "three-waves.inputs.json"), "--write", readiness);
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stderr, /carry no wave/);
  const doc = JSON.parse(fs.readFileSync(readiness, "utf8"));
  assert.deepEqual(doc.slices.map((s) => [s.id, s.wave]), [["A0", "W0"], ["B0", "W0"], ["A1", "W1"], ["B1", "W1"], ["A2", "W2"], ["B2", "W2"]]);
  assert.deepEqual(doc.slices[3].depends_on, ["A0"]);
  assert.equal(run("check", readiness).status, 0);
  fs.rmSync(d, { recursive: true, force: true });
});

test("CLI decide --write warns, naming them, when slices match no wave task list", () => {
  const d = tmpdir();
  const readiness = path.join(d, "READINESS.json");
  fs.writeFileSync(readiness, JSON.stringify({ decisions: [], preflight: { passed: true }, slices: [{ id: "S1" }, { id: "S2" }] }));
  const inputs = path.join(d, "inputs.json");
  fs.writeFileSync(inputs, JSON.stringify({ tasks: 6, waves: 3, flags: { cross_cutting: "shared schema" } }));
  const r = run("decide", "--inputs", inputs, "--write", readiness);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /2 slice\(s\) carry no wave.*S1, S2/);
  assert.equal(JSON.parse(fs.readFileSync(readiness, "utf8")).slices[0].wave, undefined);
  fs.rmSync(d, { recursive: true, force: true });
});
