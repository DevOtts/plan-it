# Fixture: guard-broken-named

Consumed by: **T-V4B3-15** / **C-E9-07** (`tests/v4/core/guard-named-run.mjs`,
both shipped guard copies). The only `.plan-it/*.state.json` file is
malformed JSON (`{not json`) — the deliveryRoot scan must skip it silently
(never throw) and, finding no other governing run, ALLOW (fail-open).
