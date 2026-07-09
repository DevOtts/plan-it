# Decisions — secret swap tool

## 2026-07-08 — adversarial-depth (D4) cascade-class waivers

The swap tool is a single-operator CLI over an atomic secret store. Three
cascade classes genuinely do not apply and are waived, each with a reason:

- partial application: N/A — every swap is a single atomic write to one store,
  so there is no partially-applied intermediate state to test.
- rollback / compensation: WAIVED — the tool performs no destructive multi-step
  change, so there is nothing to roll back or compensate.
- escalation tier: WAIVED — single-operator CLI; on an unrecoverable failure it
  exits nonzero and stops, there is no paging/escalation tier to model.
