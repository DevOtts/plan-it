# plan-it v3 — Findings Synthesis

Date: 2026-07-07 · Author: plan-it run (Fable 5 main thread) · Status: synthesis complete
Sources: `research-SYNTHESIS.md` + `research-FOUNDER-INPUT.md` (dogfood, 8 plan→execution
pairs across 4 subscriptions) · `docs/research/v3/stream-{A,B,C,D}.md` (this run's fan-out).

---

## 1. What the dogfood week proved (keep, don't touch)

Evidence: `research-SYNTHESIS.md`, stream-D §Findings.

- **The freeze/contract core works.** Every pair that froze a CONTRACT before squads
  shipped against it; the cleanest run (fable-v2 pair) went KICKOFF-verbatim → CONTRACT
  v1.1 → 26/26 pre-registered cases → shipped with zero mid-build interventions.
- **Test Contracts are the founder's top-rated feature** ("locks the DoD"). v3 deepens,
  never dilutes.
- **The v2 deterministic core is now consensus** (stream-C: statechart-over-prompt-chain
  is the published industry position; spec-driven flows like spec-kit converge on the
  same shape). No architectural rework needed — v3 is enforcement-depth, not redesign.

## 2. Where plans failed their executions (the v3 surface)

Recurring, evidenced failure classes from the 8 pairs (stream-D inventory; ~30+ ECs):

| # | Failure class | Canonical evidence |
|---|---|---|
| F1 | **Environment surprises planning should have probed** — missing pytest, absent ESLint, dead env values | EC-D3, EC-C7, EC-G4, EC-B* preflight |
| F2 | **User's real quality bar never captured as cases** — "62/62 green yet visually unacceptable" | EC-C1; FD-2 rationale |
| F3 | **Test conventions re-discovered every run, never persisted** | FD-1; EC-H2 |
| F4 | **Cross-subscription/session handoff fragility** — `/read-chat` fuzzy-matched the wrong session; stale paths | pair D exec; EC-D9 |
| F5 | **Hand-maintained counts drift** — contract tally hand-edited 20→24→26 | EC-D6 |
| F6 | **Packaging/loader defects invisible to contracts** — unquoted YAML colon+space silently stripped skill metadata at deploy | EC-D7 (v2.1 shipped this bug) |
| F7 | **Status language drifts from truth** — "done" claims without contract passing; no honest ladder as *machine* states | EC-E*, stream-D cluster 5 |
| F8 | **Model-tier guidance absent from plan artifacts** — Fernando asked for cost-aware tiering in both plan pairs | pair D+F; mirrors fable-it v2.1 |

## 3. External mechanisms worth importing (evidence-graded)

**pxpipe (stream-A)** — the durable import is its *measurement culture*, not pixels:
- `eval/EXPERIMENT_LOG.md` discipline: dated hypothesis → measured result → adopt/investigate/reject. Real, runnable (`bench/run.sh`, `bench/score.mjs`, published per-item scores). → plan-it run reports should be experiment-log-shaped.
- Honest self-audit docs (`docs/LEGIBILITY-AUDIT-2026-07-01.md`, `docs/CACHING_AND_SAVINGS.md`): the project publishes where it *fails*. → the DELIVERY-LOG/run-report posture.
- Its context-compression thesis itself: out-of-scope for a planning skill (fable-it backlog).

**damon-ade (stream-B)** — Fable-parts + builder-parts only, verified implemented (not README-ware) in `agent-scaffold.ts`, `superagent.ts`, `agent-wrappers-claude-codex-opencode.ts`:
- **Per-model behavior scaffolds**: a lower-tier agent gets an injected system-scaffold encoding the top-tier behavioral contract (careful-execution mode, tone/tool rules). → plan-it v3: the *plan* ships a per-epic prompt scaffold + tier hint the builder injects into subagents.
- **Struggle detection as code**: explicit failure/struggle signals trigger escalation, not vibes. → plan-it v3: epics declare escalation triggers ("if contract case fails twice on tier X → escalate to tier X+1").
- Reflect-on-stop hooks, memory docs: builder-side → fable-it backlog.

**Web scan (stream-C)** — genuinely new since ~May 2026 is thin (honestly flagged); the load-bearing confirmations:
- spec-kit-style `/speckit.analyze`: a *cross-artifact consistency verb* run before implement. → strengthens gate-check `handoff` into a real reconciliation lint.
- Adaptive/extended-thinking budgets: plans can encode per-task effort levels. → tier table gains an effort column.
- Anthropic multi-agent research system: orchestrator-worker with thinking-budget-by-difficulty — validates the tiering direction.

## 4. The v3 shape (six workstreams, from stream-D clusters + FD ranking)

1. **W1 — Test Contract deepening** *(top-ranked; FD-mandated)*: FD-1 test-convention
   discovery persisted to target CLAUDE.md; FD-2 pushed user review of cases at the gate
   (new sub-gate or G2 extension); packaging/loader case mandatory when the deliverable
   is itself a plugin/skill (EC-D7); runnability column per case (EC-G4).
2. **W2 — Environment preflight**: machine-checked env smoke-probe before contract
   authoring (EC-D3/C7); ENV-FACTS output; extends Rule 4 live-grounding from "running
   systems" to "execution environments."
3. **W3 — Tier + escalation as plan artifacts**: per-epic tier table (model + effort +
   escalation trigger + per-model scaffold pointer); never hardcode top tier (mirror
   fable-it v2.1's "top tier = session model").
4. **W4 — Honest-status machine**: VERIFIED / IMPLEMENTED-NOT-VERIFIED / PARTIAL /
   BLOCKED as enforced vocabulary in STATUS/DELIVERY-LOG, linted by gate-check (F7).
5. **W5 — Auto-derived counts + reconciliation lint**: gate-check computes tallies from
   tags (never hand-typed); `analyze`-style cross-artifact reconciliation before handoff (F5).
6. **W6 — Handoff/resume hardening**: fresh-context verification step (EC-D9); exact
   session/transcript pinning in KICKOFF (F4); packaging hygiene checks (marketplace/
   plugin.json parity — stream-D flagged a currently-false marketplace claim).

## 5. Out-of-scope → fable-it backlog

Filed separately in `docs/v3/fable-it-backlog.md` (builder-side ECs: pxpipe context
compression, reflect-on-stop hooks, builder memory docs, runtime struggle telemetry,
release-and-comms epic execution, EC-D8's build-side half).

## 6. Tensions to resolve at G2

- FD-2 (pushed test-case review) vs "ONE batched gate" (Rule 2): new sub-gate G2.5 or
  fold into G2 as a mandatory exhibit?
- W2 preflight cost on small S-shapes: always-on or size-gated?
- W3 scaffolds: plan-it authors them (plan artifact) vs plan-it only *points* at
  fable-it's tier table (avoid double-ownership)?
- Packaging hygiene (W6): in-scope for a *planning* skill, or repo-maintenance chore
  outside the run?
