# v3 Test Contract — DRAFT CASES FOR YOUR REVIEW (FD-2 exhibit @ G2)

**Status: DRAFT — not frozen.** Per FD-2 these are surfaced BEFORE freeze: edit lines
directly, strike cases, add cases, then answer G2. At Phase 9 squads refine these into
binding per-epic [REAL] Test Contracts; refinement may split/rename but NOT silently
drop a case reviewed here (drops require a dated decisions.md entry).
Harness: every gate-check case runs in `tests/run-contract.mjs` + a fixture under
`tests/fixtures/` (Stream D F4 — extend, don't invent a new mechanism).

## A. FD-1 — test-convention discovery (`gate-check testconv`)
- A1 [REAL] Target repo CLAUDE.md already has a `plan-it:test-conventions` block → testconv exits 0, emits receipt into state.json.
- A2 [REAL] No block present → testconv exits 2 with "research → ask user → REGISTER" instruction; GROUNDED rejected until receipt exists.
- A3 [REAL] Receipt present but CLAUDE.md block later deleted → `gate-check state` flags stale receipt (re-verify, not silent pass).
- A4 [REAL] User declines registration → receipt records `declined-by-user` + date; gate passes (FD-1 says register *either way*).

## B. FD-2 — case review at G2 (`gate-check state` payload guard)
- B1 [REAL] G2_ANSWERED without delivery/TEST-CONTRACT-REVIEW.md on disk → rejected.
- B2 [REAL] Review file present but lacks the user-ack line (`Reviewed-by: <name> <date>`) → rejected.
- B3 [REAL] Phase-9 per-epic contracts: every draft case ID here maps to ≥1 binding case or a decisions.md drop entry → `gate-check handoff` verifies the map.

## C. Loader/metadata-parse (EC-D7 bug class) (`gate-check pluginlint`)
- C1 [REAL] SKILL.md frontmatter `description:` containing an unquoted colon → lint fails with the exact offending line.
- C2 [REAL] plugin.json missing any of name/version/description → fail; valid v2.1.0-shape file → pass.
- C3 [REAL] marketplace.json plugins[] entry whose `source` path does not exist on disk → fail.
- C4 [REAL] Frontmatter YAML parses but skill name ≠ directory name → fail (loader mismatch class).

## D. Mirror integrity (Stream D F1) (`gate-check mirror-check`)
- D1 [REAL] All eight shared root↔plugins/plan-it file pairs (4 files + 4 references/*.md) byte-identical → exit 0. [AMD-2 2026-07-08, approved Fernando Ott — source docs miscounted the enumerated set]
- D2 [REAL] Any pair drifts (1-byte change in plugin copy of machine.json) → exit 2 listing each drifted pair.
- D3 [REAL] mirror-check wired into the release epic checklist; CHANGELOG entry for v3.0.0 cannot be finalized with drift present.

## E. Statechart additions
- E1 [REAL] machine.json is an additive-only structural superset of the byte-pinned v2 regression copy tests/fixtures/v2/machine.v2.fc6abc8.json, verified by `gate-check machine-diff` (no v2 state/edge/guard renamed or removed) — regression pin. [AMD-1 2026-07-08, approved Fernando Ott — required by C-W2-01 preflight-in-machine.json]
- E2 [REAL] machine-replan.json validates against the same schema as machine.json; entry state ≠ `intake` collision; final state `done`.
- E3 [REAL] Phase-0 selector: `.plan-it/state.json` `machine` field absent → defaults to machine.json (v2 runs unaffected).
- E4 [REAL] freezeGate: known-gaps ledger with 1 undispositioned row → G3_APPROVED rejected (EC-B7); all rows fix/waive/case-ify → accepted.
- E5 [REAL] Credential checklist row `unprocured` without owner → G2 payload rejected; `GATED-with-owner` → accepted and copied into CONTRACT.md.

## F. Release & comms epic (EC-D8, inside contract)
- F1 [REAL] Version triple-match: plugin.json = SKILL.md header = CHANGELOG top entry = 3.0.0; machine.json `version` reconciled or explicitly waived by `--audit` (two-counter rule, Stream D F6).
- F2 [REAL] README install docs match the parallel-lifecycle pattern; marketplace claim matches G2 decision #1 outcome (aggregator built XOR claim softened).
- F3 [REAL] CHANGELOG has dated v3.0.0 section enumerating FD-1, FD-2 and each shipped backlog item by ID.

## G. RUN-POLICY block (backlog #8)
- G1 [REAL] CONTRACT.md contains `## RUN-POLICY` with tiering table + reap-on-merge + disk-AND-message delivery rule; `gate-check freeze` rejects a contract without it.
- G2 [REAL] Block content seeded from this run's G1 decisions (verbatim keys: coordinator/mechanical/judgment/escalate-on-struggle).

---
Reviewed-by: Fernando Ott 2026-07-07 — approved as-is at FD-2 gate (chat + file surfacing; 24 draft cases + 26 enforcement rows, zero strikes/edits). Binding refinement in Phase 9 may split/rename but not silently drop.
