# Fixture: mirror-escalated

Consumed by: **T-V4B4-07** / **C-E2-07** (`tests/v4/core/mirror-escalated.mjs`,
via `handoff --dir <fx> --run r`). `.plan-it/r.state.json` is a v4 run
(`machineVersion: "4.0.0"`, `run.deliveryRoot: "delivery/"`) whose
`render.outputs[]` records the SHA-256 of `delivery/KICKOFF.html`'s
CURRENT on-disk bytes — i.e. re-rendering again would reproduce the exact
same (still-stale) twin. `handoff` reports `ESCALATED` (failed-recovery),
not plain `MIRROR_STALE`. `delivery/GLOSSARY.md`+`.html` is a fresh pair so
the escalation is the only finding.
