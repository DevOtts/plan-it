# CONTRACT — real-project fixture (with RUN-POLICY) v1.0

Freeze fixture for W3.1-2's positive path: the reach fix must not *over*-block.
A real project at `delivery/CONTRACT.md` with a run root that has reviewed its
cases and frozen a RUN-POLICY section must still freeze clean (exit 0).

## 1. Vocabulary

- **Secret** — a named credential encrypted at rest.
- **RotationRun** — one end-to-end attempt to rotate a Secret.

## 2. Schema

```
Secret { name, currentVersionId }
```

## 3. Definition of shipped

The first vertical slice runs end-to-end.

## RUN-POLICY

Tiering, worktree hygiene, and delivery discipline for the build waves:

- The coordinator stays on the top tier; mechanical slices run on the low tier.
- reap-on-merge: a squad worktree is reaped once its branch merges and its
  results are captured on disk.
- Every squad writes its results to disk AND returns a content-bearing final message; neither half alone counts as delivered.

## Changelog

- v1.0 — initial freeze.
