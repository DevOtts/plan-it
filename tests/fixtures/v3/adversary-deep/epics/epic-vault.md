# Epic 1 — rotation engine · Test Contract

Every declared failure state is an asserted outcome, and all five cascade
classes are exercised by a real case.

| ID | Case | Outcome asserted |
|----|------|------------------|
| T-D4-01 | schedule → run → verify a clean rotation | ends in COMPLETE |
| T-D4-02 | rotation writes an audit row (G-1) regardless of outcome | audit row present |
| T-D4-03 | one adapter applies, one throws → **partial failure** | state = PARTIAL_FAILED |
| T-D4-04 | after PARTIAL_FAILED, engine compensates the applied half | state = ROLLED_BACK (rolled back cleanly) |
| T-D4-05 | rollback of the applied half itself fails → escalation | state = ESCALATED (escalates to operator) |
| T-D4-06 | operator fixes the broken adapter, engine **resumes** and re-verifies | recovers to COMPLETE |
| T-D4-07 | a stored secret is externally overwritten between write and verify | adversarial round-trip re-reads the store and detects tamper |

Notes:
- T-D4-03 proves the **partial-failure** cascade class.
- T-D4-04 proves **rollback / compensation** (the applied half is rolled back).
- T-D4-05 proves **failed-recovery → escalation** (rollback fails, engine escalates).
- T-D4-06 proves **recovery / resume** (operator fixes, engine resumes + re-verifies).
- T-D4-07 proves **adversarial-verify** (round-trip re-read catches external tamper).
