# tests/fixtures/v3/ — index

Wave 0 fixture corpus for plan-it v3 (`delivery/v3/00-program-plan.md` Wave 0:
"fixture corpus + `tests/run-contract.mjs` harness extension ... C-META-01
sweep"). Every directory/file below is referenced by a Binding Test Contract
table in `delivery/v3/epics/epics-{1,2,3}-*.md` and/or a `run:` cell in
`delivery/v3/CONTRACT.md`'s enforcement-case table. Each fixture carries its
own `README.md` naming exactly which case ID(s) it feeds and which
enforcement row it violates (or, for a few positive-path fixtures,
satisfies).

Verify the count against the epics (computed, not hand-typed — W5):

```
find tests/fixtures/v3 -mindepth 1 -maxdepth 1 | wc -l
```

## Squad A (gate-check verbs & FD enforcement — `epics-1-gatecheck-fd.md`)

| fixture | case(s) | row |
|---|---|---|
| `no-conventions/` | C-W1-01, T-A3-A2 | contract/testconv: missing test-conventions block |
| `pkg-no-case/` | C-W1-04 | contract: packaging diff, zero `@case-packaging` rows |
| `no-run-col/` | C-W1-05 | contract: case row missing `run:` |
| `manual-heavy/` | C-W1-06 | contract: `manual:` share >30% |
| `tally-drift/` | C-W5-01 | contract: hand-typed tally disagrees with computed count |
| `unreviewed/` | C-W1-03 | freeze: `casesReviewed !== true` |
| `orphan-req/` | C-W5-02 | reconcile: PRD requirement with no covering epic |
| `epic-no-cases/` | C-W5-03 | reconcile: epic with zero contract cases |
| `reconcile-embed-check/` | C-W5-04 | reconcile standalone + embedded in handoff |
| `conventions-present/` | T-A3-A1 (case A1, positive) | testconv: block already present |
| `conventions-stale/` | T-A3-A3 (case A3) | state: stale test-conventions receipt |
| `conventions-declined/` | T-A3-A4 (case A4, positive) | testconv: user declined, valid disposition |
| `no-review-file/` | T-A4-B1 (case B1) | state: G2 approved, no review file on disk |
| `review-no-ack/` | T-A4-B2 (case B2) | state: review file present, missing ack line |
| `draft-case-orphan/` | T-A4-B3 (case B3) | reconcile: draft case unmapped, no drop entry |

## Squad B (statechart, preflight & tiering — `epics-2-statechart-tiering.md`)

| fixture | case(s) | row | status |
|---|---|---|---|
| `contract-no-runpolicy.md` (+ `.README.md`) | T-B2-04 | freeze: CONTRACT missing `## RUN-POLICY` | real |
| `state-no-machine-field.json` (+ `.README.md`) | T-B3-02 (positive) | state: no `machine` key defaults to `machine.json` | real |
| `state-replan-mode.json` (+ `.README.md`) | T-B3-03 (positive) | state: `machine: "machine-replan.json"` resolves via selector | real |
| `gaps-undispositioned/` | T-B3-04 | freezeGate: known-gaps row with no disposition | real |
| `gaps-dispositioned/` | T-B3-05 (positive) | freezeGate: all rows fix/waive/case-ify | real |
| `credentials-unprocured/` | T-B3-06 | G2: unprocured credential, no owner | real |
| `credentials-gated/` | T-B3-07 (positive) | G2: GATED-with-owner, verified copy in CONTRACT | real |
| `no-tier/` | T-B2-01 | reconcile: epic without a Tier Table | real |
| `tier-table-good/` | T-B2-02 (positive) | Tier Table 4-field parse, fable-it pointer | real |
| `tier-table-bad-pointer/` | T-B2-02 | Tier Table: scaffold-pointer is inline prose | real |
| `preflight-s/` | C-W2-02 / T-B1-03 | preflight: S-shape 6-probe set | **STUB** (see below) |
| `preflight-ml/` | C-W2-02 / T-B1-04 | preflight: M/L-shape 9-probe set | **STUB** |
| `absent-tool/` | C-W2-03 / T-B1-05 | contract: ENV-FACTS ABSENT tool | **STUB** |
| `slow-probe/` | C-W2-04 / T-B1-06 | preflight: probe TIMEOUT >10s | **STUB** |

**Stub note:** `preflight-s/`, `preflight-ml/`, `absent-tool/`, `slow-probe/`
hold only a `README.md` (NOT-STARTED, frozen `run:` command verbatim) rather
than invented `ENV-FACTS.md` content. Their real shape depends on
`references/formats.md §9` (the ENV-FACTS probe schema), which Squad B's
Epic B1 has not authored yet — guessing it here risked locking in the wrong
shape for Squad B to then have to redo. This mirrors the "naming-convention
placeholder" strategy `delivery/v3/epics/epics-1-gatecheck-fd.md` describes
for cross-squad Wave-0 stubs.

**Not built (left for Wave 1, Epic B1):** `tests/fixtures/v2/machine.v2.fc6abc8.json`
— the byte-pinned v2 regression copy (case E1 / T-B1-02). `00-program-plan.md`'s
Wave 0 section does not assign this file to Wave 0, and it must be verified
byte-identical against `git show fc6abc8:machine.json` at creation time —
that verification is Epic B1's own task, not a Wave-0 scaffolding job.

## Squad C (guard vocab, kickoff pinning, packaging & release — `epics-3-vocab-packaging-release.md`)

| fixture | case(s) | row |
|---|---|---|
| `verified-no-ref/` | C-W4-02 | handoff: VERIFIED tag with no run-output reference |
| `bad-vocab/` | C-W4-03 | handoff: STATUS.md status word outside the 4-term vocabulary |
| `pluginlint-bad-colon/` | T-C2-01 (draft-C1) | pluginlint: unquoted colon in frontmatter description |
| `pluginlint-bad-plugin-json/` | T-C2-02 (draft-C2) | pluginlint: plugin.json missing `version` |
| `pluginlint-bad-source/` | T-C2-03 (draft-C3) | pluginlint: marketplace.json source path doesn't exist |
| `pluginlint-name-mismatch/` | T-C2-04 (draft-C4) | pluginlint: skill name ≠ directory name |
| `pkg-parity/` | C-W6-04 | handoff: plugin.json ↔ marketplace.json version mismatch |
| `mirror-drift/` | T-C3-06 (draft-D2) | mirror-check: 1-value drift between paired copies |

`pluginlint-good/` was not built — Epic C2's own task list names the real
`plugins/plan-it/` tree as the reusable passing control case instead.

## CONTRACT.md enforcement rows with no dedicated fixture (script-only or inline)

C-W1-02, C-W2-01, C-W3-02, C-W4-01, C-W6-01, C-W6-02, C-W6-03, C-W6-05,
C-META-01 — each of these rows' `run:` cell invokes a standalone
`tests/v3/*.mjs` script with no fixture directory argument (inline hook
stdin, script-managed temp dirs, or the live repo tree itself). See
`delivery/v3/CONTRACT.md` for the exact `run:` cells.
