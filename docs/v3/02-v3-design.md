# plan-it v3 — Design

Date: 2026-07-07 · Status: draft pending G2 · Basis: `docs/v3/01-findings-synthesis.md`
Scope: enforcement-depth release on the v2 statechart. No core redesign (stream-C consensus).

Files touched by v3 (all under `plugins/plan-it/` unless noted):
`SKILL.md` · `machine.json` · `scripts/gate-check.mjs` · `hooks/planit-guard.mjs` ·
`references/{machine,templates,playbooks,formats}.md` · repo `marketplace.json`.

---

## W1 — Test Contract deepening (FD-mandated, top priority)

**W1.1 Convention discovery + persistence (FD-1).** New machine step inside `contract`
phase: before authoring cases, the run MUST discover the target repo's test conventions
(runner, file layout, naming, fixtures, CI invocation) from live evidence — never from
memory. Output: a `## Test Conventions` block written into the *target repo's* CLAUDE.md
(create if absent, append-idempotent: replace the fenced block keyed
`<!-- plan-it:test-conventions -->`). gate-check `contract` fails if the block is missing
or older than the current run when the target repo has tests.

**W1.2 Pushed case review (FD-2).** The user must *see the cases*, not the count.
Mechanics per G2-Q1 (recommended: fold into G2 as a mandatory exhibit — the gate message
must inline the full case table, ≤40 cases inline, else grouped headings + counts +
file link; a `casesReviewed: true` key is written to state.json only after the gate
response, and gate-check `freeze` requires it).

**W1.3 Packaging case mandate (EC-D7).** When the deliverable is itself a
plugin/skill/package, the contract MUST include at least one loader/packaging case
(installs, loads, metadata survives — the v2.1 YAML-colon bug class). gate-check
`contract` enforces: if plan targets `plugin.json`/`SKILL.md`/`marketplace.json`
artifacts, ≥1 case tagged `@packaging` exists.

**W1.4 Runnability column (EC-G4).** Every case row gains `run:` — the exact command
that executes it (or `manual:<reason>`). gate-check computes: % runnable; `manual`
share >30% fails with a warning-to-override.

## W2 — Environment preflight

New machine state `preflight` between `discovery` and `contract` (machine.json edit).
Produces `docs/ENV-FACTS.md` in the target repo run-dir: probed (not recalled) facts —
runtimes + versions, test runner invocable, lint present, env vars resolvable, network
class. Probes are cheap one-liners with 10s timeouts; failures become BLOCKING facts the
contract must account for (a case may not depend on a tool ENV-FACTS marks absent).
Size-gating per G2-Q2 (recommended: always-on; S-shape runs use the 6-probe minimal set,
M/L the full set — cost is seconds, the failure class it kills is F1, the most frequent).

## W3 — Tier + escalation as plan artifacts

Every epic gains a **Tier Table** (template addition in `references/templates.md`):

| field | meaning |
|---|---|
| `tier` | model class for squad agents (`top` = session model, never a hardcoded name) |
| `effort` | thinking budget hint: low/medium/high (stream-C adaptive-thinking) |
| `escalation` | trigger, e.g. "same contract case fails 2× → escalate one tier and retry once" |
| `scaffold` | pointer to per-model behavior scaffold (damon-ade pattern) |

Ownership per G2-Q3 (recommended: plan-it *authors* the table values but the scaffold
files live in fable-it; plan-it stores only the pointer — avoids double-ownership while
keeping the plan self-contained on tier/effort/escalation).
Hard rule inherited from fable-it v2.1: no model IDs in artifacts; `top` resolves at
execution time.

## W4 — Honest-status machine

`VERIFIED | IMPLEMENTED-NOT-VERIFIED | PARTIAL | BLOCKED` becomes the *only* legal
status vocabulary in STATUS/DELIVERY-LOG templates. planit-guard.mjs adds a lint: any
"done/complete/✅" claim in delivery artifacts without a `VERIFIED` tag + case reference
is rejected at write time. gate-check `handoff` fails on vocabulary violations.
`VERIFIED` requires: case ID + run command output reference (ties into W1.4).

## W5 — Auto-derived counts + reconciliation lint

- gate-check computes all tallies from tagged case rows (`@case-` prefix scan); any
  hand-typed "N/N" figure in CONTRACT/STATUS that disagrees with the computed value
  fails the gate (F5: the 20→24→26 hand-edit drift).
- New gate-check verb `reconcile` (spec-kit `/speckit.analyze` import): cross-checks
  PRD ↔ epics ↔ CONTRACT ↔ tier tables for orphan requirements, cases citing missing
  epics, epics with zero cases, tier table absent. Runs automatically inside `handoff`;
  also callable standalone.

## W6 — Handoff/resume hardening + packaging hygiene

- **Fresh-context verification (EC-D9):** the KICKOFF prompt gains a mandatory first
  step: builder session re-derives the contract tally + reconcile lint from disk before
  writing anything; mismatch = stop and report, don't "fix" silently.
- **Exact pinning (F4):** KICKOFF embeds absolute repo path, git SHA, state.json path,
  contract file SHA-256 — `/read-chat`-style fuzzy session matching is banned as a
  resume mechanism.
- **Packaging hygiene:** per G2-Q4 (recommended: one-time chore epic in *this* v3
  delivery package — fix the false marketplace claim + plugin.json parity now, but the
  recurring lint lives in gate-check `handoff` only when packaging artifacts are in the
  plan's own diff).

## Machine changes (machine.json summary)

```
discovery → preflight → contract → freeze(G2: cases exhibit + casesReviewed)
         → package → handoff(reconcile + vocab lint) → kickoff
```
Gate count unchanged (Rule 2 preserved): G1 intake, G2 freeze — pushed-review folds
into G2 per recommendation.

## Non-goals (v3)

Build-time behavior (fable-it backlog FB-1..7) · statechart redesign · new gates beyond
G2 fold-in · image/context compression · marketplace aggregator work.

## Acceptance sketch (feeds CONTRACT)

~24–30 cases across W1–W6; every W ships ≥1 `@packaging`-or-`@machine` case proving
gate-check/guard enforcement *fails closed* (a violating fixture repo must be rejected).
Contract cases will be authored post-G2 against the frozen scope.
