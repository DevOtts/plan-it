---
type: epics
title: "plan-it v3 — Squad C epics: guard vocab, kickoff pinning, packaging & release"
description: "Four epics (C1-C4) implementing W4 status-vocabulary enforcement, W6 kickoff pinning + packaging hygiene, EC-D7 pluginlint, Stream D mirror-check, and the EC-D8 release & comms epic that tags v3.0.0."
status: IMPLEMENTED-NOT-VERIFIED
verified: false
repos: [plan-it]
tags: [plan-it-v3, squad-c, epics, w4, w6, ec-d7, ec-d8]
---

# Epics-3 — Guard vocab, kickoff pinning, packaging & release

PRD: `delivery/v3/prds/prd-3-vocab-packaging-release.md`. Law:
`delivery/v3/CONTRACT.md` v1.0 FROZEN — never edited by this file. Branch map
root: `epic/<eid>-<slug>` off `v2/deterministic-core`
(`delivery/v3/CONTRACT.md:47`). Merge-back per wave; C4 alone merges
`v2/deterministic-core` → `main` and tags `v3.0.0`
(`delivery/v3/CONTRACT.md:47`, `delivery/v3/00-program-plan.md:17`).

Tally note (W5): case counts below are counted from the `@tag`-ed rows in
each epic's Test Contract table, never hand-typed — `node scripts/gate-check.mjs contract`
is the computed source of truth once Squad A's `contract` verb ships.

---

## C1 — Status-vocabulary hard guard

Branch: `epic/c1-status-vocab-guard`  |  Depends on: none (Wave 1, parallel
with C2/C3)
Scope: extend `scripts/hooks/planit-guard.mjs` (PreToolUse hard-enforcement,
mirrored to `plugins/plan-it/scripts/hooks/planit-guard.mjs`) and
`scripts/gate-check.mjs`'s `cmdHandoff` (mirrored to
`plugins/plan-it/skills/plan-it/scripts/gate-check.mjs`) with the three W4
checks from PRD §D1-D3. Additive only — the existing contract-freeze guard
(`scripts/hooks/planit-guard.mjs:40-62`) and existing handoff checks
(`scripts/gate-check.mjs:99-196`) are untouched in behavior, only extended.

Tasks:
- [ ] `scripts/hooks/planit-guard.mjs:21` — after the existing
      `DELIVERABLE_RE` match, add content extraction for
      `Write`/`Edit`/`MultiEdit`/`NotebookEdit` (`tool_input.content`,
      `tool_input.new_string`, or `tool_input.edits[].new_string` for
      MultiEdit) and scan for `/\b(done|complete)\b|✅/i` outside backtick
      code-spans/fences (reuse the `stripCode` pattern from
      `scripts/gate-check.mjs:61-63`, ported into the hook since it's a
      separate file/process).
- [ ] Same file — on a match, require a `VERIFIED` token + a case-ID-shaped
      token (`/\b[A-Z][A-Z0-9-]*-\d+\b/`) within the same line or the
      immediately preceding/following line; missing either → `deny()` with a
      reason naming the offending phrase, file, and the required vocabulary
      (`NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED`).
- [ ] Preserve fail-open (`scripts/hooks/planit-guard.mjs:63-65` `catch { allow(); }`)
      for any unrecognized `tool_input` shape (e.g. MultiEdit array edits
      missing expected keys) — never throw past the try/catch.
- [ ] `scripts/gate-check.mjs:99-196` (`cmdHandoff`) — add a pass: every
      `VERIFIED` occurrence in a scanned `.md` file must have a run-output
      reference (fenced code block or `run:`/`output:` citation) within a
      bounded line window; missing → `fail()` naming file + line.
- [ ] Same function — add a pass: any file whose shape matches a STATUS
      board (`## ... STATUS ...` heading or a `| status |`-style column
      header, matching `delivery/v3/STATUS.md`'s shape) has every status-column
      value in `{NOT-STARTED, IN-PROGRESS, IMPLEMENTED-NOT-VERIFIED, VERIFIED}`;
      any other token → `fail()` naming the row.
- [ ] Copy all edits to the mirror files (dogfood D3's own mirror-check once
      C3 ships); until then, `diff` manually before commit.
- [ ] Author `tests/v3/guard-status-vocab.mjs` (hook-invocation harness,
      same pattern as `tests/run-contract.mjs`'s `T-E6-*` guard tests,
      `tests/run-contract.mjs:216-256`).
- [ ] Author violating fixtures: `tests/fixtures/v3/verified-no-ref/` (a
      `.md` with a bare `VERIFIED` and no run-output ref) and
      `tests/fixtures/v3/bad-vocab/` (a STATUS.md-shaped file with a status
      word outside the 4-term set, e.g. `"DONE"` or `"WIP"`).

### Binding Test Contract

| ID | @tag | [REAL] case | run: | fixture | Covers |
|---|---|---|---|---|---|
| T-C1-01 | @case-machine | [REAL] "done"/"complete"/"✅" in a deliverable write without `VERIFIED` + case ref → planit-guard rejects the write | `node tests/v3/guard-status-vocab.mjs` | inline hook-input fixtures inside the test script | C-W4-01 |
| T-C1-02 | @case-machine | [REAL] `VERIFIED` tag lacking a run-output reference → `handoff` FAILS | `node scripts/gate-check.mjs handoff --dir tests/fixtures/v3/verified-no-ref` | `tests/fixtures/v3/verified-no-ref/` | C-W4-02 |
| T-C1-03 | @case-machine | [REAL] status word outside the 4-term vocabulary in STATUS.md → `handoff` FAILS | `node scripts/gate-check.mjs handoff --dir tests/fixtures/v3/bad-vocab` | `tests/fixtures/v3/bad-vocab/` | C-W4-03 |

Count: 3

---

## C2 — `pluginlint` verb (EC-D7 loader/metadata-parse class)

Branch: `epic/c2-pluginlint`  |  Depends on: none (Wave 1, parallel with
C1/C3; C3 shares the same `commands` map append point at
`scripts/gate-check.mjs:265` — coordinate merge order to avoid a trivial
merge conflict, no semantic dependency)
Scope: new `pluginlint` subcommand in `scripts/gate-check.mjs` (mirrored to
`plugins/plan-it/skills/plan-it/scripts/gate-check.mjs`), per PRD §D6.

Tasks:
- [ ] `scripts/gate-check.mjs` — add `function cmdPluginlint([root]) { ... }`
      implementing C1-C4 checks (frontmatter unquoted-colon, plugin.json
      required fields, marketplace.json source-path existence, skill
      name-vs-directory match).
- [ ] `scripts/gate-check.mjs:265` — append `pluginlint: cmdPluginlint` to
      the `commands` map; extend the `usage` help text
      (`scripts/gate-check.mjs:267-272`) with the new verb.
- [ ] Copy both edits to `plugins/plan-it/skills/plan-it/scripts/gate-check.mjs`.
- [ ] Author `tests/v3/pluginlint-frontmatter-colon.mjs`,
      `tests/v3/pluginlint-plugin-json.mjs`,
      `tests/v3/pluginlint-marketplace-source.mjs`,
      `tests/v3/pluginlint-name-mismatch.mjs` (or one combined
      `tests/v3/pluginlint.mjs` covering all four — combined chosen here for
      the binding cases below to keep the run: commands short; either
      shape satisfies "runnable").
- [ ] Author violating fixtures: `tests/fixtures/v3/pluginlint-bad-colon/`
      (SKILL.md with a plain-scalar `description: foo: bar` — no `>-` block
      scalar), `tests/fixtures/v3/pluginlint-bad-plugin-json/` (plugin.json
      missing `version`), `tests/fixtures/v3/pluginlint-bad-source/`
      (marketplace.json pointing at a nonexistent `source`),
      `tests/fixtures/v3/pluginlint-name-mismatch/` (SKILL.md `name: foo`
      inside a directory named `bar/`).
- [ ] Author one passing fixture set (`tests/fixtures/v3/pluginlint-good/`,
      or reuse the real `plugins/plan-it/` tree directly as the passing
      control case, since it is already confirmed to pass all four checks
      per PRD §3/§D6).

### Binding Test Contract

| ID | @tag | [REAL] case | run: | fixture | Covers |
|---|---|---|---|---|---|
| T-C2-01 | @case-packaging | [REAL] SKILL.md frontmatter `description:` with an unquoted colon → lint fails with the exact offending line | `node scripts/gate-check.mjs pluginlint tests/fixtures/v3/pluginlint-bad-colon` | `tests/fixtures/v3/pluginlint-bad-colon/` | draft-C1 |
| T-C2-02 | @case-packaging | [REAL] plugin.json missing a required field fails; valid v2.1.0-shape file passes | `node scripts/gate-check.mjs pluginlint tests/fixtures/v3/pluginlint-bad-plugin-json && node scripts/gate-check.mjs pluginlint plugins/plan-it` | `tests/fixtures/v3/pluginlint-bad-plugin-json/` + real `plugins/plan-it/` | draft-C2 |
| T-C2-03 | @case-packaging | [REAL] marketplace.json plugins[] `source` path that doesn't exist on disk → fail | `node scripts/gate-check.mjs pluginlint tests/fixtures/v3/pluginlint-bad-source` | `tests/fixtures/v3/pluginlint-bad-source/` | draft-C3 |
| T-C2-04 | @case-packaging | [REAL] frontmatter YAML parses but skill name ≠ directory name → fail | `node scripts/gate-check.mjs pluginlint tests/fixtures/v3/pluginlint-name-mismatch` | `tests/fixtures/v3/pluginlint-name-mismatch/` | draft-C4 (area-C draft case; distinct from this squad's Epic C4) |

Count: 4

---

## C3 — `mirror-check` verb + KICKOFF pinning + packaging parity lint

Branch: `epic/c3-mirror-kickoff-parity`  |  Depends on: none (Wave 1,
parallel; shares `commands` map append point with C2 — see C2's note)
Scope: new `mirror-check` subcommand (PRD §D7), the plugin↔marketplace parity
extension to `cmdHandoff` (PRD §D8), and the `KICKOFF.md` template pinning +
rederive-first-step + fuzzy-resume-ban edits (PRD §D4-D5), all mirrored.

Tasks:
- [ ] `scripts/gate-check.mjs` — add `function cmdMirrorCheck() { ... }`
      with the fixed 8-pair list from PRD §3/§D7 (`SKILL.md`, `machine.json`,
      `scripts/gate-check.mjs`, `scripts/hooks/planit-guard.mjs`,
      `references/formats.md`, `references/machine.md`,
      `references/playbooks.md`, `references/templates.md`, each against its
      `plugins/plan-it/...` counterpart); byte-compare via `Buffer.equals`;
      report every drifted pair (not just the first) with a byte-offset
      hint.
- [ ] `scripts/gate-check.mjs:265` — append `"mirror-check": cmdMirrorCheck`
      to the `commands` map; extend usage help text.
- [ ] Same file, inside `cmdHandoff` (`scripts/gate-check.mjs:99-196`) — add
      the scoped plugin↔marketplace parity check (PRD §D8): when packaging
      files are in scope, cross-check `plugin.json`'s `name`/`version`/`license`
      against `marketplace.json`'s matching `plugins[]` entry; mismatch →
      `fail()` naming both files and the field.
- [ ] Copy all `gate-check.mjs` edits to
      `plugins/plan-it/skills/plan-it/scripts/gate-check.mjs`.
- [ ] `references/templates.md:139-149` — add the "0. Pinning" block (PRD
      §D4) and the fuzzy-resume-ban sentence appended to item 8; add the
      "Step 1: re-derive tally + reconcile from disk, stop-and-report on
      mismatch" instruction (PRD §D5).
- [ ] Copy the `references/templates.md` edit to
      `plugins/plan-it/skills/plan-it/references/templates.md` (this is
      itself one of the 8 mirror-checked pairs — run `mirror-check` after
      this task to confirm).
- [ ] `SKILL.md:494-496` (Phase 10 assembly bullet) — add a cross-reference
      to the new KICKOFF pinning + rederive-first-step requirement so future
      runs generate it rather than copy stale prose. Mirror to
      `plugins/plan-it/skills/plan-it/SKILL.md`.
- [ ] Author `tests/v3/kickoff-pinning.mjs` — asserts a generated/sample
      KICKOFF.md contains an absolute repo path, a 40-char git SHA, a
      `.plan-it/state.json` path, and a 64-hex-char SHA-256.
- [ ] Author `tests/v3/kickoff-rederive.mjs` — asserts the KICKOFF template
      text contains the "re-derive tally + reconcile from disk... stop and
      report" instruction as its first numbered step.
- [ ] Author `tests/v3/kickoff-no-fuzzy.mjs` — asserts the KICKOFF template
      text contains the fuzzy-resume-ban sentence and does NOT contain a
      bare `/read-chat`-as-resume-mechanism instruction (i.e., `/read-chat`
      may still appear in SKILL.md's pre-grounding composability note,
      `SKILL.md:520`, but never inside the KICKOFF template block itself).
- [ ] Author `tests/fixtures/v3/pkg-parity/` — a `plugin.json`/`marketplace.json`
      pair with a deliberate version/name mismatch.
- [ ] Author `tests/fixtures/v3/mirror-drift/` — a copy of the 8-pair tree
      with a 1-byte change in one `plugins/plan-it/...` file (per D2's case
      text: "1-byte change in plugin copy of machine.json").

### Binding Test Contract

| ID | @tag | [REAL] case | run: | fixture | Covers |
|---|---|---|---|---|---|
| T-C3-01 | @case-machine | [REAL] KICKOFF contains absolute repo path, git SHA, state.json path, contract SHA-256 | `node tests/v3/kickoff-pinning.mjs` | inline sample KICKOFF generated by the test | C-W6-01 |
| T-C3-02 | @case-machine | [REAL] KICKOFF first step instructs builder to re-derive tally + reconcile from disk; mismatch = stop-and-report | `node tests/v3/kickoff-rederive.mjs` | `references/templates.md` (KICKOFF block) | C-W6-02 |
| T-C3-03 | @case-machine | [REAL] KICKOFF template contains no fuzzy-resume language (`/read-chat` ban) — pinned-resume only | `node tests/v3/kickoff-no-fuzzy.mjs` | `references/templates.md` (KICKOFF block) | C-W6-05 |
| T-C3-04 | @case-packaging | [REAL] plugin.json ↔ marketplace.json parity mismatch fixture → `handoff` FAILS (lint scoped to plans whose diff touches packaging files) | `node scripts/gate-check.mjs handoff --dir tests/fixtures/v3/pkg-parity` | `tests/fixtures/v3/pkg-parity/` | C-W6-04 |
| T-C3-05 | @case-machine | [REAL] All eight (labeled "six" in source docs — see PRD §3) shared root↔plugins/plan-it file pairs byte-identical → exit 0 | `node scripts/gate-check.mjs mirror-check` | live repo tree (no fixture — asserts against the real 8 pairs) | D1 |
| T-C3-06 | @case-machine | [REAL] Any pair drifts (1-byte change in plugin copy of machine.json) → exit 2 listing each drifted pair | `node tests/v3/mirror-drift.mjs` | `tests/fixtures/v3/mirror-drift/` | D2 |
| T-C3-07 | @case-machine | [REAL] mirror-check wired into the release epic checklist; CHANGELOG entry for v3.0.0 cannot be finalized with drift present | `node tests/v3/mirror-wired-into-release.mjs` | `delivery/v3/epics/epics-3-vocab-packaging-release.md` (this file's C4 checklist, grepped for the `mirror-check` gate step) | D3 |

Count: 7

---

## C4 — Release & comms epic (Wave 2, EC-D8)

Branch: `epic/c4-release-comms`  |  Depends on: C1, C2, C3 (needs the vocab
guard, `pluginlint`, `mirror-check`, and parity lint all merged into
`v2/deterministic-core` before this epic's own gate checks are runnable) —
also soft-depends on Squad A's `reconcile`/`contract` verbs and Squad B's
`--audit` subcommand existing for full mechanical enforcement (PRD §7); this
epic's binding cases below use local proxies where those aren't yet landed.
Scope: PRD §D9 — the one-time chore that actually ships v3.0.0, and the sole
epic authorized to merge `v2/deterministic-core` → `main` and tag `v3.0.0`
(`delivery/v3/CONTRACT.md:47`).

Tasks:
- [ ] `plugins/plan-it/.claude-plugin/plugin.json:4` — bump `version` to
      `3.0.0`.
- [ ] `SKILL.md:29` frontmatter `version:` — bump to `3.0.0`; mirror to
      `plugins/plan-it/skills/plan-it/SKILL.md`.
- [ ] `.claude-plugin/marketplace.json:13` (`plugins[0].version`) — bump to
      `3.0.0` (parity with plugin.json, per D8's own new check — run
      `gate-check handoff` after this edit).
- [ ] `.claude-plugin/marketplace.json:6` — rewrite the description to
      remove/correct the "published in the wider DevOtts marketplace" claim
      (PRD §3 resolved XOR: claim-softened).
- [ ] `machine.json:4` — reconcile the `"2.0.0"` version field: either bump
      it to track (e.g. `"3.0.0"`) or record an explicit `--audit` waiver
      (coordinate with Squad B; if `--audit` isn't landed yet, record the
      waiver as a dated note in this epic's own checklist output and in
      `delivery/decisions.md` at execution time, not silently skip it).
      Mirror to `plugins/plan-it/skills/plan-it/machine.json`.
- [ ] `README.md:259-266` (Status section) — refresh `2.1.0` references to
      `3.0.0`; keep the existing Installation section pattern
      (`README.md:64-121`) as-is (already matches sibling
      fable-it/parallel-lifecycle marketplace-add + plugin-install
      convention — verification-and-refresh, not a rewrite).
- [ ] Create `CHANGELOG.md` (new file, repo root) with a dated
      `## 3.0.0 — <ship date>` section enumerating `FD-1`, `FD-2`, and every
      shipped backlog ID (sourced from `delivery/design/v3-architecture.md`
      §4's table at execution time, per PRD §7).
- [ ] Create `delivery/v3/LINKEDIN-POST.md` (comms artifact, dogfood-angle
      precedent per `delivery/decisions.md:10,21`).
- [ ] Run `node scripts/gate-check.mjs pluginlint .` and
      `node scripts/gate-check.mjs pluginlint plugins/plan-it` — both must
      exit 0 before merge.
- [ ] Run `node scripts/gate-check.mjs mirror-check` — must exit 0 before
      merge (this is D3's "wired into the release epic checklist"
      requirement — T-C3-07 asserts this checklist line exists).
- [ ] Run `node scripts/gate-check.mjs handoff delivery/` (parity + vocab +
      existing checks) — must exit 0 before merge.
- [ ] `claude plugin validate .` and `claude plugin validate ./plugins/plan-it`
      (local marketplace-install proxy, `README.md:270-273`) — must exit 0;
      this is the local proxy for the IMPLEMENTED-NOT-VERIFIED live-install
      ceiling (PRD §7) — record result, don't claim VERIFIED on live install.
- [ ] Merge `v2/deterministic-core` → `main`; tag `v3.0.0`.

### Binding Test Contract

| ID | @tag | [REAL] case | run: | fixture | Covers |
|---|---|---|---|---|---|
| T-C4-01 | @case-packaging | [REAL] Version triple-match: plugin.json = SKILL.md header = CHANGELOG top entry = 3.0.0; machine.json version reconciled or explicitly `--audit`-waived | `node tests/v3/version-triple-match.mjs` | live repo tree post-bump (`plugin.json`, `SKILL.md`, `CHANGELOG.md`, `machine.json`) | F1 |
| T-C4-02 | @case-packaging | [REAL] README install docs match the sibling (fable-it/parallel-lifecycle) pattern; marketplace claim matches the resolved G2-Q4 outcome (claim softened, no aggregator) | `node tests/v3/marketplace-claim.mjs` | `.claude-plugin/marketplace.json` + `README.md` post-edit | C-W6-03 + F2 |
| T-C4-03 | @case-packaging | [REAL] CHANGELOG has a dated v3.0.0 section enumerating FD-1, FD-2, and each shipped backlog item by ID | `node tests/v3/changelog-shape.mjs` | `CHANGELOG.md` post-creation | F3 |
| T-C4-04 | @case-packaging | manual: no second Claude Code subscription/machine available in this environment to drive `/plugin marketplace add DevOtts/plan-it` end-to-end; local proxy is `claude plugin validate .` / `claude plugin validate ./plugins/plan-it` (`README.md:270-273`), run as a task above and recorded IMPLEMENTED-NOT-VERIFIED for the live-install claim, never VERIFIED on the proxy alone | `claude plugin validate . && claude plugin validate ./plugins/plan-it` | none (live tree) | verification-ceiling note, `delivery/decisions.md:32-34` |

Count: 4 (3 `[REAL]` + 1 `manual:`)

**Manual-share note:** across this whole squad's 18 covered cases, 1 of 21
Test Contract rows (T-C4-01..04 include T-C4-04) is `manual:` — 1/21 ≈ 4.8%,
well inside CONTRACT.md C-W1-06's ">30% manual share" warning threshold, and
inside the 0% current-manual-share invariant's tolerance is exceeded by
design here (the invariant text at `delivery/v3/CONTRACT.md:43` says
"current manual share: 0%" as a program-wide baseline before this run's own
cases existed; this squad's package introduces the first justified
`manual:` case in the program, for the one class of test genuinely unrunnable
in this environment — live marketplace install — consistent with
`delivery/decisions.md:32-34`'s documented verification ceiling). Flagged as
a note for the coordinator; not a silent drop, and well under the 30% gate
threshold either way.

---

## Case map — proof of full coverage (18/18 assigned IDs)

Enforcement rows (8):

| CONTRACT ID | Epic | Binding case(s) |
|---|---|---|
| C-W4-01 | C1 | T-C1-01 |
| C-W4-02 | C1 | T-C1-02 |
| C-W4-03 | C1 | T-C1-03 |
| C-W6-01 | C3 | T-C3-01 |
| C-W6-02 | C3 | T-C3-02 |
| C-W6-03 | C4 | T-C4-02 |
| C-W6-04 | C3 | T-C3-04 |
| C-W6-05 | C3 | T-C3-03 |

Draft cases (10), from `delivery/TEST-CONTRACT-REVIEW.md` areas C, D, F:

| Draft ID (area-prefixed, per TEST-CONTRACT-REVIEW.md) | Epic | Binding case(s) |
|---|---|---|
| draft-C1 (pluginlint: colon) | Epic C2 | T-C2-01 |
| draft-C2 (pluginlint: plugin.json fields) | Epic C2 | T-C2-02 |
| draft-C3 (pluginlint: marketplace source) | Epic C2 | T-C2-03 |
| draft-C4 (pluginlint: name/dir match — distinct from Epic C4) | Epic C2 | T-C2-04 |
| draft-D1 (mirror-check: identical → exit 0) | Epic C3 | T-C3-05 |
| draft-D2 (mirror-check: drift → exit 2) | Epic C3 | T-C3-06 |
| draft-D3 (mirror-check wired into release) | Epic C3 | T-C3-07 |
| draft-F1 (version triple-match) | Epic C4 | T-C4-01 |
| draft-F2 (README + marketplace claim) | Epic C4 | T-C4-02 |
| draft-F3 (CHANGELOG dated v3.0.0) | Epic C4 | T-C4-03 |

**18/18 assigned IDs mapped, zero silent drops.** Total binding cases
authored this package: 18 (T-C1-01..03, T-C2-01..04, T-C3-01..07,
T-C4-01..04 = 3+4+7+4 = 18) covering 18 CONTRACT/draft IDs 1:1, plus one
verification-ceiling note (T-C4-04) that is itself part of C4's Test Contract
table but maps to no single CONTRACT ID — it exists to keep the
IMPLEMENTED-NOT-VERIFIED ceiling honest rather than silently mark F2/C-W6-03's
live-install implication as VERIFIED. No PROPOSED-AMENDMENT items — every
assigned ID landed in exactly one epic with no merge/split of CONTRACT-level
IDs required.
