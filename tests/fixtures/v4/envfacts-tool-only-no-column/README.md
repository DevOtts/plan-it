# Fixture: envfacts-tool-only-no-column

Consumed by: **T-V4B4-15** / **C-E6-03** (`tests/v4/core/envfacts-tool-only.mjs`).
`ENV-FACTS.md` records the same `node scripts/check-gh.mjs` ABSENT probe
but with NO `tool` column (legacy 4-column shape) — only `node` (argv[0])
is blacklisted; a case whose `run:` is literally `scripts/check-gh.mjs
--self-check` is never flagged (LG-7: the old behaviour blacklisted every
argv token, not just argv[0]).
