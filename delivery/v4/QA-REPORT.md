# QA-REPORT — plan-it v4 (W3)

QA session: v4-qa. Worktree: `.claude/worktrees/qa-w3` (branch `qa/w3`), merged to `main` @ `fef35a3` (descendant of the W2 merge target `5189a04`).

Legend: `✅ PASS` case behavior matches its Expected column, verified by re-running its `run:` command · `⚠️ MANUAL` case cannot be mechanically run, human action required, never silently passed · `❌ FAIL` genuine defect, described inline. IDs: see `GLOSSARY.md` (`V4<letter><n>` epic · `T-<EID>-NN` epic test case · `C-E<n>-NN` CONTRACT case).

## Tally

| Scope | Cases | Pass | Manual | Fail |
|---|---|---|---|---|
| CONTRACT (delivery/v4/CONTRACT.md) | 60 | 59 | 1 (C-E11-07) | 0 |
| Epic V4A1-V4A4 (SQ-A) | 51 | 51 | 0 | 0 |
| Epic V4B1-V4B5 (SQ-B) | 75 | 75 | 0 | 0 |
| Epic V4C1-V4C4 (SQ-C) | 44 | 43 | 1 (T-V4C3-10) | 0 |
| **Total** | **230** | **228** | **2** | **0** |

Release gates (§7): 9/9 PASS. Dogfood (§7): 5/5 PASS. Visual authorization A-3: PASS with 1 finding (see Findings).

**Verdict: no fake green. 228/230 mechanism-ready cases pass; the 2 non-pass cases are genuinely manual (owner action / human visual read), each named with its reason below, never silently marked PASS.**

## Release gates (§7)

| Gate | Command | Result |
|---|---|---|
| run-contract | `node tests/run-contract.mjs` | PASS — v2/v3 51/51 · v3 cases 25/25 · v4 cases 58/58 mechanism-ready + 1 manual (C-E11-07), exit 0 |
| fail-closed-sweep | `node tests/v3/fail-closed-sweep.mjs` | PASS — 25/25 |
| mirror-check | `gate-check mirror-check` | PASS — 11/11 byte-identical pairs |
| machine-diff vs v3 pin | `gate-check machine-diff plugins/plan-it/skills/plan-it/machine.json tests/fixtures/v3/machine.v3.7fcff27.json` | PASS — additive-only superset |
| machine-diff vs v2 pin | `gate-check machine-diff plugins/plan-it/skills/plan-it/machine.json tests/fixtures/v2/machine.v2.fc6abc8.json` | PASS — additive-only superset |
| version-triple-match | `node tests/v3/version-triple-match.mjs` | PASS — 4.0.0 across plugin.json, marketplace.json, both SKILL.md, both machine.json, CHANGELOG top |
| changelog-shape | `node tests/v3/changelog-shape.mjs` | PASS |
| state (root run) | `gate-check state --dir . --run v4` | PASS — state: done (final) |
| handoff (embeds reconcile/glossary/mirror) | `gate-check handoff delivery/v4/` | PASS — 177 distinct case IDs, declared==counted for 13 epics, 5/5 twins MIRROR_FRESH; standalone `reconcile --dir`, `glossary`, `mirror --dir --require-html` also independently PASS |

## Dogfood (§7) — tests/fixtures/v4/dogfood-project/

| Check | Command | Result |
|---|---|---|
| state (resume at handoff) | `gate-check state --dir tests/fixtures/v4/dogfood-project --run dogfood` | PASS — state: handoff, next: HANDED_OFF |
| handoff (embedded mirror+glossary) | `gate-check handoff --dir tests/fixtures/v4/dogfood-project` | PASS — 6/6 twins MIRROR_FRESH |
| mirror --require-html | `gate-check mirror --dir tests/fixtures/v4/dogfood-project/delivery --require-html` | PASS — 6/6 MIRROR_FRESH |
| glossary | `gate-check glossary tests/fixtures/v4/dogfood-project/delivery` | PASS — 6 ID mentions resolved |
| runs | `gate-check runs --dir tests/fixtures/v4/dogfood-project` | PASS — 1 run listed (dogfood, handoff, autonomous-draft, not yet archived — by design, README: one step short of done so freeze/handoff stay exercisable) |

T-V4B5-08/09 (dogfood-run.mjs, the model-driven half's deterministic walk) confirmed PASS as part of SQ-B's epic-case sweep below.

## Visual check (authorization A-3)

Rendered and opened in Chrome (CDP): `delivery/v4/KICKOFF.html` (re-rendered to `/tmp` from its manifest, confirmed `--check` identical to the committed twin) and `delivery/v4/DECISIONS.html` (confirmed `--check` identical).

| Check | KICKOFF.html | DECISIONS.html |
|---|---|---|
| Glossary panel expands on click | PASS | PASS |
| Brand badge reads "brand: Her0 default" | PASS | PASS |
| Theme toggle (auto → light → dark) recolors the page | PASS (verified: bg #fff → #0d1117) | not re-tested (same mechanism, already proven on KICKOFF) |
| First-use `<abbr class="gl">` expansion visible in body prose | **0 abbr present — see Finding 1** | PASS — e.g. first `D1` renders as underlined `<abbr>` with inline `(autonomous-draft is the default mode...)` chip; later `D1`/`G1`/`C-E3-03` occurrences bare |
| Exactly one render warning (brand default, guideline not tokenised) | PASS — exit 2, single `WARNING: brand: default (guideline present, not tokenised)` | not independently re-checked (same manifest-level brand warning applies repo-wide) |

## Findings

**Finding 1 — embed-block content never receives glossary first-use `<abbr>` expansion (affects KICKOFF, CONTRACT, GLOSSARY, PLAN-REVIEW kinds).**
Confirmed by direct inspection of the live rendered artifacts, not just the isolated unit fixtures:
- `renderEmbedBlock` (scripts/build-report.mjs:594-604) wraps embedded markdown in `<script type="text/markdown">…</script>`, documented in `references/report-family.md` line 49 as intentionally client-rendered.
- `expandFirstUse`'s `PROTECTED_RE` (build-report.mjs:434) explicitly excludes `<script>` content from abbr-wrapping — correctly, to avoid corrupting the embedded markdown source — but the side effect is that embed-block content can never be abbr-wrapped server-side, and the client-side markdown renderer does not re-run the expansion pass either.
- Live evidence: `delivery/v4/KICKOFF.html`, `CONTRACT.html`, `GLOSSARY.html`, `PLAN-REVIEW.html` each contain 0 `<abbr>` tags despite their embedded source prose (e.g. KICKOFF.md's `plan-it`, `epic`, `CONTRACT` in real non-code paragraphs) matching GLOSSARY.md IDs verbatim. `DECISIONS.html` (built from `table`/`copy-rulings` blocks, no `embed`) shows 26 `<abbr>` occurrences and the mechanism works correctly there.
- C-E10-03 / T-V4A3-01,02,03 all PASS as written, because their dedicated fixtures use non-embed body blocks — the case commands are not wrong, but they don't exercise the embed path, so this gap was invisible to the mechanism-ready test suite.
- **This is not a case FAIL** (every case's literal `run:` command passes against its Expected column) but is a real product gap: 4 of the 8 report-family kinds structurally cannot fulfill the glossary first-use promise on their primary content. Recommend disposition: `backlog-with-reason` (or the orchestrator may judge this covered by existing scope and waive it) — flagging for a human call, not marking it PASS or FAIL myself.

## GLOSSARY.md coverage

`gate-check glossary delivery/v4/` — PASS, 446 ID mentions resolved against `delivery/v4/GLOSSARY.md`, 0 unknown IDs. Every case ID referenced in this report (`T-V4*-NN`, `C-E*-NN`) is covered by the family-pattern rows in GLOSSARY.md; no bare/unresolvable ID found.

## Case checklist — CONTRACT (60)

| Case | Tag | Result | Note |
|---|---|---|---|
| C-E1-01 | @case-prose | ✅ PASS | `node tests/v4/prose/skill-sections.mjs` |
| C-E1-02 | @case-prose | ✅ PASS | `node tests/v4/prose/description-budget.mjs` |
| C-E1-03 | @case-prose | ✅ PASS | `node tests/v4/prose/local-html-rule.mjs` |
| C-E1-04 | @case-prose | ✅ PASS | `node tests/v4/prose/templates-present.mjs` |
| C-E2-01 | @case-renderer | ✅ PASS | `node tests/v4/renderer/determinism.mjs` |
| C-E2-02 | @case-renderer | ✅ PASS | `node tests/v4/renderer/missing-embed.mjs` |
| C-E2-03 | @case-renderer | ✅ PASS | `node tests/v4/renderer/strict-schema.mjs` |
| C-E2-04 | @case-renderer | ✅ PASS | `node tests/v4/renderer/brand-detection.mjs` |
| C-E2-05 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs mirror --dir tests/fixtures/v4/mirror-missing-twin/delivery --require-html` |
| C-E2-06 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs mirror tests/fixtures/v4/mirror-stale/CONTRACT.md tests/fixtures/v4/mirror-stale/CONTRACT.html` |
| C-E2-07 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs mirror tests/fixtures/v4/mirror-unstamped/X.md tests/fixtures/v4/mirror-unstamped/X.html` |
| C-E2-08 | @case-renderer | ✅ PASS | `node tests/v4/renderer/tally-computed.mjs` |
| C-E2-09 | @case-renderer | ✅ PASS | `node tests/v4/renderer/model-id-leak.mjs` |
| C-E2-10 | @case-renderer | ✅ PASS | `node tests/v4/renderer/open-routing.mjs` |
| C-E2-11 | @case-packaging | ✅ PASS | `node tests/v4/prose/zero-deps.mjs` |
| C-E2-12 | @case-renderer | ✅ PASS | `node tests/v4/renderer/xss-escape.mjs` |
| C-E2-13 | @case-renderer | ✅ PASS | `node tests/v4/renderer/theme-tokens.mjs` |
| C-E2-14 | @case-renderer | ✅ PASS | `node tests/v4/renderer/mermaid-fallback.mjs` |
| C-E3-01 | @case-renderer | ✅ PASS | `node tests/v4/renderer/decision-card-complete.mjs` |
| C-E3-02 | @case-renderer | ✅ PASS | `node tests/v4/renderer/rulings-forward.mjs` |
| C-E3-03 | @case-renderer | ✅ PASS | `node tests/v4/renderer/copy-rulings.mjs` |
| C-E4-01 | @case-prose | ✅ PASS | authorization |
| C-E4-02 | @case-prose | ✅ PASS | `node tests/v4/prose/sessions-prompts.mjs` |
| C-E5-01 | @case-renderer | ✅ PASS | `node tests/v4/renderer/mockup-provenance.mjs` |
| C-E5-02 | @case-renderer | ✅ PASS | `node tests/v4/renderer/measurement-readonly.mjs` |
| C-E5-03 | @case-renderer | ✅ PASS | `node tests/v4/renderer/states-triptych.mjs` |
| C-E6-01 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs state --dir tests/fixtures/v4/triage-no-memo --run t1` |
| C-E6-02 | @case-machine | ✅ PASS | `node tests/v4/core/triage-closed.mjs` |
| C-E6-03 | @case-machine | ✅ PASS | `node tests/v4/core/envfacts-tool-only.mjs` |
| C-E7-01 | @case-machine | ✅ PASS | `node tests/v4/core/machine-additive.mjs` |
| C-E7-02 | @case-machine | ✅ PASS | `node tests/v4/core/machine-negatives.mjs` |
| C-E7-03 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs state --dir tests/fixtures/v4/planreview-no-file --run v4` |
| C-E7-04 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs state tests/fixtures/v4/draft-at-handoff/.plan-it/v4.state.json` |
| C-E7-05 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs freeze tests/fixtures/v4/draft-header/delivery/CONTRACT.md` |
| C-E7-06 | @case-machine | ✅ PASS | `node tests/v4/core/mode-consistency.mjs` |
| C-E7-07 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs state tests/fixtures/v4/defaults-empty/.plan-it/v4.state.json` |
| C-E8-01 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs reconcile --dir tests/fixtures/v4/disposition-missing` |
| C-E8-02 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs reconcile --dir tests/fixtures/v4/disposition-contract-case` |
| C-E8-03 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs reconcile --dir tests/fixtures/v4/disposition-tally-drift` |
| C-E9-01 | @case-machine | ✅ PASS | `node tests/v4/core/state-run-flag.mjs` |
| C-E9-02 | @case-machine | ✅ PASS | `node tests/v4/core/testconv-named.mjs` |
| C-E9-03 | @case-machine | ✅ PASS | `node tests/v4/core/deliveryroot-resolution.mjs` |
| C-E9-04 | @case-machine | ✅ PASS | `node tests/v4/core/archive-moves.mjs` |
| C-E9-05 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs archive beta --dir tests/fixtures/v4/portfolio` |
| C-E9-06 | @case-machine | ✅ PASS | `node tests/v4/core/runs-list.mjs` |
| C-E9-07 | @case-guard | ✅ PASS | `node tests/v4/core/guard-named-run.mjs` |
| C-E9-08 | @case-guard | ✅ PASS | `node tests/v4/core/guard-unfrozen-named.mjs` |
| C-E9-09 | @case-packaging | ✅ PASS | `node tests/v3/mirror-wired-into-release.mjs` |
| C-E9-10 | @case-machine | ✅ PASS | `node tests/v4/core/contract-cases-v4.mjs` |
| C-E10-01 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs glossary tests/fixtures/v4/glossary-unknown-id/delivery` |
| C-E10-02 | @case-machine | ✅ PASS | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs handoff tests/fixtures/v4/glossary-unknown-id/delivery` |
| C-E10-03 | @case-renderer | ✅ PASS | `node tests/v4/renderer/glossary-panel.mjs` |
| C-E10-04 | @case-prose | ✅ PASS | `node tests/v4/prose/glossary-seed.mjs` |
| C-E11-01 | @case-packaging | ✅ PASS | `node tests/v3/version-triple-match.mjs` |
| C-E11-02 | @case-packaging | ✅ PASS | `node tests/v3/changelog-shape.mjs` |
| C-E11-03 | @case-prose | ✅ PASS | `node tests/v4/prose/docs-coherence.mjs` |
| C-E11-04 | @case-machine | ✅ PASS | `node tests/v4/core/guided-unchanged.mjs` |
| C-E11-05 | @case-machine | ✅ PASS | `node tests/v4/core/amd4-gate-count.mjs` |
| C-E11-06 | @case-packaging | ✅ PASS | `node tests/v4/core/dogfood-run.mjs` |
| C-E11-07 | @case-packaging | ⚠️ MANUAL | owner action O-1 (Fernando confirms in GATE.md before the 4.0.0 tag) — never silently PASS |

## Case checklist — Epic cases (170)

### V4A1 — Renderer core: CLI, determinism, exit codes, --open routing, legacy manifest compat (SQ-A, W1)

| Case | Result | Note |
|---|---|---|
| T-V4A1-01 | ✅ PASS | |
| T-V4A1-02 | ✅ PASS | |
| T-V4A1-03 | ✅ PASS | |
| T-V4A1-04 | ✅ PASS | |
| T-V4A1-05 | ✅ PASS | |
| T-V4A1-06 | ✅ PASS | |
| T-V4A1-07 | ✅ PASS | |
| T-V4A1-08 | ✅ PASS | |
| T-V4A1-09 | ✅ PASS | |
| T-V4A1-10 | ✅ PASS | |
| T-V4A1-11 | ✅ PASS | |
| T-V4A1-12 | ✅ PASS | |
| T-V4A1-13 | ✅ PASS | |
| T-V4A1-14 | ✅ PASS | |

### V4A2 — Block catalogue (17 types) + brand tokens + detection + badge/stamps (SQ-A, W1)

| Case | Result | Note |
|---|---|---|
| T-V4A2-01 | ✅ PASS | |
| T-V4A2-02 | ✅ PASS | |
| T-V4A2-03 | ✅ PASS | |
| T-V4A2-04 | ✅ PASS | |
| T-V4A2-05 | ✅ PASS | |
| T-V4A2-06 | ✅ PASS | |
| T-V4A2-07 | ✅ PASS | |
| T-V4A2-08 | ✅ PASS | |
| T-V4A2-09 | ✅ PASS | |
| T-V4A2-10 | ✅ PASS | |
| T-V4A2-11 | ✅ PASS | |
| T-V4A2-12 | ✅ PASS | |
| T-V4A2-13 | ✅ PASS | |
| T-V4A2-14 | ✅ PASS | |
| T-V4A2-15 | ✅ PASS | |

### V4A3 — Glossary panel + first-use expansion + model-ID leak lint + escape hardening + theme tokens (SQ-A, W1)

| Case | Result | Note |
|---|---|---|
| T-V4A3-01 | ✅ PASS | |
| T-V4A3-02 | ✅ PASS | |
| T-V4A3-03 | ✅ PASS | |
| T-V4A3-04 | ✅ PASS | |
| T-V4A3-05 | ✅ PASS | |
| T-V4A3-06 | ✅ PASS | |
| T-V4A3-07 | ✅ PASS | |
| T-V4A3-08 | ✅ PASS | |
| T-V4A3-09 | ✅ PASS | |
| T-V4A3-10 | ✅ PASS | |
| T-V4A3-11 | ✅ PASS | |
| T-V4A3-12 | ✅ PASS | |

### V4A4 — references/report-family.md, fixture completeness, renderer test-harness wiring (SQ-A, W1)

| Case | Result | Note |
|---|---|---|
| T-V4A4-01 | ✅ PASS | |
| T-V4A4-02 | ✅ PASS | |
| T-V4A4-03 | ✅ PASS | |
| T-V4A4-04 | ✅ PASS | |
| T-V4A4-05 | ✅ PASS | |
| T-V4A4-06 | ✅ PASS | |
| T-V4A4-07 | ✅ PASS | |
| T-V4A4-08 | ✅ PASS | |
| T-V4A4-09 | ✅ PASS | |
| T-V4A4-10 | ✅ PASS | |

### V4B1 — machine.json additive superset + byte-pinned 3.0.1 baseline + negative machine fixtures (SQ-B, W1)

| Case | Result | Note |
|---|---|---|
| T-V4B1-01 | ✅ PASS | |
| T-V4B1-02 | ✅ PASS | |
| T-V4B1-03 | ✅ PASS | |
| T-V4B1-04 | ✅ PASS | |
| T-V4B1-05 | ✅ PASS | |
| T-V4B1-06 | ✅ PASS | |
| T-V4B1-07 | ✅ PASS | |
| T-V4B1-08 | ✅ PASS | |
| T-V4B1-09 | ✅ PASS | |
| T-V4B1-10 | ✅ PASS | |
| T-V4B1-11 | ✅ PASS | |
| T-V4B1-12 | ✅ PASS | |
| T-V4B1-13 | ✅ PASS | |
| T-V4B1-14 | ✅ PASS | |

### V4B2 — state verb additions (triage, defaults, plan review, draft-cannot-hand-off, mode, --run) + freeze --draft (SQ-B, W1)

| Case | Result | Note |
|---|---|---|
| T-V4B2-01 | ✅ PASS | |
| T-V4B2-02 | ✅ PASS | |
| T-V4B2-03 | ✅ PASS | |
| T-V4B2-04 | ✅ PASS | |
| T-V4B2-05 | ✅ PASS | |
| T-V4B2-06 | ✅ PASS | |
| T-V4B2-07 | ✅ PASS | |
| T-V4B2-08 | ✅ PASS | |
| T-V4B2-09 | ✅ PASS | |
| T-V4B2-10 | ✅ PASS | |
| T-V4B2-11 | ✅ PASS | |
| T-V4B2-12 | ✅ PASS | |
| T-V4B2-13 | ✅ PASS | |
| T-V4B2-14 | ✅ PASS | |
| T-V4B2-15 | ✅ PASS | |

### V4B3 — Named runs: state-file resolution, deliveryRoot-aware verbs, archive, runs, guard resolution in both copies, grammar widening (SQ-B, W1)

| Case | Result | Note |
|---|---|---|
| T-V4B3-01 | ✅ PASS | |
| T-V4B3-02 | ✅ PASS | |
| T-V4B3-03 | ✅ PASS | |
| T-V4B3-04 | ✅ PASS | |
| T-V4B3-05 | ✅ PASS | |
| T-V4B3-06 | ✅ PASS | |
| T-V4B3-07 | ✅ PASS | |
| T-V4B3-08 | ✅ PASS | |
| T-V4B3-09 | ✅ PASS | |
| T-V4B3-10 | ✅ PASS | |
| T-V4B3-11 | ✅ PASS | |
| T-V4B3-12 | ✅ PASS | |
| T-V4B3-13 | ✅ PASS | |
| T-V4B3-14 | ✅ PASS | |
| T-V4B3-15 | ✅ PASS | |
| T-V4B3-16 | ✅ PASS | |
| T-V4B3-17 | ✅ PASS | |

### V4B4 — mirror, glossary, disposition counting in reconcile, ENV-FACTS tool-only fix, embedded in handoff (SQ-B, W1)

| Case | Result | Note |
|---|---|---|
| T-V4B4-01 | ✅ PASS | |
| T-V4B4-02 | ✅ PASS | |
| T-V4B4-03 | ✅ PASS | |
| T-V4B4-04 | ✅ PASS | |
| T-V4B4-05 | ✅ PASS | |
| T-V4B4-06 | ✅ PASS | |
| T-V4B4-07 | ✅ PASS | |
| T-V4B4-08 | ✅ PASS | |
| T-V4B4-09 | ✅ PASS | |
| T-V4B4-10 | ✅ PASS | |
| T-V4B4-11 | ✅ PASS | |
| T-V4B4-12 | ✅ PASS | |
| T-V4B4-13 | ✅ PASS | |
| T-V4B4-14 | ✅ PASS | |
| T-V4B4-15 | ✅ PASS | |
| T-V4B4-16 | ✅ PASS | |
| T-V4B4-17 | ✅ PASS | |

### V4B5 — Harness: AMD-4, AMD-5, exit polarity, tests/v4/core/* wiring, fixture index, dogfood fixture (SQ-B, W1->W2)

| Case | Result | Note |
|---|---|---|
| T-V4B5-01 | ✅ PASS | |
| T-V4B5-02 | ✅ PASS | |
| T-V4B5-03 | ✅ PASS | |
| T-V4B5-04 | ✅ PASS | |
| T-V4B5-05 | ✅ PASS | |
| T-V4B5-06 | ✅ PASS | |
| T-V4B5-07 | ✅ PASS | |
| T-V4B5-08 | ✅ PASS | |
| T-V4B5-09 | ✅ PASS | |
| T-V4B5-10 | ✅ PASS | |
| T-V4B5-11 | ✅ PASS | |
| T-V4B5-12 | ✅ PASS | |

### V4C1 — SKILL.md prose: anamnesis, triage, topology axis, scope brief, two posture tables, output discipline, description budget (SQ-C, W1)

| Case | Result | Note |
|---|---|---|
| T-V4C1-01 | ✅ PASS | |
| T-V4C1-02 | ✅ PASS | |
| T-V4C1-03 | ✅ PASS | |
| T-V4C1-04 | ✅ PASS | |
| T-V4C1-05 | ✅ PASS | |
| T-V4C1-06 | ✅ PASS | |
| T-V4C1-07 | ✅ PASS | |
| T-V4C1-08 | ✅ PASS | |
| T-V4C1-09 | ✅ PASS | |
| T-V4C1-10 | ✅ PASS | |
| T-V4C1-11 | ✅ PASS | |
| T-V4C1-12 | ✅ PASS | |

### V4C2 — references: seven new template skeletons, formats §9, playbooks §G, machine.md 25-state diagram (SQ-C, W1)

| Case | Result | Note |
|---|---|---|
| T-V4C2-01 | ✅ PASS | |
| T-V4C2-02 | ✅ PASS | |
| T-V4C2-03 | ✅ PASS | |
| T-V4C2-04 | ✅ PASS | |
| T-V4C2-05 | ✅ PASS | |
| T-V4C2-06 | ✅ PASS | |
| T-V4C2-07 | ✅ PASS | |
| T-V4C2-08 | ✅ PASS | |
| T-V4C2-09 | ✅ PASS | |
| T-V4C2-10 | ✅ PASS | |
| T-V4C2-11 | ✅ PASS | |
| T-V4C2-12 | ✅ PASS | |

### V4C3 — docs + README + CHANGELOG 4.0.0 + installation note on stale installs (SQ-C, W1)

| Case | Result | Note |
|---|---|---|
| T-V4C3-01 | ✅ PASS | |
| T-V4C3-02 | ✅ PASS | |
| T-V4C3-03 | ✅ PASS | |
| T-V4C3-04 | ✅ PASS | |
| T-V4C3-05 | ✅ PASS | |
| T-V4C3-06 | ✅ PASS | |
| T-V4C3-07 | ✅ PASS | |
| T-V4C3-08 | ✅ PASS | |
| T-V4C3-09 | ✅ PASS | |
| T-V4C3-10 | ⚠️ MANUAL | human visual/prose read of README + docs rendering as clean GFM — not automatable, never silently PASS |

### V4C4 — Versions 4.0.0 across six sites + harness literals + kickoff-pinning/changelog-shape updates + tests/v4/prose/* (SQ-C, W1->W2)

| Case | Result | Note |
|---|---|---|
| T-V4C4-01 | ✅ PASS | |
| T-V4C4-02 | ✅ PASS | |
| T-V4C4-03 | ✅ PASS | |
| T-V4C4-04 | ✅ PASS | |
| T-V4C4-05 | ✅ PASS | |
| T-V4C4-06 | ✅ PASS | |
| T-V4C4-07 | ✅ PASS | |
| T-V4C4-08 | ✅ PASS | |
| T-V4C4-09 | ✅ PASS | |
| T-V4C4-10 | ✅ PASS | |

