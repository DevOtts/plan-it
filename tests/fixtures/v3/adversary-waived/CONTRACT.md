# CONTRACT — single-operator secret swap (adversary WAIVED fixture)

Version: v1.0 (frozen)

## 8. Core-logic models

### 8.1 Swap lifecycle (state machine)

```
DRAFTED --> DISPATCHED
DISPATCHED --> VERIFYING
VERIFYING --> DONE
VERIFYING --(check fails)--> VERIFY-FAILED
DISPATCHED --(delivery fails)--> PROPAGATION-FAILED
VERIFY-FAILED --(operator fixes, re-run)--> DISPATCHED
```

DONE is terminal-success. This is a single-operator tool: some failure-cascade
classes genuinely do not apply and are waived with a reason in decisions.md.

## Cases

| ID | Asserts |
|----|---------|
| T-W7-01 | happy-path swap reaches DONE |
