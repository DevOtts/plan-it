# SHARED CONTEXT — plan-it v3 discovery (read this FIRST)

## Mission
plan-it v3: enforce the plan-phase gaps found by the dogfood research (8 plan→execution
pairs, enhancement candidates EC-A1..EC-H*), enriched by external research on making
lower models (Opus/Sonnet/Haiku) behave "Fable-like". Builder-side findings are NOT
in scope for v3 — they get filed to a fable-it backlog list instead. plan-it = planning
conductor (discovery → spec → CONTRACT freeze → PRDs/epics + binding Test Contracts).

## What plan-it v2.1 already does (do NOT re-propose)
- 15-state statechart (machine.json) + persisted .plan-it/state.json + gate-check.mjs guards
- 3 human gates (G1 scope, G2 decisions, G3 delivery), owner+date recorded
- Frozen shared CONTRACT before parallel squads; AMENDMENT self-loop (v1.0→v1.1)
- Binding Test Contract per epic (≤~20 type-selected cases, 100% = done)
- Rule 3 "idle ≠ delivered" disk verification; Rule 4 live-grounding gate
- PreToolUse hook denying PRD/epic writes while CONTRACT unfrozen (v2.1)
- 5 packaging shapes, size S/M/L governor

## Repo map (target codebase, ~/Workspace/Devotts/plan-it)
- SKILL.md (544 lines) — the conductor prose
- machine.json (199) — XState v5 statechart
- scripts/gate-check.mjs (274) — verify/freeze/handoff/state guards
- scripts/hooks/ — PreToolUse guard hook
- references/{machine,templates,formats,playbooks}.md — 153/284/209/237 lines
- research-*.md at repo root — the dogfood research (SYNTHESIS = consolidated ECs)

## Output contract (STRICT — Rule 3 applies)
Write your findings file to the EXACT absolute path you were given, skeleton:
  # Stream <X>: <title>
  ## What I examined (paths/URLs, with citations)
  ## Findings (numbered, each with evidence: file:line or URL#anchor or quote)
  ## Mechanisms plan-it v3 could adopt (max 8, each: name → what it enforces → which phase/state → cost)
  ## Out-of-scope but valuable (fable-it backlog candidates)
  ## TL;DR (≤8 bullets)
Be criterious and skeptical: cite path:line; no invented capabilities; if a repo
section is aspirational README-ware vs actually-implemented, SAY SO.
You MUST run the tools and return findings; do not stop early; do not hold output
in a message — Write the file.
