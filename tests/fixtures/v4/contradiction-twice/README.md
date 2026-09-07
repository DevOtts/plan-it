# Fixture: contradiction-twice

Consumed by: **T-V4B2-11** / **C-E7-06** (`tests/v4/core/mode-consistency.mjs`).
`escalated.state.json` is positive: default `D1` contradicted twice, the
second entry `escalated:true` with `card: "cards/D1-escalation.md"` present
on disk — accepted, stdout prints `ESCALATED: D1 → cards/D1-escalation.md`.
`no-card.state.json` violates: contradicted twice, no `escalated`/`card` —
REJECTED ("contradicted twice without ESCALATED card — never re-default").
