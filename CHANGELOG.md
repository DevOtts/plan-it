# Changelog

All notable changes to plan-it are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## 3.0.0 — 2026-07-09

The **field-hardened core** release — the public debut of the v3 line. Where v2
made the pipeline *deterministic* (an explicit statechart with persisted run
state and executable gate guards), v3 makes the delivery package *hard to fake*:
every enforcement mechanism below ships as a machine-checked invariant with a
binding Test Contract case, not documentation. All v3 verbs and statechart
states are strictly **additive** over v2 — the deterministic core (freeze
mechanism, `[REAL]` Test Contracts, existing `gate-check` verb semantics,
KICKOFF read-order, batched decision gate, and the byte-pinned statechart) is
untouched, verified additive-only by `gate-check machine-diff` against the v2
`fc6abc8` baseline. The mechanisms were folded in from a multi-squad field study
and then hardened across three internal waves; this release ships the whole line
as one clean v3 debut.

### Founder mandates
- **FD-1** — test-convention discovery → `CLAUDE.md` registration. New
  `gate-check testconv` verb researches the repo's test conventions and
  registers a receipt; contract hygiene (`W1`) requires the fenced conventions
  block. Exit code `2` = needs human registration.
- **FD-2** — pushed pre-freeze case review. The batched decision gate now
  surfaces `delivery/TEST-CONTRACT-REVIEW.md` (chat + file) before the CONTRACT
  can freeze.

### Write-time invariants (all hard-enforced)
- **W1 — contract hygiene**: `gate-check contract` validates the conventions
  block, idempotent conventions writes, and a `manual:`-share ceiling (>30% →
  warning + non-zero exit unless `--override-manual`).
- **W2 — environment preflight**: new `preflight` statechart state + `ENV-FACTS.md`
  probe manifest (PROBE_SET_S / PROBE_SET_ML), a 10s-budget probe timeout
  (SIGKILL), and a runnability gate — a case whose `run:` invokes a tool the
  manifest marks ABSENT/TIMEOUT fails as not-runnable.
- **W3 — model-tier enforcement**: RUN-POLICY tier table (top/mid/low); no
  hardcoded model IDs (regex `claude-[a-z0-9-]+`) in any plan artifact — the
  PreToolUse guard rejects the write.
- **W4 — status vocabulary**: the closed 4-term vocabulary
  (NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED).
  "done"/"complete"/"✅" in a deliverable without a VERIFIED token + case
  reference is rejected at write time and fails `handoff`.
- **W5 — computed, never typed**: all tallies derived by `gate-check reconcile`,
  which also runs automatically inside `handoff`.
- **W6 — kickoff pinning + packaging**: KICKOFF pins absolute repo path, git SHA,
  state.json path, and CONTRACT SHA-256, instructs re-derive-from-disk on resume,
  and bans fuzzy-resume language; packaging adds plugin↔marketplace parity and a
  corrected marketplace claim.

### Enforcement reach
Running v3 against a real *external* project layout (not plan-it's own dogfood)
surfaced two ways the freeze guard could be silently bypassed; both are closed,
fail-closed, with the protected v2 core still byte-identical.
- **E1 — freeze hardening no longer depends on invocation form or plan-it's own
  path.** The `casesReviewed` (C-W1-03) and RUN-POLICY-in-package checks now key
  off a discoverable run root (`.plan-it/state.json` resolved from the contract's
  canonical delivery path), not a `--dir` flag or the dogfood layout. A real
  project that freezes `delivery/CONTRACT.md` positionally no longer skips them; a
  freestanding v2 contract with no run state stays byte-identical.
- **E2 — `stripCode` no longer false-positives on a line-wrapped inline code
  span.** A `` `…<id>…` `` span wrapping across a newline is now stripped, but
  the strip bails on a paragraph break so a bare-prose `<id>` still fails closed.

### Adversarial-depth — the D4 crown-jewel lever
The single dimension v3 was built to win is **Test Contract quality (D4)**. A
head-to-head field trial against v2 exposed the gap: v3 had raised the
enforcement *floor* (traceability, honesty, computed counts) but not the
failure-mode *depth ceiling*, which is set UPSTREAM by the CONTRACT's core-logic
state machine. A thin machine (happy path + one failure) yields shallow tests
that still pass every other gate. v3.0.0 makes failure-mode depth an exit code,
not prose, via a new `adversary` verb wired as a hard gate (`adversaryGate`
state between `verify` and `handoff`) plus authoring teeth so the pipeline
*writes* deeper contracts. The gate is conditional on a declared state machine —
a genuinely linear/CRUD contract declares none and the whole gate is N/A (no
over-reach). Every demand is covered-or-waived; silent absence fails closed.

- **D4 — Test-Contract failure-mode depth is mechanized.**
  `node scripts/gate-check.mjs adversary <delivery-dir>` (guard
  `adversarialDepth`, transition `ADVERSARY_CLEAN`). Design-depth reads the
  frozen CONTRACT; coverage-depth reads the epics/cases.
- **D-A1 — the machine must model ≥1 failure state** (taxonomy on state names:
  FAIL/ERROR/ROLLBACK/ESCALAT/PARTIAL/ABORT/TIMEOUT/REJECT/DENIED/CANCEL), or
  reduce to a linear flow (N/A).
- **D-A2 — ≥1 recovery/compensation transition** — a failure state that is the
  source of an outgoing edge, or recovery vocabulary in the CONTRACT. A dead-end
  failure is a design gap or must be waived.
- **D-B1 — every declared failure state is an asserted case outcome** — an
  unreachable-in-tests failure state is a coverage hole.
- **D-B2 — every governance rule (G-n / CB-n) carries a test hook** — referenced
  by a case, an inline `(test: …)`, or an explicit WAIVED marker.
- **D-B3 — the five cascade classes each covered-or-waived**: partial-failure,
  rollback/compensation, failed-recovery→escalation, recovery/resume,
  adversarial-verify. Waivers may live in an epic or in `decisions.md`.

State extraction scopes to transition arrows + lifecycle enumerations only, so a
plain value enum (e.g. `ActionResult := OK | DENIED | ERROR`) never seeds a
phantom coverage obligation; cascade matchers are `\b`-bounded so "scrollback"
never false-passes rollback. Binding cases: `T-ADV-01` (deep→PASS), `T-ADV-02`
(thin→FAIL, names the three missing classes), `T-ADV-03` (linear→N/A), `T-ADV-04`
(waived→PASS).

**Validated against v2.** A fresh, blind head-to-head — a v3-authored package vs
a v2-authored package on one identical fuzzy brief, same model both arms — was
judged on D4 by two independent reviewers with the labels swapped, plus an
adversarial refutation checker. Result: **v3 wins the crown, D4 = 5 vs 3**, held
under both reviewers, with the checker confirming v2's package genuinely lacked
the rollback-failure→escalation and adversarial-re-verify cascades. The prior
tie is broken specifically on the dimension this release targets.

### Additive tooling
- New `gate-check` verbs: `contract`, `testconv`, `reconcile`, `machine-diff`,
  `preflight`, `pluginlint`, `mirror-check`, `adversary` (zero npm deps;
  `node:` builtins).
- **Mirror integrity**: 8 root↔`plugins/plan-it` pairs asserted byte-identical,
  wired into the release checklist so a release cannot finalize with mirror
  drift present.
- **C-META-01**: a fail-closed umbrella sweep that reads the CONTRACT's
  `## Cases` table and asserts every enforcement row is mechanism-ready and
  fail-closed.

### Deferred (scope-cut at the G2 decision gate, not shipped)
Cut from the bottom of the ranked backlog — never FD-1/FD-2/top-5: claims ledger,
case-taxonomy upgrade, universal write-time lint, credential procurement gate,
agent-I/O protocol hardening, and long-tail governance items. A Test-Contract-
review content-coverage gate was assessed and deferred (it needs a standardized
review-file schema that would require a CONTRACT amendment; review *existence* is
still gate-enforced today).

### Verification
100% binding-case pass is the Definition of SHIPPED. At release: `run-contract`
v2 51/51 + v3 25/25 fail-closed; `fail-closed-sweep` 25/25 enforcement rows
mechanism-ready with 0 gaps / 0 violations; `mirror-check` 8/8 byte-identical;
`machine-diff` additive-only against the v2 `fc6abc8` baseline;
`version-triple-match` + `changelog-shape` green. IMPLEMENTED-NOT-VERIFIED ships
nothing.

## 2.1.0

Hard gate enforcement via a PreToolUse hook on Claude Code plugin installs.

## 2.0.0

The deterministic core: an explicit statechart with persisted run state and
executable gate guards.

## 1.0.0

Initial release — the discovery → spec → agile-split planning pipeline with a
batched human-decision gate, a frozen shared CONTRACT, and a binding Test
Contract per epic.
