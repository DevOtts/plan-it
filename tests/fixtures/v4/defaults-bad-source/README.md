# Fixture: defaults-bad-source

Consumed by: **T-V4B2-05** / **C-E7-07** (`tests/v4/core/mode-consistency.mjs`).
`bad.state.json` violates: a default row (`D2`) with `source: "guessed"` —
REJECTED naming the row id. `good.state.json` is the positive twin: every
row `source: "recommended"` — accepted.
