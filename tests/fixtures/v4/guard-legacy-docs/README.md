# Fixture: guard-legacy-docs

Consumed by: **T-V4B3-15** / **C-E9-07** (`tests/v4/core/guard-named-run.mjs`,
both shipped guard copies). No `deliveryRoot` anywhere — only the legacy
`docs/implementation/eng/` layout with `.plan-it/eng.state.json`
(unfrozen). A write under `docs/implementation/eng/prds/` must still
resolve `eng.state.json` and DENY (regression: the legacy match keeps
working once the deliveryRoot scan finds nothing).
