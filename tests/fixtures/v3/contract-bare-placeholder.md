# CONTRACT — bare-placeholder fixture v1.0

Freeze fixture for W3.1-1's fail-closed half. Structurally identical to the
wrapped-span fixture, except the token below sits in *bare prose* with no
backticks around it — it is a genuine unfilled placeholder and freeze must
still catch it.

## 1. Vocabulary

The rotation run id is written as <id> here with no code span around it, so it
is a real placeholder, not a mention.

## 2. Schema

One deliberately tiny field, same as the wrapped-span fixture.

## 3. Definition of shipped

Freeze exits 1: the bare `<id>` above is a placeholder token in a frozen
contract.

## Changelog

- v1.0 — initial bare-placeholder freeze fixture.
