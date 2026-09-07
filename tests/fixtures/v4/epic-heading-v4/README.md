# Fixture: epic-heading-v4

Consumed by: **T-V4B3-17** / **C-W3-01** (`tests/v4/core/epic-heading-grammar.mjs`).
`delivery/epics/e.md` carries a bare `## V4B1 — sample` heading (no leading
"Epic" word) with no Tier Table — the 3.0.1 heading grammar (`[A-Z]\d+`)
cannot see it at all (heading invisible, `reconcile` would exit 0); the
widened v4 grammar (`[A-Z]{1,3}\d+[A-Z]?\d*`) does, so `reconcile --dir
<fx>` fails naming `C-W3-01` and `V4B1`.
