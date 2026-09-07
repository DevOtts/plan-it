# Fixture: disposition-malformed

Consumed by: **T-V4B4-14** / **C-E8-01** (`tests/v4/core/disposition-good.mjs`).
Disposition cell `deferred: later` matches none of the closed grammar
(`backlog-with-reason:` / `owner-gated:` / `IMPLEMENTED-NOT-VERIFIED:`) —
exit 1 naming the row and the missing-disposition reason. Corrected in a
temp copy (`owner-gated: Fernando Ott`), `reconcile` re-verifies to exit 0
(recovery).
