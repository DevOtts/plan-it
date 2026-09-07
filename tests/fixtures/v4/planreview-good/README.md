# Fixture: planreview-good

Consumed by: **T-V4B2-08** / **C-E7-03** (`tests/v4/core/mode-consistency.mjs`).
Positive fixture: PLAN-REVIEW.md carries the ack line, G2/G3 recorded via
`planReview.meta.records`, one default `contradicted:true` matched by id in
`gates.G4.contradictions[]` and one `contradicted:false` — accepted (a
partial contradiction is not all-or-nothing).
