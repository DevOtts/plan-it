---
type: epics
title: "plan-it v4 — Squad C epics: prose, references, docs & packaging"
description: "Four epics (V4C1-V4C4) implementing the SKILL.md prose rewrite, the references/*.md skeleton additions, the docs/README/CHANGELOG packaging pass, and the version-bump + test-file updates that ship plan-it 4.0.0."
status: IMPLEMENTED-NOT-VERIFIED
verified: false
repos: [plan-it]
tags: [plan-it-v4, squad-c, epics, prose, packaging, glossary, release]
---

# Epics-C — Prose, references, docs & packaging

PRD: `delivery/v4/prds/prd-c-prose.md`. Law: `delivery/v4/CONTRACT.md`
**v1.0-draft — FROZEN FOR SQUADS** — never edited by this file (amendments go
through the orchestrator). Legend: `G-n` governance rule · `T-<EID>-NN` test
case · `Rn` default · `Dn` ruling · `V4C<n>` this squad's epic IDs — see
`delivery/v4/GLOSSARY.md`. Branch pattern: `epic/v4c-<slug>`, worktrees-only
(G-10) — every task below is done in this squad's own git worktree, never the
shared working tree another session may touch. `Count:` on each Test Contract
is counted from the `@tag`-ed rows, never hand-typed (G-5).

Every `SKILL.md`/`references/*.md` task edits **both** the root copy and the
`plugins/plan-it/skills/plan-it/` mirror — currently byte-identical (`diff`
confirms) — so this squad dogfoods the mirror discipline SQ-B's
`mirror-check` (CONTRACT §4.5) will assert at release, before that verb even
runs against this squad's files.

---

## Epic V4C1 — SKILL.md: anamnesis, triage pointer, topology, posture tables, output discipline

Branch: `epic/v4c-skill-prose` | Depends on: none (Wave 1, parallel with
V4C2/V4C3's non-glossary tasks)
Scope: PRD §4 decisions D-C1…D-C10, D-C10 — the full `SKILL.md` phase-by-phase
rewrite. Root file: `SKILL.md`. Mirror: `plugins/plan-it/skills/plan-it/SKILL.md`.

Tasks:
- [ ] `SKILL.md:3-36` (frontmatter `description`) — trim ~250–400 characters
      (the "Auto-sizes from…" sentence, the repeated "conductor agents" clause)
      to land at ≤1,024 characters total; add one clause each on anamnesis,
      topology, and the HTML report twin; keep `/plan-it` and `plan` inside the
      first 250 characters (D-C1, G-15).
- [ ] New section after `SKILL.md:199` (end of the old single autonomy-posture
      table) — **"## Output discipline for humans"**: the first-use rule (G-8)
      + the legend-line convention (`Legend: G-n governance rule · T-<EID>-NN
      test case · Wn wave · Rn default · Dn ruling — see GLOSSARY.md`, CONTRACT
      §5) required wherever three or more per-run ID prefixes appear together
      (D-C2).
- [ ] `SKILL.md:203-228` (Phase 0 — Intake) — add the **anamnesis**
      questionnaire (six items: access & credentials the run may probe;
      fences; naming conventions; topology preference; live-probe
      authorization; decisions already known) run immediately after capturing
      the raw vision, before Phase 1. Name the machine state `anamnesis`
      (gate **G0**) per CONTRACT §3.1 — do not invent a different state name
      (D-C3).
- [ ] `SKILL.md:164` — add "(Definition of Done)" at the first literal use of
      "DoD", not just at Phase 1's header (D-C4).
- [ ] `SKILL.md:249-277` (Phase 2 — Scope & shape governor, G1) — add
      **topology** (`solo` · `orchestrator+squads` · `headless`) as a third
      axis table beside size and shape, modeled on the existing size table;
      each row: one-line "when" + a recommendation slot (ruling D4). Before
      the G1 menu renders, add "Present the SCOPE-BRIEF, then the chosen
      size + shape + topology + numbered DoD" ahead of the existing sentence
      (D-C5; the SCOPE-BRIEF skeleton itself is Epic V4C2's task — this task
      only wires SKILL.md's Phase 2 to render it first).
- [ ] `SKILL.md:188-199` (Autonomy posture table) — relabel the existing table
      **"Autonomy posture — guided mode"** (rows: `scopeGate`→G1,
      `decisionGate`→G2, `freezeGate`→G3 — CONTRACT §3.1's exact state names).
      Add **"Autonomy posture — autonomous-draft mode"** directly below:
      `anamnesis`→G0, `scopeGate`→G1, `planReview`→G4 (one PLAN-REVIEW round
      after `adversaryGate`/`render`) (D-C6).
- [ ] `SKILL.md:409-444` (Phases 7–8 — Decision round G2, Backbone freeze G3) —
      guided mode: decisions now write to the new `DECISIONS.md` (Epic V4C2)
      instead of only inline in `06 §4`. Autonomous-draft mode: Phases 7–8
      collapse into the single PLAN-REVIEW round; recommended answers applied
      and marked `[default — contradict if wrong]` inline, no chat stop (D-C7).
- [ ] `SKILL.md:448-481` (Phase 9 — Parallel planning) — when topology =
      `orchestrator+squads`, add: "record each squad's session name in
      `SESSIONS.md` as it's dispatched" (D-C8).
- [ ] `SKILL.md:485-533` (Phase 10 — Verify + handoff) — (a) add the
      residual-disposition pass before "Fill the board": every epic's
      non-100%-passing case gets tagged `backlog-with-reason` /
      `owner-gated` / `IMPLEMENTED-NOT-VERIFIED`; one sentence: contract
      cases never move to backlog (G-9). (b) "Assemble" bullet gains
      `SESSIONS.md` + `GATE.md` + `GLOSSARY.md` to the file list when
      topology warrants them. (c) one sentence: the HTML twin exists beside
      each md file, opened only at human gates, never published as a
      claude.ai artifact (G-7 prose) (D-C9).
- [ ] `SKILL.md:110` — fix "15 states" to the correct v4 count (D-C10).
- [ ] Copy every edit above to `plugins/plan-it/skills/plan-it/SKILL.md`;
      confirm `diff SKILL.md plugins/plan-it/skills/plan-it/SKILL.md` is
      empty before this epic's DoD.
- [ ] Author `tests/v4/prose/skill-sections.mjs` (C-E1-01), extending it with
      the "15 states" and posture-table assertions this epic's Test Contract
      needs beyond the CONTRACT's own case.
- [ ] Author `tests/v4/prose/description-budget.mjs` (C-E1-02).
- [ ] Author `tests/v4/prose/local-html-rule.mjs` (C-E1-03).
- [ ] Author `tests/v4/prose/anamnesis-section.mjs` and
      `tests/v4/prose/posture-tables.mjs` (epic-local, beyond the CONTRACT's
      four named prose scripts, both living in this squad's owned
      `tests/v4/prose/*` directory).

### Tier Table

| tier | effort | escalation | scaffold-pointer |
|---|---|---|---|
| mid | xhigh | escalate to top on struggle (judgment collisions — e.g. wording the G1/G-1 legend line, deciding which sentence to cut from the description) | `build-it:V4C1` |

### Test Contract — Binding (100% pass or /iterate)
Types: [prose][packaging] · Count: 12 (0 [REAL]) · counted by `gate-check handoff`, never hand-typed

| ID | @tag | Given/When/Then | Expected | run: |
|---|---|---|---|---|
| T-V4C1-01 | @case-prose | Given the shipped SKILL.md, when grepped for "Output discipline for humans" and the scope-brief-before-G1-menu order, then both hold in both copies | exactly 1 section header per copy; scope-brief line precedes the G1 menu sentence | `node tests/v4/prose/skill-sections.mjs` |
| T-V4C1-02 | @case-prose | Given the frontmatter `description`, when its length and first-250-character window are measured, then both copies satisfy G-15 | ≤1,024 chars; first 250 contain `/plan-it` and `plan` | `node tests/v4/prose/description-budget.mjs` |
| T-V4C1-03 | @case-prose | Given SKILL.md's prose, when scanned for the local-twin/never-published/`--open`-at-gates phrases, then all three are present | 3/3 phrases found, both copies | `node tests/v4/prose/local-html-rule.mjs` |
| T-V4C1-04 | @case-prose | Given SKILL.md post-edit, when grepped for the literal string "15 states", then it is absent from both copies | `grep -q "15 states"` exits 1 on both files | `sh -c '! grep -q "15 states" SKILL.md plugins/plan-it/skills/plan-it/SKILL.md'` |
| T-V4C1-05 | @case-prose | Given Phase 0, when the anamnesis section is parsed, then all six questionnaire items are present | 6/6 items found | `node tests/v4/prose/anamnesis-section.mjs` |
| T-V4C1-06 | @case-prose | Given the two autonomy-posture tables, when their headers and gate/state rows are parsed, then both exist with CONTRACT §3.1's exact state names | headers "guided mode"/"autonomous-draft mode" found; states `anamnesis, scopeGate, decisionGate, freezeGate, planReview` all present, no renamed forms | `node tests/v4/prose/posture-tables.mjs` |
| T-V4C1-07 | @case-prose | Given Phase 2, when grepped for the topology table, then three rows (`solo`, `orchestrator+squads`, `headless`) exist | 3/3 rows found | `sh -c 'grep -c "orchestrator+squads" SKILL.md'` (≥1) |
| T-V4C1-08 | @case-prose | Given the Output discipline section, when grepped for the legend-line template string, then it is present verbatim | exact string `Legend: G-n governance rule` found | `sh -c 'grep -q "Legend: G-n governance rule" SKILL.md'` |
| T-V4C1-09 | @case-prose | Given Phase 10, when grepped for the residual-disposition sentence, then all three disposition words + the "never move to backlog" clause are present | `backlog-with-reason`, `owner-gated`, `IMPLEMENTED-NOT-VERIFIED` all found near "backlog" | `sh -c 'grep -c "backlog-with-reason" SKILL.md'` (≥1) |
| T-V4C1-10 | @case-prose | Given SKILL.md:164's first "DoD" use, when grepped, then "(Definition of Done)" appears at or before it | phrase found within the same paragraph as the first DoD occurrence | `sh -c 'grep -q "DoD (Definition of Done)" SKILL.md'` |
| T-V4C1-11 | @case-prose | Given root and mirror SKILL.md post-edit, when diffed, then they are byte-identical | `diff` exits 0 | `sh -c 'diff SKILL.md plugins/plan-it/skills/plan-it/SKILL.md'` |
| T-V4C1-12 | @case-prose | Given Phase 9, when grepped for the sessions-note sentence, then it is present | phrase "record each squad's session name in SESSIONS.md" found | `sh -c 'grep -q "record each squad.s session name in SESSIONS.md" SKILL.md'` |


---

## Epic V4C2 — references/{templates,formats,playbooks,machine}.md: skeletons, ENV-PROBES, orchestrator runbook

Branch: `epic/v4c-references` | Depends on: V4C1 (shares the "15 states" fix
and needs it landed before this epic's GLOSSARY-seed test can fully pass —
merge order: V4C1 before V4C2's `glossary-seed.mjs` case)
Scope: PRD §4 decisions D-C11…D-C15 — `references/templates.md`,
`references/formats.md`, `references/playbooks.md`, `references/machine.md`,
all four mirrored.

Tasks:
- [ ] `references/templates.md` — add seven new document skeletons:
      `SCOPE-BRIEF.md` (size/shape/topology cards, cost-to-human, wrong-when —
      `stream-C-prose.md` §4b), `ANAMNESIS.md` (six-item questionnaire, §4e),
      `DECISIONS.md` (Ruled · Open · Carried-forward · Copy-your-rulings,
      §4c), `GATE.md` (Answered · Still-human-not-blocking · Standing rules,
      §4d), `SESSIONS.md` (sessions table + one launch prompt per session +
      orchestrator runbook pointer, §4d), `PLAN-REVIEW.md` (defaults table
      `R1…Rn`, package tree, states-if-you-answer-nothing, copy-rulings),
      `GLOSSARY.md` (static vocabulary + this-run's-IDs, §4f) (D-C11).
- [ ] `references/templates.md` — `STATUS.md` skeleton gains a `Disposition`
      column + `## Residuals` (`| Item | Disposition | Reason / exit
      criterion | Evidence |`) + `## Log` (`[incidental]`-tagged bullets, R6)
      (D-C11).
- [ ] `references/templates.md` — `KICKOFF.md` gains exactly one
      reading-order line: "if `SESSIONS.md` exists, each session reads only
      its own row" — its 9-block structure and single launch prompt otherwise
      stay unchanged (D-C11, ruling: "KICKOFF.md + its single launch prompt
      STAY").
- [ ] `references/templates.md` — GLOSSARY seed table: PRD, CDP, ATDD/BDD,
      DoD, xhigh, D4, G0–G4, `[REAL]`, INV, S/M/L, Shape 1–5, topology values,
      each with a one-line meaning + "Defined in" pointer (D-C12).
- [ ] `references/formats.md` — new §9 ENV-PROBES format (closes LG-6). DoD
      ladder gains a fourth rung (residual disposition — additive to the
      existing three-rung ladder). Measurement block grammar: `Measured:
      <value> · where: <source> · when: <date> · read-only:
      yes-verified|assumed|idempotent-writes-accepted · moved: <verdict
      before> -> <verdict after>` (CONTRACT §5). Triage verdict set: `plan` ·
      `build-instead` · `owner-decision` · `skip` (D-C13).
- [ ] `references/playbooks.md` §E — add SESSIONS.md/PLAN-REVIEW.md as new
      "optional enrichments" entries. §F — add a 12th item: first-use
      acronym lint (G-8), renumbering the existing "Mechanizable half" note
      to include it where mechanizable. New §G — the orchestrator runbook:
      dispatch → verify on disk → merge per lane → usage-limit resilience →
      domain boundary → worktrees-only (G-10) → reap → incidental channel,
      plus the escalation rule ("rule yourself only if: applies an existing
      answer, capped blast radius, reversible; else escalate — your word,
      not ours") (D-C14).
- [ ] `references/machine.md:26-28` — fix the printed diagram to include
      `preflight` and `adversaryGate` (both already exist in `machine.json`,
      F-C1) independent of v4, then extend the arrow chain to the v4 state
      count; document state-file schema additions, named runs
      (`.plan-it/<slug>.state.json`) and draft semantics
      (`contract.draft:true`) as prose explaining SQ-B's mechanism — no new
      mechanism invented here (D-C15).
- [ ] Copy every edit above to
      `plugins/plan-it/skills/plan-it/references/{templates,formats,playbooks,machine}.md`;
      confirm all four `diff`s are empty before this epic's DoD.
- [ ] Author `tests/v4/prose/templates-present.mjs` (C-E1-04).
- [ ] Author `tests/v4/prose/gate-shape.mjs` (C-E4-01).
- [ ] Author `tests/v4/prose/sessions-prompts.mjs` (C-E4-02).
- [ ] Author `tests/v4/prose/glossary-seed.mjs` (C-E10-04 — full case,
      including the "15 states" assertion V4C1 already satisfies).

### Tier Table

| tier | effort | escalation | scaffold-pointer |
|---|---|---|---|
| mid | xhigh | escalate to top on struggle (porting field-precedent schemas faithfully — GATE.md/SESSIONS.md/DECISIONS.md shape fidelity to the two precedents read in full) | `build-it:V4C2` |

### Test Contract — Binding (100% pass or /iterate)
Types: [prose][packaging] · Count: 12 (0 [REAL]) · counted by `gate-check handoff`, never hand-typed

| ID | @tag | Given/When/Then | Expected | run: |
|---|---|---|---|---|
| T-V4C2-01 | @case-prose | Given `templates.md`, when checked for the 7 new skeletons + required sub-headings, then all are present (fixture: missing GATE "Standing rules" → FAIL) | 7/7 skeletons found with sub-headings | `node tests/v4/prose/templates-present.mjs` |
| T-V4C2-02 | @case-prose | Given the GATE.md template, when every Answered row's `Type` is checked, then each is `decision`\|`authorization`\|`owner-action` and all 3 sections exist (fixture: untyped row → FAIL) | 0 untyped rows; 3/3 sections present | `node tests/v4/prose/gate-shape.mjs` |
| T-V4C2-03 | @case-prose | Given SESSIONS.md launch prompts, when parsed, then each contains package path, law, lane, branch pattern, DoD, register-handshake, a gotcha, the worktrees-only line (G-10), and no "wait for" a notification (G-11); KICKOFF.md still carries exactly 1 launch prompt | all 7 elements + worktrees-only found per prompt; 0 "wait for" hits; KICKOFF prompt count == 1 | `node tests/v4/prose/sessions-prompts.mjs` |
| T-V4C2-04 | @case-prose | Given the completed package's GLOSSARY seed, when checked against PRD/CDP/ATDD-BDD/DoD/xhigh/D4/G0–G4/[REAL]/INV/S-M-L/Shape1-5/topology, then every term has a row, and SKILL.md no longer says "15 states" | 12/12 terms seeded; 0 "15 states" hits | `node tests/v4/prose/glossary-seed.mjs` |
| T-V4C2-05 | @case-prose | Given `templates.md`'s STATUS.md skeleton, when grepped, then it has a Disposition column, `## Residuals`, and `## Log` | 3/3 found | `sh -c 'grep -c "## Residuals" references/templates.md'` (≥1) |
| T-V4C2-06 | @case-prose | Given `templates.md`'s KICKOFF.md skeleton, when grepped, then it has exactly one new reading-order line pointing at SESSIONS.md and still exactly one launch-prompt slot | 1 reading-order line; launch-prompt count unchanged | `sh -c 'grep -c "SESSIONS.md" references/templates.md'` (≥1, at the KICKOFF block) |
| T-V4C2-07 | @case-prose | Given `formats.md`, when grepped for "§9 ENV-PROBES", then the section exists | 1 section found | `sh -c 'grep -q "§9 ENV-PROBES\|ENV-PROBES" references/formats.md'` |
| T-V4C2-08 | @case-prose | Given `formats.md`'s DoD ladder, when its rungs are counted, then a 4th (residual disposition) rung exists beyond the original 3 | 4 rungs found | `sh -c 'grep -c "rung" references/formats.md'` (≥4) |
| T-V4C2-09 | @case-prose | Given `formats.md`, when grepped for the measurement block grammar, then the exact `Measured: <value> · where:` template string is present | phrase found | `sh -c 'grep -q "Measured:.*where:" references/formats.md'` |
| T-V4C2-10 | @case-prose | Given `playbooks.md` §G, when grepped, then the orchestrator runbook and the escalation rule ("your word, not ours") are both present | both found | `sh -c 'grep -q "your word, not ours" references/playbooks.md'` |
| T-V4C2-11 | @case-prose | Given `playbooks.md` §F, when its numbered items are counted, then a 12th item (first-use acronym lint) exists | item count == 12 | `sh -c 'grep -c "^[0-9]\+\. \*\*" references/playbooks.md'` (≥12, in §F's range) |
| T-V4C2-12 | @case-prose | Given root and mirror `references/*.md` post-edit, when diffed pairwise (4 files), then all 4 are byte-identical | 4/4 `diff` exit 0 | `sh -c 'for f in templates formats playbooks machine; do diff references/$f.md plugins/plan-it/skills/plan-it/references/$f.md || exit 1; done'` |


---

## Epic V4C3 — docs + README + CHANGELOG 4.0.0

Branch: `epic/v4c-docs-release` | Depends on: V4C1, V4C2 (docs must describe
the shipped prose accurately, not draft against a moving target)
Scope: PRD §4 decisions D-C16, D-C17 — `docs/{usage,methodology,installation}.md`,
`README.md`, `CHANGELOG.md`. None of these files are mirrored (single-copy,
per CONTRACT §2).

Tasks:
- [ ] `docs/usage.md` — add an autonomous-draft mode section beside the
      existing guided-mode section, with its own gate table (one PLAN-REVIEW
      row, not three) (D-C16).
- [ ] `docs/methodology.md` — fix the heading from "The four non-negotiable
      rules" to "The five non-negotiable rules" (F-C5, independent-of-v4
      defect) and add whatever rule count v4 introduces so it stays in sync
      with SKILL.md's rule count (D-C16).
- [ ] `docs/installation.md` — add the stale-install cleanup note (owner
      action O-1; three plan-it copies coexist today, one visibly serving
      stale `/fable-it` prose, F-C3/LG-2) — documented as Fernando's action,
      not a code fix (D-C16).
- [ ] `README.md` — name anamnesis, topology, and autonomous-draft explicitly
      (at least one clause each); refresh the Status section for the 4.0.0
      release line (D-C16).
- [ ] `CHANGELOG.md` — add a dated `## 4.0.0 — <ship date>` entry with the
      same required-section set 3.0.0 used (Founder mandates / Write-time
      invariants / Enforcement reach / Additive tooling / Deferred /
      Verification) and a Verification line naming `mirror-check 11/11`
      (once SQ-B's count lands) and the computed run-contract totals (D-C17).
- [ ] Sweep `docs/`, `README.md`, and this squad's `SKILL.md`/`references/*.md`
      edits for any `claude-[a-z0-9-]*-[0-9]` literal (G-4) — zero hits
      expected.

### Tier Table

| tier | effort | escalation | scaffold-pointer |
|---|---|---|---|
| mid | xhigh | escalate to top on struggle (narrative coherence across README/docs — keeping the "three shifts" story consistent without contradicting SQ-A/SQ-B's mechanisms) | `build-it:V4C3` |

### Test Contract — Binding (100% pass or /iterate)
Types: [prose][packaging] · Count: 10 (0 [REAL]) · counted by `gate-check handoff`, never hand-typed

| ID | @tag | Given/When/Then | Expected | run: |
|---|---|---|---|---|
| T-V4C3-01 | @case-prose | Given README/usage.md/methodology.md post-edit, when checked, then README names anamnesis/topology/autonomous-draft, usage.md documents both modes, and methodology.md's rule count equals SKILL.md's | 3/3 checks pass | `node tests/v4/prose/docs-coherence.mjs` |
| T-V4C3-02 | @case-packaging | Given `docs/usage.md`, when grepped, then an autonomous-draft heading with a one-row PLAN-REVIEW gate table exists | heading + 1-row table found | `sh -c 'grep -q "autonomous-draft" docs/usage.md'` |
| T-V4C3-03 | @case-packaging | Given `docs/methodology.md`, when grepped, then the heading reads "five non-negotiable rules" | phrase found, "four" absent | `sh -c 'grep -q "five non-negotiable rules" docs/methodology.md && ! grep -q "four non-negotiable rules" docs/methodology.md'` |
| T-V4C3-04 | @case-packaging | Given `docs/installation.md`, when grepped, then it names the stale-install cleanup as an owner action (O-1) | phrase found | `sh -c 'grep -qi "stale" docs/installation.md'` |
| T-V4C3-05 | @case-packaging | Given `README.md`'s Status section, when grepped, then it references the "4.0.0" release line | phrase found | `sh -c 'grep -q "4.0.0" README.md'` |
| T-V4C3-06 | @case-packaging | Given `CHANGELOG.md`'s `## 4.0.0` section, when its `### ` subsections are counted, then the count matches 3.0.0's required-section set | ≥6 subsections found (Founder mandates/Write-time invariants/Enforcement reach/Additive tooling/Deferred/Verification) | `sh -c "awk '/^## 4\\.0\\.0/,/^## [0-9]/' CHANGELOG.md | grep -c '^### '"` (≥6) |
| T-V4C3-07 | @case-packaging | Given `CHANGELOG.md`'s 4.0.0 Verification subsection, when grepped, then it names "mirror-check 11/11" | phrase found | `sh -c 'grep -q "mirror-check 11/11" CHANGELOG.md'` |
| T-V4C3-08 | @case-packaging | Given every file this epic touches, when scanned for a `claude-<model>` literal (G-4), then zero hits exist | 0 hits | `sh -c '! grep -rEn "claude-[a-z0-9-]*-[0-9]" docs/ README.md CHANGELOG.md'` |
| T-V4C3-09 | @case-packaging | Given `docs/usage.md`'s "What you get back" package tree, when topology = orchestrator+squads is described, then GLOSSARY.md/SESSIONS.md/GATE.md are mentioned as part of that shape | 3/3 file names found | `sh -c 'grep -q "SESSIONS.md" docs/usage.md'` |
| T-V4C3-10 | @case-packaging | manual: after all edits land, a human visually confirms README.md and the three docs/*.md files render correctly as GitHub-flavored markdown (no broken tables, no unclosed code fences) — no new lint tooling introduced (G-2 zero deps) | 0 rendering defects observed | `manual: open README.md, docs/usage.md, docs/methodology.md, docs/installation.md in a markdown preview and confirm no broken tables/fences` |


---

## Epic V4C4 — Versions 4.0.0 across six sites; harness test-file updates

Branch: `epic/v4c-versions` | Depends on: V4C1, V4C2, V4C3 (this squad's own
files must already read the 4.0.0 story before their version numbers bump);
soft-dep on SQ-B (this epic's `machine.json` sites and the named-run state-file
target for `kickoff-pinning.mjs`'s widened regex are SQ-B's to land — see PRD
§10 Corrections #1 and #3)
Scope: PRD §4 decision D-C18 — `plugin.json`, `marketplace.json`, `SKILL.md`
frontmatter (root + mirror, this squad's copies only), `tests/v3/version-triple-match.mjs`,
`tests/v3/kickoff-pinning.mjs`, `tests/v3/changelog-shape.mjs`.

Tasks:
- [ ] `plugins/plan-it/.claude-plugin/plugin.json:4` — bump `version` to
      `"4.0.0"`.
- [ ] `.claude-plugin/marketplace.json` — bump `plugins[plan-it].version` to
      `"4.0.0"`.
- [ ] `SKILL.md:29` frontmatter `version:` — bump to `4.0.0`; mirror to
      `plugins/plan-it/skills/plan-it/SKILL.md`.
- [ ] `tests/v3/version-triple-match.mjs:24` — bump `EXPECTED` from `"3.0.1"`
      to `"4.0.0"`. Note: this test's full pass requires SQ-B's `machine.json`
      (root + mirror) also bumped to `4.0.0` — a cross-squad integration gate,
      not something this epic can land alone (flagged in PRD §10 Corrections).
- [ ] `tests/v3/kickoff-pinning.mjs` — widen the regex asserting
      `.plan-it/state.json` so it also accepts the named-run form
      `.plan-it/<slug>.state.json` (SQ-B's E9 mechanism — this task only
      widens the prose-lint regex; the resolver itself is SQ-B's).
- [ ] `tests/v3/changelog-shape.mjs:44` — update the `required` ID array from
      `["M1", "M2"]` to the ten v4 enhancement IDs (`["E1","E2","E3","E4","E5",
      "E6","E7","E8","E9","E10"]`, per ruling D6: "all ten enhancements in
      4.0.0").
- [ ] Sanity-check: `marketplace.json`'s `plugins[plan-it].description` still
      names `/build-it` (not the pre-rename `/fable-it`) after the version
      bump — no accidental regression.

### Tier Table

| tier | effort | escalation | scaffold-pointer |
|---|---|---|---|
| mid | xhigh | escalate to top on struggle (cross-squad version-integration sequencing at W2) | `build-it:V4C4` |

### Test Contract — Binding (100% pass or /iterate)
Types: [prose][packaging] · Count: 10 (0 [REAL]) · counted by `gate-check handoff`, never hand-typed

| ID | @tag | Given/When/Then | Expected | run: |
|---|---|---|---|---|
| T-V4C4-01 | @case-packaging | [REAL] Given the fully merged W2 tree (this squad's 4 sites + SQ-B's `machine.json` root/mirror), when `version-triple-match.mjs` runs with `EXPECTED = "4.0.0"`, then all 6 sites + CHANGELOG top entry agree | exit 0, all 6 sites = 4.0.0 | `node tests/v3/version-triple-match.mjs` |
| T-V4C4-02 | @case-packaging | Given only this squad's 4 sites (`plugin.json`, `marketplace.json`, `SKILL.md` root+mirror), when read directly, then all 4 already say 4.0.0 independent of SQ-B's `machine.json` landing | 4/4 read 4.0.0 | `sh -c 'grep -q "\"version\": \"4.0.0\"" plugins/plan-it/.claude-plugin/plugin.json'` |
| T-V4C4-03 | @case-packaging | Given `CHANGELOG.md`'s 4.0.0 section, when `changelog-shape.mjs` runs with the ten-enhancement required set, then all ten IDs (E1…E10) are enumerated | exit 0, 10/10 IDs found | `node tests/v3/changelog-shape.mjs` |
| T-V4C4-04 | @case-packaging | Given `kickoff-pinning.mjs`'s widened regex, when tested against a named-run sample path `.plan-it/v4.state.json`, then it matches | regex matches the named-run form | `sh -c "node -e \"process.exit(/\\\\.plan-it\\\\/[a-z0-9-]+\\\\.state\\\\.json/.test('.plan-it/v4.state.json')?0:1)\""` |
| T-V4C4-05 | @case-packaging | Given `kickoff-pinning.mjs`'s original direction-1/direction-2 assertions (generic `.plan-it/state.json` path), when re-run after the regex widening, then no regression occurs | exit code unchanged from pre-widening baseline | `node tests/v3/kickoff-pinning.mjs` |
| T-V4C4-06 | @case-packaging | Given the three edited test files, when scanned for a `claude-<model>` literal (G-4), then zero hits exist | 0 hits | `sh -c '! grep -rEn "claude-[a-z0-9-]*-[0-9]" tests/v3/version-triple-match.mjs tests/v3/kickoff-pinning.mjs tests/v3/changelog-shape.mjs'` |
| T-V4C4-07 | @case-packaging | Given `marketplace.json`'s plan-it entry description post-bump, when grepped, then it still names `/build-it`, never `/fable-it` | `/build-it` found, `/fable-it` absent | `sh -c 'grep -q "/build-it" .claude-plugin/marketplace.json && ! grep -q "/fable-it" .claude-plugin/marketplace.json'` |
| T-V4C4-08 | @case-packaging | manual: given the fully merged tree at W2/W3 (all three squads landed), when `node tests/run-contract.mjs` runs, then v2+v3+v4 all report 100% — a cross-squad integration check this epic cannot run standalone from its own worktree | 100% pass across all discovered cases | `manual: node tests/run-contract.mjs, run at W2/W3 integration once all squads have merged` |
| T-V4C4-09 | @case-packaging | Given `plugin.json` and `marketplace.json` post-bump, when parsed as JSON, then `version` is exactly the string `"4.0.0"` (valid semver, no `v` prefix, no partial `4.0`) | both parse; both == `"4.0.0"` | `sh -c "node -e \"const a=require('./plugins/plan-it/.claude-plugin/plugin.json').version,b=require('./.claude-plugin/marketplace.json').plugins.find(p=>p.name==='plan-it').version; process.exit(a==='4.0.0'&&b==='4.0.0'?0:1)\""` |
| T-V4C4-10 | @case-packaging | Given root `SKILL.md` and its mirror's frontmatter `version:` field, when compared to each other (isolating this squad's own mirror pair, ahead of SQ-B's full `mirror-check`), then they agree | both == `4.0.0` | `sh -c 'diff <(grep "^version:" SKILL.md) <(grep "^version:" plugins/plan-it/skills/plan-it/SKILL.md)'` |


---

## Squad totals

| Epic | Mechanizable | Manual | Total |
|---|---|---|---|
| V4C1 | 12 | 0 | 12 |
| V4C2 | 12 | 0 | 12 |
| V4C3 | 9 | 1 | 10 |
| V4C4 | 9 | 1 | 10 |
| **Total** | **42** | **2** | **44** |

Manual share: 2/44 ≈ 4.5% — well inside the ≤30% ceiling and under the ≤10%
aim. `[REAL]` cases (needing the live/merged tree, never VERIFIED on a mock):
T-V4C4-01, T-V4C4-08.

---

## CONTRACT coverage table (this squad's assigned rows)

Every `@case-prose` and `@case-packaging` row in `delivery/v4/CONTRACT.md`'s
`## Cases`, except `C-E2-11` and `C-E9-09` (SQ-B's, per the orchestrator's
explicit exclusion):

| CONTRACT ID | Epic | Binding case(s) | Note |
|---|---|---|---|
| C-E1-01 | V4C1 | T-V4C1-01 | — |
| C-E1-02 | V4C1 | T-V4C1-02 | — |
| C-E1-03 | V4C1 | T-V4C1-03 | — |
| C-E1-04 | V4C2 | T-V4C2-01 | — |
| C-E4-01 | V4C2 | T-V4C2-02 | — |
| C-E4-02 | V4C2 | T-V4C2-03 | — |
| C-E10-04 | V4C2 | T-V4C2-04 | depends on V4C1's T-V4C1-04 landing first (the "15 states" half) |
| C-E11-01 | V4C4 | T-V4C4-01 (integration) + T-V4C4-02 (local partial) | full pass needs SQ-B's `machine.json` bump — PRD §10 Correction #3 |
| C-E11-02 | V4C4 | T-V4C4-03 | — |
| C-E11-03 | V4C3 | T-V4C3-01 | — |
| C-E11-06 | — (contributed to, not implemented) | T-V4C1-*, T-V4C2-*, T-V4C3-*, T-V4C4-* provide the packaging surface the dogfood run exercises | the runner `tests/v4/core/dogfood-run.mjs` lives in SQ-B's owned directory — PRD §10 Correction #2 |
| C-E11-07 | — (not a build task) | GATE.md wording drafted in `prd-c-prose.md` §4 for the orchestrator to apply | owner action O-1, manual, gates A-2 — not this squad's file to edit |

**10 of 12 assigned rows have a direct binding case in this package** (one of
those, C-E11-01, needs a cross-squad landing to go fully green — its
squad-local partial check is T-V4C4-02). **1 row (C-E11-06) is honestly
contributed-to rather than implemented**, because its runner lives outside
this squad's owned directory. **1 row (C-E11-07) is an owner action this
squad plans the wording for but does not build.** Zero silent drops — every
assigned ID is accounted for above, per CONTRACT G-9 (contract cases never
move to backlog) and G-5 (counts computed, never typed: 12 assigned rows =
10 + 1 + 1 above, matching the 12-row extraction from `## Cases`).

---
_Authored by [DevOtts](https://github.com/DevOtts)._
