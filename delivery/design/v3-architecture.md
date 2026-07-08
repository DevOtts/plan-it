# plan-it v3 — Architecture & Delta Design

STATUS: LOCKED (pending G2) — streams C+D folded in 2026-07-07; all ⟵C/⟵D markers resolved against docs/research/v3/stream-C-webscan.md and stream-D-ec-map.md.
Baseline: `v2/deterministic-core @ fc6abc8` (plugin 2.1.0). See `delivery/decisions.md` D-0.

## 1. Goal
Enforce the plan-phase gaps found in the 15-pair v2 field study (research-SYNTHESIS.md),
shipping FD-1 and FD-2 (founder-mandated) plus the ranked backlog top items, WITHOUT
touching the validated core. v3 is additive: new states, new gate-check subcommands,
new reference sections, new hook checks — never edits to freeze/contract semantics.

## 2. Protected core (additive-only; from SYNTHESIS §2, intake non-negotiables)
Freeze mechanism & verbatim-consumed packages (15/15 pairs) · [REAL] Test Contracts as
binding DoD (13/15, founder top-rated) · gate-check.mjs deterministic lint · KICKOFF
read-order handoff · evidence ledgers + honest status ladder + fresh-context verifiers ·
dated AMENDMENTS + decisions.md · batched decision gate · statechart deterministic core.

## 3. Statechart delta (machine.json, current: 15 states, intake → done)
v2: intake → dodLock → scopeGate(G1) → preGround → discovery → synthesis →
specAuthoring → decisionGate(G2) → coherencePass → freezeGate(G3) → backboneFreeze →
parallelPlanning(⟲AMENDMENT) → verify → handoff → done

v3 additions (all additive; guards in gate-check `state`):
- **preGround** gains a composite substate `realityProbe` (backlog #3 + FD-1/M1):
  emits `ENV_FACTS_VERIFIED` carrying the ENV-FACTS manifest + test-convention
  registration receipt (CLAUDE.md read → subagent research → ask user → REGISTER).
  Insertion resolved (Stream D F2/F3): NO new machine.json state — the machine is
  strictly linear (1 entry, 1 final, sole AMENDMENT self-loop) and stays untouched.
  `realityProbe` is a SKILL.md phase step enforced by a new `gate-check testconv`
  subcommand (pure append to the 4-entry commands map, gate-check.mjs:265 pattern),
  with `gate-check state` requiring the ENV-FACTS artifact + registration receipt in
  state.json before GROUNDED is accepted.
- **decisionGate** gains a required payload check: `G2_ANSWERED` invalid unless the
  Test Contract case-review artifact exists and is user-acknowledged (FD-2/M2) and the
  credential procurement checklist is dispositioned (backlog #10; unprocured ⇒
  GATED-with-owner in the contract).
- **freezeGate** guard extension (backlog long-tail EC-B7): known-gaps ledger must be
  fully dispositioned (fix/waive/case-ify) or `G3_APPROVED` is rejected.
- **parallelPlanning → verify** unchanged; per-squad self-lint (backlog #9) enforced by
  prompt contract + `gate-check handoff` run per-squad, not by new states.
- New statuses as machine-legible vocabulary (not states): IMPLEMENTED-NOT-VERIFIED,
  BLOCKED (EC-F4) — recorded in evidence ledger schema, validated by gate-check.
- New top-level entry modes (SYNTHESIS §5): `replan` (verify-then-extend, EC-E7),
  `statusReconcile` (analysis-only pre-phase, EC-H). Modeled as alternate initial
  transitions from intake, NOT as changes to the frozen core path. Design resolved
  (Stream D F2): alternate shapes cannot be safely expressed on the existing linear
  graph — they ship as a sibling `machine-replan.json` selected by SKILL.md Phase 0;
  core machine.json is never edited.
- Post-handoff: `plan-it --audit` (EC-A4) is a gate-check subcommand diffing CONTRACT
  AMENDMENTS vs `.plan-it/state.json` — no new state; runs against a `done` run.
- Execution-liveness (EC-A9): handoff writes an expected-liveness stanza into
  state.json; `--audit` flags packages never built.

## 4. Backlog → mechanism map (SYNTHESIS §4; file:line targets per stream-D-ec-map.md tables — items 6/8/11 combine into CONTRACT.md `##` sections; M2/item 10 combine as G2 exhibits; §5 items 3/4/5 dedupe onto ranked 5/8/audit)
| # | Item | Lands in | Artifact/enforcement |
|---|------|----------|----------------------|
| M1 | FD-1 test-convention discovery → CLAUDE.md register | preGround/realityProbe | SKILL.md Phase 3 + references/playbooks; gate-check verifies registration receipt |
| M2 | FD-2 pushed case review (chat + file) pre-freeze | decisionGate | `delivery/TEST-CONTRACT-REVIEW.md` + G2 payload guard |
| 3 | Runtime Reality Probe → ENV-FACTS manifest | preGround | executable discovery stream; templates/formats section |
| 4 | Self-contained handoff manifest (linted abs paths, repo snapshot, on-disk launch prompt) | handoff | `gate-check handoff` extensions; HANDOFF.md template |
| 5 | Resume protocol (RESUME cursor, approval tokens, statechart-owned memory pointers, liveness) | handoff + runtime | STATUS.md RESUME block; hook-written pointers |
| 6 | Claims ledger (SHA anchors, double-sourced gates, gap disposition at freeze) | preGround + backboneFreeze | CLAIMS.md + freeze guard |
| 7 | Case taxonomy upgrade (trust/negative, outcome-E2E, measured-NFR, [HUMAN], wave exit proofs) | specAuthoring (Test Contract) | formats.md taxonomy + FD-2 review surface |
| 8 | RUN-POLICY block frozen into package | backboneFreeze/KICKOFF | machine-readable block: tiers, HITL, git scope, interlock/quiesce, reap, demand intake |
| 9 | Write-time lint everywhere (squad self-lint, derived tallies, scaffolded tree, non-code profile) | parallelPlanning | squad prompt contract + gate-check handoff per-squad |
| 10 | Credential procurement gate at G2 | decisionGate | CREDENTIALS checklist; GATED-with-owner |
| 11 | Deploy/rollout design doc + CORS matrix + live-checked runbooks + release&comms epic | specAuthoring/scopeGate | conditional mandatory artifact when prod-touching; EC-D8 epic offered at G1 |
| 12 | Agent I/O protocol (write-to-disk mandate, machine-checked fold, integration acceptance, fresh-context invariant) | parallelPlanning + runtime | SKILL.md rule extension (Rule 3 hardening) — corroborated by this run's own C/D idle incident (decisions.md D-1) |
| LT | Long tail: freeze governance (EC-B7/A4), EC-F4 statuses, contract-growth (EC-H7), hotfix-regression (EC-E4), CI graduation (EC-C10), loader test (EC-D7), ops-salvage box (EC-E5), drift check (EC-H8), stale-anchor re-ground (EC-C3), deliverable-form question (⊂FD-2) | various | scope-cut line decided at G2 |

## 5. Cheaper-model determinism techniques (folded from stream-C-webscan.md, COMPLETE)
Headline: the webscan *validates* rather than redirects — Anthropic's own guidance
("a real guardrail needs to be deterministic; enforcement = hooks and permissions") and
Stately/XState's statechart-as-runtime pattern independently confirm the v2.1 core bet.
Dispositions per stream-C mechanism (C1–C8):
- **C1 adaptive effort param on high-ambiguity states** → ADOPT into RUN-POLICY block
  (backlog #8): effort=high only on discovery/synthesis/contract-draft, medium elsewhere.
- **C2 explicit effort-scaling table in prompts** (Anthropic multi-agent fix: never let
  the model judge fan-out size) → ADOPT into squad prompt contract (backlog #9/#12) +
  RUN-POLICY subagent sizing rules.
- **C3 escalate-on-low-confidence cascade formalized as rule** → ADOPT into RUN-POLICY
  (#8); cite arXiv cascade literature (~95–99% quality retention) in the design note.
- **C4 golden-test eval gate on CONTRACT artifacts (promptfoo-style)** → G2 DECISION
  (adds net-new scope): rec = hand-rolled golden set as a `gate-check contract-evals`
  subcommand seeded from the 15-pair ECs; defer full promptfoo integration to long tail.
- **C5 cross-artifact "analyze" gate (spec-kit `/speckit.analyze`)** → PARTIALLY EXISTS:
  v2's `coherencePass` state is exactly this slot (stream C lacked repo access and
  couldn't see it). v3 move: make coherencePass *deterministic* — new gate-check
  subcommand diffing PRDs/epics/contract for naming/scope/API contradictions instead of
  prose-only review. ADOPT as gate-check extension, no new state.
- **C6 schema-typed handoff objects discovery→spec (DSPy-Signature style)** → ADOPT
  lightweight: formats.md schema for the ENV-FACTS manifest + synthesis digest; aligns
  with #12's machine-checked fold.
- **C7 AMENDMENT self-loop circuit-breaker (N-failures → human escalation)** → ADOPT:
  counter + guard in machine.json parallelPlanning AMENDMENT loop; additive, pairs with
  T9 freeze governance.
- **C8 hook-ordering / single-writer discipline** → ADOPT as binding design constraint:
  any new v3 PreToolUse guard extends planit-guard.mjs rather than adding a second hook
  (docs: `updatedInput` last-writer-wins is non-deterministic). Also carry stream C's
  subagent-hook caveat: subagents don't inherit the parent's hooks — squad guards must
  be explicit (corroborates #12).
Out-of-scope items (XState agent framework, promptfoo-for-skills, DSPy signatures for
builders, cascade classifiers) → filed to the fable-it backlog doc per G1 scope decision.

## 6. Marketplace & release (intake non-negotiable)
DevOtts marketplace, same pattern as fable-it / parallel-lifecycle. Metadata/doc gap
list (Stream D F1/F6/F8): (a) marketplace.json's "published in the wider DevOtts
marketplace" claim is currently FALSE — no aggregator repo among DevOtts' 51 repos and
fable-it's marketplace.json self-registers only fable-it; build the aggregator or
soften the claim (G2 decision); (b) machine.json `version` "2.0.0" vs plugin "2.1.0"
are two distinct counters — `plan-it --audit` must reconcile them explicitly; (c) root
and plugins/plan-it copies of all six shared files are byte-identical duplicates, not
symlinks — every v3 change lands twice; add `gate-check mirror-check` subcommand.
Otherwise plugin.json/marketplace.json/README already match the parallel-lifecycle
pattern (no other packaging gaps). Release & comms epic (EC-D8) INSIDE the contract:
version bump → 3.0.0,
README, CHANGELOG, LinkedIn post. Loader/metadata-parse Test Contract cases per EC-D7
(unquoted-YAML `description:` bug class). Branch→main merge: G2 decision (D-0).

## 7. Accumulating G2 decision list (present batched, with recommendations)
1. Branch→main merge timing (D-0) — rec: inside release epic, post-build.
2. Scope-cut line if auto-sizing flags M-size overrun — rec: cut from bottom (LT first),
   never M1/M2/top-5 (intake guardrail).
3. FD-2 review UX: inline chat table + file, or file-only with chat pointer — rec: both
   (founder: "pushed" review).
4. `replan`/`statusReconcile` modes: full v3 scope or design-only stubs — rec (sized
   via Stream D F2): `replan` ships full as sibling `machine-replan.json` + Phase-0
   selector (additive-safe, medium effort); `statusReconcile` design-only stub in v3
   (adjacent long-tail "status values as machine states" is the riskiest item in the
   backlog — touches statechart AND honest-status ladder; keep statuses as
   prose/state.json fields per Stream D F7).
5. RUN-POLICY defaults (tiering table, reap rules) — seed from this run's G1 decisions
   + intake run-policy block.
6. Deliverable-form question wording at G2 (EC-A6) — folded under FD-2 taxonomy.
