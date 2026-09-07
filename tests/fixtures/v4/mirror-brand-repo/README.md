# Fixture: mirror-brand-repo

Consumed by: **T-V4B4-05** / **C-E2-06** (`tests/v4/core/mirror-stale.mjs`).
`planit-brand: repo:brand/brand.json` in both variants — relpath resolved
against the twin's own directory (CONTRACT §4.3). `X-fresh.html`'s brand
stamp matches `brand/brand.json`'s current bytes — exit 0. `X-stale.html`'s
brand stamp is a stale hash — exit 2, naming "(brand)".
