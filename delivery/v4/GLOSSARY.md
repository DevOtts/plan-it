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
| D4 (CHANGELOG) | the v3 adversarial-depth ruling behind the `adversary` verb — not this run's D4 ruling | CHANGELOG 3.0.0 |
| AMD-n | a dated amendment to a frozen contract | delivery/decisions.md |
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
| E1 … E10 | the ten v4 enhancements: scope brief · HTML report layer · decision queue · build topology · show-don't-describe · triage + measurement · anamnesis + review round · residual disposition · named runs · readable acronyms | V3-VS-V4-CORE-ENHANCEMENTS.html |
| D1 … D7 | Fernando's rulings on the analysis report (mode, brand, local HTML, topology choice, rulings block, release scope, build topology) | DECISIONS.md — Ruled |
| R1 … R12 | defaults the run applied at G2, to contradict at PLAN-REVIEW | DECISIONS.md — Defaults; 01-findings §6 |
| A-1 … A-4 | authorizations the build needs (branch commits, release tag, Chrome/headless, guard-fix commit) | DECISIONS.md — Open |
| O-1 … O-3 | owner actions only Fernando can do (stale installs, QA sign-off, brand ratification) | DECISIONS.md — Open |
| LG-1 … LG-18 | live-grounding facts measured by the coordinator | research/00-main-thread-grounding.md |
| F-A1 … F-A20 · F-B1 … F-B18 · F-C1 … F-C9 · F-D1 … F-D21 | research findings by stream (A renderer · B core · C prose · D precedents) | research/stream-*.md |
| SQ-A · SQ-B · SQ-C | the three build squads: renderer · deterministic core · prose and packaging | CONTRACT §2 |
| V4A<n> · V4B<n> · V4C<n> | epic IDs per squad | delivery/v4/epics/ |
| C-E<n>-NN | enforcement case for enhancement n (60 in the CONTRACT, computed) | CONTRACT ## Cases |
| T-<EID>-NN | per-epic Test Contract case | delivery/v4/epics/ |
| AMD-4 · AMD-5 | harness amendments: gate count bound to the v2 baseline; mirror pairs 8 → 11 | delivery/decisions.md |
| W0 … W4 | build waves: orchestrator prep · squads · integration · QA · release | 00-program-plan.md |
| CLOSED_WITHOUT_PLAN · REVIEW_CONTRADICTED · RENDERED_PARTIAL · RENDER_FAILED · MIRROR_STALE · MIRROR_REJECTED · HTML_UNSTAMPED · ESCALATED · WRITE_DENIED · ARCHIVE_REFUSED | failure and recovery states of the v4 core-logic models | CONTRACT §3 |
| planit-report/1 · planit-brand/1 | the manifest and brand token schemas | CONTRACT §4 |
| 7fcff27 | the commit that added named-state resolution to the root guard only | 01-findings §2.9 |
| P2-11 | the owner ruling (2026-08-26) that made worktrees-only a plan-it/build-it enhancement | LG-16 |
