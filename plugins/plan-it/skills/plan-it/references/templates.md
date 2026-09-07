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

### `ANAMNESIS.md` — gate G0, the one up-front questionnaire
Runs once, in Phase 0, before pre-grounding. Batched like G2 (numbered,
answer-by-number), but about the run's own terms, not its content — answers
seed the DoD's Assumptions list and `DECISIONS.md`'s Ruled table directly,
so G2 never re-asks something already told up front.
```
## ANAMNESIS — before we start

1. Access & credentials this run may probe: <list what's found so far;
   ask which are live-testable vs off-limits>
2. Fences: anything explicitly not-to-touch? (folds into the DoD's
   Assumptions list)
3. Naming: any existing convention for new entities/branches/sessions this
   run must match?
4. Topology preference, if you already know it (else: recommendation at G1)
5. Live-probe authorization: may this run make read-only live calls during
   live-grounding? Any calls that mutate anything, even dummy objects?
6. Decisions you already know the answer to (so G2/DECISIONS.md doesn't
   re-ask something you've already told us)
```

### `SCOPE-BRIEF.md` — the size/shape/topology explainer, before the G1 menu
Rendered at Phase 2, before the G1 menu — a rendering of PART C (sizing) and
PART D (shapes) into the specific combination intake's signals point at, not
new domain knowledge. Closes the gap where the G1 menu names "Shape 1" and
the human has to already know what that means.
```
## SCOPE-BRIEF — <one-line demand summary>

### What this looks like at each size
| Size | docs/ | delivery/ | Typical session count |
|---|---|---|---|
| S | ... | ... | 1 (solo) |
| M | ... | ... | 1–2 |
| L | ... | ... | orchestrator + N squads |
(rows populated from PART C, not re-typed by hand)

### What this looks like at each shape (only the 2-3 shapes the use-case
### signal actually narrowed to — never show all 5)
Shape <N> — <name>: produces <file tree>. Fits when <use-case signal>.
Wrong when <the disqualifying signal — e.g. "you don't yet have a repo to
ground against">.

### Topology (solo / orchestrator+squads / headless)
For the recommended topology: <what sessions open, what each does, in one
line — a preview of SESSIONS.md, not the full table>.

### What this costs you
- Gates you'll be asked to clear: <G1 now, G2/G3 or one PLAN-REVIEW later,
  each with what it will ask>
- Estimated fan-out size: <N research agents / N squads>
- Recommendation: <size, shape, topology> — <why, in one sentence>

### When this is the wrong choice
<the one or two honest disqualifiers for the recommended combination — e.g.
"if this touches a live production system you haven't listed, add the
live-grounding pass before freezing, which adds a phase">
```

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
   parts get modeled. **Model the failure half, not just the happy path**
   (`gate-check adversary` enforces this, D4): a modelled machine must name at
   least one failure state (taxonomy: `…FAILED`, `…ERROR`, `ROLLED_BACK`,
   `ESCALATED`, `PARTIAL_FAILURE`, `ABORTED`, `TIMEOUT`, `REJECTED`, `DENIED`) and
   at least one recovery/compensation transition *out* of a failure state
   (re-verify, resume, retry, rollback, restore). A happy-path-only chain
   (`A → B → C`) is a design smell — either it is genuinely linear (then it needs
   no model, and the gate is N/A), or its failure edges were dropped. This is the
   depth ceiling: shallow contracts here cap the depth of every downstream test,
   no matter how faithfully the tests cover them.
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
6. The build-it runbook (per epic: branch → /build-it → /iterate until green → ship → unblock)
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
0. Pinning (PRD §D4 — machine-checkable resume anchor, always first):
   Repo: <absolute repo path> @ <full 40-hex git SHA>
   State: <absolute repo path>/.plan-it/state.json
   Contract: <path to CONTRACT.md> sha256=<64-hex SHA-256 of CONTRACT.md>
   (if `SESSIONS.md` exists, each session reads only its own row there —
   this file stays the single shared entry point)
1. Re-derive tally + reconcile from disk (the builder's first instruction):
   recompute the board from `.plan-it/state.json` + the CONTRACT case table,
   reconcile against every total claimed below; on mismatch, stop and report
   — never build on a stale board (PRD §D5).
2. What you're building (one line)
3. First concrete slice (Wave 0 epics, parallel/sequential)
4. Where code lives (repo table: path · default branch)
5. Locked decisions (each with rationale)
6. Phase/wave order
7. How to run + test (prerequisites + verifiability precheck)
8. Gotchas (each contract amendment = one trap to avoid)
9. Handoff state (committed / open / decisions owed). Resume is pinned-only:
   a fresh session re-enters through block 0 + state.json, never through
   chat-history archaeology — fuzzy-resume ("continue where we left off",
   re-reading old sessions as the source of truth) is banned.
```

### `STATUS.md` — live board
```
Current wave · Legend (backlog · in-progress · testing · shipped · blocked)
Program totals (N epics · M test cases · K shipped)
| EID | Epic | Squad | Wave | Status | Tests (green/total) | Branch | Disposition |
[REAL]-coverage notes · how an epic moves (state machine)
```
Disposition cell: empty when Status = VERIFIED, else exactly one of
`backlog-with-reason: <path>` · `owner-gated: <owner>` ·
`IMPLEMENTED-NOT-VERIFIED: <case> <target>`. A binding Test Contract case
never moves to `backlog-with-reason` — it stays IMPLEMENTED-NOT-VERIFIED
with its reason attached until re-verified (G-9).

```
## Residuals
| Item | Disposition | Reason / exit criterion | Evidence |
|---|---|---|---|
```
Every row still open at close is disposed one of the three ways above; the
board archives only when every Residuals row carries a disposition, with a
named owner where `owner-gated`.

```
## Log
```
Reverse-chronological, append-only, one dated bullet per event — this is
where the real narrative lives: a retracted finding, a corrected number, a
discrepancy caught between two counts. Tag anything found but not asked for
`[incidental]` — it is never folded silently into the Test Contract tally
and never dropped (R6).

### `DECISIONS.md` — the planning-time decision queue
Modeled on two field precedents (`docs/v4/research/stream-D-precedents.md`
F-D17/F-D18), reconciled onto the existing decision-log tags (§1 of
`formats.md`) rather than inventing a second tag vocabulary.
```
# DECISIONS.md — <project> decision queue

## Ruled
| ID | Decision | Ruling | Effect / where it lands | Ruled by · date |
|---|---|---|---|---|
| D1 | ... | [DECIDED]/[CHANGED] ... | <epic/phase it unblocks> | <owner, date> |

## Open — recommendation attached, nobody should pick for you
| ID | Question | Recommendation | Why nobody should pick for you | Blocks |
|---|---|---|---|---|
| D4 | ... | ... | <the genuinely irreversible/vision-shaping reason> | <epic/phase> |

## Rulings carried forward from a prior run/round (if any)
| Item | Your call | State |
|---|---|---|
(sourced from an earlier DECISIONS.md — every prior item restated with its
current state, never silently dropped)

## Copy-your-rulings block
<a single fenced block the human can paste back numbered answers into, same
mechanic as the G2 "answer by number" convention already in use>
```
Once every Open row is ruled, the answered rows promote into `GATE.md`
(next) as the build-time autonomy contract — DECISIONS.md is the
*planning-time* queue, GATE.md is the *build-time* contract; they share
row content but serve different readers (Fernando during planning vs. the
orchestrator during build).

### `GATE.md` — the autonomy contract (build-time)
Modeled 1:1 on the field precedent (`stream-D-precedents.md` F-D7),
generalized. Every run's exact answer to "did we ask a human everything
this needs before running unattended."
```
# GATE — <project> decisions & authorizations (the autonomy contract)

> Everything the build needs from a human, answered up front. Anything new
> the build surfaces gets appended here — never guessed — and parks only
> the narrowest blocked scope (one epic, not the whole run).

## Answered (owner: <name> · <date>)
| # | Type | Decision / authorization | Answer |
|---|------|---------------------------|--------|
| G-1 | decision | ... | ... |
| G-3 | authorization | ... | ... |
| O-1 | owner-action | ... | ... |

`Type` ∈ `decision` (a choice among designs) · `authorization` (a
permission grant, already decided elsewhere, just needs a yes) ·
`owner-action` (delegable to nobody — only the named owner's own
hands/credentials; also listed in the close-out's owner-actions list).

## Still human, but NOT blocking the run
| # | Item | Owner | When |
|---|------|-------|------|
| 1 | ... | ... | ... |

## Standing rules the orchestrator enforces
- Usage/session-limit resilience: persist state to disk, schedule a
  wakeup chain (≤3600s hops, chained), resume from the state files —
  never park the run waiting on the owner.
- `[REAL]` case unreachable → `IMPLEMENTED-NOT-VERIFIED` with a reason —
  never a fake green, never waking the owner just to report it.
- A new genuinely-human decision discovered mid-run is appended here (not
  guessed) plus the close-out report; take the reversible conservative
  path if one exists, else park only that epic.
```

### `SESSIONS.md` — sessions to open (exact names for `/rename`/`SendMessage`)
Modeled on the field precedent's `00-program-plan.md` §1
(`stream-D-precedents.md` F-D5/F-D6), generalized beyond "squads" to any
topology. `KICKOFF.md` keeps its own single launch prompt unchanged
(the "KICKOFF.md + its single launch prompt STAY" ruling) — this file is
additive, for the N-session case KICKOFF.md was never meant to carry.
```
# SESSIONS.md — <project> sessions to open (exact names for /rename)

| # | Session name | Role | Reads | Opens when |
|---|---|---|---|---|
| 1 | <orchestrator-slug> | Orchestrator: dispatch, verify-on-disk, merge, reap | CONTRACT.md, GATE.md, STATUS.md | First |
| 2 | <squad-slug> | Squad <letter>: <lane, one line> | own PRD + epics only | With #1 (Wave N) |
```

## Launch prompts
One fenced, copy-paste block per session (same mechanic KICKOFF.md uses
for its single prompt, one block per row here instead of one block total).
Fences never nest — each prompt is its own top-level fenced block.

### 1 · `<orchestrator-slug>` (opens First)
```
Command + package path: coordinate <program> from <CONTRACT path> +
<PRD/epics index>.
Law: <CONTRACT.md path> v<version> — never edit directly; contradictions
fold in as a dated amendment.
Lane: delivery/<program>/STATUS.md, CONTRACT.md amendments, root mirrors,
merges — never a squad's owned files.
Branch pattern: none (coordinates, does not build).
DoD: every squad's Test Contract at 100%, mirrors clean, board archived.
Register handshake: confirm registered and standing by before dispatching
any squad.
Gotcha: verify each squad's output on disk before advancing STATUS — idle
≠ delivered.
Worktrees: every session works in its own git worktree, never the shared
checkout (G-10).
Poll each squad's registration and wave readiness — never end a turn
waiting for a notification; a headless session dies silently if it does.
```

### 2 · `<squad-slug>` (opens With #1, Wave N)
```
Command + package path: /build-it <squad-id> of <program>. Your package:
<prd path> + <epics path> (<N epics>, <M binding cases>).
Law: <CONTRACT.md path> v<version> (never edit — contradictions go to
<orchestrator-slug> via SendMessage).
Lane: <repos/files this session owns> — negatively scoped where another
squad shares the same repo (`EXCEPT <files>, <other squad> owns those`).
Branch pattern: epic/<prefix>-*
DoD: 100% of its Test Contract.
Register handshake: SendMessage "<orchestrator-slug>": "<squad> ready",
then poll for its wave signal.
Gotcha: <one concrete, specific trap — never generic advice>.
Worktrees: every session works in its own git worktree, never the shared
checkout (G-10).
```

## Orchestrator runbook
See `playbooks.md` §G for the full runbook (dispatch → verify on disk →
merge per lane → usage-limit resilience → domain boundary → worktrees-only
→ reap → incidental channel) — this file only records session identity,
not the runbook mechanics.

### `PLAN-REVIEW.md` — gate G4, the single review-and-contradict round
Autonomous-draft mode only: recommended answers were already applied and
marked `[default — contradict if wrong]` inline through the package; this
file is the one-screen summary plus the copy-paste contradiction mechanic.
```
# PLAN-REVIEW.md — <project> gate G4

> Defaults were applied and marked inline. Read this, contradict anything
> wrong by ID, or answer nothing and the run proceeds as drafted.

## Defaults applied (contradict any that are wrong)
| ID | Question | Default applied | Rationale |
|---|---|---|---|
| R1 | ... | ... | ... |
| Rn | ... | ... | ... |

## Package tree
<the full file tree about to freeze — CONTRACT.md, PRDs, epics, GATE.md,
SESSIONS.md, GLOSSARY.md — the whole shape in one place before ratifying>

## States if you answer nothing
Every default above stands as applied, the CONTRACT ratifies from
`-draft` to its frozen version, and the run proceeds straight to
parallel planning — reviewing this file is optional, not required, in
autonomous-draft mode.

## Copy-your-rulings block
<a single fenced block: paste back `R3: contradicted — <why>` for any
default to override; anything not mentioned stands as applied>
```

### `GLOSSARY.md` — static vocabulary + this run's minted IDs
The static half ships seeded in this file (below) and is copied into every
package at `intake`, before `scopeBrief` renders, so the first human-facing
surface never shows "not generated yet." The minted half is appended as the
run creates new per-run IDs (governance rules, epic IDs, wave numbers).
```
# GLOSSARY.md — <project>

## plan-it vocabulary (static — same every run)
| Term | Meaning | Defined in |
|---|---|---|
| PRD | Product Requirements Document | templates.md PART B |
| CDP | Chrome DevTools Protocol (drives the UI half of a use-case) | formats.md §4a |
| ATDD/BDD | Acceptance Test-Driven / Behavior-Driven Development | formats.md — Test Contract |
| DoD | Definition of Done | SKILL.md Phase 1 |
| xhigh | Claude Code's highest `/effort` reasoning-level setting | SKILL.md — Autonomy posture |
| D4 | the adversarial-depth ruling behind `gate-check adversary`'s five cascade classes | templates.md PART B |
| G0–G4 | the five run gates: G0 anamnesis · G1 scope · G2 decisions · G3 freeze · G4 plan review | machine.md §1 |
| `[REAL]` | a test case needing a live target; never VERIFIED on a mock | formats.md — Test Contract |
| INV | shorthand for `IMPLEMENTED-NOT-VERIFIED` — code exists, the proving case couldn't run | formats.md §7 |
| S/M/L | the three run sizes (feature / subsystem / program) | templates.md PART C |
| Shape 1–5 | the five packaging shapes (multi-doc / single-file / research-locked / numbered-PRD / debt-catalog) | templates.md PART D |
| solo · orchestrator+squads · headless | the three topology values | CONTRACT §1 |

## This run's invented IDs (generated — appended as the run creates them)
| ID | Expansion | Where minted |
|---|---|---|
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

**Adversarial-depth profile (D4 — enforced by `gate-check adversary`).** Case
count is a floor, not depth. When an epic builds a workflow the CONTRACT models
as a state machine, the Test Contract must go *past* the happy path and cover the
five **cascade classes**. Each class is **covered-or-waived** — a case asserts it,
or one line explicitly waives it with a reason. Silent absence fails the gate closed.

| Cascade class | The case proves… | Waiver grammar (when genuinely N/A) |
|---|---|---|
| **partial-failure** | a multi-target op where *some* succeed and some fail — the run lands in a partial state, not all-or-nothing | `partial-failure: N/A — <why single-target/atomic>` |
| **rollback/compensation** | a failed op is *undone* — prior state restored, not left half-applied | `rollback/compensation: N/A — <why forward-only>` |
| **failed-recovery→escalation** | recovery *itself* fails (the rollback also fails) → an ESCALATED / dead-letter terminal, not an infinite loop | `failed-recovery→escalation: N/A — <why>` |
| **recovery/resume** | a failed run is *re-driven* — operator fixes + re-verify, `--resume`, retry, re-dispatch — and reaches success | `recovery/resume: N/A — <why>` |
| **adversarial-verify** | verification *re-reads the world*, it doesn't trust its own write — tamper the target between write and verify, or round-trip the parser over its own output | `adversarial-verify: N/A — <why>` |

Waivers follow v2's CB-1 pattern — *"no test case waived silently: this line IS
the waiver."* A waiver line names the class and carries a reason (`— …` / `: …`);
put it in the epic near the Test Contract, or in `delivery/decisions.md`.

**Depth exemplar (the rotation-engine crown jewel).** The bar to beat: a rotation
lifecycle epic whose Test Contract carried, beyond the happy `SCHEDULED → … →
COMPLETE` path — `T-*-06` **PARTIAL_FAILURE** (some bindings PASSED, some FAILED);
`T-*-07` **ROLLED_BACK** (retry budget exhausted → previous version restored to
ACTIVE); `T-*-08` **recovery** (operator fixes the binding → re-verify →
COMPLETE); `T-*-09` **escalation** (the rollback *also* fails → ESCALATED, human
resolves); and adapter-level `T-*-02` **adversarial-verify** (the target file is
externally overwritten between Dispatch and Verify → FAILED, proving Verify
re-reads rather than trusting its own write). Five classes, five real cases — that
is depth the gate can see. A machine that models only `PENDING → VERIFIED →
REVOKED (+ one FAILED)` cannot reach it, however completely its cases cover it.

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
