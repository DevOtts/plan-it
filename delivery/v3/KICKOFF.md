# plan-it v3 — KICKOFF (build agent / `/fable-it`)

This is a **pinned resume**. Do not reconstruct context from chat history,
summaries, or memory of prior sessions — everything you need is on disk at the
pins below. If any pin fails to verify, **stop and report**; do not improvise.

## Pins (C-W6-01)

| pin | value |
|---|---|
| Repo (absolute) | `/Users/macbook/Workspace/Devotts/plan-it` |
| Branch | `v2/deterministic-core` |
| Package commit SHA | `42f5d781cd6ad5c7e1be41675796b6efa378bb0f` |
| Run state | `/Users/macbook/Workspace/Devotts/plan-it/.plan-it/state.json` |
| Contract | `delivery/v3/CONTRACT.md` — v1.0+AMD, SHA-256 `44b5507f930756c81758863de3aa70cc94b38da2bdbeafa775a06406e4b77fbf` |

## Step 0 — re-derive before anything else (C-W6-02)

1. `git rev-parse HEAD` contains commit `42f5d781cd6ad5c7e1be41675796b6efa378bb0f` (`git merge-base --is-ancestor` acceptable).
2. `shasum -a 256 delivery/v3/CONTRACT.md` matches the pin above.
3. `node scripts/gate-check.mjs state .plan-it/state.json` → PASS.
4. Re-derive the case tally and reconcile **from disk** — never trust any
   count typed in a document (W5): run `node scripts/gate-check.mjs handoff delivery/v3`
   and compare against `delivery/v3/CONTRACT.md` enforcement rows.
   **Any mismatch = stop-and-report.** Do not "fix forward".

## Read order (binding)

1. `delivery/v3/CONTRACT.md` — the law. FROZEN; gaps go back as PROPOSED-AMENDMENT, never edited in place.
2. `delivery/design/v3-architecture.md` — design ground truth.
3. `delivery/TEST-CONTRACT-REVIEW.md` — approved cases (Reviewed-by Fernando Ott 2026-07-07).
4. `delivery/v3/00-program-plan.md` — squads, waves, guardrails, DoD.
5. `delivery/v3/prds/` then `delivery/v3/epics/` — per-lane specs (1: gate-check & FD, 2: statechart & tiering, 3: vocab, packaging & release).
6. `delivery/v3/STATUS.md` + `delivery/decisions.md` — board and dated decision log.

## Build order

- **Wave 0** — fixture corpus + `tests/run-contract.mjs` harness extension (violating fixture for every enforcement row; C-META-01 sweep).
- **Wave 1** — epics 1/2/3 in parallel on `epic/<eid>-<slug>` branches off `v2/deterministic-core`.
- **Wave 2** — release & comms: version triple-match 3.0.0, mirror-check, marketplace parity, CHANGELOG; merge to `main`, tag `v3.0.0`.

## Guardrails (verbatim from program plan — binding)

- Protected core untouched; all v3 verbs/states are **additive**.
- Every approved case ID maps to ≥1 binding case or a dated drop entry in `delivery/decisions.md` (B3). No silent drops.
- Counts computed, never typed (W5). No hardcoded model IDs (W3). Status vocabulary per contract (W4): NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED.
- Exit-code convention: 0 pass / 1 fail / 2 action-required (first use: `testconv`, FD-1). [AMD-3]
- DoD: CONTRACT.md → PROGRAM CONTRACT → "Definition of SHIPPED". 100% binding-case pass; IMPLEMENTED-NOT-VERIFIED ships nothing.

## Launch prompt

> Build plan-it v3 per the pinned package. Repo
> `/Users/macbook/Workspace/Devotts/plan-it`, branch `v2/deterministic-core`,
> package commit `42f5d781cd6ad5c7e1be41675796b6efa378bb0f`. Run Step 0
> (verify pins, re-derive tally + reconcile from disk; mismatch = stop and
> report), then follow the read order and execute Wave 0 → Wave 1 → Wave 2.
> Track status only in `delivery/v3/STATUS.md` using the W4 vocabulary with
> case-ID + run-output evidence; log every decision, dated, in
> `delivery/decisions.md`.
