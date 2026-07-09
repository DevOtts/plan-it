# CONTRACT — credential-vault rotation engine (adversary DEEP fixture)

Version: v1.0 (frozen)

## 8. Core-logic models

### 8.1 Rotation lifecycle (state machine)

The rotation engine is a multi-step, failure-aware lifecycle. Modelled failure
half, not just the happy path:

```
SCHEDULED --> RUNNING
RUNNING --> VERIFYING
VERIFYING --> COMPLETE
RUNNING --(some adapters applied, some not)--> PARTIAL_FAILED
PARTIAL_FAILED --(operator fixes, re-run)--> VERIFYING
PARTIAL_FAILED --(compensate)--> ROLLED_BACK
ROLLED_BACK --(rollback itself cannot complete)--> ESCALATED
```

COMPLETE is terminal-success; ESCALATED is terminal-failure (paged to a human).

## 9. Governance rules

- G-1 — every rotation attempt writes exactly one audit row, whatever its outcome.

## Cases

| ID | Asserts |
|----|---------|
| T-D4-01 | happy-path rotation reaches COMPLETE |
| T-D4-02 | audit row written (G-1) |
