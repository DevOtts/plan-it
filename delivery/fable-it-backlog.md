# fable-it backlog — builder-side items filed from plan-it v3 discovery

**Provenance:** plan-it v3 planning run (G1 decision: "builder-side ECs -> fable-it backlog doc").
Sources: docs/research/v3/stream-C-webscan.md §"Out-of-scope but valuable", stream-A/B incident notes, research-SYNTHESIS.md builder-side spillover. These are FILED, not committed — fable-it owns triage.

## Candidates

1. **Constrained-agent builder pattern (statelyai/agent: XState + Vercel AI SDK)** — reusable pattern for any Fable-authored agent needing event-schema-constrained decisions; candidate "constrained-agent" skill in fable-it's builder toolkit. (Stream C, Finding 7)
2. **Document subagent-level PreToolUse hook non-inheritance** in fable-it's skill-authoring guidance — any fable-it skill that spins subagents and assumes parent-level guards apply is silently unsafe. General Claude Code gotcha, not plan-it-specific. (Stream C, Finding 3)
3. **promptfoo-as-CI-gate for skill/prompt regressions** — golden-test-set eval gate on fable-it's own SKILL.md prompt changes (before/after eval on PRs, minimum-passes threshold for non-determinism). (Stream C, Finding 8)
4. **DSPy Signatures / ReAct** — typed tool-call contracts instead of prose tool descriptions for builder-side agents; heavier lift, likely Python-only, not portable to plan-it's TS/Node stack. (Stream C, Finding 10)
5. **Model-cascade confidence classifier ("Cluster, Route, Escalate")** — rigorous alternative to judgment-based escalate-on-struggle; fable-it-scale infra investment. (Stream C, Finding 5)
6. **DevOtts marketplace aggregator decision** — fable-it's `.claude-plugin/marketplace.json` is named `"devotts"` but only self-registers fable-it; plan-it's marketplace.json claims a "wider DevOtts marketplace" that does not exist. Either build the aggregator repo (registering fable-it, plan-it, parallel-lifecycle) or standardize per-repo self-registration wording across the family. Shared-family issue, filed on both sides. (Stream D, Finding 8)
7. **Builder-side enforcement of run-policy blocks** — plan-it v3 emits a run-policy section in CONTRACT.md (tiering, reap-on-merge, disk+message subagent delivery); fable-it is the executor that should mechanically honor it rather than re-derive it. (SYNTHESIS item 8 spillover)

## Explicitly NOT filed
Anything touching plan-it's protected core (freeze mechanism, [REAL] Test Contracts, gate-check.mjs, KICKOFF read-order, evidence ledgers, batched decision gate, statechart deterministic core) stays in plan-it v3 scope.
