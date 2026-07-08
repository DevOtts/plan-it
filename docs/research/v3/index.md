---
type: index
title: v3 research package index
description: Map of the plan-it v3 field study (15 PLAN→EXECUTION pairs, 4 subscriptions) and where each artifact lives.
status: current
verified: 2026-07-07
repos: [plan-it]
tags: [research, v3, field-study]
---

# v3 research package — index

Canonical artifacts live at **repo root** (committed `a12f393`, branch `v2/deterministic-core`):

| Artifact | Role |
|---|---|
| `research-SYNTHESIS.md` | THE SPEC SEED — 15-pair scoreboard, 10 failure themes → v3 mechanisms, ranked backlog (M1/M2 + 1–12), 8 new capabilities |
| `research-FOUNDER-INPUT.md` | FD-1 (test-convention discovery → CLAUDE.md) & FD-2 (Test Contract case review pre-freeze) — founder-mandated, ship in v3 |
| `research-BRIEF.md` | Methodology + v2.1.0 baseline (what NOT to re-propose) |
| `research-findings-A…H.md` | 8 analyst reports, one per project-pair group; evidence codes EC-A1..EC-H* |
| `NEXT-SESSION-PROMPT.md` | File-based launch prompt for the v3 planning session (EC-A7: files beat chat paste) |
| `docs/research/v3/SHARED-CONTEXT.md`, `stream-A-pxpipe.md` | Pre-study external research streams (input to the brief) |

Process (for reruns): trim/distill each session transcript to a per-chat digest on disk → per-group analyst subagents read digests → main-thread synthesis + founder review → committed package + next-session prompt. Raw transcripts overflow context (144MB); never analyze them directly.
