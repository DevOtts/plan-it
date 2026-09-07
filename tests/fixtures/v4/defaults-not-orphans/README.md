# Fixture: defaults-not-orphans

Consumed by: **T-V4B4-17** / **C-E8-01** (AMD-7, `tests/v4/core/reconcile-default-ids.mjs`).
`prd-fixture.md` cites `R2` and `R10` as rationale — both recorded in
`.plan-it/state.json`'s `gates.G2.defaults[].id` (`R1`…`R12`) — plus a
genuinely orphaned `R99`. `reconcile --dir` must NOT flag R2/R10 (they are
recorded defaults, not PRD requirements the §5/3.0.1 grammar collision would
otherwise misread) and MUST flag R99. With the defaults list emptied, all
three are reported (verified against a temp copy, not this checked-in
fixture).
