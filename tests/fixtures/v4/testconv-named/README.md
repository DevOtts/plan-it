# Fixture: testconv-named

Consumed by: **T-V4B3-02, 03** / **C-E9-02** (`tests/v4/core/testconv-named.mjs`,
run against temp copies since `testconv` writes to disk). CLAUDE.md already
carries the conventions block; `.plan-it/v4.state.json` is the only state
file present. `testconv --dir … --run v4` writes the receipt into
`v4.state.json` and never creates a generic `.plan-it/state.json` beside it;
without `--run`, the single named file resolves the same way; with a copied
generic file alongside it (no `--run`), the generic file is written instead
(legacy behaviour preserved).
