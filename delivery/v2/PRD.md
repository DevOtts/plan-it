# PRD — plan-it v2.0 "Deterministic Core"

| Status | Owner | Date | Shape/Size | Execution |
|---|---|---|---|---|
| LOCKED — building | Fernando Ott (DevOtts) | 2026-07-04 | Shape 2 (single-file PRD) / M | same-session build (locked decision D4) |

**v2.0 changes:** first version of this PRD.

---

## 1. Summary

plan-it v1 is a planning pipeline whose control flow lives entirely in prose — 1,177
lines of markdown the agent is *hoping* to follow. David Khourshid's "Beyond the
Prompt: Goodbye Slop, Welcome Determinism" (AG Grid conf, 2026-06-26,
youtube.com/watch?v=uMvTAF280so) names this exact pattern as a failure mode:
**prose control flow**. v2 applies his "deterministic core, agentic shell" pattern
*at the right altitude*: the pipeline's states, gates, and guards become an explicit
machine (`machine.json`), each run persists its position in a state file
(`.plan-it/state.json`), and the guards become an executable script (`gate-check.mjs`)
whose exit code — not the model's discipline — decides whether a transition is
allowed. The fuzzy work (discovery, synthesis, doc authoring, judgment) stays
prose-driven LLM work at the nodes.

## 2. Goals & non-goals

**Goals (testable):**
- G1. The pipeline has one explicit, machine-readable model (`machine.json`,
  XState v5-compatible) that prose *explains* instead of *is*.
- G2. Every run is resumable from a persisted `.plan-it/state.json` after crash,
  compaction, or session restart.
- G3. The three most failure-prone prose rules become executable checks:
  "idle ≠ delivered" (`verify`), "no frozen CONTRACT → no squads" (`freeze`),
  and the Phase-10 pre-handoff lint's mechanizable half (`handoff`).
- G4. Planned software inherits the discipline: confusing workflows found in
  discovery must get an explicit model in the spec/CONTRACT ("model the
  confusing parts").
- G5. v1's portability survives: everything degrades gracefully to plain files
  on agents that can't run Node.

**Non-goals:**
- NG1. No external orchestrator app / Agent SDK driver (rejected — kills
  portability and adaptiveness).
- NG2. No Claude Code hooks in v2.0 (locked decision D3 — deferred to v2.1).
- NG3. No formalization of the fuzzy phases (discovery, synthesis, authoring
  stay prose).

## 3. Locked decisions

| # | Decision | Choice | Owner | Date |
|---|---|---|---|---|
| D1 | Guard tool form | Single-file Node ESM script, zero deps (`scripts/gate-check.mjs`) | Fernando | 2026-07-04 |
| D2 | Machine format | XState v5-compatible JSON (`machine.json`), renders in Stately visualizer | Fernando | 2026-07-04 |
| D3 | Hard enforcement via hooks | Deferred to v2.1 | Fernando | 2026-07-04 |
| D4 | Build timing | Build v2 in the planning session (overrides stop-at-handoff default) | Fernando | 2026-07-04 |
| D5 | Canonical copy | Root files are canonical; `plugins/plan-it/skills/plan-it/` mirrors them byte-identical | Claude (recommendation) | 2026-07-04 |
| D6 | State file location | `.plan-it/state.json` in the *target project* being planned (not the plugin repo) | Claude (recommendation) | 2026-07-04 |
| D7 | Enforcement mode in v2.0 | Skill-instructed: the skill MUST run gate-check at guarded transitions and MUST NOT advance on non-zero exit; hard blocking arrives with D3 | Claude (recommendation) | 2026-07-04 |

## 4. Governance (binding)

- G-1. `machine.json` is the single source of truth for pipeline control flow;
  SKILL.md prose must never contradict it. (test: T-E4-01)
- G-2. Every guarded transition in `machine.json` maps to an existing
  `gate-check` subcommand via `meta.check`. (test: T-E1-03)
- G-3. Root and plugin copies of every shipped file are byte-identical. (test: T-E5-02)
- G-4. `gate-check.mjs` has zero npm dependencies. (test: T-E3-11)
- G-5. A `[REAL]` case is never VERIFIED on a mock (inherited v1 invariant —
  no [REAL] cases exist in this package; all targets are local).

## 5. Solution design (per epic)

### E1 — `machine.json`: the explicit model
XState v5-compatible statechart. States mirror the v1 phases: `intake` →
`dodLock` → `scopeGate`(G1) → `preGround` → `discovery` → `synthesis` →
`specAuthoring` → `decisionGate`(G2) → `coherencePass` → `freezeGate`(G3) →
`backboneFreeze` → `parallelPlanning` (with `AMENDMENT` self-loop) → `verify` →
`handoff` → `done` (final). Guarded transitions carry `guard` names; root
`meta.guards` maps each guard to its `gate-check` subcommand. Gate states carry
`meta.gate` + `meta.human: true`.

### E2 — `.plan-it/state.json`: the persisted run
Schema (documented in `references/machine.md`): `schemaVersion`,
`machineVersion`, `run` {goal, startedAt}, `state`, `size`, `shape`,
`gates` {G1,G2,G3 → {approved, owner, date}}, `contract` {version, path,
frozenAt}, `artifacts` [{path, phase, verifiedAt}], `history` [{state, event,
at}]. Skill protocol: on invocation, if the file exists → resume from `state`;
write on every transition; gates record owner+date here (they already require it).

### E3 — `scripts/gate-check.mjs`: executable guards
Subcommands (exit 0 = pass, 1 = fail with named reasons):
- `verify <path...>` — every path exists and is non-empty (Rule 3, post-fanout).
- `freeze <contract.md>` — frozen-CONTRACT structural check: `vN.N` version
  header, ≥3 sections, changelog line, no `TBD`/`TODO`/`<placeholder>` tokens.
- `handoff <dir>` — mechanizable lint (playbooks §F subset): test-ID grammar
  `T-<EID>-NN` consistency, header count == counted case rows, `[REAL]` +
  non-REAL == total, every epic has a Test Contract block, token lint
  (digits-in-words, placeholders).
- `state <state.json> [machine.json]` — schema-validate the run state; print
  current state and allowed next events from the machine.

### E4 — SKILL.md + references amendments
- New Rule 5: **"Run the machine, not the prose"** — read/initialize
  `.plan-it/state.json`, run the guard's `gate-check` at every guarded
  transition, never advance on non-zero exit; degrade gracefully (no Node →
  perform the same checks manually and record them in the state file).
- New output discipline in Phase 6 + CONTRACT skeleton: **model the confusing
  parts** — any multi-step / approval-gated / agentic / concurrent workflow
  surfaced in discovery gets an explicit model (statechart, state table, or
  equivalent) in the spec, and epics reference it.
- `references/machine.md` (new): the machine explained, state-file schema,
  resume protocol, gate-check usage.
- `templates.md` PART B CONTRACT skeleton gains section 8 "Core-logic models";
  `playbooks.md` §F gains lint item 10 (every flagged confusing workflow has a
  model).

### E5 — Packaging
`plugin.json` → 2.0.0 (+ description mentions deterministic core), README v2
section, docs touch-ups, root ↔ plugin byte-identical sync (D5).

## 6. Epics table

| EID | Epic | Deps | Wave |
|---|---|---|---|
| E1 | machine.json | — | 0 |
| E2 | state file schema + machine.md reference | E1 | 0 |
| E3 | gate-check.mjs | E1 | 0 |
| E4 | SKILL.md + references amendments | E1–E3 | 1 |
| E5 | version bump + docs + copy sync | E1–E4 | 2 |

## 7. Test Contract — plan-it v2.0   (BINDING: 100% pass or /iterate)

Types: [unit][integration][doc] · Count: 21 · Surfaces: node script + file checks
Done = every case below is PASS. No [REAL] cases in this package (all targets local).

| ID | Type | Given / When / Then | Assertion |
|---|---|---|---|
| T-E1-01 | unit | machine.json exists / parsed as JSON / no error | `JSON.parse` succeeds |
| T-E1-02 | unit | machine parsed / states listed / all 15 pipeline states + `done` present | state set matches spec §5-E1; `done.type == "final"` |
| T-E1-03 | integration | machine parsed / each `guard` name collected / looked up in root `meta.guards` | every guard has a `meta.guards` entry whose `check` names an existing gate-check subcommand |
| T-E1-04 | unit | machine parsed / every transition target resolved / no dangling targets | all targets are defined states; `initial` is a defined state |
| T-E1-05 | unit | machine parsed / gate states inspected / G1,G2,G3 marked | exactly 3 states have `meta.gate` ∈ {G1,G2,G3} and `meta.human == true` |
| T-E2-01 | integration | valid sample state.json / `gate-check state` run / exit 0 | prints current state + ≥1 allowed next event matching machine.json |
| T-E2-02 | integration | state.json with unknown `state` value / `gate-check state` run / exit 1 | error names the invalid state |
| T-E2-03 | integration | state.json missing required key (`gates`) / `gate-check state` run / exit 1 | error names the missing key |
| T-E3-01 | unit | two existing non-empty files / `gate-check verify` / exit 0 | passes |
| T-E3-02 | unit | one path missing / `gate-check verify` / exit 1 | output names the missing path |
| T-E3-03 | unit | one file empty (0 bytes or whitespace) / `gate-check verify` / exit 1 | output names the empty path |
| T-E3-04 | unit | well-formed frozen CONTRACT fixture / `gate-check freeze` / exit 0 | passes |
| T-E3-05 | unit | CONTRACT missing `vN.N` version header / `gate-check freeze` / exit 1 | error names missing version |
| T-E3-06 | unit | CONTRACT containing `TBD` / `gate-check freeze` / exit 1 | error names placeholder token |
| T-E3-07 | integration | coherent delivery fixture / `gate-check handoff` / exit 0 | passes |
| T-E3-08 | integration | fixture where header says N but N+1 case rows exist / `gate-check handoff` / exit 1 | error reports declared vs counted |
| T-E3-09 | integration | fixture epic with no Test Contract block / `gate-check handoff` / exit 1 | error names the epic |
| T-E3-11 | unit | gate-check.mjs source / scanned / no imports outside node: builtins | zero npm deps (G-4) |
| T-E4-01 | doc | SKILL.md (root) / grepped / mentions machine.json, .plan-it/state.json, gate-check, "model the confusing parts"; frontmatter has `author: DevOtts`; footer line present | all present |
| T-E5-01 | unit | plugin.json / parsed / version | `version == "2.0.0"` |
| T-E5-02 | integration | root files vs plugin copies / byte-diffed / SKILL.md, references/*, machine.json, scripts/gate-check.mjs | all identical (G-3) |

(Case count: 21 — originally hand-typed as 20 and caught by our own
`gate-check handoff` during the build, which is the point of the tool. ID note:
T-E3-10 intentionally not used — token-lint assertions are covered inside
T-E3-07/08 fixtures; IDs are stable, not renumbered.)

## 8. Risks

- **Ceremony creep on S-shapes** — mitigated: state file scales down (~10 lines);
  machine traversal is recorded, not performed, for pass-through states.
- **Skill-instructed ≠ hard-enforced** — acknowledged; a script's exit code is far
  harder to rationalize past than prose, and D3 (hooks) closes the gap in v2.1.
- **XState semantic drift** — mitigated: T-E1-04 round-trips targets; we use only
  the JSON-config subset (states/on/guard/meta/initial/final).

## 9. Repo & branch plan

Single repo `DevOtts/plan-it`, branch `v2/deterministic-core` off `main`, one PR,
merge on Test Contract green. Commit trailer per house rules.

---
_Authored by [DevOtts](https://github.com/DevOtts)._
