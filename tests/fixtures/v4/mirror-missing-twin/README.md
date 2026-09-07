# Fixture: mirror-missing-twin

Consumed by: **T-V4B4-06** / **C-E2-05** (`node .../gate-check.mjs mirror
--dir tests/fixtures/v4/mirror-missing-twin/delivery --require-html`).
`delivery/CONTRACT.md`+`.html` is a fresh pair (reported fresh — a partial
result). `KICKOFF.md` is family-kind with no `.html` twin — under
`--require-html`, exit 2 naming `missing twin: KICKOFF.md` and `C-E2-05`.
`notes.md` is non-family with no twin — never named, never fails, with or
without `--require-html`.
