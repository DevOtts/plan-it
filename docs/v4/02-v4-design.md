---
type: design
title: plan-it v4 — Design
description: The additive v4 design — statechart, verbs, guard, renderer and report family, topology and autonomy contract, disposition, glossary — with file map, machine changes, non-goals and the acceptance sketch that feeds the CONTRACT.
status: draft pending PLAN-REVIEW
verified: 2026-09-07
repos: [plan-it]
tags: [plan-it, v4, design]
---

# plan-it v4 — Design

Date: 2026-09-07 · Status: draft pending PLAN-REVIEW (G4) · Basis: `docs/v4/01-findings.md` + rulings D1–D7 (2026-09-07) + coordinator defaults R1–R12.
Scope: **legibility + autonomy release** on the v2/v3 deterministic core. Additive only: every 3.0.1 state, event, guard and verb keeps its meaning; `gate-check machine-diff` against a byte-pinned 3.0.1 machine is a release gate.

Glossary (first use): **G0–G4** human gates (anamnesis, scope, decisions, freeze, plan review) · **DoD** Definition of Done · **PRD** Product Requirements Document · **INV** IMPLEMENTED-NOT-VERIFIED · **twin** the `<NAME>.html` rendered beside a canonical `<NAME>.md` · **manifest** the JSON a low-tier author writes for the renderer · **deliveryRoot** the repo-relative folder a run's package lives in.

## 0. Files touched (all under `plugins/plan-it/skills/plan-it/` unless noted; root mirrors follow)

```
NEW  scripts/build-report.mjs               renderer (node ≥18, builtins only)                 SQ-A
NEW  scripts/report-template.html           slots: TITLE EYEBROW SUBTITLE BRAND_BADGE META_STAMPS BRAND_CSS FONT_LINK GLOSSARY BODY MERMAID_SCRIPT FOOTER   SQ-A
NEW  assets/brand/default.brand.json        Her0 tokens, role layer (schema planit-brand/1)    SQ-A
NEW  references/report-family.md            manifest schema planit-report/1 + block catalogue  SQ-A
EDIT machine.json                           +8 states, +3 guards, context.mode, meta.stateFile pattern   SQ-B
EDIT scripts/gate-check.mjs                 +mirror +archive +runs +glossary verbs; freeze --draft; state --run + checks; reconcile dispositions; deliveryRoot resolution; MIRROR_PAIRS 11   SQ-B
EDIT ../../scripts/hooks/planit-guard.mjs   state-file resolution by deliveryRoot (plugin + root)   SQ-B
EDIT SKILL.md                               anamnesis, triage, scope brief, topology axis, two posture tables, output discipline for humans, phases 7–10, description ≤1,024 chars   SQ-C
EDIT references/templates.md               +SCOPE-BRIEF ANAMNESIS DECISIONS GATE SESSIONS PLAN-REVIEW GLOSSARY skeletons; STATUS Disposition column + Residuals + Log   SQ-C
EDIT references/formats.md                 §9 ENV-PROBES (LG-6); DoD ladder 4th rung (dispositions); measurement block; triage verdicts   SQ-C
EDIT references/playbooks.md               §E +SESSIONS/PLAN-REVIEW; §F +glossary lint item; §G orchestrator runbook   SQ-C
EDIT references/machine.md                 25-state diagram (fix 15→17→25), state-file schema additions, named runs, draft semantics   SQ-C
EDIT docs/{usage,methodology,installation}.md, README.md, CHANGELOG.md (4.0.0), plugin.json, marketplace.json   SQ-C
EDIT tests/run-contract.mjs (AMD-4, AMD-5, version 4.0.0, v4 case discovery), tests/v3/lib/contract-cases.mjs, tests/v3/version-triple-match.mjs (EXPECTED 4.0.0), tests/v3/kickoff-pinning.mjs (named-state regex)   SQ-B / SQ-C as listed in the CONTRACT
NEW  tests/v4/{renderer,core,prose}/*.mjs · tests/fixtures/v4/** · tests/fixtures/v3/machine.v3.7fcff27.json (byte-pinned baseline)
```

## 1. The statechart (E6, E7, E1 — SQ-B)

Eight new states; `run.mode ∈ {autonomous-draft, guided}` recorded at anamnesis (default autonomous-draft, D1). Both paths live in one machine; the skill fires the mode's events; the `state` verb enforces mode consistency.

| from | event | to | guard | note |
|---|---|---|---|---|
| intake | INTAKE_CAPTURED | **triage** | — | baseline edge retargeted through a NEW state |
| triage | TRIAGE_PLAN | **anamnesis** | triageRecorded | verdict Plan now |
| triage | TRIAGE_BUILD_INSTEAD / TRIAGE_SKIP / TRIAGE_OWNER_DECISION | **closedWithoutPlan** (final) | triageRecorded | memo (+ backlog card / decision card) on disk |
| anamnesis (gate **G0**, human) | G0_ANSWERED | dodLock | gateRecorded | records `gates.G0`, `run.mode`, `run.deliveryRoot`, `run.topology` |
| dodLock | DOD_LOCKED | **scopeBrief** | — | retargeted through a NEW state |
| scopeBrief | BRIEF_RENDERED | scopeGate | artifactsOnDisk | `SCOPE-BRIEF.md` + `.html` |
| scopeGate (G1) … specAuthoring | unchanged | | | G1 now also records `topology` |
| specAuthoring | SPECS_DRAFTED | decisionGate | — | guided (baseline) |
| specAuthoring | SPECS_DRAFTED_AUTONOMOUS | **defaultsApplied** | — | new event on a baseline state |
| defaultsApplied | DEFAULTS_APPLIED | coherencePass | defaultsRecorded | `gates.G2.defaults[]` non-empty, every row `source:"recommended"` |
| coherencePass | COHERENT | freezeGate | — | guided (baseline) |
| coherencePass | COHERENT_AUTONOMOUS | backboneFreeze | — | skips freezeGate |
| backboneFreeze | CONTRACT_FROZEN | parallelPlanning | contractFrozen | guided: `freeze` → v1.0 · autonomous: `freeze --draft` → v1.0-draft |
| parallelPlanning ⟲ AMENDMENT / SQUADS_COMPLETE → verify → adversaryGate | unchanged | | | `handoff` now embeds glossary + mirror checks |
| adversaryGate | ADVERSARY_CLEAN | **render** | adversarialDepth | retargeted through a NEW state; both modes render |
| render | RENDERED | handoff | artifactsOnDisk | guided |
| render | REVIEW_READY | **planReview** | artifactsOnDisk | autonomous |
| planReview (gate **G4**, human; `meta.records: ["G2","G3"]`) | REVIEW_ANSWERED | **freeze** | planReviewed | one stop: G4 + G2 answers + G3 approval; contradictions listed |
| freeze | CONTRACT_FINAL | handoff | contractFrozen | `freeze` (no `--draft`): v1.0-draft → v1.0 |
| freeze | REVIEW_CONTRADICTED | parallelPlanning | contractFrozen | recovery: contradiction that changes the CONTRACT re-enters squads as an AMENDMENT (v1.1-draft) |
| handoff | HANDED_OFF | done | — | unchanged |

Guard → check mapping: `triageRecorded`, `defaultsRecorded`, `planReviewed` all map to the `state` check (so `T-E1-03`'s closed set survives). Gate ids G0 and G4 need AMD-4 (R11). Failure and recovery states named: `closedWithoutPlan` (honest exit), `freeze.REVIEW_CONTRADICTED → parallelPlanning` (recovery loop), `planReview` refused without `PLAN-REVIEW.md` (fail-closed), `render` refused when a twin is missing, `archive` refuses a non-terminal run. **Core-logic model for the CONTRACT**: this table, with these failure states, so the adversary gate has something to check.

## 2. The `state` verb and the run-state file (E7, E9 — SQ-B)

Additions fire only when the key is present (additive):
1. `triage` payload: `verdict ∈ {plan, build-instead, owner-decision, skip}`, `measuredAt`, `measurements[]`; for non-plan verdicts `triage.memo` must exist on disk.
2. `defaultsApplied`: `gates.G2.defaults[]` of `{id, question, default, rationale, source:"recommended", contradicted}`.
3. `planReview`: when `gates.G4.approved`, `<deliveryRoot>/PLAN-REVIEW.md` exists with `Reviewed-by: <name> <date>`; `gates.G2` and `gates.G3` approved+owner+date; every default either `contradicted:false` or matched by a `gates.G4.contradictions[]` entry.
4. Draft cannot hand off: `state ∈ {handoff, done}` with `/-draft$/` version → fail.
5. Mode-aware FD-2 artifact: autonomous-draft → `PLAN-REVIEW.md` (which embeds the case review); guided → `TEST-CONTRACT-REVIEW.md` byte-for-byte as today.
6. Mode consistency: autonomous history may not contain `decisionGate|freezeGate`; guided may not contain `defaultsApplied|planReview|freeze`. "next events" filtered by `meta.mode` tags.
7. `--run <slug>` on `state`, `freeze`, `testconv`, `contract`, `reconcile`, `adversary`; root derivation accepts `.plan-it/<slug>.state.json`.

State-file schema additions (all optional): `run.name`, `run.mode`, `run.topology`, `run.deliveryRoot`, `run.anamnesis`, `triage{}`, `gates.G0`, `gates.G2.defaults[]`, `gates.G4{approved, owner, date, contradictions[]}`, `contract.draft`, `render{manifest, outputs[{md, html, sha256}]}`, `archive{archivedAt, from}`. `meta.stateFile` becomes `.plan-it/<slug>.state.json` with `meta.stateFileFallback: .plan-it/state.json`.

## 3. Draft contract and Rule 1 (E7 — SQ-B)

`freeze <CONTRACT.md> --draft` requires header `v1.0-draft`, runs every structural check (sections, changelog, placeholders, RUN-POLICY) and skips only `casesReviewed` (records `contract.draft:true`). `freeze` without `--draft` rejects a `-draft` header and requires `casesReviewed`. The guard is unchanged (any non-empty version allows). Mitigations: `state` check 4; `freeze --draft` refuses when `gates.G2.defaults` is empty; `REVIEW_CONTRADICTED` recovery. Rejected: `v0.9` (hides draft status; breaks the v1.0 → v1.1 amendment rule).

## 4. Named runs and the guard (E9 — SQ-B)

`resolveStateFile(root, slug)`: explicit slug → `<root>/.plan-it/<slug>.state.json`; else exactly one `*.state.json` and no generic → that one; else generic. Every verb routes through it; `testconv` writes its receipt to the resolved file (fixes F-B9). Package dir = `run.deliveryRoot` (fallback `delivery/`, then `delivery/v3/`) in `reconcile`, `contract`, `adversary`, `freeze` and `contract-cases.mjs` (fixes F-B14).

**Guard resolution** (replaces root L105–L118, then mirrored): list `.plan-it/*.state.json` (excluding `done/`); pick the run whose `run.deliveryRoot` is the longest path-prefix of the written file; else legacy `docs/implementation/<name>/` match; else generic; else allow. Deny message names the RESOLVED file. Everything else byte-identical, fail-open.

`archive <slug>`: requires `state ∈ {done, closedWithoutPlan}`; moves to `.plan-it/done/`; appends `archive{}`; no `--force`. `runs [--json]`: lists live + archived runs (slug · state · mode · contract · last transition · deliveryRoot); computed counts; exit 0 on zero runs.

## 5. The renderer and the report family (E2, E5, E10-render — SQ-A)

`node build-report.mjs <manifest.json> [--open] [--brand <path>|default] [--out <file>] [--check]`. Exit 0 rendered; 2 rendered with warnings (missing embed, unresolved glossary ID, unknown block, brand fell back, mockup without provenance); 1 error, nothing written. `--check` renders to memory and compares with the existing twin (0 identical / 2 stale / 1 error) — what `gate-check mirror` calls. Determinism: no timestamps, no absolute paths; same inputs ⇒ byte-identical HTML. Markdown renders client-side (self-contained page); escape `</script` case-insensitively and `<!--`; sanitise link schemes and attribute quotes. `--open`: default create-only; on macOS `open -a "Google Chrome"` then `open`; linux `xdg-open`; suppressed when non-TTY or `PLANIT_NO_OPEN=1`; never changes exit code; the skill passes `--open` only at human gates.

**Brand (D2)**: detection order flag → `.plan-it/brand.json` → `brand.json` in four conventional places → markdown guideline present-but-not-tokenised (warning, default used, badge says so) → bundled `default.brand.json`. Role tokens only (`bg card line ink muted accent accent-bg ok warn bad info chip hold font-*`); the renderer emits the three-block CSS. Badge + `<meta name="planit-brand">` always present. Default tokens apply R7 (Signal/Flare/Info/Warn as chip backgrounds in light mode; muted = Steel).

**Stamps** (the mirror contract): `planit-source` (`<relpath> sha256=<hash>` of the md), `planit-embeds`, `planit-brand`, `planit-renderer`, `planit-kind`. Paths relative to the twin's directory.

**Report family** (kind → md twin → required blocks → rendered when → reader):

| Kind | Twin | Required | When | Reader |
|---|---|---|---|---|
| SCOPE-BRIEF | `SCOPE-BRIEF.md` | glossary · per size×shape×topology cards (produces / build shape / cost to human / wrong when) · recommendation decision-card | before G1 | owner |
| TRIAGE | `TRIAGE.md` | glossary · computed tally · triage-card per seed · measurement blocks with Stale-fact / Premise-false badges | before planning | owner |
| RESEARCH-REPORT | `01-findings.md` or `research/*.md` | glossary · findings table · measurement · mockup/flow where shaped · states · sources | end of discovery | owner, authors |
| DECISIONS | `DECISIONS.md` | glossary · rulings table · open decision-cards (kind ∈ decision/authorization/owner-action; question, options cheapest-first, recommendation, why nobody should pick for you, Read-more embed, unblocks, deadline) · rulings-forward · copy-rulings (D5) | G2 (guided) / PLAN-REVIEW (autonomous) | owner |
| CONTRACT | `CONTRACT.md` | glossary · lockbox (G2 locks) · sections derived from md H2s · cases table computed | at freeze + every amendment | squads |
| KICKOFF | `KICKOFF.md` + `SESSIONS.md` | glossary · pins · single launch prompt (kept) · sessions table + one copy block per session · runbook flow | handoff | terminal opener |
| PLAN-REVIEW | `PLAN-REVIEW.md` | glossary · defaults table R1…Rn (default · alternative · why · contradict by "Rn: <alt>") · package tree · states (what if you answer nothing) · copy-rulings | after autonomous draft | owner |
| GLOSSARY | `GLOSSARY.md` | collapsed panel at the top of every kind; first-use `<abbr>` expansion in body | whenever IDs change | everyone |

Block catalogue (each with a failure state): `table` (computed footers), `cards`, `decision-card`, `embed`, `mockup` (requires `provenance{source, rows_read, read_at, read_only:true}` or exit 2 + red chip "not drawn from measured rows"), `flow` (mermaid 10.9.1 cdnjs, strict, `<pre>` fallback), `states` (good / empty / misconfigured triptych; missing state → grey "not enumerated" column), `measurement` (`read_only:false` → exit 1), `rulings`, `rulings-forward`, `copy-rulings`, `glossary`, `lockbox`, `tally` (counted from referenced sections), `triage-card`, `copy`, `html` (escape hatch; count printed on stdout). Model-ID leak lint reuses the guard's regex with a per-manifest `allow_tokens` list.

## 6. Mirror, glossary and disposition checks in gate-check (E2, E10, E8 — SQ-B)

- `mirror <md> <html>` / `mirror --dir <delivery>`: recompute the stamped hashes; exit 0 fresh / 2 stale (re-render) / 1 unstamped or malformed. Embedded in `handoff` as a scoped step (fires when a stamped `.html` exists). A family-kind md with no twin is reported; `--require-html` fails it.
- `glossary <delivery-dir>`: extract ID tokens from KICKOFF, DECISIONS, STATUS, SESSIONS, GATE (after `stripCode`) with the existing grammars; each must match a `GLOSSARY.md` row or family pattern (`T-*-NN`); exit 1 naming each unknown with `file:line`. Embedded in `handoff`; `state` requires `GLOSSARY.md` at `handoff` when `machineVersion` major ≥ 4.
- Dispositions in `reconcileScan`: STATUS board gains `Disposition` column + `## Residuals` table; closed grammar `backlog-with-reason: <path>` · `owner-gated: <owner>` · `IMPLEMENTED-NOT-VERIFIED: <case> <target>`; every non-VERIFIED row needs one; a contract case (`T-…`/`C-…`) with `backlog-with-reason` fails ("contract cases never move to backlog"); a typed `Dispositions:` tally must equal the computed one. `[incidental]` log bullets are counted, never folded into the case tally (R6).

## 7. Prose, templates, packaging (E1, E3, E4, E7, E8, E10 — SQ-C)

- **SKILL.md**: Phase 0 gains anamnesis (questionnaire: access the run may probe, fences, naming, topology preference, live-probe authorisation, decisions already known) and the triage verdict; Phase 2 gains the topology axis (solo / orchestrator+squads / headless; user's choice, recommendation derived from size+shape+lanes, D4) and renders SCOPE-BRIEF before the menu; two posture tables (guided: G1 G2 G3; autonomous-draft: G0 G1 G4); Phases 7–8 in autonomous mode apply defaults marked `[default — contradict if wrong]`; Phase 10 adds the residual-disposition pass, SESSIONS.md + GATE.md + GLOSSARY.md to the assembly, `--open` only at human gates; new section **"Output discipline for humans"** (first-use rule + legend line when ≥3 per-run IDs appear together); description cut to ≤1,024 characters with trigger words in the first 250. Fix "15 states".
- **templates.md**: SCOPE-BRIEF, ANAMNESIS, DECISIONS (ruled · open · carried-forward · copy-your-rulings), GATE (Answered with `Type ∈ decision/authorization/owner-action` and optional `Deadline` · Still human not blocking · Standing rules incl. the escalation procedure and worktrees-only and poll-never-wait), SESSIONS (table + one launch prompt per session with the seven elements + orchestrator runbook 8 steps incl. incidental-finding channel), PLAN-REVIEW, GLOSSARY (static vocabulary + generated IDs), STATUS with Disposition/Residuals/Log. KICKOFF unchanged except one reading-order line pointing at SESSIONS.md.
- **formats.md**: §9 ENV-PROBES format (closes LG-6); DoD ladder 4th rung; measurement block grammar; triage verdict set.
- **docs**: usage.md both modes; methodology.md five rules + the three shifts; installation.md the stale-install cleanup note; README three shifts; CHANGELOG 4.0.0 with Verification line updated (mirror-check 11/11, run-contract totals computed).
- **Version 4.0.0** across the six mirrors; `version-triple-match.mjs` EXPECTED; `kickoff-pinning.mjs` regex widened.

## 8. Topology and the autonomy contract (E4 — SQ-C templates, dogfooded by this run)

Topology is chosen at G1 with the recommendation shown (D4). `SESSIONS.md` lists exact names for `/rename`, role, reads, opens-when, one launch prompt each. `GATE.md` is the projection of the answered DECISIONS queue plus authorisations and owner actions, with the standing rules. The orchestrator runbook: dispatch · verify on disk · merge per lane · usage-limit wakeup chain · domain boundary · worktrees-only · reap at wave close · incidental channel. Headless fallback and poll-never-wait are standing rules. KICKOFF.md and its single launch prompt stay.

## 9. Machine changes summary (`machine.json`)

+8 states (`triage`, `closedWithoutPlan`, `anamnesis`, `scopeBrief`, `defaultsApplied`, `render`, `planReview`, `freeze`) · +3 guards (`triageRecorded`, `defaultsRecorded`, `planReviewed`, all → `state`) · +5 events on baseline states (`SPECS_DRAFTED_AUTONOMOUS`, `COHERENT_AUTONOMOUS`, + the new-state events) · 3 baseline edges retargeted through new states · `context.mode`, `context.deliveryRoot`, `context.topology` · `meta.stateFile` pattern. Version `4.0.0`. Gate for release: `machine-diff` against `tests/fixtures/v3/machine.v3.7fcff27.json` AND `machine.v2.fc6abc8.json`.

## 10. Non-goals (4.0.0)

`--brand-init`; conclude-it migration; a `release` verb; server-side markdown; interactive answering beyond the copy-your-rulings block; changing the guard to understand drafts; renaming any ID grammar (the legend line defuses the `G1`/`G-1` collision instead).

## 11. Acceptance sketch (feeds the CONTRACT `## Cases`)

- machine-diff passes vs 3.0.1 and v2 baselines; six negative fixtures fail with named reasons.
- `state` rejects G4 without PLAN-REVIEW.md; rejects a draft at handoff; rejects mode-inconsistent history; tolerates extra keys.
- Guard resolves a named run by deliveryRoot on a two-run fixture, in BOTH copies; denies a genuinely unfrozen named run.
- `archive` moves a done run and refuses a live one; `runs` lists a two-run portfolio and exits 0 on none.
- `mirror` exits 2 on a stale stamp, 1 on an unstamped twin, 0 after re-render; `handoff` embeds it.
- `glossary` names an unknown ID with file:line; `handoff` embeds it.
- Dispositions: non-green row without disposition fails; contract case with backlog-with-reason fails; typed tally ≠ computed fails.
- Renderer: byte-identical twice; missing embed → exit 2 + placeholder; mockup without provenance → exit 2 + red chip; measurement `read_only:false` → exit 1; `</SCRIPT>` breakout impossible; brand detection order; glossary panel on every kind; first-use `<abbr>` once; model-ID leak → exit 2 with allow-list; mermaid pin + `<pre>` fallback; `--open` routing and suppression; legacy conclude-it manifest still renders.
- Prose: "Output discipline for humans" section exists once per copy; every new template present with required headings; description ≤1,024 chars; both modes in usage.md; methodology rule count equals SKILL's; README names anamnesis, topology, autonomous-draft; no `claude-*` literal in prose; version 4.0.0 across six mirrors + CHANGELOG; CHANGELOG 4.0.0 has the required sections.
- Release: run-contract 100% (v2 + v3 + v4 discovered from `delivery/v4/CONTRACT.md`), fail-closed-sweep, mirror-check 11/11, machine-diff both baselines, version match, changelog shape.
