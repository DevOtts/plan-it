# Fixture: mode-mixed

Consumed by: **T-V4B2-10** / **C-E7-06** (`tests/v4/core/mode-consistency.mjs`).
Two violating variants: `autonomous-with-decisiongate.state.json`
(`run.mode: "autonomous-draft"` with `decisionGate` in history — a
guided-only state) and `guided-with-planreview.state.json`
(`run.mode: "guided"` with `planReview` in history — an autonomous-only
state). Each REJECTED naming C-E7-06 and the offending state.
