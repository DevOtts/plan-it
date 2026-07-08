# Epics — plan-it v3, Squad A: gate-check verbs & FD enforcement

Companion to `delivery/v3/prds/prd-1-gatecheck-fd.md`. Law: `delivery/v3/CONTRACT.md`
v1.0 FROZEN — never edited by this lane.

**Naming note:** epic IDs below (A1-A4) are this lane's epic numbering
(`delivery/v3/00-program-plan.md` lane "A"). They are **not** the same as the
FD-1 draft *case* IDs A1-A4 (`delivery/TEST-CONTRACT-REVIEW.md` §A) or the
FD-2 draft *case* IDs B1-B3 (§B). Every reference below says "case A1" /
"case B2" / etc. for case IDs, and "Epic A1" / "Epic A3" for epic IDs, to keep
the two namespaces apart.

Status vocabulary used below: NOT-STARTED only (this is the planning
artifact; no code has been written by this lane yet).

---

## Epic A1 — Fixture & harness foundation (Wave 0)

Branch: `epic/a1-fixture-harness` off `v2/deterministic-core`
Dependencies: none (Wave 0 — must land before Epics A2-A4 can run their
binding cases, and before Squad B/C's own enforcement rows can be
fail-closed-swept)
Status: NOT-STARTED

### Task checklist

- [ ] Extend `tests/run-contract.mjs` with a v3 section, appended before the
  report block at `tests/run-contract.mjs:296-307`, following the existing
  `t(id, name, fn)` / `assert()` / `gc()` helper pattern already defined at
  `tests/run-contract.mjs:17-37` — no new test-runner mechanism invented.
- [ ] Add `tests/v3/fail-closed-sweep.mjs` (case **C-META-01**): parse
  `delivery/v3/CONTRACT.md`'s case table (the same `|...|` row shape
  `scripts/gate-check.mjs:129,141` already regex-matches) to extract every
  row's `run:` cell — COMPUTED, per the W5 invariant at `CONTRACT.md:41`,
  never a hand-copied list of the 26 rows. Execute each command
  (`execFileSync`, shell-split), assert non-zero exit. Report any row whose
  fixture/script is missing as a named gap (expected for Squad B/C rows until
  their epics land — not a false pass).
- [ ] Add `--dir <path>` argument parsing as a small shared helper (e.g.
  `parseDirFlag(args)` near `scripts/gate-check.mjs:56` alongside the
  existing `PLACEHOLDER_RE`/`stripCode` helpers) usable by `contract`,
  `testconv`, `reconcile`, and the `freeze`/`state` extensions in Epics
  A2-A4 — built once here so all four verbs share one parsing convention
  (PRD §2 D2).
- [ ] Scaffold `tests/fixtures/v3/` — **18 fully-specified dirs** (this
  lane's own cases) + **15 stub dirs** (naming-convention placeholders for
  Squad B/C's rows, each holding a `README.md` stating the row's frozen
  `run:` command from `CONTRACT.md` verbatim and `NOT-STARTED`, so no
  cross-squad naming drift). Fully-specified dirs (case → minimal contents):
  - `no-conventions/` — `CLAUDE.md` with no `<!-- plan-it:test-conventions -->`
    block; a `tests/dummy.test.js` so the repo "has tests"; minimal
    `delivery/v3/CONTRACT.md` copy for the `contract` verb to lint. *(cases
    C-W1-01, A2 — reused by both)*
  - `pkg-no-case/` — CONTRACT.md copy with zero `@case-packaging` rows +
    a `DIFF-MANIFEST.txt` naming `plugin.json` as touched. *(C-W1-04)*
  - `no-run-col/` — CONTRACT.md copy with one case row missing its `run:`
    cell. *(C-W1-05)*
  - `manual-heavy/` — CONTRACT.md copy where >30% of `run:` cells are
    `manual:...`. *(C-W1-06)*
  - `tally-drift/` — CONTRACT.md copy with a hand-typed `Tally: N/M` line
    disagreeing with the counted `@case-` rows. *(C-W5-01)*
  - `unreviewed/` — `.plan-it/state.json` with `casesReviewed: false` +
    `delivery/v3/CONTRACT.md`. *(C-W1-03)*
  - `orphan-req/` — `delivery/v3/prds/prd-x.md` with a requirement ID no
    epic references. *(C-W5-02)*
  - `epic-no-cases/` — `delivery/v3/epics/epics-x.md` with an epic heading
    and zero Binding Test Contract rows under it. *(C-W5-03)*
  - `reconcile-embed-check/` — combines `orphan-req` + `epic-no-cases`
    content in one dir, used by both the standalone and embedded assertions.
    *(C-W5-04)*
  - `conventions-present/` — `CLAUDE.md` WITH a well-formed
    `<!-- plan-it:test-conventions -->...<!-- /plan-it:test-conventions -->`
    block + a matching receipt in `.plan-it/state.json`. *(case A1)*
  - `conventions-stale/` — `.plan-it/state.json` with an existing
    `testConventions.registered: true` receipt, but `CLAUDE.md` no longer
    contains the block. *(case A3)*
  - `conventions-declined/` — `.plan-it/state.json` receipt with
    `declined: true, by: "user"` + date, no block required. *(case A4)*
  - `no-review-file/` — `.plan-it/state.json` with `gates.G2.approved: true`,
    no `delivery/TEST-CONTRACT-REVIEW.md` present. *(case B1)*
  - `review-no-ack/` — `delivery/TEST-CONTRACT-REVIEW.md` present but
    missing the `Reviewed-by: <name> <date>` line; G2 approved true.
    *(case B2)*
  - `draft-case-orphan/` — `delivery/TEST-CONTRACT-REVIEW.md` with one extra
    synthetic draft case ID not mapped in any epic and no
    `decisions.md` drop entry. *(case B3)*
  - (`no-conventions/` reused for both C-W1-01 and A2 — one dir, two
    assertions, listed once above.)
- [ ] `tests/v3/conventions-idempotent.mjs` (case **C-W1-02**): script-managed
  temp dir (`mkdtempSync`, same pattern as `tests/run-contract.mjs:113-121`),
  no static fixture — runs the registration path twice, asserts exactly one
  fenced block.
- [ ] `tests/v3/reconcile-embedded.mjs` (case **C-W5-04**): asserts
  `gate-check reconcile --dir tests/fixtures/v3/reconcile-embed-check`
  fails standalone, AND `gate-check handoff --dir
  tests/fixtures/v3/reconcile-embed-check` (or equivalent handoff invocation
  wrapping the same dir) fails with the same reconcile-sourced messages —
  proving the embedding in Epic A4's `cmdHandoff` extension actually runs.

### Binding Test Contract

| ID | @tag | [REAL] case | run: | fixture | Covers |
|---|---|---|---|---|---|
| T-A1-01 | @case-machine | [REAL] fail-closed sweep exits non-zero on every enforcement row whose fixture/script exists, and names any row still missing its mechanism | `node tests/v3/fail-closed-sweep.mjs` | n/a — reads `delivery/v3/CONTRACT.md` directly | C-META-01 |

---

## Epic A2 — `contract` verb: W1 hygiene + W5 tally

Branch: `epic/a2-contract-verb` off `v2/deterministic-core`
Dependencies: Epic A1 (fixtures `no-conventions/`, `pkg-no-case/`,
`no-run-col/`, `manual-heavy/`, `tally-drift/`; the shared `--dir` parser)
Status: NOT-STARTED

### Task checklist

- [ ] Add `contract` to the commands map, `scripts/gate-check.mjs:265`
  (pure append: `{ verify, freeze, handoff, state, contract }`).
- [ ] `cmdContract([...args])`: resolve `--dir` via the Epic A1 shared
  parser; read `<dir>/delivery/v3/CONTRACT.md` (or the positional path if no
  `--dir`, for non-fixture callers).
- [ ] Test-convention block check (**C-W1-01**): detect "has tests" (a
  `tests/`/`test/`/`__tests__/` dir, or a test script field, under `<dir>`)
  and fail if `<dir>/CLAUDE.md` lacks `<!-- plan-it:test-conventions -->`.
- [ ] Packaging-diff coverage (**C-W1-04**): if `<dir>/DIFF-MANIFEST.txt` (or
  equivalent diff-touched-paths marker) names `plugin.json`/`SKILL.md`/
  `marketplace.json` and the case table has zero `@case-packaging` rows, fail.
- [ ] `run:` completeness (**C-W1-05**): reuse the row-regex idiom from
  `scripts/gate-check.mjs:129,141`; any case row missing a `run:` cell fails,
  naming the row's ID.
- [ ] `manual:` ceiling (**C-W1-06**): count rows whose `run:` starts with
  `manual:`; if >30% of total and no `--override-manual` flag, warn + fail.
- [ ] Tally (**C-W5-01**): count `@case-` tagged rows; compare against any
  hand-typed `Tally: N/M`-shaped line; disagreement fails naming both numbers.
  This IS the mechanism `CONTRACT.md:5` points at ("Tally: COMPUTED — run
  `node scripts/gate-check.mjs contract`") — self-referential, so also run
  `contract` against the real frozen `CONTRACT.md` (not just the fixture) as
  a smoke check that it agrees with the frozen tally.
- [ ] Extend `tests/run-contract.mjs` v3 section with positive-path
  `T-V3-A2-*` assertions (contract passes on a clean fixture) alongside the
  negative cases below.

### Binding Test Contract

| ID | @tag | [REAL] case | run: | fixture | Covers |
|---|---|---|---|---|---|
| C-W1-01 | @case-machine | [REAL] `contract` FAILS when target repo has tests but CLAUDE.md lacks `<!-- plan-it:test-conventions -->` | `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/no-conventions` | `tests/fixtures/v3/no-conventions/` | C-W1-01 |
| C-W1-04 | @case-packaging | [REAL] `contract` FAILS when plan diff touches packaging files and zero `@case-packaging` rows exist | `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/pkg-no-case` | `tests/fixtures/v3/pkg-no-case/` | C-W1-04 |
| C-W1-05 | @case-machine | [REAL] Any case row missing `run:` → `contract` FAILS | `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/no-run-col` | `tests/fixtures/v3/no-run-col/` | C-W1-05 |
| C-W1-06 | @case-machine | [REAL] `manual:` share >30% → warning + non-zero exit unless `--override-manual` | `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/manual-heavy` | `tests/fixtures/v3/manual-heavy/` | C-W1-06 |
| C-W5-01 | @case-machine | [REAL] Hand-typed tally disagreeing with computed `@case-` count → `contract` FAILS | `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/tally-drift` | `tests/fixtures/v3/tally-drift/` | C-W5-01 |

---

## Epic A3 — `testconv` verb: FD-1 discovery

Branch: `epic/a3-testconv-fd1` off `v2/deterministic-core`
Dependencies: Epic A1 (fixtures `conventions-present/`, `no-conventions/`,
`conventions-stale/`, `conventions-declined/`; idempotency script)
Status: NOT-STARTED

### Task checklist

- [ ] Add `testconv` to the commands map, `scripts/gate-check.mjs:265`.
- [ ] `cmdTestconv([...args])`: `--dir`-only verb (per D2). If
  `<dir>/CLAUDE.md` has the block, write a receipt
  (`state.testConventions = { registered: true, source: "found", at: <iso> }`)
  into `<dir>/.plan-it/state.json`, exit 0. *(case A1)*
- [ ] If no block: emit the "research → ask user → REGISTER" instruction
  text (per `delivery/TEST-CONTRACT-REVIEW.md:12`) and `process.exit(2)`
  — a dedicated exit code distinct from the shared `finish()` helper's 0/1
  (`scripts/gate-check.mjs:22-30`), documented as a `testconv`-only
  deviation. *(case A2)*
- [ ] `declined-by-user` path: write
  `state.testConventions = { declined: true, by: "user", at: <iso> }`,
  exit 0 — FD-1 requires registering the disposition either way, not
  requiring adoption. *(case A4)*
- [ ] Idempotency: registering twice against the same `CLAUDE.md` must not
  duplicate the fenced block (regex-check for the block before writing;
  no-op if already present in the expected shape). *(case C-W1-02, tested by
  `tests/v3/conventions-idempotent.mjs` from Epic A1)*
- [ ] Extend `cmdState` (`scripts/gate-check.mjs:210-261`) with the stale-receipt
  branch: if `state.testConventions?.registered === true` but the target's
  `CLAUDE.md` no longer has the block, fail naming "stale receipt — re-verify,
  not silent pass" (`TEST-CONTRACT-REVIEW.md:14`). This branch sits alongside
  the existing gate-recorded loop at `:236-244`, additive, same `fail()` sink.
  *(case A3)*

### Binding Test Contract

| ID | @tag | [REAL] case | run: | fixture | Covers |
|---|---|---|---|---|---|
| T-A3-A1 | @case-machine | [REAL] Target repo CLAUDE.md already has the block → `testconv` exits 0, emits receipt into state.json | `node scripts/gate-check.mjs testconv --dir tests/fixtures/v3/conventions-present` | `tests/fixtures/v3/conventions-present/` | A1 |
| T-A3-A2 | @case-machine | [REAL] No block present → `testconv` exits 2 with research→ask→REGISTER instruction; GROUNDED rejected until receipt exists | `node scripts/gate-check.mjs testconv --dir tests/fixtures/v3/no-conventions` | `tests/fixtures/v3/no-conventions/` | A2 |
| T-A3-A3 | @case-machine | [REAL] Receipt present but CLAUDE.md block later deleted → `gate-check state` flags stale receipt | `node scripts/gate-check.mjs state tests/fixtures/v3/conventions-stale/.plan-it/state.json` | `tests/fixtures/v3/conventions-stale/` | A3 |
| T-A3-A4 | @case-machine | [REAL] User declines registration → receipt records `declined-by-user` + date; gate passes | `node scripts/gate-check.mjs testconv --dir tests/fixtures/v3/conventions-declined` | `tests/fixtures/v3/conventions-declined/` | A4 |
| C-W1-02 | @case-machine | [REAL] Conventions block write is idempotent — running discovery twice yields exactly one fenced block | `node tests/v3/conventions-idempotent.mjs` | n/a — script-managed temp dir | C-W1-02 |

---

## Epic A4 — `reconcile` verb + `freeze`/`state` extensions: FD-2 + W5 orphan detection

Branch: `epic/a4-reconcile-fd2` off `v2/deterministic-core`
Dependencies: Epic A1 (fixtures `unreviewed/`, `orphan-req/`,
`epic-no-cases/`, `reconcile-embed-check/`, `no-review-file/`,
`review-no-ack/`, `draft-case-orphan/`)
Status: NOT-STARTED

### Task checklist

- [ ] Add `reconcile` to the commands map, `scripts/gate-check.mjs:265`.
- [ ] `cmdReconcile([...args])`, `--dir`-only: orphan PRD requirement scan
  (**C-W5-02**) and epic-with-zero-cases scan (**C-W5-03**), the latter
  generalizing the existing "epic has no Test Contract" detector at
  `scripts/gate-check.mjs:161-173` from presence-check to row-count-check.
- [ ] Draft→binding case map (**case B3**): parse case IDs out of
  `<dir>/delivery/TEST-CONTRACT-REVIEW.md`; for each, require it appears in
  some epic's Binding Test Contract table under `<dir>/delivery/v3/epics/`
  OR in a dated `<dir>/delivery/decisions.md` entry; fail naming any ID in
  neither set.
- [ ] Embed in `handoff` (**C-W5-04**): inside `cmdHandoff`
  (`scripts/gate-check.mjs:99-196`), after the existing five checks
  (`:124-189`), call the same reconcile logic as an internal function (not a
  subprocess) so it writes into the same shared `failures` array
  (`:18`) and reports through the one `finish()` call at the end of
  `cmdHandoff` — no double-reporting (PRD §5 R4).
- [ ] `freeze` extension (**case C-W1-03**): inside `cmdFreeze`
  (`scripts/gate-check.mjs:65-86`), after the existing placeholder check
  (`:82-83`), when `--dir` is passed: read `<dir>/.plan-it/state.json`,
  fail unless `casesReviewed === true`.
- [ ] `state` extension (**cases B1/B2**): inside `cmdState`
  (`scripts/gate-check.mjs:210-261`), additive branch: if
  `state.gates?.G2?.approved === true`, require
  `<dir>/delivery/TEST-CONTRACT-REVIEW.md` on disk (**B1**) containing a
  `Reviewed-by: <name> <date>` line, the exact grammar frozen at
  `delivery/TEST-CONTRACT-REVIEW.md:49` (**B2**).

### Binding Test Contract

| ID | @tag | [REAL] case | run: | fixture | Covers |
|---|---|---|---|---|---|
| C-W1-03 | @case-machine | [REAL] `freeze` FAILS while `casesReviewed !== true` in state.json | `node scripts/gate-check.mjs freeze --dir tests/fixtures/v3/unreviewed` | `tests/fixtures/v3/unreviewed/` | C-W1-03 |
| C-W5-02 | @case-machine | [REAL] `reconcile` flags PRD requirement with no covering epic (orphan) | `node scripts/gate-check.mjs reconcile --dir tests/fixtures/v3/orphan-req` | `tests/fixtures/v3/orphan-req/` | C-W5-02 |
| C-W5-03 | @case-machine | [REAL] `reconcile` flags epic with zero contract cases | `node scripts/gate-check.mjs reconcile --dir tests/fixtures/v3/epic-no-cases` | `tests/fixtures/v3/epic-no-cases/` | C-W5-03 |
| C-W5-04 | @case-machine | [REAL] `reconcile` runs standalone AND is invoked automatically inside `handoff` | `node tests/v3/reconcile-embedded.mjs` | `tests/fixtures/v3/reconcile-embed-check/` | C-W5-04 |
| T-A4-B1 | @case-machine | [REAL] G2_ANSWERED without `delivery/TEST-CONTRACT-REVIEW.md` on disk → rejected | `node scripts/gate-check.mjs state tests/fixtures/v3/no-review-file/.plan-it/state.json` | `tests/fixtures/v3/no-review-file/` | B1 |
| T-A4-B2 | @case-machine | [REAL] Review file present but lacks the user-ack line (`Reviewed-by: <name> <date>`) → rejected | `node scripts/gate-check.mjs state tests/fixtures/v3/review-no-ack/.plan-it/state.json` | `tests/fixtures/v3/review-no-ack/` | B2 |
| T-A4-B3 | @case-machine | [REAL] Phase-9 per-epic contracts: every draft case ID maps to ≥1 binding case or a decisions.md drop entry — `gate-check handoff` verifies the map | `node scripts/gate-check.mjs reconcile --dir tests/fixtures/v3/draft-case-orphan` | `tests/fixtures/v3/draft-case-orphan/` | B3 |

---

## PROPOSED-AMENDMENT

- **PA-1 (exit-code convention).** `testconv`'s `process.exit(2)` for
  "needs registration" (case A2) introduces the first non-binary exit code
  in `gate-check.mjs` — every other verb is 0/1 via `finish()`. Recommend
  the coordinator add one line to `CONTRACT.md`'s Invariants section on the
  next amendment pass: "exit codes: 0 pass, 1 fail-closed, 2 = needs-human-
  input (testconv only)." Not applied here — squads never edit the frozen
  file (`00-program-plan.md:24`); filing per that rule.
- **PA-2 (fixture stub ownership).** Epic A1 scaffolds 15 stub directories
  for Squad B/C's enforcement rows (W2/W3/W4/W6) so the fixture-naming
  convention is locked in one place before three squads improvise
  independently. This is coordination, not a scope claim on those squads'
  check logic — recommend the coordinator confirm Squad B/C's epics
  reference these pre-scaffolded paths rather than inventing new ones,
  during the Wave-0→Wave-1 handoff.

---

## Case map — every assigned ID bound

**Enforcement rows (11/11 bound):**

| Case ID | Bound in | Binding row |
|---|---|---|
| C-W1-01 | Epic A2 | C-W1-01 |
| C-W1-02 | Epic A3 | C-W1-02 |
| C-W1-03 | Epic A4 | C-W1-03 |
| C-W1-04 | Epic A2 | C-W1-04 |
| C-W1-05 | Epic A2 | C-W1-05 |
| C-W1-06 | Epic A2 | C-W1-06 |
| C-W5-01 | Epic A2 | C-W5-01 |
| C-W5-02 | Epic A4 | C-W5-02 |
| C-W5-03 | Epic A4 | C-W5-03 |
| C-W5-04 | Epic A4 | C-W5-04 |
| C-META-01 | Epic A1 | T-A1-01 |

**Draft cases (7/7 bound):**

| Case ID | Bound in | Binding row |
|---|---|---|
| A1 (FD-1) | Epic A3 | T-A3-A1 |
| A2 (FD-1) | Epic A3 | T-A3-A2 |
| A3 (FD-1) | Epic A3 | T-A3-A3 |
| A4 (FD-1) | Epic A3 | T-A3-A4 |
| B1 (FD-2) | Epic A4 | T-A4-B1 |
| B2 (FD-2) | Epic A4 | T-A4-B2 |
| B3 (FD-2) | Epic A4 | T-A4-B3 |

Row count is verifiable by counting the two tables above (not hand-typed as
a summary figure, per the W5 discipline this lane itself enforces via
`contract`'s tally check): the enforcement table lists every one of the 11
IDs assigned to this lane in `delivery/v3/CONTRACT.md` rows C-W1-01…06 and
C-W5-01…04 plus C-META-01; the draft table lists every one of the 7 IDs
assigned in `delivery/TEST-CONTRACT-REVIEW.md` §A (A1-A4) and §B (B1-B3).
Zero silent drops. Two PROPOSED-AMENDMENT notes filed above (neither is a
case drop — both cases stay bound as shown).

---
_Squad A — mid tier, escalate-on-struggle per RUN-POLICY (`delivery/v3/CONTRACT.md:52-65`)._

## Coordinator addendum — 2026-07-08 (dated per amendment loop)
- Case IDs normalized `T-*` → `T-*` to match the `references/templates.md` grammar used by Squads B/C (mechanical, no case content changed).
- **Epic A4 scope addition (ruling on Squad B's PROPOSED-AMENDMENT-2):** additively widen the legacy `handoff` ID/heading regexes at `scripts/gate-check.mjs:115,121,161` from literal `E` to `[A-Z]` so v3 `A*/B*/C*` epic IDs and `T-A*/T-B*/T-C*` case IDs are recognized. Verification (not re-implementation) task remains in Epic B2.
