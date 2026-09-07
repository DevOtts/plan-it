# Fixture: draft-header

Consumed by: **T-V4B2-13** / **C-E7-05** (`freeze tests/fixtures/v4/draft-header/delivery/CONTRACT.md` — no `--draft`, expects
"draft cannot be final") and **T-V4B2-14** (`tests/v4/core/freeze-draft.mjs`,
`freeze --draft --dir tests/fixtures/v4/draft-header` — expects exit 0,
casesReviewed skipped). `.plan-it/state.json` carries `casesReviewed:false`
and a non-empty `gates.G2.defaults`.
