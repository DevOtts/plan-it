# Fixture: portfolio-broken

Consumed by: **T-V4B3-12** / **C-E9-06** (`tests/v4/core/runs-list.mjs`).
One parseable run (`good`, state `discovery`) beside one unparseable file
(`broken.state.json`, `{not json`) — `runs` exits 1, still lists `good`,
and names the broken file with `ERROR` (partial failure, named — never a
silent skip).
