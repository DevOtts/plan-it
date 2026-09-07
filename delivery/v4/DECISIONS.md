# DECISIONS.md — plan-it v4 decision queue

Owner: Fernando Ott · Run: plan-it v4 (autonomous-draft mode) · Updated: 2026-09-07 (round 2 — PLAN-REVIEW ratified as recommended: R1–R12 confirmed, A-1/A-3/A-4 granted, A-2 held until O-2) · HTML twin: `DECISIONS.html` (rendered by hand this run; the v4 renderer replaces the hand render).
Legend: `Dn` ruling you already gave · `Rn` default the run applied from its own recommendation (contradict if wrong) · `A-n` authorization the build needs from you · `O-n` owner action only you can do · `G-n` governance rule in the CONTRACT — see `GLOSSARY.md`.

## Ruled — carried forward from the analysis report (2026-09-07)

| ID | Ruling | Effect / where it lands |
|---|---|---|
| D1 | `[DECIDED]` autonomous-draft is the default mode; guided selectable at anamnesis | statechart G0 records `run.mode`; this run itself is running in that mode |
| D2 | `[DECIDED]` brand = the target repository's brand guideline if present, else DevOtts' own default at `assets/brand/` | renderer brand detection order; `default.brand.json` ships in the plugin |
| D3 | `[DECIDED]` HTML twin beside its markdown, always created locally by default, opened in Chrome only at human gates, never a claude.ai artifact | governance G-7; renderer `--open` semantics |
| D4 | `[DECIDED]` topology is the user's choice at G1 with plan-it's recommendation shown | SCOPE-BRIEF + G1 prompt; SESSIONS.md |
| D5 | `[DECIDED]` the copy-your-rulings block ships in 4.0 | `copy-rulings` block in DECISIONS / PLAN-REVIEW kinds (case C-E3-03) |
| D6 | `[DECIDED]` all ten enhancements in 4.0.0 | this package: three squads, one release |
| D7 | `[DECIDED]` v4 is built by an orchestrator + three squads + QA | SESSIONS.md; this run is the first dogfood of E4 |
| G1 | `[DECIDED]` Size L, shape 3, package home `delivery/v4/`, design docs `docs/v4/` | `.plan-it/state.json` gates.G1 |
| — | `[DECIDED]` KICKOFF.md + its single launch prompt stay; markdown stays in the bundle for the AI; every acronym explained on first use + GLOSSARY.md | E4 scope, G-6, G-8 |

## Defaults applied by the run — RATIFIED at PLAN-REVIEW 2026-09-07 (no contradictions)

Each row was a G2 decision the run took from its own recommendation (`source: recommended`, recorded in `.plan-it/state.json` → `gates.G2.defaults`) and was ratified unchanged at PLAN-REVIEW on 2026-09-07.

| ID | Question | Default applied `[DECIDED]` (ratified by Fernando Ott, 2026-09-07) | Alternative not taken | Why this default |
|---|---|---|---|---|
| R1 | How does autonomous-draft keep Rule 1 (no frozen CONTRACT → no squads)? | CONTRACT frozen as `v1.0-draft` for the squads; PLAN-REVIEW (G4) records your G2 answers and G3 approval in one stop; `freeze` bumps to v1.0; a contradiction that changes the CONTRACT re-enters squads as an amendment | Review before squads write (the praxya order) | Your stated behaviour is "entire plan end-to-end, then contradict"; the draft is frozen for the squads so they cannot drift from each other; the amendment loop already exists |
| R2 | Where does an "Owner decision, not a build" triage verdict go? | to `CLOSED_WITHOUT_PLAN` with a decision memo and a reopen condition | back into anamnesis if you rule in the same sitting | one exit for every non-plan verdict; reopening is a new run |
| R3 | Ruling tags: typed or glyphs? | typed `[DECIDED]/[CHANGED]/[CONFIRM: owner]` canonical in markdown; glyphs only as HTML decoration | glyphs as source of truth | lintable; one vocabulary |
| R4 | A deadline column on decisions? | optional `Deadline`, default none; owner actions with a deadline surface in the close-out report | none | the field's only deadline nearly got lost |
| R5 | Orchestrator tier? | top tier, in RUN-POLICY | unspecified | never violated in either precedent |
| R6 | Where do incidental findings go? | STATUS `## Log` bullets tagged `[incidental]`, never in the case tally | a separate file | one chronicle |
| R7 | Brand contrast | default tokens deviate from the guideline's letter: Signal, Flare, Info and Warn are chip backgrounds in light mode; muted text is Steel | literal guideline colours as text | measured WCAG: Signal on white 1.65, Slate on white 3.08; readability is the guideline's intent |
| R8 | Mirror pairs | 8 → 11 (renderer, template, brand JSON) | 9 | every shipped file mirrors |
| R9 | mermaid | 10.9.1 pinned on cdnjs, strict security, source shown as text when offline | 11.x | 10.9.1 is present on cdnjs and proven by 12 diagrams in your reference |
| R10 | Package path resolution | `run.deliveryRoot` in the state file; every verb derives the package dir from it | keep `delivery/v3/` literals | literals gave false greens on this very run |
| R11 | Harness amendments | AMD-4 (gate count binds to the v2 baseline) and AMD-5 (11 pairs) recorded like AMD-1/AMD-2 | fork the gate concept into a second key | same precedent, no new concept |
| R12 | Where does `render` live? | `scripts/build-report.mjs`, separate from gate-check | a gate-check verb | different failure model; a browser spawn does not belong in the file the harness runs hundreds of times |

## Authorizations — ruled at PLAN-REVIEW 2026-09-07

| ID | Type | Question | Recommendation | Why nobody should pick for you | Unblocks |
|---|---|---|---|---|---|
| A-1 | authorization | May the squads commit to `epic/v4*` branches and the orchestrator merge to `main` overnight without a per-merge ping? | `[DECIDED]` GRANTED (release tag excluded, see A-2) | merging to `main` of a published plugin is your repository's history; it can be reverted but not un-happened | every wave |
| A-2 | authorization | May the orchestrator tag and push the `4.0.0` release and update the marketplace entry once the Definition of SHIPPED is green? | `[DECIDED]` HELD until O-2 — the orchestrator does not tag | a published version reaches every installer; reverting a marketplace version is visible to users | W4 release only |
| A-3 | authorization | May the QA session open Chrome on this Mac to look at rendered twins (`--open` at gates), and run headless fallback sessions if a terminal sticks? | `[DECIDED]` GRANTED | it drives your browser and spawns processes on your machine | W3 QA |
| A-4 | authorization | May the orchestrator commit the guard mirror fix applied during planning (one-file copy, uncommitted now) as its first W0 commit? | `[DECIDED]` GRANTED | it is the first code change of 4.0.0 landing on `main` | W0 |

## Open — owner actions (only you can do these; none blocks the build)

| ID | Type | Item | Recommendation | Deadline |
|---|---|---|---|---|
| O-1 | owner-action | Remove the stale installs: `plan-it@plan-it` enablement in `~/.claude/settings.json`, the `plan-it/` marketplace under `~/.claude-loudr/plugins/marketplaces/`, and the user-level skill copy `~/.claude-loudr/skills/plan-it/` (2.1.0), then install `plan-it@devotts` 4.0.0 | do it before the 4.0.0 tag so the dogfood runs on the release copy (case C-E11-07) | before A-2 |
| O-2 | owner-action | Read `delivery/v4/QA-REPORT.md` and give the tag/push go (A-2) | after W3 | none |
| O-3 | owner-action | Ratify R7 (brand contrast deviation) or send the exact colours you want as text | at PLAN-REVIEW | none |

## Wave gates after round 2 (PLAN-REVIEW ratified)

| Wave | Gate state |
|---|---|
| W0 — orchestrator prep | unblocked (A-1, A-4 granted) — opens when Fernando pastes the five prompts from SESSIONS.md |
| W1 — three squads in parallel | unblocked by the draft CONTRACT; runs against v1.0-draft |
| W2 — integration (mirror pairs, harness, version bump) | unblocked by W1 |
| W3 — QA full contract + dogfood | unblocked (A-3 granted) |
| W4 — release | held: A-2 after O-2; O-1 before the tag |

## Rulings as given (2026-09-07)

```
R1: ok · R2: ok · R3: ok · R4: ok · R5: ok · R6: ok · R7: ok · R8: ok · R9: ok · R10: ok · R11: ok · R12: ok
A-1: grant · A-2: hold until O-2 · A-3: grant · A-4: grant
Reviewed-by: Fernando Ott 2026-09-07
```
