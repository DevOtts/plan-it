// T-V1-02 / T-V1-03 (V1-02, V1-03): shipped-layers probe and handoff checks.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gc, tmp, write, join, probeTarget, docItCli, behindFixture } from "../lib/trust-helpers.mjs";

const CLI = docItCli();
const ENV = CLI ? { env: { DOC_IT_CLI: CLI } } : {};

const EPICS = "# Epic E1 — x\n\n## Test Contract — E1\nCount: 1\n\n| ID | Task |\n|---|---|\n| T-E1-01 | a |\n";

function pkg({ size = "M", shipped = true, arch } = {}) {
  const d = tmp("planit-pkg-");
  write(join(d, "delivery", "epics.md"), EPICS);
  write(join(d, "plan.json"), JSON.stringify({ size, implementation: "x" }));
  if (shipped) write(join(d, "research", "SHIPPED-LAYERS.md"), "# Shipped layers\n\n| Layer | Where | What it shipped | Date |\n|---|---|---|---|\n| status board | 0-done/status | the status board | 2026-10-01 |\n");
  if (arch !== undefined) write(join(d, "docs", "02-architecture.md"), arch);
  return d;
}

test("T-V1-02 size M package without research/SHIPPED-LAYERS.md: handoff exit 1 naming the file", () => {
  const d = pkg({ shipped: false });
  const r = gc(["handoff", join(d, "delivery")], ENV);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /research\/SHIPPED-LAYERS\.md/);
});

test("T-V1-02 an empty SHIPPED-LAYERS.md fails too; size S needs none; the written file passes", () => {
  const empty = pkg({ shipped: false });
  write(join(empty, "research", "SHIPPED-LAYERS.md"), "  \n");
  assert.equal(gc(["handoff", join(empty, "delivery")], ENV).code, 1);
  const s = pkg({ size: "S", shipped: false });
  assert.equal(gc(["handoff", join(s, "delivery")], ENV).code, 0);
  const l = pkg({ size: "L", shipped: false });
  assert.equal(gc(["handoff", join(l, "delivery")], ENV).code, 1);
  const ok = pkg({ size: "M" });
  const r = gc(["handoff", join(ok, "delivery")], ENV);
  assert.equal(r.code, 0, r.out);
});

test("T-V1-03 02 doc proposes a new registry with no 'extends' citation: handoff exit 1 naming the section", () => {
  const d = pkg({ arch: "# Architecture\n\n## A. Stop gate\n\nExtends the shipped run scope.\n\n## B. Policy store\n\nThis section introduces a new policy registry for every host.\n" });
  const r = gc(["handoff", join(d, "delivery")], ENV);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /section "B\. Policy store"/);
  assert.doesNotMatch(r.out, /section "A\. Stop gate"/);
});

test("T-V1-03 the same section passes once it says what it extends, or 'none applies'", () => {
  const ext = pkg({ arch: "## B. Policy store\n\nThis section introduces a new policy registry. It extends the 0-done status board.\n" });
  assert.equal(gc(["handoff", join(ext.toString(), "delivery")], ENV).code, 0);
  const none = pkg({ arch: "## B. Policy store\n\nProposes a new registry. None applies: nothing shipped stores policy.\n" });
  assert.equal(gc(["handoff", join(none, "delivery")], ENV).code, 0);
  const plain = pkg({ arch: "## C. Notes\n\nThe registry is read at startup; the layer below it is unchanged.\n" });
  assert.equal(gc(["handoff", join(plain, "delivery")], ENV).code, 0, "mentioning a registry is not proposing one");
});

test("V1-02 preflight probe shipped-layers: PRESENT for M with the file, WARN (advisory) without, PRESENT for S", () => {
  const withFile = probeTarget("M", [{ id: "shipped-layers" }]);
  write(join(withFile, "research", "SHIPPED-LAYERS.md"), "# Shipped layers\n- a: shipped x\n");
  let r = gc(["preflight", "M", "--dir", withFile], ENV);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /shipped-layers: PRESENT/);
  const without = probeTarget("M", [{ id: "shipped-layers" }]);
  r = gc(["preflight", "M", "--dir", without], ENV);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /shipped-layers: WARN/);
  assert.match(readFileSync(join(without, "ENV-FACTS.md"), "utf8"), /\| shipped-layers \|[^\n]*\| WARN \|/);
  const s = probeTarget("S", [{ id: "shipped-layers" }]);
  assert.match(gc(["preflight", "S", "--dir", s], ENV).out, /shipped-layers: PRESENT/);
});

test("V1-02 the SHIPPED-LAYERS template ships in references/templates.md", () => {
  const t = readFileSync(join(import.meta.dirname, "..", "..", "references", "templates.md"), "utf8");
  assert.match(t, /research\/SHIPPED-LAYERS\.md/);
  assert.match(t, /\| Layer \| Where \| What it shipped/);
});

test("V1-03 KICKOFF pinning: a repo the preflight found behind must be pinned at its remote sha", { skip: CLI ? false : "IMPLEMENTED-NOT-VERIFIED: doc-it CLI not found" }, () => {
  const fx = behindFixture();
  const d = pkg();
  write(join(d, "delivery", "KICKOFF.md"), `# Kickoff\n\nPinned at ${fx.local.slice(0, 12)}\n`);
  const target = probeTarget("S", [{ id: "behind-remote", repos: [fx.behind] }]);
  gc(["preflight", "S", "--dir", target], ENV);
  write(join(d, "ENV-FACTS.md"), readFileSync(join(target, "ENV-FACTS.md"), "utf8"));
  let r = gc(["handoff", join(d, "delivery")], ENV);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /pins no remote sha/);
  write(join(d, "delivery", "KICKOFF.md"), `# Kickoff\n\nPinned at remote ${fx.remoteSha.slice(0, 12)}\n`);
  r = gc(["handoff", join(d, "delivery")], ENV);
  assert.equal(r.code, 0, r.out);
});
