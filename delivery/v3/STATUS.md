# plan-it v3 — STATUS board

Vocabulary (binding, W4): NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED (case ID + run-output ref required).
Tallies are computed by `gate-check reconcile` — never hand-edit counts here (W5).

| lane | deliverable | status | evidence |
|---|---|---|---|
| Squad A | prd-1 / epics-1 (gate-check verbs & FD enforcement) | VERIFIED | B3-map audit: 18/18 IDs bound, grep sweep 2026-07-08 (decisions.md) |
| Squad B | prd-2 / epics-2 (statechart, preflight & tiering) | VERIFIED | B3-map audit: 14/14 IDs bound, grep sweep 2026-07-08 (decisions.md) |
| Squad C | prd-3 / epics-3 (vocab, packaging & release) | VERIFIED | B3-map audit: 18/18 IDs bound, grep sweep 2026-07-08 (decisions.md) |
| Wave 0 | fixture corpus + harness extension | VERIFIED | T-A1-01 mechanism run 2026-07-08: `node tests/v3/fail-closed-sweep.mjs` exit 1, 25/25 gaps named (C-META-01 self-excluded by design); v2 baseline 26/26 pass; 41 fixture dirs / 85 files (computed); commits 557ed64..211b135 |
| Wave 1 | build epics | IN-PROGRESS | started 2026-07-08; epic/e1-gatecheck-fd, epic/e2-statechart-tiering, epic/e3-vocab-packaging-release off v2/deterministic-core |
| Wave 2 | release & comms (v3.0.0 tag) | NOT-STARTED | — |
