---
type: findings
title: plan-it v4 — Findings synthesis
description: What v3.0.1 ships today against each of the ten v4 enhancements, the live-grounding facts, and the design decisions the research left open — merged from four research streams and the coordinator's own measurements.
status: current
verified: 2026-09-07
repos: [plan-it]
tags: [plan-it, v4, findings, synthesis]
---

# plan-it v4 — Findings synthesis

Date: 2026-09-07 · Author: plan-it run "v4" (coordinator, top tier) · Status: synthesis complete
Sources: `docs/v4/research/stream-{A,B,C,D}.md` (four parallel streams: renderer · deterministic core · prose and packaging · field precedents), `docs/v4/research/00-main-thread-grounding.md` (coordinator facts LG-1…LG-18), `delivery/v4/V3-VS-V4-CORE-ENHANCEMENTS.html` (the analysis report with Fernando's rulings), `delivery/v4/resources/` (Notion note + reference HTMLs).
Every claim below cites a stream finding (`F-A1` = Stream A finding 1, etc.) or a grounding fact (`LG-n`); the streams cite `path:line`. Tags: [MEASURED] = a command was run; [VERIFIED-IN-CODE] = read in source; [INFERRED] = not independently confirmed.

**Glossary for this document** (first-use rule, E10): **G0–G4** = the human gates of the pipeline (G0 anamnesis, G1 scope, G2 decisions, G3 freeze, G4 plan review). **DoD** = Definition of Done. **PRD** = Product Requirements Document. **CONTRACT** = the frozen shared law squads build against. **[REAL]** = a test case that needs a live target. **INV** = IMPLEMENTED-NOT-VERIFIED, the closed status word for "built, but the proving case could not run". **FD-1/FD-2** = the two founder mandates from the v3 field study (test-convention receipt; pre-freeze case review). **AMD-n** = a numbered amendment to a frozen contract. **W0…Wn** = build waves. **E1…E10** = the ten v4 enhancements.

## 1. What the baseline is (keep, do not touch)

- **3.0.1 is green once its own mirror is honoured.** [MEASURED] After copying the root guard hook over the plugin copy (W0-in-planning, uncommitted), `tests/run-contract.mjs` reports v2 51/51 + v3 25/25, `mirror-check` 8/8, `fail-closed-sweep` 25/25, `machine-diff` additive vs the v2 baseline, `preflight L` 9/9. Before the copy the only red anywhere was that one drifted pair (F-B1, F-B2, LG-1).
- **The additive check is precise and permissive enough.** [VERIFIED-IN-CODE] `checkMachineAdditive` enforces seven rules: `initial` unchanged; every baseline state, event and guard present; finals stay final; guards on baseline edges unchanged; a baseline edge may be retargeted only onto a NEW state. New states, new events on old states, new guards and new `meta`/`context` keys are free (F-B3, LG-8). A 25-state v4 prototype passes it against both 3.0.1 and the v2 baseline; six negative variants fail with the expected reasons (F-B5).
- **The `state` verb already enforces new gates for free.** [MEASURED] It reads `meta.gate` from whichever machine is passed and demands `approved+owner+date` for every gate in history; extra state-file keys are tolerated (this run's `run.name`, `run.anamnesis` pass). Only the FD-2 checks key on the literal `G2` and `TEST-CONTRACT-REVIEW.md` (F-B7, F-B11).
- **The guard is fail-open and byte-small**; only its state-file resolution block changes (F-B8, §2.9).
- **The Test Contract discipline held under field pressure**: QA repeatedly downgraded to INV rather than fake a green (F-D10); the `[REAL]` rule needs no change (Stream D §2).
- **The conclude-it renderer is a working ancestor.** [MEASURED] `build-report.py` is deterministic (two runs byte-identical), manifest → template → HTML with three slots, exit 0/2/1 (F-A1, F-A2, LG-5).

## 2. Where v3 falls short of each enhancement (the v4 surface)

### 2.1 E1 — the scope gate explains nothing before it asks
[VERIFIED-IN-CODE] Phase 2 says "present the chosen size + shape + the numbered DoD and get a yes"; sizes and shapes are defined only in `references/templates.md` PART C/D. The live G1 screenshot is a bare menu: "Size L, Shape 1 (Recommended)" with one line of gloss, no file tree, no session count, no cost to the human (F-C8). No SCOPE-BRIEF artifact exists in any template (Stream C gap 1).

### 2.2 E2 — no HTML anywhere, and the one field mirror already drifted
[MEASURED] v3 produced zero HTML (F-A11); "html" does not occur in SKILL.md or the references. The eight reference pages Fernando holds up as the standard split into three built on the conclude-it template and five hand-built one-offs with five font stacks; none uses the brand (F-A7). The only md→html mirror in the field, praxya `CONTRACT.html`, is one section behind its `CONTRACT.md` and carries no stamp, so nothing could tell (F-A9, LG-12). The field DECISIONS twin is a **provenance** twin (md ledger 43 lines, html 23 KB with embeds), not a text mirror (F-A10). The renderer to port has a case-sensitive `</script` escape that `</SCRIPT>` breaks out of, and unsanitised link targets (F-A3, LG-13). Brand accents fail WCAG as light-mode text (Signal on Snow 1.65; Slate on Snow 3.08) (F-A13, LG-14). mermaid 10.9.1 is on cdnjs; 11.4.1 is not (F-A17).

### 2.3 E3 — decisions live inline in a roadmap section; the field already has the queue
[VERIFIED-IN-CODE] Phase 7 collects decisions into `06 §4`, answered by number in chat; there is no dedicated ruled ledger, no "why nobody should pick for you", no carry-forward, no GATE.md concept (F-C9, Stream D gap 1). The field has all of it fully formed: a ruled table `ID · Ruling · Effect`, an eight-part open-card anatomy (question, file, situation, why nobody should pick for you, options cheapest-first, recommendation, Read-more embed, related call), a wave-gates-after-round table (F-D17–F-D19), a rulings-carried-forward table and in-place flagging of a fabricated finding with which numbers were re-verified (F-D20). Across two full queues (~29 ruled, 6 open) exactly one item carried a deadline, and as prose (F-D19): the deadline column is a gap the field demonstrates, not a pattern it uses.

### 2.4 E4 — one KICKOFF, one prompt; the orchestrator standard was written by hand
[VERIFIED-IN-CODE] KICKOFF has one launch-prompt slot; a per-PRD KICKOFFS.md is an optional enrichment; "orchestrator" appears once, in a playbook (Stream C gap 3). praxya's package carries the standard v4 must ship as templates: a sessions table (`# · Session name · Role · Opens when`, names used for `/rename` and cross-session addressing), six launch prompts each with seven required elements (package path, law, lane with negative scoping where two squads share a repo, branch pattern, DoD, register-with-orchestrator handshake, one concrete gotcha), a six-step orchestrator runbook, and a "build-order corrections the squads flagged" block promoted into KICKOFF (F-D5, F-D6, F-D8). Two standing lessons from the closeout night are already owner rulings, not inferences: worktrees-only for any repo another session may touch (P2-11 names plan-it/build-it, LG-16) and "poll, never wait" for any prompt that may run headless (LG-17). Deploys versus live squad runs are an unnamed collision class (F-D3).

### 2.5 E5 — nothing requires a picture, a use case or the honest states
[VERIFIED-IN-CODE] No authoring rule asks for a mockup for a UI-shaped decision, a diagram for a flow, or an enumeration of states (Stream D gap 6). The field devices are concrete and repeated: mockups drawn from measured rows with provenance chips on the row; the three honest states (good / not yet run / misconfigured) each drawn, with the Approve affordance **removed** in the misconfigured state and that removal stated as a rule twice, independently; mermaid flows using real function names; before/after on a real object; "the five questions a card must answer" (F-D21).

### 2.6 E6 — every invocation is a plan; the field triaged seven seeds into four plans
[VERIFIED-IN-CODE] Phase 1 locks a DoD for the planning job and assumes the thing should be planned (Stream D gap 4). SEED-TRIAGE's four verdicts each have a distinct exit artifact (Plan now → run; Build instead → archive as absorbed + hand to build-it; Owner decision → one-page memo consumed at another package's G2; Skip → backlog card + seed to done) (F-D12). Three read-only measurements moved three verdicts, each reported as value · where · when · read-only · moved which verdict, and the page is honest that "read-only" has three states: verified, assumed, idempotent-writes-accepted (F-D13). "Stale fact" (true when written) and "Premise false" (never verifiably true) are used precisely and lead to different next steps (F-D14). Three concurrent runs presented their G1s together "so you answer once" (F-D16).

### 2.7 E7 — three interleaved chat gates; no questionnaire; the draft path exists in the code already
[VERIFIED-IN-CODE] One posture table, one mode, three stops (Stream C gap 4). No anamnesis step exists in Phase 0. The mechanics for a draft path already exist by accident: the guard allows any non-empty `contract.version`, and the freeze regex accepts `v1.0-draft` (F-B10). What is missing is any distinction between draft and final, a review artifact other than `TEST-CONTRACT-REVIEW.md`, and a "draft cannot hand off" check (Stream B gaps 6–7).

### 2.8 E8 — no vocabulary for what stays open at close
[VERIFIED-IN-CODE] The four-term status vocabulary has nothing for "this remains open at close and here is why that is acceptable"; the field improvised it per run in STATUS's Evidence column (F-C9, F-D1). The closeout night's disposition set was three-way: executed-clean, closed-by-measurement, owner-gated; backlog went 33 → 19 → 3 with exact exit criteria and the board honestly NOT archived while owner-blocked work remained (F-D1). The same program's pass tally disagreed with itself twice (STATUS table 92, log 93, session card 93) — live evidence for one computed tally source (F-D9, F-D11, LG-15). Real incidental findings (a fleet outage, a log-blind service) surfaced mid-run with no channel of their own (F-D11).

### 2.9 E9 — named runs work only through an un-mirrored fix that is also too narrow
[MEASURED] The 7fcff27 fix lives only in the root guard; the plugin copy Claude Code runs never had it; it landed with no test and no mirror, and the release gate was not re-run (F-B1, F-B18, LG-1). Even the root fix resolves a named run only via a `docs/implementation/<name>/` path: on a two-run fixture, a write under `delivery/v4/prds/` is denied by the wrong (generic) run (F-B8). Six behaviour-bearing sites in gate-check hardcode `.plan-it/state.json`, `testconv` WRITES the generic file, and the dogfood path `delivery/v3/` is hardcoded in reconcile, contract, adversary, freeze and the test harness — a v4 package at `delivery/v4/` gets false greens today (F-B9, F-B12, F-B14). Archiving a done run is a manual `mv` (LG-3).

### 2.10 E10 — five terms never expanded; no rule tells the model to expand anything
[VERIFIED-IN-CODE] PRD, CDP, ATDD/BDD, xhigh and D4 are never expanded anywhere in the package; DoD is used across three sections before its one spell-out; nothing in SKILL.md instructs the model to expand acronyms in what it produces (F-C6). Two ID grammars sit one dash apart (`G1` gates vs `G-1` governance rules; `W0–W4` waves vs `W1–W6` invariant IDs) (F-C7). The token extractors a glossary lint needs already exist in gate-check (F-B16).

### 2.11 Packaging and install debt that v4 inherits
- The SKILL description is 1,738 characters; the platform hard cap is 1,024, a reported combined cap 1,536 [INFERRED], and only 250 characters show in `/skills`. Excess truncates silently. v4 must cut before it adds (F-C2, LG-10).
- Prose already drifted from code: SKILL says 15 states (machine has 17); machine.md's diagram omits `preflight` and `adversaryGate`; methodology.md says four rules (five since v2); `version-triple-match.mjs` hardcodes `EXPECTED = "3.0.1"` (F-C1, F-C4, F-C5, LG-11).
- Three plan-it copies at three versions on this machine; the old `plan-it@plan-it` namespace is still enabled and served stale `/fable-it` prose into this very session (F-C3, LG-2). Owner action, and a README/installation note.
- `gate-check preflight` cites a `formats.md §9` that does not exist; the probe format had to be reverse-engineered (LG-6). An ABSENT probe blacklists every token of its argv, so a drifted mirror probed via `node` marks every node-run case "not runnable" (LG-7).
- Two harness tests will break on any machine with new gates or check names: `T-E1-05` (exactly three gate states) and `T-E1-03` (closed check set). Both have amendment precedent (AMD-1) (F-B6).

## 3. External mechanisms and field patterns worth importing (evidence-graded)

| Pattern | Grade | Source |
|---|---|---|
| Manifest → deterministic renderer, client-side markdown, three-block theme tokens | proven, in use | F-A1, F-A4, F-A5 |
| Provenance stamps in `<meta>` using the KICKOFF `sha256=` grammar | derived from a proven convention | F-A20 |
| Decision card anatomy (8 parts) and ruled table (3 columns) | proven twice independently | F-D17, F-D18 |
| GATE.md three-part shape; SESSIONS table; seven-element launch prompt | proven in an overnight run that shipped 13 epics | F-D5–F-D7, s1-ads card |
| Orchestrator ruling procedure: rule only if covered by an existing answer, capped blast radius, reversible; else escalate "your word, not ours" | proven across six rulings | F-D2 |
| Triage verdicts + measurement grammar + Stale fact / Premise false badges | proven on seven seeds | F-D12–F-D14 |
| Three honest states with removed affordance | proven twice | F-D21 |
| Worktrees-only; poll-never-wait for headless | owner-ruled / measured failure | LG-16, LG-17 |
| Brand tokens as a role layer with WCAG-driven remapping | measured | F-A12, F-A13 |

## 4. The v4 shape (three squads, from the stream boundaries)

| Squad | Lane (disjoint files) | Enhancements |
|---|---|---|
| **SQ-A Renderer** | `scripts/build-report.mjs`, `scripts/report-template.html`, `assets/brand/default.brand.json`, `references/report-family.md`, `tests/v4/renderer/*`, `tests/fixtures/v4/report/*` | E2, E5 (blocks), E10 (render side), D2, D3, D5 |
| **SQ-B Core** | `machine.json`, `scripts/gate-check.mjs`, `scripts/hooks/planit-guard.mjs`, `tests/run-contract.mjs`, `tests/v3/lib/contract-cases.mjs`, `tests/v4/core/*`, `tests/fixtures/v4/{machine,guard,portfolio,glossary,disposition,mirror}*`, `tests/fixtures/v3/machine.v3.7fcff27.json` | E6, E7, E8 (lint), E9, E10 (lint), mirror verb, AMD-4/AMD-5 |
| **SQ-C Prose & packaging** | `SKILL.md`, `references/{templates,formats,playbooks,machine}.md`, `docs/*`, `README.md`, `CHANGELOG.md`, `plugin.json`, `marketplace.json`, `tests/v3/version-triple-match.mjs`, `tests/v3/kickoff-pinning.mjs`, `tests/v4/prose/*` | E1, E3, E4, E7 (prose), E8 (templates), E10 (rule + GLOSSARY seed), release |
| **QA** | reads everything, writes only `delivery/v4/QA-REPORT.md` and STATUS rows | whole Test Contract + dogfood run on a fixture project |

Cross-lane seams the CONTRACT must fix up front: the 11 mirror pairs (SQ-B edits `MIRROR_PAIRS`; SQ-A ships the three new files); the manifest schema and stamp grammar (SQ-A defines, SQ-B's `mirror` consumes); state-file keys and verb names (SQ-B defines, SQ-C's prose names them); the STATUS/GLOSSARY grammars (SQ-B parses, SQ-C templates).

## 5. Out of scope for 4.0.0 (recorded, not built)

- `--brand-init` scaffolding a `brand.json` from a markdown guideline (F-A §4.3) — 4.1.
- conclude-it pointing at the node renderer (two renderers coexist for a while) — vault note.
- A `release` verb or pre-commit that runs the checklist (Stream B gap 14) — process, not code.
- Cleaning the stale installs (LG-2) — owner action; documented in README/installation, listed in GATE.md as not blocking.
- A guard that understands drafts (Stream B Q4) — rejected: keeps the hook dumb and fail-open.

## 6. Decisions the coordinator took at synthesis (defaults; contradict at PLAN-REVIEW)

Numbered R1…R12 so the review page can address them. Each states the alternative.

| # | Decision | Default applied | Alternative not taken | Why |
|---|---|---|---|---|
| R1 | Autonomous-draft mechanics | CONTRACT frozen as `v1.0-draft` at `backboneFreeze`; squads write against it; `planReview` (G4) records G2 answers + G3 approval; `freeze` bumps to v1.0; `REVIEW_CONTRADICTED` re-enters `parallelPlanning` as an amendment | Review before squads write (praxya's actual order) | Fernando's stated behaviour is "entire plan end-to-end, then contradict"; the draft is frozen FOR the squads, so Rule 1's purpose (no squad drift) is kept; the v3 amendment loop already absorbs contradictions |
| R2 | Owner-decision triage verdict | routes to `closedWithoutPlan` with a decision memo + `reopenWhen` | route to `anamnesis` if the owner rules in the same sitting | keeps every non-plan verdict on one exit; reopening is a new run |
| R3 | Ruling tags | typed tags `[DECIDED]/[CHANGED]/[CONFIRM: owner]` are canonical in markdown; glyphs are renderer decoration only | glyphs as source of truth | lintable; one vocabulary |
| R4 | Deadline on decision items | optional `Deadline` column, default `none`; owner-actions with a deadline surface in the close-out report | no column | the field's one deadline nearly got lost; cost is one column |
| R5 | Orchestrator tier | conductor = top tier, in RUN-POLICY | unspecified | never violated in either precedent |
| R6 | Incidental findings | STATUS `## Log` bullets tagged `[incidental]`; never folded into the Test Contract tally; closed via E8 dispositions | separate file | one chronicle |
| R7 | Brand contrast | default tokens deviate from the guideline's letter: Signal/Flare/Info/Warn are chip backgrounds in light mode, muted text is Steel | literal guideline | WCAG measured (F-A13); readability is the guideline's intent |
| R8 | Mirror pairs | 8 → 11 (renderer, template, brand JSON) | 9 (renderer only) | all shipped files must mirror; release line updated |
| R9 | mermaid | pin 10.9.1 on cdnjs, `securityLevel:'strict'`, `<pre>` source fallback offline | 11.x | 10.9.1 is 200 on cdnjs and proven by 12 diagrams in the reference |
| R10 | Package location and path resolution | `run.deliveryRoot` in the state file; every verb resolves the package dir from it (fallback `delivery/`, then `delivery/v3/`) | keep literals | F-B14: literals give false greens |
| R11 | Harness amendments | AMD-4 (gate count binds to the v2 baseline; live has G1–G3 present; every `meta.gate` state has `meta.human:true`) and AMD-5 (mirror pairs 8 → 11) recorded in `delivery/decisions.md` | fork gate concept into `meta.stop` | mirrors AMD-1/AMD-2 precedent exactly |
| R12 | `render` placement | separate `scripts/build-report.mjs`, not a gate-check verb; gated by `artifactsOnDisk` + `mirror` inside `handoff` | verb inside gate-check | different failure model; browser spawn does not belong in a file the harness runs hundreds of times |

## 7. Tensions to carry into the design

- **Rule 1 is weakened by design in autonomous-draft** (R1). Mitigations: a draft can never hand off (`state` check); `freeze --draft` refuses when no defaults were applied; the guard stays dumb.
- **"Guided path byte-identical" is not literally true**: three baseline edges are retargeted through new states (`triage`, `scopeBrief`, `render`). Honest statement: 17 states, 17 events, 5 guards identical; three targets changed to new states; guided still records G2/G3 exactly as today (Stream B Q2).
- **This run's own state is the legacy shape** (`.plan-it/state.json` with `run.name: v4`). Migrating mid-run needs the E9 code first. Left as is; noted in KICKOFF (Stream B R6).
- **The v3 verbs cannot fully lint a package at `delivery/v4/`** during this run (F-B14): positional `freeze`, `contract`, `handoff <dir>`, `adversary <dir>` work; the reconcile embedded in `handoff` scans `delivery/v3/`. The coordinator does that reconciliation by hand and says so in the handoff report.
