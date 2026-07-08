# plan-it v3 — Program Plan (M-shape, folded backbone)

Law: `delivery/v3/CONTRACT.md` **v1.0 FROZEN 2026-07-07** (SHA-256 pinned in `.plan-it/state.json`). Design: `delivery/design/v3-architecture.md`. Approved cases: `delivery/TEST-CONTRACT-REVIEW.md` (Reviewed-by Fernando Ott 2026-07-07). Decisions log: `delivery/decisions.md`.

## Squads (Phase 9 — parallel planning lanes, disjoint files)

| squad | lane | themes / areas | writes |
|---|---|---|---|
| A | gate-check verbs & FD enforcement | W1 contract hygiene, W5 computed tallies, areas A (FD-1 testconv), B (FD-2 review gate) | `delivery/v3/prds/prd-1-gatecheck-fd.md`, `delivery/v3/epics/epics-1-gatecheck-fd.md` |
| B | statechart, preflight & tiering | W2 env preflight, W3 model tiering, areas E (statechart additions), G (RUN-POLICY enforcement) | `delivery/v3/prds/prd-2-statechart-tiering.md`, `delivery/v3/epics/epics-2-statechart-tiering.md` |
| C | guard vocab, kickoff pinning, packaging & release | W4 status vocabulary, W6 kickoff+packaging, areas C (pluginlint / EC-D7), D (mirror integrity), F (release & comms / EC-D8) | `delivery/v3/prds/prd-3-vocab-packaging-release.md`, `delivery/v3/epics/epics-3-vocab-packaging-release.md` |

## Waves

- **Wave 0** — fixture corpus + `tests/run-contract.mjs` harness extension (violating fixtures for every enforcement row; C-META-01 sweep).
- **Wave 1** — squads A, B, C epics in parallel on `epic/<eid>-<slug>` branches off `v2/deterministic-core`.
- **Wave 2** — release & comms epic (squad C's last epic): version triple-match 3.0.0, mirror-check, marketplace parity, CHANGELOG, LinkedIn post. Merges to `main`, tags v3.0.0.

## Guardrails (binding)

1. Protected core untouched: freeze mechanism, `[REAL]` Test Contracts, `gate-check.mjs` existing verbs' semantics, KICKOFF read-order, evidence ledgers, batched decision gate, statechart deterministic core (machine.json pinned to `fc6abc8` copy — case E1). All v3 verbs/states are additive.
2. Every approved case ID (24 draft + 26 enforcement) maps to ≥1 binding per-epic case or a dated drop entry in decisions.md (case B3). No silent drops.
3. Counts computed, never typed (W5). No hardcoded model IDs (W3). Status vocabulary per contract (W4).
4. Scope ceiling: contract cases only; gaps surface as PROPOSED-AMENDMENT to the coordinator, never as squad-side contract edits.
5. RUN-POLICY block in CONTRACT.md governs tiering for execution; KICKOFF pins repo path + SHA + contract SHA-256 (W6).

## Definition of shipped

See CONTRACT.md → PROGRAM CONTRACT → "Definition of SHIPPED". 100% binding-case pass is the DoD; IMPLEMENTED-NOT-VERIFIED ships nothing.
