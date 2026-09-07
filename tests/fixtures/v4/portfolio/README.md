# Fixture: portfolio

Consumed by: **T-V4B3-08, 09, 11** / **C-E9-04, C-E9-05, C-E9-06**
(`tests/v4/core/archive-moves.mjs`, `runs-list.mjs`).
Two named runs: `alpha` (state `done`, archivable) and `beta` (state
`discovery`, non-terminal — `archive beta` must refuse, and `archive beta
--force` is a usage error since the flag does not exist).
