# plan-it — document & delivery skeletons

Proven skeletons reverse-engineered from a full discovery→spec→delivery run. Use
the headings and section order; scale the *count* of artifacts to the size picked
at Gate G1 (S / M / L). Bracketed names like `[domain]` are placeholders to rename
per project.

---

## PART A — Spec docs (`docs/`)

### `01-current-state-and-findings.md` — Diagnosis
Forensic inventory of what exists today, grounded in code evidence.
```
1. The N things at a glance (table)
2. The core problem, quantified (the pain, with numbers)
3. How each thing works today
4. <domain-specific reality> today (e.g. observability, RL, comms)
5. The contradictions / tensions to resolve  ← these become load-bearing for 02+
```
Rules: cite `path:line` or table names. Observed facts, not speculation. The list
of contradictions is the spine the rest of the spec resolves.

### `02-vision-and-architecture.md` — Reframe + principles
```
1. What you want (restate the user's wants in their own words)
2. The reframe (the key conceptual shift)
3. The load-bearing distinction(s)
4. Design principles (each one solves a contradiction from 01)
5. The unified architecture (diagram + table: existing asset → role → action)
6. What this buys you (each want → how it's delivered)
```

### `03-data-model-and-contract.md` — Vocabulary + interface
```
1. The canonical entities (the first-class nouns)
2. Mapping to what's already built (which system owns which entity today)
3. The canonical schema (DDL / type definitions)
4. The storage/placement tiers + the placement rule
5. The reporting/interface contract (the verbs / API / events)
6. One store or several? (the honest migration answer)
```

### `04-[domain]-organization.md` — The durable / human layer *(optional)*
Only if there's a human-authoritative or durable-memory surface.
```
1. Is the current structure good enough? (honest partial answer)
2. The layout (folder/structure)
3. Schemas (frontmatter / types, with authority/provenance where relevant)
4. The two-way reconcile loop (read human first; render only machine-owned sections)
5. Rotation / hygiene discipline
6. Wiring it up (concrete steps)
7. How it links to the rest
```

### `05-[components].md` — Component deep-dives
One part per major active component.
```
Part A — <Component 1>
  A.1 The verdict (honest evaluation — keep/endorse/critique)
  A.2 What it already has (table)
  A.3 What to demote / discard
  A.4 What to build (the real work, with cost/uncertainty flags)
  A.5 Migration cost
Part B — <Component 2> … (same shape)
Part C — Alternatives rejected (why X can't be the answer)
```

### `07-[organizing-pattern].md` — Composability *(optional)*
Only if there's a "this repeats / scales as a tree" story.
```
1. The shape (org chart / topology diagram)
2. The key insight (why the structure matters)
3. One primitive, reused at every node
4. Inheritance / taste (how policy flows down)
5. The data model for the structure
6. The "add a new node" playbook (N steps, no core changes)
7. How this changes the rest of the design (deltas to other docs)
8. Why this is the right bet
```

### `06-roadmap-and-open-questions.md` — Execution plan + the decision gate
```
1. Sequencing principle (build in order of leverage/risk)
2. The phased plan (phase 0..N, each shippable + reversible, [ ] checkboxes)
3. The first vertical slice (prove the spine end-to-end)
4. Decisions locked (table: decision · choice · owner · date)   ← GATE G2 output
4b. Still open / newly surfaced
5. Risks & honest caveats (real failure modes, not glossed)
6. Where this leaves the wants (each want → which phase delivers it)
```

**Size S** collapses the above into one `docs/feature-<slug>.md`: problem &
evidence → design → decisions → test/acceptance plan → risks.

---

## PART B — Delivery package (`delivery/`)

### `CONTRACT.md` — the law (frozen before parallel work)
```
1. Vocabulary (the canonical entities)
2. Schema (authoritative columns/types per entity)
3. The verb/interface contract (HTTP + MCP / events — exact shapes)
4. The reusable primitive interface (the core type)
5. Enums & constants (every literal: states, levels, slugs, flags)
6. Repo ownership & branch conventions
7. Definition of "shipped" (epic DoD)
8. Core-logic models — one explicit model (statechart / state-transition table /
   given-when-then transition list) per confusing workflow surfaced in discovery
   (multi-step, approval-gated, agentic, concurrent, retry/escalation). Epics that
   build a modeled workflow MUST reference its model here. Only the confusing
   parts get modeled.
[Changelog v1.0 → v1.x — one line per amendment, with owner]
```
Amendments fold cross-cutting squad findings back here so squads can't drift.

### `00-program-plan.md` — execution blueprint
```
1. Squads (name · repo lane · owns)
2. Epic backlog (EID · epic · dep · wave)
3. Waves (Wave 0..N diagram: which epics, which squads, barriers)
4. Test standard (≥10/epic, T-<EID>-NN naming, [REAL] rules, verifiability precheck)
5. Branching & hygiene (one branch per epic, merge-on-green, cross-repo coordination)
6. The fable-it runbook (per epic: branch → /fable-it → /iterate until green → ship → unblock)
7. Tracking (STATUS.md is the board)
```

### `README.md` — index
```
1. Layout (what each file is)
2. Program at a glance (squads, waves, test totals)
3. Contract amendments log
4. Prerequisites (services, auth, tokens)
5. How to run (link to program-plan)
6. First recommended slice
```

### `KICKOFF.md` — fresh-session orientation
```
1. What you're building (one line)
2. First concrete slice (Wave 0 epics, parallel/sequential)
3. Where code lives (repo table: path · default branch)
4. Locked decisions (each with rationale)
5. Phase/wave order
6. How to run + test (prerequisites + verifiability precheck)
7. Gotchas (each contract amendment = one trap to avoid)
8. Handoff state (committed / open / decisions owed)
```

### `STATUS.md` — live board
```
Current wave · Legend (backlog · in-progress · testing · shipped · blocked)
Program totals (N epics · M test cases · K shipped)
| EID | Epic | Squad | Wave | Status | Tests (green/total) | Branch |
[REAL]-coverage notes · how an epic moves (state machine)
```

### `prds/prd-N-<slug>.md` — per-squad product spec
```
1. Summary (the squad's job in one paragraph)
2. Problem & goals (what's broken, what we fix, AC themes)
3. Users & jobs
4. Solution design (§4.1, 4.2 … per epic; numbered decisions D1–DN; cite file:line)
5. Epics (table: EID · scope · dep · wave)
6. Acceptance criteria (AC1–ACn, tied to epics + tests, [REAL] where applicable)
7. Risks & open questions (with mitigations)
8. Repo & branch plan (one branch per epic, merge on green, commit trailer)
[Optional: Decisions to record in CONTRACT.md (proposed amendments)]
```

### `epics/epics-N-<slug>.md` — per-squad agile breakdown
Per epic `E*.*`:
```
Branch: epic/<EID>-<slug>   |   Depends on: <epics>
Scope: <one-liner + expansion>
Tasks:
  [ ] <task, file:line scoped>
  [ ] …
Test suite (≥10 rows):
  | T-<EID>-01 | unit|integration|e2e | [REAL]? | Given/When/Then | assertion |
  | T-<EID>-02 | …
DoD: all N tests green · merged to main · artifacts visible · STATUS.md updated
```

**The test table is the heart of the agile split.** Per-shape count: **Shape-1
multi-squad programs** hold a **≥10 cases-per-epic floor**; **small shapes** (single
skill/feature) author **~20 total across the package**. Mix unit/integration/e2e;
≥3 e2e for integration/UI epics. `[REAL]` = needs a live
target (real DB, real API, real channel); such a case can never be VERIFIED on a
mock — unreachable target → IMPLEMENTED-NOT-VERIFIED, never a fake green.

---

## PART C — Sizing cheat-sheet

| Size | docs/ | delivery/ |
|------|-------|-----------|
| **S** feature | `feature-<slug>.md` | contract section + `prd` + `epics` (1 each) |
| **M** subsystem | `01,02,03,06` | `CONTRACT` + `00-program-plan` + `STATUS` + 1–2 PRDs/epics |
| **L** program | full `01–07` | `CONTRACT` + `00-program-plan` + `README` + `KICKOFF` + `STATUS` + 4 PRDs + 4 epic sets |

---

## PART D — Packaging shapes (pick at Gate G1 by USE-CASE, then size with PART C)

Size (S/M/L) sets how *much*; shape sets the *form*. Parts A/B above are Shape 1.

### Shape 1 — Multi-doc + `delivery/` (BASELINE)
**Use-case:** from-scratch program, many subsystems, parallel squads.
Full `docs/01–07` + the `delivery/` package (PART A + PART B). The default for L.

### Shape 2 — Single-file PRD-as-everything
**Use-case:** greenfield single app, solo→agent-team build. The CONTRACT is
*inlined* as governance rules, not a separate file.
```
1 Summary · 2 Goals (testable G-IDs) + Non-goals · 3 Users & roles (RBAC)
4 Architecture (+ 4.1 execution accounts & credential boundaries)
5 Data model · 6 Functional requirements per surface (FR1.1…FR3.7)
7 Action adapters — the honesty layer · 8 Pattern/rule specs
9 Governance & privacy (binding: G-1…, CB-1…) · 10 Success metrics
11 Open questions (blocking table) · 12 Agile plan (E#, E#-T#, exit gates, sprint map)
13 /launch handoff block · 14 Verification strategy (test tiers + coverage map)
```
Companion: `qa/test-plan-master.md` (see formats §4–5). PRD header = 2-col table
(Status/Owner/Sponsor/Reference artifacts/Execution method) + a `vX.Y changes:` line.

### Shape 3 — Research → locked-architecture → master-PRD + phase-PRDs
**Use-case:** feature initiative on a LARGE existing repo; research-heavy.
```
docs/implementation/<n>-<topic>/
  README.md        # consolidation hub: reading-order table, decisions-in-one-screen, GATING items
  architecture.md  # canonical design + Decision log ("architecture.md wins") + code touch-map (file:line)
  PRD.md           # master/routing PRD (frames epics; does NOT restate the design)
  PRD-P1-*.md …    # one PRD per phase = one epic (tasks + acceptance + dep-graph + verification)
  research/stream-A..G.md + SHARED-CONTEXT.md   # cited research appendices
```
Each PRD clause: "Where this PRD and architecture.md disagree, architecture.md wins."

### Shape 4 — `implementation/<name>/` with numbered PRD-NN
**Use-case:** multi-app platform / big program where the PRD number = dependency order.
```
implementations/<name>/
  README.md        # the big design doc (BLUF + architecture + phased migration plan)
  PRDs/PRD-01..NN-<slug>.md   # NN = build order; PRD ≈ one epic; lean template:
                              #   1 Context&goal · 2 Scope · 3 Design · 4 Tasks
                              #   5 Acceptance (DoD) · 6 Docs & Skills update (a DoD line!) · 7 Risks
  KICKOFFS.md      # archived launch prompt per PRD/phase (+ optional -CONCLUDE prompts)
  DELIVERY-LOG.md  # status board (timeline + delivery table w/ honest Verification column)
  AS-BUILT.md      # post-build truth doc
  DECISION-*.md / OPTIONS-COMPARISON.md   # ADRs + options matrices
  _research/ _spike/
```
Ship in batches (BATCH-1 = PRD-01/02/05). Author many PRDs via the parallel-batch
generator (playbooks §C). For the 17-section productized-app PRD template, see
playbooks §C reference.

### Shape 5 — Refactor / debt workstream catalog
**Use-case:** brownfield refactor-in-place, migration, tech-debt remediation.
```
1 Executive summary
2 Source of findings (table: Report | Scope | Key gaps — provenance)
3–11 Workstream A…I  (each: gap (verified REAL, file:line) / fix / acceptance / effort+risk)
12 Prioritization & sequencing (Phase | Workstreams | Theme | Rationale)
13 Investigated & Found Correct (No Action)   ← anti-re-chase guard
14 Out of scope · 15 Success criteria (PRD-level)
```
Discovery for this shape is **verify-then-extend** (playbooks §A/§B): confirm every
claimed gap against live code with file:line before it enters the spec.

### Use-case → shape quick map
| Use-case | Shape | Size |
|----------|-------|------|
| New single app, greenfield | 2 (or 1 small) | S/M |
| Feature on a large existing repo | 3 | M |
| From-scratch multi-subsystem program | 1 | L |
| Multi-app platform, many PRDs | 4 | L |
| Refactor / migration / debt | 5 | M/L |
| Research spike (no build yet) | research streams → architecture.md only | S/M |
| PM board automation / ongoing ops | executable split (playbooks §D) | any |
| Document/audit an already-built system | reverse-doc (playbooks §E) | S |

---
_Authored by [DevOtts](https://github.com/DevOtts)._
