# `machine.v3.7fcff27.json` — byte-pinned 3.0.1 baseline

`git show 7fcff27:plugins/plan-it/skills/plan-it/machine.json`, byte-identical.
SHA-256 `05d2147be8c2503a72e781da5bd1fdfe280c77dde1c2f7408ecc18e1e1d074eb`
(created at W0 by the orchestrator; verified — never overwritten — by Epic
V4B1).

Feeds: **T-V4B1-02** (`gate-check machine-diff` against this file exits 0
PASS) and **T-V4B1-04** (adversarial-verify: this file's bytes are re-hashed
and compared against `git show 7fcff27:…`, not trusted from a cached value;
a byte-flipped copy in a temp dir must fail the same check, naming both
hashes). Also the negative half of the pair with `tests/fixtures/v4/machine/`
(T-V4B1-07…12) and the baseline-parity check T-V4B1-05.

On a hash mismatch: fail closed, report both hashes, never overwrite this
file (PRD prd-b-core.md §9 item 9).
