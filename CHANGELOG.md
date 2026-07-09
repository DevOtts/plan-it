# Changelog

All notable changes to plan-it are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## 3.2.0 — 2026-07-08

The **adversarial-depth** release — the D4 crown-jewel lever. The same field
trial that seeded 3.1.0 scored v3 only a *tie* with v2 on **Test Contract
quality (D4)**: v3 raised the enforcement *floor* (traceability, honesty,
computed counts) but never touched the failure-mode *depth ceiling*, which is
set UPSTREAM by the CONTRACT's core-logic state machine. A thin machine (happy
path + one failure) yields shallow tests that still pass every other v3 gate.
This release makes failure-mode depth an exit code, not prose, via a new
`adversary` verb wired as a hard gate (`adversaryGate` state between `verify`
and `handoff`) plus authoring teeth so the pipeline *writes* deeper contracts.
All changes are additive: a new verb + a new state (same class as the 3.0/3.1
verbs/states), the protected v2 core stays byte-identical, and `machine-diff`
still reports an additive-only superset.

The gate is conditional on a declared state machine — a genuinely linear/CRUD
contract declares none and the whole gate is N/A (no over-reach; mirrors "no
run-state ⇒ no v3 demands"). Every demand is covered-or-waived; silent absence
fails closed.

- **D4 — Test-Contract failure-mode depth is now mechanized.** New
  `node scripts/gate-check.mjs adversary <delivery-dir>` (guard
  `adversarialDepth`, transition `ADVERSARY_CLEAN`). Design-depth reads the
  frozen CONTRACT; coverage-depth reads the epics/cases.
- **D-A1 — the machine must model ≥1 failure state** (taxonomy on state names:
  FAIL/ERROR/ROLLBACK/ESCALAT/PARTIAL/ABORT/TIMEOUT/REJECT/DENIED/CANCEL), or
  reduce to a linear flow (N/A).
- **D-A2 — ≥1 recovery/compensation transition** — a failure state that is the
  source of an outgoing edge, or recovery vocabulary in the CONTRACT. A
  dead-end failure is a design gap or must be waived.
- **D-B1 — every declared failure state is an asserted case outcome** — an
  unreachable-in-tests failure state is a coverage hole.
- **D-B2 — every governance rule (G-n / CB-n) carries a test hook** — referenced
  by a case, an inline `(test: …)`, or an explicit WAIVED marker.
- **D-B3 — the five cascade classes each covered-or-waived**: partial-failure,
  rollback/compensation, failed-recovery→escalation, recovery/resume,
  adversarial-verify. This is the "beat v2 by far" lever. Waivers may live in an
  epic or in `decisions.md` (v2's CB-1 pattern).

State extraction scopes to transition arrows + lifecycle enumerations only, so a
plain value enum (e.g. `ActionResult := OK | DENIED | ERROR`) never seeds a
phantom coverage obligation; cascade matchers are `\b`-bounded so "scrollback"
never false-passes rollback. New binding cases: `T-ADV-01` (deep→PASS),
`T-ADV-02` (thin→FAIL, names the three missing classes), `T-ADV-03`
(linear→N/A), `T-ADV-04` (waived→PASS). Full suite green: v2 51/51 + v3 25/25,
mirror-check 8/8, machine-diff additive.

## 3.1.0 — 2026-07-08

The **enforcement-reach** release. A head-to-head field trial (v2.1.0 vs 3.0.0
planning the same brief on an *external* project, not plan-it's own dogfood)
surfaced two ways the v3 freeze guard could be silently bypassed on a real
project layout, plus one enhancement that stays deferred. All changes are
additive checker-reach fixes in `gate-check.mjs` (+ its mirror); no statechart
state, verb, or frozen CONTRACT semantics changed — the protected v2 core stays
byte-identical, and `machine-diff` still reports an additive-only superset.

- **E1 — freeze hardening no longer depends on invocation form or plan-it's own
  path.** The `casesReviewed` (C-W1-03) and RUN-POLICY-in-package checks
  previously fired only in `freeze --dir` mode, and `--dir` hardcoded
  `delivery/v3/CONTRACT.md` (the dogfood layout). A real project freezes
  `delivery/CONTRACT.md` positionally, so the checks never ran and a package
  with no RUN-POLICY froze at exit 0. Fix (W3.1-2): the v3 checks now key off a
  discoverable run root (`.plan-it/state.json` resolved from the contract's
  canonical delivery path), not the flag; `--dir` also finds
  `delivery/CONTRACT.md`. A freestanding v2 contract with no run state stays
  byte-identical (no RUN-POLICY demanded).
- **E2 — `stripCode` no longer false-positives on a line-wrapped inline code
  span.** A `` `…<id>…` `` span that wrapped across a newline was not stripped,
  so the token tripped the frozen-contract placeholder scan. Fix (W3.1-1): the
  inline-span strip is newline-tolerant but bails on a paragraph break, so a
  bare-prose `<id>` still fails closed. (Same bug class as the earlier `/m` `$`
  truncation trap.)
- **E3 — Test-Contract-review content teeth: assessed, deferred (W3.1-3).**
  Giving the FD-2 review mechanical coverage teeth (every decision-ID/governance
  rule → ≥1 case) requires a standardized review-file schema that does not yet
  exist and cannot be added without a CONTRACT amendment; a heuristic parser
  would over-reach and block valid freezes. Deferred with a dated
  `delivery/decisions.md` entry (no silent drop). The belt-and-suspenders holds:
  review *existence* is still enforced at the decision `state` gate.

New binding cases: `T-W31-1a/1b` (E2 strip + fail-closed) and
`T-W31-2a/2b/2c/2d` (E1 reach + v2 byte-identical). Full suite green: v2 47/47 +
v3 25/25, mirror-check 8/8, machine-diff additive.

## 3.0.0 — 2026-07-08

The **field-hardened core** release. v3 folds the findings of the multi-squad
field study (`research-SYNTHESIS.md`, `research-FOUNDER-INPUT.md`) into
executable enforcement: every mechanism below ships as a machine-checked
invariant with a binding Test Contract case, not documentation. All v3 verbs
and statechart states are strictly **additive** over v2 — the deterministic
core (freeze mechanism, `[REAL]` Test Contracts, existing `gate-check` verb
semantics, KICKOFF read-order, batched decision gate, and the byte-pinned
statechart) is untouched (verified additive-only by `gate-check machine-diff`
against the v2 `fc6abc8` baseline).

### Founder mandates
- **FD-1** (backlog M1) — test-convention discovery → `CLAUDE.md` registration.
  New `gate-check testconv` verb researches the repo's test conventions and
  registers a receipt; contract hygiene (`W1`) requires the fenced conventions
  block. Exit code `2` = needs human registration.
- **FD-2** (backlog M2) — pushed pre-freeze case review. The batched decision
  gate now surfaces `delivery/TEST-CONTRACT-REVIEW.md` (chat + file) before the
  CONTRACT can freeze.

### Write-time invariants (all hard-enforced)
- **W1 — contract hygiene** (backlog M1): `gate-check contract` validates the
  conventions block, idempotent conventions writes, and a `manual:`-share
  ceiling (>30% → warning + non-zero exit unless `--override-manual`).
- **W2 — environment preflight** (backlog item 3): new `preflight` statechart
  state + `ENV-FACTS.md` probe manifest (PROBE_SET_S / PROBE_SET_ML), a
  10s-budget probe timeout (SIGKILL), and a runnability gate — a case whose
  `run:` invokes a tool the manifest marks ABSENT/TIMEOUT fails as not-runnable.
- **W3 — model-tier enforcement** (backlog item 8): RUN-POLICY tier table
  (top/mid/low); no hardcoded model IDs (regex `claude-[a-z0-9-]+`) in any plan
  artifact — the PreToolUse guard rejects the write.
- **W4 — status vocabulary**: the closed 4-term vocabulary
  (NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED). "done"/
  "complete"/"✅" in a deliverable without a VERIFIED token + case reference is
  rejected at write time and fails `handoff`.
- **W5 — computed, never typed**: all tallies derived by `gate-check reconcile`,
  which also runs automatically inside `handoff`.
- **W6 — kickoff pinning + packaging** (backlog items 4, 5): KICKOFF pins
  absolute repo path, git SHA, state.json path, and CONTRACT SHA-256, instructs
  re-derive-from-disk on resume, and bans fuzzy-resume language; packaging adds
  plugin↔marketplace parity and a corrected marketplace claim.

### Additive tooling
- New `gate-check` verbs: `contract`, `testconv`, `reconcile`, `machine-diff`,
  `preflight`, `pluginlint`, `mirror-check` (zero npm deps; `node:` builtins).
- **Mirror integrity** (areas D1–D3): 8 root↔`plugins/plan-it` pairs asserted
  byte-identical, wired into the release checklist so a `v3.0.0` CHANGELOG
  cannot finalize with mirror drift present.
- **Release & comms epic** (backlog item 11 / EC-D8): this versioned release,
  README refresh, CHANGELOG, and comms artifact.
- **C-META-01**: a fail-closed umbrella sweep that reads the CONTRACT's `## Cases`
  table and asserts every enforcement row is mechanism-ready and fail-closed.

### Deferred (G2 scope-cut, not shipped in 3.0.0)
Cut from the bottom of the ranked backlog at the G2 decision gate — never FD-1/
FD-2/top-5 (`delivery/decisions.md`): claims ledger (item 6), case-taxonomy
upgrade (item 7), universal write-time lint (item 9), credential procurement
gate (item 10), agent-I/O protocol hardening (item 12), and the long-tail (LT)
governance items.

### Verification
100% binding-case pass is the Definition of SHIPPED. At release: `run-contract`
v2 41/41 + v3 25/25 fail-closed; `fail-closed-sweep` 25/25 enforcement rows
mechanism-ready with 0 gaps / 0 violations; `mirror-check` 8/8 byte-identical;
`machine-diff` additive-only. IMPLEMENTED-NOT-VERIFIED ships nothing.

## 2.1.0

Hard gate enforcement via a PreToolUse hook on Claude Code plugin installs.

## 2.0.0

The deterministic core: an explicit statechart with persisted run state and
executable gate guards.

## 1.0.0

Initial release — the discovery → spec → agile-split planning pipeline with a
batched human-decision gate, a frozen shared CONTRACT, and a binding Test
Contract per epic.
