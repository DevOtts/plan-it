# Fixture: mirror-md-missing

Consumed by: **T-V4B4-04** / **C-E2-07** (`tests/v4/core/mirror-stale.mjs`).
`X.html`'s `planit-source` stamp names a relpath (`nowhere.md`) that does
not exist relative to the twin's directory — exit 1 naming "source not
found", never exit 2.
