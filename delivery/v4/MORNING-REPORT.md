---
type: report
title: "plan-it 4.0.0 — morning report (orchestrator, W0–W3)"
description: "Honest per-epic outcome of the overnight v4 build: what is VERIFIED, what is not, residuals with dispositions, incidental findings, and what to read first."
status: final (SHIPPED — v4.0.0 tagged and pushed 2026-09-07 after A-2)
verified: 2026-09-07
repos: [plan-it]
tags: [plan-it, v4, release, report]
---

# plan-it 4.0.0 — morning report

Legend: `V4<letter><n>` epic · `T-<EID>-NN` epic test case · `C-E<n>-NN` CONTRACT case · `Wn` wave · `A-n` authorization · `O-n` owner action · `AMD-n` amendment — see `GLOSSARY.md`.

## Read this first

1. `delivery/v4/QA-REPORT.md` — QA's independent run of every case against the merged tree — final: **231 cases · 229 PASS · 2 MANUAL · 0 FAIL** (first pass 230 cases 228/2/0 on main 5189a04; "Re-verify after AMD-12" section on main efa5bf7).
2. **A-2 granted, v4.0.0 tagged and pushed.** Do **O-1** now: remove the stale installs (`plan-it@plan-it` enablement, the `plan-it/` marketplace dir, the user-level 2.1.0 skill copy) and install `plan-it@devotts` 4.0.0 — case C-E11-07, the one CONTRACT case that stays MANUAL by design, and the prod check of this release.
3. Two small owner calls that do not block: **O-4** (redact-or-keep model-ID citations in the research records) and **O-5** (confirm the `run.mode` relabel of this run's state file). Both are in `GATE.md`.

## Outcome in one line

All 13 epics are **VERIFIED** by the orchestrator on disk (every `run:` cell exit code as expected; `node tests/run-contract.mjs` exit 0 on main) and re-run on `main`; QA independently found **0 FAIL**; every release gate of CONTRACT §7 is green on `main`; the only non-green item is the owner-gated manual case C-E11-07. **Shipped**: A-2 granted 2026-09-07; `v4.0.0` tagged on `be9cf58` and pushed with main. Still yours: **O-1** (stale installs → install `plan-it@devotts` 4.0.0), which is also the only prod verification not yet done.

## Per-epic (from STATUS.md, computed)

| EID | Epic | Squad | Status | Tests (local gate) | Disposition |
|---|---|---|---|---|---|
| V4A1 | Renderer core: CLI, determinism, exit codes, `--open` routing, legacy manifest compat | SQ-A | VERIFIED | 14/14 · exit 0 on every `run:` cell, re-run on main | — |
| V4A2 | Block catalogue (17 types) + brand tokens + detection + badge/stamps | SQ-A | VERIFIED | 15/15 · exit 0 on every `run:` cell, re-run on main | — |
| V4A3 | Glossary panel + first-use expansion + model-ID leak lint + escape hardening + theme tokens | SQ-A | VERIFIED | 13/13 · exit 0 on every `run:` cell, re-run on main | — |
| V4A4 | `references/report-family.md`, fixture completeness, renderer test-harness wiring | SQ-A | VERIFIED | 10/10 · exit 0 on every `run:` cell, re-run on main | — |
| V4B1 | `machine.json` additive superset + byte-pinned 3.0.1 baseline + negative machine fixtures | SQ-B | VERIFIED | 14/14 · exit 0 on every `run:` cell, re-run on main | — |
| V4B2 | `state` verb additions (triage · defaults · plan review · draft-cannot-hand-off · mode · `--run`) + `freeze --draft` | SQ-B | VERIFIED | 15/15 · exit 0 on every `run:` cell, re-run on main | — |
| V4B3 | Named runs: state-file resolution, deliveryRoot-aware verbs, `archive`, `runs`, guard resolution in both copies, grammar widening | SQ-B | VERIFIED | 17/17 · exit 0 on every `run:` cell, re-run on main | — |
| V4B4 | `mirror`, `glossary`, disposition counting in `reconcile`, ENV-FACTS tool-only fix, embedded in `handoff` | SQ-B | VERIFIED | 17/17 · exit 0 on every `run:` cell, re-run on main | — |
| V4B5 | Harness: AMD-4, AMD-5, exit polarity, `tests/v4/core/*` wiring, fixture index, dogfood fixture | SQ-B | VERIFIED | 12/12 · exit 0 on every `run:` cell, re-run on main | — |
| V4C1 | SKILL.md prose: anamnesis, triage, topology axis, scope brief, two posture tables, output discipline, description budget | SQ-C | VERIFIED | 12/12 · exit 0 on every `run:` cell, re-run on main | — |
| V4C2 | references: seven new template skeletons, formats §9, playbooks §G, machine.md 25-state diagram | SQ-C | VERIFIED | 12/12 · exit 0 on every `run:` cell, re-run on main | — |
| V4C3 | docs + README + CHANGELOG 4.0.0 + installation note on stale installs | SQ-C | VERIFIED | 10/10 · exit 0 on every `run:` cell, re-run on main | — |
| V4C4 | Versions 4.0.0 across six sites + harness literals + `kickoff-pinning`/`changelog-shape` updates + `tests/v4/prose/*` | SQ-C | VERIFIED | 10/10 · exit 0 on every `run:` cell, re-run on main | — |

13/13 VERIFIED. Epic cases: 171 epic cases (SQ-A 52 · SQ-B 75 · SQ-C 44) · CONTRACT cases: 60 (59 PASS, 1 MANUAL).

## Release gates (CONTRACT §7) on `main`

| Gate | Result |
|---|---|
| `node tests/run-contract.mjs` | v2/v3 51/51 · v3 cases 25/25 · v4 cases 58/58 mechanism-ready + 1 MANUAL (C-E11-07) · exit 0 |
| `tests/v3/fail-closed-sweep.mjs` | 25/25 |
| `gate-check mirror-check` | 11/11 byte-identical (AMD-5 executed) |
| `gate-check machine-diff` vs `machine.v3.7fcff27.json` and `machine.v2.fc6abc8.json` | PASS, PASS (25 states, additive) |
| `tests/v3/version-triple-match.mjs` | 4.0.0 at plugin.json = marketplace = both SKILL.md = both machine.json = CHANGELOG |
| `tests/v3/changelog-shape.mjs` | PASS (E1–E10 enumerated) |
| dogfood `tests/fixtures/v4/dogfood-project/` | state resume · handoff · mirror --require-html · glossary · runs — 5/5 (QA) |
| this package's own v4 `handoff delivery/v4/` (embeds reconcile · glossary · mirror) | PASS; five twins fresh with first-use expansions |

## Residuals (closed dispositions)

| Item | Disposition | Reason / exit criterion | Evidence |
|---|---|---|---|
| C-E11-07 stale installs removed + 4.0.0 installed | owner-gated: Fernando Ott (O-1) | only the owner can touch the live plugin registry; do before the tag | run-contract MANUAL row; GATE.md O-1 |
| T-V4C3-10 docs visual read | PASS by QA (human read) — not a residual | recorded MANUAL in QA-REPORT.md | QA-REPORT.md |

Dispositions: 0 backlog · 1 owner-gated · 0 INV.

## Amendments the orchestrator made (CONTRACT v1.0 → v1.5; case count unchanged at 60)

| ID | What |
|---|---|
| AMD-6 | orchestrator ruling (capped, reversible, applies existing answers; CONTRACT.md text unchanged, v1.0 stands). |
| AMD-7 | orchestrator amendment, CONTRACT v1.0 → v1.1 (cases unchanged at 60). |
| AMD-8 | orchestrator amendment, CONTRACT v1.1 → v1.2 (cases unchanged at 60). |
| AMD-9 | orchestrator amendment at epic level (CONTRACT text unchanged, v1.2). |
| AMD-10 | orchestrator amendment, CONTRACT v1.2 → v1.3 (cases unchanged at 60). |
| AMD-11 | orchestrator amendment, CONTRACT v1.3 → v1.4 (cases unchanged at 60). |
| AMD-12 | orchestrator amendment (W3), CONTRACT v1.4 → v1.5 (cases unchanged at 60). |

Every amendment is dated in `delivery/decisions.md`, mirrored in the CONTRACT Changelog, and carries a binding test hook. Five of the seven came from **running the new v4 lints and renderer against this very package** (dogfood), which is exactly what they are for.

## Incidental findings (unasked-for, dispositioned)

- QA reports a forked verifier it dispatched briefly overstepped its scope (tried to redo all of W3); caught and narrowed, no writes — noted for the build-it/QA playbook (scope-lock the prompt of verifier forks).
- running T-V4A1-13 (`tests/v4/renderer/stamp-relpath-subdir.mjs`) writes `tests/fixtures/v4/report/manifest-in-subdir/REPORT.html` into the fixture directory (untracked file after every harness run); disposition: backlog-with-reason → SQ-A fix branch `epic/v4a-fix-subdir-output` requested (render to a temp dir), merge after QA. Removed from the main tree by the orchestrator.
- GLOSSARY.md range cells (`D1 … D7`) resolved by `gate-check glossary` but not by the renderer's glossary panel — §5 says one literal ID or family pattern per row; expanding to one row per ID (agent, in progress).
- `tests/v4/renderer/open-routing.mjs` inherits `PLANIT_NO_OPEN` from the parent environment and fails when a caller has it set (T-V4A1-08/10 expect the open stub to be called); the test should scrub it from the child env for those cases — hermeticity, for V4A4 harness wiring.
- rendering in THIS repo exits 2 "brand: default (guideline present, not tokenised)" because `assets/brand/` carries the Her0 guideline but no `brand.json`; expected per CONTRACT §4.4, but a tokenised `assets/brand/brand.json` for this repo is a candidate backlog item (D2). V4A3 in progress.
- the 3.0.1 handoff lint scans forward from a `Count:` line to the next heading; a count line placed BELOW its table counts zero rows and is silently skipped (no failure, no ok line). SQ-C's four epics were affected and re-headed; disposition: backlog-with-reason for V4B5 (harness) — a `Count:` with zero rows in its block should be a lint finding, not silence.
- the plugin's guard hook lacked the named-state fix from commit 7fcff27 (mirror drift, T-E5-02 red); copied root → plugin during planning, uncommitted, pending A-4.
- an ABSENT preflight probe blacklists every token of its argv (C-W2-03), fixed by case C-E6-03.
- `formats.md §9` cited by `gate-check preflight` does not exist (LG-6), closed by V4C2.

## Owner actions (GATE.md)

| # | Item | Owner | When |
|---|---|---|---|
| O-1 | Remove the stale installs (`plan-it@plan-it` enablement, the `plan-it/` marketplace dir, the user-level 2.1.0 skill copy) and install `plan-it@devotts` 4.0.0 (case C-E11-07) | Fernando | before the 4.0.0 tag |
| O-2 | Read `delivery/v4/QA-REPORT.md`, then give the tag/push go (A-2) | Fernando | after W3 |
| O-5 | Confirm the relabel of this run's recorded `run.mode` from `autonomous-draft` to `guided` in `.plan-it/v4.state.json` (W2): the state history is the 3.0.1 guided path (decisionGate, freezeGate) because the run executed on the 3.0.1 machine; the autonomous-draf… | Fernando | any time; not blocking |
| O-4 | Decide whether the six literal model-ID citations in the research records (`docs/research/v3/stream-A-pxpipe.md`, `docs/research/v3/stream-B-damonade.md`, `docs/v4/research/stream-A-renderer.md`) should be redacted to placeholders or stay as quoted evidence (A… | Fernando | any time; not blocking |
| O-3 | Ratify R7 (brand contrast deviation) — RATIFIED with R1–R12 at PLAN-REVIEW 2026-09-07 (send exact colours later only if the default twins look wrong) | Fernando | closed |

## What went well / what to change next time

- Disjoint lanes + worktrees-only: zero merge conflicts across 13 epics, 3 fix branches and 7 amendments.
- "Verify on disk, not on done" caught nothing false — every squad tally matched the orchestrator's re-run — but the *dogfood* of the new lints on the package itself found seven real defects the case fixtures could not see. Add "run the new gates against the package that specifies them" as a standing W2 step.
- Planning-time gaps found at build time: two `run:` mechanisms (awk range, sweep scope), backticked scaffold pointers, one CONTRACT case with no owner (C-E2-11), and a grammar collision (defaults `R<n>` vs PRD requirements). All cheap to catch with a "dry-run every run: cell against the pinned tree" step before handoff.
- Timestamps: the orchestrator's first log entries used a guessed clock; corrected from commit times. Always `date`.

## Final numbers

| What | Count |
|---|---|
| Epics VERIFIED | 13 / 13 |
| Epic cases (SQ-A 52 · SQ-B 75 · SQ-C 44) | 171, all PASS except T-V4C3-10 (human read, PASS by QA) |
| CONTRACT cases | 60: 59 PASS · 1 MANUAL (C-E11-07, owner-gated O-1) |
| Orchestrator amendments | 7 (AMD-6 … AMD-12), CONTRACT v1.0 → v1.5, case count unchanged |
| Fix branches merged after lane close | 4 (SQ-A ×3, SQ-C ×1) |
| Merge commits to main | SQ-A lane · W2 (SQ-B + SQ-C, one merge) · 4 fixes · 2 QA |

## Not done, on purpose

- No `git tag 4.0.0`, no push, no marketplace edit (A-2 held until O-2).
- The research records' six literal model-ID citations are untouched (O-4).
- Squad worktrees under `.claude/worktrees/` and the epic branches are left in place for your inspection; `/reconcile-it` can prune them after the tag.
