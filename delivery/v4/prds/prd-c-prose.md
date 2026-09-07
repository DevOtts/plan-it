---
type: prd
title: "plan-it v4 — Squad C: prose, references, docs & packaging"
description: "PRD for the SKILL.md prose rewrite (anamnesis, triage pointer, topology, two autonomy-posture tables, output discipline for humans), the four references/*.md skeleton additions, the docs/README/CHANGELOG packaging pass, and the version-bump + test-file updates that ship plan-it 4.0.0."
status: IMPLEMENTED-NOT-VERIFIED
verified: false
repos: [plan-it]
tags: [plan-it-v4, squad-c, prose, packaging, glossary, release]
---

# PRD-C — Prose, references, docs & packaging

Squad SQ-C · lane: `SKILL.md` · `references/{templates,formats,playbooks,machine}.md` ·
`docs/**` · `README.md` · `CHANGELOG.md` ·
`plugins/plan-it/.claude-plugin/plugin.json` · `.claude-plugin/marketplace.json` ·
`tests/v3/version-triple-match.mjs` · `tests/v3/kickoff-pinning.mjs` ·
`tests/v4/prose/*` (CONTRACT §2). Law: `delivery/v4/CONTRACT.md`
**v1.0-draft — FROZEN FOR SQUADS 2026-09-07** (ruling D1; a draft can never hand
off — G-13). Glossary: `delivery/v4/GLOSSARY.md` — every acronym below is
expanded at first use per the first-use rule this PRD itself ships (G-8).
Design basis: `docs/v4/01-findings.md` §2.1/§2.3/§2.4/§2.7/§2.8/§2.10/§2.11 +
`docs/v4/02-v4-design.md` §0/§7/§8/§10/§11 + `docs/v4/research/stream-C-prose.md`
(detailed touch-map + schemas) + `docs/v4/research/stream-D-precedents.md` §4
(field-proven GATE.md/SESSIONS.md/DECISIONS.md shapes, orchestrator runbook,
triage + measurement grammar, disposition vocabulary).

## 1 · Summary

Nine of the ten v4 enhancements (E1, E3, E4, E7, E8, E10 directly; E2, E5, E6, E9
by pointer only — those are SQ-A/SQ-B's mechanisms) land in this squad's lane as
**prose, templates and packaging**, not code: the SKILL.md phase-by-phase rewrite
that adds an anamnesis questionnaire (gate **G0** — Definition of Done, DoD,
Product Requirements Document, PRD, and every other acronym below are expanded
at first use per this PRD's own rule), a **topology** axis (`solo` ·
`orchestrator+squads` · `headless`) at scope gate **G1**, a **SCOPE-BRIEF**
rendered before the G1 menu, two autonomy-posture tables (guided vs
autonomous-draft), a single **PLAN-REVIEW** round (gate **G4**) that replaces
G2+G3 chat stops in autonomous-draft mode, a residual-disposition pass, and a
new **"Output discipline for humans"** section (the first-use rule itself, plus
a legend-line convention). `references/templates.md` gains seven new document
skeletons (SCOPE-BRIEF, ANAMNESIS, DECISIONS, GATE, SESSIONS, PLAN-REVIEW,
GLOSSARY) modeled on field-proven shapes (`docs/v4/research/stream-D-precedents.md`
§4). `formats.md`, `playbooks.md` and `machine.md` get additive sections. Then
the release-packaging pass: `docs/{usage,methodology,installation}.md`,
`README.md`, `CHANGELOG.md` 4.0.0, and the version bump across the six
declared-version sites plus the two harness test files this squad owns
(`version-triple-match.mjs`, `kickoff-pinning.mjs`). Every file this squad edits
that has a root↔plugin mirror pair (`SKILL.md`, `references/*.md`) is edited in
**both** copies — `git diff` shows them byte-identical, the same discipline
`mirror-check` (SQ-B, CONTRACT §4.5) will assert at release.

## 2 · Problem & goals

### Problem (from `docs/v4/01-findings.md` §2, cited by finding ID)

1. **The scope gate explains nothing before it asks (§2.1, F-C8).** The live G1
   menu is a bare "Size L, Shape 1 (Recommended)" with one line of gloss — no
   file tree, no session count, no cost to the human, no wrong-when. No
   SCOPE-BRIEF artifact exists in any template.
2. **Decisions live inline in a roadmap section (§2.3).** Phase 7 collects
   judgment calls into `06 §4` of the roadmap doc; there is no dedicated ruled
   ledger, no "why nobody should pick for you," no carry-forward table, no
   GATE.md concept — while the field (two precedents read in full) already has
   all of it proven and battle-tested.
3. **One KICKOFF, one prompt; the orchestrator standard was hand-written each
   time (§2.4).** `KICKOFF.md` has one launch-prompt slot; "orchestrator"
   appears once, in a playbook. The field's `SESSIONS.md` (six-element launch
   prompts, sessions table, six-step runbook) and two owner rulings —
   worktrees-only (governance rule **G-10**, owner ruling P2-11) and
   poll-never-wait (**G-11**) — exist only as hand-authored one-offs.
4. **Three interleaved chat gates; no anamnesis (§2.7).** SKILL.md has one
   autonomy-posture table, one mode, three human stops. No up-front
   questionnaire exists in Phase 0; the draft-contract mechanics (a CONTRACT
   frozen as `v1.0-draft`) already work by accident in the guard and freeze
   regex, but nothing distinguishes draft from final in prose.
5. **No vocabulary for what stays open at close (§2.8).** The closed
   four-term status vocabulary (`NOT-STARTED · IN-PROGRESS ·
   IMPLEMENTED-NOT-VERIFIED (INV, built but the proving case could not run) ·
   VERIFIED`) has nothing for "this remains open and here is why that's
   acceptable"; the field improvised it per run in a free-text Evidence column.
6. **Five terms never expanded; no rule tells the model to expand anything
   (§2.10, F-C6).** `PRD`, Chrome DevTools Protocol (`CDP`),
   Acceptance-Test-Driven/Behaviour-Driven Development (`ATDD`/`BDD`), Claude
   Code's highest `/effort` reasoning setting (`xhigh`), and ruling `D4` are
   never expanded anywhere in the package; `DoD` is used unexplained across
   three sections before its one spell-out. Two ID grammars sit one dash apart
   (`G1` human gates vs `G-1` governance rules; `W0–W4` build waves vs `W1–W6`
   plan-it's own write-time-invariant IDs) with no legend to defuse the
   collision.
7. **Packaging and install debt (§2.11).** The SKILL frontmatter `description`
   is 1,738 characters against a platform hard cap of 1,024 (only the first 250
   show in `/skills` listings) — it must be **cut**, not just appended to.
   SKILL.md says "15 states" against 17 in `machine.json`; `references/machine.md`'s
   diagram omits `preflight` and `adversaryGate`; `docs/methodology.md` says
   "four non-negotiable rules" against SKILL.md's five (since v2); `tests/v3/version-triple-match.mjs`
   hardcodes `EXPECTED = "3.0.1"`. Three plan-it copies at three versions coexist
   on this machine, one of them (the old `plan-it@plan-it` marketplace
   namespace) visibly serving stale `/fable-it` prose into a live session —
   this is Fernando's cleanup step (owner action **O-1**), not code, but README
   and installation docs must say so explicitly.

### Goals (mapped to CONTRACT governance rules — see `GLOSSARY.md` for `G-n`)

- **G-7 (twins local, never published, `--open` only at human gates).** SKILL.md
  states this in prose so the model never routes a twin through a
  claude.ai-artifact-publishing tool; case C-E1-03 is the prose half of C-E2-10's
  code enforcement.
- **G-8 (first-use rule).** Every human-facing surface (a gate prompt,
  DECISIONS.md/GATE.md rows, the Phase 10 final report) expands an acronym or
  per-run ID on first use; the package carries `GLOSSARY.md`; an ID absent from
  it fails handoff (SQ-B's `glossary` verb, C-E10-01/02, consumed here as
  C-E10-04's seed content and C-E10-03's renderer input).
- **G-10 (worktrees-only).** Every `SESSIONS.md` squad launch prompt states the
  worktrees-only rule (owner ruling P2-11) verbatim — no session edits a repo
  another session may touch without one.
- **G-11 (poll, never wait).** No launch prompt that may run headless contains
  "wait for" a notification; every such step says "poll" instead.
- **G-15 (description budget).** The SKILL frontmatter `description` is ≤1,024
  characters with the trigger phrases `/plan-it` and `plan` inside the first
  250 characters.

## 3 · Users & jobs

- **Fernando reading a gate prompt cold.** He has not read `references/templates.md`
  himself; the SCOPE-BRIEF must tell him, in the moment, what "Shape 3" produces,
  costs, and is wrong for — not assume he already knows the shape catalogue.
- **A conductor agent invoking `/plan-it`.** It needs the anamnesis
  questionnaire answered once, up front, and the autonomous-draft posture table
  to know exactly which two gates (G0, G4) it must stop for and which four
  (dodLock → scopeBrief → … → adversaryGate) it runs through unattended.
- **The person opening N terminals from `SESSIONS.md`.** Each session reads
  only its own row, pastes one self-contained launch prompt, and never has to
  reverse-engineer what "register with the orchestrator" means — the six-element
  prompt and the runbook say it once, generated, not hand-typed per run.

## 4 · Solution design

Numbered decisions `D-C1`…`D-C18`, citing `file:line` from
`docs/v4/research/stream-C-prose.md` §4a's touch-map. All SKILL.md and
`references/*.md` edits land in **both** the root copy and the
`plugins/plan-it/skills/plan-it/` mirror (currently byte-identical, verified by
`diff`) — mirror parity is dogfooded on every task in the epics file, not just
asserted at the end.

### `SKILL.md` (Epic V4C1)

- **D-C1 — Frontmatter `description` cut + additions** (`SKILL.md:3-36`).
  Trim ~250–400 characters (the softest cuts: the "Auto-sizes from…" sentence
  and the repeated "conductor agents" clause — restate once, not twice) to make
  room for one clause each on anamnesis, topology and the HTML report twin,
  landing at ≤1,024 characters total with `/plan-it` and `plan` inside the
  first 250 (G-15, case C-E1-02). Rejected: appending without cutting — the
  description is already ~700 characters over any plausible platform limit
  before v4 adds a word (F-C2).
- **D-C2 — New "Output discipline for humans" section** (after `SKILL.md:199`,
  end of the old single autonomy-posture table). States the first-use rule
  (G-8) and the legend-line convention: any artifact where three or more
  per-run ID prefixes appear together carries one line, `Legend: G-n governance
  rule · T-<EID>-NN test case · Wn wave · Rn default · Dn ruling — see
  GLOSSARY.md` (CONTRACT §5). This is what defuses the `G1`-vs-`G-1` and
  `W0–W4`-vs-`W1–W6` collisions (F-C7) — a legend line, never a renamed ID
  grammar (renaming an ID grammar is a non-additive format change, explicitly
  out of scope per `docs/v4/02-v4-design.md` §10).
- **D-C3 — Anamnesis in Phase 0** (`SKILL.md:203-228`). One batched
  questionnaire (access & credentials the run may probe, fences, naming
  conventions, topology preference, live-probe authorization, decisions already
  known) run immediately after capturing the raw vision, before Phase 1. Machine
  state: `anamnesis` (gate **G0**, per CONTRACT §3.1 — the exact state name
  SQ-B's `machine.json` uses; this PRD does not invent a different one). Answers
  seed the DoD's Assumptions list and DECISIONS.md's Ruled table directly — this
  is intake enrichment, not a new decision round.
- **D-C4 — DoD-before-spelled-out fix** (`SKILL.md:164, 231`). "DoD" is used at
  line 164 seventeen-plus lines before its one spell-out at line 181 (F-C6);
  add "(Definition of Done)" at the first literal use, not just at Phase 1's
  header.
- **D-C5 — Topology axis + SCOPE-BRIEF before the G1 menu** (`SKILL.md:249-277`).
  Add **topology** (`solo` · `orchestrator+squads` · `headless`, CONTRACT §1) as
  a third axis beside size and shape — one table modeled on the existing size
  table (`:254-260`), each row with a one-line "when" + a recommendation slot
  (ruling D4: the user's choice, plan-it's recommendation shown). Before the G1
  menu renders, generate and show the **SCOPE-BRIEF** (skeleton in
  `references/templates.md`, Epic V4C2) — what each size/shape/topology
  produces, costs, and is wrong for. Closes F-C8's gap directly: the menu no
  longer names "Shape 3" and assumes the human already knows what that means.
- **D-C6 — Two autonomy-posture tables** (`SKILL.md:188-199`). Keep the
  existing table as **"Autonomy posture — guided mode"**
  (`scopeGate`→G1, `decisionGate`→G2, `freezeGate`→G3 — the exact CONTRACT §3.1
  state names). Add **"Autonomy posture — autonomous-draft mode"** directly
  below: `anamnesis`→G0, `scopeGate`→G1, `planReview`→G4 (one PLAN-REVIEW round
  after `adversaryGate`/`render` covering "are the decisions right, is the
  frozen backbone right" in one stop). Both tables must use CONTRACT §3.1's
  state names verbatim so they agree with SQ-B's machine — a cross-lane
  invariant, not a stylistic choice (flagged for verification in §7 Risks).
- **D-C7 — Phase 7/8 autonomous-draft collapse** (`SKILL.md:409-444`). Guided
  mode: unchanged, but decisions now write to the new DECISIONS.md (Epic V4C2)
  instead of only inline in `06 §4`. Autonomous-draft mode: Phase 7 (decisions)
  and Phase 8 (freeze) collapse into the single PLAN-REVIEW round; recommended
  answers are applied and marked `[default — contradict if wrong]` inline, no
  chat stop (CONTRACT §3.1: `specAuthoring`→`defaultsApplied`→`coherencePass`→
  `backboneFreeze`, `freeze --draft` per ruling R1).
- **D-C8 — Phase 9 sessions note** (`SKILL.md:448-481`). When topology =
  `orchestrator+squads`, add one sentence: "record each squad's session name in
  `SESSIONS.md` as it's dispatched."
- **D-C9 — Phase 10 residual-disposition pass + assembly + `--open` rule**
  (`SKILL.md:485-533`). (a) Before "Fill the board": every epic's non-100%-passing
  case gets tagged `backlog-with-reason` / `owner-gated` / `IMPLEMENTED-NOT-VERIFIED`
  (INV); one sentence enforcing that contract cases never move to backlog
  (G-9). (b) The "Assemble" bullet gains `SESSIONS.md` + `GATE.md` +
  `GLOSSARY.md` to the file list when topology warrants them. (c) One sentence:
  the HTML twin exists beside each md file, opened only at human gates,
  never published as a claude.ai artifact (G-7 prose; pointer to SQ-A's
  renderer, no redesign here — case C-E1-03).
- **D-C10 — "15 states" fix** (`SKILL.md:110`). Correct "15 states" to the
  current count (17 baseline + 8 new = 25 in v4; case C-E10-04's SKILL.md half).

### `references/templates.md` (Epic V4C2)

- **D-C11 — Seven new skeletons.** `SCOPE-BRIEF.md` (size/shape/topology cards,
  cost-to-human, wrong-when — `stream-C-prose.md` §4b), `ANAMNESIS.md` (the
  six-item questionnaire, §4e), `DECISIONS.md` (Ruled · Open · Carried-forward
  · Copy-your-rulings, modeled on both field precedents read in full, §4c),
  `GATE.md` (Answered · Still-human-not-blocking · Standing rules, 1:1 on the
  praxya field precedent, §4d), `SESSIONS.md` (sessions table + one launch
  prompt per session + orchestrator runbook, §4d), `PLAN-REVIEW.md` (defaults
  table `R1…Rn`, package tree, states-if-you-answer-nothing, copy-rulings),
  `GLOSSARY.md` (static vocabulary + this-run's-IDs, §4f). `STATUS.md` gains a
  `Disposition` column + `## Residuals` + `## Log` (`[incidental]`-tagged
  bullets, R6). `KICKOFF.md` gains exactly one reading-order line pointing at
  `SESSIONS.md` — its 9-block structure and single launch prompt otherwise stay
  (ruling: "KICKOFF.md + its single launch prompt STAY").
- **D-C12 — GLOSSARY seed** covers PRD, CDP, ATDD/BDD, DoD, xhigh, D4, G0–G4,
  `[REAL]` (a test case needing a live target, never VERIFIED on a mock), INV,
  S/M/L, Shape 1–5, topology values (case C-E10-04, the templates.md half).

### `references/formats.md` (Epic V4C2)

- **D-C13 — §9 ENV-PROBES format.** Closes finding LG-6 (`gate-check preflight`
  cites a `formats.md §9` that does not exist today). DoD ladder gains a fourth
  rung: residual disposition (`backlog-with-reason` / `owner-gated` / INV),
  additive to the existing three-rung ladder. Measurement block grammar:
  `Measured: <value> · where: <source> · when: <date> · read-only:
  yes-verified|assumed|idempotent-writes-accepted · moved: <verdict
  before> -> <verdict after>` (CONTRACT §5). Triage verdict set: `plan` ·
  `build-instead` · `owner-decision` · `skip` (pointer only — the machine state
  is SQ-B's; this is the prose grammar the SKILL.md triage phase quotes).

### `references/playbooks.md` (Epic V4C2)

- **D-C14 — §E gains SESSIONS.md/PLAN-REVIEW.md as new "optional enrichments"
  entries** (same family as the existing README consolidation hub /
  `KICKOFFS.md` archive). §F (pre-handoff consistency gate) gains a 12th
  item: first-use acronym lint (G-8). §G (new): the orchestrator runbook —
  dispatch → verify on disk → merge per lane → usage-limit resilience → domain
  boundary → worktrees-only (G-10) → reap → incidental channel, plus the
  escalation rule from the field precedent (rule yourself only if: applies an
  existing answer, capped blast radius, reversible; else escalate — "your word,
  not ours").

### `references/machine.md` (Epic V4C2)

- **D-C15 — Diagram + schema fix.** The printed diagram (`:26-28`) currently
  omits `preflight` and `adversaryGate` even though both exist in
  `machine.json` (F-C1) — fix independent of v4, then extend to the full v4
  state count (pointer to SQ-B's exact state list; this file's job is the
  prose diagram, not the machine). State-file schema additions, named runs
  (`.plan-it/<slug>.state.json`) and draft semantics (`contract.draft:true`)
  documented as prose explaining SQ-B's mechanism (case C-E10-04 does not cover
  this file; no test case owns it directly — flagged in §7).

### Docs, README, CHANGELOG, versions (Epics V4C3, V4C4)

- **D-C16 — `docs/usage.md`** gains an autonomous-draft mode section (one
  PLAN-REVIEW row, not three) beside the existing guided-mode section.
  **`docs/methodology.md`** is one rule short of SKILL.md today (F-C5, "four
  non-negotiable rules" vs five since v2) — fixed independent of v4, then kept
  in sync with whatever v4 adds. **`docs/installation.md`** gains the
  stale-install cleanup note (owner action O-1, LG-2/F-C3: three plan-it copies
  coexist, one visibly serving stale `/fable-it` prose) — Fernando's action,
  documented so it is not silently inherited as someone else's problem.
  **`README.md`** names anamnesis, topology and autonomous-draft explicitly.
- **D-C17 — `CHANGELOG.md` 4.0.0 entry** with the same required-section set
  3.0.0 used (Founder mandates / Write-time invariants / Enforcement reach /
  Additive tooling / Deferred / Verification) and a Verification line naming
  `mirror-check 11/11` (once SQ-B's 11-pair count lands) and the computed
  run-contract totals.
- **D-C18 — Version 4.0.0 across the six declared-version sites** (CONTRACT §7):
  `plugin.json`, `marketplace.json` `plugins[plan-it].version`, `SKILL.md`
  frontmatter (root + mirror — this squad's files). **`machine.json`**
  (root + mirror) is SQ-B's file; this squad's `version-triple-match.mjs`
  edit sets `EXPECTED = "4.0.0"` but the full six-site pass is a cross-squad
  integration gate (flagged in §7 and in Corrections below).
  `tests/v3/kickoff-pinning.mjs`'s regex is widened to also accept
  `.plan-it/<slug>.state.json` (named runs, SQ-B's E9 mechanism — this squad
  only widens the prose-lint regex, not the resolver).

### GATE.md wording for O-1 (not a build task)

Case C-E11-07 requires the owner action (removing the stale
`plan-it@plan-it` install) to be **recorded in GATE.md**, not built. `GATE.md`
is not in this squad's `CONTRACT §2` owns list (it belongs to the orchestrator/
this run's own package). This PRD supplies the wording for the orchestrator to
apply, rather than editing a file outside this squad's lane. `GATE.md` already
carries O-1 under "Still human, but NOT blocking the run" (`delivery/v4/GATE.md`
row O-1); the recommended addition — a checkbox-style confirmation line the
orchestrator appends once Fernando performs the action, so the 4.0.0 tag has
something to point at — reads:

```
- [ ] O-1 confirmed done — <date> — `plan-it@plan-it` enablement removed from
  `~/.claude/settings.json`, the stale marketplace dir removed from
  `~/.claude-loudr/plugins/marketplaces/`, the user-level 2.1.0 skill copy at
  `~/.claude-loudr/skills/plan-it/` removed, `plan-it@devotts` 4.0.0 installed.
  (case C-E11-07 — manual, confirmed before the 4.0.0 tag, gates A-2)
```

This is prose for the orchestrator to place under GATE.md's O-1 row (or as a
new line directly beneath it) — no epic in this PRD edits `GATE.md` itself.

## 5 · Epics table

| EID | Epic | Themes/areas | Dep | Wave |
|---|---|---|---|---|
| V4C1 | SKILL.md — anamnesis, triage pointer, topology, two posture tables, output discipline, phases 7–10 | E1, E3 (pointer), E4, E6 (pointer), E7, E8, E9 (pointer), E10 | — | 1 |
| V4C2 | references/{templates,formats,playbooks,machine}.md — seven skeletons, ENV-PROBES, orchestrator runbook, diagram fix | E1, E3, E4, E7, E8, E9 (pointer), E10 | V4C1 (shares "15 states"/GLOSSARY-seed fix) | 1 |
| V4C3 | docs/{usage,methodology,installation}.md, README.md, CHANGELOG.md 4.0.0 | packaging | V4C1, V4C2 | 1–2 |
| V4C4 | Versions 4.0.0 across six sites; `version-triple-match.mjs`, `kickoff-pinning.mjs` | release | V4C1, V4C2, V4C3; soft-dep SQ-B (machine.json version, named-run regex target) | 2 |

## 6 · Acceptance (binding — see `epics-c-prose.md`'s Test Contracts)

Acceptance = 100% of the binding cases in `delivery/v4/epics/epics-c-prose.md`
passing against their fixtures/live-tree assertions, per CONTRACT §7's
Definition of SHIPPED. No case here is invented outside this squad's assigned
CONTRACT rows — the coverage table at the end of the epics file proves it.

## 7 · Risks & open questions

- **The description cut (D-C1) is sized against an unconfirmed exact limit.**
  `docs/v4/01-findings.md` §2.11 measures 1,738 characters
  [MEASURED] against a reported combined cap of 1,536 [INFERRED, single
  subagent lookup]. The platform hard cap this CONTRACT states (§0: 1,024
  characters) is authoritative for this run; case C-E1-02 tests against
  **1,024**, not 1,536 — this PRD follows CONTRACT §0/G-15 exactly, flagging
  only that the softer 1,536 figure some research cites is not the binding
  number.
- **The `G1`/`G-1` collision is defused by the legend line, never by renaming
  either grammar** (D-C2). No epic in this PRD proposes renaming `G1`-the-gate
  or `G-1`-the-governance-rule — that would be a non-additive format change,
  explicitly out of scope (`docs/v4/02-v4-design.md` §10).
- **Stale installs (`plan-it@plan-it`, the old marketplace namespace) are an
  owner action (O-1), not a build blocker.** README and installation.md name
  it explicitly (D-C16) so v4's release notes don't silently inherit it as
  someone else's defect; no epic here attempts to fix Fernando's
  `~/.claude/settings.json` or plugin directories.
- **Both autonomy-posture tables (D-C6) must use CONTRACT §3.1's state names
  verbatim** (`anamnesis`, `scopeGate`, `decisionGate`, `freezeGate`,
  `backboneFreeze`, `planReview`, `freeze` — not "G0 state" or any renamed
  form) so SQ-C's prose and SQ-B's `machine.json` never disagree about what a
  gate is called. This PRD asserts it as a design decision; the actual
  cross-check (that SQ-B's machine uses these exact names) is SQ-B's
  responsibility to confirm, flagged as a coordination item in Corrections.
- **`references/machine.md`'s v4 diagram fix (D-C15) has no dedicated binding
  case** in this squad's Test Contract — case C-E10-04 covers "15 states" in
  SKILL.md and the GLOSSARY seed in templates.md, not machine.md's diagram
  specifically. Flagged in the epics file's coverage table as a task without a
  1:1 binding case (covered qualitatively by the "no stale prose" review at
  Epic V4C2's DoD, not a mechanized assertion) — this is an honest gap, not a
  silent one.

## 8 · Repo & branch plan

Branch pattern: `epic/v4c-<slug>` (e.g. `epic/v4c-skill-prose`,
`epic/v4c-references`, `epic/v4c-docs-release`, `epic/v4c-versions`), off
whatever base branch the orchestrator's W0 sets up (CONTRACT §2). **Worktrees-only**
(G-10, owner ruling P2-11): this squad's session works in its own git worktree
for every epic branch — never edits the shared working tree another session
(SQ-A, SQ-B, the orchestrator) may touch concurrently. Merge-back per wave, one
batched merge per squad per wave, orchestrator-only (`00-program-plan.md` §3).
No epic in this PRD merges to `main` or tags a release — that is the
orchestrator's W4, gated on O-2/A-2 (`GATE.md`).

## 9 · Out-of-scope

- Any edit to `machine.json`, `scripts/gate-check.mjs`,
  `scripts/hooks/planit-guard.mjs`, or their tests (`tests/v4/core/*`,
  `tests/v4/renderer/*`) — SQ-A/SQ-B territory (CONTRACT §2).
- `tests/v4/prose/zero-deps.mjs` — CONTRACT case C-E2-11 is SQ-B's per the
  orchestrator's explicit exclusion, even though it sits in this squad's
  `tests/v4/prose/` directory; this PRD does not author it.
- `tests/v3/mirror-wired-into-release.mjs` (case C-E9-09) — SQ-B's, per the
  orchestrator's explicit exclusion.
- Editing `delivery/v4/GATE.md` directly — not in this squad's CONTRACT §2
  owns list; §4's "GATE.md wording for O-1" section supplies text for the
  orchestrator to apply instead.
- Building a stale-install auto-detection/self-check mechanism — raised as an
  open question in `stream-C-prose.md` §6, not resolved here; out of scope per
  `docs/v4/01-findings.md` §5 ("Cleaning the stale installs — owner action").

## 10 · Corrections flagged for the orchestrator

1. **CONTRACT §2's SQ-C owns-list omits `tests/v3/changelog-shape.mjs`.** The
   orchestrator's own kickoff message named it as a file this squad will
   change ("if needed"), and Epic V4C4 does edit it (the required-ID set moves
   from `M1`/`M2` to whatever v4 ships) — but CONTRACT §2's table lists only
   `tests/v3/version-triple-match.mjs` and `tests/v3/kickoff-pinning.mjs` under
   SQ-C. Recommend a CONTRACT amendment adding `tests/v3/changelog-shape.mjs`
   to SQ-C's owns column so the ownership table and the actual task list
   agree.
2. **Case C-E11-06 (dogfood run) is tagged `@case-packaging`** in the CONTRACT's
   `## Cases` table (so it falls inside "every `@case-prose` and
   `@case-packaging` row" per this squad's brief), but its `run:` command
   (`node tests/v4/core/dogfood-run.mjs`) lives in `tests/v4/core/`, a
   directory CONTRACT §2 assigns exclusively to SQ-B. This squad's epics
   **contribute** the packaging surface the dogfood run exercises (SKILL.md
   prose, docs, version numbers) but does not — and cannot, without
   co-editing SQ-B's owned directory — author the runner itself. The coverage
   table in `epics-c-prose.md` maps C-E11-06 as "contributed to, not
   implemented by" this squad; recommend the orchestrator confirm SQ-B treats
   this case as its own to author, with this squad's artifacts as its
   dependency.
3. **`version-triple-match.mjs`'s six-site pass needs SQ-B's `machine.json`
   bump (root + mirror) to actually go green.** This squad edits four of the
   six sites (`plugin.json`, `marketplace.json`, `SKILL.md` root + mirror) and
   sets `EXPECTED = "4.0.0"` in the test itself; the remaining two sites
   (`machine.json` root + mirror) are SQ-B's file to bump. Per
   `00-program-plan.md` §2, this is already anticipated as a W2 integration
   step ("orchestrator + SQ-B (pairs) + SQ-C (versions)") — flagging only so
   the orchestrator sequences W2 to land SQ-B's bump before this squad's local
   Test Contract case T-V4C4 is expected to pass at the integration level,
   not just the squad-local partial check.
4. **Both autonomy-posture tables' state names (D-C6) should be confirmed
   against SQ-B's live `machine.json`** once it lands (`anamnesis`,
   `scopeGate`, `decisionGate`, `freezeGate`, `backboneFreeze`, `planReview`,
   `freeze`) — this PRD writes them from CONTRACT §3.1 as frozen, but a W2
   cross-check (SQ-C's SKILL.md prose vs SQ-B's actual state names) is cheap
   insurance against silent drift between the two lanes.
5. **No epic in this PRD covers `references/machine.md`'s v4 diagram with a
   dedicated binding test case** (see §7 Risks) — recommend the orchestrator
   accept this as a qualitative-review item at Epic V4C2's local gate rather
   than expect a 13th mechanized case where none was assigned in the CONTRACT.

---
_Authored by [DevOtts](https://github.com/DevOtts)._
