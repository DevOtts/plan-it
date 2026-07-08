# Fixture: mirror-drift

Consumed by: **T-C3-06** (`mirror-check` verb — drift detection).
Violates: "Any pair drifts (1-byte change in plugin copy of machine.json) →
exit 2 listing each drifted pair."

Contents:
- `root/machine.json` vs `plugins/plan-it/machine.json` — a deliberate
  1-value drift (`"value": 1` vs `"value": 2`).

Note: this is a minimal *representative* pair, not the full real 8-pair
mirror set (`mirror-check`'s POSITIVE case, T-C3-05, dogfoods against the
live repo tree directly per the epic's own binding row — no fixture needed
for that direction).
