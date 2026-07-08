# Fixture: conventions-declined

Consumed by: **T-A3-A4** / case A4 (`testconv` verb — POSITIVE case).
Satisfies: user declined registration → receipt records
`declined: true, by: "user"` + date; gate passes (FD-1 requires registering
the *disposition*, not requiring adoption).

Contents:
- `.plan-it/state.json` — `testConventions.declined: true, by: "user"`.
- `CLAUDE.md` — no block (declined path doesn't require one).
