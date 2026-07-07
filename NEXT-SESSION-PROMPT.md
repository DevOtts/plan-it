# Launch prompt — plan-it v3 planning session

Copy-paste everything below the line into a fresh session opened in
`/Users/macbook/Workspace/Devotts/plan-it`.

---

/plan-it Plan **plan-it v3** — evolve the plugin using the consolidated field research from a week of v2 usage across 15 real PLAN→EXECUTION program pairs on 4 Claude subscriptions.

**Repo baseline (verify before anything):** `https://github.com/DevOtts/plan-it.git`, main @ `e6126c6` ("LinkedIn post v3: dogfood angle"), plugin version 2.1.0. If main has moved or the tree is dirty, reconcile first and note it in decisions.

**READ IN ORDER (all in repo root — discovery is largely pre-done, do not re-research the sessions):**
1. `research-SYNTHESIS.md` — THE SPEC SEED: 15-pair scoreboard, 10 failure themes with merged v3 mechanisms, ranked 12-item backlog + long tail, 8 new capabilities. Sections 3–5 are already phase-mapped and effort-sized.
2. `research-FOUNDER-INPUT.md` — FD-1 and FD-2 are FOUNDER-MANDATED commitments, not candidates. They ship in v3, period.
3. `research-BRIEF.md` — methodology context (what v2 already does; do not re-propose it).
4. `research-findings-A…H.md` (8 files) — evidence backing every claim; consult when a backlog item needs its original incident detail, don't read all upfront.
5. The current plugin source under `plugins/plan-it/` + `README.md` — ground the delta against v2.1.0 as it exists (statechart machine.json, gate-check, PreToolUse hard-gate hook).

**Non-negotiables (play these back before starting):**
- FD-1: project test-convention discovery persisted in the target project's CLAUDE.md (read → subagent research → ask user → register either way).
- FD-2: proposed Test Contract cases explicitly surfaced (chat + file) with the user pushed to review/edit them BEFORE freeze.
- Do NOT touch the validated core: freeze mechanism, `[REAL]` Test Contracts, gate-check.mjs, KICKOFF read-order, evidence ledgers, batched decision gate, statechart deterministic core.
- **Distribution: the plugin ships in the DevOtts marketplace, same pattern as `https://github.com/DevOtts/fable-it` and `https://github.com/DevOtts/parallel-lifecycle`** — repo is already `DevOtts/plan-it`; marketplace metadata/installation docs must match those two siblings. Include a release & comms epic (per EC-D8: version bump, README, CHANGELOG, LinkedIn post) INSIDE the contract, not as tail work.
- v3 must itself be planned by v2.1.0 (dogfood) and end with a frozen CONTRACT, binding Test Contracts (include plugin loader/metadata-parse cases per EC-D7 — the YAML frontmatter bug class), KICKOFF + file-based launch prompt.
- Scope guardrail: the synthesis backlog is ranked M1/M2 then 1–12. If auto-sizing says the full list is too big for one program, cut from the bottom, never from FD-1/FD-2/top-5.

**Run policy (freeze this into the package as its own block — that's backlog item 8):** coordinator on the strongest available model; mechanical/spec'd slices on sonnet, judgment slices on stronger tiers, escalate-on-struggle; subagents write results to disk AND send content-bearing final messages ("idle ≠ delivered"); reap builders on merge.

I'll be reviewing at the batched decision gate and — per FD-2 — I expect to see the proposed Test Contract cases explicitly for my edit before you freeze.
