---
type: comms
title: plan-it v3.0.0 — LinkedIn announcement
description: Dogfood-angle launch post for plan-it v3.0.0 (field-hardened core).
status: draft
verified: false
repos: [plan-it]
tags: [comms, launch, linkedin, v3]
---

# plan-it v3.0.0 — LinkedIn post (draft)

**Angle:** dogfood — v3 was planned and built *by* the deterministic pipeline it
ships, and the release itself is one of its own binding Test Contract cases.
Precedent: `delivery/decisions.md` (dogfood-angle comms).

---

We just shipped **plan-it v3.0.0** — and the most honest thing I can say about it
is that plan-it planned it.

plan-it turns a fuzzy idea into a complete spec set + agile delivery package:
discovery → spec → agile-split, one batched human-decision gate, a frozen shared
CONTRACT, and a binding Test Contract per epic. It's the planning front-end to
/fable-it — plan-it plans it, fable-it builds it.

v3 is the "field-hardened" release. After watching real multi-squad planning
runs fail the same ways, we stopped writing those lessons as documentation and
started enforcing them as code:

• **Reality over memory** — an executable environment probe writes an ENV-FACTS
  manifest, and a test that calls a tool your environment doesn't actually have
  fails as not-runnable instead of faking a green.
• **No premature "done"** — a closed status vocabulary (VERIFIED requires a case
  ID + real run output) is enforced at write time. "It should work" isn't a
  status.
• **Counts are computed, never typed.** Tallies you hand-edit are tallies that
  lie.
• **Deterministic tiering** — model tiers resolve at execution time; a hardcoded
  model ID in a plan is rejected by a PreToolUse guard.
• **Pinned handoffs** — every kickoff pins the repo path, git SHA, and a
  CONTRACT SHA-256, so a resume re-derives from disk instead of guessing.

Every one of those is a machine-checked invariant with a fail-closed test. The
whole v3 program shipped only when 100% of its binding cases passed — the same
bar it now holds your work to.

Built deterministically. Verified, not vibed.

#AI #AgenticEngineering #ClaudeCode #SpecDriven #DevOtts

---

_Status: draft comms artifact — not auto-posted. Publish is a human action._
