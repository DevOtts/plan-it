# Fixture: triage-closed

Consumed by: **T-V4B2-03** (`tests/v4/core/triage-closed.mjs`).
Positive fixture: three named runs (`skip`, `build-instead`,
`owner-decision`), each with `triage.memo` present on disk under `memos/` —
`state` accepts the transition and prints `state: closedWithoutPlan —
CLOSED_WITHOUT_PLAN` / `next events: (final state)`.
