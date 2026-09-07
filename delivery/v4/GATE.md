# GATE — plan-it v4 · human decisions & authorizations (the autonomy contract)

> Everything the build needs from a human, answered up front so the orchestrator and squads run to conclusion without waking anyone. All rows below are ANSWERED — the run is ungated (PLAN-REVIEW ratified 2026-09-07). Anything new the build surfaces is appended here by the orchestrator and, only if truly blocking, parked as IMPLEMENTED-NOT-VERIFIED — never guessed.
> Legend: `Dn` ruling · `Rn` default applied by the run · `A-n` authorization · `O-n` owner action · `G-n` governance rule — see `GLOSSARY.md`. Markdown twin of the decision queue: `DECISIONS.md`.

## Answered (owner: Fernando Ott · 2026-09-07)

| # | Type | Decision / authorization | Answer |
|---|---|---|---|
| D1 | decision | Default interaction mode | autonomous-draft; guided selectable at anamnesis |
| D2 | decision | Brand for rendered twins | target repo's brand guideline if present, else DevOtts' default at `assets/brand/` |
| D3 | decision | Where HTML lives | beside its markdown twin, always created locally, opened only at human gates, never a claude.ai artifact |
| D4 | decision | Build topology choice | user's choice at G1 with plan-it's recommendation shown |
| D5 | decision | Copy-your-rulings block | ships in 4.0 |
| D6 | decision | Release scope | all ten enhancements in 4.0.0 |
| D7 | decision | How v4 itself is built | orchestrator + three squads + QA |
| G1 | decision | Scope | Size L, shape 3, package `delivery/v4/`, design docs `docs/v4/` |
| — | decision | KICKOFF.md + single launch prompt stay; markdown stays canonical for the AI; every acronym explained on first use + GLOSSARY.md | ratified in the rulings message 2026-09-07 |

## Answered at PLAN-REVIEW (owner: Fernando Ott · 2026-09-07 · gate G4)

| # | Type | Decision / authorization | Answer |
|---|---|---|---|
| R1–R12 | decision | the twelve coordinator defaults (draft-contract mechanics, owner-decision routing, typed tags, deadline column, orchestrator tier, incidental channel, brand contrast, 11 mirror pairs, mermaid 10.9.1, deliveryRoot resolution, AMD-4/AMD-5, renderer placement) | `[DECIDED]` confirmed as applied — rationale per row in `DECISIONS.md` |
| A-1 | authorization | Squads commit to `epic/v4*` branches; the orchestrator merges to `main` overnight without a per-merge ping | GRANTED |
| A-2 | authorization | The orchestrator tags and pushes 4.0.0 and updates the marketplace entry | HELD until owner action O-2 (read QA-REPORT.md first) — the orchestrator does not tag |
| A-3 | authorization | QA opens Chrome on this Mac for `--open` at gates; headless fallback sessions if a terminal sticks | GRANTED |
| A-4 | authorization | The orchestrator commits the guard mirror fix applied during planning as its first W0 commit | GRANTED |
| G4 | decision | CONTRACT v1.1-draft → v1.0 | RATIFIED, no contradictions; the run is ungated |

## Still human, but NOT blocking the run

| # | Item | Owner | When |
|---|---|---|---|
| O-1 | Remove the stale installs (`plan-it@plan-it` enablement, the `plan-it/` marketplace dir, the user-level 2.1.0 skill copy) and install `plan-it@devotts` 4.0.0 (case C-E11-07) | Fernando | before the 4.0.0 tag |
| O-2 | Read `delivery/v4/QA-REPORT.md`, then give the tag/push go (A-2) | Fernando | after W3 |
| O-3 | Ratify R7 (brand contrast deviation) — RATIFIED with R1–R12 at PLAN-REVIEW 2026-09-07 (send exact colours later only if the default twins look wrong) | Fernando | closed |

## Standing rules the orchestrator enforces

- A usage/session limit never parks the run: persist state → scheduled-wakeup chain (≤3600 s hops) → resume after reset. Never wait for Fernando.
- A `[REAL]` or unrunnable case is IMPLEMENTED-NOT-VERIFIED with the reason in STATUS.md — never a fake green, never a 3 am ping.
- New genuinely-human decision discovered mid-run → append here + morning report; take the reversible conservative path if one exists, else park that epic only. Rule yourself only if the item applies an existing answer above, is capped in blast radius and is reversible — otherwise "your word, not ours".
- Worktrees-only for any session editing a repo another session may touch (G-10). Poll, never wait, in any session that may run headless (G-11).
- Contract cases never move to backlog (G-9); residuals get a disposition; counts are computed, never typed (G-5).
- CONTRACT v1.0 is law for the squads; only the orchestrator amends it (dated `AMD-n` in `delivery/decisions.md`, version bump v1.0 → v1.1). A draft never hands off (G-13).
