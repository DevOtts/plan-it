# Epics — Squad B (statechart, preflight & tiering)

PRD: `delivery/v3/prds/prd-2-statechart-tiering.md` — read D1..D13 before implementing; every task below cites its D-number.
Base branch for all three: `v2/deterministic-core`. Status vocabulary: NOT-STARTED / IN-PROGRESS / IMPLEMENTED-NOT-VERIFIED / VERIFIED (case ID + run-output ref required). All three epics are currently **NOT-STARTED** (planning-only artifact; no code written yet).

---

## B1 — Preflight state, ENV-FACTS tiering & v2 regression pin

Branch: `epic/b1-preflight-envfacts` (off `v2/deterministic-core`)
Deps: none (parallel with B2, B3; cross-squad dependency on Squad A's `contract` verb for `T-B1-05` only — see PRD §6)
Covers: `C-W2-01`, `C-W2-02`, `C-W2-03`, `C-W2-04`, `E1`

### Task checklist
- [ ] `tests/fixtures/v2/machine.v2.fc6abc8.json` — new file, byte-identical to `git show fc6abc8:machine.json` (verified clean diff against current `machine.json` at planning time). [D1 Option 2]
- [ ] `machine.json:82-93` — insert `preflight` state (additive node + `discovery.on.FANOUT_COMPLETE.target` changed from `synthesis` to `preflight`; new `preflight.on.PREFLIGHT_VERIFIED.target = synthesis`). No existing state/event/guard name changes. [D2]
- [ ] `gate-check.mjs` — new `cmdMachineDiff(liveMachinePath, baselinePath)` + register `machine-diff` in the `commands` map (`gate-check.mjs:264-265`): fails if any v2 state/edge/event/guard name present in the baseline is missing or renamed in the live file; passes on pure additions. [D1 Option 2]
- [ ] `references/formats.md` — new `§9 ENV-FACTS manifest`: probe schema (`id`, `check`, `status ∈ {PRESENT,ABSENT,TIMEOUT}`, `evidence`), the 6-probe S-shape minimal set sourced from `SKILL.md:290-317`, and the M/L full set (+3 probes: tool-availability per referenced `run:` command, caller/consumer-surface map, full-tree secret-scan-on-import). [D3]
- [ ] `gate-check.mjs` — new `cmdPreflight(shape, targetDir)` + register `preflight` in the `commands` map: runs each probe via `execFileSync(..., {timeout: 10_000})`, catches `ETIMEDOUT` per-probe (recorded `TIMEOUT`, loop continues — never aborts the run), writes `ENV-FACTS.md`. [D4]
- [ ] `SKILL.md` — new "Phase 3.5 — Preflight (env facts)" prose block between the existing Phase 3 (`SKILL.md:276-317`) and Phase 4 (`SKILL.md:321`), describing the new machine state, the S vs M/L tiering rule (reads the existing `size`/`shape` G1 fields, `.plan-it/state.json:9`), and the ABSENT/TIMEOUT contract. [D3, D4]
- [ ] Mirror sync: copy every edited root file into `plugins/plan-it/skills/plan-it/...` (byte-identical, per the existing `T-E5-02` parity check in `tests/run-contract.mjs:277-294`) — `machine.json`, `scripts/gate-check.mjs`, `SKILL.md`, `references/formats.md`.
- [ ] `tests/v3/machine-shape.mjs` — new script: parses live `machine.json`, asserts `preflight` state exists, edge `discovery→preflight` exists, and `preflight` can reach `backboneFreeze` (interpretation of "contract" per PRD §2 flag).
- [ ] `tests/v3/machine-v2-regression.mjs` — new script: diffs `tests/fixtures/v2/machine.v2.fc6abc8.json` against `git show fc6abc8:machine.json` (byte-identical) and runs `gate-check machine-diff` against the live file (additive-only).
- [ ] `tests/v3/preflight-tiering.mjs` — new script + fixtures `tests/fixtures/v3/preflight-s/`, `tests/fixtures/v3/preflight-ml/`: runs `gate-check preflight S|M` against each and counts emitted probes (6 vs 9).
- [ ] `tests/fixtures/v3/absent-tool/` — new fixture: an ENV-FACTS.md with one probe `status: ABSENT` feeding a Test Contract case whose `run:` invokes that same tool; consumed by Squad A's `contract` verb (`T-B1-05`, cross-squad — see PRD §6 risk).
- [ ] `tests/v3/probe-timeout.mjs` — new script + fixture `tests/fixtures/v3/slow-probe/` (a stub probe that sleeps >10s): asserts the probe is killed, recorded `TIMEOUT`, and the run continues to the next probe.

### Binding Test Contract — B1

| ID | @tag | [REAL] case | run: | fixture | Covers |
|---|---|---|---|---|---|
| T-B1-01 | @case-machine | [REAL] `machine.json` contains `preflight`; edge `discovery→preflight`; `preflight` reaches `backboneFreeze` | `node tests/v3/machine-shape.mjs` | — (live `machine.json`) | C-W2-01 |
| T-B1-02 | @case-machine | [REAL] stored v2 copy byte-identical to `fc6abc8`; live `machine.json` is an additive-only superset (`gate-check machine-diff`) | `node tests/v3/machine-v2-regression.mjs` | `tests/fixtures/v2/machine.v2.fc6abc8.json` | E1 (per PROPOSED-AMENDMENT-1, PRD §2) |
| T-B1-03 | @case-machine | [REAL] S-shape run emits ENV-FACTS.md with exactly the 6-probe minimal set | `node tests/v3/preflight-tiering.mjs --shape S` | `tests/fixtures/v3/preflight-s/` | C-W2-02 |
| T-B1-04 | @case-machine | [REAL] M/L-shape run emits the full 9-probe set | `node tests/v3/preflight-tiering.mjs --shape M` | `tests/fixtures/v3/preflight-ml/` | C-W2-02 |
| T-B1-05 | @case-machine | [REAL] Contract case whose `run:` invokes a tool ENV-FACTS marks ABSENT → `contract` verb FAILS | `node scripts/gate-check.mjs contract --dir tests/fixtures/v3/absent-tool` | `tests/fixtures/v3/absent-tool/` | C-W2-03 |
| T-B1-06 | @case-machine | [REAL] A probe exceeding 10s is killed and recorded TIMEOUT; run continues to remaining probes | `node tests/v3/probe-timeout.mjs` | `tests/fixtures/v3/slow-probe/` | C-W2-04 |

---

## B2 — Model-tier enforcement: Tier Table, no-hardcoded-IDs guard, RUN-POLICY freeze/seed

Branch: `epic/b2-model-tiering-guard` (off `v2/deterministic-core`)
Deps: none (parallel with B1, B3; `T-B2-01`/`T-B2-06b` coordinate with Squad A's `reconcile` skeleton — see PRD §6)
Covers: `C-W3-01`, `C-W3-02`, `C-W3-03`, `G1`, `G2`

### Task checklist
- [ ] `references/formats.md` — new `§10 Tier Table (per-epic)`: 4-field grammar (`tier` / `effort` / `escalation` / `scaffold-pointer`), scaffold-pointer grammar (`fable-it:<id>[#<param>=<value>]` or `.claude/agents/<name>.md`, no whitespace). [D9]
- [ ] `scripts/hooks/planit-guard.mjs` — additive second check function alongside the existing Rule-1 gate (`planit-guard.mjs:40-65`): `MODEL_ID_RE = /claude-[a-z0-9-]+/`, scoped to a broadened plan-artifact path pattern (`delivery/**`, `docs/**`, `references/**`, `CONTRACT.md`, `SKILL.md`, `machine*.json`), always-on (not gated by `contract.version`). Denies with the matched literal named. [D10]
- [ ] `gate-check.mjs:65-86` (`cmdFreeze`) — additive failure branch: requires a `## RUN-POLICY` heading whose body contains `reap-on-merge` and the disk-AND-message delivery-rule text. [D11]
- [ ] `gate-check.mjs` — additive function `checkRunPolicySeeded(contractText, stateJson)`, called from `cmdFreeze`: every RUN-POLICY table value traces (tier-word-normalized) to `state.json.gates.G1.decisions`. [D12a]
- [ ] Coordinate with Squad A's `reconcile` skeleton (new subcommand, W5 lane): contribute `checkEpicTierTable(epicText)` — Tier Table present, 4 fields, `scaffold-pointer` cell contains no whitespace. Land as a function Squad A's `cmdReconcile` calls; do not duplicate the subcommand itself. [D12b]
- [ ] PROPOSED-AMENDMENT-2 verification task (not implementation — see PRD D13): once the coordinator assigns single ownership of the `gate-check.mjs:115,121,161` epic-ID-grammar widening (literal `E` → `[A-Z]`), confirm `T-B2-01`/`T-B2-02` below resolve against real epic headings `## B1 …` / `## B2 …`.
- [ ] Mirror sync: `scripts/hooks/planit-guard.mjs`, `scripts/gate-check.mjs`, `references/formats.md` → `plugins/plan-it/...` copies.
- [ ] `tests/v3/tier-table-fields.mjs` — new script + fixtures `tests/fixtures/v3/tier-table-good/`, `tests/fixtures/v3/tier-table-bad-pointer/` (scaffold-pointer cell contains inline prompt prose with spaces).
- [ ] `tests/v3/guard-model-id.mjs` — new script, mirrors the `runGuard()`/`guardCwd()` pattern already in `tests/run-contract.mjs:211-256` (T-E6-* precedent): constructs hook stdin inline, asserts deny on a `claude-*`-bearing write.
- [ ] `tests/fixtures/v3/no-tier/`, `tests/fixtures/v3/contract-no-runpolicy.md` — new fixtures.
- [ ] `tests/v3/run-policy-seeded.mjs` — new script: reads the real `.plan-it/state.json` + `delivery/v3/CONTRACT.md`, asserts every RUN-POLICY key traces to `gates.G1.decisions`.

### Binding Test Contract — B2

| ID | @tag | [REAL] case | run: | fixture | Covers |
|---|---|---|---|---|---|
| T-B2-01 | @case-machine | [REAL] Epic without a Tier Table → `reconcile` FAILS | `node scripts/gate-check.mjs reconcile --dir tests/fixtures/v3/no-tier` | `tests/fixtures/v3/no-tier/` | C-W3-01 |
| T-B2-02 | @case-machine | [REAL] Tier Table parses with all 4 fields; scaffold-pointer must be a fable-it path, not inline prompt text | `node tests/v3/tier-table-fields.mjs` | `tests/fixtures/v3/tier-table-good/`, `tests/fixtures/v3/tier-table-bad-pointer/` | C-W3-03 |
| T-B2-03 | @case-machine | [REAL] Hardcoded model ID (`claude-[a-z0-9-]+`) in any plan artifact → planit-guard rejects the write | `node tests/v3/guard-model-id.mjs` | — (inline hook stdin) | C-W3-02 |
| T-B2-04 | @case-machine | [REAL] CONTRACT.md missing `## RUN-POLICY` → `freeze` FAILS | `node scripts/gate-check.mjs freeze tests/fixtures/v3/contract-no-runpolicy.md` | `tests/fixtures/v3/contract-no-runpolicy.md` | G1 |
| T-B2-05 | @case-machine | [REAL] CONTRACT.md with RUN-POLICY (tiering table + reap-on-merge + disk-AND-message rule) → `freeze` PASSES | `node scripts/gate-check.mjs freeze delivery/v3/CONTRACT.md` | — (real frozen v1.0 CONTRACT, dogfooded) | G1 |
| T-B2-06 | @case-machine | [REAL] RUN-POLICY block content seeded verbatim from this run's G1 decisions (coordinator/mechanical/judgment/escalate-on-struggle) | `node tests/v3/run-policy-seeded.mjs` | — (real `.plan-it/state.json` + CONTRACT.md) | G2 |

---

## B3 — Statechart gate extensions: replan sibling, freeze gaps ledger, credential gate

Branch: `epic/b3-gates-replan-credentials` (off `v2/deterministic-core`)
Deps: none (parallel with B1, B2)
Covers: `E2`, `E3`, `E4`, `E5`

### Task checklist
- [ ] `machine-replan.json` — new sibling file (repo root, mirrored to `plugins/plan-it/skills/plan-it/`), same JSON-shape as `machine.json`, `initial` ≠ `"intake"`, exactly one `type: "final"` state named `done`, every transition target resolves. [D6]
- [ ] `.plan-it/state.json` schema doc — `references/machine.md`: document new **optional** `machine` key (`"machine.json"` | `"machine-replan.json"`), defaulting logic already present in `findMachine()` (`gate-check.mjs:201-208`). No existing state.json requires migration — key is opt-in. [D6, E3]
- [ ] `gate-check.mjs:236-245` (`cmdState`'s per-gate loop) — additive extension: when gate `G3` (freezeGate) is in history, require `state.gates.G3.knownGaps` (if present) to be an array where every row's `disposition ∈ {fix, waive, case-ify}`; missing disposition fails, naming the row. [D7]
- [ ] `gate-check.mjs:236-245` — additive extension: when gate `G2` (decisionGate) is in history, require `state.gates.G2.credentials` (if present) rows to have `status ∈ {procured, GATED-with-owner}`; `status: "unprocured"` without an `owner` field fails; `GATED-with-owner` rows must also appear verbatim in the file at `state.contract.path`. [D8]
- [ ] Mirror sync: `machine-replan.json`, `scripts/gate-check.mjs`, `references/machine.md` → `plugins/plan-it/...` copies.
- [ ] `tests/v3/machine-replan-shape.mjs` — new script, reuses the T-E1-01..05 shape-check pattern (`tests/run-contract.mjs:43-102`) against `machine-replan.json` instead of duplicating a new gate-check subcommand.
- [ ] `tests/fixtures/v3/state-no-machine-field.json`, `tests/fixtures/v3/state-replan-mode.json` — new fixtures.
- [ ] `tests/v3/phase0-selector.mjs` — new script: asserts `machine` absent → resolves `machine.json`; `machine: "machine-replan.json"` → resolves the replan file.
- [ ] `tests/fixtures/v3/gaps-undispositioned/`, `tests/fixtures/v3/gaps-dispositioned/` — new fixtures (state.json variants).
- [ ] `tests/v3/freeze-gaps-ledger.mjs` — new script exercising both fixtures against `gate-check state`.
- [ ] `tests/fixtures/v3/credentials-unprocured/`, `tests/fixtures/v3/credentials-gated/` — new fixtures.
- [ ] `tests/v3/credential-gate.mjs` — new script exercising both fixtures against `gate-check state`.

### Binding Test Contract — B3

| ID | @tag | [REAL] case | run: | fixture | Covers |
|---|---|---|---|---|---|
| T-B3-01 | @case-machine | [REAL] `machine-replan.json` validates against the same schema as `machine.json`; entry ≠ `intake`; final `done` | `node tests/v3/machine-replan-shape.mjs` | — (real `machine-replan.json` once authored) | E2 |
| T-B3-02 | @case-machine | [REAL] `.plan-it/state.json` `machine` field absent → defaults to `machine.json` (v2 runs unaffected) | `node scripts/gate-check.mjs state tests/fixtures/v3/state-no-machine-field.json machine.json` | `tests/fixtures/v3/state-no-machine-field.json` | E3 |
| T-B3-03 | @case-machine | [REAL] `machine: "machine-replan.json"` resolves to the replan machine via the Phase-0 selector | `node tests/v3/phase0-selector.mjs` | `tests/fixtures/v3/state-replan-mode.json` | E3 |
| T-B3-04 | @case-machine | [REAL] freezeGate: known-gaps ledger with 1 undispositioned row → `G3_APPROVED` rejected (EC-B7) | `node tests/v3/freeze-gaps-ledger.mjs --case undispositioned` | `tests/fixtures/v3/gaps-undispositioned/` | E4 |
| T-B3-05 | @case-machine | [REAL] All known-gap rows fix/waive/case-ify → `G3_APPROVED` accepted | `node tests/v3/freeze-gaps-ledger.mjs --case dispositioned` | `tests/fixtures/v3/gaps-dispositioned/` | E4 |
| T-B3-06 | @case-machine | [REAL] Credential row `unprocured` without owner → `G2` payload rejected | `node tests/v3/credential-gate.mjs --case unprocured-no-owner` | `tests/fixtures/v3/credentials-unprocured/` | E5 |
| T-B3-07 | @case-machine | [REAL] `GATED-with-owner` row → accepted and verified copied into CONTRACT.md | `node tests/v3/credential-gate.mjs --case gated-with-owner` | `tests/fixtures/v3/credentials-gated/` | E5 |

---

## Case map — every assigned ID → ≥1 binding case (no silent drops)

| Assigned ID | Source | Binding case(s) | Epic |
|---|---|---|---|
| C-W2-01 | CONTRACT.md:18 (enforcement) | T-B1-01 | B1 |
| C-W2-02 | CONTRACT.md:19 (enforcement) | T-B1-03, T-B1-04 | B1 |
| C-W2-03 | CONTRACT.md:20 (enforcement) | T-B1-05 (cross-squad: depends on Squad A's `contract` verb) | B1 |
| C-W2-04 | CONTRACT.md:21 (enforcement) | T-B1-06 | B1 |
| C-W3-01 | CONTRACT.md:22 (enforcement) | T-B2-01 (cross-squad: depends on Squad A's `reconcile` skeleton) | B2 |
| C-W3-02 | CONTRACT.md:23 (enforcement) | T-B2-03 | B2 |
| C-W3-03 | CONTRACT.md:24 (enforcement) | T-B2-02 | B2 |
| E1 | TEST-CONTRACT-REVIEW.md:33 (draft, approved) | T-B1-02 — **bound under PROPOSED-AMENDMENT-1** (PRD §2 D1); reinterprets literal "byte-identical" as "byte-pinned stored copy + additive-only live superset" pending coordinator's dated decisions.md entry | B1 |
| E2 | TEST-CONTRACT-REVIEW.md:34 (draft, approved) | T-B3-01 | B3 |
| E3 | TEST-CONTRACT-REVIEW.md:35 (draft, approved) | T-B3-02, T-B3-03 | B3 |
| E4 | TEST-CONTRACT-REVIEW.md:36 (draft, approved) | T-B3-04, T-B3-05 | B3 |
| E5 | TEST-CONTRACT-REVIEW.md:37 (draft, approved) | T-B3-06, T-B3-07 | B3 |
| G1 | TEST-CONTRACT-REVIEW.md:45 (draft, approved) | T-B2-04, T-B2-05 | B2 |
| G2 | TEST-CONTRACT-REVIEW.md:46 (draft, approved) | T-B2-06 | B2 |

**14/14 assigned IDs mapped. Zero silent drops.** One ID (E1) is bound under a documented PROPOSED-AMENDMENT rather than its literal frozen wording — see PRD §2 D1 for the full rationale and the two-option analysis; the coordinator must apply (or reject) PROPOSED-AMENDMENT-1 and PROPOSED-AMENDMENT-2 (PRD D13, epic-ID grammar widening) via dated `decisions.md` entries per the amendment loop (`CONTRACT.md:50`). Two IDs (C-W2-03, C-W3-01) bind to cases with an explicit cross-squad dependency noted inline rather than silently assumed complete.

Total binding cases this package: **19**, all `[REAL]`, all `@case-machine`, all runnable via the `run:` column above (COMPUTED tally — do not hand-edit this count; re-derive via `node scripts/gate-check.mjs contract` once Squad A's verb lands).
