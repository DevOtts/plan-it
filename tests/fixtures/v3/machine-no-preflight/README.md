# Fixture: machine-no-preflight

Consumed by: **C-W2-01** (`tests/v3/machine-shape.mjs`).
Violates: a byte-for-byte copy of the v2 baseline
`tests/fixtures/v2/machine.v2.fc6abc8.json` — no `preflight` state, no
`discovery→preflight` edge. Proves the shape-check actually discriminates
(the live `machine.json` must pass, this fixture must fail) rather than
passing everything unconditionally.

Contents:
- `machine.json` — copy of `tests/fixtures/v2/machine.v2.fc6abc8.json`.
