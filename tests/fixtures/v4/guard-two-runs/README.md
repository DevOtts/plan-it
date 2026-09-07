# Fixture: guard-two-runs

Consumed by: **T-V4B3-13** / **C-E9-07** (`tests/v4/core/guard-named-run.mjs`,
both shipped guard copies). `v4.state.json` is frozen (`contract.version:
"1.0-draft"`) and governs `delivery/v4/` via `run.deliveryRoot`;
`state.json` is the unfrozen generic covering everything else. A write
under `delivery/v4/prds/` is ALLOWED (governed by the frozen named run); a
write under `delivery/other/prds/` is DENIED, naming `.plan-it/state.json`
— the longest `deliveryRoot` prefix wins.
