# Fixture: mirror-stale

Consumed by: **T-V4B4-02** / **C-E2-06** (`node .../gate-check.mjs mirror
tests/fixtures/v4/mirror-stale/CONTRACT.md
tests/fixtures/v4/mirror-stale/CONTRACT.html`). `CONTRACT.html`'s stamp was
computed against an earlier byte of `CONTRACT.md` (tampered source since) —
exit 2 (MIRROR_STALE), naming both hashes. `CONTRACT.rerendered.html`
carries a fresh stamp matching the current bytes — exit 0 (recovery is
mechanical: re-render).
