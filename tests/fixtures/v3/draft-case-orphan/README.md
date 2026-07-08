# Fixture: draft-case-orphan

Consumed by: **T-A4-B3** / case B3 (`reconcile`'s draft→binding case map).
Violates: `delivery/TEST-CONTRACT-REVIEW.md` names draft case `Z9`, which is
mapped in no epic's Binding Test Contract table under
`delivery/v3/epics/` and has no dated `delivery/decisions.md` drop entry.

Contents:
- `delivery/TEST-CONTRACT-REVIEW.md` — includes orphaned draft case `Z9`.
- `delivery/v3/epics/epics-w.md` — binds A1-A4 only, never mentions `Z9`.
- (deliberately) no `delivery/decisions.md` in this fixture dir.
