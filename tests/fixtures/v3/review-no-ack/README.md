# Fixture: review-no-ack

Consumed by: **T-A4-B2** / case B2 (`state` subcommand's FD-2 extension).
Violates: `delivery/TEST-CONTRACT-REVIEW.md` is present but lacks the
`Reviewed-by: <name> <date>` line → rejected.

Contents:
- `delivery/TEST-CONTRACT-REVIEW.md` — no ack line.
- `.plan-it/state.json` — `gates.G2.approved: true`.
