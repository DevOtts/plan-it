# plan-it — playbooks (discovery modes, brownfield, scale-out, executable handoff)

Advanced moves, each proven in real sessions. Pull the one that fits the use-case
detected at intake. Compose with the formats in `formats.md` and the packaging
shapes in `templates.md`.

---

## A. Discovery modes (Phase 4) — pick by use-case

Discovery is never one-size. Choose the mode, then apply the shared mechanics below.

| Mode | When | Shape |
|------|------|-------|
| **Solo read** | small feature, one subsystem | main thread reads + greps; no fan-out |
| **Parallel research streams** | research-heavy, unknown landscape | N agents, one *concern* each (vendor A, vendor B, evals, benchmarks, codemap), each writes a cited `research/stream-<X>.md`; orchestrator synthesizes |
| **Team-of-N codebase slices** | large existing codebase to map | N agents, one *non-overlapping slice* each, with explicit teammate-boundary notes ("X is the teammate's territory; I only document the entrypoint") |
| **Verify-then-extend** | brownfield refactor / debt | extract claimed gaps from a prior doc → agents confirm/refute each **with file:line** → sweep for NEW issues → record non-bugs (see §B) |
| **Pre-grounding chokepoint** | before any fan-out, always | read the real source of truth first; find the single chokepoint; write a grounding statement so agents don't "work blind" |

**Shared mechanics (apply to every fan-out):**
1. **Pre-ground first** — locate exact paths/the chokepoint before spawning. The
   observability run collapsed its whole design once it found "`anm_llm` is the
   single LLM chokepoint."
2. **Shared-context contract** — write `research/SHARED-CONTEXT.md` (or
   `_research/00-context.md`): the one file every agent reads before working. This
   is Guardrail 1 applied to research.
3. **Fixed report skeleton** per agent so outputs merge.
4. **Stage findings to disk immediately** — each agent writes
   `_research/NN-<slice>.md` as it finishes, "so nothing is lost if context gets
   summarized mid-synthesis."
5. **Pull idle teammates — idle ≠ delivered.** A team going idle does NOT mean it
   wrote files or returned a report. After fan-out, verify each output exists;
   `SendMessage` any silent agent ("your turn ended idle but I never received your
   report — send it now / Write it to <path>"); **re-dispatch any team that did 0
   work.** (Tell each agent up front: "you MUST run the tools and return findings;
   do not stop early.")
6. **Adversarial reconciliation** — when two agents contradict, resolve it
   explicitly in synthesis ("Stream A is right that X is self-hostable; Stream C's
   SaaS-only claim is wrong — fixing in synthesis"). Don't average; adjudicate.
7. **Independently verify the centerpiece** — read the single most important
   artifact yourself to cross-check the team rather than trust it blind.

---

## B. Brownfield / refactor planning (Shape 5)

For refactor-in-place, migration, or debt remediation. The core discipline:
**don't trust the design doc — verify every claimed gap against live code.**

**Verdict tables** (the keep/demote/discard/build inventory):
```
| Component | What it does | Verdict (BACKBONE / TOOL / NEITHER) | Why |
```
Then bucket into **RENAME / DEPRECATE / PRESERVE / BUILD**, each item with a
migration note.

**Deprecation blast-radius table** — enumerate every dependent before touching:
```
| # | Dependent | Where (file:line) | What | Rename vs Preserve |
```

**Naming-collision table → fix naming first** (the refactor's Phase 0):
```
| Dimension | Old thing | New thing |
| entity    | Agent     | AutomationTemplate |
```

**The load-bearing heuristic:** classify each change as **schema-edit vs
data-migration** before sequencing. ("Because the old Agent is copied into every
Org doc and referenced by live webhooks, the rename is a *data migration, not a
refactor* — stage behind the existing impact report, migrate embeds + webhook refs
+ junction rows, *then* introduce the new concept.")

**Workstream micro-template** (the reusable unit; PRD is a catalog of these):
```
## Workstream X — <title>  ⭐ HIGH|MED|LOW
**The gap (verified REAL).** <prose + exact file:line evidence, quoted code>
**The fix.** 1. … 2. … 3.  (names the existing pattern to reuse)
**Acceptance.** <observable test>
**Effort:** Low|Med   **Risk:** Low|Med — <why; gate behind FEATURE_* flag if hot path>
```

**Anti-re-chase section** — always include so nobody re-investigates a non-bug:
```
## Investigated & Found Correct (No Action)
- The suspected "heartbeat = WS keepalive" gap is already correct — see ws.ts:88.
```

**Sequencing default for debt:** correctness/data-integrity → UX hot path →
maintainability → hygiene. Table: `| Phase | Workstreams | Theme | Rationale |`.

**Capture load-bearing algorithms as pseudocode**, not prose ("to replicate in
<lang>, implement exactly this"): interface (required + optional methods), registry
rules, column-level DDL, plus a "things that surprised me" list per slice.

---

## C. Scale-out spec authoring (many PRDs in parallel)

When a program needs many PRDs (multi-app platform), don't write them serially and
don't use fixed squads — use the **parallel-batch generator** (a contract applied
to *spec authoring*):

1. **`features.json`** is the work-breakdown + parallelization map — one row per PRD:
   ```json
   { "id": "PRD-03", "name": "...", "status": "todo", "priority": "P0",
     "output": "docs/prds/PRD-03-x.md", "has_ui": true,
     "ui_pages": ["..."], "agents_covered": ["..."], "test": "<criterion>" }
   ```
2. **Spawn subagents in review-gated batches** — `Batch 1 (spawn simultaneously)`,
   `Batch 2 (after Batch 1 review)`, … Each subagent gets a self-contained prompt:
   which reference docs + sections to read, what the PRD must cover, exact save path.
3. **Inject coherence into every subagent** — append the same `## PRD Template` +
   `## Glossary` (+ shared example data, e.g. "Apex Roofing Co. $25K/mo") to every
   prompt, so independently-written PRDs stay consistent.
4. **Post-generation consistency check** — one agent verifies cross-PRD coherence:
   event producers ↔ consumers match, shared data schema identical, integration
   slugs identical, terms defined the same. This is the CONTRACT's job done as a
   lint pass after fan-out.

PRD numbering: `PRD-NN-<slug>` where **NN = dependency/build order** (PRD-01 data
model → PRD-NN product). PRD ≈ one epic. Ship in batches (BATCH-1 = PRD-01/02/05).

Per-run agile artifacts (write under `.taskstate/<prd>/` or `delivery/`):
- **`breakdown.md`** — epics → stories → tasks (each task tagged with owning repo)
  + a **DoD map table** mapping every criterion to a target verification state
  (`✅ in slice` / `✗ Phase N` / out of slice) + an explicit **STOP gate** ending
  the vertical slice.
- **`decisions.md`** — the Shared Decision Contract: branch/worktree map table, the
  one canonical data shape ("byte-identical producer→passthrough→consumer"),
  non-negotiables-as-enforced-in-code, "key source facts verified on <date>", and
  an up-front **Verification ceiling** (what *can* be VERIFIED vs
  IMPLEMENTED-NOT-VERIFIED in this environment).

---

## D. Executable agile-split (optional output mode: live board)

Instead of (or alongside) `epics/*.md`, emit the breakdown straight onto a GitHub
Projects v2 board so plan and tracker never drift. Use a thin helper (`ghp.sh`)
that wraps the fiddly GraphQL behind clean verbs — skills call the helper, never
raw GraphQL.

**Mapping model:**
- **Epic = parent Issue**, label `epic`, PRD link in body.
- **Tasks = native sub-issues** (`addSubIssue`), typed `Task/Bug/Feature`.
- **Findings/knowledge = issue comments** (append-only audit trail).
- **Status single-select:** `Backlog → Ready → In Progress → In Review → Blocked → Done`.
- **GitHub is source of truth; local `tracker.md` is a cache carrying issue numbers.**

**Generation commands** (reusable verbatim):
```bash
.claude/scripts/ghp.sh epic-create --title "<epic goal>" --prd "<PRD path/url>" \
  --body "<2-4 sentence summary + success criteria>"
.claude/scripts/ghp.sh task-create --epic <epic#> --type <task|bug|feature> \
  --title "<task title>" --body "<what + acceptance; 'Depends on #N'>"
```
`ghp.sh` verbs: `init` (cache project/field/option IDs), `epic-create`,
`task-create`, `set-status`, `comment`, `ready-tasks`, `new-since <ts>`,
`link-pr`, `ingest` (pull untracked issues onto the board), `board`.

**Three-skill PM lifecycle** (if the user wants ongoing operation, not a one-shot):
`prd-to-epic` (decompose → board, then STOP) · `task-sync` (status + findings,
two-way reconcile) · `task-pickup` (Ready → plan → work → PR → In Review). Plus a
scheduled **triage-and-propose** routine (`ingest` → classify each new Backlog
item → post a `🤖 Triage:` plan comment → set Ready/Blocked → never writes code;
idempotent: skip items that already have a `🤖 Triage:` comment).

---

## E. Handoff artifacts (Phase 10 enrichments)

Beyond `KICKOFF.md` + the next-session prompt:
- **`README.md` consolidation hub** — a reading-order table + "decisions in one
  screen" + GATING items (build-ready vs governance-blocked phases).
- **`KICKOFFS.md`** — archive the exact launch prompt used for *each* PRD/phase
  (institutionalizes `/next-session-prompt` as provenance).
- **`-CONCLUDE` phase** — split a large PRD into an initial **slice** + a later
  `-CONCLUDE` run that closes the honest-gate (IMPLEMENTED-NOT-VERIFIED) items the
  slice deferred.
- **`AS-BUILT.md`** — post-build truth doc; and the reverse-doc mode: run
  `/understand` on a finished build then emit `technical-overview.md` (a `plan-it`
  sibling mode for documenting/auditing an already-built system).

---

## F. Pre-handoff consistency gate (run before Phase 10 hands off)

Every item below was a REAL defect a dry-run package shipped — each would have
blocked an unattended `/fable-it` build. Run this lint over the whole package;
treat failures as blocking; fix and re-lint until clean. Cheap to run, and it's the
difference between "looks complete" and "builds unattended."

1. **Counts add up — by counting tags, never by hand.** total cases == header count
   == Σ per-epic; `[REAL]` + non-REAL == total; type/`[stress]` subtotals == actual
   tag counts. (A hand-typed "8 [REAL]" hid the real 9 and leaked into the launch
   prompt, telling the builder to under-handle one real case.)
2. **Coverage is total.** every goal (G*) and every governance/invariant (CB*/G-)
   maps to ≥1 case OR an explicitly-reviewed waiver; every epic has ≥1 case.
3. **Verb/API-surface reconciliation.** {verbs/endpoints marked "keep" in the
   promotion map} ∪ {verbs named in any test} ⊆ {the frozen CONTRACT surface}. Any
   "N verbs" assertion == the interface length. (`comment`/`new-since`/`ingest` fell
   through this gap — tested or "kept" yet absent from the contract.)
4. **Grammar round-trip.** if the tool parses its OWN artifacts (an epics file,
   config, DSL), run the stated parse grammar over the generated sample and assert
   the counts match. (A `###`-vs-`##` heading-level mismatch silently killed the
   load-bearing acceptance test.)
5. **Source-of-truth per read.** every diff/sync verb declares which side it reads
   **live vs cached** — that single fact decides the `[REAL]` tag. An undeclared
   "diff A vs B" hides whether its tests need a live target.
6. **Inverse-op coverage.** for every "never X" invariant on a mutating tool there
   IS a test exercising the path that could violate it (e.g. "never delete" on an
   upsert → shrink the input, re-apply, assert the orphan survives). Every
   under-specified inverse op (what happens when the plan shrinks? on conflict?)
   becomes a locked decision, not silence.
7. **Cross-file coherence.** IDs (epics/tasks/UCs), the dependency graph, and
   per-epic test-types are identical across PRD / EPICS / TEST-CONTRACT / KICKOFF /
   README.
8. **Token lint.** no digits embedded in words (`[a-z]\d+[a-z]`, e.g.
   "unpar13seable"), no leftover placeholders (`<…>`, `TODO`, `TBD`) inside a FROZEN
   contract.
9. **Flags match invariants.** if a CB rule says "all mutating verbs honor
   `--dry-run`", every mutating verb's signature in the CONTRACT shows `[--dry-run]`.
10. **Every confusing workflow has a model.** every workflow flagged in discovery
   as multi-step / approval-gated / agentic / concurrent appears in the CONTRACT's
   "Core-logic models" section, and every epic building one references its model.
   A confusing workflow shipped model-less is prose control flow handed to the
   builder — the exact failure v2's deterministic core exists to kill.

> **Mechanizable half:** items 1 (counts), 4 (grammar), 7 (IDs), and 8 (tokens)
> are enforced by `node scripts/gate-check.mjs handoff <delivery-dir>` — run it
> first; the `LINT_CLEAN` machine transition is guarded by its exit code. Items
> 2, 3, 5, 6, 9, 10 need judgment: they stay yours.

---
_Authored by [DevOtts](https://github.com/DevOtts)._
