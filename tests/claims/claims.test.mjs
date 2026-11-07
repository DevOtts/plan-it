// T-L1-01..05 (+ L1-04 handoff wiring, doc-it-missing behaviour of `claims`).
import test from "node:test";
import assert from "node:assert/strict";
import { gc, tmp, write, join, LEDGER_HEAD, docItCli, noDocItEnv, ROOT } from "../lib/trust-helpers.mjs";

const CLI = docItCli();
const withDocIt = CLI ? { env: { DOC_IT_CLI: CLI } } : null;
const skipNoDocIt = CLI ? false : "IMPLEMENTED-NOT-VERIFIED: doc-it CLI not found (set DOC_IT_CLI)";

function ledger(rows, preamble = "# Ledger\n\n") {
  return preamble + LEDGER_HEAD + rows.join("\n") + "\n";
}
function run(rows, opts = {}) {
  const d = tmp();
  const f = join(d, "claims.md");
  write(f, ledger(rows, opts.preamble));
  return gc(["claims", f], withDocIt);
}

test("T-L1-01 the do-it 1.1 ledger (every row of the real file) lints clean", { skip: skipNoDocIt }, () => {
  const r = gc(["claims", "tests/fixtures/claims/do-it-1.1.md"], withDocIt);
  assert.equal(r.code, 0, r.out);
  const rows = Number(/(\d+) row\(s\)/.exec(r.out)?.[1]);
  assert.ok(rows >= 24, `expected at least 24 rows, saw ${rows}`);
  console.log(`T-L1-01 rows linted: ${rows}`);
});

test("T-L1-01 the same command through the mirrored gate-check", { skip: skipNoDocIt }, () => {
  const r = gc(["claims", "tests/fixtures/claims/do-it-1.1.md"], { ...withDocIt, script: join(ROOT, "plugins/plan-it/skills/plan-it/scripts/gate-check.mjs") });
  assert.equal(r.code, 0, r.out);
});

test("T-L1-02 tier code with no sha anywhere: exit 1 naming the row and the sha/path rule", { skip: skipNoDocIt }, () => {
  const r = run(["| C7 | The loader skips hidden folders | code | read it in the repo |"]);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /row C7/);
  assert.match(r.out, /sha\/path rule/);
});

test("T-L1-02 a sha, a repo@sha or a path:line each satisfy the sha/path rule", { skip: skipNoDocIt }, () => {
  for (const src of ["`abc1234`", "do-it@abc1234", "`core/state.mjs:117`"]) {
    const r = run([`| C1 | The loader skips hidden folders | code | ${src} |`]);
    assert.equal(r.code, 0, `${src}: ${r.out}`);
  }
});

test("T-L1-02 a unknown tier is refused (tier enum read from doc-it)", { skip: skipNoDocIt }, () => {
  const r = run(["| C1 | x is y | gossip | `core/a.mjs:1` |"]);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /row C1/);
  assert.match(r.out, /tier enum/);
});

test("T-L1-02 an empty source is refused", { skip: skipNoDocIt }, () => {
  const r = run(["| C1 | x is y | live@2026-11-06 |  |"]);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /source present rule/);
});

test("T-L1-03 '5 credential ways' with tier code and no list: exit 1 count rule", { skip: skipNoDocIt }, () => {
  const r = run(["| C2 | There are 5 credential ways into the box | code | `src/auth.mjs:10` |"]);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /row C2/);
  assert.match(r.out, /count rule/);
});

test("T-L1-03 the same row passes with the list, or with a command that counts", { skip: skipNoDocIt }, () => {
  const withList = run(["| C2 | There are 5 credential ways into the box | code | `src/auth.mjs:10`: env, file, keychain, token, oauth |"]);
  assert.equal(withList.code, 0, withList.out);
  const withCmd = run(["| C2 | There are 5 credential ways into the box | code | `src/auth.mjs:10`; `grep -c 'case \"' src/auth.mjs` |"]);
  assert.equal(withCmd.code, 0, withCmd.out);
});

test("T-L1-04 tier program-doc as plain fact: exit 1 fact rule; 'the study says' passes", { skip: skipNoDocIt }, () => {
  const bad = run(["| C3 | The rollout takes two weeks | program-doc | `docs/plan.md` |"]);
  assert.equal(bad.code, 1, bad.out);
  assert.match(bad.out, /row C3/);
  assert.match(bad.out, /fact rule/);
  const good = run(["| C3 | The study says the rollout takes two weeks | program-doc | `docs/plan.md` |"]);
  assert.equal(good.code, 0, good.out);
  const pointer = run(["| C4 | The pager fires nightly | pointer | a chat message |"]);
  assert.equal(pointer.code, 1, pointer.out);
  assert.match(pointer.out, /fact rule/);
});

test("T-L1-05 findings doc 'your suspicion is confirmed' with no evidence-against heading: exit 1", () => {
  const d = tmp();
  const f = join(d, "01-findings.md");
  write(f, "# Findings\n\nYour suspicion is confirmed: the cache never expires.\n\n## Evidence for\n\n- read the loader\n");
  const r = gc(["claims", f], withDocIt ?? {});
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /evidence against/i);
});

test("T-L1-05 the same doc passes once it carries an Evidence against section with content", () => {
  const d = tmp();
  const f = join(d, "01-findings.md");
  write(f, "# Findings\n\nYour suspicion is confirmed: the cache never expires.\n\n## Evidence against\n\n- the TTL key exists in settings.json, so a config path might expire it; not found in use\n");
  assert.equal(gc(["claims", f], withDocIt ?? {}).code, 0);
  write(f, "# Findings\n\nYour suspicion is confirmed.\n\n## Evidence against\n\n## Next\n\nx\n");
  const empty = gc(["claims", f], withDocIt ?? {});
  assert.equal(empty.code, 1, empty.out);
  assert.match(empty.out, /evidence against/i);
  write(f, "# Findings\n\nThe cache was confirmed by a test run to be 3 s long.\n");
  assert.equal(gc(["claims", f], withDocIt ?? {}).code, 0, "plain 'confirmed' without a suspicion is not a hypothesis claim");
});

test("L1-02 without doc-it: prints '[skip] doc-it not installed: tier enum', never PASSes that rule, still runs the other rules", () => {
  const home = tmp("planit-home-");
  const d = tmp();
  const f = join(d, "claims.md");
  write(f, ledger(["| C1 | x is y | gossip | `core/a.mjs:1` |", "| C2 | z is w | code | nothing here |"]));
  const r = gc(["claims", f], noDocItEnv(home));
  assert.match(r.out, /\[skip\] doc-it not installed: tier enum/);
  assert.doesNotMatch(r.out, /tier enum clean/);
  assert.equal(r.code, 1, "sha/path rule still runs and fails row C2");
  assert.match(r.out, /sha\/path rule/);
  assert.doesNotMatch(r.out, /gossip/, "the tier enum rule must not run without doc-it");
});

test("L1-04 handoff runs claims for a decision-grade package (audit/claims.md present) and fails on a bad ledger", { skip: skipNoDocIt }, () => {
  const pkg = tmp();
  write(join(pkg, "delivery", "epics.md"), "# Epic E1 — x\n\n## Test Contract — E1\nCount: 1\n\n| ID | Task |\n|---|---|\n| T-E1-01 | a |\n");
  write(join(pkg, "audit", "claims.md"), ledger(["| C1 | x is y | code | no pointer |"]));
  const bad = gc(["handoff", join(pkg, "delivery")], withDocIt);
  assert.equal(bad.code, 1, bad.out);
  assert.match(bad.out, /sha\/path rule/);
  write(join(pkg, "audit", "claims.md"), ledger(["| C1 | x is y | code | `core/a.mjs:1` |"]));
  const good = gc(["handoff", join(pkg, "delivery")], withDocIt);
  assert.equal(good.code, 0, good.out);
});
