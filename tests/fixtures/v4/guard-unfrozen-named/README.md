# Fixture: guard-unfrozen-named / guard-unfrozen-named-frozen

Consumed by: **T-V4B3-14** / **C-E9-08**
(`tests/v4/core/guard-unfrozen-named.mjs`, both shipped guard copies). Only
a named run exists (`v4.state.json`, `run.deliveryRoot: "delivery/v4/"`).
`guard-unfrozen-named/` has `contract.version: null` — DENIED, reason names
`v4.state.json` (not a generic name). `guard-unfrozen-named-frozen/` is the
same run with `contract.version` recorded (`"1.0-draft"`) — the identical
write is ALLOWED (recovery: freeze, record the version, retry).
