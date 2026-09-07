# Fixture: mirror-embed-changed

Consumed by: **T-V4B4-05** / **C-E2-06** (`tests/v4/core/mirror-stale.mjs`).
`X.md` itself is unchanged and fresh; `embed.md` (referenced via
`planit-embeds`) changed after the stamp — exit 2 (MIRROR_STALE) naming the
embed's relpath specifically, not the source.
