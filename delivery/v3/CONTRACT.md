# plan-it v3 — Test Contract

Version: v0.9-draft (freezes to v1.0 when `casesReviewed: true`)
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
- Every case runnable except where `manual:<reason>` is justified — current manual share: 0%.
