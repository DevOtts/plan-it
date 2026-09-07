# SESSIONS.md — plan-it v4 build topology (orchestrator + 3 squads + QA)

Exact session names below are what each terminal runs `/rename` with; the orchestrator addresses squads by these names. Every squad edits in its own git worktree (governance rule G-10) and polls for its wave signal — no session waits on a notification (G-11). Package root: `/Users/macbook/Workspace/Devotts/plan-it/delivery/v4/`. Law: `CONTRACT.md` (v1.1-draft now; v1.0 after PLAN-REVIEW). Human inputs: `GATE.md` (all answered before W0).
Legend: `SQ-A/B/C` squad · `V4<letter><n>` epic · `T-<EID>-NN` epic case · `Wn` wave · `A-n` authorization — see `GLOSSARY.md`.

| # | Session name | Role | Reads | Opens when |
|---|---|---|---|---|
| 1 | `v4-orchestrator` | conductor: W0, dispatch, verify on disk, merge per lane, amendments, wakeup chain, QA signal, morning report | KICKOFF.md · CONTRACT.md · GATE.md · 00-program-plan.md · STATUS.md | first |
| 2 | `v4-sq-a-renderer` | SQ-A: renderer, template, brand tokens, report-family reference, renderer tests (4 epics, 48 cases) | CONTRACT.md · GATE.md · prds/prd-a-renderer.md · epics/epics-a-renderer.md | with #1; builds on the W1 signal |
| 3 | `v4-sq-b-core` | SQ-B: machine, gate-check verbs, guard, harness, fixtures (5 epics, 74 cases) | CONTRACT.md · GATE.md · prds/prd-b-core.md · epics/epics-b-core.md | with #1; builds on the W1 signal |
| 4 | `v4-sq-c-prose` | SQ-C: SKILL, references, docs, README, CHANGELOG, versions (4 epics, 44 cases) | CONTRACT.md · GATE.md · prds/prd-c-prose.md · epics/epics-c-prose.md | with #1; builds on the W1 signal |
| 5 | `v4-qa` | runs every CONTRACT case and every epic case against the merged tree; the dogfood run; writes QA-REPORT.md | CONTRACT.md §7 · STATUS.md · every epics/*.md Test Contract | when the orchestrator announces W3 |

## Launch prompts — open each terminal, run `/rename <name>`, paste its block

### 1 · `v4-orchestrator` (open first)

```
/session-init then act as the ORCHESTRATOR for plan-it v4 (the plugin release: HTML report layer, anamnesis + one review round, build topology, named runs, glossary).

Package: /Users/macbook/Workspace/Devotts/plan-it/delivery/v4/ — read KICKOFF.md (pinning block first, then re-derive the tally from disk), CONTRACT.md (the law, v1.0 after PLAN-REVIEW), GATE.md (every human input answered; the run is ungated), 00-program-plan.md (your runbook §3), STATUS.md (your board). Design context on demand: docs/v4/01-findings.md, docs/v4/02-v4-design.md.

Your job, to conclusion:
1. W0 yourself: commit the planning package and the guard mirror fix (authorization A-4); byte-pin tests/fixtures/v3/machine.v3.7fcff27.json from the 3.0.1 machine.json; create the epic/v4a-*, epic/v4b-*, epic/v4c-* worktrees; record AMD-4/AMD-5 in delivery/decisions.md; copy the GLOSSARY seed; run `node tests/run-contract.mjs` and `gate-check mirror-check` and record both tallies in STATUS.md ## Log.
2. Squad sessions v4-sq-a-renderer, v4-sq-b-core, v4-sq-c-prose are open and polling. Signal W1 via SendMessage; verify their output ON DISK (idle ≠ delivered: branches, commits, files, each epic's local gate); merge per lane after its Test Contract is green (authorization A-1); flip STATUS.md rows with evidence; respect the build orders in KICKOFF.md.
3. Cross-cutting contradictions → amend CONTRACT.md yourself (dated AMD-n in delivery/decisions.md, version bump) and notify affected squads. New genuinely-human decisions → append to GATE.md, take the conservative reversible path, morning report. Rule yourself only if capped, reversible and covered by an existing answer — otherwise "your word, not ours".
4. W2: MIRROR_PAIRS 11, root mirrors synced, version 4.0.0 across six sites and both harness literals in ONE merge, CHANGELOG 4.0.0, `mv .plan-it/state.json .plan-it/v4.state.json` after V4B3 lands, cross-check SKILL.md posture-table state names against the live machine.json.
5. W3: signal v4-qa to run every case (166 epic cases + 60 CONTRACT cases) and the dogfood run; IMPLEMENTED-NOT-VERIFIED with reason for anything unreachable — never a fake green.
6. Usage-limit resilience (MANDATORY): keep a scheduled-wakeup chain alive (≤3600s hops) until W3 closes; persist state to .taskstate/v4/ + STATUS.md before every idle; on a limit, resume after reset — never park on Fernando.
7. Worktrees-only for every squad (G-10). Any headless fallback session polls STATUS and git; it never waits on a notification (G-11). Reap each squad's agents when its wave closes.
8. Morning deliverable: honest per-epic report (VERIFIED / IMPLEMENTED-NOT-VERIFIED with reasons), residuals with dispositions, incidental findings, and what Fernando should read first (QA-REPORT.md, then decide A-2). Do NOT tag or push 4.0.0 (A-2 is held until owner action O-2). Close with /conclude-it.
```

### 2 · `v4-sq-a-renderer` (open with #1)

```
/build-it SQ-A (Renderer) of plan-it v4.
Your package: /Users/macbook/Workspace/Devotts/plan-it/delivery/v4/prds/prd-a-renderer.md + epics/epics-a-renderer.md (4 epics V4A1..V4A4, 48 binding cases). Law: delivery/v4/CONTRACT.md (never edit — contradictions go to the orchestrator session "v4-orchestrator" via SendMessage). Lane: plugins/plan-it/skills/plan-it/scripts/build-report.mjs, scripts/report-template.html, assets/brand/default.brand.json, references/report-family.md, tests/v4/renderer/*, tests/fixtures/v4/report/** — nothing else (gate-check, machine, guard, SKILL and the other references are other lanes). Root mirrors are synced by the orchestrator, not by you. Branches epic/v4a-* in your OWN git worktree (never the shared checkout). Build order V4A1 → V4A2 → V4A3 → V4A4. DoD per epic = 100% of its Test Contract; a case whose target is unreachable is IMPLEMENTED-NOT-VERIFIED with the reason, never a fake green. Register with the orchestrator (SendMessage "v4-orchestrator": "SQ-A ready") and poll STATUS.md for the W1 signal before building. Gotcha: the model-ID regex must be byte-identical to the guard's (CONTRACT G-4) and the `</script` escape must be case-insensitive — both are asserted by cases; no npm dependencies, node: builtins only.
```

### 3 · `v4-sq-b-core` (open with #1)

```
/build-it SQ-B (Deterministic core) of plan-it v4.
Your package: /Users/macbook/Workspace/Devotts/plan-it/delivery/v4/prds/prd-b-core.md + epics/epics-b-core.md (5 epics V4B1..V4B5, 74 binding cases). Law: delivery/v4/CONTRACT.md (never edit — contradictions go to "v4-orchestrator" via SendMessage). Lane: plugins/plan-it/skills/plan-it/machine.json, scripts/gate-check.mjs, plugins/plan-it/scripts/hooks/planit-guard.mjs, tests/run-contract.mjs, tests/v3/lib/contract-cases.mjs, tests/v3/mirror-wired-into-release.mjs, tests/v3/fail-closed-sweep.mjs, tests/v4/core/*, tests/fixtures/v4/** except report/ (SQ-A), tests/fixtures/v3/machine.v3.7fcff27.json (verify its SHA-256; never overwrite) — nothing else. Branches epic/v4b-* in your OWN worktree. Build order V4B1 → V4B2 → V4B3 → V4B4 → V4B5; V4B3 must land before QA runs the v4 cases. Every 3.0.1 state, event and guard keeps its name (machine-diff against both pinned baselines is a release gate). DoD per epic = 100% of its Test Contract; unreachable → IMPLEMENTED-NOT-VERIFIED with reason. Register (SendMessage "v4-orchestrator": "SQ-B ready") and poll STATUS.md for the W1 signal. Gotcha: until V4B3 widens the epic-heading grammar, keep `## Epic V4B<n> —` headings so the 3.0.1 lints see them; the guard fix must land in BOTH the plugin and the root copy or mirror-check fails the release.
```

### 4 · `v4-sq-c-prose` (open with #1)

```
/build-it SQ-C (Prose, references, docs, packaging) of plan-it v4.
Your package: /Users/macbook/Workspace/Devotts/plan-it/delivery/v4/prds/prd-c-prose.md + epics/epics-c-prose.md (4 epics V4C1..V4C4, 44 binding cases). Law: delivery/v4/CONTRACT.md (never edit — contradictions go to "v4-orchestrator" via SendMessage). Lane: plugins/plan-it/skills/plan-it/SKILL.md, references/{templates,formats,playbooks,machine}.md, docs/**, README.md, CHANGELOG.md, plugins/plan-it/.claude-plugin/plugin.json, .claude-plugin/marketplace.json, tests/v3/version-triple-match.mjs, tests/v3/kickoff-pinning.mjs, tests/v3/changelog-shape.mjs, tests/v4/prose/* — nothing else (no code files of SQ-A or SQ-B). Branches epic/v4c-* in your OWN worktree. Build order V4C1 ∥ V4C2 → V4C3 → V4C4. Use the state and verb names exactly as CONTRACT §3.1 and §4.5 spell them. DoD per epic = 100% of its Test Contract; unreachable → IMPLEMENTED-NOT-VERIFIED with reason. Register (SendMessage "v4-orchestrator": "SQ-C ready") and poll STATUS.md for the W1 signal. Gotcha: the SKILL description must end ≤ 1,024 characters with the trigger phrases inside the first 250 — cut before you add; the six-site version check goes green only after SQ-B's machine.json bump lands in the same W2 merge, so report V4C4's version case as IMPLEMENTED-NOT-VERIFIED until then.
```

### 5 · `v4-qa` (open when the orchestrator announces W3 — or with the rest; it polls)

```
/full-qa plan-it v4, W3 verification wave.
Read /Users/macbook/Workspace/Devotts/plan-it/delivery/v4/CONTRACT.md §7 (definition of shipped) + STATUS.md + every epics/*.md Test Contract (166 cases) + the CONTRACT ## Cases table (60 cases). Run each against the MERGED tree on main in a fresh worktree: `node tests/run-contract.mjs`, `node tests/v3/fail-closed-sweep.mjs`, `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs mirror-check` (expect 11/11), `machine-diff` against both pinned baselines, `tests/v3/version-triple-match.mjs`, then the dogfood run on tests/fixtures/v4/dogfood-project/ in autonomous-draft mode to handoff with `mirror --dir --require-html` and `glossary` exit 0; open two rendered twins in Chrome (authorization A-3) and check the glossary panel, first-use expansion, brand badge and theme toggle by eye. Report per case PASS / FAIL / IMPLEMENTED-NOT-VERIFIED with the reason — never a fake green. Write delivery/v4/QA-REPORT.md, deliver the computed tally to "v4-orchestrator" via SendMessage, and flip only the STATUS.md rows it approves. Poll STATUS.md for the W3 signal; do not wait on a notification.
```

## Orchestrator runbook

`00-program-plan.md` §3 (ten steps: dispatch · verify on disk · merge per lane · amend centrally · usage-limit resilience · worktrees-only · poll never wait · reap · incidental channel · escalation rule). The headless fallback if a terminal stays unreachable past 30 minutes: a detached `claude -p` session with a pre-generated session id, instructed to poll.
