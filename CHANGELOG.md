# Changelog

All notable changes to plan-it are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

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
