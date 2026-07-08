# Fixture Test Contract — v3 (manual-heavy)

Version: v1.0 — FROZEN 2026-07-08 (fixture copy)
Tally: COMPUTED — run `node scripts/gate-check.mjs contract` (never hand-edit counts; W5)

## Cases

| ID | @tag | Case (expected behavior) | run: |
|---|---|---|---|
| F-CASE-01 | @case-machine | Fixture sample case one | `node tests/v3/sample-one.mjs` |
| F-CASE-02 | @case-machine | Fixture sample case two | `manual:no automated harness for this class` |
| F-CASE-03 | @case-machine | Fixture sample case three | `manual:same reason as F-CASE-02` |

## Invariants

- `manual:` share must stay ≤30% of total rows; here 2/3 ≈ 67% — deliberately over the gate.

## Changelog

- v1.0 — 2026-07-08 — fixture stub for gate-check `contract` verb testing.
