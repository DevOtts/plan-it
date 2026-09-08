---
type: operations
title: "plan-it 4.0.0 build retrospective — orchestrator + three squads + QA (2026-09-07)"
description: What the overnight v4 build found that planning could not see, the seven amendments and their root causes, and the orchestration mechanics worth repeating.
status: current
verified: 2026-09-07
repos: [plan-it]
tags: [plan-it, v4, retrospective, orchestration, dogfood]
---

# plan-it 4.0.0 build retrospective

Legend: `V4<letter><n>` epic · `T-<EID>-NN` epic case · `C-E<n>-NN` CONTRACT case · `Wn` wave · `AMD-n` amendment — see `delivery/v4/GLOSSARY.md`.

Outcome record: `delivery/v4/MORNING-REPORT.md` (per-epic), `delivery/v4/QA-REPORT.md` (independent run), `delivery/v4/STATUS.md` (board + log), `delivery/decisions.md` (AMD-6 … AMD-12). Evidence: `plan-it@052aaa4` (main after W3 close).

## What the build found that planning could not

All 60 CONTRACT cases and all epic cases passed on their fixtures. The seven amendments came from **running the freshly built verbs and renderer against `delivery/v4/` itself** (the package that specifies them) and against the repo (`--dir .`). Fixtures encode what the author imagined; the package encodes what exists.

| AMD | Root cause | Fix | Case |
|---|---|---|---|
| AMD-6 | Two `run:` cells in `epics-c-prose.md` were wrong before any code existed: an awk two-address range whose start line also matches the end pattern (`/^## 4\.0\.0/,/^## [0-9]/`) always counted 0; a G-4 sweep over `docs/**` also hit research records that *quote* model IDs as evidence | flag-based awk; `--exclude-dir=research` | T-V4C3-06/-08 |
| AMD-7 | v4 mints `R<n>` for coordinator defaults; the 3.0.1 PRD orphan scan (`\bR-?\d+\b`) read every default citation in a PRD as an uncovered requirement — every future v4 run would fail `handoff` | orphan scan skips `gates.G2.defaults[].id` | T-V4B4-17 |
| AMD-8 | §5 said "empty when VERIFIED, else a disposition" — literally applied, a freshly handed-off board (all NOT-STARTED) fails; also `mirror --dir` refused the hand-authored input HTMLs under `resources/` | disposition required only for IMPLEMENTED-NOT-VERIFIED; `mirror --dir` skips `resources/` | C-E8-01, T-V4B4-11 |
| AMD-9 | renderer wrote `planit-embeds` relative to the twin but copied the manifest's raw `source.path` into `planit-source` (`../KICKOFF.md` when manifests live in `manifests/`); CSS-token lint scanned embedded prose and warned on the literal `var(--token)` in C-E2-13's text | relpaths from the output dir; scan `<style>` only | T-V4A1-13/-14 |
| AMD-10 | two lanes, two grammars: `gate-check glossary` expanded `*`/`NN`/`<n>`/trailing-`n`, the renderer only `*` (with `NN` literal) — `T-*-NN` matched nothing in the twins | one grammar codified in §5, as the lint built it | T-V4A3-12 |
| AMD-11 | the shared range parser read the literal row `P2-11` as `P2…P11`; the `glossary` block's own escaped cells (`V4A<n>`) were re-scanned as prose | literal-first lookup, no range expansion; glossary table excluded from the first-use scan | (assertions in existing scripts) |
| AMD-12 | embed blocks put markdown inside `<script type="text/markdown">`, which the first-use pass rightly skipped — four of eight report kinds carried zero acronym expansions while every case passed on non-embed fixtures (QA Finding 1) | expansion over embed source at build time, one page-global first-use set, client renderer keeps `<abbr>` | T-V4A3-13 |

Also found and fixed inside lanes, no amendment: `"state.json".endsWith(".state.json")` is false (generic runs vanished from three `.plan-it/` scans); `cmdFreeze` read the generic state path and ignored `--run`; the glossary token regex dropped the leading family letter; NUL-byte placeholder markers in a template-string transform; `open-routing.mjs` inherited `PLANIT_NO_OPEN` from the caller.

Planning-time gaps visible only at build: backticked scaffold pointers failed `POINTER_RE` once `reconcile` could see `delivery/v4/`; CONTRACT case C-E2-11 had a path in one lane and a "covered by" note in another, so nobody wrote it; the T-E5-01 harness literal was listed as a W2 item but owned by no lane.

## Orchestration mechanics that held

- **Verify on disk, not on "done".** Every squad tally matched the orchestrator's re-run (`.taskstate/v4/verify-epic.mjs` runs each `run:` cell). Idle ≠ delivered: one squad chained two epics without reporting; the branch monitor caught it.
- **Batched lane merges** kept `main` green all night: SQ-A merged at lane close; SQ-B + SQ-C landed in one W2 merge because the version literals live in both lanes.
- **Amend centrally, route with a binding case.** Every finding became a dated AMD-n with a test hook and a CONTRACT version bump (v1.0 → v1.5, case count fixed at 60). Squads never edited the CONTRACT.
- **Inline receipts.** The 3.0.1 `handoff` lint (C-W4-02) wants a run receipt within 5 lines of every `VERIFIED`; on a board table that means an `exit 0` token in the row.
- **Resilience chain**: `ScheduleWakeup` hops (≤30 min) + a 90 s git branch monitor; state persisted to `.taskstate/v4/` and STATUS before every idle. No usage limit was hit; the chain was stopped at W3 close.
- **Timestamps**: the first log entries used a guessed clock; corrected from commit timestamps. Use `date`.

## What to change next time

1. Add "run the new gates against the package that specifies them, and against the repo" as a standing W2 step in the plan-it playbook.
2. Dry-run every `run:` cell of every Test Contract against the pinned tree before handoff (two mechanisms were wrong before code existed).
3. Every CONTRACT case needs exactly one owning lane by *path*, checked by a lint (C-E2-11 had none).
4. Scope-lock the prompt of any verifier fork QA dispatches (one tried to redo the whole wave).
5. A run executed on an older machine while emulating a newer mode leaves a state file the new `state` verb rejects (C-E7-06); decide the relabel-or-rewrite rule up front (this run: relabelled, owner action O-5).
