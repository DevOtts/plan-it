# Fixture: glossary-good

Consumed by: **T-V4B4-09** / **C-E10-01** (`tests/v4/core/glossary-lint.mjs`).
Positive fixture: `GLOSSARY.md` rows cover a family pattern over a numeric
range (`R<n>`), a literal ID that looks like a range but isn't (`P2-11` —
AMD-11: resolved literal-first, never expanded as the range `P2…P11`), a
`·`-list (`AMD-4 · AMD-5`), and two more family patterns (`C-E<n>-NN`,
`V4B<n>`, `T-*-NN`); `KICKOFF.md` mentions instances of every one, plus a
code-span token (`` `Z9-99` ``) that is a mention, never scanned. `glossary`
exits 0 with the computed resolved-count in its ok-line.
