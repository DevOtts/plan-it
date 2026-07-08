---
name: plan-it
description: >-
  Turn a fuzzy idea, brain-dump, or transcription into a COMPLETE spec set + agile
  delivery package, ready to hand to /fable-it. The front-end to /fable-it: plan-it
  plans it, fable-it builds it. Runs a ~10-phase discovery → spec → agile-split
  pipeline — pre-grounds the codebase, fans out parallel Claude teams (xhigh) to
  research independent subsystems, authors the design docs in dependency order,
  pauses at ONE batched human-decision gate, then freezes a shared CONTRACT and
  fans out squad teams to write PRDs + epics against it — each epic ending in a
  BINDING Test Contract (up to ~20 type-selected use-cases/scenarios the build must
  pass 100% before "done", per Specification by Example / Eval-Driven Development).
  Auto-sizes from a single feature (1 design note + 1 PRD + 1 epic set) to a from-scratch
  program (full 7-doc set + 4 squads + waves). Use when the user says "/plan-it",
  "plan this", "plan-it this", "spec this out", "turn this into a delivery package",
  "create the PRDs/epics", "do discovery and planning", "scope this project/feature",
  "act like a PM and break this down", or pastes a vision/transcription and expects
  a buildable plan. Built for BOTH humans AND
  conductor agents: a conductor that
  receives a new demand runs /plan-it to produce the package before dispatching
  workers. The inverse of /fable-it (which builds) and predecessor to
  /next-session-prompt (which hands off the finished plan). v2 adds a
  deterministic core: the pipeline is an explicit statechart (machine.json), every
  run persists its position in .plan-it/state.json (crash/compaction-resumable),
  and guarded transitions run executable checks (scripts/gate-check.mjs) whose
  exit code — not prose discipline — decides whether the pipeline advances.
author: DevOtts
author_url: https://github.com/DevOtts
version: 3.1.0
license: MIT
homepage: https://github.com/DevOtts/plan-it
repository: https://github.com/DevOtts/plan-it
metadata:
  platforms: [claude-code, cursor, codex, copilot]
  category: "Planning & Specs"
keywords: [planning, discovery, specs, prd, epics, test-contract, agile, definition-of-done, claude-code]
---

# plan-it

**Take a fuzzy demand → ship a buildable delivery package.** This is the planning
conductor: the disciplined front-half of the lifecycle that ends exactly where
`/fable-it` begins. It does *discovery* (research the ground truth), *spec*
(author the design docs), and *agile split* (PRDs, epics, tests, the shared
contract) — then hands off.

```
  /plan-it  ─────────────►  docs/ + delivery/  ─────────────►  /fable-it
  (discovery → spec → plan)   (the buildable package)            (builds it)
```

Usable by a human directly, and by any orchestrating **conductor** agent that receives a new
demand and must turn it into a delivery package before dispatching workers.

---

## The five non-negotiable rules (enforce these — don't just suggest them)

These are the load-bearing rules reverse-engineered from every successful run.
If you violate one, the build downstream drifts or silently fails.

1. **Freeze a shared CONTRACT before any parallel planning.** The CONTRACT is the
   law: canonical entities, schema, API/interface, enums, repo/branch map, and the
   definition of "shipped." Squads write *to* it; any cross-cutting discovery folds
   *back* into it as a dated amendment (v1.0 → v1.1 …). No frozen contract → no
   parallel squads.

2. **Batch every human-only decision into ONE gate.** Do not pre-decide anything
   irreversible (repo topology, hosting, product name, architectural mode, build-vs-buy).
   Surface them together, each with a *recommendation attached*, and let the human
   answer numbered. This gate is where the human injects **vision**, not just picks
   options — leave room for them to add a concept you didn't propose. Lock each
   answer with **owner + date**.

3. **Verify every agent's output on disk — "idle ≠ delivered."** A team going idle
   does NOT mean it wrote files. After any fan-out, check the actual paths exist and
   are non-empty before proceeding. If a team held its output as a message, direct
   it to `Write` to the exact absolute path. Never trust a "done."

4. **Ground the plan against the LIVE system, not the repo — before you freeze.**
   For any plan touching a running system, the repo is a *hypothesis*; the deployed
   reality is the truth, and they drift. Before freezing the CONTRACT, verify against
   the actual system and write the *observations* in (not repo-derived guesses).
   Battle-tested: in one program EVERY mid-flight correction traced to a repo-inferred
   assumption reality contradicted — wrong canonical identifiers (manifests had drifted
   from the deployed catalog), a config value that was present-but-pointing-at-a-dead-host,
   "to-be-built" components that were already deployed, and a found credential that was
   the *wrong* one. See Phase 3's live-grounding gate for the concrete checks.

5. **Run the machine, not the prose.** The pipeline's control flow lives in
   `machine.json` (the explicit statechart), not in this document — this prose
   *explains* the machine. On invocation, read or initialize `.plan-it/state.json`
   (in the target project) and resume from its `state`; write it on **every**
   transition. At every guarded transition, run the guard's mapped subcommand
   (`node scripts/gate-check.mjs <check> …`) and **never advance on a non-zero
   exit** — fix, re-run, then transition. If Node is unavailable, perform the same
   checks manually and record them in the state file (degrade, never break). Full
   protocol: `references/machine.md`.

---

## The deterministic core (v2) — why a machine

Control flow written as prose ("do step 1, never skip the gate") is what the
determinism literature calls **prose control flow**: it relies on the model's
discipline across a long, summarization-prone context, and sometimes the model
won't follow it. v2 inverts that at the right altitude — *non-determinism at the
edges, determinism at the core*:

- **`machine.json`** — XState v5-compatible statechart of the pipeline: 15 states,
  the three human gates (`meta.gate` + `meta.human`), guarded transitions, and an
  `AMENDMENT` self-loop on `parallelPlanning`. Paste into stately.ai/viz to see it.
- **`.plan-it/state.json`** — the persisted run: current state, gate approvals
  (owner + date), contract version, verified-artifact registry, history. This is
  what makes a run survive a crash or a fresh session.
- **`scripts/gate-check.mjs`** — the guards as exit codes: `verify` (Rule 3,
  idle ≠ delivered), `freeze` (Rule 1, no contract → no squads), `handoff` (the
  mechanizable half of playbooks §F), `state` (Rule 2, gates recorded).

The fuzzy phases — discovery, synthesis, spec authoring, judgment — stay
LLM-at-the-node (tagged `llmAtTheNode` in the machine). Do not formalize them;
modeling is not ceremony only when it replaces confusion. Details, state-file
schema, and the resume protocol: `references/machine.md`.

**Hard enforcement (v2.1, plugin installs on Claude Code only):** a `PreToolUse`
hook (`scripts/hooks/planit-guard.mjs`) *denies* Write/Edit calls on PRD/epic
deliverables while the run's contract is unfrozen — Rule 1 stops being an
instruction and becomes something the harness refuses. Fail-open: it never
touches non-plan-it work. Skill-only installs rely on Rule 5 discipline instead.

---

## The Test Contract — the quality differentiator (make this non-negotiable)

The single thing that most raises delivered code quality: **every PRD/epic ends by
generating its own test contract — up to ~20 concrete use-cases/scenarios that
stress the implementation — and the feature is NOT "done" until 100% of them pass.**
The build agent cannot just deliver the feature; it must satisfy the contract, and
`/iterate` until green.

This is a named, proven discipline: **Specification by Example** (Gojko Adzic) +
**ATDD/BDD** for code (concrete examples become executable acceptance tests and
living documentation), and **Eval-Driven Development** for skills/LLM features
(register goldens with expected outputs, iterate until they pass). Authoring the
cases *at planning time* is the whole point — they become a binding contract, not
an afterthought.

Rules of the Test Contract:
1. **Authored at planning time** — the LAST step of writing each epic/PRD is its
   test contract. Expected outputs are **registered now** ("designed first; expected
   outputs registered"), not discovered mid-build.
2. **Up to ~20 high-quality cases** per feature — enough to stress real behavior +
   edges; *not* thousands of shallow ones (quality > quantity — auto-bulk = "slop",
   per the eval literature). Draw cases from real/likely failure modes.
   **Per-shape count rule:** large Shape-1 multi-squad programs hold a **≥10
   cases-per-epic floor** (each epic is a big feature); small shapes (single
   skill/feature, S/M) author **~20 cases total across the package** (a handful per
   epic). Never both at once — pick by shape so a reviewer doesn't flag a correct
   small package as under-tested.
3. **Binding** — DoD = **100% of the contract passes**; until then, `/iterate`. No
   partial ship; no VERIFIED-on-a-mock (a `[REAL]` case whose target is unreachable
   → IMPLEMENTED-NOT-VERIFIED, never a fake green).
4. **Pick the test types by implementation** (one or more of unit / e2e / use-cases
   / stress):

| Implementation | Test types | How |
|----|----|----|
| CRUD / REST API | use-cases (happy+edge) + e2e | run every scenario **via API** *and* **via UI with Chrome CDP** (`chrome-cdp-control`); unit-test the logic |
| Skill / prompt / LLM function | use-cases w/ **expected output** | run it, **compare real vs expected** — exact match for closed outputs, rubric / LLM-as-judge for open ones (`make-eval`, promptfoo, DeepEval G-Eval) |
| Agent / stateful / multi-step | **stress** scenarios + use-cases | six axes: async, fan-out, escalation, human-gate, recursion, cycle-guard (Setup/Expected/Pass) |
| Pure logic / library | unit + **property-based** | enumerated cases + invariants |
| Data pipeline / migration | golden-value + e2e | hand-computed expected values; idempotency/rollback |
| Anything with load/abuse surface | **stress / adversarial** | concurrency, rate, malformed input, red-team |

5. **Execution path:** `/full-qa` runs the contract, `/iterate` loops it to 100%,
   `chrome-cdp-control` drives UI scenarios. **The contract is the bridge from
   plan-it → fable-it: `/fable-it`'s Definition of Done = this contract.**

Grammars and the contract header format: `references/formats.md` (the Test Contract
block + §4–5).

---

## Autonomy posture (guided with autonomous bursts)

Run research and authoring autonomously at high effort, but **stop at three gates**:

| Gate | When | What you ask |
|------|------|--------------|
| **G1 — Scope** | after intake (Phase 2) | confirm the sizing (feature vs program) + the numbered DoD before burning effort |
| **G2 — Decisions** | after specs drafted (Phase 7) | the batched "decisions only you can make," each with a recommendation |
| **G3 — Delivery** | before the agile split (Phase 8) | "specs look aligned — proceed to PRDs/epics?" |

Everything between gates runs unattended. Recommend `/effort xhigh` at the start
(you cannot set it yourself — tell the user to run `/effort xhigh` if they haven't).

---

## Phase 0 — Intake

**Machine first (Rule 5):** if `.plan-it/state.json` exists in the target project,
run `node scripts/gate-check.mjs state .plan-it/state.json` and **resume from the
printed state** — do not restart phases already in `history`. If it doesn't exist,
create it now in state `intake` (schema in `references/machine.md`) and keep it
updated on every transition for the rest of the run.

Accept the demand in whatever form it arrives: a brain-dump, a pasted
transcription, a list of wants, or a one-liner. **Expect pointers, not content** —
session names (`/read-chat "<name>"`), repo paths, doc folders. Your job is to go
fetch the ground truth, not to be handed it.

Capture up front:
- **The raw vision** in the user's own words (you'll quote it back in `02 §1`).
- **Pointers** to prior sessions / repos / docs to research.
- **Use-case** (auto-detect — this drives the packaging shape at Gate G1):
  - new single app, greenfield · feature on a large existing repo ·
    from-scratch multi-subsystem program · multi-app platform (many PRDs) ·
    refactor / migration / debt · research spike (no build yet) · PM/board
    automation · document/audit an already-built system.
- **Research method**: default to parallel Claude teams at xhigh.

If the demand is genuinely one fuzzy paragraph with no pointers and an existing
repo, that's fine — pre-grounding (Phase 3) will find the targets.

---

## Phase 1 — DoD lock

Restructure the fuzzy prose into a **numbered, individually-verifiable Definition
of Done** + a short list of stated assumptions. This is your contract with the
user for the planning job itself. Example shape:

```
DoD for this planning run:
  1. Ground-truth findings doc (every claim → path:line or table)
  2. Vision + architecture doc that solves each finding/contradiction
  3. Data/interface contract
  4. … (auto-sized — see Phase 2)
  N. Handoff: contract frozen, PRDs+epics with ≥10 tests each, kickoff prompt
Assumptions: <list>
```

---

## Phase 2 — Scope & shape governor  ⏸ GATE G1

Pick **size** (how much) *and* **shape** (what form) before spending effort.
Confirm both with the user.

**Size** scales the artifact count:

| Signal | Size |
|--------|------|
| Single feature, 1 subsystem | **S** |
| Multi-feature / new subsystem, 1–2 repos | **M** |
| From-scratch program / many subsystems | **L** |

**Shape** is chosen by use-case (full definitions + the use-case→shape table in
`references/templates.md` PART D):

1. **Multi-doc + `delivery/`** (baseline) — from-scratch program, parallel squads.
2. **Single-file PRD-as-everything** — greenfield single app; CONTRACT inlined as G-rules.
3. **Research → locked-architecture → master+phase PRDs** — feature on a large existing repo.
4. **`implementation/<name>/` with numbered PRD-NN** — multi-app platform, many PRDs.
5. **Refactor/debt workstream catalog** — brownfield in-place.
   (+ research-spike, executable-board, and reverse-doc modes — see PART D.)

Same phases regardless — only the artifact count and form change. **Don't give a
feature a 4-squad org; don't give a brownfield refactor a greenfield vision doc.**
Present the chosen size + shape + the numbered DoD and get a yes before proceeding.
On yes, record `G1 = {approved, owner, date}` plus the chosen size/shape in
`.plan-it/state.json` — the `G1_APPROVED` transition is guarded by `gateRecorded`.

---

## Phase 3 — Pre-ground

Before any fan-out, locate exact targets so agents get precise paths, not vague
instructions:
- Resolve pointer sessions with a session-reading skill (`/read-chat` or similar)
  if one is installed; otherwise ask for the relevant transcript or summary.
- `ls`/`grep` the named repos; find the `docs/`, schema files, entry points.
- Read the wiki hot-cache/index if the repo is vault-wired (per its `CLAUDE.md`).

Output: a list of `{subsystem → exact paths to read}` that seeds the research teams.

### Live-grounding gate (rule 4) — when the plan touches a RUNNING system

The repo tells you what *should* be true; the live system tells you what *is*. Do this
before Phase 8 freeze, and write the findings into the CONTRACT as observed facts:

- **Config reachability, not presence.** For every env/config lever the plan depends on
  (base URLs, API hosts, feature flags), *hit it* — don't just confirm it's set. A value
  can be set to a dead host and pass a "does it exist" check while silently breaking prod.
- **Live registry / canonical identifiers.** Dump the actual slugs / IDs / enum values the
  running system uses (integration slugs, catalog rows, schema). Repo manifests drift from
  the deployed catalog — bind the CONTRACT's canon to the LIVE value, not the manifest.
- **Deployed vs installed vs in-use.** Inventory what's already running, what's registered,
  and what's actually used by a tenant/user. "Build & deploy X" is often "redeploy X," and
  a component that's deployed-but-uninstalled cannot be live-verified per-item — which
  changes both verification depth and priority. Tag each target.
- **Credential validity, not existence.** A found key/token ≠ a correct one. If a plan
  relies on a credential, verify it actually works (a live call), and confirm ownership —
  a leftover token from another account will pass structural checks and fail at runtime.
- **Derive dependency sets from ACTUAL usage, cross-checked live.** Build the integration/
  dependency list from `code-grep ∪ every component's declared requirements`, intersected
  with the live registry — then list the *gaps* as explicit work. A list derived from a
  subset or from repo manifests will miss things the running system actually needs.
- **Separate "our code change" from "external connection/config/data seeding."** The code
  change is usually the easy, ownable part; the real blocker is often an external OAuth
  connection, a seeded secret VALUE, or an ops action — and it belongs on the critical path
  with an owner, not buried as a footnote.

Two build-time corollaries worth encoding in the CONTRACT/epics so the builder inherits them:
map a caller/consumer surface **before** planning any auth-guard or interface change (a
guard that breaks N callers is worse than no guard); and any repo *import* must be a
full-tree secret-scan + runtime-only subset, never a history mirror.

---

## Phase 4 — Discovery (autonomous burst)

Pick a **discovery mode** by use-case (full playbook in `references/playbooks.md` §A):
- **Solo read** — small feature, one subsystem.
- **Parallel research streams** — research-heavy: N agents, one *concern* each, each
  writes a cited `research/stream-<X>.md`.
- **Team-of-N codebase slices** — large codebase: N agents, one *non-overlapping
  slice* each, with explicit teammate-boundary notes.
- **Verify-then-extend** — brownfield/refactor: confirm every claimed gap against
  live code **with file:line** before it enters the spec, then sweep for new issues
  (see playbooks §B).

Shared mechanics for any fan-out:
- **Pre-ground first** — find the chokepoint/exact paths so agents don't work blind.
- **Shared-context contract** — write `research/SHARED-CONTEXT.md`, the one file
  every agent reads before working (Guardrail 1 for research).
- **Fixed report skeleton** + **skeptic posture** ("be criterious, cite path:line").
- **Stage findings to disk immediately** (`_research/NN-<slice>.md`) so nothing is
  lost to summarization.
- **Tell each agent: "you MUST run the tools and return findings; do not stop early."**
- **Apply Rule 3 — pull idle teammates.** After fan-out, run
  `node scripts/gate-check.mjs verify <every expected output path>` — the
  `FANOUT_COMPLETE` transition is guarded by it. On failure, `SendMessage` any
  silent agent to deliver; **re-dispatch any team that did 0 work** (this happens —
  caught and recovered live during the skill's own build-out). Record each passing
  artifact in `.plan-it/state.json` → `artifacts`.
- **Adversarial reconciliation** — when agents contradict, adjudicate in synthesis;
  don't average.
- **Independently verify the centerpiece** yourself rather than trust the team blind.

Use the `Agent` tool (`Explore`/`general-purpose`), or `/fable-it`'s team machinery
for larger runs. Keep all *synthesis* single-threaded in the main thread.

---

## Phase 5 — Synthesis + memory

Merge the team reports into `docs/01-current-state-and-findings.md` (every claim
traceable to `path:line` or a table). Capture a project memory file so the thread
survives context loss (per the memory rules in your environment).

---

## Phase 6 — Spec authoring (autonomous burst)

Author the design docs **in dependency order** (skeletons in
`references/templates.md`). For size L the canonical arc:

1. `01` Current state & findings — diagnosis (contradictions/tensions, evidence)
2. `02` Vision & architecture — principles that solve each contradiction + the shape
3. `03` Data model & contract — canonical entities, schema, interface, migration
4. `04` [domain] organization — the durable/human layer (if there is one) *(optional)*
5. `05` [components] — deep-dive each major component: verdict, keep/discard/build, cost
6. `07` [organizing pattern] — the composability metaphor + "add a node" playbook *(optional)*
7. `06` Roadmap & open questions — phased plan, first vertical slice, risks, the decision list

Methodology to honor while authoring:
- **Model the confusing parts** — when discovery surfaced a workflow that is
  multi-step, approval-gated, agentic, concurrent, or retry/escalation-laden, the
  spec MUST include an explicit model of it (statechart, state-transition table,
  or equivalent — a given/when/then transition list is enough), and the epics that
  build it reference the model. The CONTRACT carries these under "Core-logic
  models." Only the confusing parts — modeling is not ceremony when it replaces
  confusion, and only then.
- **Never greenfield when code exists** — every doc shows what's already built and
  how to *promote* it (mapping tables), not just what's new.
- **Contradiction-driven** — start from pain (01), derive principles (02),
  operationalize them everywhere after.
- **Evidence-based** — cite code, not intuition.
- **Risk-honest** — name rate limits, fidelity gaps, failure modes explicitly.
- **User-voiced** — restate the wants in the user's own language; map architecture
  back to each want.

Route per the repo's `CLAUDE.md`: code-adjacent docs → repo `docs/`; project
decisions/sessions → the vault.

---

## Phase 7 — Decision round  ⏸ GATE G2

Collect every genuine judgment call into a single **"Decisions only you can make"**
section (lives in the roadmap doc `06 §4`). For each: state it, attach a
**recommendation**, but **do not pre-decide** the irreversible ones. Present them
numbered. The user answers numbered.

Then:
- **Lock** each answer into the docs, marked "locked," with **owner + date** —
  and record `G2 = {approved, owner, date}` in `.plan-it/state.json`
  (`G2_ANSWERED` is guarded by `gateRecorded`).
- If the user introduced a *new concept* (they often do here), thread it through —
  add/rewrite the affected doc (e.g. a new `07`) and **run a coherence pass**
  (grep for now-stale terms the new decision invalidated; fix them).

---

## Phase 8 — Backbone freeze  ⏸ GATE G3

Ask "specs are aligned — proceed to the delivery package?" On yes, write the
backbone **first**, because squads build their PRDs against it:

1. `delivery/CONTRACT.md` (frozen v1.0) — vocabulary, schema, verbs/interface,
   primitive interface, enums/literals, repo ownership + branch rules, definition
   of "shipped," changelog.
2. `delivery/00-program-plan.md` — squads, epic backlog, waves, test standard,
   branching, the fable-it runbook, the board pointer.
3. `delivery/STATUS.md` — the live board, all epics in backlog.

(For size S/M, fold these into fewer files — a contract section + a single plan.)

Record `G3 = {approved, owner, date}` on the user's yes. Then, before any squad
fan-out, run `node scripts/gate-check.mjs freeze delivery/CONTRACT.md` (or the
file carrying the inlined contract section) — the `CONTRACT_FROZEN` transition is
guarded by it, and Rule 1 is now an exit code, not a plea. Record the contract
version + path in `.plan-it/state.json` → `contract`.

---

## Phase 9 — Parallel planning (autonomous burst)

Fan out **one squad team per repo lane** (disjoint files — no co-editing). Each
writes its `prds/prd-N-*.md` + `epics/epics-N-*.md` **against the frozen CONTRACT**.

- **PRD** per squad: summary, problem & goals, users & jobs, solution design
  (numbered decisions D1–DN, citing `file:line`), epics table, acceptance criteria,
  risks, repo/branch plan.
- **Epics** per squad: per epic — branch (`epic/<EID>-<slug>`), deps, scope, task
  checklist (file:line scoped), then **— as the LAST and load-bearing step — the
  Test Contract**: up to ~20 type-selected use-cases/scenarios with expected
  outputs registered (see "The Test Contract" above and `formats.md`). DoD = 100%
  of the contract passes. This is the heart of the epic, not a footnote.

**Amendment loop:** squads grounding in real code will surface cross-cutting
integration issues *before any code is written* — fold each back into `CONTRACT.md`
centrally (v1.0 → v1.1 …) so squads can't drift. This is the contract doing its job.

**Scaling the fan-out** (when there are *many* PRDs, not 4 fixed squads): use the
**parallel-batch generator** (playbooks §C) — a `features.json` work-breakdown
(one row per PRD), subagents spawned in review-gated batches, the same
template+glossary *injected into every subagent* for coherence, and a
cross-PRD consistency lint after the fan-out. PRD numbering `PRD-NN` where NN =
dependency order.

**Optional executable split** (playbooks §D): instead of (or beside) `epics/*.md`,
emit the breakdown onto a live GitHub Projects board via a `ghp.sh` helper
(epic = parent issue, tasks = native sub-issues, status single-select; GitHub is
source of truth, `tracker.md` a cache). Offer this when the user wants a live board.

Apply Rule 3 after the fan-out — `node scripts/gate-check.mjs verify prds/ epics/`
(the `SQUADS_COMPLETE` transition is guarded by it). Each `AMENDMENT` bumps the
contract version in `.plan-it/state.json` (v1.0 → v1.1 …) and stays in
`parallelPlanning` — the machine's self-loop.

---

## Phase 10 — Verify + handoff

- **Enforce the Test Contract gate:** every epic carries its contract (up to ~20
  type-selected cases, expected outputs registered); tally the totals; flag `[REAL]`
  cases (those needing a live target). DoD = 100% pass via `/full-qa` + `/iterate`.
  No `[REAL]` case may be marked VERIFIED on a mock — unreachable target →
  IMPLEMENTED-NOT-VERIFIED, never a fake green.
- **Run the mechanizable lint first:** `node scripts/gate-check.mjs handoff delivery/`
  — the `LINT_CLEAN` transition is guarded by it. It checks ID grammar, declared-vs-
  counted case totals, `[REAL]` tallies, per-epic Test Contract presence, and token
  lint. The judgment half below still needs you.
- **Run the pre-handoff consistency gate** (`references/playbooks.md` §F) — the lint
  that makes a package build *unattended*: counts add up (count tags, don't hand-type);
  every goal & governance rule has a test; the CONTRACT verb/API surface reconciles
  with what's "kept" and what's tested; **if the tool parses its own artifacts, round-trip
  the grammar over the generated sample**; every diff/sync verb declares live-vs-cached
  reads; every "never X" invariant has an inverse-op test; IDs/dep-graph coherent across
  files; token lint. Fix and re-lint until clean. (These are the exact defect classes a
  dry-run shipped — don't hand off without it.)
- **Assemble:** `delivery/README.md` (index) + `delivery/KICKOFF.md` (orientation:
  one-liner, first slice, repo map, locked decisions, gotchas, handoff state).
  KICKOFF is *generated*, never copied stale: it MUST open with the "0. Pinning"
  block (absolute repo path @ full git SHA, `.plan-it/state.json` path, CONTRACT
  SHA-256) and make "re-derive tally + reconcile from disk, stop-and-report on
  mismatch" the builder's first numbered step (`references/templates.md`
  KICKOFF block, PRD §D4–D5).
- **Fill the board:** `STATUS.md` rows reflect Wave-0 in-progress, rest backlog.
- **Hand off** (the terminal phase — the build runs in a *fresh* session):
  - Wire the repo to your knowledge base (`/sync-obsidian` or equivalent), if your
    environment has one.
  - Capture a session debrief (`/session-debrief` or equivalent) — session note,
    reusable patterns, memory.
  - Produce the launch handoff (`/next-session-prompt`, or author it directly) —
    the KICKOFF doc **and** the exact copy-paste launch
    prompt (this is the `sample-prompt-prd.txt`-style artifact that `/fable-it`
    consumes). Done.
- **Optional handoff enrichments** (playbooks §E): a `README.md` consolidation hub
  (reading-order table + decisions-in-one-screen + GATING items); a `KICKOFFS.md`
  archiving the launch prompt per PRD/phase; a `DELIVERY-LOG.md` truth board; and
  for large PRDs, an initial slice + a later `-CONCLUDE` run to close deferred
  IMPLEMENTED-NOT-VERIFIED items.

Final report to the user: per-doc + per-epic status, total test count, the
locked decisions, and the launch prompt.

---

## Composes with

- **[`/fable-it`](https://github.com/DevOtts/fable-it)** — the build engine `plan-it` feeds. The handoff prompt targets it.
- **`/read-chat`** (optional) — resolve pointer sessions in pre-grounding.
- **`/sync-obsidian`, `/session-debrief`, `/next-session-prompt`** (optional) — the
  handoff trio; degrade to inline equivalents when absent.
- **Agent / Claude teams** — the research (Phase 4) and squad (Phase 9) fan-outs.

## References (read the one you need before authoring)

- **`references/machine.md`** — the deterministic core: `machine.json` explained,
  the `.plan-it/state.json` schema + resume protocol, `gate-check` usage, the
  degrade-gracefully rule, and the "model the confusing parts" output discipline.
  Read at Phase 0 (resume) and before every guarded transition.
- **`references/templates.md`** — doc + delivery skeletons (PARTS A–C) **and the 5
  packaging shapes + use-case→shape map (PART D)**. Read PART D at Gate G1 to pick
  the shape; read A–C before authoring.
- **`references/formats.md`** — the composable atomic formats (lego bricks): decision
  log, blocking-questions table, governance/invariant block, the 4 test-case
  grammars, test-tier matrix + coverage-map self-audit, typed task grammar + dep-graph
  DAG, the DoD ladder, the honest run-report / DELIVERY-LOG.
- **`references/playbooks.md`** — advanced moves: discovery modes (incl.
  verify-then-extend), brownfield/refactor templates (verdict tables, blast-radius,
  naming-first, schema-vs-data-migration), scale-out batch PRD generation, the
  executable GitHub-board split, and handoff enrichments.

---
_Authored by [DevOtts](https://github.com/DevOtts)._
