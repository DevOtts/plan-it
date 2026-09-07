# plan-it v4 — Program plan (orchestrator edition)

> Build runs on the orchestrator-session topology (ruling D7): Fernando opens the named sessions in `SESSIONS.md`; the orchestrator manages them, gates the waves, merges, and runs QA. Every human input the build needs is answered in `GATE.md` before W0; new ones are appended there, never guessed.
> Legend: `SQ-A/B/C` squads · `Wn` wave · `V4<letter><n>` epic · `C-E<n>-NN` CONTRACT case · `T-<EID>-NN` epic case — see `GLOSSARY.md`.

## 1 · Sessions (exact names — see SESSIONS.md for the launch prompts)

| # | Session name | Role | Opens when |
|---|---|---|---|
| 1 | `v4-orchestrator` | conductor: W0, dispatch, verify on disk, merge per lane, amendments, wakeup chain, QA signal, morning report | first |
| 2 | `v4-sq-a-renderer` | SQ-A: renderer, template, brand tokens, report-family reference, renderer tests | with #1, builds on W1 signal |
| 3 | `v4-sq-b-core` | SQ-B: machine, gate-check verbs, guard, harness, fixtures | with #1, builds on W1 signal |
| 4 | `v4-sq-c-prose` | SQ-C: SKILL, references, docs, README, CHANGELOG, versions | with #1, builds on W1 signal |
| 5 | `v4-qa` | runs the whole Test Contract + the dogfood run; writes QA-REPORT.md | when the orchestrator announces W3 |

## 2 · Waves

| Wave | Who | Delivers | Gate to next |
|---|---|---|---|
| W0 | orchestrator | commit the guard mirror fix (A-4); byte-pin `tests/fixtures/v3/machine.v3.7fcff27.json` from the 3.0.1 `machine.json` (V4B1 later verifies its SHA-256, never overwrites); create `epic/v4*` worktrees; record AMD-4/AMD-5 in `delivery/decisions.md`; copy the GLOSSARY seed; STATUS rows NOT-STARTED | mirror-check 8/8 green on `main`; worktrees exist |
| W1 | SQ-A ∥ SQ-B ∥ SQ-C | all epics of each squad on their branches, each with its Test Contract 100% or INV-with-reason | each squad's local gate green; orchestrator verifies files on disk |
| W2 | orchestrator + SQ-B (pairs) + SQ-C (versions) | `MIRROR_PAIRS` 11; root mirrors synced; run-contract discovers the v4 Cases; version 4.0.0 across six sites AND the two harness literals (`run-contract.mjs` T-E5-01, `version-triple-match.mjs` EXPECTED) flipped in ONE merge; CHANGELOG 4.0.0; after V4B3 merges, `mv .plan-it/state.json .plan-it/v4.state.json` so this repo is governed the v4 way; cross-check SKILL.md posture-table state names against the live `machine.json` | run-contract 100% v2+v3+v4 · mirror-check 11/11 · machine-diff both baselines · version match |
| W3 | QA | every C-E case + every T-case run against the merged tree; dogfood run on `tests/fixtures/v4/dogfood-project/`; `QA-REPORT.md` with per-case PASS / FAIL / INV-with-reason | QA-REPORT delivered to the orchestrator; STATUS rows flipped with evidence |
| W4 | orchestrator (after O-2 + A-2) | tag 4.0.0, marketplace entry, README install note; `/conclude-it` | tag pushed; ledger card written |

Build-order notes: SQ-B's `run.deliveryRoot` resolution (V4B epics) must land before QA runs the v4 Cases, because run-contract discovers them from `delivery/v4/CONTRACT.md` (C-E9-10). SQ-A's stamp format is consumed by SQ-B's `mirror`; both read CONTRACT §4.3 and neither improvises.

## 3 · Orchestrator runbook

1. **Dispatch**: send each squad its W1 start; record in `STATUS.md ## Log`.
2. **Verify on disk, not on "done"**: after any squad reports, check branches, commits and files exist; run the epic's local gate. Idle ≠ delivered.
3. **Merge per lane** into `main` after the squad's Test Contract is green; one batched merge per squad per wave; never edit a squad's files.
4. **Amend centrally**: a cross-cutting contradiction becomes a dated `AMD-n` in `delivery/decisions.md` and a version bump of `delivery/v4/CONTRACT.md` (v1.0-draft → v1.1-draft); notify affected squads; never let a squad amend.
5. **Usage-limit resilience**: keep a scheduled-wakeup chain alive (≤3600 s hops) until W4 closes; persist state to `.taskstate/v4/` + `STATUS.md` before every idle; on a limit, resume after reset. Never park waiting for Fernando.
6. **Worktrees-only** (G-10): every squad edits in its own worktree; the orchestrator merges.
7. **Poll, never wait** (G-11): any headless fallback session polls STATUS and git; no protocol step says "wait for a notification".
8. **Reap** each squad's agents when its wave closes; `/conclude-it` at the end writes the ledger card and the report.
9. **Incidental channel**: anything found but not asked for goes to `STATUS.md ## Log` tagged `[incidental]`, dispositioned at close (E8), never folded into a Test Contract tally.
10. **Escalation rule**: rule yourself only if the item applies an existing GATE answer, is capped in blast radius and reversible; else write it as an open decision card and take the conservative path — "your word, not ours".

## 4 · Test standard

DoD per epic = 100% of its Test Contract; a case whose target is unreachable is IMPLEMENTED-NOT-VERIFIED with the reason, never a fake green. Residuals beyond the case set get a disposition (backlog-with-reason · owner-gated · INV). Definition of SHIPPED = CONTRACT §7, all computed.

## 5 · Board

`delivery/v4/STATUS.md` — the live board: epics table with Disposition column, `## Residuals`, `## Log`. The orchestrator writes; everyone reads.
