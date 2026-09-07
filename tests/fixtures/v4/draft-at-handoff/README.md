# Fixture: draft-at-handoff

Consumed by: **T-V4B2-09** / **C-E7-04** (`state tests/fixtures/v4/draft-at-handoff/.plan-it/v4.state.json`).
Violates: `state: "handoff"` with `contract.version: "1.0-draft"` — REJECTED
("draft contract cannot hand off", G-13). The same file with
`contract.version: "1.0"` exits 0 (verified by hand, no separate file
checked in).
