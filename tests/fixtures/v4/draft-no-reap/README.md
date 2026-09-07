# Fixture: draft-no-reap

Consumed by: **T-V4B2-14** (`tests/v4/core/freeze-draft.mjs`,
`freeze --draft --dir tests/fixtures/v4/draft-no-reap`).
Violates: same draft header as `draft-header/`, but the RUN-POLICY body
omits the `reap-on-merge` worktree rule — REJECTED (structural checks still
run under `--draft`).
