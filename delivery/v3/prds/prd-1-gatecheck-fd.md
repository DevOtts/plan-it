# PRD — plan-it v3, Squad A: gate-check verbs & FD enforcement

| Status | Owner | Date | Shape/Size | Execution |
|---|---|---|---|---|
| NOT-STARTED | Squad A (planning, mid tier — RUN-POLICY, `delivery/v3/CONTRACT.md:59`) | 2026-07-07 | Shape 1 lane / M | Wave 0 (fixtures/harness) then Wave 1, per `delivery/v3/00-program-plan.md:13-17` |

Law: `delivery/v3/CONTRACT.md` v1.0 FROZEN — this PRD does not amend it. Any
gap found while authoring is filed as PROPOSED-AMENDMENT at the end of the
companion epics file, never edited here.

---

## 1. Problem & goals

The v3 field study (research-SYNTHESIS.md) found the CONTRACT and Test
Contract artifacts drift silently once a run scales past one human: hand-typed
tallies disagree with the actual case rows, packaging-touching plans ship with
zero `@case-packaging` coverage, case rows go missing their `run:` cell, and
founder-mandated review steps (FD-1 test-convention discovery, FD-2 pushed
case review) have no machine-checked enforcement — they rely on the model
remembering to do them. This is exactly the **prose control flow** failure
v2's deterministic core (`scripts/gate-check.mjs`) was built to close for
Rules 1–3; v3 theme **W1 (contract hygiene)** and **W5 (computed tallies)**
extend the same discipline to the CONTRACT and Test Contract artifacts
themselves, and **FD-1/FD-2** (founder-mandated, non-negotiable per
`delivery/decisions.md:27`) need their own guarded checks rather than skill
prose.

**Goals (testable — each maps to §3 Epic table / binding cases):**
- G1. `contract` verb: a CONTRACT/Test-Contract structural lint — test-convention
  block presence (W1), packaging-diff coverage (W1), `run:` column completeness
  (W1), `manual:` share ceiling (W1), and the tally itself is COMPUTED by this
  verb, never hand-typed (W5) — closing the exact gap `delivery/v3/CONTRACT.md:5`
  names: `Tally: COMPUTED — run node scripts/gate-check.mjs contract`.
- G2. `testconv` verb: FD-1 test-convention discovery/registration as an
  executable check (receipt in `.plan-it/state.json`, stale-receipt
  re-verification, `declined-by-user` accepted as a valid disposition) —
  `delivery/design/v3-architecture.md:29-32`.
- G3. `reconcile` verb (standalone AND embedded in `handoff`): orphan PRD
  requirements, epics with zero contract cases (W5), and — the FD-2 half —
  every draft case in `delivery/TEST-CONTRACT-REVIEW.md` maps to ≥1 binding
  per-epic case or a dated `decisions.md` drop entry (case B3).
- G4. `freeze` guard extension: FAILS while `.plan-it/state.json` `casesReviewed
  !== true` — FD-2's freeze-time backstop (case C-W1-03), additive to the
  existing structural checks in `cmdFreeze` (`scripts/gate-check.mjs:65-86`).
- G5. `state` verb extension (two additive payload checks, same function,
  different guard names): the G2 review-file gate (review file on disk +
  `Reviewed-by:` ack line — cases B1/B2) and stale test-convention-receipt
  detection (case A3) — both additive branches inside `cmdState`
  (`scripts/gate-check.mjs:210-261`).
- G6. Wave-0 fixture/harness foundation: extend `tests/run-contract.mjs` and
  scaffold `tests/fixtures/v3/` so every enforcement row in the frozen
  CONTRACT — mine and the other two squads' — has a named violating fixture
  and a generic, CONTRACT-table-driven fail-closed sweep (case C-META-01),
  itself honoring W5 (the sweep computes its row list from the frozen table,
  never a hand-maintained list).

**Non-goals (this lane):** see §6 Out-of-scope.

---

## 2. Solution design

Numbered decisions, each grounded against current source. All changes are
**additive** — no existing `gate-check.mjs` verb's current behavior for
existing callers changes; `cmdFreeze`/`cmdState`/`cmdHandoff` keep passing
their v2/v2.1 Test Contract cases (`tests/run-contract.mjs` T-E2-*, T-E3-*,
T-E6-*) unmodified.

### D1 — New verb dispatch: `contract`, `testconv`, `reconcile`
`scripts/gate-check.mjs:265` is a flat commands map: `{ verify, freeze,
handoff, state }`, dispatched by `commands[cmd](args)` at `:274`, with a
usage block at `:266-273`. Three new keys are added to that map — pure
append, matching the exact pattern `delivery/design/v3-architecture.md:31`
prescribes for `testconv` ("pure append to the 4-entry commands map,
`gate-check.mjs:265` pattern"). No existing key changes.

### D2 — `--dir <path>` calling convention (additive, new verbs only)
Every one of my 11 enforcement rows' frozen `run:` commands in
`delivery/v3/CONTRACT.md:12-37` invokes the new verbs as
`gate-check.mjs <verb> --dir tests/fixtures/v3/<case>` — a directory of a
**violating repo**, not a single file (`CONTRACT.md:6`: "Fixtures: violating
repos under `tests/fixtures/v3/`"). `contract`, `testconv`, and `reconcile`
parse `args[0] === "--dir"` and resolve conventional paths inside it:
`<dir>/delivery/v3/CONTRACT.md`, `<dir>/.plan-it/state.json`, `<dir>/CLAUDE.md`,
`<dir>/delivery/TEST-CONTRACT-REVIEW.md`, `<dir>/delivery/v3/{prds,epics}/*.md`.
`freeze` and `state` gain the **same** `--dir` branch as an additive
alternative to their existing positional-file calling convention (never
removing it — `C-W1-03`'s frozen `run:` is `gate-check.mjs freeze --dir
tests/fixtures/v3/unreviewed`, so `freeze` must accept both forms).

### D3 — `contract` verb (Epic A2): W1 structural lint + W5 tally
Grounded in `delivery/v3/CONTRACT.md:5-6,10-37` (the six rows I own) and the
existing lint idioms already in `scripts/gate-check.mjs` (`stripCode` at
`:61-63`, `PLACEHOLDER_RE` at `:57`, the `fail`/`finish` accumulator pattern
at `:18-30`, reused verbatim — no new failure-reporting mechanism invented):
- Test-convention block presence (**C-W1-01**): if `<dir>` looks like it has
  tests (a `tests/`, `test/`, or `__tests__/` dir, or a package-manager test
  script) and `<dir>/CLAUDE.md` lacks `<!-- plan-it:test-conventions -->`, fail.
- Packaging-diff coverage (**C-W1-04**): if a diff manifest under `<dir>`
  names `plugin.json`/`SKILL.md`/`marketplace.json` and the CONTRACT's case
  table has zero `@case-packaging` rows, fail.
- `run:` completeness (**C-W1-05**): any `| ... |` case row missing a `run:`
  cell fails — same table-row regex approach `cmdHandoff` already uses for
  `Count:` blocks (`scripts/gate-check.mjs:134-147`), reused for a new column
  check rather than a new parser.
- `manual:` ceiling (**C-W1-06**): `run:` cells starting with `manual:` >30%
  of total rows → warn + non-zero exit unless `--override-manual` is passed.
- Tally (**C-W5-01**, W5 invariant `delivery/v3/CONTRACT.md:41`): count
  `@case-` tagged rows programmatically; if a `Tally: N/M` (or similar
  hand-typed count) line disagrees with the computed count, fail naming both
  numbers — this is the literal implementation of `CONTRACT.md:5`'s own
  "COMPUTED" self-reference.

### D4 — `testconv` verb (Epic A3): FD-1 discovery/registration
Grounded in `delivery/design/v3-architecture.md:24-32` (`realityProbe`
substate, "research → subagent → ask user → REGISTER") and
`delivery/TEST-CONTRACT-REVIEW.md:11-14` (cases A1-A4, verbatim source of
truth for expected behavior — I do not redefine these, only implement them):
- Block present → receipt written to `state.json`
  (a `testConventions: { registered: true, source: "found", at: <iso> }` object,
  mirroring the shape of the existing `contract` block at
  `.plan-it/state.json:41-46`), exit 0 (**A1**).
- Block absent → **exit 2** specifically (not the generic 1 `finish()` uses at
  `scripts/gate-check.mjs:29`) — a distinct code so a caller can distinguish
  "needs research → ask → register" from a generic structural failure, per
  `TEST-CONTRACT-REVIEW.md:12`'s literal wording; message names the
  research→ask→register instruction (**A2**).
- Declined disposition → receipt records
  `{ declined: true, by: "user", at: <iso> }`; gate still exits 0 —
  FD-1 says register *either way*, decline is not a failure (**A4**).
- Idempotency (**C-W1-02**): running the registration path twice against the
  same target must yield exactly one fenced block — a script-managed temp-dir
  test (`tests/v3/conventions-idempotent.mjs`, same `mkdtempSync` pattern
  `tests/run-contract.mjs:113-121` already uses), no static fixture.

### D5 — `state` verb extension (Epics A3 + A4): two additive payload checks
`cmdState` (`scripts/gate-check.mjs:210-261`) already validates required keys
(`STATE_REQUIRED_KEYS`, `:199`), state validity against `machine.json` states
(`:232-234`), and that any gate appearing in `history` carries
`approved+owner+date` (`:236-244`) — a generic "gate recorded" check, not
FD-specific. Two new, additive branches sit alongside that loop, keyed off
which gate/receipt is present in the state file being checked, so existing
callers (v2 states with no `testConventions`/no G2 review artifacts) are
unaffected:
- **Stale test-convention receipt** (case **A3**): if `state.testConventions
  ?.registered === true` but the target's `CLAUDE.md` no longer contains the
  block, fail naming "stale receipt — re-verify, not silent pass" (the exact
  phrase in `TEST-CONTRACT-REVIEW.md:14`).
- **G2 review-file payload** (cases **B1/B2**): if `state.gates?.G2?.approved
  === true`, require `delivery/TEST-CONTRACT-REVIEW.md` on disk in the same
  fixture dir (**B1**) containing a `Reviewed-by: <name> <date>` line, the
  exact grammar frozen in `delivery/TEST-CONTRACT-REVIEW.md:49` (**B2**).

**File-ownership note (not a scope grab):** `machine.json`'s `decisionGate`
state and its `gateRecorded` guard mapping (`machine.json:115-126`) are Squad
B's statechart lane (`delivery/v3/00-program-plan.md:10`, "areas E —
statechart additions"). This PRD only extends the **verb implementation**
(`scripts/gate-check.mjs`, already my lane's namesake) that the existing
`gateRecorded` guard already points at — no `machine.json` edit, no new guard
name. Both squads read/write disjoint files.

### D6 — `reconcile` verb (Epic A4): W5 orphan detection + FD-2 draft→binding map
Standalone verb, and — per case **C-W5-04** — invoked automatically inside
`cmdHandoff` (`scripts/gate-check.mjs:99-196`) as an additional pass appended
after the existing five numbered passes (`:124-189`), so a `handoff` run
alone already catches everything `reconcile` catches (additive: `cmdHandoff`'s
current five checks and their failure messages are untouched):
- **Orphan PRD requirement** (**C-W5-02**): a PRD requirement ID
  (`FR\d+(\.\d+)?`-shaped, or whatever grammar the PRD uses) with no epic
  task-checklist or Binding-Test-Contract-table reference anywhere in the
  package → fail, naming the orphan ID.
- **Epic with zero contract cases** (**C-W5-03**): an epic heading
  (same detector `cmdHandoff` already uses at `:161-173` for "epic has no
  Test Contract", generalized from "has none" to "has zero rows in its own
  Binding Test Contract table") → fail.
- **Draft→binding case map** (**B3**, FD-2): every case ID appearing in
  `delivery/TEST-CONTRACT-REVIEW.md` (A1-G2, 24 IDs per its footer,
  `TEST-CONTRACT-REVIEW.md:49`) must appear in ≥1 epic's Binding Test Contract
  table **or** in a dated `delivery/decisions.md` entry recording its drop —
  fail naming any ID that is in neither set.

### D7 — `freeze` guard extension (Epic A4): `casesReviewed` (case C-W1-03)
One new check appended inside `cmdFreeze` (`scripts/gate-check.mjs:65-86`),
after the existing placeholder/section/changelog checks (`:78-83`): when
invoked with `--dir`, read `<dir>/.plan-it/state.json` and fail unless
`casesReviewed === true` — the literal field already present in the real run
state (`.plan-it/state.json:186`). Existing positional-file callers (v2 Test
Contract T-E3-04/05/06) never pass `--dir`, so `casesReviewed` is not checked
for them — zero regression risk.

### D8 — Wave-0 harness + fixture corpus (Epic A1)
`tests/run-contract.mjs` already the single test harness (E1-E6 sections,
`t()`/`assert()`/`gc()` helpers at `:17-37`); a new v3 section is appended
before the report block (`:296-307`), following the same pattern —
`tests/v3/*.mjs` standalone scripts execute the same way T-E6 hook tests do
(`execFileSync`, `:211-214`). `tests/v3/fail-closed-sweep.mjs` (case
**C-META-01**) is generic and W5-honest: it **parses `delivery/v3/CONTRACT.md`'s
own case table** (never a hand-copied row list) to get every enforcement
row's `run:` command, executes each, and asserts non-zero exit — this covers
all 26 enforcement rows (mine and the other two squads') without this lane
having to know W2/W3/W4/W6's internal check logic; it only needs their frozen
`run:` command to already work. Fixture corpus: see companion epics file for
the full `tests/fixtures/v3/` layout (18 dirs owned/fully-specified here; 15
stub dirs for the other squads' rows, naming-convention only, so no two
squads invent divergent fixture conventions).

---

## 3. Epic table

| EID | Title | Depends on | Wave | Covers (case count) |
|---|---|---|---|---|
| A1 | Fixture & harness foundation | none | 0 | 1 enforcement (C-META-01) |
| A2 | `contract` verb — W1 hygiene + W5 tally | A1 | 1 | 5 enforcement |
| A3 | `testconv` verb — FD-1 discovery | A1 | 1 | 4 draft + 1 enforcement |
| A4 | `reconcile` + `freeze`/`state` extensions — FD-2 + W5 orphan detection | A1 | 1 | 4 enforcement + 3 draft |

Full task checklists, branch names, and the binding per-case tables live in
`delivery/v3/epics/epics-1-gatecheck-fd.md`.

---

## 4. Acceptance

Acceptance = the Binding Test Contract table in the companion epics file,
100% pass, per `delivery/v3/00-program-plan.md:29` ("100% binding-case pass
is the DoD; IMPLEMENTED-NOT-VERIFIED ships nothing"). Every case there is
`[REAL]` with a `run:` command; the case map at the end of that file proves
all 18 IDs assigned to this lane (11 enforcement + 7 draft) are bound.

---

## 5. Risks

- **R1 — cross-squad fixture-convention drift.** Epic A1 stubs 15 fixture
  dirs for W2/W3/W4/W6 rows it does not implement; if Squad B/C's epics name
  their fixtures differently, `fail-closed-sweep.mjs` still works (it reads
  `run:` from the frozen CONTRACT, not the stub names) but the stubs become
  dead weight. Mitigation: the stub `README.md` per dir states the exact
  frozen `run:` path already in `CONTRACT.md`, so the path is not
  reinterpretable.
- **R2 — `--dir` convention adds a second calling style to four verbs.**
  Mitigated by D2's explicit additive-branch design (positional form always
  checked first, `--dir` only on `args[0] === "--dir"`); `tests/run-contract.mjs`
  T-E2/T-E3 cases for the legacy form are unmodified and must stay green.
- **R3 — `testconv` exit code 2 is a new convention.** Every other verb in
  `scripts/gate-check.mjs` uses the binary `finish()` pattern (0 or 1,
  `:22-30`). Exit 2 is scoped to `testconv`'s "needs registration" branch only,
  documented in D4, and covered by case A2 so the deviation is tested, not
  silently introduced.
- **R4 — `reconcile`-in-`handoff` embedding could double-report.** `cmdHandoff`
  already accumulates into the shared `failures` array (`scripts/gate-check.mjs:18`);
  the embedded reconcile pass reuses the same array/`fail()` call rather than
  running as a subprocess, so a single `finish()` call still reports once —
  design constraint carried into Epic A4's task checklist.

---

## 6. Out-of-scope (owned by Squad B or Squad C — see `00-program-plan.md:9-11`)

- `machine.json` statechart edits (new substates, `decisionGate`/`freezeGate`
  guard *definitions*, `machine-replan.json`) — Squad B, areas E.
- Preflight/`ENV-FACTS` tiering (W2), model-tiering guard (W3) — Squad B.
- Status-vocabulary guard (W4), KICKOFF pinning + packaging/mirror/release
  (W6, `pluginlint`, `mirror-check`) — Squad C.
- Credential-procurement checklist payload at G2 (backlog #10) beyond the
  review-file/ack piece (B1/B2) — shared touchpoint with Squad B's
  `decisionGate` payload design (`delivery/design/v3-architecture.md:33-36`);
  this lane implements only the case-review half.
- Actually creating the fixture files/scripts — this is a planning-phase PRD;
  Epic A1's task checklist specifies exact contents for the build phase.

---
_Squad A — mid tier, escalate-on-struggle per RUN-POLICY (`delivery/v3/CONTRACT.md:52-65`)._
