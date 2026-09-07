# Changelog

All notable changes to plan-it are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## 4.0.0 — 2026-09-07

The **autonomous-draft** release — the pipeline gains a default unattended
posture (opt out to guided mode), a topology axis for choosing how a run is
executed, a rendered HTML twin for every canonical markdown artifact, and
named concurrent runs. All v3.0.1 verbs and statechart states are strictly
**additive** — the protected v2/v3 core (freeze mechanism, closed status
vocabulary, existing `gate-check` verb semantics, KICKOFF read-order, batched
decision gate, byte-pinned statechart) is untouched, verified additive-only by
`gate-check machine-diff` against both the v2 `fc6abc8` and v3 `7fcff27`
baselines.

### Founder mandates
- **Ruling D1 — autonomous-draft is the default mode.** A run defaults to one
  up-front anamnesis questionnaire (gate G0) plus a single end-of-run
  PLAN-REVIEW round (gate G4) instead of three separate chat stops; guided
  mode (G1/G2/G3, unchanged from v3) remains available and is picked at
  anamnesis.
- **Ruling D6 — all ten enhancements ship together in 4.0.0.** No enhancement
  is scope-cut to a later release; all ten areas land as one release: E1
  (prose/packaging), E2 (renderer block catalogue), E3 (decisions/rulings), E4
  (sessions/orchestrator), E5 (adversarial mockups), E6
  (triage/closed-without-plan), E7 (statechart/draft-contract), E8
  (disposition vocabulary), E9 (named runs), E10 (glossary/first-use).
- Ratified at **PLAN-REVIEW** (gate G4) by Fernando Ott: defaults R1–R12
  confirmed as applied, authorizations A-1/A-3/A-4 granted, A-2 held until
  owner action O-2 — no contradictions raised.

### Write-time invariants (all hard-enforced, G-1…G-15)
- **G-7 — twins stay local.** Every canonical markdown artifact's `<NAME>.html`
  twin is rendered and created locally by default and never published as a
  claude.ai artifact; `--open` fires only at human gates and is suppressed
  entirely in headless runs.
- **G-8 — first-use rule.** Every acronym or per-run ID is expanded on first
  use on any human-facing surface; every package carries `GLOSSARY.md`, and an
  ID used but absent from it fails `handoff`.
- **G-9 — contract cases never move to backlog.** A binding Test Contract case
  that fails or cannot run stays `IMPLEMENTED-NOT-VERIFIED` with a reason;
  only work beyond the case set may be `backlog-with-reason`.
- **G-10 / G-11 — worktrees-only, poll-never-wait.** Every squad launch prompt
  states the worktrees-only rule (owner ruling P2-11) and never says "wait
  for" a notification — it says poll.
- **G-12 — facts are probed, never guessed.** A `measurement` block with
  `read_only:false` is a render error; an absent probe blacklists only its own
  tool, not every token that happens to share an argv[0].
- **G-13 — a draft contract never hands off.** `freeze` without `--draft`
  refuses a `-draft` header; `state` rejects `handoff` on a draft contract.
- **G-14 — mirror integrity 11/11 before any release** (up from 8/8 in
  3.0.1) — `scripts/build-report.mjs`, `scripts/report-template.html` and
  `assets/brand/default.brand.json` join the eight existing root↔plugin
  pairs.
- **G-15 — description budget.** The SKILL frontmatter `description` is
  ≤1,024 characters with the trigger phrases inside the first 250.
- G-1…G-6 (additive core, zero dependencies, closed status vocabulary, no
  hardcoded model IDs, computed-never-typed counts, markdown-canonical/
  HTML-derived) carry forward from v3 unchanged.

### Enforcement reach
- **Named runs.** `.plan-it/<slug>.state.json` lets two or more plan-it runs
  coexist in one repo without clobbering each other's state; every
  `gate-check` verb resolves the package dir from `run.deliveryRoot`
  (longest-prefix match), and the write guard (`planit-guard.mjs`, both
  copies) denies writes to an unfrozen *named* run's deliverables, not just
  the generic one.
- **Draft contracts.** A CONTRACT frozen mid-run in autonomous-draft mode
  carries a `-draft` header (`v1.0-draft`) until the human ratifies it at
  PLAN-REVIEW; a draft can never reach `handoff`, and a second contradiction
  of the same default is recorded as an open, escalated decision card rather
  than re-defaulted silently.
- **Disposition vocabulary.** `STATUS.md` gains a `Disposition` column plus
  `## Residuals` and `## Log`; a non-`VERIFIED` row without a disposition, or
  a typed `Dispositions:` tally that disagrees with the computed count, fails
  `reconcile`.

### Additive tooling
- New `gate-check` verbs: `archive`, `runs`, `glossary`, `mirror` (now with
  `--dir`/`--require-html`), `state --run`.
- New renderer: `scripts/build-report.mjs` turns a `planit-report/1` manifest
  into a stamped, brand-tokenized HTML twin — 17 block types (tables, cards,
  decision cards, embeds, mockups with provenance, flow diagrams, states
  triptychs, measurements, tallies, a glossary panel, and more), byte-
  deterministic given the same inputs.
- `references/templates.md` gains seven new document skeletons
  (`SCOPE-BRIEF.md`, `ANAMNESIS.md`, `DECISIONS.md`, `GATE.md`,
  `SESSIONS.md`, `PLAN-REVIEW.md`, `GLOSSARY.md`), each field-proven and
  mirrored root↔plugin.
- 8 new statechart states (25 total, additive over v3's 17) for anamnesis,
  scope brief, defaults, plan review and the draft-freeze path.

### Deferred
Nothing scope-cut for this release — ruling D6 keeps all ten E1–E10
enhancements together in 4.0.0. As in prior releases, long-tail governance
items and a standardized Test-Contract-review content-coverage gate remain
out of scope (review *existence* stays gate-enforced today).

### Verification
100% binding-case pass is the Definition of SHIPPED. At release: `run-contract`
v2 51/51 + v3 25/25 + v4 60/60 fail-closed (136/136 CONTRACT-level cases; 166
epic-level Test Contract cases across 13 epics per `delivery/v4/STATUS.md`'s
computed program totals); `fail-closed-sweep` 100% mechanism-ready;
`mirror-check 11/11` byte-identical; `machine-diff` additive-only against both
the v2 `fc6abc8` and v3 `7fcff27` baselines; `version-triple-match` = 4.0.0
across six sites + CHANGELOG; `changelog-shape` green.
IMPLEMENTED-NOT-VERIFIED ships nothing.

## 3.0.1 — 2026-07-09

Packaging patch — no pipeline or enforcement changes. Aligns plan-it with the
shared **DevOtts** plugin marketplace (which also hosts `fable-it`).

- **M1 — marketplace namespace.** The marketplace's `name` is renamed
  `plan-it` → `devotts`, so the install command is now
  `/plugin install plan-it@devotts` (was `plan-it@plan-it`). The GitHub add
  path is unchanged: `/plugin marketplace add DevOtts/plan-it`. The plugin
  itself is still named `plan-it`; only the marketplace namespace moved.
  **Breaking for anyone who already added the marketplace under the old name** —
  re-run the `add` step (or `/plugin marketplace remove plan-it` first).
- **M2 — version parity.** Bumped `3.0.0` → `3.0.1` across all six version
  mirrors (plugin.json, marketplace, both `SKILL.md` and both `machine.json`
  copies) so plan-it tracks the same release line as the other DevOtts plugins
  in the `devotts` marketplace. The release gates (`version-triple-match`,
  `changelog-shape`) are re-pinned to `3.0.1`; the mirror-integrity and
  additive-only guarantees from 3.0.0 are unchanged.

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
