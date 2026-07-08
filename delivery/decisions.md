# decisions.md — Shared Decision Contract (plan-it v3 planning run)

## Key source facts verified on 2026-07-08

### D-0: Repo baseline reconciliation (intake mandate: "verify before anything")
- Intake asserted: `https://github.com/DevOtts/plan-it.git`, **main @ a12f393**, plugin version 2.1.0.
- Verified reality: `a12f393` (research package commit) lives on branch **`v2/deterministic-core`**, NOT main. Current HEAD = `fc6abc8`, two docs-only commits ahead of `a12f393`:
  - `fc6abc8` docs: track v3 pre-study research streams (A-pxpipe, B-damonade)
  - `f744ecb` docs: session debrief — 2026-07-07 v3 research package
- **main is stale at `1f09119`** — 5 commits behind HEAD (predates `125ef44` README v2.1.0 and `e6126c6` LinkedIn post).
- Plugin version confirmed **2.1.0** (`plugin.json:4`).
- Tree dirty state: only `docs/research/v3/stream-{C,D}-*.md` (untracked skeletons from the crashed prior fan-out; being overwritten by re-dispatched streams — see D-1). No other dirt.
- **Disposition:** planning proceeds from `v2/deterministic-core @ fc6abc8` as the true baseline. The branch→main merge is a git-scope decision (EC-B2 class) — queued as a G2 decision item and folded into the release & comms epic, NOT performed unilaterally mid-plan.

### D-1: Fan-out recovery (Rule 3 — idle ≠ delivered)
- Prior session's discovery fan-out left stream-C (457 B) and stream-D (393 B) as empty skeletons: agents went idle without delivering.
- 2026-07-08: both streams re-dispatched on **sonnet** (per G1 tiering: haiku fetch / sonnet analyze / Fable 5 synthesis+freeze), with explicit Rule-3 output contracts (write-to-disk + content-bearing final message). Streams A (pxpipe) and B (damonade) verified real (~15 KB, committed in `fc6abc8`) — not re-run.
- This incident is itself corroborating evidence for backlog item 12 (Agent I/O protocol, EC-H4).

### D-0b: Baseline re-check on resume (2026-07-07 session)
- Session brief asserted: **main @ `e6126c6`** ("LinkedIn post v3: dogfood angle"). Verified reality: `e6126c6` also lives on **`v2/deterministic-core`** (7 commits behind HEAD), main STILL stale at `1f09119` — consistent with D-0; the branch→main merge remains queued in the release & comms epic.
- HEAD moved to `1e5fa46` — 3 checkpoint commits (`2c5432a`, `74c46a5`, `1e5fa46`) from this very planning run, ahead of `origin/v2/deterministic-core @ fc6abc8` (unpushed). Tree clean.
- State-file repair on resume: prior checkpoint persisted invalid state `"contract"` and left G2 unrecorded; repaired to `freezeGate` + G2 {approved, Fernando Ott, 2026-07-08} — gate-check `state` now passes. No phase re-run.

## Non-negotiables as enforced in this run
- Protected core untouched (additive-only designs): freeze mechanism, [REAL] Test Contracts, gate-check.mjs existing checks, KICKOFF read-order, evidence ledgers, batched decision gate, statechart deterministic core.
- FD-1 and FD-2 ship in v3, period (founder-mandated; ranked M1/M2).
- Scope cuts, if auto-sizing demands them, come from the bottom of the ranked backlog — never FD-1/FD-2/top-5.
- v3 is planned by v2.1.0 itself (dogfood): ends with frozen CONTRACT + binding Test Contracts (incl. EC-D7 loader/metadata-parse cases) + KICKOFF + file-based launch prompt.
- Release & comms epic (EC-D8: version bump, README, CHANGELOG, LinkedIn post) goes INSIDE the contract.

## Verification ceiling (this environment)
- CAN be VERIFIED here: gate-check.mjs behavior, machine.json state validity, file/layout lints, loader metadata parse (local `claude` plugin tooling), doc consistency.
- IMPLEMENTED-NOT-VERIFIED ceiling: cross-subscription handoff behavior and marketplace install UX (needs a second subscription/machine — same class as EC-D1/EC-G1 incidents).

## 2026-07-07 — G3 + FREEZE
- FD-2 gate: Test Contract cases surfaced in chat + `delivery/TEST-CONTRACT-REVIEW.md`; **approved as-is by Fernando Ott** (24 draft cases A1–G2, 26 enforcement rows C-W1-01…C-META-01; zero edits). Reviewed-by line filled.
- CONTRACT.md frozen **v0.9-draft → v1.0** (SHA-256 `fda30961fbd3…`), with PROGRAM CONTRACT + RUN-POLICY (backlog #8) + contract CHANGELOG sections added pre-freeze per case G-G1.
- Backbone (M-shape folded): `delivery/v3/00-program-plan.md` + `delivery/v3/STATUS.md`.
- Fan-out: squads A (gate-check verbs & FD enforcement), B (statechart/preflight/tiering), C (vocab/packaging/release) — mid-tier builders per RUN-POLICY, coordinator on top tier, escalate-on-struggle.

## 2026-07-08 — PARALLEL PLANNING AUDIT + AMENDMENT PASS
- Squads A/B/C delivered (6 files under delivery/v3/prds + epics). Coordinator audit: **50/50 approved IDs bound**, zero silent drops; model-ID guard clean; manual share 1 case (~4.8%, C4 marketplace proxy).
- **AMD-1** (approved Fernando Ott): E1 reworded — live machine.json = additive-only structural superset of byte-pinned tests/fixtures/v2/machine.v2.fc6abc8.json, verified by new `gate-check machine-diff`. Resolves E1↔C-W2-01 tension via Squad B option 2.
- **AMD-2** (approved Fernando Ott): mirror set six→eight pairs (4 files + 4 references/*.md); source-doc miscount corrected.
- **AMD-3** (coordinator): exit-code convention documented (exit 2 = action-required, first use testconv/FD-1); manual-share invariant now computed, never typed.
- Regex widening `E`→`[A-Z]` at gate-check.mjs:115,121,161 → folded into Epic A4 (Squad A lane); verification task stays in B2. Confirmed against source.
- Case-ID grammar normalized to T-<EID>-NN (references/templates.md); Squad A epics renamed BC-*→T-* (mechanical).
- Squad C F2 resolution CONFIRMED: claim-softened (G2-Q4 + v3-architecture.md non-goal). Squad B W2-01 reading CONFIRMED: "contract" = reachability toward backboneFreeze.
- Contract re-pinned: v1.0+AMD @ sha256 44b5507f930756c81758863de3aa70cc94b38da2bdbeafa775a06406e4b77fbf
- Handoff-lint false positive (coordinator): `stripCode` inline-span regex `` `[^`\n]*` `` at gate-check.mjs:61 is newline-scoped, so code spans hard-wrapped across a line break leak into the FROZEN placeholder scan (`<iso>` at prd-1-gatecheck-fd.md:121,130 — spec-shape mentions inside backticks, not unfilled tokens). Resolution: formatting-only reflow of the two spans onto single lines (zero semantic delta; PRD hash not pinned in CONTRACT.md, contract pin 44b5507f9307 unaffected). Field finding logged for Epic A backlog: make span-stripping newline-tolerant in v3 gate-check work (Squad A lane, alongside the E→[A-Z] widening).

## 2026-07-08 — v3 build resume (pinned)
- Step 0 (C-W6-02) re-verified from disk: ancestor commit 42f5d781cd6ad5c7e1be41675796b6efa378bb0f ✓, CONTRACT.md SHA-256 matches pin ✓, `gate-check state` PASS (done) ✓, `gate-check handoff` PASS ✓. Tally re-derived, never typed: 26/26 enforcement rows bound (epics-1: 11, epics-2: 7, epics-3: 8), 24/24 draft cases bound or resolved (F2 = claim-softened, T-C4-02), 50/50 total — matches B3 audits.
- NOTE (no action): handoff lint's test-ID regex only matches the v2 `T-E*` grammar (harness cases in tests/run-contract.mjs, 26/26 green at baseline); v3 epics bind via `T-A*/T-B*/T-C*` + direct `C-W*` rows. Lint conditions still hold. Any lint-grammar widening would be a gate-check core change → deferred, not needed for DoD.
- Wave 0 started on v2/deterministic-core (fixture corpus, run-contract.mjs additive extension, C-META-01 fail-closed sweep).
- Ops: token-tiering — coordinator on Fable; wave/epic builders delegated to Sonnet-class subagents with pinned specs; coordinator verifies every claim by re-running suites and escalates a builder to Fable if it fails verification twice.

## 2026-07-08 — Wave 0 VERIFIED; Wave 1 launched
- Wave 0 verified by coordinator re-run (never trusted the builder's word): 26/26 v2 T-E* pass; v3 registration reports 25 PEND each naming its gap; `tests/v3/fail-closed-sweep.mjs` exit 1, 25 gaps named. C-META-01 excludes itself from its own sweep (fail-closed-sweep.mjs:34, documented) — 25 examined + 1 umbrella = 26 enforcement rows, computed `grep -cE '^\| [CT]-[A-Z0-9-]+\s*\|\s*@' delivery/v3/CONTRACT.md` = 26.
- Scope ruling (Wave-0 builder flagged): the shared `--dir` parser and new verbs (`contract`, `testconv`, `reconcile`) in scripts/gate-check.mjs belong to Epic 1/Squad A, not Wave 0. Squads B/C must NOT implement `--dir` or Squad A verbs; cases whose `run:` depends on them stay PEND and are listed INTEGRATION-PENDING in squad reports; coordinator wires them at merge time. Merge order: E1 → E2 → E3, full suite + sweep re-run after each merge.
- Squad B additionally owns: ENV-FACTS.md schema + finishing the 4 Wave-0 stub fixtures (preflight-s, preflight-ml, absent-tool, slow-probe) and the byte-pinned tests/fixtures/v2/machine.v2.fc6abc8.json via `git show fc6abc8:machine.json`.
- Version bump to 3.0.0, CHANGELOG, tag: Wave 2 only (coordinator). No squad bumps versions.

## 2026-07-08 — E1 VERIFIED & merged; main-checkout incident
- E1 re-verified by coordinator post-merge re-run (never trusted the builder's word): `node tests/run-contract.mjs` 41/41; `tests/v3/fail-closed-sweep.mjs` exit 1 with 0 fail-closed violations of 25 enforcement rows and 15 gaps named — all of them E2/E3 mechanisms, not silently passed. Merged `--no-ff` epic/e1-gatecheck-fd → v2/deterministic-core @ 1850628. Epic 1 → VERIFIED.
- Ruling (Squad A flag 1): cmdHandoff consistency-widening of the two additional `T-E` regexes ACCEPTED — pure superset, all v2 `T-E3-*` rows green. The :115,121,161 addendum is read as intent, not a literal line whitelist.
- Ruling (Squad A flag 2): case B3 "bound" tightening ACCEPTED — a draft ID binds only via a `|`-table row in an epic file; draft IDs are declared only by list items; prose mentions neither declare nor bind.
- INCIDENT: two unattributed detached-HEAD commits (617fb65, 8m-amended; b236d5c) landed in the MAIN checkout, mixing Wave 1a (Squad A verbs, duplicate) and Wave 1b (machine.json preflight) scope. Quarantined at `rescue/detached-wave1-unattributed`. Authorship is NOT Squad B — their transcript shows zero commits and their lane is `.claude/worktrees/epic-e2` (worktree of record; stale spawn worktree `agent-ae6647dea1cd3076a` to be reaped). After the corrective merge, an ephemeral background shell force-reset v2/deterministic-core back to b236d5c (reflog `branch: Reset to b236d5c`, ~12:01); coordinator restored 1850628 via `reset --hard`; no live offender found (ps clean). NOTHING is cherry-picked from the rescue branch — Squad B's uncommitted in-worktree copies are canonical for E2 scope; rescue branch retained for audit only.
- Merge-order gate: E2 and E3 must `git merge v2/deterministic-core` at the base-ready SHA announced by the coordinator before any further commits; any collision with merged Squad A canon resolves in the canon's favor.
