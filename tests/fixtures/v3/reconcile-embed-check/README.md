# Fixture: reconcile-embed-check

Consumed by: **C-W5-04** (`reconcile` standalone AND embedded in `handoff`).
Violates: combines the C-W5-02 (orphan requirement `R-3`) and C-W5-03
(epic `Epic Z1` with zero contract cases) violations in one dir, so the same
fixture proves `reconcile --dir <this>` fails standalone AND
`handoff --dir <this>` fails with the same reconcile-sourced messages.

Contents:
- `delivery/v3/prds/prd-z.md` — orphan requirement `R-3`.
- `delivery/v3/epics/epics-z.md` — zero-case epic that doesn't cover `R-3`.
