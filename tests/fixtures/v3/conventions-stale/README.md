# Fixture: conventions-stale

Consumed by: **T-A3-A3** / case A3 (`state` subcommand's stale-receipt branch).
Violates: state.json claims `testConventions.registered: true` but
`CLAUDE.md` no longer has the block → must fail naming "stale receipt —
re-verify, not silent pass".

Contents:
- `.plan-it/state.json` — stale `testConventions.registered: true` receipt.
- `CLAUDE.md` — no block.
