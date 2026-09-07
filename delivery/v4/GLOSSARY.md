# GLOSSARY.md — plan-it v4 package

Every ID and acronym used in this package, one line each. Static plan-it vocabulary first (same every run), then the IDs this run minted. Human-facing pages embed this as a collapsed panel; the handoff lint fails on any ID missing here.

## plan-it vocabulary (static)

| ID | Expansion | Where defined |
|---|---|---|
| plan-it | the planning front-end: fuzzy demand → delivery package | SKILL.md |
| build-it | the autonomous build engine that consumes the package | SKILL.md — Composes with |
| review-it | the independent verification leg (runs the Test Contract) | README — plan-it × build-it |
| conclude-it | the session-close ritual; ships the ancestor of the v4 renderer | ~/.claude/skills/conclude-it |
| DoD | Definition of Done — the numbered, individually verifiable criteria | SKILL.md Phase 1 |
| PRD | Product Requirements Document — one per squad | templates.md PART B |
| epic | a buildable unit ending in a binding Test Contract | templates.md PART B |
| Test Contract | up to ~20 cases with expected outputs registered at planning time; DoD = 100% pass | SKILL.md — The Test Contract |
| CONTRACT | the frozen shared law squads build against (vocabulary, schema, interfaces, ownership) | SKILL.md Rule 1 |
| squad | one build lane with disjoint files, usually one session | 00-program-plan.md |
| wave | a group of epics built together; `Wn` | 00-program-plan.md |
| G0 | gate: anamnesis — the up-front questionnaire (new in v4) | CONTRACT §3.1 |
| G1 | gate: scope — size, shape, topology, DoD | SKILL.md Phase 2 |
| G2 | gate: decisions — the batched judgment calls with recommendations | SKILL.md Phase 7 |
| G3 | gate: freeze — "specs aligned, proceed to the delivery package?" | SKILL.md Phase 8 |
| G4 | gate: plan review — the single review-and-contradict round (new in v4) | CONTRACT §3.1 |
| G-n | a governance rule inside a CONTRACT (dash: rule; no dash: gate) | CONTRACT §6 |
| size S/M/L | how much gets written: single feature / multi-feature / from-scratch program | SKILL.md Phase 2 |
| shape 1–5 | the package form: multi-doc + delivery / single-file PRD / research→locked architecture→phase PRDs / numbered PRD-NN / refactor catalog | templates.md PART D |
| topology | how the build runs: solo · orchestrator+squads · headless | CONTRACT §1 |
| mode | autonomous-draft (default) or guided | CONTRACT §1 |
| [REAL] | a test case needing a live target; never VERIFIED on a mock | formats.md — Test Contract |
| INV / IMPLEMENTED-NOT-VERIFIED | built, but the proving case could not run | formats.md §7 |
| NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED | the closed status vocabulary | gate-check W4 |
| disposition | what happens to a non-green item at close: backlog-with-reason · owner-gated · IMPLEMENTED-NOT-VERIFIED | CONTRACT §5 |
| FD-1 | founder mandate: test-convention discovery registered in CLAUDE.md | CHANGELOG 3.0.0 |
| FD-2 | founder mandate: pre-freeze case review (TEST-CONTRACT-REVIEW.md) | CHANGELOG 3.0.0 |
| W1–W6 (CHANGELOG) | the six v3 write-time invariants (contract hygiene, preflight, tiers, vocabulary, computed counts, kickoff pinning) — not build waves | CHANGELOG 3.0.0 |
| W5 | v3 write-time invariant 5 (computed counts) as cited by `gate-check` output — not a wave of this run | CHANGELOG 3.0.0 |
| W6 | v3 write-time invariant 6 (kickoff pinning) as cited by `gate-check` output — not a wave of this run | CHANGELOG 3.0.0 |
| D4 (CHANGELOG) | the v3 adversarial-depth ruling behind the `adversary` verb — not this run's D4 ruling | CHANGELOG 3.0.0 |
| AMD-n | a dated amendment to a frozen contract | delivery/decisions.md |
| AMD-1 | v3 amendment (2026-07-08): T-E1-05 gate-count precedent | delivery/decisions.md |
| AMD-2 | v3 amendment: mirror-pair count precedent | delivery/decisions.md |
| AMD-3 | v3 amendment (3.0.x) | delivery/decisions.md |
| xhigh | Claude Code's highest `/effort` reasoning setting | SKILL.md — Autonomy posture |
| CDP | Chrome DevTools Protocol — drives UI test cases | formats.md §4 |
| ATDD / BDD | Acceptance-Test-Driven / Behaviour-Driven Development | SKILL.md — The Test Contract |
| SbE / EDD | Specification by Example / Eval-Driven Development | SKILL.md — The Test Contract |
| twin | the `<NAME>.html` rendered beside a canonical `<NAME>.md` | CONTRACT §1 |
| manifest | the JSON a low-tier author writes for the renderer (`planit-report/1`) | CONTRACT §4.2 |
| stamp | `<meta name="planit-*">` provenance in a twin (`<relpath> sha256=<hash>`) | CONTRACT §4.3 |
| deliveryRoot | the repo-relative folder a run's package lives in | CONTRACT §1 |
| tier top/mid/low | model tiers resolved at execution time; never a model ID | RUN-POLICY |
| mirror pair | a root file and its byte-identical plugin copy (11 in v4) | gate-check mirror-check |
| machine-diff | the additive-only check of a live machine against a pinned baseline | gate-check |
| WCAG | Web Content Accessibility Guidelines — the contrast ratios cited for brand tokens | 01-findings §2.2 |

## This run's IDs (generated 2026-09-07)

| ID | Expansion | Where defined |
|---|---|---|
| E1 | scope brief: the human-readable explanation of size, shape and topology rendered before gate G1 | delivery/v4/KICKOFF.md |
| E2 | HTML report layer: the zero-dependency renderer and report-family kinds with provenance stamps | delivery/v4/CONTRACT.md §4 |
| E3 | decision queue: the DECISIONS/PLAN-REVIEW kind with ruled, defaults, authorizations and owner actions | delivery/v4/CONTRACT.md §2 |
| E4 | build topology: the user's choice at G1 with plan-it's recommendation; solo · orchestrator+squads · headless | delivery/v4/KICKOFF.md |
| E5 | show-don't-describe: enumerating the honest states of every surface (good, empty, misconfigured) | delivery/v4/CONTRACT.md §3 |
| E6 | triage + measurement: the triage verdict determines CLOSED_WITHOUT_PLAN exit; measurements are read-only or say they are not | delivery/v4/CONTRACT.md §3 |
| E7 | anamnesis + review round: the up-front questionnaire (G0) and single review-and-contradict gate (G4) | delivery/v4/CONTRACT.md §3 |
| E8 | residual disposition: every non-green item at close gets one of backlog-with-reason · owner-gated · IMPLEMENTED-NOT-VERIFIED | delivery/v4/DECISIONS.md — Defaults |
| E9 | named runs: every plan-it execution has a slug; state lives in `.plan-it/<slug>.state.json` | delivery/v4/CONTRACT.md §1 |
| E10 | readable acronyms: the glossary seed copied at intake; every acronym explained on first use | delivery/v4/GLOSSARY.md |
| D1 | autonomous-draft is the default mode; guided selectable at anamnesis | DECISIONS.md — Ruled |
| D2 | brand = the target repository's brand guideline if present, else DevOtts' own default at `assets/brand/` | DECISIONS.md — Ruled |
| D3 | HTML twin beside its markdown, always created locally by default, opened in Chrome only at human gates, never a claude.ai artifact | DECISIONS.md — Ruled |
| D4 | topology is the user's choice at G1 with plan-it's recommendation shown | DECISIONS.md — Ruled |
| D5 | the copy-your-rulings block ships in 4.0 | DECISIONS.md — Ruled |
| D6 | all ten enhancements in 4.0.0 | DECISIONS.md — Ruled |
| D7 | v4 is built by an orchestrator + three squads + QA | DECISIONS.md — Ruled |
| R1 | CONTRACT frozen as v1.0-draft for the squads; PLAN-REVIEW records G2 and G3 answers in one stop; freeze bumps to v1.0; contradictions re-enter as amendments | DECISIONS.md — Defaults |
| R2 | "Owner decision" triage verdict exits to CLOSED_WITHOUT_PLAN with a decision memo and a reopen condition | DECISIONS.md — Defaults |
| R3 | typed `[DECIDED]/[CHANGED]/[CONFIRM: owner]` canonical in markdown; glyphs only as HTML decoration | DECISIONS.md — Defaults |
| R4 | optional `Deadline` column on decisions; owner actions with a deadline surface in the close-out report | DECISIONS.md — Defaults |
| R5 | orchestrator = top tier in RUN-POLICY | DECISIONS.md — Defaults |
| R6 | incidental findings in STATUS `## Log` bullets tagged `[incidental]`, never in the case tally | DECISIONS.md — Defaults |
| R7 | brand accents as chip backgrounds in light mode; muted text Steel; measured WCAG contrast | DECISIONS.md — Defaults |
| R8 | mirror pairs 8 → 11 (renderer, template, brand JSON) | DECISIONS.md — Defaults |
| R9 | mermaid 10.9.1 pinned on cdnjs, strict security, source shown as text when offline | DECISIONS.md — Defaults |
| R10 | the state file names the package folder; every verb derives paths from `run.deliveryRoot` | DECISIONS.md — Defaults |
| R11 | harness amendments AMD-4 (gate count) and AMD-5 (11 pairs), recorded like AMD-1/AMD-2 | DECISIONS.md — Defaults |
| R12 | renderer is a separate script (`scripts/build-report.mjs`), not a gate-check verb | DECISIONS.md — Defaults |
| A-1 | squads commit to `epic/v4*` branches; the orchestrator merges to `main` overnight without a per-merge ping | GATE.md — Answered at PLAN-REVIEW |
| A-2 | the orchestrator tags and pushes 4.0.0 and updates the marketplace entry once Definition of SHIPPED is green | GATE.md — Answered at PLAN-REVIEW |
| A-3 | QA opens Chrome on this Mac to look at rendered twins (`--open` at gates); headless fallback sessions allowed | GATE.md — Answered at PLAN-REVIEW |
| A-4 | the orchestrator commits the guard mirror fix applied during planning as its first W0 commit | GATE.md — Answered at PLAN-REVIEW |
| O-1 | remove the stale installs (`plan-it@plan-it` enablement, the `plan-it/` marketplace dir, user-level 2.1.0 skill) and install `plan-it@devotts` 4.0.0 | GATE.md — Still human, but NOT blocking |
| O-2 | read `delivery/v4/QA-REPORT.md` and give the tag/push go (A-2) | GATE.md — Still human, but NOT blocking |
| O-3 | ratify R7 (brand contrast deviation) or send the exact colours you want as text | GATE.md — Still human, but NOT blocking |
| O-4 | decide whether the six literal model-ID citations in the research records should be redacted to placeholders or stay as quoted evidence | GATE.md — Still human, but NOT blocking |
| W0 | orchestrator prep: commit the planning package, guard mirror fix, byte-pin the 3.0.1 machine, create worktrees, record amendments, copy GLOSSARY | 00-program-plan.md |
| W1 | three squads in parallel: all epics of each squad on their branches, each with its Test Contract 100% or IMPLEMENTED-NOT-VERIFIED with reason | 00-program-plan.md |
| W2 | integration: mirror pairs 11, root mirrors synced, version 4.0.0 across six sites, both harness literals in one merge, CHANGELOG 4.0.0 | 00-program-plan.md |
| W3 | QA: every C-E enforcement case and every T-epic case run against the merged tree; dogfood run; QA-REPORT.md delivered | 00-program-plan.md |
| W4 | release: tag 4.0.0, marketplace entry, README install note; conclude-it; ledger card written | 00-program-plan.md |
| SQ-A | renderer squad: zero-dependency renderer and report-family kinds, report-family reference, renderer tests (4 epics, 48 cases) | CONTRACT §2 |
| SQ-B | deterministic core squad: machine, gate-check verbs, guard, harness, fixtures (5 epics, 74 cases) | CONTRACT §2 |
| SQ-C | prose and packaging squad: SKILL, references, docs, README, CHANGELOG, versions (4 epics, 44 cases) | CONTRACT §2 |
| LG-n | live-grounding facts measured by the coordinator | research/00-main-thread-grounding.md |
| F-*n | research findings by stream (A renderer · B core · C prose · D precedents) | research/stream-*.md |
| D-A<n> · D-B<n> · D-C<n> | PRD-level design decisions per squad (renderer · core · prose), cited by every epic task | delivery/v4/prds/ |
| ab0c192 | the W0 commit that landed the v4 planning package and the guard mirror fix (A-4) | STATUS.md ## Log |
| V4A<n> · V4B<n> · V4C<n> | epic IDs per squad | delivery/v4/epics/ |
| C-E*-NN | enforcement case for enhancement n (`C-E<n>-NN`; 60 in the CONTRACT, computed) | CONTRACT ## Cases |
| T-*-NN | per-epic Test Contract case (`T-<EID>-NN`, e.g. T-V4B4-17) | delivery/v4/epics/ |
| T-E*-NN | v2/v3 harness case inside `tests/run-contract.mjs` (e.g. T-E1-05 gate count, T-E5-01 version, T-E5-02 mirror pairs) | tests/run-contract.mjs |
| C-W*-NN · C-META-NN | v3 CONTRACT cases and meta-cases (e.g. C-W5-02 orphan scan, C-W2-03 probe blacklist) | delivery/v3/CONTRACT.md |
| SHA-256 | the hash function behind every pin and stamp (`sha256=<64-hex>`) | CONTRACT §4.3 |
| AMD-10 | orchestrator amendment 2026-09-07 (CONTRACT v1.3): one GLOSSARY family grammar for lint and renderer; case T-V4A3-12 | delivery/decisions.md |
| AMD-9 | orchestrator amendment 2026-09-07 (epic level): renderer stamp relpaths twin-relative + CSS scan scoped; cases T-V4A1-13/14 | delivery/decisions.md |
| AMD-8 | orchestrator amendment 2026-09-07 (CONTRACT v1.2): disposition required only for IMPLEMENTED-NOT-VERIFIED rows; `mirror --dir` skips `resources/` | delivery/decisions.md |
| AMD-7 | orchestrator amendment 2026-09-07 (CONTRACT v1.1): reconcile orphan scan skips recorded default IDs; case T-V4B4-17 | delivery/decisions.md |
| AMD-6 | orchestrator amendment 2026-09-07: two `run:` mechanism corrections in epics-c-prose.md (T-V4C3-06 awk range, T-V4C3-08 research exclusion) | delivery/decisions.md |
| AMD-4 | harness amendment: gate count bound to the v2 baseline; required for the machine-diff check | delivery/decisions.md |
| AMD-5 | harness amendment: mirror pairs 8 → 11; binds `scripts/build-report.mjs`, `scripts/report-template.html`, `assets/brand/default.brand.json` | delivery/decisions.md |
| CLOSED_WITHOUT_PLAN · REVIEW_CONTRADICTED · RENDERED_PARTIAL · RENDER_FAILED · MIRROR_STALE · MIRROR_REJECTED · HTML_UNSTAMPED · ESCALATED · WRITE_DENIED · ARCHIVE_REFUSED | failure and recovery states of the v4 core-logic models | CONTRACT §3 |
| planit-report/1 · planit-brand/1 | the manifest and brand token schemas | CONTRACT §4 |
| 7fcff27 | the commit that added named-state resolution to the root guard only | 01-findings §2.9 |
| P2-11 | the owner ruling (2026-08-26) that made worktrees-only a plan-it/build-it enhancement | LG-16 |
