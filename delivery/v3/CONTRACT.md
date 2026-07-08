# plan-it v3 — Test Contract

Version: **v1.0 — FROZEN 2026-07-07** (FD-2 review: approved as-is, Reviewed-by Fernando Ott 2026-07-07; `casesReviewed: true`)
Basis: `docs/v3/02-v3-design.md` + G2 decisions (2026-07-07: Q1 fold-into-G2, Q2 always-on-tiered, Q3 pointer-to-fable-it, Q4 chore-epic-in-v3)
Tally: COMPUTED — run `node scripts/gate-check.mjs contract` (never hand-edit counts; W5)
Fixtures: violating repos under `tests/fixtures/v3/` — every enforcement case must FAIL CLOSED against its fixture.

## Cases

| ID | @tag | Case (expected behavior) | run: |
|---|---|---|---|
| C-W1-01 | @case-machine | `contract` verb FAILS when target repo has tests but CLAUDE.md lacks `<!-- plan-it:test-conventions -->` block | `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/no-conventions` |
| C-W1-02 | @case-machine | Conventions block write is idempotent — running discovery twice yields exactly one fenced block | `node tests/v3/conventions-idempotent.mjs` |
| C-W1-03 | @case-machine | `freeze` verb FAILS while `casesReviewed !== true` in state.json | `node scripts/gate-check.mjs freeze --dir tests/fixtures/v3/unreviewed` |
| C-W1-04 | @case-packaging | `contract` verb FAILS when plan diff touches `plugin.json`/`SKILL.md`/`marketplace.json` and zero `@case-packaging` rows exist | `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/pkg-no-case` |
| C-W1-05 | @case-machine | Any case row missing `run:` → `contract` verb FAILS | `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/no-run-col` |
| C-W1-06 | @case-machine | `manual:` share >30% → warning + non-zero exit unless `--override-manual` | `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/manual-heavy` |
| C-W2-01 | @case-machine | `machine.json` contains `preflight` state with edges discovery→preflight→contract | `node tests/v3/machine-shape.mjs` |
| C-W2-02 | @case-machine | S-shape run emits ENV-FACTS.md with exactly the 6-probe minimal set; M/L emits full set | `node tests/v3/preflight-tiering.mjs` |
| C-W2-03 | @case-machine | Contract case whose `run:` invokes a tool ENV-FACTS marks ABSENT → `contract` verb FAILS | `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/absent-tool` |
| C-W2-04 | @case-machine | A probe exceeding 10s is killed and recorded `TIMEOUT`, run continues | `node tests/v3/probe-timeout.mjs` |
| C-W3-01 | @case-machine | Epic without a Tier Table → `reconcile` FAILS | `node scripts/gate-check.mjs reconcile --dir tests/fixtures/v3/no-tier` |
| C-W3-02 | @case-machine | Hardcoded model ID (regex `claude-[a-z0-9-]+`) in any plan artifact → planit-guard rejects the write | `node tests/v3/guard-model-id.mjs` |
| C-W3-03 | @case-machine | Tier Table parses with all four fields (tier/effort/escalation/scaffold-pointer); pointer must be a fable-it path, not inline prompt text | `node tests/v3/tier-table-fields.mjs` |
| C-W4-01 | @case-machine | "done"/"complete"/"✅" in delivery artifacts without `VERIFIED` + case ref → planit-guard rejects write | `node tests/v3/guard-status-vocab.mjs` |
| C-W4-02 | @case-machine | `VERIFIED` tag lacking a run-output reference → `handoff` FAILS | `node scripts/gate-check.mjs handoff --dir tests/fixtures/v3/verified-no-ref` |
| C-W4-03 | @case-machine | Status word outside the 4-term vocabulary in STATUS.md → `handoff` FAILS | `node scripts/gate-check.mjs handoff --dir tests/fixtures/v3/bad-vocab` |
| C-W5-01 | @case-machine | Hand-typed "N/N" tally disagreeing with computed `@case-` count → gate FAILS | `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/tally-drift` |
| C-W5-02 | @case-machine | `reconcile` flags PRD requirement with no covering epic (orphan) | `node scripts/gate-check.mjs reconcile --dir tests/fixtures/v3/orphan-req` |
| C-W5-03 | @case-machine | `reconcile` flags epic with zero contract cases | `node scripts/gate-check.mjs reconcile --dir tests/fixtures/v3/epic-no-cases` |
| C-W5-04 | @case-machine | `reconcile` runs standalone AND is invoked automatically inside `handoff` | `node tests/v3/reconcile-embedded.mjs` |
| C-W6-01 | @case-machine | KICKOFF contains absolute repo path, git SHA, state.json path, contract SHA-256 | `node tests/v3/kickoff-pinning.mjs` |
| C-W6-02 | @case-machine | KICKOFF first step instructs builder to re-derive tally + reconcile from disk; mismatch = stop-and-report | `node tests/v3/kickoff-rederive.mjs` |
| C-W6-03 | @case-packaging | Chore: marketplace.json claim text matches reality (aggregator claim removed/corrected) | `node tests/v3/marketplace-claim.mjs` |
| C-W6-04 | @case-packaging | plugin.json ↔ marketplace.json parity mismatch fixture → `handoff` FAILS (lint scoped to plans whose diff touches packaging files) | `node scripts/gate-check.mjs handoff --dir tests/fixtures/v3/pkg-parity` |
| C-W6-05 | @case-machine | KICKOFF template contains no fuzzy-resume language (`/read-chat` ban) — pinned-resume only | `node tests/v3/kickoff-no-fuzzy.mjs` |
| C-META-01 | @case-machine | Every enforcement case above exits non-zero against its violating fixture (fail-closed umbrella sweep) | `node tests/v3/fail-closed-sweep.mjs` |

## Invariants

- Counts in any artifact are computed, never typed (W5).
- `top` tier resolves at execution time; no model IDs anywhere (W3).
- Every case runnable except where `manual:<reason>` is justified — share computed by `gate-check contract`, ≤30% gate (never hand-typed; W5). [AMD-3 2026-07-08]
- Exit-code convention: gate-check verbs are binary (0 pass / 1 fail) except where a documented third state exists — exit 2 = "action required" (first use: `testconv` needs-registration, FD-1). [AMD-3 2026-07-08]
- Statechart evolution: the live `machine.json` must remain an additive-only structural superset of the byte-pinned v2 regression copy `tests/fixtures/v2/machine.v2.fc6abc8.json`, verified by `gate-check machine-diff`. [AMD-1 2026-07-08, approved Fernando Ott]
- Mirror integrity spans eight root↔`plugins/plan-it` pairs (4 files + 4 `references/*.md`). [AMD-2 2026-07-08, approved Fernando Ott]

## PROGRAM CONTRACT (M-shape folded form)
- Baseline: `/Users/macbook/Workspace/Devotts/plan-it`, main @ `e6126c6`, working branch `v2/deterministic-core` @ `1e5fa46` (v2.1.0 protected core; machine.json regression pin = `fc6abc8` copy, case E1).
- Branch map: `epic/<eid>-<slug>` off `v2/deterministic-core`; merge back per wave; the release epic alone merges `v2/deterministic-core` → `main` and tags v3.0.0.
- Definition of SHIPPED: all binding `[REAL]` cases pass against fixtures; version triple-match 3.0.0 (F1); mirror-check exit 0 (D1–D3); plugin↔marketplace parity + claim honesty (W6); CHANGELOG v3.0.0 dated per FD/backlog ID (F3); comms drafted (EC-D8).
- Status vocabulary (binding, W4): NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED. VERIFIED requires a case ID + run-output reference.
- Amendment loop: squads never edit this file. Proposed amendments surface in squad final messages; only the coordinator applies them, each with a dated `delivery/decisions.md` entry.

## RUN-POLICY (backlog #8 — frozen into the package)
Tier table — tiers resolve to concrete models at execution time; hardcoded model IDs anywhere in the package are a guard violation (W3):

| slice class | tier | notes |
|---|---|---|
| coordinator | top | owns gates, freeze, merges, escalation decisions |
| mechanical (fetch / collate / fixture scaffolds) | low | deterministic, fully spec'd byte-work |
| spec'd implementation vs a bound Test Contract | mid | default builder tier |
| judgment (crown-jewel, adversarial verify, ambiguity, cross-cutting) | top | never resolved below coordinator review |

- escalate-on-struggle: a failed or flaky slice re-runs exactly one tier up; every escalation is recorded in the run report.
- delivery rule: subagents write results to disk at exact absolute paths AND send a content-bearing final message — idle ≠ delivered.
- reap-on-merge: builders are stopped as soon as their output is merged and captured in durable files.
- This run's binding instance: coordinator = top; PRD/epic authoring = mid; fixture scaffolding = low.

## CHANGELOG (contract)
- v0.9-draft — 2026-07-07 — authored post-G2 from research-SYNTHESIS themes W1–W6 + FD-1/FD-2 mandates.
- v1.0 — 2026-07-07 — **FROZEN** after FD-2 review (approved as-is, Reviewed-by Fernando Ott); added PROGRAM CONTRACT + RUN-POLICY sections. Post-freeze changes only via dated decisions.md amendment entries.
- v1.0+AMD — 2026-07-08 — post-freeze amendment pass: AMD-1 (E1 additive-superset reword + `machine-diff`, approved Fernando Ott), AMD-2 (mirror pairs six→eight, approved Fernando Ott), AMD-3 (exit-2 convention; manual-share invariant made computed — coordinator). SHA re-pinned in state.json. Rulings log: delivery/decisions.md 2026-07-08.
