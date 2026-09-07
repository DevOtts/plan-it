# Stream B — the deterministic core (machine.json statechart, gate-check.mjs verbs, planit-guard.mjs hook, run-state file, tests/fixtures harness)

_Owner: Stream B research agent · run plan-it v4 · 2026-09-07 · baseline `plugins/plan-it/` @ 3.0.1 (plugin path is canonical; root files are mirrors)._

Acronyms used in this report, expanded once here (E10 applies to us): **DoD** = Definition of Done. **PRD** = Product Requirements Document. **G0/G1/G2/G3/G4** = human gate identifiers in the statechart. **FD-1/FD-2** = the two "field-demand" mandates from the v3 field study (FD-1 = test-conventions receipt in `CLAUDE.md`; FD-2 = human review of the draft Test Contract before freeze). **AMD-n** = a CONTRACT amendment recorded in `delivery/decisions.md`. **LG-n** = a live-grounding fact from `SHARED-CONTEXT.md`. **W1…W6** = the six v3 enforcement waves (case IDs `C-W<n>-NN`). **INV** = IMPLEMENTED-NOT-VERIFIED, the third word of the closed status vocabulary. **PreToolUse hook** = the Claude Code harness callback that runs before a Write/Edit tool call and may deny it. **ESM** = ECMAScript modules (`.mjs`). **SHA-256** = the hash used for content stamps. **CRUD** = create/read/update/delete (a linear workflow with no state machine). **BFS** = breadth-first search.

## 0. Scope + method (what you read, what you ran)

Read in full (plugin path): `plugins/plan-it/skills/plan-it/machine.json` (224 lines), `plugins/plan-it/skills/plan-it/scripts/gate-check.mjs` (1653 lines, every verb), `plugins/plan-it/scripts/hooks/planit-guard.mjs` (122 lines) and its root sibling `scripts/hooks/planit-guard.mjs` (134 lines, carries 7fcff27), `plugins/plan-it/skills/plan-it/references/machine.md`, `tests/run-contract.mjs` (544 lines), `tests/v3/lib/contract-cases.mjs`, `tests/v3/{mirror-drift,machine-shape,fail-closed-sweep,kickoff-pinning,kickoff-rederive}.mjs`, `tests/fixtures/v3/README.md`, `tests/fixtures/state-valid.json`, `tests/fixtures/v2/machine.v2.fc6abc8.json`, `.plan-it/state.json`, `.plan-it/v3.state.done.json`, `delivery/v3/{STATUS.md,CONTRACT.md}`, the E6–E10 text of `delivery/v4/V3-VS-V4-CORE-ENHANCEMENTS.html` (tags stripped).

Ran (all from the repo root, all outputs recorded below as [MEASURED]):

| command | result |
|---|---|
| `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs mirror-check` | FAIL, exit 2, 7 of 8 pairs identical, guard pair drifted at byte offset 4962 (sizes 6484 vs 5767) |
| `node tests/run-contract.mjs` | exit 1 — v2 section 50/51 (only `T-E5-02` fails: guard pair differs); v3 section 25/25 fail-closed, 0 pending |
| `node tests/v3/fail-closed-sweep.mjs` | PASS, exit 0, 25/25 enforcement rows mechanism-ready |
| `node tests/v3/version-triple-match.mjs` | PASS, all 7 sources = 3.0.1 |
| `gate-check machine-diff <live 3.0.1> tests/fixtures/v2/machine.v2.fc6abc8.json` | PASS |
| `gate-check state .plan-it/state.json <machine>` (this run, with extra keys `run.name`, `run.anamnesis`) | PASS, exit 0, state `discovery`, next `FANOUT_COMPLETE` |
| `gate-check reconcile --dir .` | PASS (scans `delivery/v3/` only — see F-B14) |
| `diff scripts/hooks/planit-guard.mjs plugins/plan-it/scripts/hooks/planit-guard.mjs` | 13 lines differ: the named-state resolution block (root L107–L118) is absent from the plugin copy |
| `git show --name-only 7fcff27` | touches exactly one file: `scripts/hooks/planit-guard.mjs` (no test, no plugin mirror) |
| Prototype v4 machine (25 states) built in the scratchpad, `machine-diff` against 3.0.1 and against the v2 baseline, plus 6 negative variants | see F-B5 |
| Two-run guard fixture (frozen `v4.state.json` + unfrozen generic) driven through both guard copies | see F-B8 |
| Emulation of run-contract assertions `T-E1-03` / `T-E1-05` against the prototype machine | see F-B6 |

Nothing in the repo was modified. Scratch artifacts live under the session scratchpad only.

## 1. Findings

**F-B1 — LG-1 settled: mirror-check FAILS today.** [MEASURED] `mirror-check` exits 2 with one drifted pair, `scripts/hooks/planit-guard.mjs ↔ plugins/plan-it/scripts/hooks/planit-guard.mjs`, drift at byte offset 4962; the offset lands exactly at the comment that opens the 7fcff27 resolution block (root L107). The pair IS asserted: `MIRROR_PAIRS` L1560 lists it, and `run-contract` `T-E5-02` (L291–L308) lists it independently. Consequence: the shipped plugin (`${CLAUDE_PLUGIN_ROOT}/scripts/hooks/planit-guard.mjs`, wired by `plugins/plan-it/hooks/hooks.json`) does NOT have the named-run fix. Root cause is procedural, not technical: commit 7fcff27 changed one file and no release gate ran (the 3.0.1 CHANGELOG "Verification" block at `CHANGELOG.md:150` requires mirror-check 8/8, and the commit bypassed it).

**F-B2 — Baseline tally for the v4 "definition of shipped".** [MEASURED] `run-contract`: v2 50/51 + v3 25/25, exit 1, sole failure `T-E5-02` (the F-B1 drift). `fail-closed-sweep` 25/25 exit 0. `version-triple-match` 3.0.1 across plugin.json, marketplace.json, both SKILL.md, both machine.json, CHANGELOG top. `machine-diff` live-vs-v2 PASS. So the only red on the board is the guard mirror; everything else is green at 3.0.1.

**F-B3 — What `checkMachineAdditive` (L278–L310) enforces, precisely.** [VERIFIED-IN-CODE] Six rules, nothing else:
1. `live.initial === base.initial` (L281).
2. Every baseline state name exists in live (L282–L286). Renaming = missing = fail.
3. A baseline `type: "final"` state stays final (L288).
4. Every baseline `on.<EVENT>` on a baseline state still exists (L289–L293). New events on baseline states are NOT inspected (the loop iterates baseline events only).
5. The guard on a baseline edge is unchanged, compared as `(b.guard ?? null) !== (l.guard ?? null)` (L296) — adding a guard where there was none, or removing one, fails.
6. A baseline edge may be retargeted only onto a state that does NOT exist in the baseline (L299–L303): retarget onto an unknown state fails, onto a pre-existing baseline state fails, onto a NEW state passes ("additive insertion").
7. Every baseline `meta.guards` key exists in live (L306–L308). New guards are not inspected. `meta.stateFile`, `context`, `version`, `description`, per-state `meta` are never compared.
Therefore: adding states, adding transitions (on new or old states), adding guards, adding `meta`/`context` keys, changing `meta.stateFile`, and inserting a new state into an existing edge are all permitted. Changing `initial`, dropping/renaming a state or event, swapping a guard, or bypassing a baseline state by retargeting onto another baseline state are all rejected.

**F-B4 — `gate-check` never reads `meta.stateFile`.** [VERIFIED-IN-CODE] `grep stateFile gate-check.mjs` → 0 matches. The path `.plan-it/state.json` is hardcoded at every site (F-B12). So changing `meta.stateFile` to a pattern is documentation only; it changes no behaviour until the verbs are taught the pattern.

**F-B5 — A 25-state v4 superset passes `machine-diff` against 3.0.1 AND against the v2 baseline.** [MEASURED] Prototype: 17 baseline states + `triage`, `closedWithoutPlan` (final), `anamnesis` (gate G0), `scopeBrief`, `defaultsApplied`, `render`, `planReview` (gate), `freeze`; three baseline edges retargeted through new states (`intake.INTAKE_CAPTURED → triage`, `dodLock.DOD_LOCKED → scopeBrief`, `adversaryGate.ADVERSARY_CLEAN → render`); two new guards in `meta.guards`; a new `context.mode` key; `meta.stateFile` changed. Result: PASS vs 3.0.1, PASS vs `machine.v2.fc6abc8.json`. Negative variants each failed with the expected named reason: `initial` changed → fail; `adversarialDepth` guard removed → fail; guard on `scopeGate.G1_APPROVED` swapped → fail; `dodLock.DOD_LOCKED` dropped → fail; `freezeGate.G3_APPROVED` retargeted onto baseline `parallelPlanning` → fail ("only insertion of NEW states is additive"); `done` made non-final → fail. Retargeting `backboneFreeze.CONTRACT_FROZEN` onto the new `render` state → pass (confirms rule 6).

**F-B6 — Two run-contract assertions WILL break on any v4 machine with new human gates or new check names.** [MEASURED by emulating the test code against the prototype]
- `T-E1-05` (`tests/run-contract.mjs:108–116`) asserts EXACTLY 3 states carry `meta.gate` and that the sorted names equal `["G1","G2","G3"]`. The prototype has 5 (`G0`, `G1`, `G2`, `G3`, `GR`) → would FAIL. Any `meta.gate` on `anamnesis` or `planReview` trips it.
- `T-E1-03` (L74–L95) requires every guard's `meta.guards[g].check` to be in the closed set `{verify, freeze, handoff, state, adversary}`. A guard mapping to a new check name (`triage`, `mirror`, `render`) → would FAIL. Guards mapping to `state` or `verify` pass.
Neither is `machine-diff`; both are harness tests with precedent for amendment (`T-E1-02` was re-scoped by AMD-1, `delivery/decisions.md:44`, to bind against the byte-pinned baseline). See §4.1 and §6.

**F-B7 — The `state` verb tolerates extra keys and already enforces a G0 gate with zero code change.** [MEASURED] (a) This run's `.plan-it/state.json` carries `run.name`, `run.inputs`, `run.anamnesis`, `gates.G1.decisions`, `testConventions` → `state` exits 0. `STATE_REQUIRED_KEYS` (L912) is a presence list, never an allow-list. (b) A prototype state with `run.mode`, `run.deliveryRoot` and `gates.G0` → exit 0. (c) The same file with `gates.G0` deleted while `anamnesis` is in `history` → exit 1, "gate G0 (anamnesis) appears in history but is not recorded with approved+owner+date". The generic loop at L996–L1005 reads `meta.gate` from whatever machine is passed, so G0/G4 recording is enforced for free — only the two FD-2-specific checks (L969–L978, keyed on the literal `G2`) and `gateState("G2")`/`gateState("G3")` (L1006, L1009, L1025) are gate-name-specific.

**F-B8 — The 7fcff27 guard fix is too narrow for E9, proven on a fixture.** [MEASURED] Root guard L113 resolves a named run only via `/(^|[\\/])docs[\\/]implementation[\\/]([^\\/]+)[\\/]/i` on the written path and reads `.plan-it/<that segment>.state.json` (L114–L118), else the generic file. Fixture: `.plan-it/state.json` = `{state: discovery, contract.version: null}` and `.plan-it/v4.state.json` = `{contract.version: "1.0", run.deliveryRoot: "delivery/v4/"}`.
- Write to `<fixture>/delivery/v4/prds/prd-1.md` (root guard) → **DENY** citing the generic file. Wrong: the v4 run IS frozen.
- Write to `<fixture>/docs/implementation/v4/delivery/prds/prd-1.md` (root guard) → allow. Right, but only for the Engine-Core folder layout the fix was written for.
- Same `docs/implementation/…` write through the PLUGIN guard → DENY (no fix there at all).
- Sanity on this repo now: write `delivery/v4/prds/x.md` → DENY (correct, this run's contract is null); write `docs/v4/research/stream-B-machine.md` → allow (correct, `DELIVERABLE_RE` L21 matches only `prds?/`, `epics?/`, `prd-*.md`, `epics?-*.md`).
A run named `v4` at `delivery/v4/` is therefore governed by whichever run happens to own the generic file.

**F-B9 — `state --dir`, `freeze`, `testconv`, `resolveRunRoot` are all bound to the generic file.** [VERIFIED-IN-CODE] `readState(root)` L1086–L1092 reads `<root>/.plan-it/state.json`; it feeds `cmdFreeze` casesReviewed (L123) and `cmdTestconv` (L1269). `cmdTestconv.writeReceipt` L1272–L1276 WRITES `<root>/.plan-it/state.json` — on a named run it would create or overwrite the generic file. `resolveRunRoot` L1107 requires a sibling generic file. `cmdState --dir` L939 joins the generic name. Root derivation for the FD checks L960 uses `endsWith(join(".plan-it","state.json"))`, so `state .plan-it/v4.state.json` runs in "bare" mode and silently SKIPS the A3/B1/B2 root-aware checks. Full site list in F-B12.

**F-B10 — Guard freeze rule accepts ANY non-empty `contract.version` string.** [VERIFIED-IN-CODE] Root L122–L123 / plugin L110–L111: `if (version !== null && version !== "") allow()`. So `"1.0-draft"` allows squad writes today. `cmdFreeze`'s version test `/\bv\d+\.\d+\b/` (L107) also matches `v1.0-draft` (the hyphen is a word boundary). Nothing distinguishes draft from final anywhere in the core — that is the hook the E7 draft path can hang on (§4.3).

**F-B11 — Every FD-2 gate check is keyed on `TEST-CONTRACT-REVIEW.md`.** [VERIFIED-IN-CODE] `state` L969–L978: when a root is derivable and `gates.G2.approved === true`, `<root>/delivery/TEST-CONTRACT-REVIEW.md` must exist (B1) and match `/^Reviewed-by:\s+\S.*\b\d{4}-\d{2}-\d{2}\b/m` (B2). `reconcileScan` L1385–L1419 (B3) maps draft-case bullets in that file to epic table rows. The delivery path is hardcoded to `delivery/` (not `delivery/v3/`), so it already works for a package at `delivery/`, but NOT for `delivery/v4/` (F-B14).

**F-B12 — Every hardcoded `.plan-it/state.json` site (gate-check plugin path).** [VERIFIED-IN-CODE] Behaviour-bearing: L152 (freeze RUN-POLICY provenance read), L939 (`state --dir`), L960 (root derivation suffix), L1088 (`readState`), L1107 (`resolveRunRoot`), L1274–L1275 (`testconv` write). Message-only: L9, L125, L942, L966, L1280, L1301, L1308, L1641. Guard: root L118 (fallback) and L113 (path regex); plugin L106. Prose (Stream C's surface, listed for completeness): `SKILL.md` 13 sites (L24, 92, 113, 205, 206, 276, 350, 418, 444, 480, 512, 548, 550), `references/machine.md` 6 sites (L5, 49, 85, 102, 127, 138), `references/templates.md` L152, L155 (KICKOFF pinning block — and `tests/v3/kickoff-pinning.mjs` L38–L45 asserts the literal `.plan-it/state.json` in that template and generates the live sample with the generic path L54).

**F-B13 — Mode selection and E7 flow are not in the machine today; `machine.json` has three human gates and one linear path.** [VERIFIED-IN-CODE] `machine.json` L44–L222: 17 states, single chain, one self-loop (`AMENDMENT` L182). `context` (L7–L12) has `size, shape, contractVersion, contractPath` only. The state verb prints "next events" from `on` (L1061) — a mode-branched machine will print both branches' events unless the verb learns `run.mode` (§4.2 item 6).

**F-B14 — Dogfood-path hardcodes make the v3 verbs blind to a package at `delivery/v4/`.** [VERIFIED-IN-CODE] `reconcileScan` reads `delivery/v3/epics` L1322, `delivery/v3/prds` L1328, `delivery/v3/CONTRACT.md` L1351; `cmdContract --dir` reads `delivery/v3/CONTRACT.md` L1168; `cmdFreeze --dir` candidates L90 and `resolveRunRoot` suffixes L1104 are `delivery/CONTRACT.md` or `delivery/v3/CONTRACT.md`; `cmdAdversary` L525 same pair. [MEASURED] `reconcile --dir .` on this repo PASSED — by scanning the v3 package, not because it inspected `delivery/v4/` (which has no prds/epics yet). A v4 run that keeps its package at `delivery/v4/` gets a false green from `reconcile` and `contract --dir` lints the wrong contract. Also `tests/v3/lib/contract-cases.mjs:21` pins `CONTRACT_PATH = delivery/v3/CONTRACT.md`, so run-contract's computed v3 case discovery will not see a v4 `## Cases` table without a harness extension.

**F-B15 — `handoff` already has the two embedding precedents v4 needs.** [VERIFIED-IN-CODE] Step 6 (L868–L872) embeds `reconcileScan` into `handoff` sharing the `failures` array and one `finish()` (C-W5-04, "never a subprocess, never double-reported"). Step 7 (L874–L906) is a scoped check that fires only when the package carries the relevant files (both manifests present). The status-vocabulary check (L841–L860) locates the `Status` column by header name and ignores every other column, so adding a `Disposition` column to a board is invisible to it (E8 safe).

**F-B16 — `adversary`'s ID grammar and the handoff ID grammar are the reusable token extractors for E10.** [VERIFIED-IN-CODE] `STATE_TOKEN_RE` L343 `/[A-Z][A-Z0-9]+(?:[_-][A-Z0-9]+)*/g` with `STATE_STOPWORDS` L344–L349; case grammar `/\bT-[A-Z]\d+[A-Za-z0-9.]*-\d{2}\b/` L539/L701; reconcile's binding-row grammar L1378 adds `C-(?:W\d+|META)-\d{2}`; governance `/\b((?:G|CB)-\d+)\b/` L476; requirement `/\bR-?\d+\b/` L1334; epic heading `[A-Z]\d+` L752/L1369. `stripCode` L73 gives mention-vs-use. A glossary lint can be assembled from these without inventing a new tokenizer.

**F-B17 — Exit-code conventions are documented and the harness depends on them.** [VERIFIED-IN-CODE] Binary 0/1 everywhere except `testconv` exit 2 (needs registration, L1313) and `mirror-check` exit 2 (drift, L1612; asserted by `tests/v3/mirror-drift.mjs:43`). `delivery/v3/CONTRACT.md` Invariants (AMD-3) sanction exit 2 = "action required". The v3 `## Cases` `run:` cells are executed by `fail-closed-sweep`/`run-contract` expecting NON-ZERO against violating fixtures (`tests/run-contract.mjs:502–509`), and `mechanismGap` L84 requires the case ID string to appear in `gate-check.mjs` source before a row counts as implemented — every v4 check must therefore name its case ID in its failure message.

**F-B18 — 7fcff27 landed with no test and no mirror.** [MEASURED] `git show --name-only 7fcff27` → one file. `run-contract` T-E6-01…05 (L239–L270) exercise only the generic file. Nothing in the harness covers named-run resolution, which is how the plugin copy could stay stale for two weeks.

## 2. What v3 has that v4 builds on (reuse map)

| Existing function / section | v4 use |
|---|---|
| `checkMachineAdditive` L278 + `cmdMachineDiff` L312 | Unchanged. Gate for the 4.0.0 machine against a byte-pinned 3.0.1 copy (`tests/fixtures/v3/machine.v3.7fcff27.json`, mirroring `machine.v2.fc6abc8.json`) AND the v2 baseline. |
| `cmdState` gate loop L996–L1005 (`meta.gate` → `gates[g].approved+owner+date`) | Enforces G0 (anamnesis) and G4 (planReview) recording with zero change. |
| `cmdState` B1/B2 block L969–L978 | Template for the `planReview` mirror: `gates.G4.approved` requires `<deliveryRoot>/PLAN-REVIEW.md` with a `Reviewed-by:` line. |
| `gateState(g)` L1006 | Reused to locate G0/G4 states; must stay first-match (no two states may share a gate id). |
| `parseDirFlag` L1080 | Extended with a sibling `parseRunFlag` for `--run <slug>`. |
| `readState(root)` L1086, `resolveRunRoot` L1102 | Become `readState(root, slug)` / `resolveRunRoot(path)` that consult `resolveStateFile` (§4.4). |
| `cmdFreeze` L79 (version regex L107, casesReviewed L122, RUN-POLICY L137) | Gains `--draft` (§4.3); all structural checks reused as-is. |
| `reconcileScan` L1320 + embedding in `handoff` L868 | Disposition counting (E8) is a new block inside `reconcileScan`, so `handoff` gets it for free (C-W5-04 pattern). |
| `cmdHandoff` step 7 L874 (scoped, fires only when files present) | Pattern for the glossary lint (fires when `GLOSSARY.md` exists) and the md↔html stamp check (fires when an `.html` twin exists). |
| `stripCode` L73, `PLACEHOLDER_RE` L61 | Mention-vs-use for glossary and disposition scans. |
| `STATE_TOKEN_RE`/`STATE_STOPWORDS` L343, case/gov/req grammars (F-B16) | Glossary token extraction. |
| `collectMdFiles` L665 | Walk `<deliveryRoot>` for glossary + mirror checks. |
| `cmdMirrorCheck` L1567 (Buffer.equals, byte offset, exit 2) | Precedent for the `mirror` verb's SHA-256 stamp compare and exit-code choice. |
| `looseCaseRows` L1120 | Parse the residual/disposition table the same way case rows are parsed. |
| `unavailableToolsFromEnvFacts` L1138 / `cmdPreflight` L206 | Untouched; ENV-FACTS.md unaffected by v4 (§5 seed 16). |
| `checkRunPolicySeeded` L583 (reads `gates.G1.decisions`) | Unchanged; the autonomous-draft path still records G1 decisions, so RUN-POLICY provenance keeps working. |
| `planit-guard.mjs` fail-open frame L40/L132, `DELIVERABLE_RE` L21, W3/W4 blocks L48–L103 | Untouched; only the state-file resolution block (root L105–L118) is replaced. |
| `tests/run-contract.mjs` `t()/gc()/guardCwd()/runGuard()` helpers | New v4 cases append in the same file, same helpers. |
| `tests/v3/lib/contract-cases.mjs` `parseContractCases`/`mechanismGap` | Parameterize `CONTRACT_PATH` (add `delivery/v4/CONTRACT.md`) so the v4 `## Cases` table is discovered the same computed way. |
| `delivery/decisions.md` AMD-1/AMD-2/AMD-3 | Precedent for the two test-contract amendments v4 needs (AMD-4 gate count, AMD-5 mirror pair count). |

## 3. Gaps v4 must close (mapped to E1–E10)

1. **(E9, E7, E6) Guard resolves the run by folder convention, not by run identity** — F-B8. Needs `run.deliveryRoot` + a scan of `.plan-it/*.state.json`.
2. **(E9) Plugin guard is stale** — F-B1. Mirror + re-run mirror-check must be part of the same commit; add a run-contract case for named-run resolution (F-B18).
3. **(E9) Six behaviour-bearing generic-path sites in gate-check** — F-B12. `state --run`, `readState(root, slug)`, `resolveRunRoot`, testconv write target.
4. **(E9) `archive` and `runs` verbs do not exist** — LG-3, screenshot `mv`.
5. **(E6, E7) No `triage`, `anamnesis`, `scopeBrief`, `defaultsApplied`, `render`, `planReview`, `freeze`, `closedWithoutPlan` states; no `run.mode`** — F-B13.
6. **(E7) Draft-vs-final contract is indistinguishable** — F-B10. `freeze --draft`, `-draft` version suffix, and a `state` check that a draft cannot reach `handoff`.
7. **(E7) Review artifact is hardwired to TEST-CONTRACT-REVIEW.md** — F-B11. PLAN-REVIEW.md mirror for G4.
8. **(E8) No disposition grammar or counting** — E8 text: "gate-check reconcile counts dispositions the way it counts cases".
9. **(E10) No glossary lint; no ID→row check in handoff.**
10. **(E2) No md↔html stamp check** (`mirror` verb; contract from Stream A).
11. **(all) `T-E1-05` "exactly 3 gates" and `T-E1-03` closed check set will fail** — F-B6. Two amendments.
12. **(E9, all) Dogfood `delivery/v3/` hardcodes in reconcile/contract/adversary/freeze and in `contract-cases.mjs`** — F-B14. Must resolve the package dir from `run.deliveryRoot`.
13. **(E10, E9) Prose/template hardcodes of `.plan-it/state.json`** — F-B12 tail; Stream C owns the text, but `tests/v3/kickoff-pinning.mjs` L38–L45 will need its regex widened when the template changes (`.plan-it/<slug>.state.json`).
14. **(process) The release checklist exists only as prose** — F-B1. A pre-commit or a `release` verb is out of scope for this stream; recommend at least that `T-E5-02` be kept red-blocking (it already is) and that the guard fix be re-landed via the mirror.

## 4. Design proposal for this concern

### 4.1 The v4 machine as an additive superset (verified shape: F-B5)

Eight new states (the seven requested plus one terminal). Mode is `run.mode ∈ {"autonomous-draft", "guided"}` (D1: default autonomous-draft), recorded at `anamnesis`. The machine holds BOTH paths; the skill fires the mode's events; the `state` verb enforces mode consistency (item 6 below).

| from | event | to | guard | note |
|---|---|---|---|---|
| intake | INTAKE_CAPTURED | **triage** | — | baseline edge retargeted through a NEW state (rule 6, allowed) |
| triage | TRIAGE_PLAN | **anamnesis** | triageRecorded | verdict "Plan now" |
| triage | TRIAGE_BUILD_INSTEAD | **closedWithoutPlan** | triageRecorded | memo + backlog card required |
| triage | TRIAGE_SKIP | **closedWithoutPlan** | triageRecorded | memo required ("measured zero") |
| triage | TRIAGE_OWNER_DECISION | **closedWithoutPlan** | triageRecorded | decision card required; see §6 Q3 |
| anamnesis (gate **G0**, human) | G0_ANSWERED | dodLock | gateRecorded | records `gates.G0` + `run.mode` |
| dodLock | DOD_LOCKED | **scopeBrief** | — | retargeted through NEW state |
| scopeBrief | BRIEF_RENDERED | scopeGate | artifactsOnDisk | SCOPE-BRIEF.md (+ .html) on disk |
| scopeGate (G1) … specAuthoring | unchanged | unchanged | unchanged | 7 baseline edges byte-identical |
| specAuthoring | SPECS_DRAFTED | decisionGate | — | guided (baseline) |
| specAuthoring | SPECS_DRAFTED_AUTONOMOUS | **defaultsApplied** | — | new event on a baseline state (not inspected by machine-diff) |
| defaultsApplied | DEFAULTS_APPLIED | coherencePass | defaultsRecorded | `gates.G2.defaults[]` non-empty, every row `source:"recommended"` |
| coherencePass | COHERENT | freezeGate | — | guided (baseline) |
| coherencePass | COHERENT_AUTONOMOUS | backboneFreeze | — | new event; skips freezeGate |
| freezeGate (G3) | G3_APPROVED | backboneFreeze | gateRecorded | guided (baseline) |
| backboneFreeze | CONTRACT_FROZEN | parallelPlanning | contractFrozen | guided: `freeze` → v1.0 · autonomous: `freeze --draft` → v1.0-draft |
| parallelPlanning | AMENDMENT / SQUADS_COMPLETE | unchanged | unchanged | |
| verify | LINT_CLEAN | adversaryGate | handoffLintClean | unchanged; `handoff` now embeds glossary + mirror checks |
| adversaryGate | ADVERSARY_CLEAN | **render** | adversarialDepth | retargeted through NEW state; both modes render |
| render | RENDERED | handoff | artifactsOnDisk | guided |
| render | REVIEW_READY | **planReview** | artifactsOnDisk | autonomous |
| planReview (gate **G4**, human; `meta.records: ["G2","G3"]`) | REVIEW_ANSWERED | **freeze** | planReviewed | records G4 + G2 answers + G3 approval in one stop; contradictions listed |
| freeze | CONTRACT_FINAL | handoff | contractFrozen | `freeze` without `--draft`; version v1.0-draft → v1.0 |
| freeze | REVIEW_CONTRADICTED | parallelPlanning | contractFrozen | recovery path: a contradiction that changes the CONTRACT re-enters squads as an AMENDMENT (v1.1-draft), then back through verify → adversaryGate → render → planReview |
| handoff | HANDED_OFF | done | — | unchanged |
| closedWithoutPlan | (final) | | | `meta.does`: "memo + backlog card written; no package" |

Check against every `checkMachineAdditive` rule (F-B3): (1) `initial` stays `intake` ✓ (2) all 17 baseline names present ✓ (3) `done` stays final; `closedWithoutPlan` is a new final ✓ (4) all 17 baseline events present ✓ (5) no baseline edge changes guard — the three retargeted edges keep `—`, `—`, `adversarialDepth` ✓ (6) the three retargets land on NEW states ✓ (7) all 5 baseline guards present; `triageRecorded`, `defaultsRecorded`, `planReviewed` are additions ✓. [MEASURED] on the prototype (F-B5).

**Guard → check mapping (to survive `T-E1-03`, F-B6):** `triageRecorded → state`, `defaultsRecorded → state`, `planReviewed → state`. The `state` verb gains the three payload checks (items 1–3 below). No new check names appear in `meta.guards`; `mirror` and `glossary` are verbs a human can run but are embedded in `handoff` for gating.

**Gate ids:** G0 (anamnesis), G4 (planReview). Both break `T-E1-05` as written → **AMD-4**: "exactly 3 gate states on the byte-pinned v2 baseline; the live machine carries G1, G2, G3 and every state with `meta.gate` has `meta.human: true`". Zero-test-change alternative: use `meta.stop` instead of `meta.gate` on the two new states and teach `state` to honour `meta.stop` — rejected because it forks the gate concept in two keys for a test's convenience; the AMD mirrors AMD-1 exactly.

**Failure/recovery states named:** `closedWithoutPlan` (terminal, honest exit); `freeze.REVIEW_CONTRADICTED → parallelPlanning` (recovery loop); `planReview` refused by the `state` verb when PLAN-REVIEW.md is missing (fail-closed, fix = write the file); `render` refused by `artifactsOnDisk` when a twin is missing; `archive` refuses a non-terminal run (fail-closed, fix = finish or record verdict). Resume after crash is unchanged: `state --run <slug>` prints the position and the mode's next events.

### 4.2 `state` verb additions (all additive, all fire only when the relevant key is present)

1. **triage** — if `history` contains `triage`: `triage.verdict ∈ {plan, build-instead, owner-decision, skip}`, `triage.measuredAt` date, `triage.measurements[]` (may be empty for `plan`); for `build-instead|skip|owner-decision` `triage.memo` must exist on disk relative to the run root (case name in message: `T-E6-01`-style ID from the v4 CONTRACT).
2. **defaultsApplied** — if visited: `gates.G2.defaults` is a non-empty array of `{id, question, default, rationale, source:"recommended", contradicted:boolean}`; `gates.G2.approved` may be `false` here (autonomous: G2 is answered at planReview).
3. **planReview** — if `gates.G4.approved === true`: `<deliveryRoot>/PLAN-REVIEW.md` on disk (B1 mirror) with `/^Reviewed-by:\s+\S.*\b\d{4}-\d{2}-\d{2}\b/m` (B2 mirror); `gates.G2` and `gates.G3` must be `approved+owner+date` (via `meta.records`); every `gates.G2.defaults[]` row must be either `contradicted:false` (accepted) or have a matching `gates.G4.contradictions[]` entry.
4. **draft cannot hand off** — if `state ∈ {handoff, done}` and `/-draft$/.test(contract.version)` → fail.
5. **G2 review artifact, mode-aware** — extend L969: when `run.mode === "autonomous-draft"`, the B1/B2 artifact is `PLAN-REVIEW.md` (which embeds the case review) instead of `TEST-CONTRACT-REVIEW.md`; guided keeps today's file byte-for-byte.
6. **mode consistency** — `run.mode === "autonomous-draft"` and `history` contains `decisionGate|freezeGate` → fail; `"guided"` and history contains `defaultsApplied|planReview|freeze` → fail. "next events" printout filters `on` to the mode's events (`meta.mode` tag on the new events; untagged = both).
7. **`--run <slug>`** and named-path root derivation (§4.4).

Insertion points: after `parseDirFlag` handling at L934–L940 (flag parsing); after L978 (gate-payload checks 1–5); L960 (root derivation regex); the printout L1059–L1072 (mode filter).

### 4.3 Draft contract (E7) and Rule 1

Recommendation: `contract.version = "1.0-draft"` at `backboneFreeze` in autonomous-draft mode; `freeze <CONTRACT.md> --draft` requires the header `v1.0-draft`, runs every structural check (sections, changelog, placeholders, RUN-POLICY body + provenance) and SKIPS only C-W1-03 `casesReviewed` (recording `contract.draft: true`); `freeze` without `--draft` additionally rejects a `-draft` header ("draft cannot be final") and requires `casesReviewed === true`. The `freeze` state bumps to `v1.0` and clears `contract.draft`.

Implications for Rule 1 ("no frozen CONTRACT → no parallel squads"): the guard (F-B10) already allows on any non-empty version, so a draft lets squads write — that is E7's intent ("the CONTRACT is drafted, not frozen"). What changes is the meaning of "frozen" for the squads: structurally complete and internally consistent, but human-unreviewed. Cost: a contradiction at `planReview` that touches the CONTRACT forces `REVIEW_CONTRADICTED → parallelPlanning` (an AMENDMENT round after squads wrote). Mitigations that stay additive: (a) the `state` check 4 (a draft can never hand off); (b) `freeze --draft` refuses if `gates.G2.defaults` is empty (no defaults applied = nothing to review); (c) the guard is NOT changed to distinguish drafts — keeping it dumb keeps it fail-open and byte-small. Option considered and rejected: writing `v0.9` at backboneFreeze — it hides draft status behind a number and breaks the "amendments v1.0 → v1.1" changelog rule already frozen in `machine.md` §1.

### 4.4 Named runs (E9): resolution, `--run`, `archive`, `runs`

State-file schema additions (all optional; `state` tolerates them, F-B7): `run.name` (slug, `^[a-z0-9][a-z0-9-]*$`), `run.mode`, `run.deliveryRoot` (repo-relative dir with trailing slash, e.g. `delivery/v4/`), `run.anamnesis`, `triage{}`, `gates.G0`, `gates.G2.defaults[]`, `gates.G4`, `contract.draft`, `render{manifest, outputs[{md, html, sha256}]}`, `archive{archivedAt, from}`.

`meta.stateFile` becomes `".plan-it/<slug>.state.json"` with `meta.stateFileFallback: ".plan-it/state.json"` (documentation; F-B4).

New helper `resolveStateFile(root, slug)` (insert after `readState` L1092): if `slug` → `<root>/.plan-it/<slug>.state.json`; else if exactly one `<root>/.plan-it/*.state.json` exists and no generic → that one; else generic. `readState(root, slug)`, `resolveRunRoot(path)` (accept `<root>/<deliveryRoot>/CONTRACT.md` by scanning state files' `deliveryRoot`), `cmdState --dir … --run <slug>`, `cmdFreeze --dir … --run`, `cmdTestconv --dir … --run` (write receipt to the named file), `cmdContract/cmdReconcile/cmdAdversary --run` (delivery dir = `run.deliveryRoot`, falling back to `delivery/` then `delivery/v3/`) all route through it. Root derivation L960 regex: `/[\\/]\.plan-it[\\/](?:[a-z0-9][a-z0-9-]*\.)?state\.json$/`.

**Guard resolution (replaces root L105–L118, then mirrored):** read `input.cwd`; list `.plan-it/*.state.json` (excluding `done/`); parse each (skip unparseable); pick the run whose `run.deliveryRoot` (resolved against cwd) is the longest path-prefix of the written file; if none, apply the legacy `docs/implementation/<name>/` match; if none, the generic file; if none, allow. Everything else in the hook is byte-identical. Deny message names the RESOLVED file, not the literal `.plan-it/state.json`.

**`archive <slug> [--dir root] [--force]`** (new `cmdArchive`, insert before `const commands` L1616): requires `state ∈ {done, closedWithoutPlan}` else exit 1 "refuses to archive a run in state <s>"; refuses if `.plan-it/done/<slug>.state.json` exists; `renameSync` to `.plan-it/done/`, appends `archive:{archivedAt, from}`; `archive --generic <slug>` names and archives the legacy generic file. `--force` is NOT offered (a non-terminal run is finished or triaged to `closedWithoutPlan`, never archived).

**`runs [--dir root] [--json]`** (new `cmdRuns`): lists `.plan-it/*.state.json` + `.plan-it/done/*.state.json` as `slug | state | mode | contract.version | last transition (history[-1].at) | deliveryRoot | archived?`; counts computed; exit 0 even for zero runs ("no plan-it runs under <root>"); exit 1 only on unparseable files (named).

### 4.5 `mirror <md> <html>` (E2 stamp check; contract from Stream A)

Reads the HTML, finds `<meta name="planit-source" content="<relpath> sha256=<64-hex>">`; resolves `<relpath>` against the HTML file's directory; requires the md to exist; computes SHA-256 of the md bytes (`node:crypto`, same byte semantics as `mirror-check`); compares. Exit 0 = fresh; exit 2 = stale (action: re-render — mirrors `mirror-check`'s drift exit, F-B17); exit 1 = no stamp / malformed / md missing. Also accepts `mirror --dir <delivery-dir>`: every `*.html` with a stamp is checked against its twin; an `.md` twin with no `.html` is reported (not failed) unless `--require-html`. Embedded in `handoff` as step 9, scoped: fires only when at least one stamped `.html` exists under the delivery dir (F-B15 pattern). Insert `cmdMirror` after `cmdMirrorCheck` L1613.

### 4.6 `render` — recommend it lives OUTSIDE gate-check

`render <manifest> [--open]` should be a separate zero-dep script (`scripts/build-report.mjs`, Stream A's renderer port of LG-5), not a `gate-check` verb. Reasons: gate-check's contract is "guards as exit codes" with a shared `failures[]`/`finish()` frame (L22–L34) — a generator has a different failure model and output; `T-E1-03`'s closed check set means `render` could never be a guard anyway (F-B6); `--open` spawns a browser, which does not belong in a file that `tests/run-contract.mjs` executes hundreds of times; and gate-check is already 1653 lines. The machine's `render` state is guarded by `artifactsOnDisk` (verify) on the produced twins, and freshness is gated by `mirror` inside `handoff`. Consequence: `scripts/build-report.mjs` becomes the 9th `MIRROR_PAIRS` entry (L1556) and the 9th pair in `T-E5-02` (L292) → **AMD-5** (AMD-2 precedent, "eight pairs" invariant in `delivery/v3/CONTRACT.md`).

### 4.7 `glossary <delivery-dir>` (E10) and the handoff wiring

`GLOSSARY.md` row grammar: `| ID | Expansion | Where defined |`, ID cell matches `^[A-Z][A-Z0-9]*(?:[-.][A-Z0-9]+)*$` or a family pattern with `*`/`NN` (`T-*-NN`, `C-W*-NN`, `E*.*`). Extraction from `KICKOFF.md`, `DECISIONS.md`, `STATUS.md`, `SESSIONS.md`, `GATE.md` (whichever exist): `stripCode` first (mention-vs-use), then tokens matching `/\b[A-Z]{1,4}-?\d+(?:[.-][A-Z0-9]+)*\b|\b(?:G|W|D|R|E|F|Q|EC|FD|LG|AMD)-?\d+\b/g`, minus `STATE_STOPWORDS`-style stoplist (`UTF8`, `SHA256`, `ISO8601`, `HTTP2` …). Each token must match a row ID exactly or a family pattern (`T-A4-B1` ⇐ `T-*-NN`… with `NN` matching `[A-Z0-9]{1,3}`). Exit 1 names every unknown ID with `file:line`. Embedded in `handoff` as step 8, scoped: fires when `GLOSSARY.md` exists under the delivery dir; the `state` verb requires `GLOSSARY.md` on disk at `handoff` when `machineVersion` major ≥ 4 (so v3 packages never regress). Insert `cmdGlossary` before `const commands`; reuse `collectMdFiles`, `stripCode`.

### 4.8 Disposition counting in `reconcile` (E8) and the STATUS.md grammar

Board grammar (extends the templates.md L171 board): `| EID | Epic | Squad | Wave | Status | Tests (green/total) | Branch | Disposition |` plus a `## Residuals` table `| Item | Disposition | Reason / exit criterion | Evidence |`. Disposition cell grammar (closed): empty or `—` when Status = VERIFIED; otherwise exactly one of `backlog-with-reason: <repo-relative path to the filed note>`, `owner-gated: <owner name>`, `IMPLEMENTED-NOT-VERIFIED: <case-id> <unreachable target>`. Rules in `reconcileScan` (new block after L1419, scoped: fires only when a `Disposition` column or `## Residuals` heading exists): every non-VERIFIED row has a well-formed disposition; a `backlog-with-reason` path exists on disk; an `owner-gated` owner is non-empty; a residual whose Item is a contract case ID (`T-…`/`C-…`) with disposition `backlog-with-reason` fails ("contract cases never move to backlog"); a hand-typed `Dispositions: N backlog · M owner-gated · K INV` line must equal the computed counts (C-W5-01 pattern). `handoff` inherits it via the embedding (F-B15).

### 4.9 Exact insertion map (gate-check.mjs, plugin path; root mirror follows)

| change | lines |
|---|---|
| header usage comment | L5–L12 |
| `cmdFreeze --draft`, `-draft` header rule | L79–L98 (parse), L107 (regex → `/\bv\d+\.\d+(?:-draft)?\b/`), L122–L127 (skip casesReviewed when draft) |
| `resolveStateFile`, `parseRunFlag`, `readState(root, slug)`, `resolveRunRoot` via deliveryRoot | after L1084; L1086–L1092; L1102–L1111 |
| `cmdState`: `--run`, root regex, checks 1–7, mode-filtered printout | L934–L940; L960; after L978; L1059–L1072 |
| `cmdTestconv` receipt to the named file | L1272–L1276 |
| `reconcileScan`: deliveryRoot-aware paths, disposition block | L1322, L1328, L1351; after L1419 |
| `cmdContract`/`cmdAdversary` deliveryRoot-aware | L1168; L525 |
| `cmdHandoff` steps 8 (glossary) + 9 (mirror) | after L906, before `finish` L908 |
| new `cmdMirror`, `cmdArchive`, `cmdRuns`, `cmdGlossary` | after L1613 |
| `MIRROR_PAIRS` + `scripts/build-report.mjs` | L1556–L1565 |
| dispatch + usage | L1616–L1629; L1637–L1649 |
| guard resolution block | root `scripts/hooks/planit-guard.mjs` L105–L118 → then copy to plugin |
| harness | `tests/run-contract.mjs` L108–L116 (AMD-4), L282 (version 4.0.0), L292 (9th pair), new `T-*` blocks; `tests/v3/lib/contract-cases.mjs` L21 (add v4 CONTRACT path); new `tests/fixtures/v4/` + `tests/fixtures/v3/machine.v3.7fcff27.json` byte-pinned |

## 5. Test-contract seeds (ID-less; given/when/then + how to run)

1. **machine-diff passes with the 8 new states.** Given the 4.0.0 `machine.json`; when `gate-check machine-diff machine.json tests/fixtures/v3/machine.v3.7fcff27.json` and again against `tests/fixtures/v2/machine.v2.fc6abc8.json`; then both exit 0. Run: the two commands. (Prototype already measured PASS, F-B5.)
2. **Guided path unchanged on the 17 v3 states.** Given the 4.0.0 machine; when every state/event/guard of the 3.0.1 machine is looked up in it; then all 17 states, all 17 baseline events and all 5 guards are present with identical guard names, and the only differing targets are the three retargets onto new states. Run: a node one-liner over both JSONs, or `machine-diff` (which asserts exactly this).
3. **Fail-closed sibling for seed 1.** Given a fixture machine that drops `adversaryGate`; when `machine-diff`; then exit 1 naming "baseline state missing/renamed". Run: fixture `tests/fixtures/v4/machine-drops-adversary.json`.
4. **`state` rejects planReview approval without PLAN-REVIEW.md (mirror of T-A4-B1).** Given `tests/fixtures/v4/planreview-no-file/.plan-it/v4.state.json` with `gates.G4.approved:true`, no `delivery/v4/PLAN-REVIEW.md`; when `gate-check state --dir <fixture> --run v4`; then exit 1 naming the case and the missing path. Sibling: file present without `Reviewed-by:` → exit 1 (B2 mirror).
5. **triage Skip requires a memo.** Given a state with `history` containing `triage`, `triage.verdict:"skip"`, no `triage.memo` file; when `state`; then exit 1 "verdict skip requires memo on disk". Positive: memo present → exit 0 and `state: closedWithoutPlan — (final state)`.
6. **archive moves and refuses.** Given `tests/fixtures/v4/portfolio/.plan-it/{alpha.state.json (state done), beta.state.json (state discovery)}` copied to a temp dir; when `archive alpha --dir <tmp>`; then `.plan-it/done/alpha.state.json` exists with `archive.archivedAt`, the source is gone, exit 0; when `archive beta --dir <tmp>`; then exit 1 "refuses to archive a run in state discovery" and `beta.state.json` is untouched.
7. **runs lists the portfolio.** Given the same fixture; when `runs --dir <fixture>`; then stdout has exactly 2 rows (`alpha … done`, `beta … discovery`) and a computed "2 run(s)" line; `--json` parses. Zero-run dir → exit 0, "no plan-it runs".
8. **glossary lint fails on an unknown ID in KICKOFF.** Given `tests/fixtures/v4/glossary-unknown-id/delivery/{KICKOFF.md (mentions X9-77), GLOSSARY.md (no X9-77 row)}`; when `gate-check glossary <fixture>/delivery` and `gate-check handoff <fixture>/delivery`; then both exit 1 naming `X9-77` with file:line. Positive: every ID resolves, including a family match `T-A4-B1 ⇐ T-*-NN` → exit 0.
9. **disposition lint fails on a non-green row with no disposition.** Given `tests/fixtures/v4/disposition-missing/delivery/STATUS.md` with a `Disposition` column and one `IN-PROGRESS` row whose cell is empty; when `reconcile --dir <fixture>`; then exit 1 naming the row. Sibling: a `## Residuals` row with Item `T-B2-04` and disposition `backlog-with-reason: …` → exit 1 "contract cases never move to backlog". Sibling: hand-typed `Dispositions:` tally ≠ computed → exit 1 with both numbers.
10. **Guard resolves a named run by deliveryRoot.** Given `tests/fixtures/v4/guard-two-runs/.plan-it/{state.json (contract null), v4.state.json (contract "1.0-draft", run.deliveryRoot "delivery/v4/")}`; when hook input `Write <fixture>/delivery/v4/prds/prd-1.md`; then allow (empty stdout); when `Write <fixture>/delivery/other/prds/prd-1.md`; then deny naming `.plan-it/state.json`. Run: `node scripts/hooks/planit-guard.mjs < input.json` for both the root AND plugin copies (asserts the mirror carries the fix). (Today's root copy DENIES the first case — F-B8.)
11. **Guard denies a genuinely unfrozen named run.** Given the same fixture with `v4.state.json` `contract.version:null`; when writing under `delivery/v4/prds/`; then deny, reason names `v4.state.json`.
12. **mirror check fails on a stale stamp.** [REAL-ish: uses `node:crypto` on fixture bytes] Given `tests/fixtures/v4/mirror-stale/{CONTRACT.md, CONTRACT.html}` where the html stamp hash was computed before one byte of the md changed; when `gate-check mirror CONTRACT.md CONTRACT.html`; then exit 2 naming both hashes. Siblings: no `planit-source` meta → exit 1; fresh → exit 0.
13. **Extra state-file keys tolerated.** Given `.plan-it/state.json` with `run.name`, `run.anamnesis`, `run.deliveryRoot`, `triage`, `gates.G0`, `gates.G4`, `render`, `archive` all present; when `state`; then exit 0. (Measured today for the first two, F-B7.)
14. **Draft cannot hand off.** Given a state `state:"handoff"`, `contract.version:"1.0-draft"`; when `state`; then exit 1 "draft contract cannot hand off". Given `freeze <CONTRACT.md>` (no `--draft`) on a header `v1.0-draft`; then exit 1 "draft cannot be final". Given `freeze --draft` with `casesReviewed:false`; then exit 0 (C-W1-03 deferred) and the RUN-POLICY checks still ran (a `--draft` fixture missing `reap-on-merge` → exit 1).
15. **Mode consistency.** Given `run.mode:"autonomous-draft"` and `decisionGate` in history; when `state`; then exit 1. Given `run.mode:"guided"` and `planReview` in history; then exit 1.
16. **ENV-FACTS unaffected.** Given `tests/fixtures/v3/preflight-s` and `preflight-ml` (unchanged); when `node tests/v3/preflight-tiering.mjs` and `node tests/v3/probe-timeout.mjs`; then results identical to the 3.0.1 baseline (both currently PASS in the v3 section, F-B2). Run: the existing scripts; no v4 change touches `cmdPreflight` L206–L275.
17. **Named-run guard fix is mirrored and tested (closes F-B1/F-B18).** When `gate-check mirror-check`; then exit 0, 9 of 9 pairs; and `run-contract` `T-E5-02` passes with the 9-pair list.
18. **AMD-4 gate-count test.** Given the 4.0.0 machine; when the re-scoped `T-E1-05`; then exactly 3 gate states on the v2 baseline, live has G1/G2/G3 present, and every `meta.gate` state has `meta.human:true` (5 in 4.0.0).

## 6. Contradictions / risks / open questions for synthesis

- **Q1 (blocking for the CONTRACT): two run-contract cases must be amended, not just extended.** `T-E1-05` "exactly 3 gates" and `T-E1-03`'s closed check set (F-B6). Proposed AMD-4 (gate count binds to the v2 baseline; live ≥ 3 with G1–G3 present) and the guard→check mapping in §4.1. Also AMD-5 for the 9th mirror pair if `build-report.mjs` ships in gate-check's neighbourhood. Both need Fernando's ruling like AMD-1/AMD-2 did.
- **Q2: "guided path unchanged byte-for-byte on the 17 v3 states" is not literally achievable.** Three baseline edges are retargeted through new states (`triage`, `scopeBrief`, `render`), and the enhancements HTML itself says guided mode still runs triage, scopeBrief and render. `machine-diff` allows it (rule 6). The honest statement is: 17 states, 17 events, 5 guards identical; 3 targets changed to new states; guided still records G2/G3 exactly as today.
- **Q3: routing of the "Owner decision, not a build" verdict.** The lead's brief routes only Skip/Build-instead to `closedWithoutPlan`; the E6 text also says owner-decision is "not a build". I routed it to `closedWithoutPlan` with a decision-card artifact and a `triage.reopenWhen` note. Alternative: `TRIAGE_OWNER_DECISION → anamnesis` when the owner has already ruled in the same sitting. Synthesis should pick one; both are additive.
- **Q4: Rule 1 is weakened by design in autonomous-draft.** Squads write against `v1.0-draft` (§4.3). The mitigations are the `state` "draft cannot hand off" check and the `REVIEW_CONTRADICTED` recovery loop. If Fernando wants the guard itself to know about drafts (e.g. deny deliverable writes when `contract.draft && state ∈ {freeze, handoff}`), that is a 3-line addition but it makes the hook less dumb; I recommend against.
- **R1: dogfood `delivery/v3/` hardcodes give a v4 package at `delivery/v4/` false greens** (F-B14): `reconcile` scans nothing, `contract --dir .` lints the v3 contract, run-contract discovers only v3 cases. `run.deliveryRoot` must feed all of them in the same epic that adds named runs, or the v4 CONTRACT's own cases will not run. Decide the v4 package location NOW (`delivery/v4/` per SHARED-CONTEXT) and derive from state, never a literal.
- **R2: `testconv` writes the generic file** (F-B9). On a named run the FD-1 receipt lands in `.plan-it/state.json`, and the `state` A3 check on the named file will not see it. Must go with `--run`.
- **R3: exit-code choice for `mirror`.** `mirror-check` uses exit 2 for drift (T-C3-06), AMD-3 says exit 2 = "action required". I propose 2 = stale (re-render), 1 = structural. If synthesis prefers strict binary for new verbs, say so in the CONTRACT Invariants.
- **R4: LG-2 means the fix reaches nobody until release.** The bare `/plan-it` skill loads `~/.claude-loudr/skills/plan-it/` (2.1.0) with no hook; the plugin at 3.0.1 has the stale guard; settings enable the old `plan-it@plan-it` namespace. E9's guard work only matters if 4.0.0 is installed from the `devotts` marketplace — a release/packaging concern for Stream C.
- **R5: `kickoff-pinning.mjs` L38–L45 and L54 assert the literal `.plan-it/state.json`.** When templates move to `<slug>.state.json` (Stream C), this C-W6-01 script must widen its regex in the same commit or the fail-closed sweep will report a hole.
- **R6: this run's own state is the legacy shape.** `.plan-it/state.json` with `run.name:"v4"` — the E9 default says it should be `.plan-it/v4.state.json`. Migrating it mid-run is a `mv` plus the guard/`--run` support landing; not before the core changes ship. Leave it and note it in KICKOFF.
- **R7: T-E5-01 pins `3.0.1`** (`run-contract.mjs:284`) — bumps with every release; expected, listed so the version-triple-match set (7 sources + this literal) is complete.

## 7. Teammate boundaries (deliberately not covered)

- **Stream A (renderer / manifest / HTML / brand):** I did not design the manifest schema, `build-report.mjs` internals, the theme, or the `planit-source` stamp format; I only consumed the stamp contract as given (`<meta name="planit-source" content="<relpath> sha256=<hash>">`) and recommended where `render` should live (§4.6). If Stream A's stamp resolves `<relpath>` against the repo root rather than the HTML's directory, §4.5 must follow.
- **Stream C (SKILL prose / references / templates / packaging):** I listed the 21 prose sites that hardcode `.plan-it/state.json` (F-B12) and the STATUS/GLOSSARY grammars the verbs will parse (§4.7, §4.8), but wrote no template text, no SKILL phases, no CHANGELOG, no marketplace/version bumps, and no anamnesis questionnaire content.
- **Stream D (precedents):** I did not read the Engine-Core field packages (GATE.md, SESSIONS.md, ORCHESTRATOR-STATE.md); E4 topology/sessions have no machine footprint beyond `run.mode` and the `render` state, so nothing here depends on them.
- **Not done on purpose:** no file in the repo was changed (the mirror drift and the failing `T-E5-02` are left as measured; fixing them is Wave 1 work under the v4 CONTRACT, not research).
