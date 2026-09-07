# Fixture: mirror-malformed

Consumed by: **T-V4B4-04** / **C-E2-07** (`tests/v4/core/mirror-stale.mjs`).
`X.html`'s `planit-source` stamp carries a 40-hex hash (not 64) — exit 1
naming "malformed stamp", never exit 2 (a structural defect, not
staleness).
