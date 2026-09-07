# Fixture: envfacts-tool-only

Consumed by: **T-V4B4-15** / **C-E6-03** (`tests/v4/core/envfacts-tool-only.mjs`).
`ENV-FACTS.md` records probe `node scripts/check-gh.mjs` as `ABSENT` with a
declared `tool: gh` (5th column). `delivery/CONTRACT.md` has two cases: one
`node tests/x.mjs` (must NOT be flagged) and one `gh pr list` (MUST be
flagged, naming `gh` and `C-E6-03`) — `contract --dir` blacklists only the
declared tool, never the unrelated `node` argv[0].
