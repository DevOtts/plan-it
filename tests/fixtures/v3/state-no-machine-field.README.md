# Fixture: state-no-machine-field.json

Consumed by: **T-B3-02** (Phase-0 machine selector).
Satisfies (positive case): no `machine` key present → the selector must
default to `machine.json` (v2 runs stay unaffected — the key is opt-in).
