# CONTRACT — fixture propagation pipeline (deliveryRoot thin fixture)

Version: v1.0 (frozen)

## 8. Core-logic models

### 8.1 Propagation lifecycle (state machine)

```
DRAFTED --> DISPATCHED
DISPATCHED --> VERIFYING
VERIFYING --> DONE
VERIFYING --(check fails)--> VERIFY-FAILED
DISPATCHED --(delivery fails)--> PROPAGATION-FAILED
VERIFY-FAILED --(operator fixes, re-run)--> DISPATCHED
```

DONE is terminal-success. The machine models two failure states but the
delivery package only tests the shallow half — proves adversary reads the
delivery/v4/ contract (D-B3 cascade gaps named), not an empty delivery/v3/.

## Cases

| ID | Asserts |
|----|---------|
| T-Y3-01 | happy-path propagation reaches DONE |
