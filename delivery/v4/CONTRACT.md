# plan-it v4 — CONTRACT

Version: **v1.5 — FROZEN 2026-09-07** (AMD-7, AMD-8, AMD-10, AMD-11 and AMD-12 applied by the orchestrator during W1, see Changelog; v1.0 (ratified by Fernando Ott at PLAN-REVIEW, gate G4, 2026-09-07: defaults R1–R12 confirmed as applied; authorizations A-1, A-3, A-4 granted; A-2 held until owner action O-2. Drafted as v1.0-draft, amended to v1.1-draft after squad planning, ratified to v1.0 — see Changelog. Post-freeze changes only via dated `AMD-n` entries in `delivery/decisions.md`.)
Basis: `docs/v4/01-findings.md` (synthesis) + `docs/v4/02-v4-design.md` (design) + rulings D1–D7 (Fernando Ott, 2026-09-07) recorded in `delivery/v4/DECISIONS.md`.
Tally: COMPUTED — run `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs contract delivery/v4/CONTRACT.md` (never hand-edit counts).
Fixtures: violating repos under `tests/fixtures/v4/` — every enforcement case must FAIL CLOSED against its fixture; the v4 renderer cases run against `tests/fixtures/v4/report/`.
Glossary: `delivery/v4/GLOSSARY.md` (every ID and acronym used below has a row there — first-use rule, E10).

## 1 · Vocabulary — use these words everywhere

| Term | Meaning |
|---|---|
| run | one plan-it execution, identified by a slug; its state lives in one state file |
| state file | `.plan-it/<slug>.state.json` (named) or `.plan-it/state.json` (generic, legacy) |
| deliveryRoot | the repo-relative folder holding a run's package (this run: `delivery/v4/`) |
| mode | `autonomous-draft` (default) or `guided`; recorded at anamnesis |
| anamnesis | gate G0: the one up-front questionnaire of everything the run will need from the human |
| scope brief | the human-readable explanation of size, shape and topology rendered before gate G1 |
| topology | how the build is run: `solo` · `orchestrator+squads` · `headless` |
| triage verdict | one of `plan` · `build-instead` · `owner-decision` · `skip`, recorded before any plan |
| default | a G2 decision the run applied from its own recommendation, marked for contradiction at G4 |
| plan review | gate G4: the single review-and-contradict round on the complete draft package |
| draft contract | a CONTRACT whose header carries `-draft`; frozen FOR squads, not yet ratified by the human |
| twin | the `<NAME>.html` rendered beside a canonical `<NAME>.md`; markdown is the source, HTML is derived |
| manifest | the JSON (`schema: planit-report/1`) a low-tier author writes; the renderer turns it into a twin |
| stamp | a `<meta name="planit-*">` in a twin's head carrying `<relpath> sha256=<hash>` provenance |
| disposition | the closed word for what happens to a non-green item at close: `backlog-with-reason` · `owner-gated` · `IMPLEMENTED-NOT-VERIFIED` |
| glossary | `GLOSSARY.md`: static plan-it vocabulary + the IDs this run minted, one row each |
| legend line | one line listing what each per-run ID prefix means, required wherever three or more per-run IDs appear together |

Status vocabulary is closed and unchanged: NOT-STARTED · IN-PROGRESS · IMPLEMENTED-NOT-VERIFIED · VERIFIED.

## 2 · Package layout and ownership (disjoint lanes — no co-editing)

Paths are under `plugins/plan-it/skills/plan-it/` unless noted; the root copies are mirrors and follow. `MIRROR_PAIRS` grows from 8 to **11**: `scripts/build-report.mjs`, `scripts/report-template.html`, `assets/brand/default.brand.json` join the eight existing pairs.

| Squad | Owns (exclusive) | Never touches |
|---|---|---|
| **SQ-A Renderer** | `scripts/build-report.mjs` · `scripts/report-template.html` · `assets/brand/default.brand.json` · `references/report-family.md` · `tests/v4/renderer/*` · `tests/fixtures/v4/report/**` | gate-check, machine, guard, SKILL, other references |
| **SQ-B Core** | `machine.json` · `scripts/gate-check.mjs` · `plugins/plan-it/scripts/hooks/planit-guard.mjs` (+ root mirror) · `tests/run-contract.mjs` · `tests/v3/lib/contract-cases.mjs` · `tests/v4/core/*` · `tests/fixtures/v4/**` except `tests/fixtures/v4/report/**` (SQ-A) — machine, guard, portfolio, glossary, disposition, mirror, triage-no-memo, planreview-no-file, draft-*, defaults-empty, deliveryroot-*, envfacts-*, dogfood-project · `tests/fixtures/v3/machine.v3.7fcff27.json` (the orchestrator creates it in W0; V4B1 verifies its SHA-256 and never overwrites) · `tests/v3/mirror-wired-into-release.mjs` · `tests/v3/fail-closed-sweep.mjs` (exit-polarity for positive harness rows) | renderer files, SKILL, references, docs, packaging |
| **SQ-C Prose & packaging** | `SKILL.md` · `references/{templates,formats,playbooks,machine}.md` · `docs/**` · `README.md` · `CHANGELOG.md` · `plugins/plan-it/.claude-plugin/plugin.json` · `.claude-plugin/marketplace.json` · `tests/v3/version-triple-match.mjs` · `tests/v3/kickoff-pinning.mjs` · `tests/v3/changelog-shape.mjs` · `tests/v4/prose/*` | code files owned by SQ-A / SQ-B |
| **Orchestrator** | `delivery/v4/STATUS.md` · `delivery/v4/CONTRACT.md` amendments · `delivery/decisions.md` (AMD-4, AMD-5) · root mirrors sync · merges · W0 | squad lanes |
| **QA** | `delivery/v4/QA-REPORT.md` | everything else (read-only) |

Branch pattern: `epic/v4<squad-letter>-<slug>` (e.g. `epic/v4a-renderer-core`). Squads work in git worktrees (governance rule G-10). Cross-lane needs are resolved by amendment to this CONTRACT via the orchestrator, never by editing another lane's file.

## 3 · Core-logic models (the confusing parts, modelled — including the failure half)

### 3.1 The v4 pipeline statechart (additive superset of 3.0.1; `machine.json`)

All 17 baseline states, 17 baseline events and 5 baseline guards keep their names and guard mappings. Eight new states; three baseline edges retargeted through new states (permitted by `checkMachineAdditive`). Transitions (arrows are the machine):

```
intake -> triage                                  (INTAKE_CAPTURED, retargeted through NEW state)
triage -> anamnesis                               (TRIAGE_PLAN, guard triageRecorded)
triage -> CLOSED_WITHOUT_PLAN                     (TRIAGE_BUILD_INSTEAD | TRIAGE_SKIP | TRIAGE_OWNER_DECISION, guard triageRecorded; memo on disk or the guard REJECTS)
anamnesis[G0, human] -> dodLock                   (G0_ANSWERED, guard gateRecorded)
dodLock -> scopeBrief                             (DOD_LOCKED, retargeted through NEW state)
scopeBrief -> scopeGate                           (BRIEF_RENDERED, guard artifactsOnDisk)
scopeGate[G1] -> preGround -> discovery -> preflight -> synthesis -> specAuthoring     (unchanged)
specAuthoring -> decisionGate[G2]                 (SPECS_DRAFTED — guided)
specAuthoring -> defaultsApplied                  (SPECS_DRAFTED_AUTONOMOUS — autonomous)
defaultsApplied -> coherencePass                  (DEFAULTS_APPLIED, guard defaultsRecorded)
coherencePass -> freezeGate[G3]                   (COHERENT — guided)
coherencePass -> backboneFreeze                   (COHERENT_AUTONOMOUS)
freezeGate -> backboneFreeze                      (G3_APPROVED, guard gateRecorded)
backboneFreeze -> parallelPlanning                (CONTRACT_FROZEN, guard contractFrozen; autonomous = freeze --draft)
parallelPlanning -> parallelPlanning              (AMENDMENT)
parallelPlanning -> verify -> adversaryGate       (unchanged)
adversaryGate -> render                           (ADVERSARY_CLEAN, guard adversarialDepth, retargeted through NEW state)
render -> handoff                                 (RENDERED — guided, guard artifactsOnDisk)
render -> planReview[G4, human]                   (REVIEW_READY — autonomous, guard artifactsOnDisk)
planReview -> freeze                              (REVIEW_ANSWERED, guard planReviewed; records G4 + G2 answers + G3)
freeze -> handoff                                 (CONTRACT_FINAL, guard contractFrozen; v1.0-draft -> v1.0)
freeze -> parallelPlanning                        (REVIEW_CONTRADICTED — recovery: a contradiction that changes the CONTRACT re-enters squads as an AMENDMENT, then verify -> adversaryGate -> render -> planReview again)
handoff -> done                                   (HANDED_OFF)
```

Lifecycle states for the state file: `state ∈ {intake, triage, anamnesis, dodLock, scopeBrief, scopeGate, preGround, discovery, preflight, synthesis, specAuthoring, decisionGate, defaultsApplied, coherencePass, freezeGate, backboneFreeze, parallelPlanning, verify, adversaryGate, render, planReview, freeze, handoff, done, CLOSED_WITHOUT_PLAN}`.

Machine ids are camelCase like the 17 baseline ids: the non-plan terminal's id is `closedWithoutPlan`; its `meta.title` and the `state` verb's printout use `CLOSED_WITHOUT_PLAN` (case C-E6-02 matches the printout). Failure and recovery, named: `CLOSED_WITHOUT_PLAN` is the honest terminal exit for the three non-plan verdicts; a missing memo makes the `state` verb REJECT the transition (fix: write the memo). `REVIEW_CONTRADICTED` is the recovery loop after a human contradiction. `planReview` is REJECTED by `state` when `PLAN-REVIEW.md` is missing (fix: write it). `render` is REJECTED by `artifactsOnDisk` when a twin is missing. A draft at `handoff` is REJECTED ("draft contract cannot hand off"). Mode-inconsistent history is REJECTED. Escalation: a second REVIEW_CONTRADICTED on the same default is not re-defaulted — it is written as an open decision card for the owner (ESCALATED to the human, never guessed again).

### 3.2 The renderer and mirror lifecycle (`build-report.mjs` + `gate-check mirror`)

```
RENDER_REQUESTED -> RENDERED                      (exit 0)
RENDER_REQUESTED -> RENDERED_PARTIAL              (exit 2: warnings — missing embed, unresolved glossary ID, brand fell back, mockup without provenance; the page is written with visible placeholders)
RENDER_REQUESTED -> RENDER_FAILED                 (exit 1: nothing written — manifest unreadable, kind unknown, measurement read_only:false)
RENDER_FAILED -> RENDER_REQUESTED                 (fix the manifest; retry)
RENDERED_PARTIAL -> RENDER_REQUESTED              (fix the missing input; re-render)
RENDERED -> MIRROR_FRESH                          (gate-check mirror exit 0)
RENDERED -> MIRROR_STALE                          (exit 2: source md, embed or brand changed since the stamp)
MIRROR_STALE -> RENDER_REQUESTED                  (recovery: re-render is mechanical, no model call)
MIRROR_STALE -> ESCALATED                         (failed recovery: still stale after re-render ⇒ the md changed shape ⇒ the low-tier author updates the manifest; reported in STATUS)
HTML_UNSTAMPED -> MIRROR_REJECTED                 (exit 1: hand-authored HTML is refused; the HTML is never the source)
```

### 3.3 The write guard (`planit-guard.mjs`)

```
WRITE_REQUESTED -> RESOLVE_RUN                    (scan .plan-it/*.state.json; longest deliveryRoot prefix wins; legacy docs/implementation/<name>/ match; generic; none)
RESOLVE_RUN -> ALLOWED                            (no state file, or contract.version non-empty, or path is not a deliverable)
RESOLVE_RUN -> WRITE_DENIED                       (deliverable write while the RESOLVED run's contract.version is null; reason names the resolved file)
WRITE_DENIED -> WRITE_REQUESTED                   (recovery: freeze the contract (or --draft), record contract.version, retry)
any error -> ALLOWED                              (fail-open, always)
```

### 3.4 Run archive

```
ARCHIVE_REQUESTED -> ARCHIVED                     (state ∈ {done, CLOSED_WITHOUT_PLAN}; moved to .plan-it/done/; archive{} appended)
ARCHIVE_REQUESTED -> ARCHIVE_REFUSED              (non-terminal run, or target exists; exit 1; no --force)
ARCHIVE_REFUSED -> ARCHIVE_REQUESTED              (finish the run or record a triage verdict, then retry)
```

Cascade classes (adversary gate D-B3): **partial-failure** = RENDERED_PARTIAL (case C-E2-02) · **rollback/compensation** = REVIEW_CONTRADICTED → AMENDMENT (C-E7-06), ARCHIVE_REFUSED (C-E9-05) · **failed-recovery → escalation** = MIRROR_STALE → ESCALATED (C-E2-07), second contradiction → ESCALATED (C-E7-06) · **recovery/resume** = `state --run` resume after crash (C-E9-01), MIRROR_STALE → re-render (C-E2-06), WRITE_DENIED → freeze → retry (C-E9-08) · **adversarial-verify** = stamp tamper (C-E2-06), guard tested in BOTH copies (C-E9-07), fabricated mockup refused (C-E5-01).

## 4 · Interfaces (binding signatures)

### 4.1 Renderer CLI
`node scripts/build-report.mjs <manifest.json> [--open] [--brand <path>|default] [--out <file>] [--check] [--strict]` — exit 0 rendered · 2 rendered with warnings · 1 error (nothing written). `--check`: render to memory and compare with the existing twin (0 identical / 2 stale-or-missing / 1 error), never writes. `--open`: default off; macOS `open -a "Google Chrome"` then `open`; linux `xdg-open`; win32 `cmd /c start`; suppressed by `PLANIT_NO_OPEN=1` or a non-TTY stdout; never changes the exit code. Stdout: one line `built: <path> (<bytes> bytes) brand=<default|repo:<relpath>> stamp=sha256:<12-hex> html-blocks=<n>`. Determinism: same manifest + template + brand + embed bytes ⇒ byte-identical HTML; no timestamps, no absolute paths written.

### 4.2 Manifest `planit-report/1`
Top level: `schema` (required, `planit-report/1`), `kind` (required, one of SCOPE-BRIEF · TRIAGE · RESEARCH-REPORT · DECISIONS · CONTRACT · KICKOFF · PLAN-REVIEW · GLOSSARY · LEGACY), `title`, `subtitle_html`, `source{path}` (the md twin; hashed into the stamp), `output`, `glossary{path}`, `rulings{path}`, `allow_tokens[]` (non-model `claude-*` names), `sections[]{id, heading, blocks[]}`. Conclude-it's `sections[].{table,cards,html}` is accepted and rewritten to blocks (kind LEGACY, exit 2 unless `--strict`).
Embedded markdown (`embed` blocks, `source` twins) is a human-facing surface like any other: the first-use expansion pass (G-8) applies to its prose at build time, outside code spans, fenced blocks, link targets and existing HTML, with one page-global first-use set in document order — the client-side markdown renderer must pass the resulting inline `<abbr>` through (AMD-12). Block types (each with the failure state in `references/report-family.md`): `table` · `cards` · `decision-card` (`id`, `kind ∈ decision|authorization|owner-action`, `question_html`, `options[]`, `recommendation`, `why_yours_html`, `unblocks_html`, optional `deadline`, `embed`, `status ∈ open|ruled`, `ruling`) · `embed` · `mockup` (requires `provenance{source, rows_read, read_at, read_only:true}`) · `flow` (mermaid source) · `states` (`good`, `empty`, `misconfigured`) · `measurement` (`value`, `unit`, `where`, `read_at`, `read_only:true`) · `rulings` · `rulings-forward` · `copy-rulings` · `glossary` · `lockbox` · `tally` (counted from referenced sections) · `triage-card` (`verdict ∈ plan|build|decide|skip`) · `copy` · `html`.

### 4.3 Stamps (mirror contract)
`<meta name="planit-source" content="<relpath> sha256=<64-hex>">` · `planit-embeds` (`;`-separated `<relpath> sha256=<hash>`) · `planit-brand` (`default sha256=…` or `repo:<relpath> sha256=…`) · `planit-renderer` (`build-report.mjs/4.0.0 template sha256=…`) · `planit-kind`. Relpaths are relative to the twin's directory, forward slashes, no `./`; hashes are over raw bytes.

### 4.4 Brand `planit-brand/1`
`{schema, name, source, palette{…hex}, fonts{display, body, mono, googleFontsHref}, roles{light{bg, card, line, ink, muted, accent, accentBg, ok, warn, bad, info, chip, hold}, dark{…}}}`. Detection order: `--brand` flag → `.plan-it/brand.json` → `brand.json` · `assets/brand/brand.json` · `docs/brand/brand.json` · `brand/brand.json` → markdown guideline present-but-not-tokenised (warning, default used, badge says so) → bundled default. The default is the Her0 palette with the R7 contrast mapping (Signal/Flare/Info/Warn as chip backgrounds in light mode; muted = Steel).

### 4.5 gate-check verbs (new or extended; all zero-dep; exit 0 pass · 1 fail · 2 action-required where stated)
`state <file|--dir root> [--run <slug>]` (+ checks: triage payload, defaults recorded, plan-review artifact, draft-cannot-hand-off, mode consistency) · `freeze <CONTRACT.md> [--draft] [--run]` · `testconv --dir <root> [--run]` (receipt to the resolved file) · `contract|reconcile|adversary|handoff` resolve the package dir from `run.deliveryRoot` (fallback `delivery/`, then `delivery/v3/`) · `reconcile`'s C-W5-02 orphan scan skips `R<n>` tokens recorded as default IDs in the resolved state file (`gates.G2.defaults[].id`) — the §5 defaults grammar collides with the PRD requirement grammar (AMD-7) · `mirror <md> <html>` / `mirror --dir <delivery> [--require-html]` (0 fresh · 2 stale · 1 unstamped/malformed; `--dir` skips `<delivery>/resources/**`, the declared run-input folder, which is never a twin — AMD-8; recomputes the stamped hashes itself with `node:crypto` and never invokes the renderer — `build-report.mjs --check` is the renderer's own convenience, not a gate-check dependency) · `glossary <delivery-dir>` (1 = unknown ID, named with file:line) · `archive <slug> [--dir root]` (1 = refused) · `runs [--dir root] [--json]` (0 even for zero runs) · `handoff` embeds `reconcile` (dispositions), `glossary`, `mirror` as scoped steps.

### 4.6 State-file additions (all optional; `state` tolerates extra keys)
`run.name` (`^[a-z0-9][a-z0-9-]*$`) · `run.mode` · `run.topology` · `run.deliveryRoot` (trailing slash) · `run.anamnesis` · `triage{verdict, measuredAt, measurements[], memo}` · `gates.G0` · `gates.G2.defaults[]{id, question, default, rationale, source:"recommended", contradicted}` · `gates.G2.pendingReview` (boolean; a provisional G2 record before `planReview`) · `gates.G4{approved, owner, date, contradictions[]}` · `contract.draft` · `render{manifest, outputs[]{md, html, sha256}}` · `archive{archivedAt, from}`. `meta.stateFile` = `.plan-it/<slug>.state.json`; `meta.stateFileFallback` = `.plan-it/state.json`.

## 5 · Grammars

- **IDs.** Cases in this CONTRACT: `C-E<n>-NN` (enhancement-scoped). Per-epic Test Contract cases: `T-<EID>-NN`. Epics: `V4<squad-letter><n>` (e.g. `V4A1`). Governance rules: `G-<n>`. Defaults: `R<n>`. Rulings: `D<n>`. Owner actions: `O-<n>`. Authorizations: `A-<n>`. Amendments: `AMD-<n>`. Waves: `W<n>`. The v3 harness grammar `C-(W\d+|META)-\d{2}` is widened by SQ-B to also accept `C-E\d+-\d{2}` (case C-E9-10). Until V4B3 also widens the 3.0.1 epic-heading grammar (`[A-Z]\d+`), every v4 epic heading reads `## Epic V4<letter><n> — <title>` so the 3.0.1 lints (Tier Table, Test Contract presence, zero-case) can see it.
- **Legend line.** Any artifact where three or more per-run ID prefixes appear carries one line: `Legend: G-n governance rule · T-<EID>-NN test case · Wn wave · Rn default · Dn ruling — see GLOSSARY.md`.
- **GLOSSARY.md rows.** `| ID | Expansion | Where defined |`; one ID per row; the ID cell is a literal ID or a family pattern with exactly these placeholders (AMD-10, one grammar shared by `gate-check glossary` and the renderer's glossary panel): `*` = one run of `[A-Za-z0-9.]+`; `NN` = `[A-Z0-9]{2,3}`; `<n>` or a trailing bare `n` = `\d+`. Examples: `T-*-NN`, `C-E*-NN`, `C-W*-NN`, `G-n`, `AMD-n`, `LG-n`, `F-*n`, `D-B<n>`. Range cells (`D1 … D7`) and multi-ID cells (`SQ-A · SQ-B`) are not rows. Implementations resolve a mention as a literal row first, then against family rows; there is NO range expansion — `P2-11` is a literal ID, never `P2…P11` (AMD-11). The rendered glossary table (panel or `glossary` block) is excluded from the first-use scan like `<code>`/`<pre>`.
- **STATUS.md board.** `| EID | Epic | Squad | Wave | Status | Tests (green/total) | Branch | Disposition |` + `## Residuals` (`| Item | Disposition | Reason / exit criterion | Evidence |`) + `## Log` (reverse-chronological dated bullets; `[incidental]` tag for unasked-for findings). Disposition cell: empty when Status = `VERIFIED`; exactly one of `backlog-with-reason: <path>` · `owner-gated: <owner>` · `IMPLEMENTED-NOT-VERIFIED: <case> <target>` when Status = `IMPLEMENTED-NOT-VERIFIED`; optional (empty or exactly one of those) when Status = `NOT-STARTED` or `IN-PROGRESS` — a disposition is a closing word (§1) and a freshly handed-off board of NOT-STARTED rows is the healthy path (AMD-8). A typed `Dispositions: N backlog · M owner-gated · K INV` line must equal the computed counts.
- **Measurement block.** `Measured: <value> · where: <source> · when: <date> · read-only: yes-verified|assumed|idempotent-writes-accepted · moved: <verdict before> -> <verdict after>`.
- **Decision tags.** `[DECIDED]` · `[CHANGED]` · `[CONFIRM: owner]` (from `references/formats.md` §1) are canonical in markdown; glyphs are renderer decoration only (R3).

## 6 · Governance (binding — every rule carries a test hook)

- **G-1 Additive core.** No 3.0.1 state, event, guard or verb is renamed, removed or changes meaning; `machine-diff` passes against `tests/fixtures/v3/machine.v3.7fcff27.json` and against `tests/fixtures/v2/machine.v2.fc6abc8.json`. (test: C-E7-01, C-E7-02)
- **G-2 Zero dependencies.** Every script uses `node:` builtins only; no `package.json` dependencies. (test: C-E2-11)
- **G-3 Closed status vocabulary** stays four terms; dispositions are a separate axis and never replace a status. (test: C-E8-01, C-E8-02)
- **G-4 No hardcoded model IDs** in any plan artifact or rendered twin; tiers only; `allow_tokens` for non-model names. The regex is intentionally duplicated byte-identical in `planit-guard.mjs` and `build-report.mjs` (lanes may not import each other's files); an amendment that changes one must change both; C-E2-09 asserts identity. (test: C-E2-09)
- **G-5 Counts computed, never typed** — tallies, mirror-pair counts, disposition counts, glossary coverage. (test: C-E8-03, C-E2-08)
- **G-6 Markdown is canonical; HTML is a derived twin** with provenance stamps; hand-authored HTML is refused by `mirror`; every family-kind md in a package has a twin at handoff. (test: C-E2-05, C-E2-06, C-E2-07)
- **G-7 Twins are created locally by default and never published as claude.ai artifacts**; `--open` only at human gates, suppressed when headless. (test: C-E2-10; prose: C-E1-03)
- **G-8 First-use rule.** Every human-facing surface expands an acronym or per-run ID on first use; a package carries `GLOSSARY.md`; an ID absent from the glossary fails handoff. The static-vocabulary half of `GLOSSARY.md` is a seed table shipped in `references/templates.md` (SQ-C); the skill copies it to the package at `intake`, before `scopeBrief`, so the first rendered twin never shows "not generated yet" in the healthy path; minted IDs are appended as the run creates them. (test: C-E10-01, C-E10-02, C-E10-03)
- **G-9 Contract cases never move to backlog.** A binding case that fails or cannot run stays IMPLEMENTED-NOT-VERIFIED with a reason; only work beyond the case set may be `backlog-with-reason`. (test: C-E8-02)
- **G-10 Worktrees-only** for any session editing a repo another session may touch (owner ruling P2-11); every SESSIONS.md squad prompt says so. (test: C-E4-02)
- **G-11 Poll, never wait.** No launch prompt that may run headless contains "wait for" a notification; it says poll. (test: C-E4-02)
- **G-12 Facts are probed, never guessed; measurements are read-only or say they are not.** A `measurement` block with `read_only:false` is a render error; an ABSENT probe blacklists only its tool (argv[0]) or its declared `tool`, not every token. `ENV-FACTS.md` gains an optional `tool` column (`| id | check | status | evidence | tool |`), documented in `references/formats.md` §9 (SQ-C). (test: C-E5-02, C-E6-03)
- **G-13 A draft contract never hands off**, and `freeze` without `--draft` refuses a `-draft` header. (test: C-E7-04, C-E7-05)
- **G-14 Mirror integrity 11/11** before any release; a release cannot finalize with drift. (test: C-E9-09)
- **G-15 Description budget.** The SKILL frontmatter description is ≤ 1,024 characters with the trigger phrases inside the first 250. (test: C-E1-02)

## 7 · Definition of SHIPPED (release gates, all computed)

`node tests/run-contract.mjs` 100% (v2 + v3 + v4 cases discovered from this file's `## Cases`) · `tests/v3/fail-closed-sweep.mjs` 100% mechanism-ready · `gate-check mirror-check` 11/11 · `gate-check machine-diff` vs both pinned baselines · `tests/v3/version-triple-match.mjs` = 4.0.0 across six sites + CHANGELOG · `tests/v3/changelog-shape.mjs` · a dogfood run of the 4.0.0 plugin on `tests/fixtures/v4/dogfood-project/` reaches `handoff` in autonomous-draft mode with every twin fresh. IMPLEMENTED-NOT-VERIFIED ships nothing.

## RUN-POLICY (frozen into the package)

Tier table — tiers resolve to concrete models at execution time; hardcoded model IDs anywhere in the package are a guard violation (W3):

| slice class | tier | notes |
|---|---|---|
| coordinator / orchestrator | top | owns gates, freeze, merges, amendments, escalation decisions; never edits squad files |
| mechanical (fixture scaffolds, manifest authoring, mirror copies, version bumps) | low | deterministic, fully spec'd byte-work |
| spec'd implementation vs a bound Test Contract | mid | default builder tier for SQ-A / SQ-B / SQ-C epics |
| judgment (statechart + guard semantics, renderer escaping, adversarial verify, cross-cutting) | top | never resolved below coordinator review |

- escalate-on-struggle: a failed or flaky slice re-runs exactly one tier up; every escalation is recorded in the run report.
- delivery rule: subagents write results to disk at exact absolute paths AND send a content-bearing final message — idle ≠ delivered.
- reap-on-merge: builders are stopped as soon as their output is merged and captured in durable files.
- Per-epic Tier Table (C-W3-01/C-W3-03 inherited): every epic carries `| tier | effort | escalation | scaffold-pointer |` with the pointer a build-it path.
- This run's binding instance: coordinator = top; PRD/epic authoring = mid; fixture scaffolding + manifest authoring = low; guard/statechart/escaping slices = top review.

## Cases

Legend: `C-E<n>-NN` = enforcement case for enhancement n · `@case-*` = the squad's area · `run:` = the command that must exit non-zero against its violating fixture (or pass on the positive fixture where stated) · `manual:` = a human step.

| ID | @tag | Case (expected behavior) | run: |
|---|---|---|---|
| C-E1-01 | @case-prose | SKILL.md contains exactly one "Output discipline for humans" section and the scope-brief step precedes the G1 menu in Phase 2 (fixture: SKILL without the section → FAIL) | `node tests/v4/prose/skill-sections.mjs` |
| C-E1-02 | @case-prose | SKILL frontmatter description ≤ 1,024 characters and the first 250 characters contain "/plan-it" and "plan" (G-15) | `node tests/v4/prose/description-budget.mjs` |
| C-E1-03 | @case-prose | SKILL.md says twins are created locally, opened only at human gates, never published as artifacts (G-7 prose) | `node tests/v4/prose/local-html-rule.mjs` |
| C-E1-04 | @case-prose | templates.md carries SCOPE-BRIEF, ANAMNESIS, DECISIONS, GATE, SESSIONS, PLAN-REVIEW, GLOSSARY skeletons each with its required sub-headings (fixture missing GATE "Standing rules" → FAIL) | `node tests/v4/prose/templates-present.mjs` |
| C-E2-01 | @case-renderer | Renderer determinism: the same manifest rendered twice yields byte-identical HTML | `node tests/v4/renderer/determinism.mjs` |
| C-E2-02 | @case-renderer | Missing embed → exit 2 (RENDERED_PARTIAL) with `WARNING: embed not found` and a visible placeholder in the page | `node tests/v4/renderer/missing-embed.mjs` |
| C-E2-03 | @case-renderer | Manifest without `schema`/`kind` → exit 1 (RENDER_FAILED) and no file written under `--strict`; LEGACY conclude-it manifest renders with exit 2 without `--strict` | `node tests/v4/renderer/strict-schema.mjs` |
| C-E2-04 | @case-renderer | Brand detection order: `.plan-it/brand.json` beats `assets/brand/brand.json`, which beats a markdown-only guideline (exit 2, badge "guideline present, not tokenised"), which beats the bundled default; the `planit-brand` stamp names the winner | `node tests/v4/renderer/brand-detection.mjs` |
| C-E2-05 | @case-machine | `mirror --dir` exits 2 "missing twin" when a family-kind md has no html under `--require-html`; a non-family md without html does not fail | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs mirror --dir tests/fixtures/v4/mirror-missing-twin/delivery --require-html` |
| C-E2-06 | @case-machine | `mirror` exits 2 (MIRROR_STALE) naming both hashes when one byte of the source md changed after the stamp; re-render makes it exit 0 (MIRROR_FRESH) | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs mirror tests/fixtures/v4/mirror-stale/CONTRACT.md tests/fixtures/v4/mirror-stale/CONTRACT.html` |
| C-E2-07 | @case-machine | Unstamped (hand-authored) HTML → `mirror` exit 1 (MIRROR_REJECTED, HTML_UNSTAMPED); a still-stale twin after re-render is reported ESCALATED in the handoff output | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs mirror tests/fixtures/v4/mirror-unstamped/X.md tests/fixtures/v4/mirror-unstamped/X.html` |
| C-E2-08 | @case-renderer | `tally` tiles are counted from the referenced sections: adding a fourth `triage-card` to the fixture changes the tile from 3 to 4 with no manifest change (G-5) | `node tests/v4/renderer/tally-computed.mjs` |
| C-E2-09 | @case-renderer | A `claude-`-prefixed model ID in any rendered body → exit 2 naming it (regex identical to the guard's); a name listed in `allow_tokens` is not flagged (G-4) | `node tests/v4/renderer/model-id-leak.mjs` |
| C-E2-10 | @case-renderer | `--open` routes by platform (darwin: `open -a "Google Chrome"` then `open`), is suppressed by `PLANIT_NO_OPEN=1` or non-TTY, and never changes the exit code (G-7) | `node tests/v4/renderer/open-routing.mjs` |
| C-E2-11 | @case-packaging | No file under `plugins/plan-it/` imports anything outside `node:` builtins; no `package.json` dependencies (G-2) | `node tests/v4/prose/zero-deps.mjs` |
| C-E2-12 | @case-renderer | Script-escape completeness: an embed containing `</SCRIPT>`, `</script >`, `<!--`, `[x](javascript:alert(1))` and an attribute-quote breakout renders with exactly one markdown script block closed by the renderer and no `javascript:` href or injected attribute | `node tests/v4/renderer/xss-escape.mjs` |
| C-E2-13 | @case-renderer | Every `var(--token)` referenced in the rendered `<style>` is defined in the bare `:root` block (both themes resolve in the un-stamped state) | `node tests/v4/renderer/theme-tokens.mjs` |
| C-E2-14 | @case-renderer | A `flow` block emits the pinned mermaid 10.9.1 cdnjs script, `securityLevel:'strict'`, a `<pre class="mermaid">` with the escaped source and a `<noscript>` note; a manifest with no `flow` emits no mermaid script | `node tests/v4/renderer/mermaid-fallback.mjs` |
| C-E3-01 | @case-renderer | A `decision-card` with `status:open` and no `why_yours_html` or no `recommendation` → exit 2 naming the card | `node tests/v4/renderer/decision-card-complete.mjs` |
| C-E3-02 | @case-renderer | A DECISIONS manifest whose `rulings.path` names an earlier DECISIONS.md renders a `rulings-forward` table with every prior item and its State; a dropped prior item → exit 2 | `node tests/v4/renderer/rulings-forward.mjs` |
| C-E3-03 | @case-renderer | `copy-rulings` renders every open and ruled ID once, in document order, as `ID: value` pairs (D5) | `node tests/v4/renderer/copy-rulings.mjs` |
| C-E4-01 | @case-prose | GATE.md template: every Answered row has `Type ∈ decision|authorization|owner-action`; the three sections exist; fixture with an untyped row → FAIL | `node tests/v4/prose/gate-shape.mjs` |
| C-E4-02 | @case-prose | SESSIONS.md launch prompts each contain package path, law, lane, branch pattern, DoD, register-handshake, gotcha, the worktrees-only line (G-10) and no "wait for" a notification (G-11); KICKOFF.md still carries exactly one launch prompt | `node tests/v4/prose/sessions-prompts.mjs` |
| C-E5-01 | @case-renderer | A `mockup` without `provenance` → exit 2 and the block shows the red chip "provenance missing — not drawn from measured rows" (adversarial-verify: a fabricated mock is never silent) | `node tests/v4/renderer/mockup-provenance.mjs` |
| C-E5-02 | @case-renderer | A `measurement` with `read_only:false` → exit 1 (RENDER_FAILED), nothing written (G-12) | `node tests/v4/renderer/measurement-readonly.mjs` |
| C-E5-03 | @case-renderer | A `states` block missing one of good/empty/misconfigured renders a grey "not enumerated" column and exit 2 | `node tests/v4/renderer/states-triptych.mjs` |
| C-E6-01 | @case-machine | `state` rejects a triage verdict outside {plan, build-instead, owner-decision, skip} and rejects `skip`/`build-instead`/`owner-decision` without `triage.memo` on disk (CLOSED_WITHOUT_PLAN REJECTED) | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs state --dir tests/fixtures/v4/triage-no-memo --run t1` |
| C-E6-02 | @case-machine | With the memo present, `state` accepts the transition and prints `CLOSED_WITHOUT_PLAN — (final state)` | `node tests/v4/core/triage-closed.mjs` |
| C-E6-03 | @case-machine | An ABSENT probe blacklists only argv[0] (or the probe's declared `tool`); a `node …` case is not marked unrunnable because an unrelated `node …` probe failed (G-12; fixes LG-7) | `node tests/v4/core/envfacts-tool-only.mjs` |
| C-E7-01 | @case-machine | `machine-diff` passes for the 4.0.0 machine against `tests/fixtures/v3/machine.v3.7fcff27.json` and against `tests/fixtures/v2/machine.v2.fc6abc8.json` (G-1) | `node tests/v4/core/machine-additive.mjs` |
| C-E7-02 | @case-machine | Six negative machine fixtures (initial changed · baseline state dropped · baseline event dropped · guard swapped · retarget onto baseline state · guard removed) each FAIL `machine-diff` with the named reason (G-1) | `node tests/v4/core/machine-negatives.mjs` |
| C-E7-03 | @case-machine | `state` rejects `gates.G4.approved:true` without `<deliveryRoot>/PLAN-REVIEW.md`, and with the file but no `Reviewed-by: <name> <date>` line | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs state --dir tests/fixtures/v4/planreview-no-file --run v4` |
| C-E7-04 | @case-machine | `state` rejects `state:handoff` with a `-draft` contract version ("draft contract cannot hand off", G-13) | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs state tests/fixtures/v4/draft-at-handoff/.plan-it/v4.state.json` |
| C-E7-05 | @case-machine | `freeze` without `--draft` refuses a `v1.0-draft` header; `freeze --draft` passes structure + RUN-POLICY while skipping only casesReviewed, and refuses when `gates.G2.defaults` is empty (G-13) | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs freeze tests/fixtures/v4/draft-header/delivery/CONTRACT.md` |
| C-E7-06 | @case-machine | `state` rejects mode-inconsistent history (autonomous with decisionGate; guided with planReview) and accepts `freeze -> parallelPlanning` (REVIEW_CONTRADICTED) as the recovery edge; a second contradiction of the same default is recorded as ESCALATED (open card), never re-defaulted | `node tests/v4/core/mode-consistency.mjs` |
| C-E7-07 | @case-machine | `state` requires `gates.G2.defaults[]` non-empty with every row `source:"recommended"` when `defaultsApplied` is in history | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs state tests/fixtures/v4/defaults-empty/.plan-it/v4.state.json` |
| C-E8-01 | @case-machine | `reconcile --dir` fails a STATUS board whose `IMPLEMENTED-NOT-VERIFIED` row has an empty `Disposition` cell, naming the row (G-3; AMD-8) | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs reconcile --dir tests/fixtures/v4/disposition-missing` |
| C-E8-02 | @case-machine | A `## Residuals` row whose Item is a contract case (`T-…`/`C-…`) with `backlog-with-reason` → FAIL "contract cases never move to backlog" (G-9) | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs reconcile --dir tests/fixtures/v4/disposition-contract-case` |
| C-E8-03 | @case-machine | A typed `Dispositions:` tally that disagrees with the computed counts → FAIL with both numbers (G-5); `[incidental]` log bullets are never counted into the case tally | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs reconcile --dir tests/fixtures/v4/disposition-tally-drift` |
| C-E9-01 | @case-machine | `state --run v4` reads `.plan-it/v4.state.json`, prints the position and only the mode's next events (resume after crash); extra keys tolerated | `node tests/v4/core/state-run-flag.mjs` |
| C-E9-02 | @case-machine | `testconv --run v4` writes its receipt into the named state file, never the generic one | `node tests/v4/core/testconv-named.mjs` |
| C-E9-03 | @case-machine | `contract`, `reconcile`, `adversary`, `freeze --dir` resolve the package dir from `run.deliveryRoot`; a fixture with only `delivery/v4/` and an empty `delivery/v3/` is scanned correctly (fixes F-B14 false greens) | `node tests/v4/core/deliveryroot-resolution.mjs` |
| C-E9-04 | @case-machine | `archive alpha` moves a `done` run to `.plan-it/done/` and appends `archive{}` | `node tests/v4/core/archive-moves.mjs` |
| C-E9-05 | @case-machine | `archive beta` on a `discovery` run → exit 1 ARCHIVE_REFUSED and the file is untouched; no `--force` exists | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs archive beta --dir tests/fixtures/v4/portfolio` |
| C-E9-06 | @case-machine | `runs` lists a two-run portfolio with computed counts and `--json` parses; an empty dir exits 0 with "no plan-it runs" | `node tests/v4/core/runs-list.mjs` |
| C-E9-07 | @case-guard | Guard resolves a named run by longest `deliveryRoot` prefix on a two-run fixture (frozen v4 + unfrozen generic): a write under `delivery/v4/prds/` is ALLOWED, a write under `delivery/other/prds/` is DENIED naming the generic file — asserted for BOTH the root and the plugin copy | `node tests/v4/core/guard-named-run.mjs` |
| C-E9-08 | @case-guard | Guard denies a genuinely unfrozen named run (WRITE_DENIED names `v4.state.json`); after recording `contract.version` the same write is ALLOWED (recovery) | `node tests/v4/core/guard-unfrozen-named.mjs` |
| C-E9-09 | @case-packaging | `mirror-check` reports 11 byte-identical pairs including `scripts/build-report.mjs`, `scripts/report-template.html`, `assets/brand/default.brand.json`; run-contract T-E5-02 uses the 11-pair list (G-14, AMD-5) | `node tests/v3/mirror-wired-into-release.mjs` |
| C-E9-10 | @case-machine | `tests/v3/lib/contract-cases.mjs` discovers `delivery/v4/CONTRACT.md` and accepts `C-E\d+-\d{2}` IDs; run-contract lists the v4 section with computed totals | `node tests/v4/core/contract-cases-v4.mjs` |
| C-E10-01 | @case-machine | `glossary <delivery-dir>` exits 1 naming an ID used in KICKOFF that has no GLOSSARY.md row, with file:line; a family match (`T-A4-B1` ⇐ `T-*-NN`) passes | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs glossary tests/fixtures/v4/glossary-unknown-id/delivery` |
| C-E10-02 | @case-machine | `handoff` embeds the glossary check and fails on the same fixture; `state` requires GLOSSARY.md at `handoff` when machineVersion major ≥ 4 | `node plugins/plan-it/skills/plan-it/scripts/gate-check.mjs handoff tests/fixtures/v4/glossary-unknown-id/delivery` |
| C-E10-03 | @case-renderer | Every kind renders exactly one `<details class="glossary">` before the first `<h2>`; the first prose occurrence of a glossary ID is wrapped `<abbr class="gl">` with one `.gl-x` expansion, later ones only `<abbr>`, code spans untouched; missing GLOSSARY.md → panel says "not generated yet" and exit 2 | `node tests/v4/renderer/glossary-panel.mjs` |
| C-E10-04 | @case-prose | GLOSSARY seed in templates.md covers PRD, CDP, ATDD/BDD, DoD, xhigh, D4, G0–G4, [REAL], INV, S/M/L, Shape 1–5, topology values; SKILL.md no longer says "15 states" | `node tests/v4/prose/glossary-seed.mjs` |
| C-E11-01 | @case-packaging | Version 4.0.0 across plugin.json, marketplace.json, both SKILL.md, both machine.json and the CHANGELOG top heading (`version-triple-match` EXPECTED updated) | `node tests/v3/version-triple-match.mjs` |
| C-E11-02 | @case-packaging | CHANGELOG 4.0.0 entry has the required section set and a Verification line naming mirror-check 11/11 | `node tests/v3/changelog-shape.mjs` |
| C-E11-03 | @case-prose | README names anamnesis, topology and autonomous-draft; docs/usage.md documents both modes; docs/methodology.md rule count equals SKILL.md's | `node tests/v4/prose/docs-coherence.mjs` |
| C-E11-04 | @case-machine | Guided path unchanged: all 17 baseline states, 17 baseline events and 5 baseline guards present with identical guard names; the only differing targets are the three retargets onto new states; a guided fixture run records G2/G3 exactly as 3.0.1 does | `node tests/v4/core/guided-unchanged.mjs` |
| C-E11-05 | @case-machine | AMD-4: run-contract's gate-count case binds "exactly three gates" to the v2 baseline, requires G1–G3 present in the live machine and `meta.human:true` on every `meta.gate` state | `node tests/v4/core/amd4-gate-count.mjs` |
| C-E11-06 | @case-packaging | Dogfood: the 4.0.0 plugin planning `tests/fixtures/v4/dogfood-project/` in autonomous-draft mode reaches `handoff` with `mirror --dir --require-html` exit 0 and `glossary` exit 0 (deterministic walk authored by SQ-B; the model-driven half runs in QA W3 under A-3 and is recorded in QA-REPORT.md; SQ-C's prose and versions are its dependency) | `node tests/v4/core/dogfood-run.mjs` |
| C-E11-07 | @case-packaging | Owner action O-1 performed: the stale `plan-it@plan-it` enablement and the user-level skill copy are removed or point at 4.0.0 (recorded in GATE.md; not a build blocker) | `manual: Fernando confirms O-1 in GATE.md before the 4.0.0 tag` |

## Changelog

- v1.5 — 2026-09-07 — **AMD-12** (orchestrator, W3; case count unchanged at 60). §4.2: embed-block prose participates in the G-8 first-use expansion at build time. QA finding 1 (QA-REPORT.md): four of eight report-family kinds (KICKOFF, CONTRACT, GLOSSARY, PLAN-REVIEW) use `embed` for their whole body, whose markdown sits in `<script type="text/markdown">` that the expansion pass rightly skips — so those twins carried zero expansions while every case passed (fixtures used non-embed blocks). Test hook: epic case T-V4A3-13 (V4A3 Count 12 → 13) on SQ-A's fix branch; QA re-verifies V4A3 and the visual check afterwards.
- v1.4 — 2026-09-07 — **AMD-11** (orchestrator, during W1; case count unchanged at 60). §5 GLOSSARY: literal-first lookup, no range expansion (the shared algorithm read the literal row `P2-11` as the range `P2…P11`), and the rendered glossary table is excluded from the first-use scan (the `glossary` block's own cells were re-scanned as prose). Both lanes implement it: renderer on SQ-A's fix branch (T-V4A3-12 fixture gains a literal `P2-11` row), `gate-check glossary` in SQ-B's lane (assertion added to the T-V4B4-09 script).
- v1.3 — 2026-09-07 — **AMD-10** (orchestrator, during W1; case count unchanged at 60). §5 GLOSSARY family-pattern grammar made explicit (`*`, `NN`, `<n>`/trailing `n`) as implemented by `gate-check glossary` (V4B4); the renderer's panel treated only `*` as a wildcard and `NN` literally, so `T-*-NN` never matched a real case ID and every package twin warned on IDs the lint resolved. Test hook: epic case T-V4A3-12 (V4A3 Count 11 → 12) on SQ-A's AMD-9 fix branch. GLOSSARY.md rows re-cut to the grammar (one ID per row; `LG-n`, `F-*n`; literal `W5`/`W6`, `AMD-1`…`AMD-3`).
- v1.2 — 2026-09-07 — **AMD-8** (orchestrator, during W1; case count unchanged at 60). Found by running the V4B4 lints against this very package: (a) §5 / C-E8-01 / T-V4B4-11 — a disposition is required only for `IMPLEMENTED-NOT-VERIFIED` rows, optional for `NOT-STARTED`/`IN-PROGRESS`, empty for `VERIFIED`; the literal "non-VERIFIED" rule failed every freshly handed-off board (all rows NOT-STARTED) and contradicted §1 ("what happens to a non-green item at close") and the STATUS legend. (b) §4.5 `mirror --dir` skips `<delivery>/resources/**` (run inputs, hand-authored by definition; this package's Notion export and seed HTMLs live there; the analysis report moved there too).
- v1.1 — 2026-09-07 — **AMD-7** (orchestrator, during W1; case count unchanged at 60): §4.5 `reconcile` orphan scan (C-W5-02) excludes `R<n>` tokens that are recorded defaults (`gates.G2.defaults[].id`). Found when V4B3 made `reconcile` see `delivery/v4/`: `prd-b-core.md` cites defaults R2/R10/R11 as rationale and the 3.0.1 scan reported them as orphan requirements; every v4 run that mints defaults would fail `handoff` the same way. Test hook: epic case T-V4B4-17 (V4B4 Count 16 → 17). Also this round, planning-artifact fixes with no contract change: backticked scaffold pointers in `epics-a-renderer.md`/`epics-c-prose.md` unwrapped to satisfy `POINTER_RE` (AMD-6 covers the two `run:` mechanism fixes).
- v1.0 — 2026-09-07 — **RATIFIED / FROZEN** at PLAN-REVIEW (gate G4) by Fernando Ott: R1–R12 confirmed, A-1/A-3/A-4 granted, A-2 held until O-2, no contradictions. Content identical to v1.1-draft except this header and this line; 60 cases.
- v1.1-draft — 2026-09-07 — **AMENDMENT** by the orchestrator after squad planning (sources: `prds/prd-a-renderer.md` §9, `prds/prd-b-core.md` §9, `prds/prd-c-prose.md` §10): ownership table widened (SQ-B: all v4 fixtures except report/, `mirror-wired-into-release.mjs`, `fail-closed-sweep.mjs`; SQ-C: `changelog-shape.mjs`); machine id `closedWithoutPlan` with printed title `CLOSED_WITHOUT_PLAN`; `mirror` recomputes hashes itself; `gates.G2.pendingReview`; model-ID regex duplication rule; GLOSSARY seed copied at intake; interim epic-heading grammar; ENV-FACTS `tool` column; C-E11-06 ownership split; `VERIFIED` mention backticked in §5. No case added or removed (60).

- v1.0-draft — 2026-09-07 — **FROZEN FOR SQUADS** in autonomous-draft mode (ruling D1). Defaults R1–R12 applied and listed in `delivery/v4/DECISIONS.md`; human ratification at PLAN-REVIEW (G4) bumps to v1.0. Amendments before then only via the orchestrator as dated `AMD-` entries in `delivery/decisions.md`.
