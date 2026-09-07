# plan-it — the deterministic core (machine, state file, gate-check)

v2's load-bearing addition. The pipeline's control flow — states, gates, guards —
lives in `machine.json` (an explicit, XState v5-compatible model), each run
persists its position in `.plan-it/state.json`, and the guards are executable via
`scripts/gate-check.mjs`. The SKILL.md prose *explains* this machine; it no longer
*is* the control flow. Fuzzy work (discovery, synthesis, authoring, judgment)
stays LLM-at-the-node inside states tagged `llmAtTheNode` — non-determinism at
the edges, determinism at the core.

Why: prose control flow ("do step 1, then step 2, never skip the gate") relies on
the model's discipline across a long, summarization-prone context, and sometimes
the model won't follow it. A guard's exit code is much harder to rationalize past
than a paragraph.

---

## 1. The machine (`machine.json`)

XState v5-compatible JSON, restricted to the JSON-config subset
(`initial` / `states` / `on` / `guard` / `meta` / `type: "final"`). Paste it into
the free Stately visualizer (stately.ai/viz) to see the pipeline.

```
intake → dodLock → scopeGate(G1) → preGround → discovery → preflight
  → synthesis → specAuthoring → decisionGate(G2) → coherencePass
  → freezeGate(G3) → backboneFreeze → parallelPlanning ⟲AMENDMENT → verify
  → adversaryGate → handoff → done
```
(fixes a pre-existing v3.0.1 diagram bug, independent of v4: `preflight` and
`adversaryGate` already exist in `machine.json` but were missing from this
printed chain.)

- **Gate states** carry `meta.gate` (`G1`/`G2`/`G3`) + `meta.human: true` — the
  machine stops there until the human answers, and the approval is recorded.
- **Guarded transitions** name a guard; root `meta.guards` maps every guard name
  to its `gate-check` subcommand (`meta.check`) and the rule it enforces:

| Guard | Check | Enforces |
|---|---|---|
| `artifactsOnDisk` | `verify` | Rule 3 — idle ≠ delivered |
| `contractFrozen` | `freeze` | Rule 1 — no frozen CONTRACT → no squads |
| `handoffLintClean` | `handoff` | playbooks §F, the mechanizable half |
| `gateRecorded` | `state` | Rule 2 — gates locked with owner + date |

- **`AMENDMENT`** is a self-transition on `parallelPlanning`: cross-cutting squad
  findings fold back into the CONTRACT (v1.0 → v1.1 …) without leaving the state.

**Small shapes (S):** every state is still *traversed and recorded*, but
pass-through states (e.g. `parallelPlanning` with a single inline "squad") may
take seconds. The machine scales down; it never gets skipped.

## 1b. The v4 pipeline (additive superset — `CONTRACT.md` §3.1 is authoritative)

v4 adds 8 states ahead of and inside the v3.0.1 chain above; all 17
baseline states, events and guards keep their names and meanings unchanged
(G-1). Full v4 state set: `intake, triage, anamnesis, dodLock, scopeBrief,
scopeGate, preGround, discovery, preflight, synthesis, specAuthoring,
decisionGate, defaultsApplied, coherencePass, freezeGate, backboneFreeze,
parallelPlanning, verify, adversaryGate, render, planReview, freeze,
handoff, done, CLOSED_WITHOUT_PLAN`.

```
intake → triage → anamnesis[G0,human] → dodLock → scopeBrief → scopeGate(G1)
  → preGround → discovery → preflight → synthesis → specAuthoring
    guided:      → decisionGate(G2) → coherencePass → freezeGate(G3) → backboneFreeze
    autonomous:  → defaultsApplied  → coherencePass → backboneFreeze (skips freezeGate)
  → parallelPlanning ⟲AMENDMENT → verify → adversaryGate
    guided:      → render → handoff → done
    autonomous:  → render → planReview[G4,human] → freeze → handoff → done
  (freeze → parallelPlanning on REVIEW_CONTRADICTED — recovery loop, then
   verify → adversaryGate → render → planReview again)

non-plan exit: triage → CLOSED_WITHOUT_PLAN
  (a memo must be on disk, else the `state` guard REJECTS the transition)
```

Named failure/recovery states: `CLOSED_WITHOUT_PLAN` is the honest terminal
for a non-plan triage verdict (`build-instead` / `owner-decision` /
`skip`); `REVIEW_CONTRADICTED` is the recovery loop after a human
contradicts the plan-review round — a *second* contradiction of the same
default is written as an open decision card for the owner, never
re-defaulted. See CONTRACT §3.1 for the full guard-by-guard transition
table; this file documents the shape, CONTRACT is the frozen source.

## 2. The run state (`.plan-it/state.json`)

Lives in the **target project being planned** (not the plugin repo). Created at
`intake`, updated on **every** transition. This is what makes a run survive a
crash, a compaction, or a fresh session: resume from the machine, not from
re-reading the transcript.

```json
{
  "schemaVersion": 1,
  "machineVersion": "2.0.0",
  "run": { "goal": "<one line>", "startedAt": "2026-07-04T14:00:00Z" },
  "state": "specAuthoring",
  "size": "M",
  "shape": 2,
  "gates": {
    "G1": { "approved": true, "owner": "Fernando", "date": "2026-07-04" },
    "G2": { "approved": false },
    "G3": { "approved": false }
  },
  "contract": { "version": null, "path": null, "frozenAt": null },
  "artifacts": [
    { "path": "docs/01-current-state-and-findings.md", "phase": 5, "verifiedAt": "2026-07-04T15:02:00Z" }
  ],
  "history": [
    { "state": "intake", "event": "INTAKE_CAPTURED", "at": "2026-07-04T14:05:00Z" },
    { "state": "dodLock", "event": "DOD_LOCKED", "at": "2026-07-04T14:12:00Z" }
  ]
}
```

Required keys: `schemaVersion`, `machineVersion`, `run`, `state`, `gates`,
`history`. `artifacts` records every fan-out output *after* it passed `verify` —
the registry of what is actually on disk.

**Resume protocol** (first thing the skill does on invocation):
1. If `.plan-it/state.json` exists → run `gate-check state .plan-it/state.json`
   → it prints the current state and the allowed next events → continue from
   there. Do NOT restart phases already in `history`.
2. If it doesn't exist → this is a fresh run: create it in `intake`.
3. If it's invalid (bad state, unrecorded gate) → surface the error to the user;
   never silently reset it.

## 2b. v4 state-file additions (additive; `state` tolerates extra keys)

All optional, layered onto the same `.plan-it/state.json` shape above:
`run.name`, `run.mode`, `run.topology`, `run.deliveryRoot`, `run.anamnesis`,
`triage{verdict, measuredAt, measurements[], memo}`, `gates.G0`,
`gates.G2.defaults[]{id, question, default, rationale,
source:"recommended", contradicted}`, `gates.G2.pendingReview`,
`gates.G4{approved, owner, date, contradictions[]}`, `contract.draft`,
`render{manifest, outputs[]{md, html, sha256}}`,
`archive{archivedAt, from}`. CONTRACT §4.6 is the authoritative schema;
this section only orients the reader to what each key is for.

**Named runs.** A run identified by a slug persists at
`.plan-it/<slug>.state.json` instead of the generic `.plan-it/state.json`
— this is what lets more than one plan-it run live in the same repo at
once (`gate-check state --run <slug>`, `gate-check runs` lists the whole
portfolio). `meta.stateFile` names the resolved path;
`meta.stateFileFallback` is always the generic file, for a run that never
adopted a name.

**Draft semantics.** `contract.version` carries a `-draft` suffix (e.g.
`v1.0-draft`) from `backboneFreeze` through `parallelPlanning` in
autonomous-draft mode — the CONTRACT is frozen *for squads* but not yet
ratified by the human. A draft contract never reaches `handoff` (G-13):
`freeze` without `--draft` refuses a `-draft` header, and `state` rejects
`state:handoff` while `contract.version` still carries `-draft`. The
human's plan-review round (`planReview`, G4) is what strips the suffix —
`freeze -> handoff` (`CONTRACT_FINAL`) moves `v1.0-draft` to `v1.0`.

## 3. The guards (`scripts/gate-check.mjs`)

Single-file, zero-dependency Node ESM. Exit 0 = pass; exit 1 = fail with named
reasons. The skill runs the mapped subcommand at every guarded transition and
**must not advance on a non-zero exit** — fix, re-run, then transition.

```bash
node scripts/gate-check.mjs verify docs/01-findings.md _research/    # after any fan-out
node scripts/gate-check.mjs freeze delivery/CONTRACT.md             # before squad fan-out
node scripts/gate-check.mjs handoff delivery/                       # before Phase 10 handoff
node scripts/gate-check.mjs state .plan-it/state.json machine.json  # on resume / after gates
```

What each check asserts:
- **verify** — every path exists; files non-empty; directories non-empty.
- **freeze** — `vN.N` version header, ≥3 `##` sections, a changelog line, no
  `TBD`/`TODO`/`<placeholder>` tokens.
- **handoff** — `T-<EID>-NN` ID grammar (flags drifted `T1-01` forms), declared
  `Count:` == counted case rows, declared `[REAL]` == tagged rows, every epic
  section contains its Test Contract, token lint (digits-in-words, placeholders
  in FROZEN artifacts).
- **state** — schema keys present, `state` is a real machine state, every gate
  in `history` is recorded with `approved` + `owner` + `date`; prints allowed
  next events and their guards.

The `handoff` lint is deliberately only the **mechanizable half** of playbooks
§F — coverage-vs-goals mapping, verb/API reconciliation, and inverse-op coverage
still need the model's judgment. The script buys certainty on the half that
kept shipping as defects; the model keeps the half that needs reading.

## 3b. Hard enforcement (v2.1 — plugin installs on Claude Code)

The plugin ships a `PreToolUse` hook (`hooks/hooks.json` →
`scripts/hooks/planit-guard.mjs`) that hard-blocks the one invariant a hook can
enforce crisply: **no PRD/epic deliverable writes while
`.plan-it/state.json` has `contract.version == null`** (Rule 1). The denial
reason is returned to the model, naming the fix (freeze the contract via
`gate-check freeze`, record the version, retry). Fail-open by design — any
error, missing state file, or non-plan-it project allows the write, so the hook
never interferes with unrelated work. Skill-only installs (no plugin) don't get
the hook; they rely on Rule 5's skill-instructed discipline.

## 4. Degrade, never break

On an agent that can't run Node: perform the same checks manually (read the
files, count the tags, check the version header), record the result in
`.plan-it/state.json` as if the guard had run, and note in the final report that
guards ran in manual mode. The machine and state file are plain JSON any agent
can read and write — the script is an accelerator, not a dependency.

## 5. Model the confusing parts (the output discipline)

The same medicine plan-it took, applied to what plan-it *plans*: when discovery
surfaces a **confusing workflow** — multi-step, approval-gated, agentic,
concurrent, or retry/escalation-laden — the spec MUST include an explicit model
of it (statechart, state-transition table, or equivalent), and the epics that
build it MUST reference that model. The CONTRACT skeleton carries a "Core-logic
models" section for exactly this. Modeling is not ceremony when it replaces
confusion — and only the confusing parts get modeled.

---
_Authored by [DevOtts](https://github.com/DevOtts)._
