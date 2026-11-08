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

// D3 (CP-02): doc-it status "error" / unparseable output is never PRESENT; the KICKOFF pin check treats the repo as unverified.
import { mkdtempSync, writeFileSync as wf } from "node:fs";
import { tmpdir } from "node:os";

test("D3 a clone 3 behind with an unreachable origin: WARN UNVERIFIED with the reason, never PRESENT", { skip }, () => {
  const fx = behindFixture();
  spawnSync("git", ["-C", fx.behind, "remote", "set-url", "origin", "/nonexistent/remote.git"], { encoding: "utf8" });
  const target = probeTarget("S", [{ id: "behind-remote", repos: [fx.behind] }]);
  const r = gc(["preflight", "S", "--dir", target], { env: { DOC_IT_CLI: CLI } });
  assert.doesNotMatch(r.out, /behind-remote: PRESENT/, r.out);
  assert.doesNotMatch(r.out, /up to date/, r.out);
  assert.match(r.out, /behind-remote: WARN — [^\n]*UNVERIFIED — fetch failed/);
  assert.doesNotMatch(r.out, /undefined/);
  const row = readFileSync(join(target, "ENV-FACTS.md"), "utf8").split("\n").find((l) => l.startsWith("| behind-remote "));
  assert.match(row, /\| WARN \|/);
});

test("D3 a non-git directory is WARN UNVERIFIED (not a git repository), never PRESENT", { skip }, () => {
  const notRepo = mkdtempSync(join(tmpdir(), "planit-notrepo-"));
  const target = probeTarget("S", [{ id: "behind-remote", repos: [notRepo] }]);
  const r = gc(["preflight", "S", "--dir", target], { env: { DOC_IT_CLI: CLI } });
  assert.doesNotMatch(r.out, /behind-remote: PRESENT/, r.out);
  assert.match(r.out, /UNVERIFIED — not a git repository/);
});

test("D3 handoff: an UNVERIFIED repo with no pin and no explicit note in the KICKOFF fails; stating it unverified passes", { skip }, () => {
  const fx = behindFixture();
  spawnSync("git", ["-C", fx.behind, "remote", "set-url", "origin", "/nonexistent/remote.git"], { encoding: "utf8" });
  const target = probeTarget("S", [{ id: "behind-remote", repos: [fx.behind] }]);
  gc(["preflight", "S", "--dir", target], { env: { DOC_IT_CLI: CLI } });
  const facts = readFileSync(join(target, "ENV-FACTS.md"), "utf8");
  assert.match(facts, /UNVERIFIED/);
  wf(join(target, "KICKOFF.md"), "# Kickoff\n\nBuild against the repo as checked out.\n");
  const bad = gc(["handoff", target]);
  assert.match(bad.out, /could not verify/, bad.out);
  wf(join(target, "KICKOFF.md"), `# Kickoff\n\nNote: ${fx.behind} is unverified against origin (fetch failed).\n`);
  const good = gc(["handoff", target]);
  assert.doesNotMatch(good.out, /could not verify/, good.out);
});
