# CONTRACT — envfacts-tool-only fixture

Version: v1.0 (frozen)
Tally: 2

## 1 · Vocabulary

| Term | Meaning |
|---|---|
| run | one execution of this fixture project |

## Cases

| ID | @tag | Case | run: |
|---|---|---|---|
| C-F1-01 | @case-machine | a node-based case, must NOT be flagged | `node tests/x.mjs` |
| C-F1-02 | @case-machine | a gh-based case, MUST be flagged | `gh pr list` |

## Changelog

- v1.0 — 2026-09-07 — fixture.
