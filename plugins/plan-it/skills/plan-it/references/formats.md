# plan-it — reusable atomic formats (the lego bricks)

These are composable building blocks proven across many real planning sessions.
Mix them into whichever packaging shape you picked (see `templates.md` PART D).
Use the exact grammars — they are what makes downstream tools (`/fable-it`,
`/full-qa`, board generators) ingest the output cleanly.

---

## 1. Decision log (locked decisions with authority)

Lives in the canonical design doc (architecture / vision). Stronger than a prose
"open questions" list because downstream PRDs defer to it.

```
## Decision log — <date>
D1. [DECIDED] <decision>. Rationale: <why>. Rejected: <alternative + why not>.
D2. [CHANGED] <was X, now Y because Z>.
D3. [CONFIRM: <owner>] <recommendation, pending sign-off>.
```
- Tag each: `[DECIDED]` / `[CHANGED]` / `[CONFIRM: <owner>]`.
- Every downstream PRD carries the clause: **"Where this PRD and <design doc>
  disagree, <design doc> wins."**
- When a research/input doc is overtaken, don't rewrite it — add a forward banner:
  `> ⚠️ SUPERSEDED IN PART by Decision log D3 — see architecture.md`.
- Lock format for the roadmap table: `| Decision | Choice | Owner | Date |`.

## 2. Open-questions-as-blocking-table

Each question names what it gates, so nothing silently proceeds on a guess.
```
| # | Question | Owner | Blocks |
|---|----------|-------|--------|
| 1 | Hosting: local or VPS? | <owner> | E2.1, deploy phase |
```

## 3. Governance / invariant block (the lightweight in-PRD contract)

When a full `CONTRACT.md` is overkill, encode the cross-cutting law as a numbered,
separately-namespaced block that **negative tests enforce**:
```
## Governance (binding)
G-1 No PII column ever stores message content.   (test: assert no content column)
G-2 …
## Credential boundaries
CB-1 The autonomous plane never holds production write creds.
```
Reference rule: every G-/CB- id must map to ≥1 (often negative) test in the
coverage map.

## ★ The Test Contract (binding — the quality differentiator)

The headline artifact. Each PRD/epic ends with a contract of **up to 20 use-cases**
the implementation MUST satisfy 100% before "done" — authored at planning time with
expected outputs registered up front, then run to green via `/full-qa` + `/iterate`.
This is **Specification by Example** + **ATDD/BDD** (code) and **Eval-Driven
Development** (skills/LLM). Pick the grammar(s) by implementation type (matrix in
`SKILL.md` → "The Test Contract"). The §4 grammars below are the cell-level formats
these contracts use.

Header every contract:
```
## Test Contract — <feature>   (BINDING: 100% pass or /iterate)
Types: [unit][e2e][use-cases][stress]  ·  Count: N (≤20)  ·  Surfaces: API+UI(CDP) | skill-eval | …
Done = every case below is PASS. No [REAL] case VERIFIED on a mock.
```

**CRUD / API+UI contract** — assert each scenario twice (API *and* UI via Chrome CDP):
```
| UC | Scenario | API → assert | UI (Chrome CDP) → assert | Kind |
| 01 | Create valid record | POST /x {..} → 201, row exists | fill form, submit → row in list | happy |
| 02 | Reject missing field | POST /x {} → 422 | submit empty → inline error shown | edge |
| 03 | Update other user's row | PATCH → 403 | action hidden / blocked | authz |
```

**Skill / LLM-output contract** — expected output registered; compared at test time:
```
| UC | Input | Expected output (or rubric) | Match mode | Pass |
| 01 | "<closed input>" | "<exact expected>" | exact | real == expected |
| 02 | "<open input>" | rubric: mentions X, cites Y, ≤200 words | LLM-as-judge | judge ≥ 0.8 |
```
Closed outputs → **exact match**; open outputs → **rubric / LLM-as-judge**
(`make-eval`, promptfoo, DeepEval G-Eval). Keep the set small & high-quality (≤20),
drawn from real/likely failure cases — not auto-bulked "slop". Iterate until 100%.

**Stress / agentic contract** — use the six-axes scenarios (§4c). **Pure logic** —
add property-based invariants alongside enumerated cases.

---

## 4. Test-case grammars (pick per epic type)

**4a. Golden-value QA case** — deterministic, hand-computed expected values:
```
QA-E0-03 — Seed row counts + exact calibrated values  [epic E0] [tier T1] [group P-2]
Steps: make seed; query Postgres for the calibration set.
Pass (all exact): June MTD total = $9,418; Opus $5,368 / Sonnet $3,108 / Haiku $942.
```
Grammar: `ID — name [epic][tier][group]` / `Steps:` / `Pass:` (exact numbers, not
"looks right").

**4b. Categorized E2E use-case table** — for agent/behavioral systems:
```
| # | Input/Question | Expected behavior/output | Tools | Pass criteria |
```
Group A–E (data grounding / persona / skills / actions / edges). Runtime status
enum: `PASS / PARTIAL / FAIL / BLOCKED(+reason)`. "Designed first; expected
outputs registered" before any code.

**4c. Six-axes stress scenarios** — for stateful/agentic behavior a table can't
capture. One scenario per axis (async+artifact, parallel fan-out/map-reduce,
escalation, human-gate, recursion/depth-limit, self-call/cycle-guard):
```
S1 — <name>
  Setup: …
  Expected: …
  Pass: …
```

**4d. Classic epic test table** (the classic baseline — still the default for
straightforward epics):
```
| T-<EID>-NN | unit|integration|e2e | [REAL]? | Given/When/Then | assertion |
```
Count is per-shape (Shape-1 program → ≥10/epic floor; small shapes → ~20 total per
package); ≥3 e2e for integration/UI. **IDs:** use `T-<EID>-NN` (e.g. `T-E1-01`)
consistently — don't drift to `T1-01` mid-package.

## 5. Test-tier matrix + coverage-map self-audit

**Tier matrix** — declare how each test runs:
```
| Tier | What | Data/creds | Account plane | Mode |
| T1 | autonomous (twins/synthetic) | fake | sandbox | CI |
| T2 | real-API | live read | staging | manual |
| T3 | supervised console | live | prod | human-driven |
```
Rule: anything T1 can't cover **must** become a twin scenario or be explicitly
listed as T2/T3 — no silent gaps.

**Coverage map** (bottom of the test plan — the self-audit most test plans lack):
```
Requirement → test IDs:   FR1.1 → QA-E1-01, QA-E1-02 ; …
Governance/CB → test IDs (incl. negatives):   G-1 → QA-E3-09(neg) ; …
Autonomous coverage: T1=96, T2=3, T3=2, Total=101 → 95.0% ≥ 95% target ✅
```

## 6. Task grammar (typed, code-grounded, ~1 PR each)

```
### T3 — Fix Reports /llm-costs to read accurate cost  [bug]
<one-line intent>
- <impl bullets with exact file:line touch points, e.g. reports.py:370-560;
  delete hardcoded constants at :427,:434,:440>
- **Acceptance:** <checkable assertion — e.g. "killing the DB mid-call does not
  fail generation; pytest green with no sink registered">
- **Deps:** T1.
```
- Type each task `[task] / [bug] / [feature]`.
- Tag the owning repo when multi-repo: `[brain-apps]`.
- "Each task independently shippable & verifiable — ~one PR. Avoid both extremes
  (a mega-task; or 30 trivial checkboxes)."
- The `Acceptance:` line **doubles as the GitHub sub-issue body** (see
  `playbooks.md` executable split).

**Dependency-graph DAG** (closes each epic/phase — shows parallel lanes):
```
T1 ─► T2 ─► T3
T4 ─► T5 ─► T7
  └─► T6 ─┘
(T4/T6 infra run in parallel with T1–T3 app/DB)
```

## 7. DoD ladder (three rungs, not one flat list)

```
Task DoD:   the task's Acceptance assertion passes.
Epic exit gate E#:  <exact /full-qa scope> all green + merged.
Release DoD:  coverage-map target met, governance negatives green, board at Done.
```
Phrase every DoD criterion as a **falsifiable assertion with the verifying test
named inline**. Honest status vocabulary, used everywhere:
`VERIFIED / IMPLEMENTED-NOT-VERIFIED / PARTIAL / BLOCKED(+reason)`.
A `[REAL]` case never counts as VERIFIED on a mock.

## 8. Honest run-report / DELIVERY-LOG (the truth board)

Per-run report (the `/fable-it` report shape):
```
## DoD status
| # | Criterion | Status | Evidence / Blocker |
| 1 | … | VERIFIED | path:line / test name / output |
## Could not be verified (and why)
## What changed (NEW/EDIT file list)
## Decisions made (from the shared contract)
## Surprises / risks found
## Recommended next actions
```
Program-level `DELIVERY-LOG.md` (richer than a kanban STATUS):
```
## Timeline at a glance (delivery order by date)
## Delivery table: | Run/Report | PRD/Phase | Date | What it delivered | PRs | Verification |
## Batch shiplogs   ## Notable outcomes & gotchas
```
Keep the Verification column brutally honest (record when a "green" was caught as
false; record IMPLEMENTED-NOT-VERIFIED stops).

---
_Authored by [DevOtts](https://github.com/DevOtts)._
