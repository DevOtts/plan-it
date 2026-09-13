# Fixture: planreview-no-render

Consumed by: **T-L2-02** (drain-0912) — negative control for
`docs/../discovery` note `plan-it-planreview-reachable-without-render.md`.

Byte-for-byte `planreview-good`'s state.json (full G0-G4 gate payload, an
acked `PLAN-REVIEW.md` on disk, a matched G4 contradiction) **except**:
`history` omits `render` (the sole predecessor of `planReview` in
machine.json) and `delivery/v4/` carries no rendered HTML twin. Before the
T-L2-02 fix this reproduced `gate-check.mjs state` exiting 0 / PASS with
`render` never visited and no artifacts on disk — silent success. After the
fix it must exit non-zero, naming the missing `render`/HTML twin.
