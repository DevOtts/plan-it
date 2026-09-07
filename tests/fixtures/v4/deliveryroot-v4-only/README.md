# Fixture: deliveryroot-v4-only

Consumed by: **T-V4B3-04, 05, 07** / **C-E9-03** (`deliveryroot-resolution.mjs`).
`.plan-it/v4.state.json` sets `run.deliveryRoot: "delivery/v4/"`; the
package (CONTRACT.md, epics/, prds/) lives only under `delivery/v4/` —
`delivery/v3/` is absent entirely, proving `contract|reconcile|freeze --dir
--run v4` resolve `delivery/v4/`, not a hardcoded `delivery/v3/` (fixes
F-B14 false greens). `delivery/v4/CONTRACT.md`'s `Tally: 5` disagrees with
its 2 actual case rows (C-W5-01); `delivery/v4/epics/epics-x.md`'s `Epic
X1` has zero Binding Test Contract case rows (C-W5-03).
