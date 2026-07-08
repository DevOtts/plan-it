# CONTRACT — wrapped-span fixture v1.0

Freeze fixture for W3.1-1. A line-wrapped inline code span is a *mention*, not
a placeholder, so `stripCode` must strip it even though it straddles a newline.
This whole contract is otherwise freeze-valid (version header, three sections,
changelog, no bare placeholders).

## 1. Vocabulary

The resume verb, when the line wraps, reads `vault rotate
--resume <id>` — the `<id>` token lives inside that backtick span, so it is
described, not left blank. Before W3.1-1 the no-newline `stripCode` regex left
this span intact and the placeholder scan false-failed on it.

## 2. Schema

One deliberately tiny field, enough to make the fixture a structurally real
contract without carrying weight it does not need.

## 3. Definition of shipped

Freeze exits 0: the wrapped span above is stripped, so no placeholder token
survives the scan.

## Changelog

- v1.0 — initial wrapped-span freeze fixture.
