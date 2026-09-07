# PLAN-REVIEW — plan-it v4 · the one review-and-contradict round (gate G4)

Reviewed-by: Fernando Ott 2026-09-07 — ratified as recommended: R1–R12 confirmed as applied; A-1, A-3, A-4 granted; A-2 held until owner action O-2; no contradictions. The CONTRACT is v1.0 and the package handed off the same day.
HTML twin: `PLAN-REVIEW.html` (hand-rendered this run; opened in Chrome). Markdown is canonical.
Legend: `Rn` default the run applied · `A-n` authorization · `O-n` owner action · `Dn` your earlier ruling · `V4<letter><n>` epic · `C-E<n>-NN` CONTRACT case — see `GLOSSARY.md`.

## What you are looking at

The complete draft package for plan-it 4.0.0, produced end to end without stopping after your rulings on the analysis report (autonomous-draft mode, D1). Everything below is on disk under `delivery/v4/` and `docs/v4/`. Every count on this page was computed by the gate-check verbs, not typed.

```
docs/v4/
  01-findings.md          synthesis of four research streams + 18 measured facts
  02-v4-design.md         the additive design (statechart, verbs, renderer, prose, topology)
  research/               stream-A..D reports + the coordinator's grounding file
delivery/v4/
  CONTRACT.md             v1.0 · 60 enforcement cases · frozen, ratified at this review
  DECISIONS.md / .html    rulings D1–D7 · defaults R1–R12 · authorizations A-1..A-4 · owner actions O-1..O-3
  GATE.md                 the autonomy contract the build reads
  GLOSSARY.md             every ID and acronym, one line each
  00-program-plan.md      sessions · waves · runbook · test standard
  STATUS.md               the board: 13 epics, all NOT-STARTED
  SESSIONS.md             5 sessions with launch prompts
  KICKOFF.md              pinning · re-derive step · first slice · gotchas · the orchestrator's launch prompt
  TEST-CONTRACT-REVIEW.md the case review (FD-2)
  prds/prd-{a,b,c}-*.md   one PRD per squad
  epics/epics-{a,b,c}-*.md 13 epics, each ending in a binding Test Contract
```

| Measure | Value | Computed by |
|---|---|---|
| Epics | 13 (SQ-A 4 · SQ-B 5 · SQ-C 4) | `gate-check handoff` (declared == counted per epic) |
| Epic test cases | 166 (48 · 74 · 44) | same |
| CONTRACT enforcement cases | 60 (1 manual, ~2%) | `gate-check contract` |
| `[REAL]` cases needing a live target | 0 | same |
| Failure states modelled / cascade classes covered | 6 / 5 of 5 | `gate-check adversary` |
| Baseline after the guard mirror fix | run-contract 51/51 + 25/25 · mirror-check 8/8 · preflight 9/9 | measured 2026-09-07 |

## Read these three first

1. **R1 — how autonomous-draft keeps Rule 1.** Squads build against a contract frozen as a draft; this review ratifies it into v1.0; a contradiction that changes the CONTRACT re-enters the squads as an amendment. Alternative: review before squads write (praxya's order). This is the one default that changes how a run feels.
2. **The guard fix that was never installed** (CONTRACT cases C-E9-07, C-E9-08). The named-run fix from commit 7fcff27 lived only in the root copy; the plugin copy Claude Code runs never had it. It is mirrored now (uncommitted, authorization A-4) and v4 makes the resolution rule robust (by the package folder, not a path convention).
3. **The renderer's escaping case** (C-E2-12). The renderer being ported can be broken out of with an upper-case `</SCRIPT>`. v4 fixes it and asserts it.

## The twelve defaults (contradict by writing `Rn: <alternative>`)

| ID | Default applied | Alternative not taken |
|---|---|---|
| R1 | draft contract for squads → one review round → v1.0 → amendment loop on contradiction | review before squads write |
| R2 | "owner decision" triage verdict exits to closed-without-plan with a memo + reopen condition | back into the questionnaire |
| R3 | typed ruling tags canonical in markdown; glyphs are decoration | glyphs as source of truth |
| R4 | optional Deadline column; owner actions with deadlines surface at close | no column |
| R5 | orchestrator = top tier in RUN-POLICY | unspecified |
| R6 | incidental findings in the STATUS log, tagged, never in the case tally | separate file |
| R7 | brand accents as chip backgrounds in light mode; muted text Steel (WCAG measured) | guideline colours as text |
| R8 | mirror pairs 8 → 11 | 9 |
| R9 | mermaid 10.9.1 pinned on cdnjs, strict, text fallback offline | 11.x |
| R10 | the state file names the package folder; verbs derive paths from it | keep `delivery/v3/` literals |
| R11 | harness amendments AMD-4 (gate count) and AMD-5 (11 pairs), like AMD-1/AMD-2 | fork the gate concept |
| R12 | renderer is a separate script, not a gate-check verb | a gate-check verb |

Full rationale per row: `DECISIONS.md` — Defaults. Full design consequences: `docs/v4/02-v4-design.md`.

## Authorizations the build needs (answer `A-n: grant` or `A-n: hold`)

| ID | Question | Recommended |
|---|---|---|
| A-1 | squads commit to `epic/v4*`; orchestrator merges to `main` overnight | grant |
| A-2 | orchestrator tags and pushes 4.0.0 + marketplace entry | hold until you have read QA-REPORT.md (O-2) |
| A-3 | QA opens Chrome for rendered twins; headless fallback sessions allowed | grant |
| A-4 | commit the guard mirror fix as the first W0 commit | grant |

Owner actions (only you; none blocks the build): O-1 remove the stale installs before the tag · O-2 read QA-REPORT.md, then decide A-2 · O-3 ratify R7 or send colours.

## What happens if you answer nothing

Nothing irreversible. The CONTRACT stays `v1.1-draft`, the state stays `handoff` with a draft contract, and the machine refuses to hand off a draft. No session is opened, no commit is made, no tag is pushed. When you answer, the coordinator threads contradictions through the affected files (coherence pass), re-freezes the CONTRACT as v1.0, re-pins KICKOFF block 0, and the package is ready for the five terminals in `SESSIONS.md`.

## Amendments already folded (for the record)

v1.0-draft → v1.1-draft on 2026-09-07: 21 corrections the three planning squads flagged (ownership table, state-id casing, mirror recomputes hashes itself, `gates.G2.pendingReview`, regex duplication rule, glossary seed at intake, interim epic-heading grammar, ENV-FACTS tool column, dogfood ownership split, one backticked mention). Zero cases added or removed.

## Known limitations of this planning run (honest states)

- This run executed on the 3.0.1 machine (17 states), so G2 and G3 were recorded as coordinator defaults pending this review instead of the v4 `defaultsApplied` / `planReview` states the design adds. The state file records `pendingReview: true` on both.
- The 3.0.1 `reconcile` embedded in `handoff` scans `delivery/v3/` by literal; the coordinator reconciled the v4 package by hand (declared == counted for all 13 epics via `handoff`'s own per-epic check). R10 fixes the literal.
- The HTML twins on this run (DECISIONS, PLAN-REVIEW, KICKOFF) are hand-rendered following the renderer's contract (stamps, brand badge, glossary panel). The v4 renderer replaces the hand render; the markdown is canonical.
- The run's own state file has the legacy generic name; the rename to `.plan-it/v4.state.json` is a W2 step after V4B3 lands.

## Copy your rulings

```
R1: ok · R2: ok · R3: ok · R4: ok · R5: ok · R6: ok · R7: ok · R8: ok · R9: ok · R10: ok · R11: ok · R12: ok
A-1: grant · A-2: hold until O-2 · A-3: grant · A-4: grant
Reviewed-by: Fernando Ott 2026-09-07
```
