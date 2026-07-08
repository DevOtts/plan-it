# E2 repair report — 2026-07-08 (Squad B, epic/e2-statechart-tiering)

Commit: `fa4f9bd` (on top of merge `b309e66`, canon parent `935672b`).
Exit state: **v2 harness 41/41 passed · v3 11/11 mechanism-ready rows fail-closed · sweep 0 violations, 14 named pre-Wave-1 gaps** (C-W2-01..04, C-W3-02..03, C-W4-01..03, C-W6-01..05 — unchanged set, not silently passed).

## Item-by-item closeout (coordinator's verified list)

### 1. T-E1-02 — reconciled with AMD-1, not weakened
AMD-1 exact wording (delivery/decisions.md:44; CONTRACT.md:45; TEST-CONTRACT-REVIEW.md:33): live `machine.json` = *additive-only structural superset of the byte-pinned* `tests/fixtures/v2/machine.v2.fc6abc8.json`, *verified by `gate-check machine-diff`*. T-E1-02 now:
- asserts the **byte-pinned baseline** has exactly the 15 v2 states and `done` final (regression pin, exact), AND
- asserts the **live** machine.json still contains every v2 state with `done` final (AMD-1 permits additions only — `preflight` is the sole addition; rename/removal still fails).
The additive-superset structure itself remains `machine-diff`'s job (T-B1-02). AMD-1 cited in test comment and commit.

### 2. T-E3-04 — RUN-POLICY freeze branch gated (D11/D12a)
v2 semantics are byte-identical when the contract never references RUN-POLICY. Presence is required when (a) freeze runs in `--dir` mode (the v3 package path), or (b) the text references RUN-POLICY outside code spans (mention-vs-use, existing `stripCode` convention). Verified matrix:
- `tests/fixtures/contract-good.md` → exit 0 (T-E3-04 ✓)
- `tests/fixtures/v3/contract-no-runpolicy.md` → exit 1 (T-B2-04 binding case still fails ✓)
- real `delivery/v3/CONTRACT.md` → exit 0 incl. D12a provenance vs `.plan-it/state.json` gates.G1.decisions ✓

**Latent bug found & fixed while here:** all three section-body extractors used lookahead `(?=\n##\s|$)` under `/m`; `$` matches every line end, truncating bodies to their first line. This is why freeze failed on the real CONTRACT.md despite it containing `reap-on-merge`, both disk-AND-message halves, and the tier table. End-of-string is now spelled `(?![\s\S])` in cmdFreeze, `checkRunPolicySeeded`, and `checkEpicTierTable`.

### 3. T-E3-11 — no npm dependency existed
Root cause: the scanner regex (`from\s+"…"`) matched the literal text `from "${b.target}"` inside a machine-diff *message template* in gate-check.mjs — the reported spec was the unevaluated `${b.target}`. No import was added by the merge. Message reworded to `retargeted (baseline "…" → "…") onto a pre-existing baseline state`; scanner is untouched (still strict).

### 4. C-W3-01 — tier check registered additively inside canon `reconcile`
`checkEpicTierTable` (D9/D12b) now runs inside canon `reconcileScan` over `delivery/v3/epics/*.md`, per-epic-section; files with no epic sections are skipped (that's C-W5-03's concern). Squad A's verb body is otherwise untouched. Verified: `no-tier` → exit 1, `tier-table-good` → exit 0; T-A4-02/03/B3 message assertions unaffected; C-W5-04 embedded-reconcile parity unaffected.

### Mirrors (AMD-2)
`machine.json` and `scripts/gate-check.mjs` re-synced root→plugin in the same commit; all eight pairs byte-identical (T-E5-02 ✓).

## Remaining E2 Wave-1 work (unchanged, tracked)
C-W2-01..04, C-W3-02..03, C-W4-01..03 mechanisms are mine and still pending (named GAPs); C-W6-* are Squad C's.
