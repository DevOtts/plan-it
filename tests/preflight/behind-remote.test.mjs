// T-V1-01 (V1-01): preflight probe behind-remote.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { gc, probeTarget, behindFixture, docItCli, join } from "../lib/trust-helpers.mjs";

const CLI = docItCli();
const skip = CLI ? false : "IMPLEMENTED-NOT-VERIFIED: doc-it CLI not found (set DOC_IT_CLI)";

test("T-V1-01 local main 3 behind its remote: probe WARN names the repo, local and remote sha; ENV-FACTS records the remote sha", { skip }, () => {
  const fx = behindFixture();
  const target = probeTarget("S", [{ id: "behind-remote", repos: [fx.behind] }]);
  const r = gc(["preflight", "S", "--dir", target], { env: { DOC_IT_CLI: CLI } });
  assert.equal(r.code, 0, `WARN is advisory, the gate stays green: ${r.out}`);
  assert.match(r.out, /behind-remote: WARN/);
  assert.ok(r.out.includes(fx.behind), "names the repo");
  assert.ok(r.out.includes(fx.local.slice(0, 12)), `local sha in: ${r.out}`);
  assert.ok(r.out.includes(fx.remoteSha.slice(0, 12)), `remote sha in: ${r.out}`);
  assert.match(r.out, /3 behind/);
  const facts = readFileSync(join(target, "ENV-FACTS.md"), "utf8");
  const row = facts.split("\n").find((l) => l.startsWith("| behind-remote "));
  assert.ok(row, facts);
  assert.match(row, /\| WARN \|/);
  assert.ok(row.includes(fx.remoteSha.slice(0, 12)), `ENV-FACTS records the remote sha: ${row}`);
  assert.ok(row.includes(fx.local.slice(0, 12)));
});

test("T-V1-01 an up-to-date clone is PRESENT and still records the remote sha", { skip }, () => {
  const fx = behindFixture();
  spawnSync("git", ["-C", fx.behind, "pull", "-q", "--ff-only"], { encoding: "utf8" });
  const target = probeTarget("S", [{ id: "behind-remote", repos: [fx.behind] }]);
  const r = gc(["preflight", "S", "--dir", target], { env: { DOC_IT_CLI: CLI } });
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /behind-remote: PRESENT/);
  assert.ok(readFileSync(join(target, "ENV-FACTS.md"), "utf8").includes(fx.remoteSha.slice(0, 12)));
});
