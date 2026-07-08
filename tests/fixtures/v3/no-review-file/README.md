# Fixture: no-review-file

Consumed by: **T-A4-B1** / case B1 (`state` subcommand's FD-2 extension).
Violates: `state.gates.G2.approved === true` but no
`delivery/TEST-CONTRACT-REVIEW.md` exists in this fixture dir →
G2_ANSWERED without the review file on disk must be rejected.

Contents:
- `.plan-it/state.json` — `gates.G2.approved: true`.
- (deliberately) no `delivery/TEST-CONTRACT-REVIEW.md`.
