# plan-it v3 — STATUS board

Vocabulary (binding, W4): NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED (case ID + run-output ref required).
Tallies are computed by `gate-check reconcile` — never hand-edit counts here (W5).

| lane | deliverable | status | evidence |
|---|---|---|---|
| Squad A | prd-1 / epics-1 (gate-check verbs & FD enforcement) | VERIFIED | B3-map audit: 18/18 IDs bound, grep sweep 2026-07-08 (decisions.md) |
| Squad B | prd-2 / epics-2 (statechart, preflight & tiering) | VERIFIED | B3-map audit: 14/14 IDs bound, grep sweep 2026-07-08 (decisions.md) |
| Squad C | prd-3 / epics-3 (vocab, packaging & release) | VERIFIED | B3-map audit: 18/18 IDs bound, grep sweep 2026-07-08 (decisions.md) |
| Wave 0 | fixture corpus + harness extension | VERIFIED | T-A1-01 mechanism run 2026-07-08: `node tests/v3/fail-closed-sweep.mjs` exit 1, 25/25 gaps named (C-META-01 self-excluded by design); v2 baseline 26/26 pass; 41 fixture dirs / 85 files (computed); commits 557ed64..211b135 |
| Wave 1 | build epics | VERIFIED | All 3 epics merged --no-ff into v2/deterministic-core (E1 @ 1850628, E2 @ 5229c12, E3 @ 95d1535) + coordinator gap-closures. Coordinator re-run 2026-07-08 (decisions.md): `fail-closed-sweep` exit 0 = 25/25 enforcement rows mechanism-ready & fail-closed, 0 gaps/0 violations (C-META-01 self-excluded); `run-contract` exit 0 = v2 41/41 + v3 25/25; `mirror-check` exit 0 = 8 pairs; `machine-diff` exit 0 = additive-only (AMD-1) |
| Wave 2 | release & comms (v3.0.0 tag) | IN-PROGRESS | version triple-match 3.0.0 + CHANGELOG + parity + merge-to-main + tag underway |
