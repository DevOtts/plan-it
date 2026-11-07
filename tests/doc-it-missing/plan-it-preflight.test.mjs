// T-K2-03 (plan-it part, K2-03): no doc-it on the machine means the [skip] line, never PASS.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gc, tmp, write, join, probeTarget, noDocItEnv, behindFixture } from "../lib/trust-helpers.mjs";

test("T-K2-03 plan-it preflight on a temp HOME without doc-it prints '[skip] doc-it not installed' and reports no doc-it check as PASS", () => {
  const home = tmp("planit-home-");
  const fx = behindFixture();
  const target = probeTarget("S", [{ id: "behind-remote", repos: [fx.behind] }]);
  const r = gc(["preflight", "S", "--dir", target], noDocItEnv(home));
  assert.equal(r.code, 0, `a missing doc-it never fails the gate: ${r.out}`);
  assert.match(r.out, /\[skip\] doc-it not installed: behind-remote/);
  assert.match(r.out, /behind-remote: WARN — doc-it not installed/);
  assert.doesNotMatch(r.out, /behind-remote: PASS|behind-remote: PRESENT/);
  const facts = readFileSync(join(target, "ENV-FACTS.md"), "utf8");
  const row = facts.split("\n").find((l) => l.startsWith("| behind-remote "));
  assert.match(row, /\| WARN \| doc-it not installed/);
  assert.doesNotMatch(row, /PRESENT/);
});

test("T-K2-03 the lookup honours HOME: a doc-it copy in the plugin cache is found, the newest version wins", () => {
  const home = tmp("planit-home-");
  const fx = behindFixture();
  for (const v of ["0.1.0", "0.2.0"]) {
    write(join(home, ".claude", "plugins", "cache", "any-market", "doc-it", v, "scripts", "doc-it.mjs"),
      `console.log(JSON.stringify([{repo:process.argv[4],status:"behind",default_branch:"main",local:"aaaaaaa1",remote:"bbbbbbb${v === "0.2.0" ? "2" : "1"}",behind:1,ahead:0,uncommitted:0}])); process.exit(1);\n`);
  }
  const target = probeTarget("S", [{ id: "behind-remote", repos: [fx.behind] }]);
  const r = gc(["preflight", "S", "--dir", target], noDocItEnv(home));
  assert.match(r.out, /remote bbbbbbb2/, r.out);
});

test("T-K2-03 handoff without doc-it skips the tier-enum check with the [skip] line and does not PASS it", () => {
  const home = tmp("planit-home-");
  const pkg = tmp("planit-pkg-");
  write(join(pkg, "delivery", "epics.md"), "# Epic E1 — x\n\n## Test Contract — E1\nCount: 1\n\n| ID | Task |\n|---|---|\n| T-E1-01 | a |\n");
  write(join(pkg, "audit", "claims.md"), "| ID | Claim | Tier | Source |\n|---|---|---|---|\n| C1 | x | code | `a/b.mjs:1` |\n");
  const r = gc(["handoff", join(pkg, "delivery")], noDocItEnv(home));
  assert.match(r.out, /\[skip\] doc-it not installed: tier enum/);
  assert.doesNotMatch(r.out, /tier enum clean/);
});

test("I1-03 handoff prints 'init-it not installed' when the init-it plugin is missing, and not when it is installed", () => {
  const home = tmp("planit-home-");
  const pkg = tmp("planit-pkg-");
  write(join(pkg, "delivery", "epics.md"), "# Epic E1 — x\n\n## Test Contract — E1\nCount: 1\n\n| ID | Task |\n|---|---|\n| T-E1-01 | a |\n");
  let r = gc(["handoff", join(pkg, "delivery")], noDocItEnv(home));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /init-it not installed/);
  write(join(home, ".claude", "plugins", "cache", "devotts", "init-it", "0.1.0", "x"), "x");
  r = gc(["handoff", join(pkg, "delivery")], noDocItEnv(home));
  assert.doesNotMatch(r.out, /init-it not installed/);
});
