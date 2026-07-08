# Fixture: conventions-present

Consumed by: **T-A3-A1** / case A1 (`testconv` verb — POSITIVE case, not a
violation).
Satisfies: CLAUDE.md already has the `<!-- plan-it:test-conventions -->`
block → `testconv` should exit 0 and emit a receipt.

Contents:
- `CLAUDE.md` — well-formed test-conventions block.
- `.plan-it/state.json` — matching `testConventions.registered: true` receipt.
