# Fixture: disposition-missing

Consumed by: **T-V4B4-11** / **C-E8-01** (`node .../gate-check.mjs reconcile
--dir tests/fixtures/v4/disposition-missing`). AMD-8(a): a disposition is
required only when Status is `IMPLEMENTED-NOT-VERIFIED`. `F0` (NOT-STARTED)
and `F1` (IN-PROGRESS) both have an empty cell and are NOT named — still
open work, disposition optional. `F2` (IMPLEMENTED-NOT-VERIFIED) also has
an empty cell — exit 1 naming `F2` and `C-E8-01` (G-3), and only `F2`.
