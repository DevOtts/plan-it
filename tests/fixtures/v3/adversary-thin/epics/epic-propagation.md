# Epic 1 — propagation pipeline · Test Contract

Both declared failure states are asserted, and the two easy cascade classes are
covered by real cases. The three hard failure-cascade classes have no case —
this mirrors the v3 field-trial arm (honest recovery + verify tests, no depth
on the destructive half). See .README.md for the full rationale.

| ID | Case | Outcome asserted |
|----|------|------------------|
| T-T3-01 | schedule → dispatch → verify a clean run | ends in DONE |
| T-T3-02 | verify check fails on a tampered payload | state = VERIFY-FAILED |
| T-T3-03 | delivery to the sink fails outright | state = PROPAGATION-FAILED |
| T-T3-04 | operator fixes the sink, engine resumes and re-verifies | recovers to DONE |
| T-T3-05 | payload externally altered after write | adversarial round-trip re-read detects it |
