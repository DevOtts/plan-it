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

## Non-negotiables as enforced in this run
- Protected core untouched (additive-only designs): freeze mechanism, [REAL] Test Contracts, gate-check.mjs existing checks, KICKOFF read-order, evidence ledgers, batched decision gate, statechart deterministic core.
- FD-1 and FD-2 ship in v3, period (founder-mandated; ranked M1/M2).
- Scope cuts, if auto-sizing demands them, come from the bottom of the ranked backlog — never FD-1/FD-2/top-5.
- v3 is planned by v2.1.0 itself (dogfood): ends with frozen CONTRACT + binding Test Contracts (incl. EC-D7 loader/metadata-parse cases) + KICKOFF + file-based launch prompt.
- Release & comms epic (EC-D8: version bump, README, CHANGELOG, LinkedIn post) goes INSIDE the contract.

## Verification ceiling (this environment)
- CAN be VERIFIED here: gate-check.mjs behavior, machine.json state validity, file/layout lints, loader metadata parse (local `claude` plugin tooling), doc consistency.
- IMPLEMENTED-NOT-VERIFIED ceiling: cross-subscription handoff behavior and marketplace install UX (needs a second subscription/machine — same class as EC-D1/EC-G1 incidents).
