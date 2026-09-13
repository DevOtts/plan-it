# Fixture: planreview-good

Consumed by: **T-V4B2-08** / **C-E7-03** (`tests/v4/core/mode-consistency.mjs`).
Positive fixture: PLAN-REVIEW.md carries the ack line, G2/G3 recorded via
`planReview.meta.records`, one default `contradicted:true` matched by id in
`gates.G4.contradictions[]` and one `contradicted:false` — accepted (a
partial contradiction is not all-or-nothing).

Also consumed by **T-L2-02** (drain-0912): `history` includes `render`
(the sole predecessor of `planReview` per machine.json) and
`delivery/v4/CONTRACT.html` is a stamped (`planit-source`) HTML twin on
disk — this fixture is meant to be genuinely "good" under the render/twin
invariant too, not just the G4 gate-payload checks.
