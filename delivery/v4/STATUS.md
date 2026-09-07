# STATUS — plan-it v4 · live board

Current wave: **W1 open** (W0 closed 2026-09-07 by the orchestrator at `ab0c192`+pin; SQ-A ∥ SQ-B ∥ SQ-C building in their worktrees; A-2 held until O-2).
Legend: status is one of NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED (closed vocabulary). Disposition is empty until an epic closes with a non-green residual; then exactly one of `backlog-with-reason: <path>` · `owner-gated: <owner>` · `IMPLEMENTED-NOT-VERIFIED: <case> <target>`. IDs: `V4<letter><n>` epic · `T-<EID>-NN` epic test case · `C-E<n>-NN` CONTRACT case · `Wn` wave — see `GLOSSARY.md`.
Program totals (computed by `gate-check handoff delivery/v4/`): 13 epics · 166 epic cases (SQ-A 48 · SQ-B 74 · SQ-C 44) + 60 CONTRACT cases · 0 `[REAL]`. The orchestrator recomputes this line from the epics files; it never hand-edits it.

| EID | Epic | Squad | Wave | Status | Tests (green/total) | Branch | Disposition |
|---|---|---|---|---|---|---|---|
| V4A1 | Renderer core: CLI, determinism, exit codes, `--open` routing, legacy manifest compat | SQ-A | W1 | VERIFIED | 12/12 | `epic/v4a-renderer-core` @ 1969c8f (lane merge pending) | |
| V4A2 | Block catalogue (17 types) + brand tokens + detection + badge/stamps | SQ-A | W1 | VERIFIED | 15/15 | `epic/v4a-block-catalogue` @ 1b13c28 (lane merge pending) | |
| V4A3 | Glossary panel + first-use expansion + model-ID leak lint + escape hardening + theme tokens | SQ-A | W1 | IN-PROGRESS | 0/11 | `epic/v4a-glossary-security` | |
| V4A4 | `references/report-family.md`, fixture completeness, renderer test-harness wiring | SQ-A | W1 | NOT-STARTED | 0/10 | `epic/v4a-fixtures-docs` | |
| V4B1 | `machine.json` additive superset + byte-pinned 3.0.1 baseline + negative machine fixtures | SQ-B | W1 | VERIFIED | 14/14 | `epic/v4b-machine-superset` @ ebfa067 (lane merge pending) | |
| V4B2 | `state` verb additions (triage · defaults · plan review · draft-cannot-hand-off · mode · `--run`) + `freeze --draft` | SQ-B | W1 | IN-PROGRESS | 0/15 | `epic/v4b-state-draft` | |
| V4B3 | Named runs: state-file resolution, deliveryRoot-aware verbs, `archive`, `runs`, guard resolution in both copies, grammar widening | SQ-B | W1 | IN-PROGRESS | 0/17 | `epic/v4b-named-runs` | |
| V4B4 | `mirror`, `glossary`, disposition counting in `reconcile`, ENV-FACTS tool-only fix, embedded in `handoff` | SQ-B | W1 | IN-PROGRESS | 0/16 | `epic/v4b-lints` | |
| V4B5 | Harness: AMD-4, AMD-5, exit polarity, `tests/v4/core/*` wiring, fixture index, dogfood fixture | SQ-B | W1→W2 | IN-PROGRESS | 0/12 | `epic/v4b-harness` | |
| V4C1 | SKILL.md prose: anamnesis, triage, topology axis, scope brief, two posture tables, output discipline, description budget | SQ-C | W1 | VERIFIED | 12/12 | `epic/v4c-skill-prose` @ 31edb78 (lane merge pending) | |
| V4C2 | references: seven new template skeletons, formats §9, playbooks §G, machine.md 25-state diagram | SQ-C | W1 | VERIFIED | 12/12 | `epic/v4c-references` @ 7e26aa5 (lane merge pending) | |
| V4C3 | docs + README + CHANGELOG 4.0.0 + installation note on stale installs | SQ-C | W1 | IN-PROGRESS | 0/10 | `epic/v4c-docs-release` | |
| V4C4 | Versions 4.0.0 across six sites + harness literals + `kickoff-pinning`/`changelog-shape` updates + `tests/v4/prose/*` | SQ-C | W1→W2 | NOT-STARTED | 0/10 | `epic/v4c-versions` | |

Build order inside lanes: SQ-B V4B1 → V4B2 → V4B3 → V4B4 → V4B5 (V4B3 before QA runs the v4 cases). SQ-A V4A1 → V4A2 → V4A3 → V4A4. SQ-C V4C1 ∥ V4C2 → V4C3 → V4C4 (V4C4's six-site version check goes green only after SQ-B's `machine.json` bump lands in the same W2 merge).

## Residuals

No residuals at handoff. Rows appear here only when an epic closes with a non-green item; each carries a disposition from the closed set and, for `backlog-with-reason`, the filed note's path.

| Item | Disposition | Reason / exit criterion | Evidence |
|---|---|---|---|

## Log

- 2026-09-07 22:25 — V4A1 VERIFIED on disk by the orchestrator in `.claude/worktrees/v4a-renderer-core` @ 1969c8f: 12/12 (`tests/v4/renderer/{determinism,strict-schema,render-required-fields,check-mode,open-routing,stdout-format,stamp-format}.mjs` + legacy-manifest run.mjs exit 0; T-V4A1-06 render-then-`--check` exit 0 "identical"). V4A2 VERIFIED in `.claude/worktrees/v4a-block-catalogue` @ 1b13c28: 15/15 (all `tests/v4/renderer/*` case scripts exit 0). SQ-A did not send delivery messages for either (found via the branch monitor) — reminded. `[incidental]` `tests/v4/renderer/open-routing.mjs` inherits `PLANIT_NO_OPEN` from the parent environment and fails when a caller has it set (T-V4A1-08/10 expect the open stub to be called); the test should scrub it from the child env for those cases — hermeticity, for V4A4 harness wiring. `[incidental]` rendering in THIS repo exits 2 "brand: default (guideline present, not tokenised)" because `assets/brand/` carries the Her0 guideline but no `brand.json`; expected per CONTRACT §4.4, but a tokenised `assets/brand/brand.json` for this repo is a candidate backlog item (D2). V4A3 in progress.
- 2026-09-07 22:10 — V4C2 VERIFIED on disk by the orchestrator: 11/12 in `.claude/worktrees/v4c-references` @ 7e26aa5, and 12/12 on the chained branch `epic/v4c-docs-release` (= V4C1 + V4C2, same HEAD 7e26aa5) where T-V4C2-04 (`glossary-seed.mjs`, the "15 states" sub-check owned by V4C1) passes; 4/4 reference mirrors byte-identical, mirror-check 8/8. V4C3 in progress.
- 2026-09-07 21:55 — V4C1 VERIFIED on disk by the orchestrator in `.claude/worktrees/v4c-skill-prose` @ 31edb78: 12/12 (`tests/v4/prose/{skill-sections,description-budget,local-html-rule,anamnesis-section,posture-tables}.mjs` exit 0 + 7 grep/diff cases), mirror-check 8/8, SKILL description 1,021 chars (G-15 budget 1,024 — 3 chars of headroom, note for V4C3/V4C4 edits). SQ-C lane merges as one batch at lane close (V4C4 = the W2 merge). V4C2 in progress.
- 2026-09-07 21:40 — V4B1 VERIFIED on disk by the orchestrator in `.claude/worktrees/v4b-machine-superset` @ ebfa067: 14/14 (`tests/v4/core/{machine-additive,machine-negatives,machine-pin,guided-unchanged}.mjs` all exit 0), `machine-diff` PASS vs both pins, mirror-check 8/8, pin sha unchanged, machine 4.0.0 with 25 states. Merge policy: SQ-B lands as ONE batched lane merge after V4B5 (runbook §3.3) — on the branch, `run-contract` is 50/51 (T-E1-05 red until AMD-4 in V4B5) and `version-triple-match` red until W2; both are expected intermediate reds, not residuals. SQ-B started V4B2.
- 2026-09-07 21:05 — W0 CLOSED. Package + guard mirror fix committed `ab0c192` (A-4). Byte-pin `tests/fixtures/v3/machine.v3.7fcff27.json` sha256 `05d2147b…074eb` (== live 3.0.1 machine.json). 13 worktrees `.claude/worktrees/<branch-slug>` on `epic/v4{a,b,c}-*`. Tally re-derived from disk: `gate-check contract` 60 case rows (computed 60); `gate-check handoff` PASS 13 epics declared == counted, 173 distinct IDs; `node tests/run-contract.mjs` **51/51 + 25/25**; `gate-check mirror-check` **8/8**. CONTRACT sha256 matches the KICKOFF pin. W1 signalled to SQ-A/SQ-B/SQ-C via SendMessage.

- 2026-09-07 20:30 — PLAN-REVIEW ratified as recommended by Fernando Ott (no contradictions); CONTRACT v1.0 frozen; package handed off (state `done`). Next: Fernando opens the five sessions in SESSIONS.md.
- 2026-09-07 20:20 — `[incidental]` the 3.0.1 handoff lint scans forward from a `Count:` line to the next heading; a count line placed BELOW its table counts zero rows and is silently skipped (no failure, no ok line). SQ-C's four epics were affected and re-headed; disposition: backlog-with-reason for V4B5 (harness) — a `Count:` with zero rows in its block should be a lint finding, not silence.
- 2026-09-07 19:55 — handoff reached: `gate-check handoff delivery/v4/` PASS (173 distinct case IDs across 13 files, every epic declared == counted); `gate-check adversary delivery/v4/` PASS (5/5 cascade classes). CONTRACT v1.1-draft frozen for squads; PLAN-REVIEW pending.
- 2026-09-07 19:40 — AMENDMENT v1.0-draft → v1.1-draft folding 21 squad corrections; 0 cases added or removed (60).
- 2026-09-07 19:10 — CONTRACT v1.0-draft frozen (freeze + contract verbs green, 60 cases). Squads SQ-A/SQ-B/SQ-C dispatched for PRDs + epics.
- 2026-09-07 18:30 — discovery complete: four research streams verified on disk; preflight L 9/9 after the guard mirror fix.
- 2026-09-07 — `[incidental]` the plugin's guard hook lacked the named-state fix from commit 7fcff27 (mirror drift, T-E5-02 red); copied root → plugin during planning, uncommitted, pending A-4. `[incidental]` an ABSENT preflight probe blacklists every token of its argv (C-W2-03), fixed by case C-E6-03. `[incidental]` `formats.md §9` cited by `gate-check preflight` does not exist (LG-6), closed by V4C2.
