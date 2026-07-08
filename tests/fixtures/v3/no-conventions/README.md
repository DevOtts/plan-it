# Fixture: no-conventions

Consumed by: **C-W1-01** (`contract` verb), **T-A3-A2** (`testconv` verb).
Violates: CONTRACT.md enforcement row C-W1-01 — "`contract` verb FAILS when
target repo has tests but CLAUDE.md lacks `<!-- plan-it:test-conventions -->`
block."

Contents:
- `CLAUDE.md` — no test-conventions block.
- `tests/dummy.test.js` — makes the repo "have tests".
- `delivery/v3/CONTRACT.md` — minimal contract copy for the verb to lint.
