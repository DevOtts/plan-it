# Fixture: glossary-unknown-id

Consumed by: **T-V4B4-08** / **C-E10-01** (`node .../gate-check.mjs glossary
tests/fixtures/v4/glossary-unknown-id/delivery`) and **T-V4B4-10** /
**C-E10-02** (`tests/v4/core/glossary-handoff.mjs`, via `handoff`).
`KICKOFF.md` mentions `T-A4-B1` (covered by the `T-*-NN` family row in
`GLOSSARY.md`) and `X9-77`, which has no row at all — exit 1 naming `X9-77`
with `file:line` and `C-E10-01`; `T-A4-B1` is never reported. Embedded in
`handoff` (step 8), the same finding appears exactly once.
