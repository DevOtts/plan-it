# Fixture: state-run

Consumed by: **T-V4B2-12** / **C-E9-01** (`tests/v4/core/state-run-flag.mjs`).
`v4.state.json` populates every optional §4.6 key
(`run.name/mode/topology/deliveryRoot/anamnesis`, `triage`, `gates.G0/G4`,
`contract.draft`, `render`, `archive`) and resumes at `parallelPlanning` —
`state --dir … --run v4` exits 0, prints `next events: AMENDMENT,
SQUADS_COMPLETE` (untagged, both modes), extra keys tolerated.
`at-render.state.json` is the same run one step further (at `render`,
autonomous-draft): only `REVIEW_READY` is printed, never `RENDERED`.
