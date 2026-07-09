# Epic 1 — secret swap · Test Contract

Both declared failure states are asserted (D-B1). Two cascade classes are
covered by real cases here; the other three are waived (with reasons) in
decisions.md — not silently absent. See .README.md for the full rationale.

| ID | Case | Outcome asserted |
|----|------|------------------|
| T-W7-01 | dispatch → verify a clean swap | ends in DONE |
| T-W7-02 | verify check fails on a bad payload | state = VERIFY-FAILED |
| T-W7-03 | delivery to the store fails | state = PROPAGATION-FAILED |
| T-W7-04 | operator fixes the store, engine resumes and re-verifies | recovers to DONE |
| T-W7-05 | secret externally altered after write | adversarial round-trip re-read detects it |
