# SHARED-CONTEXT — plan-it v4 research fan-out (read this first, every agent)

Run: plan-it v4 · state file `.plan-it/state.json` (state: discovery) · owner Fernando Ott · 2026-09-07
Package home: `delivery/v4/` (research here, PRDs/epics later) · design docs: `docs/v4/`
Baseline under study: `plugins/plan-it/` @ **3.0.1** (root files `SKILL.md`, `machine.json`, `scripts/`, `references/` are byte-identical mirrors of the plugin — cite the PLUGIN path).

## The demand (what v4 is)
Read `delivery/v4/V3-VS-V4-CORE-ENHANCEMENTS.html` (text is fine: strip tags) — ten enhancements E1–E10 and Fernando's rulings. In one line each:
- E1 scope brief before gate G1 (explain sizes/shapes/topology before asking)
- E2 HTML report layer: manifest → deterministic renderer → local HTML beside the canonical markdown twin, opened in Chrome, never a claude.ai artifact; markdown stays the AI-facing bundle
- E3 decision queue (DECISIONS.md/.html: ruled rows with effect · open cards with recommendation, "why nobody should pick for you", Read-more embed · rulings table carried forward · copy-your-rulings block) → answered queue becomes GATE.md (autonomy contract)
- E4 build topology as a G1 axis (solo / orchestrator+squads / headless; user choice, recommendation shown) → SESSIONS.md (exact session names, roles, opens-when, one launch prompt each) + orchestrator runbook. KICKOFF.md + its single launch prompt STAY.
- E5 show-don't-describe: mockups with real measured rows, mermaid flows, real use cases, honest states (good / empty / misconfigured)
- E6 triage verdict before planning (Plan now · Build instead · Owner decision · Skip) + read-only measurements as report content + stale-fact badge
- E7 anamnesis up front (one batched questionnaire) → autonomous-draft run with recommended defaults applied and marked → one PLAN-REVIEW round (review-and-contradict) → freeze. Guided (v3 three-gate) mode stays selectable.
- E8 residual disposition at epic close: backlog-with-reason · owner-gated · IMPLEMENTED-NOT-VERIFIED; contract cases never move to backlog
- E9 named runs `.plan-it/<slug>.state.json` as default; `archive` + `runs` verbs; portfolio view
- E10 readable acronyms: first-use expansion rule on every human-facing surface + generated GLOSSARY.md + handoff lint (unknown ID fails)

Rulings (LOCKED, owner Fernando Ott 2026-09-07): D1 autonomous-draft default · D2 brand = target repo's brand guideline if present, else plan-it's bundled default at `assets/brand/` (Her0 palette: Ink #0D1117, Signal #00E5A0, Flare #FF6B4A, Snow/Cloud/Mist/Slate/Steel/Carbon neutrals; Space Grotesk + Inter) · D3 HTML beside md twin, always created locally · D4 topology = user choice + recommendation · D5 rulings block in 4.0 · D6 all ten in 4.0.0 · D7 v4 is built by orchestrator + 3 squads + QA.

## Hard constraints every finding must respect
1. **Additive over the v2/v3 core.** `gate-check machine-diff` against the 3.0.1 machine must pass: no state renamed/removed, no verb semantics changed. New states/verbs/files only.
2. **Zero npm dependencies** (node: builtins only) for any script.
3. **Status vocabulary is closed:** NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED. No "done"/"complete"/"✅" claims in deliverables without VERIFIED + case ref.
4. **No hardcoded model IDs** (`claude-*`) anywhere in plan artifacts — tiers (top/mid/low) only.
5. **Counts computed, never typed.**
6. Mirror discipline: 8 root↔plugin pairs must stay byte-identical (`gate-check mirror-check`).

## Live-grounding facts already established (do not re-derive; build on them)
- LG-1 Guard mirror drift: `scripts/hooks/planit-guard.mjs` (root) has the named-state fix from commit 7fcff27; `plugins/plan-it/scripts/hooks/planit-guard.mjs` (the copy Claude Code runs via `${CLAUDE_PLUGIN_ROOT}`) does NOT. mirror-check pair exists for this file, so mirror-check currently FAILS or the pair was never re-run since 7fcff27 — verify which.
- LG-2 Three installed copies: `~/.claude-loudr/skills/plan-it/` = SKILL 2.1.0 / machine 2.0.0 (what the bare `/plan-it` skill loads); plugin `plan-it@devotts` = 3.0.1; settings.json still enables `plan-it@plan-it` (old namespace). `~/.claude-loudr/plugins/marketplaces/` has both `plan-it/` and `devotts/`.
- LG-3 v3 CONTRACT/KICKOFF/prose say `.plan-it/state.json`; named runs exist only via the guard fix; archiving a done run is a manual `mv` (screenshot in `delivery/v4/resources/Enhance plan-it/image.png`).
- LG-4 FD-1 receipt registered today in `CLAUDE.md` (`<!-- plan-it:test-conventions -->` block).
- LG-5 `conclude-it` already ships a manifest→HTML renderer: `~/.claude/skills/conclude-it/build-report.py` + `report-template.html` (Python; sections/tables/cards/embeds; theme toggle; mini md renderer). v4 ports this to node, zero deps.

## Exact anchors (3.0.1)
- `plugins/plan-it/skills/plan-it/SKILL.md` — Phase 0 L203 · Phase 1 L231 · Phase 2/G1 L249 · Phase 3 L280 · live-grounding L291 · Phase 4 L325 · Phase 5 L360 · Phase 6 L368 · Phase 7/G2 L409 · Phase 8/G3 L426 · Phase 9 L448 · Phase 10 L485 · Composes L537 · References L545
- `plugins/plan-it/skills/plan-it/machine.json` — 17 states: intake → dodLock → scopeGate(G1) → preGround → discovery → preflight → synthesis → specAuthoring → decisionGate(G2) → coherencePass → freezeGate(G3) → backboneFreeze → parallelPlanning(⟲AMENDMENT) → verify → adversaryGate → handoff → done. Guards: artifactsOnDisk=verify · contractFrozen=freeze · handoffLintClean=handoff · gateRecorded=state · adversarialDepth=adversary. `meta.stateFile` = ".plan-it/state.json".
- `plugins/plan-it/skills/plan-it/scripts/gate-check.mjs` (1653 lines) — verbs: verify freeze handoff state contract testconv reconcile preflight machine-diff adversary pluginlint mirror-check. `cmdVerify` L37 · `cmdFreeze` L79 · PROBE sets L168/176 · `cmdPreflight` L206 · `checkMachineAdditive` L278 · adversary extractors L343–470 · tier-table lint ~L607–660 · status vocab L843 · `MIRROR_PAIRS` L1556 · dispatch table L1617.
- `plugins/plan-it/scripts/hooks/planit-guard.mjs` (122 lines) — DELIVERABLE_RE L21; W4 vocab guard; W3 model-id guard; Rule-1 freeze check reads `.plan-it/state.json` L106.
- `plugins/plan-it/skills/plan-it/references/` — templates.md (PART A docs, PART B delivery incl. KICKOFF L148 / STATUS L171 / prds L179 / epics L192, PART C sizing L245, PART D shapes L255), formats.md (decision log §1, blocking table §2, governance §3, Test Contract, grammars §4, tier matrix §5, task grammar §6, DoD ladder §7, run report §8), playbooks.md (§A discovery modes, §B brownfield, §C scale-out, §D executable split, §E handoff enrichments L172, §F pre-handoff gate L188), machine.md (§1 machine, §2 state file L49, §3 guards L92, §3b hard enforcement L122, §4 degrade, §5 model the confusing parts).
- Tests: `tests/run-contract.mjs` (v2 cases + v3 cases discovered from `delivery/v3/CONTRACT.md` `## Cases`), `tests/v3/*.mjs` (19 scripts), `tests/v3/lib/contract-cases.mjs`, fixtures `tests/fixtures/{v2,v3}/`.
- Version mirrors (6): `plugins/plan-it/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, root+plugin `SKILL.md` frontmatter, root+plugin `machine.json`. Release checklist: CHANGELOG.md "### Verification" (run-contract 100%, fail-closed-sweep, mirror-check 8/8, machine-diff, version-triple-match, changelog-shape).
- Precedent packages: `delivery/v3/` (CONTRACT.md with `## Cases` + RUN-POLICY tier table, 00-program-plan.md, KICKOFF.md, STATUS.md, prds/, epics/) · `docs/v3/`? (check) · v3 decisions log `delivery/decisions.md`.
- Field precedents (Engine-Core, read-only): `~/Workspace/Engine/Engine-Core/docs/implementation/0-done/praxya-sprint1-ads-rules/delivery/{KICKOFF.md,GATE.md,00-program-plan.md,STATUS.md,CONTRACT.html}` · `0-done/open-sessions-closeout/{DECISIONS-bkp-case.html,DECISIONS.html,OVERNIGHT-RUN-REPORT.html,CONCLUDE_REPORT.html}` · `~/Workspace/Engine/Engine-Core/.taskstate/open-sessions-closeout/ORCHESTRATOR-STATE.md` · `0-done/drain-2026-09-04/SEED-DECISIONS-v2.html` · `docs/implementation/SEED-TRIAGE-2026-09-04.html` · `0-done/mission-control-card-context/visual/anatomia-de-uma-decisao.html`.

## Report skeleton (every stream writes exactly this, to its own file)
```
# Stream <X> — <concern>
## 0. Scope + method (what you read, what you ran)
## 1. Findings (numbered F-<X>1…; each: claim → evidence `path:line` or measured value; tag [VERIFIED-IN-CODE] / [MEASURED] / [INFERRED])
## 2. What v3 has that v4 builds on (reuse map: existing function/section → v4 use)
## 3. Gaps v4 must close (numbered, each mapped to E1–E10)
## 4. Design proposal for this concern (concrete: names, schemas, file paths, insertion points; failure states + recovery where a flow exists)
## 5. Test-contract seeds (≥8 candidate cases: ID-less, "given/when/then + how to run", tag [REAL] if it needs a live target)
## 6. Contradictions / risks / open questions for synthesis
## 7. Teammate boundaries (what you deliberately did NOT cover because another stream owns it)
```
Posture: skeptic. Cite `path:line`. Read the actual file before claiming what it contains. Prefer measured over asserted. Never invent a finding — if you could not verify, say so and tag [INFERRED]. Explain every acronym on first use in your report (E10 applies to you too). Stage your report to disk EARLY (write a skeleton first, then fill) — nothing may live only in your final message. You MUST run tools and return findings; do not stop early.
