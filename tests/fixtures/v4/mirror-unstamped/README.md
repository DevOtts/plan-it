# Fixture: mirror-unstamped

Consumed by: **T-V4B4-03** / **C-E2-07** (`node .../gate-check.mjs mirror
tests/fixtures/v4/mirror-unstamped/X.md tests/fixtures/v4/mirror-unstamped/X.html`).
`X.html` is hand-authored — no `planit-source` meta at all — exit 1,
`HTML_UNSTAMPED` ⇒ `MIRROR_REJECTED`: hand-authored HTML is refused,
markdown is always the source.
