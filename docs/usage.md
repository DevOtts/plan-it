# Usage

## The one command

```
/plan-it <anything>
```

"Anything" really is anything: a three-paragraph brain-dump, a meeting
transcription, a one-liner ("add multi-tenant billing"), or a pile of pointers
("see the `checkout-v2` session, the `billing/` repo, and the PRD draft in
docs/"). plan-it expects **pointers, not content** — it goes and fetches the
ground truth itself.

## What a run feels like

You interact exactly **three times** (the gates); everything between them runs
autonomously:

| Gate | You're asked | Typical answer |
|------|--------------|----------------|
| ⏸ **G1 — Scope** | "This looks like size M, shape 3 (research → locked architecture → phase PRDs). Here's the numbered DoD. Correct?" | "Yes" / "It's actually two repos, size L" |
| ⏸ **G2 — Decisions** | A numbered list of every judgment call, each with a recommendation: hosting, repo topology, naming, build-vs-buy… | Answer by number. Add your own vision — this is the designed injection point. |
| ⏸ **G3 — Delivery** | "Specs are aligned — proceed to the delivery package?" | "Go" |

Tip: run at maximum reasoning effort (`/effort xhigh` on Claude Code) — the
skill will remind you.

## What you get back

```
docs/
  01-current-state-and-findings.md   # every claim cited to path:line
  02-vision-and-architecture.md
  03-data-model-and-contract.md
  0N-…                               # count auto-sizes to the demand
delivery/
  CONTRACT.md                        # frozen v1.0 — the law squads write to
  00-program-plan.md                 # squads, waves, test standard, runbook
  STATUS.md                          # the live board
  prds/prd-N-*.md
  epics/epics-N-*.md                 # each ends in a binding Test Contract
  KICKOFF.md                         # orientation + the copy-paste launch prompt
```

For a small feature the same content folds into fewer files (a design note +
one PRD + one epic set) — the shape governor at G1 decides.

## Handing off to the build

The last artifact is a launch prompt. Open a **fresh session** and paste it —
typically:

```
/fable-it
goal: <one line from KICKOFF.md>
DoD: the Test Contract in delivery/epics-*.md — 100% pass
```

`/fable-it` (or any build agent) inherits the Test Contract as its Definition
of Done: it iterates until every registered case passes, and reports each one
VERIFIED / IMPLEMENTED-NOT-VERIFIED / BLOCKED — no fake greens.

## Example invocations

```
/plan-it we need a customer portal where tenants see their invoices, pay by
card, and download usage CSVs. Stripe already integrated in apps/api. Mobile later.
```

```
/plan-it plan the refactor of our notification system — see docs/notifications-pain.md
and the "notif-spike" session. Don't touch the email templates this quarter.
```

```
/plan-it [pasted 40-line meeting transcription]
```

## Practical notes

- **Scope fences are honored.** Say "don't touch X" in the demand and it lands
  in the DoD as a fence.
- **Brownfield is first-class.** When code exists, docs show what's built and
  how to *promote* it — never a greenfield rewrite by default.
- **Live systems get live-grounded.** If the plan touches something deployed,
  plan-it verifies configs, registries and credentials against the running
  system before freezing the contract.
- **Everything is plain markdown** in your repo — review it, diff it, edit it
  before any build agent runs.

---

_Built by [DevOtts](https://github.com/DevOtts)._
