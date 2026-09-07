# Fixture: portfolio-archived

Consumed by: **T-V4B3-10, 12** / **C-E9-05** (`archive-moves.mjs`,
`runs-list.mjs`). A live, terminal `alpha` run alongside an already-archived
`.plan-it/done/alpha.state.json` (same slug) — `archive alpha` must refuse
because the destination exists (not because the source is non-terminal);
`runs` lists both rows, one `archived: yes`, computed `1 archived`.
