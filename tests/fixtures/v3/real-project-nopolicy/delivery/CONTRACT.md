# CONTRACT — real-project fixture (no RUN-POLICY) v1.0

Freeze fixture for W3.1-2's headline (E1). A real project freezes its contract
at `delivery/CONTRACT.md` (not plan-it's own `delivery/v3/` dogfood path) and a
`.plan-it/state.json` sits at the run root. This contract is structurally valid
but carries no `## RUN-POLICY` section — exactly the package the v3 arm shipped
with `freeze` exiting 0 because the hardening only fired in `--dir` mode.

## 1. Vocabulary

- **Secret** — a named credential encrypted at rest.
- **RotationRun** — one end-to-end attempt to rotate a Secret.

## 2. Schema

```
Secret { name, currentVersionId }
```

## 3. Definition of shipped

The first vertical slice runs end-to-end. There is deliberately no RUN-POLICY
section here so the freeze reach fix has something to catch.

## Changelog

- v1.0 — initial freeze.
