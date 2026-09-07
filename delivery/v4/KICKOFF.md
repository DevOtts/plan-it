# KICKOFF — plan-it v4 (orchestrator run)

**One-liner:** Ship plan-it 4.0.0 — the release that makes a planning run legible to the human (HTML report twins, a scope brief, a decision queue, a glossary, readable acronyms) and autonomous end to end (one up-front questionnaire, one review round, a chosen build topology with named sessions and an autonomy contract, named runs, honest residual dispositions) — built overnight by three squad sessions and a QA session under one orchestrator, additive over the v2/v3 core.

Legend: `V4<letter><n>` epic · `T-<EID>-NN` epic test case · `C-E<n>-NN` CONTRACT case · `Wn` wave · `A-n` authorization · `O-n` owner action · `AMD-n` amendment — see `GLOSSARY.md`.

## 0. Pinning (machine-checkable resume anchor — always first)

```
Repo:     /Users/macbook/Workspace/Devotts/plan-it @ 7fcff27a03e886b2f29137b9dd89d01d1040b601
State:    /Users/macbook/Workspace/Devotts/plan-it/.plan-it/state.json   (run "v4"; legacy generic name until V4B3 lands — see W2)
Contract: /Users/macbook/Workspace/Devotts/plan-it/delivery/v4/CONTRACT.md sha256=a7f28d034b789907e4f1dbabe26786a66ac7ed01073c3fa7b4af8171aca865f3   (v1.0 — ratified at PLAN-REVIEW 2026-09-07)
```
The pinned SHA is the last commit; the planning package under `delivery/v4/`, `docs/v4/`, the guard mirror copy and `.plan-it/state.json` are uncommitted at handoff. W0's first action commits them and re-pins this block.

## 1. Re-derive tally + reconcile from disk (the orchestrator's first instruction)

Recompute the board from `.plan-it/state.json` + the CONTRACT `## Cases` table + every `epics/*.md` Test Contract: run `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs contract delivery/v4/CONTRACT.md` (expect 60 case rows) and `gate-check handoff delivery/v4/` (expect declared == counted for 13 epics and 173 distinct case IDs). Reconcile against every total claimed in STATUS.md and below; on any mismatch, stop and report — never build on a stale board. Resume is pinned-only: a fresh session re-enters through block 0 + the state file, never through chat-history archaeology.

## 2. What you are building

Ten enhancements (E1–E10) across three lanes: a zero-dependency renderer and report family (SQ-A), the additive statechart, verbs, guard and harness (SQ-B), and the prose, templates, docs and 4.0.0 packaging (SQ-C). The v4 CONTRACT is the law; `docs/v4/02-v4-design.md` is the design; `docs/v4/01-findings.md` is the evidence.

## 3. First concrete slice (W0, orchestrator alone)

1. Commit the planning package and the guard mirror copy (authorization A-4): `git add delivery/v4 docs/v4 .plan-it plugins/plan-it/scripts/hooks/planit-guard.mjs CLAUDE.md delivery/decisions.md ENV-PROBES.json ENV-FACTS.md assets/brand` then one commit `chore(plan): plan-it v4 package (CONTRACT v1.0, 13 epics, 166+60 cases)`. Re-pin block 0.
2. Byte-pin the 3.0.1 machine: `cp plugins/plan-it/skills/plan-it/machine.json tests/fixtures/v3/machine.v3.7fcff27.json` (V4B1 verifies its SHA-256 and never overwrites).
3. Create worktrees for `epic/v4a-*`, `epic/v4b-*`, `epic/v4c-*` (names in STATUS.md); squads edit only there.
4. Record AMD-4 and AMD-5 as executed in `delivery/decisions.md` when V4B5 and W2 land them (the planned entries exist).
5. Copy the GLOSSARY static seed into the package (already present as `GLOSSARY.md`; keep it current as IDs are minted).
6. Run `node tests/run-contract.mjs` and `gate-check mirror-check`; write both tallies to `STATUS.md ## Log`. Expect 51/51 + 25/25 and 8/8 before any v4 code.

## 4. Where code lives

| Path | Default branch | Owner |
|---|---|---|
| `/Users/macbook/Workspace/Devotts/plan-it` (single repo) | `main` | orchestrator merges |
| `plugins/plan-it/skills/plan-it/` (canonical plugin) + root mirrors (`SKILL.md`, `machine.json`, `scripts/`, `references/`, `assets/brand/default.brand.json`) | — | mirror pairs 11 after W2 |
| `tests/` (`run-contract.mjs`, `v3/`, `v4/`, `fixtures/`) | — | SQ-B / SQ-C per CONTRACT §2 |

## 5. Locked decisions (each with rationale)

Rulings D1–D7 (Fernando, 2026-09-07) and defaults R1–R12 (coordinator, ratified at PLAN-REVIEW 2026-09-07) with their rationale live in `DECISIONS.md`; the answered set projects into `GATE.md`. The three that shape the build most: R1 (squads build against a draft contract; the human's one review round ratifies it), R10 (every verb resolves the package folder from the state file, never a literal), R11 (two harness amendments, AMD-4 gate count and AMD-5 mirror pairs).

## 6. Phase / wave order

W0 orchestrator prep → W1 SQ-A ∥ SQ-B ∥ SQ-C → W2 integration (mirror pairs 11, versions 4.0.0 in one merge, state-file rename, prose-vs-machine cross-check) → W3 QA (all cases + dogfood) → W4 release (after owner action O-2 and authorization A-2). Build orders inside lanes are in STATUS.md.

## 7. How to run + test (prerequisites + verifiability precheck)

Prerequisites (probed, `ENV-FACTS.md`): node v20.19.2, sh, git, gh authenticated, Google Chrome, `open`. Everything runs offline; network-dependent behaviour (mermaid, fonts) is asserted by the presence of the pinned URL, never fetched. Per epic: the `run:` column of its Test Contract. Release: CONTRACT §7 (run-contract 100% v2+v3+v4 · fail-closed-sweep · mirror-check 11/11 · machine-diff both baselines · version match · changelog shape · dogfood run to handoff).

## 8. Gotchas (each is a trap already seen)

- The 3.0.1 epic-heading grammar cannot see `V4B1`-style IDs until V4B3 widens it; every v4 epic heading stays `## Epic V4<letter><n> — <title>` (CONTRACT §5).
- The 3.0.1 `reconcile`, `contract --dir` and `adversary --dir` scan `delivery/v3/` by literal; run them positionally on `delivery/v4/…` until V4B3 lands (R10).
- An ABSENT preflight probe blacklists every argv token, including `node` (C-E6-03 fixes it); do not probe with `node …` for facts that are expected to be absent.
- The guard fix must land in BOTH the plugin copy and the root mirror; the release gate `mirror-check` fails otherwise — that is exactly how 7fcff27 stayed uninstalled for two weeks.
- The SKILL description truncates silently past 1,024 characters (platform) and shows only 250 in listings; cut before adding.
- Version literals live in six sites plus two harness constants; flip all in one W2 merge or `version-triple-match` is red in between.
- The model-ID regex is duplicated in the guard and the renderer by design; change both or C-E2-09 fails.
- Headless (`claude -p`) sessions die on "wait for a notification"; every prompt says poll.

## 9. Handoff state

Committed: nothing of v4 yet (the pinned SHA is 3.0.1 + the guard commit). On disk, uncommitted: the whole package (`delivery/v4/`, `docs/v4/`), `.plan-it/state.json` (state `done`, contract v1.0), the guard mirror copy, `CLAUDE.md` test-conventions block, `delivery/decisions.md` v4 section, `ENV-PROBES.json`, `ENV-FACTS.md`, `assets/brand/`. Answered: PLAN-REVIEW ratified (R1–R12), A-1/A-3/A-4 granted, A-2 held until O-2 — all in `GATE.md`. Open owner actions: O-1 (stale installs, before the tag), O-2 (read QA-REPORT.md, then decide A-2). Decisions owed by the build: none; new ones append to GATE.md.

## Launch prompt (the orchestrator session — open first, `/rename v4-orchestrator`, paste)

```
/session-init then act as the ORCHESTRATOR for plan-it v4 (the plugin release: HTML report layer, anamnesis + one review round, build topology, named runs, glossary).

Package: /Users/macbook/Workspace/Devotts/plan-it/delivery/v4/ — read KICKOFF.md (pinning block first, then re-derive the tally from disk), CONTRACT.md (the law, v1.0 after PLAN-REVIEW), GATE.md (every human input answered; the run is ungated), 00-program-plan.md (your runbook §3), STATUS.md (your board). Design context on demand: docs/v4/01-findings.md, docs/v4/02-v4-design.md.

Your job, to conclusion:
1. W0 yourself: commit the planning package and the guard mirror fix (authorization A-4); byte-pin tests/fixtures/v3/machine.v3.7fcff27.json from the 3.0.1 machine.json; create the epic/v4a-*, epic/v4b-*, epic/v4c-* worktrees; record AMD-4/AMD-5 in delivery/decisions.md; copy the GLOSSARY seed; run `node tests/run-contract.mjs` and `gate-check mirror-check` and record both tallies in STATUS.md ## Log.
2. Squad sessions v4-sq-a-renderer, v4-sq-b-core, v4-sq-c-prose are open and polling. Signal W1 via SendMessage; verify their output ON DISK (idle ≠ delivered: branches, commits, files, each epic's local gate); merge per lane after its Test Contract is green (authorization A-1); flip STATUS.md rows with evidence; respect the build orders in KICKOFF.md.
3. Cross-cutting contradictions → amend CONTRACT.md yourself (dated AMD-n in delivery/decisions.md, version bump) and notify affected squads. New genuinely-human decisions → append to GATE.md, take the conservative reversible path, morning report. Rule yourself only if capped, reversible and covered by an existing answer — otherwise "your word, not ours".
4. W2: MIRROR_PAIRS 11, root mirrors synced, version 4.0.0 across six sites and both harness literals in ONE merge, CHANGELOG 4.0.0, `mv .plan-it/state.json .plan-it/v4.state.json` after V4B3 lands, cross-check SKILL.md posture-table state names against the live machine.json.
5. W3: signal v4-qa to run every case (166 epic cases + 60 CONTRACT cases) and the dogfood run; IMPLEMENTED-NOT-VERIFIED with reason for anything unreachable — never a fake green.
6. Usage-limit resilience (MANDATORY): keep a scheduled-wakeup chain alive (≤3600s hops) until W3 closes; persist state to .taskstate/v4/ + STATUS.md before every idle; on a limit, resume after reset — never park on Fernando.
7. Worktrees-only for every squad (G-10). Any headless fallback session polls STATUS and git; it never waits on a notification (G-11). Reap each squad's agents when its wave closes.
8. Morning deliverable: honest per-epic report (VERIFIED / IMPLEMENTED-NOT-VERIFIED with reasons), residuals with dispositions, incidental findings, and what Fernando should read first (QA-REPORT.md, then decide A-2). Do NOT tag or push 4.0.0 (A-2 is held until owner action O-2). Close with /conclude-it.
```

The four other sessions (three squads, QA) and their prompts: `SESSIONS.md`.
