---
type: prd
title: "plan-it v3 — Squad C: guard vocab, kickoff pinning, packaging & release"
description: "PRD for status-vocabulary enforcement (W4), KICKOFF pinning + packaging hygiene (W6), pluginlint (EC-D7), mirror-check (Stream D F1), and the release & comms epic (EC-D8) that ships v3.0.0."
status: IMPLEMENTED-NOT-VERIFIED
verified: false
repos: [plan-it]
tags: [plan-it-v3, squad-c, w4, w6, ec-d7, ec-d8, mirror-check, release]
---

# PRD-3 — Guard vocab, kickoff pinning, packaging & release

Squad C · lane: W4 (honest-status vocabulary), W6 (kickoff pinning + packaging
hygiene), areas C (`pluginlint` / EC-D7), D (mirror integrity), F (release &
comms / EC-D8). Law: `delivery/v3/CONTRACT.md` v1.0 FROZEN. Approved cases:
`delivery/TEST-CONTRACT-REVIEW.md`. Design basis: `delivery/design/v3-architecture.md`
(LOCKED) — supersedes the earlier draft `docs/v3/02-v3-design.md`, whose W4
vocabulary (`VERIFIED | IMPLEMENTED-NOT-VERIFIED | PARTIAL | BLOCKED`) is
**not** binding; the frozen 4-term vocabulary is
`NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED`
(CONTRACT.md:49, STATUS.md:3).

## 1. Summary

Four mechanisms, three of them net-new `gate-check` verbs plus one hard-guard
extension, that turn "status vocabulary," "resumable handoff," "the plugin
loads correctly," and "the mirrored copies stay in sync" from prose
discipline into exit codes — and the one-time chore epic that actually ships
v3.0.0 (version bump, README/CHANGELOG, marketplace claim fix, LinkedIn post,
the only merge of `v2/deterministic-core` → `main`).

## 2. Problem & goals

### Problem

1. **W4 — dishonest status leaks through.** Nothing today stops a delivery
   artifact from claiming "done"/"complete"/"✅" without a `VERIFIED` tag and a
   case reference. `planit-guard.mjs` (`scripts/hooks/planit-guard.mjs`)
   currently only gates PRD/epic *creation* on `contract.version` — it never
   inspects written *content* for vocabulary violations
   (`scripts/hooks/planit-guard.mjs:21-62`). `gate-check handoff`
   (`scripts/gate-check.mjs:99-196`) checks ID grammar, count/`[REAL]`
   reconciliation, per-epic Test Contract presence, and token lint — it has no
   status-vocabulary or `VERIFIED`-needs-a-run-output-ref check at all.
2. **W6 — resume is fuzzy, packaging drifts silently.** The current
   `KICKOFF.md` template (`references/templates.md:139-149`) has 8 orientation
   sections but none of them pin an absolute repo path, git SHA, `.plan-it/state.json`
   path, or the frozen CONTRACT's SHA-256 — a fresh builder session has nothing
   deterministic to resume against (this is exactly the class of bug
   `docs/v3/02-v3-design.md:85-90` calls out under F4/EC-D9: `/read-chat`-style
   fuzzy session matching resolved the wrong session). Root and
   `plugins/plan-it/` copies of six files are byte-identical duplicates, not
   symlinks (verified below), with zero automated drift check. `plugin.json`
   (`plugins/plan-it/.claude-plugin/plugin.json`) and `marketplace.json`
   (`.claude-plugin/marketplace.json`) can silently fall out of parity.
3. **C (EC-D7) — loader/metadata-parse bugs ship silently.** v2.1's own
   history includes an unquoted-`description:`-colon bug class that strips
   plugin metadata at load time (`docs/research/v3/stream-D-ec-map.md:54,67`).
   Nothing in `gate-check.mjs`'s 4-command map (`scripts/gate-check.mjs:265`)
   catches this before it ships.
4. **F (EC-D8) — packaging claims are currently false.** `marketplace.json`
   (`.claude-plugin/marketplace.json:6`) claims plan-it "is also published in
   the wider DevOtts marketplace" — no aggregator repo exists
   (`delivery/design/v3-architecture.md:106-109`). `machine.json`'s `"version": "2.0.0"`
   (`machine.json:4`) disagrees with `plugin.json`'s `"version": "2.1.0"`
   (`plugins/plan-it/.claude-plugin/plugin.json:4`) — two uncoordinated
   counters. There is no `CHANGELOG.md` in the repo at all (confirmed: no file
   matching `CHANGELOG*` exists at any path as of this run).

### Goals

- G-W4. Status-vocabulary violations are rejected at write time (hook) and at
  handoff time (gate-check), not caught by review.
- G-W6. A fresh builder session can resume a run from four pinned, disk-derived
  facts — no session-matching guesswork — and re-derives its own tally before
  writing anything.
- G-C. A `pluginlint` gate-check verb catches the EC-D7 bug class and three
  sibling loader/metadata defects before they ship.
- G-D. A `mirror-check` gate-check verb makes root↔plugin drift a gate failure,
  not a silent maintenance debt, and is wired into the release checklist.
- G-F. v3.0.0 actually ships: version triple-match, honest marketplace claim,
  a real CHANGELOG, comms drafted — the release epic is the only one that
  merges `v2/deterministic-core` → `main` and tags `v3.0.0`
  (CONTRACT.md:47, 00-program-plan.md:17).

## 3. Grounded facts (verified this run, 2026-07-08)

- **Mirror pairs, verified via `diff` (zero output on all eight):**
  `SKILL.md` ↔ `plugins/plan-it/skills/plan-it/SKILL.md`;
  `machine.json` ↔ `plugins/plan-it/skills/plan-it/machine.json`;
  `scripts/gate-check.mjs` ↔ `plugins/plan-it/skills/plan-it/scripts/gate-check.mjs`;
  `scripts/hooks/planit-guard.mjs` ↔ `plugins/plan-it/scripts/hooks/planit-guard.mjs`;
  `references/formats.md`, `references/machine.md`, `references/playbooks.md`,
  `references/templates.md` ↔ their `plugins/plan-it/skills/plan-it/references/`
  counterparts.
  **Note on the "six" figure:** `docs/research/v3/stream-D-ec-map.md:14,25`
  and `delivery/design/v3-architecture.md:113` both say "all six shared
  files," then enumerate `SKILL.md`, `machine.json`, `scripts/gate-check.mjs`,
  `scripts/hooks/planit-guard.mjs`, and "all four `references/*.md`" — that
  enumeration is **eight** discrete file pairs (four named + four
  `references/*.md`), not six; the source label undercounts by treating the
  `references/*.md` set as one bucket. `mirror-check` (D1) verifies all eight
  actual pairs — under-checking to match a miscounted label would defeat the
  verb's purpose. Flagged, not silently "fixed" in CONTRACT prose (squads
  don't edit CONTRACT.md); see Risks.
- **`plugin.json` has no root-level twin** (only `plugins/plan-it/.claude-plugin/plugin.json`
  exists — confirmed via `find`); it is not part of the mirror-pair set. It
  IS one side of the plugin↔marketplace **parity** check (C-W6-04), a
  different relation (cross-file field agreement, not byte-identity).
- **Version counters, verified by direct read:** `machine.json:4` = `"2.0.0"`;
  `plugins/plan-it/.claude-plugin/plugin.json:4` = `"2.1.0"`;
  `.claude-plugin/marketplace.json:13` (plugins[0].version) = `"2.1.0"`;
  `SKILL.md:29` (frontmatter `version:`) = `2.1.0`. Three agree, one
  (`machine.json`) doesn't — this is the "two distinct counters" gap F1 must
  reconcile-or-`--audit`-waive.
- **No `CHANGELOG.md` exists anywhere in the repo** (confirmed via `find`).
  F3's artifact is a new file, not an edit.
- **`marketplace.json`'s false claim, verified by direct read**
  (`.claude-plugin/marketplace.json:6`): *"it is also published in the wider
  DevOtts marketplace"* — no aggregator repo exists
  (`delivery/design/v3-architecture.md:106-109`, itself sourced from Stream D
  live GitHub-org enumeration). Resolution per G2-Q4 (`chore-epic-in-v3`,
  `.plan-it/state.json:31` `"Q4": "chore-epic-in-v3"`) plus v3-architecture's
  explicit non-goal "marketplace aggregator work" (`delivery/design/v3-architecture.md:107-108`):
  **soften/correct the claim, do not build an aggregator.** This resolves the
  XOR in TEST-CONTRACT-REVIEW F2 ("aggregator built XOR claim softened") —
  claim-softened is the only in-scope branch.
- **SKILL.md frontmatter already avoids the EC-D7 pattern**: `description:`
  uses a YAML folded block scalar (`>-`, `SKILL.md:3-18`), which cannot be
  broken by an embedded unquoted colon the way a plain scalar can. `pluginlint`
  C1's fixture must therefore construct a violating plain-scalar description
  under `tests/fixtures/v3/` — the real SKILL.md is the passing control case,
  not the failing one.
- **`.plan-it/state.json` already stores what KICKOFF pinning needs**:
  `contract.path`, `contract.version`, `contract.sha256`
  (`.plan-it/state.json:41-46`) — KICKOFF pinning re-derives these fields from
  the state file (and `git rev-parse HEAD` for the SHA) rather than
  hand-typing them, consistent with W5's "computed, never typed" invariant.

## 4. Solution design

### D1 — Status-vocabulary hard guard (extends `planit-guard.mjs`) — covers C-W4-01

Extend `scripts/hooks/planit-guard.mjs` (and its byte-identical mirror
`plugins/plan-it/scripts/hooks/planit-guard.mjs`) with a second check inside
the existing `try` block, additive to the current contract-freeze check
(lines 40-62): after the existing `DELIVERABLE_RE` match
(`scripts/hooks/planit-guard.mjs:21`), read `input.tool_input.content` (Write)
or the edit's `new_string`/`new_str` (Edit/MultiEdit) and scan for
`/\b(done|complete)\b|✅/i` outside code spans; if found, require a
`VERIFIED` token plus a case-ID pattern (`\b[A-Z]-?[A-Z0-9]*-\d+\b` /
`T-E\d+...-\d{2}`) within the same paragraph/line-window; on violation, `deny()`
with a reason naming the offending phrase and the required vocabulary
(mirrors the existing `deny()` message shape at
`scripts/hooks/planit-guard.mjs:56-62`). Fail-open on any parse error,
preserving the file's documented fail-open contract
(`scripts/hooks/planit-guard.mjs:13-14`).

### D2 — `VERIFIED` needs a run-output reference (extends `gate-check handoff`) — covers C-W4-02

Add a check inside `cmdHandoff` (`scripts/gate-check.mjs:99-196`), alongside
the existing token-lint pass (`scripts/gate-check.mjs:175-188`): for every
`VERIFIED` occurrence in scanned `.md` files, require a nearby run-output
reference — either a fenced code block (already stripped by `stripCode` for
the placeholder check, so scan the un-stripped text for a fence within N
lines) or an explicit `run:`/`output:` citation. Missing reference → `fail()`
naming the file and the bare `VERIFIED` occurrence's line context.

### D3 — 4-term vocabulary enforcement in STATUS.md (extends `gate-check handoff`) — covers C-W4-03

Same `cmdHandoff` pass: when a file matches `STATUS.md` (or, generalized, any
file containing the literal `## STATUS board` / a `| status |` column header
matching `delivery/v3/STATUS.md`'s shape — `delivery/v3/STATUS.md:6`), scan
its status column values against the closed set
`{NOT-STARTED, IN-PROGRESS, IMPLEMENTED-NOT-VERIFIED, VERIFIED}`; any other
token in that column → `fail()` naming the row and the offending word. This is
the same enforcement surface D2 extends but a different rule (closed-vocabulary
membership vs. VERIFIED-needs-a-ref), both additive to `cmdHandoff`.

### D4 — KICKOFF pinning template (extends `references/templates.md` §KICKOFF.md, mirrored) — covers C-W6-01, C-W6-05

Extend the `KICKOFF.md` template block (`references/templates.md:139-149`)
with a new pinned-facts section, inserted as item 0 (before "1. What you're
building"):

```
0. Pinning (re-derived from disk, never hand-typed):
   - Repo: <absolute path>  (pwd)
   - Git SHA: <full 40-char sha>  (git rev-parse HEAD)
   - State file: <absolute path>/.plan-it/state.json
   - Contract: <path> @ SHA-256 <64-char hex>  (read .plan-it/state.json .contract.{path,sha256};
     cross-check with `shasum -a 256 <path>`)
```

and appending an explicit ban to item 8 ("Handoff state"):
*"Resume is by these four pinned facts only. `/read-chat`-style fuzzy session
matching (`SKILL.md:280,520`) is banned as a resume mechanism for build
sessions — a KICKOFF prompt is self-contained; it must never say 'resume the
session about X.'"* This is a prose-lint surface (C-W6-05 tests that the
banned phrase pattern is *absent* from the template and from any generated
KICKOFF.md), not a new gate-check verb.
Both edits land in `references/templates.md` AND its mirror
`plugins/plan-it/skills/plan-it/references/templates.md` (dogfooding D1).

### D5 — Builder re-derive-first-step instruction (extends `references/templates.md` §KICKOFF.md + SKILL.md Phase 10 assembly note) — covers C-W6-02

Add to the `KICKOFF.md` template, as a mandatory numbered "Step 1" preceding
any build work: *"Before writing anything: run
`node scripts/gate-check.mjs handoff delivery/` and (once D-epic's `reconcile`
verb from Squad A ships) `node scripts/gate-check.mjs reconcile delivery/`
against this repo's disk state; if the tally or reconcile output disagrees
with anything asserted in this KICKOFF, STOP and report the mismatch — do not
silently reconcile it yourself."* Cross-reference in SKILL.md's Phase 10
assembly bullet (`SKILL.md:494-496`) so the instruction is generated, not
hand-typed, by every future run. `Depends on` Squad A's `reconcile` verb
existing for the full instruction to be runnable; the template ships the
instruction now (referencing the verb by name) — this is additive text, not a
blocked task.

### D6 — `pluginlint` gate-check verb (new subcommand, `scripts/gate-check.mjs`) — covers C1, C2, C3, C4

Append `pluginlint: cmdPluginlint` to the `commands` map
(`scripts/gate-check.mjs:265`, the exact append point Stream D identified —
`docs/research/v3/stream-D-ec-map.md:107`), mirrored into
`plugins/plan-it/skills/plan-it/scripts/gate-check.mjs`. Usage:
`gate-check pluginlint <plugin-root>`. Checks, each a discrete `fail()`:
- **C1** — parse the target `SKILL.md`'s YAML frontmatter (delimited `---`
  fences, same convention as `SKILL.md:1-37`); if `description:` is a plain
  (non-block) scalar containing an unquoted `:` outside quotes, fail and
  print the exact offending line (the EC-D7 class,
  `docs/research/v3/stream-D-ec-map.md:54`).
- **C2** — parse `plugin.json`; fail if `name`, `version`, or `description`
  is missing; a valid v2.1.0-shape file (`plugins/plan-it/.claude-plugin/plugin.json`)
  is the passing control case.
- **C3** — for every `marketplace.json` `plugins[].source` path, resolve it
  relative to the marketplace file's directory and fail if it does not exist
  on disk (`.claude-plugin/marketplace.json:8` `"source": "./plugins/plan-it"`
  is the passing control case).
- **C4** — cross-check the frontmatter `name:` field against the
  containing directory's basename (`skills/<name>/SKILL.md`); fail on
  mismatch (loader mismatch class — a skill installed under a differently
  named directory than its declared `name`).

### D7 — `mirror-check` gate-check verb (new subcommand) — covers D1, D2, D3

Append `"mirror-check": cmdMirrorCheck` to the same commands map
(`scripts/gate-check.mjs:265`), mirrored. Usage: `gate-check mirror-check`
(no args — pairs are a fixed, code-defined list, the same eight enumerated in
§3 above; grouped in output/reporting as "6 mirror points" — 4 discrete files
+ the `references/` set — to match the design doc's counting convention while
still `diff`-checking every one of the 8 files). For each pair: byte-compare
via `readFileSync` + `Buffer.equals`; **D1** all pairs identical → exit 0;
**D2** any pair differing → `fail()` naming both paths and a byte-offset hint
(first differing byte index) for every drifted pair, not just the first;
**D3** — this verb has no separate mechanism, it's a *wiring* requirement:
the release epic's checklist (Epic C4 below) runs `mirror-check` and refuses
to finalize the CHANGELOG entry on non-zero exit.

### D8 — plugin↔marketplace parity lint (extends `gate-check handoff`, scoped) — covers C-W6-04

Add a scoped check inside `cmdHandoff`: only runs when the collected `.md`/`.json`
diff set (the files under the `<delivery-dir>` argument, extended to also
accept `--packaging` companions `plugin.json`/`marketplace.json` paths passed
alongside, or auto-discovered at their fixed repo-relative locations when the
plan's own diff touches them per CONTRACT C-W6-04's scoping clause) includes
packaging files; when scoped in, cross-check `plugin.json`'s `name`/`version`/`license`
against `marketplace.json`'s matching `plugins[]` entry; any field mismatch →
`fail()` naming both files and the disagreeing field. This is deliberately a
`handoff`-verb extension, not folded into `pluginlint` (D6) — `pluginlint`
validates a single artifact's internal shape; this validates a *relation*
between two artifacts, the same category as `mirror-check` (D7), which is why
it is grouped with the mirror epic below rather than the pluginlint epic.

### D9 — Release & comms epic execution (Wave 2, EC-D8) — covers C-W6-03, F1, F2, F3

The one-time chore work, gated by D6/D7/D8 all passing on the final tree
before merge:
- **F1** version triple-match: bump `plugin.json:4`, `SKILL.md:29`
  (frontmatter `version:`), and the new `CHANGELOG.md`'s top entry to
  `3.0.0`; also bump `.claude-plugin/marketplace.json:13` for parity (D8).
  `machine.json:4`'s `"version": "2.0.0"` is a *different* counter
  (machine-schema version, not package version) — F1 requires it be
  explicitly reconciled (bumped to track, e.g. `"3.0.0"`) **or** waived via a
  documented `plan-it --audit` exception (the `--audit` subcommand itself is
  Squad B's `EC-A4` deliverable per `delivery/design/v3-architecture.md:49-50`;
  this epic supplies the waiver record, not the subcommand).
- **C-W6-03 / marketplace claim fix**: rewrite
  `.claude-plugin/marketplace.json:6`'s description to remove or correct the
  "published in the wider DevOtts marketplace" claim (per §3's resolved XOR:
  claim-softened, no aggregator built).
- **F2** README install docs: `README.md`'s existing Installation section
  (`README.md:64-121`) already models the sibling `fable-it`/`parallel-lifecycle`
  marketplace-add + plugin-install pattern (`/plugin marketplace add
  DevOtts/plan-it` → `/plugin install plan-it@plan-it`, `README.md:79-83`) —
  this task is a verification-and-refresh pass (update the `2.1.0` references
  in `README.md:259-266` to `3.0.0`, keep the pattern), not a rewrite; the
  marketplace-claim sentence in `README.md`'s prose (if any references the
  aggregator claim) must match the corrected `marketplace.json` text.
- **F3** `CHANGELOG.md` (new file — none exists today): dated `## 3.0.0 — 2026-07-08`
  (or ship date) section enumerating `FD-1`, `FD-2`, and every shipped backlog
  ID by its identifier (`M1`, `M2`, and the numbered items 3–12 minus any
  explicitly deferred long-tail items — sourced at execution time from
  `delivery/design/v3-architecture.md` §4's backlog table, cross-checked
  against Squad A/B/C's actual shipped epics via `gate-check reconcile`
  once available, per D5's re-derive discipline — this enumeration is
  necessarily an execution-time step, not something this PRD can hand-type
  now without violating W5).
- **LinkedIn post draft**: a comms artifact (`delivery/v3/LINKEDIN-POST.md`
  or equivalent), following the existing dogfood-angle precedent referenced
  in git history (`e6126c6` "LinkedIn post v3: dogfood angle" —
  `delivery/decisions.md:10,21`).
- **Merge & tag**: the terminal step — `git merge v2/deterministic-core`
  into `main`, `git tag v3.0.0` — is the ONLY merge-to-main in the whole v3
  program (CONTRACT.md:47, `00-program-plan.md:17`). Gated on: all binding
  `[REAL]` cases passing, `mirror-check` exit 0, `pluginlint` exit 0 on both
  root and plugin trees, `handoff` (including D8's parity check) exit 0.

## 5. Epic table

| EID | Epic | Themes/areas | Dep | Wave |
|---|---|---|---|---|
| C1 | Status-vocabulary hard guard | W4 | — | 1 |
| C2 | `pluginlint` verb | C (EC-D7) | — | 1 |
| C3 | `mirror-check` verb + KICKOFF pinning + packaging parity | W6, D | C2 (shares commands-map append point) | 1 |
| C4 | Release & comms epic | F (EC-D8), W6 (C-W6-03) | C1, C2, C3 | 2 |

## 6. Acceptance (binding — see epics file's Test Contract tables)

Acceptance = 100% of the binding `[REAL]` cases in
`delivery/v3/epics/epics-3-vocab-packaging-release.md` passing against their
fixtures, per CONTRACT.md's Definition of SHIPPED
(`delivery/v3/CONTRACT.md:48`). No case here is invented outside the 18 IDs
assigned to this lane (8 enforcement + 10 draft); the case map at the end of
the epics file proves full coverage.

## 7. Risks & open questions

- **IMPLEMENTED-NOT-VERIFIED ceiling (binding, from `delivery/decisions.md:32-34`):**
  everything in this PRD is verifiable in this environment (gate-check
  behavior, hook behavior, file/layout lints, local loader metadata parse via
  `pluginlint`, doc consistency) EXCEPT: (a) actual marketplace install UX —
  `/plugin marketplace add DevOtts/plan-it` end-to-end from a second
  subscription/machine, and (b) cross-subscription KICKOFF handoff (a fresh
  builder session on a *different* Claude Code subscription actually resuming
  from the pinned facts). Both are the same verification class as EC-D1/EC-G1
  incidents cited in `delivery/decisions.md:34`. Epic C4's binding cases use
  local proxies for both — `claude plugin validate .` /
  `claude plugin validate ./plugins/plan-it` (already documented as the local
  check in `README.md:270-273`) for (a), and a scripted "fresh directory,
  read KICKOFF.md, re-derive tally" harness for (b) — and flag the *actual*
  live-install/live-handoff claim as IMPLEMENTED-NOT-VERIFIED in `CHANGELOG.md`
  and `STATUS.md` rather than mark it VERIFIED on a local proxy. This is a
  `manual:<reason>` case for the truly unrunnable slice (see epics file).
- **"Six shared files" miscount (§3):** the source design documents label the
  mirror set "six" while enumerating eight files. `mirror-check` implements
  the correct count (8); this PRD does not silently correct CONTRACT/design
  prose (squads don't edit CONTRACT.md — `00-program-plan.md:24`). Surfaced
  here as a note for the coordinator; not proposing an amendment since no
  CONTRACT case ID depends on the literal number "six" (D1–D3's case text in
  `delivery/TEST-CONTRACT-REVIEW.md:27-30` says "all six shared root↔plugins/plan-it
  file pairs" only in this PRD's own restatement, not in a CONTRACT.md row —
  CONTRACT.md's D-area rows are folded into C-W6-04/D1-D3 without a hardcoded
  count). No PROPOSED-AMENDMENT needed; documented for auditability.
- **F3's backlog-ID enumeration is execution-time, not plan-time.** This PRD
  specifies the mechanism (source the list from `delivery/design/v3-architecture.md`
  §4, cross-check via `reconcile`) rather than a hand-typed ID list, per W5's
  computed-not-typed invariant — the actual set of shipped IDs is only known
  once Wave 1 epics (Squads A, B, and this squad's C1-C3) land.
- **`gate-check reconcile` (Squad A) is a soft dependency for D5 and F3.**
  Both reference it by name; neither is blocked on it existing yet — D5 ships
  the instruction text now (runnable once `reconcile` exists), F3's
  enumeration mechanism is documented now and executed at release time.
- **planit-guard content-scanning (D1) reads `tool_input.content`/`new_string`,
  a wider input surface than the existing hook's `file_path`-only check**
  (`scripts/hooks/planit-guard.mjs:45`). Must preserve fail-open on any shape
  the hook doesn't recognize (e.g. `MultiEdit`'s array-of-edits shape) —
  scoped explicitly in the epic's task checklist.

## 8. Out-of-scope

- Building a real DevOtts marketplace aggregator repo (explicit non-goal,
  `delivery/design/v3-architecture.md:107-108`; resolved XOR in §3).
- `gate-check reconcile`, `contract`, `testconv`, preflight/tiering verbs —
  Squad A/B territory (`00-program-plan.md:9-10`).
- Any edit to `machine.json`'s state graph — protected core, additive-only
  (`00-program-plan.md:21`); F1's machine.json version reconciliation touches
  only the `version` field, never `states`/`initial`/`on`.
- Live, cross-subscription marketplace install and cross-subscription KICKOFF
  handoff verification — IMPLEMENTED-NOT-VERIFIED ceiling per §7; local
  proxies only.
- Hardcoded model IDs anywhere in any produced artifact (binding constraint,
  `delivery/v3/CONTRACT.md:53-61` RUN-POLICY) — Tier Tables (Squad B's W3) are
  out of this lane's scope to author, but this PRD's own artifacts and epics
  contain zero model-ID literals by construction.
