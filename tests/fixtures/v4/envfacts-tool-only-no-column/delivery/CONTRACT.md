# CONTRACT — envfacts-tool-only-no-column fixture

Version: v1.0 (frozen)
Tally: 2

## 1 · Vocabulary

| Term | Meaning |
|---|---|
| run | one execution of this fixture project |

## Cases

| ID | @tag | Case | run: |
|---|---|---|---|
| C-F2-01 | @case-machine | argv[0] "node" — blacklisted (this probe wraps node with no tool declared) | `node tests/y.mjs` |
| C-F2-02 | @case-machine | argv[0] "scripts/check-gh.mjs" itself — must NEVER be blacklisted (only argv[0] of the probe, not the remaining tokens) | `scripts/check-gh.mjs --self-check` |

## Changelog

- v1.0 — 2026-09-07 — fixture.
