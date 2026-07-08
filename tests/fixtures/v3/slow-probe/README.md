# Fixture (STUB): slow-probe

Status: NOT-STARTED — naming-convention placeholder only (Epic A1's
cross-squad stub strategy). Real content belongs to Squad B's epic, once
`references/formats.md §9` (the ENV-FACTS.md probe schema) exists — building
speculative content here risked locking in the wrong shape.

Consumed by: **C-W2-04 / T-B1-06**.
Frozen run: command (verbatim from delivery/v3/CONTRACT.md / the binding
epic table): `node tests/v3/probe-timeout.mjs`

A probe exceeding 10s must be killed and recorded TIMEOUT; the run continues to remaining probes.
