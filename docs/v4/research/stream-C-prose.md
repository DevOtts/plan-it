# Stream C — SKILL prose, references, packaging

Run: plan-it v4 research · Stream C · 2026-09-07 · status: COMPLETE

Acronym note (E10 applies to this report too): DoD = Definition of Done. PRD =
Product Requirements Document. G1/G2/G3 = the three human gates (Scope /
Decisions / Delivery). CDP = Chrome DevTools Protocol. ATDD/BDD = Acceptance
Test-Driven Development / Behavior-Driven Development. EDD = Eval-Driven
Development. SbE = Specification by Example. [REAL] = a test case that needs a
live target and can never be marked VERIFIED against a mock.
IMPLEMENTED-NOT-VERIFIED (abbreviated INV below) = a status meaning the code
exists but the case that would prove it could not be run. EID = Epic ID (the
`E1`, `S1-A1`-style identifier an epic is given inside one delivery package).

## 0. Scope + method (what you read, what you ran)

Read in full: `plugins/plan-it/skills/plan-it/SKILL.md` (564 lines),
`references/templates.md` (334 lines), `references/formats.md` (209 lines),
`references/playbooks.md` (247 lines), `references/machine.md` (153 lines) —
all under the plugin path (canonical per SHARED-CONTEXT.md; root copies are
byte-identical mirrors). Read `machine.json` via `python3 -m json.tool`-style
parse to get the authoritative state list. Read `README.md`, `CHANGELOG.md`,
`docs/{usage,methodology,installation}.md`, `.claude-plugin/plugin.json`,
`.claude-plugin/marketplace.json`, `scripts/gate-check.mjs` (targeted greps:
`MIRROR_PAIRS`, the verb dispatch table), `tests/v3/version-triple-match.mjs`,
`delivery/decisions.md`, `delivery/v3/{CONTRACT,KICKOFF,STATUS,00-program-plan}.md`
(structure only). Read the three named field precedents in full:
`~/Workspace/Engine/Engine-Core/docs/implementation/0-done/praxya-sprint1-ads-rules/delivery/{GATE.md,KICKOFF.md,00-program-plan.md,STATUS.md}`
and `~/Workspace/Engine/Engine-Core/docs/implementation/0-done/open-sessions-closeout/DECISIONS.md`
+ `DECISIONS.html` (head, for the "Read more" card mechanic). Viewed
`delivery/v4/resources/Enhance plan-it/image.png` (the G1 gate as it renders
today). Ran targeted `grep -n` passes across SKILL.md + the four references for
every acronym in the brief's list, checking whether each is expanded at its
first literal use. Checked three live installs: `~/.claude-loudr/skills/plan-it/SKILL.md`,
`/Users/macbook/.claude/settings.json` (`enabledPlugins`), and this session's
own skill listing (system-reminder), which shows two live, different
`plan-it` skill descriptions side by side — direct in-session evidence, not
inference. Did not run `gate-check` verbs myself (Stream B's instrument); read
their source only to confirm exact file lists and hardcoded values.

## 1. Findings

**F-C1 [VERIFIED-IN-CODE].** `machine.json` has **17 states**
(`intake, dodLock, scopeGate, preGround, discovery, preflight, synthesis,
specAuthoring, decisionGate, coherencePass, freezeGate, backboneFreeze,
parallelPlanning, verify, adversaryGate, handoff, done`), but
`SKILL.md:110` prose says "**15 states**" and `SKILL.md:25` (frontmatter) is
silent on the count. `references/machine.md:26-28`'s printed diagram also lists
only 14 named states (omits `preflight` and `adversaryGate` from the arrow
chain, though both exist in `machine.json`). This is a live prose/code drift
bug independent of v4 — Stream C should fix the count in both places
regardless of what v4 adds, and Stream B should confirm whether `preflight`/
`adversaryGate` are meant to appear in that diagram.

**F-C2 [MEASURED].** The SKILL.md frontmatter `description` field is **1,738
characters** (measured via a Python parse of the frontmatter block,
`SKILL.md:3-36`). A subagent consulted for the Claude Code skill-loader's
documented limit reported (via `code.claude.com/docs/en/skills.md`, not
independently re-verified by me) that `description` + `when_to_use` are
**truncated at a combined 1,536 characters** in skill listings. SKILL.md has no
separate `when_to_use` field, so if that reported limit is accurate, the
description **already exceeds it by ~200 characters today**, before v4 adds a
single word about anamnesis, topology, or the HTML report layer. Tag this
[INFERRED] on the exact number (single subagent, not re-verified against
primary Anthropic docs) but the 1,738-character measurement itself is
[MEASURED] and independent of whether 1,536 is exactly right — the description
is already long enough that any v4 addition needs a compensating cut, not just
an append.

**F-C3 [VERIFIED-IN-CODE] + [MEASURED] — three-copy install drift, confirmed
sharper than SHARED-CONTEXT's LG-2.** Three live copies of plan-it coexist on
this machine:
- `~/.claude-loudr/skills/plan-it/SKILL.md` — `version: 2.1.0`
  (`~/.claude-loudr/skills/plan-it/SKILL.md:29`), `machine.json` `"version": "2.0.0"`
  (`~/.claude-loudr/skills/plan-it/machine.json:4`), but its **description
  prose already says `/build-it`** (post-rename) — a stale version number on
  fresh prose.
- The plugin at `plugins/plan-it/` — `version: 3.0.1` everywhere, current.
- `/Users/macbook/.claude/settings.json:96` has `"plan-it@plan-it": true` in
  `enabledPlugins` — the **old marketplace namespace** (pre-3.0.1's
  `plan-it@devotts` rename, CHANGELOG.md:6-16 M1) — pointing at
  `github:DevOtts/plan-it` directly (`settings.json:128-131`), not the
  `devotts` marketplace this repo's `.claude-plugin/marketplace.json` defines.
- **Directly observable in this very session's skill listing** (the
  system-reminder enumerating available skills): two different `plan-it`
  entries render side by side. One (unscoped `plan-it`) matches the
  `~/.claude-loudr` copy's build-it-aware prose. The other, labeled
  `plan-it:plan-it`, reads *"ready to hand to /fable-it. The front-end to
  /fable-it: plan-it plans it, fable-it builds it... predecessor to
  /next-session-prompt"* — **it still says `/fable-it`**, the name `build-it`
  replaced in commit `b264b06` ("docs: fable-it is now build-it (v3.1.0
  rename)"). This is the `plan-it@plan-it` old-namespace install actually
  resolving to stale content mid-session, not a hypothetical risk.

This confirms and sharpens LG-2: it is not just "two copies might shadow each
other," it is "two different, both-stale-relative-to-3.0.1 copies are visibly
loaded as separate skills right now, one of them referencing a command that no
longer exists."

**F-C4 [VERIFIED-IN-CODE].** Two *different* mirror/version mechanisms exist
and must not be conflated in v4 prose:
1. **`mirror-check`** (`scripts/gate-check.mjs:1556-1565`, `MIRROR_PAIRS`) —
   byte-identical file-content parity across **8 file pairs**: `SKILL.md`,
   `machine.json`, `gate-check.mjs` itself, `planit-guard.mjs`,
   `formats.md`, `machine.md`, `playbooks.md`, `templates.md` (root↔plugin).
2. **`version-triple-match`** (`tests/v3/version-triple-match.mjs:51-58`) —
   version-*number* parity across **6 declaration sites**: `plugin.json`,
   `marketplace.json` (`plugins[plan-it].version`), `SKILL.md` root frontmatter,
   `SKILL.md` plugin-mirror frontmatter, `machine.json` root, `machine.json`
   plugin-mirror — checked against `CHANGELOG.md`'s top `## X.Y.Z — date`
   heading. This script hardcodes `EXPECTED = "3.0.1"` at line 24 — **it must
   be edited by hand for the 4.0.0 release**, it is not self-discovering.
   `templates.md` and `playbooks.md` and `machine.md` are NOT part of this
   6-site version check (they carry no `version:` field of their own).
`CHANGELOG.md:150-156` ("### Verification") already names both checks by these
exact names (`mirror-check 8/8`, `version-triple-match` + `changelog-shape`),
so the release-checklist section is the right anchor — it just needs its 6/8
counts to survive whatever files v4 adds (if v4 adds new mirrored files, both
lists and both counts change).

**F-C5 [VERIFIED-IN-CODE] — docs/methodology.md is already stale, independent
of v4.** `docs/methodology.md:7` heads with "## The four non-negotiable
rules," but `SKILL.md:57` has had **five** rules since the v2 deterministic-core
release (Rule 5, "Run the machine, not the prose," `SKILL.md:90-98`). A full
grep of `docs/methodology.md` for "machine," "prose," or "Rule 5" returns zero
hits — the whole deterministic-core rule is simply absent from this doc. This
is a pre-existing defect the 4.0.0 packaging pass should fix regardless of
whether any E1–E10 work touches it, since v4's own new rules/rulings will
compound onto an already-wrong rule count if not caught first.

**F-C6 [VERIFIED-IN-CODE] — acronym expansion audit.** Grepped SKILL.md +
all four references for every token in the brief's list; result per token
(✗ = never expanded anywhere in these 5 files; ✓ = expanded at or near first
use):
| Token | Status | Evidence |
|---|---|---|
| G1/G2/G3 | ✓ | Defined together in the "Autonomy posture" table, `SKILL.md:192-196`, before their first *phase-header* use at `SKILL.md:249` |
| DoD | ✗ (badly ordered) | First literal use `SKILL.md:164` ("DoD = 100%..."), reused at `:194`, `:231` (a phase *header*: "Phase 1 — DoD lock"), `:238`. "Definition of Done" is spelled out for the first and only time at `SKILL.md:181`, i.e. **17+ lines and one phase-header after "DoD" first appears unexplained** |
| PRD | ✗ | Used from the frontmatter (`SKILL.md:10`) onward, and throughout all four references (e.g. `templates.md:179-204`, `formats.md`); "Product Requirements Document" or any spelled-out form appears **nowhere** in these 5 files |
| CDP | ✗ | `SKILL.md:172` "Chrome CDP" — "Chrome DevTools Protocol" never spelled out anywhere in these 5 files |
| ATDD/BDD | ✗ | `SKILL.md:146` — never expanded |
| EDD (Eval-Driven Development) | ✓ | Spelled out in full at first use, `SKILL.md:147` |
| SbE (Specification by Example) | ✓ | Spelled out in full at first use, `SKILL.md:145` (though the acronym "SbE" itself never appears — the term is always spelled out, which is actually the *safer* pattern) |
| xhigh | ✗ | `SKILL.md:7, 198-199` — never explained as a Claude Code `/effort` reasoning-level setting; a fresh reader (human or conductor agent) has to already know what `/effort xhigh` means |
| D4 | ✗ | `SKILL.md:119, 391, 498` — always glossed as "(Rule 6 / D4)" but D4 itself (a decision ID from the v3 field-study package) is never explained; a reader only gets "adversarial-depth" from surrounding prose, never what "D4" refers to as an identifier |
| [REAL] | ✓ | Explained in place at first use, `SKILL.md:165-166` |
| IMPLEMENTED-NOT-VERIFIED | ✓ | Self-explanatory compound term, used consistently; never abbreviated inconsistently |
| FD-1/FD-2, W1–W6, CB-n, T-\<EID\>-NN | n/a in SKILL.md | These live only in `references/formats.md`/`playbooks.md`/`CHANGELOG.md` as *grammar examples* (e.g. `formats.md:43-46` "G-1 No PII column..."), not as SKILL.md prose terms — see F-C7 for the collision risk this creates |
| S/M/L | ✓ | Table with per-row meaning, `SKILL.md:254-260` |
| Shape 1–5 | ✓ | One-line definition per shape inline, `SKILL.md:265-270`, full definitions in `templates.md` PART D |

Net: **PRD, CDP, ATDD/BDD, xhigh, and D4 are never expanded anywhere in the
skill package**, and **DoD is used unexplained across three separate sections
before its one spell-out appears**. There is currently no instruction anywhere
in SKILL.md telling the model to expand acronyms in the artifacts *it
produces* (the G1 prompt, the G2 decision list, the final Phase 10 report) —
this is the real gap E10 must close, not just fixing this document.

**F-C7 [VERIFIED-IN-CODE] — a naming collision risk worth flagging to
synthesis.** Two independent ID grammars use near-identical tokens for
unrelated things:
- `G1`/`G2`/`G3` (no dash) = the three human **gates** (`SKILL.md:192-196`).
- `G-1`/`G-2`/... (with a dash) = per-project **governance rules** a squad
  invents inside its own CONTRACT (`formats.md:37-49`, example: "G-1 No PII
  column ever stores message content").
Similarly, `W0`–`W4` = build **waves** in a program plan (confirmed pattern in
the Engine-Core precedent, `00-program-plan.md §2`), while `W1`–`W6` in
`CHANGELOG.md:49-131` = plan-it's own internal **write-time invariant** IDs (a
different, plan-it-core-specific numbering that has nothing to do with a
delivered package's waves). A generated package that uses both "W2" (a wave)
and, say, a governance rule "G-2" side by side is exactly the kind of
one-dash-apart, unglossed-ID confusion GLOSSARY.md (E10) and a per-artifact
legend line should resolve — see §4.

**F-C8 [VERIFIED-IN-CODE] — the G1 gate today, screenshotted live
(`delivery/v4/resources/Enhance plan-it/image.png`).** The rendered gate is a
bare menu: *"Gate G1 — approve the scope for the permissions plan-it run?"*
with four options — "Size L, Shape 1 (Recommended)" (one line of gloss: "Full
multi-doc set... Matches the multi-repo blast radius"), "Size M, leaner
package," "Adjust DoD first," "Type something," "Chat about this." Nothing on
screen defines what "Shape 1" *produces* (file tree, session count, gates the
human will face downstream), what it *costs* the human in later interruptions,
or what a wrong pick looks like later. This is the live artifact E1 exists to
fix — the gap is not hypothetical, it is what ships today. The same screenshot
also shows the actual archiving mechanism for a finished run: `mv
.plan-it/state.json .plan-it/state-2026-07-20-google-drive-shared-drive.done.json`
— confirming LG-3's "archiving a done run is a manual mv" as directly observed,
not inferred, and confirming the naming pattern (`state-<date>-<slug>.done.json`)
a hand already converged on before E9 exists to formalize it.

**F-C9 [VERIFIED-IN-CODE] — field precedents read and their exact shapes
worth porting.** `GATE.md` (praxya-sprint1-ads-rules) is a 31-line file with
exactly three sections: `## Answered` (a `| # | Decision/authorization | Answer |`
table, ids `G-1`..`G-7`), `## Still human, but NOT blocking the run` (a
`| # | Item | Owner | When |` table, ids `H-1`..`H-3`), `## Standing rules the
orchestrator enforces` (three bullet points, e.g. the usage-limit-resilience
rule). `00-program-plan.md §1` is a `| # | Session name | Role | Opens when |`
table (6 rows) whose session-name column doubles as the literal string passed
to `/rename`, cross-referenced by every squad's launch prompt in `KICKOFF.md`
("Register with the orchestrator (SendMessage 's1-ads-orchestrator': ...)").
`00-program-plan.md §3` ("Orchestrator overnight runbook") is a 6-item numbered
list: Dispatch → Verify on disk → Merge+deploy per lane → Usage-limit
resilience → Meta-write boundary → Reap. `STATUS.md` uses a states legend line
("backlog · in-progress · built · deployed · VERIFIED · IMPLEMENTED-NOT-VERIFIED
· blocked") plus one wide `| Epic | Lane/session | Wave | State | Evidence |`
table, and a reverse-chronological `## Log` of dated one-line entries — this is
the closest existing precedent to an E8 "residual disposition" surface: the
`Evidence` column already carries ad hoc dispositions like *"D1-12 FAIL-vs-bar
84.3% ... chronic upstream ... not S1-D code"* and *"C5-10 IMPLEMENTED-NOT-VERIFIED
BY G-3 DESIGN"* — proving the pattern is real and already hand-invented, just
never templated. `DECISIONS.md` (open-sessions-closeout) is an 8-column-narrower
version: one `| ID | Ruling | Effect/where it executes |` table plus a
`## Wave gates — final state` table, with an HTML twin (`DECISIONS.html`) that
adds `<details class="more"><summary>Read more</summary>` cards per ruling
(Stream A builds the renderer; this file is the content shape it renders).

## 2. What v3 has that v4 builds on (reuse map)

| v3 asset | v4 use |
|---|---|
| `formats.md` §1 Decision log grammar (`[DECIDED]`/`[CHANGED]`/`[CONFIRM: owner]`, `templates.md`'s roadmap-doc "Decisions locked" table) | Becomes the row grammar inside the new DECISIONS.md (E3) — same tags, new home (a dedicated file instead of buried in `06 §4`) |
| `formats.md` §2 Open-questions-as-blocking-table (`\| # \| Question \| Owner \| Blocks \|`) | Becomes the "open cards" half of the decision queue (E3) — unanswered items with a `Blocks` column already do half of what E3 asks for |
| `formats.md` §7 DoD ladder (Task/Epic/Release rungs, honest status vocabulary) | E8's residual-disposition taxonomy is a 4th rung under Release DoD — extends, doesn't replace |
| `templates.md` KICKOFF.md block ("0. Pinning," re-derive-tally-first instruction) | Stays completely as-is (SHARED-CONTEXT: "KICKOFF.md + its single launch prompt STAY"); SESSIONS.md (E4) is a sibling file KICKOFF.md's reading-order list gains a pointer to, not a replacement |
| `00-program-plan.md` skeleton §1 "Squads (name · repo lane · owns)" (`templates.md:129`) | Direct ancestor of SESSIONS.md's session-name/role/opens-when table — the field precedent (F-C9) shows the richer, already-battle-tested version of this exact row shape |
| `playbooks.md` §E "Handoff artifacts" (README consolidation hub, `KICKOFFS.md` archive, `-CONCLUDE` phase, `AS-BUILT.md`) | E4's SESSIONS.md and E7's PLAN-REVIEW.md are new entries in this same "optional enrichments" family — same section, more rows |
| `playbooks.md` §F pre-handoff consistency gate (11 numbered items, `machine.md` marks 4 of them mechanizable) | Gets a 12th item (first-use acronym lint, E10) — see §4 |
| `machine.md` §5 "Model the confusing parts" | E7's anamnesis and E1's scope brief are the same medicine applied one phase earlier — "don't let the model work blind" now also covers "don't let the *human* pick blind" |
| Autonomy posture table (`SKILL.md:188-199`) | E7 needs a second table for autonomous-draft mode; this reuses the exact 3-column shape (`\| Gate \| When \| What you ask \|`) with rows redefined, not a new grammar |
| `references/` file-set + mirror discipline (8 pairs) | Every new template (GATE.md, SESSIONS.md, DECISIONS.md, GLOSSARY.md, SCOPE-BRIEF.md, PLAN-REVIEW.md, ANAMNESIS.md skeletons) is additive content *inside* `templates.md` — it does not create new mirrored files unless Stream A's renderer needs its own new script (that file would become mirror pair #9) |

## 3. Gaps v4 must close

1. **(E1)** No scope brief exists before G1 fires; the gate is a bare menu
   (F-C8). SKILL.md has no phase, and `templates.md` PART D has no template,
   for a document that explains what a size/shape/topology pick *produces*,
   *costs*, and *when it's wrong* before the human is asked to approve it.
2. **(E3)** Decisions collected at G2 live only inline inside `06 §4` of the
   roadmap doc (`SKILL.md:411`) — there is no dedicated ruled-decisions
   artifact, no "why nobody should pick for you" framing, and no mechanism to
   carry a ruling forward into an autonomy contract the way GATE.md does
   (F-C9). `templates.md` PART B has no DECISIONS.md or GATE.md skeleton.
3. **(E4)** "Topology" (solo / orchestrator+squads / headless) does not exist
   as a G1 axis anywhere in SKILL.md — Phase 2 (`SKILL.md:249-277`) picks size
   + shape only. There is no SESSIONS.md skeleton, though the exact row shape
   it needs already exists and is proven in the field precedent (F-C9).
4. **(E7)** No anamnesis step exists in Phase 0 intake
   (`SKILL.md:203-228`) — the skill starts research immediately with no
   up-front questionnaire about credentials, fences, naming, or live-probe
   authorization. The Autonomy posture table (`SKILL.md:188-199`) has exactly
   one mode (three chat gates); there is no autonomous-draft mode, no
   PLAN-REVIEW round, and no default-marking convention for applied
   recommendations.
5. **(E8)** `STATUS.md`'s skeleton (`templates.md:171-177`) has a plain
   `Status` column with no disposition taxonomy; `formats.md`'s DoD ladder
   (§7) stops at Release DoD with no "what happens to a case that misses the
   ship boat" rung. The field precedent (F-C9, `STATUS.md`'s free-text
   Evidence column) shows dispositions are already being hand-invented per-run
   with no shared vocabulary — exactly the drift a template prevents.
6. **(E10)** Five terms (PRD, CDP, ATDD/BDD, xhigh, D4) are used unexpanded
   throughout the package (F-C6); DoD is used long before its one spell-out;
   there is no "Output discipline for humans" instruction anywhere telling the
   model to expand acronyms in what it *produces* (chat gates, final report);
   no GLOSSARY.md template exists; the G1-vs-G-n / W-wave-vs-W-invariant
   collision (F-C7) has no legend convention to defuse it.
7. **(Packaging, all of E1–E10)** `docs/methodology.md` is already one rule
   short of SKILL.md (F-C5) — a pre-existing defect the 4.0.0 pass must fix or
   every new v4 rule/ruling compounds onto a doc that was already wrong.
   `version-triple-match.mjs`'s `EXPECTED` constant (F-C4) is hardcoded to
   `3.0.1` and must be hand-edited to `4.0.0` — it is not a thing that
   auto-passes on a version bump.
8. **(Packaging, E10-adjacent)** LG-2 is not just a latent risk — it is a
   live, in-session-observable bug (F-C3): the old-namespace plugin install
   and the bare skill-copy both serve stale, mutually-different content
   right now, one of them naming a command (`/fable-it`) that has not existed
   since commit `b264b06`. This is a Fernando-owner action (clean up
   `enabledPlugins`/the stray skill copy), not a code fix, but v4's README
   and installation docs should say so explicitly so it isn't silently
   inherited into the 4.0.0 release notes as someone else's problem.
9. **(Packaging)** The frontmatter `description` is measured at 1,738
   characters (F-C2) with a likely governing limit around 1,536 (reported,
   not independently confirmed) — v4 cannot simply append "anamnesis,
   topology, autonomous-draft, HTML report" to the existing prose; something
   has to be cut first, and the actual limit needs primary-source
   confirmation before the cut is sized.

## 4. Design proposal for this concern

### 4a. SKILL.md touch-map (every line range that changes or is added)

| Anchor (current) | Change | Owning enhancement(s) |
|---|---|---|
| `SKILL.md:3-36` frontmatter `description` | Trim ~250-400 chars of the existing prose (the "Auto-sizes from..." sentence and the second "conductor agents" clause are the softest cuts — restate once, not twice) to make room for one clause each on anamnesis, topology, and the HTML report twin. Target: stay under whichever limit F-C2's follow-up confirms, with margin | E1, E4, E7, E10 (packaging) |
| new section after `SKILL.md:199` (end of "Autonomy posture") | Add **"## Output discipline for humans"** — the E10 first-use rule (see 4f) plus the legend rule for gate/board messages carrying per-run IDs (G-n, T-\<EID\>-NN, wave numbers) | E10 |
| `SKILL.md:203-228` Phase 0 — Intake | Add an **anamnesis** step: one batched questionnaire (see 4e) run immediately after capturing the raw vision, before Phase 1. Also update the resume-protocol prose (currently "`.plan-it/state.json`" singular, `SKILL.md:205-209`) to name the run slug once E9 lands (pointer to Stream B for the mechanism; SKILL.md prose is this stream's job) | E7, E9 (pointer only) |
| new phase between current Phase 0 and Phase 1 (i.e. after `SKILL.md:228`) | Add **"Phase 0.5 — Triage verdict"** (E6): read-only measurements → one of `Plan now / Build instead / Owner decision / Skip`, with a stale-fact badge on any measurement older than the session. (E6 is flagged [VERIFIED-IN-CODE: out of my scope per the brief] as a machine-state question for Stream B — I only note the SKILL.md insertion point, not the state name) | E6 (pointer), reference only |
| `SKILL.md:231-247` Phase 1 — DoD lock | No structural change; fix the DoD-before-spelled-out ordering (F-C6) by adding one clause at first use ("DoD — Definition of Done for this planning run" at line 231's header, or add "(Definition of Done)" the first time `DoD` appears, `SKILL.md:164`) | E10 |
| `SKILL.md:249-277` Phase 2 — Scope & shape governor, G1 | (a) Add **topology** as a third axis alongside size + shape — a new table (Solo / Orchestrator+squads / Headless, each with a one-line "when" + a recommendation slot) modeled on the existing size table at `:254-260`. (b) Before presenting the G1 menu, generate and show the **SCOPE-BRIEF** (see 4b) — insert "Present the SCOPE-BRIEF, then the chosen size + shape + topology + numbered DoD" ahead of the existing "Present the chosen size + shape + the numbered DoD" sentence at `:274` | E1, E4 |
| `SKILL.md:188-199` Autonomy posture table | Keep as the **guided-mode** table (relabel header "Autonomy posture — guided mode"); add a second table "Autonomy posture — autonomous-draft mode" directly below with one row: **PLAN-REVIEW** (after Phase 6/7 combined) — "specs + decisions + defaults drafted; review and contradict anything wrong, otherwise this ships as-is" | E7 |
| `SKILL.md:409-423` Phase 7 — Decision round, G2 | Guided mode: unchanged, but decisions now write to the new **DECISIONS.md** (see 4c) instead of only `06 §4` inline (the roadmap doc keeps a pointer + the locked-summary table, DECISIONS.md carries the full ruled ledger + open cards). Autonomous-draft mode: this phase and Phase 8 collapse into the single PLAN-REVIEW round — recommended answers are applied and marked `[default — contradict if wrong]` inline in the docs, no chat stop | E3, E7 |
| `SKILL.md:426-444` Phase 8 — Backbone freeze, G3 | Guided mode: unchanged. Autonomous-draft mode: folded into the same PLAN-REVIEW round as Phase 7 (one review-and-contradict pass covers both "are the decisions right" and "is the frozen backbone right") | E7 |
| `SKILL.md:448-481` Phase 9 — Parallel planning | When topology = orchestrator+squads, this phase's squad fan-out is exactly what SESSIONS.md (4d) documents as sessions to open — add one sentence: "record each squad's session name in SESSIONS.md as it's dispatched" | E4 |
| `SKILL.md:485-533` Phase 10 — Verify + handoff | (a) Add a **residual-disposition pass** before "Fill the board": every epic's non-100%-passing cases get tagged `backlog-with-reason` / `owner-gated` / `IMPLEMENTED-NOT-VERIFIED`; contract cases are explicitly barred from silently moving to backlog (one sentence enforcing this). (b) "Assemble" bullet (`:509-515`) gains SESSIONS.md + GATE.md to the file list when topology warrants them. (c) Note the HTML twin exists beside each md file (pointer to Stream A; one sentence, not a redesign) | E8, E4, E2 (pointer) |
| `SKILL.md:537-543` Composes with | Add GLOSSARY.md's handoff-lint role as a one-line mention (it's a generated artifact, not a composed tool, so it's a small addition, not a new row) | E10 |
| `SKILL.md:545-561` References | Add one bullet each once `templates.md` gains the new skeletons: mention GATE.md/SESSIONS.md/DECISIONS.md/GLOSSARY.md/SCOPE-BRIEF.md/PLAN-REVIEW.md/ANAMNESIS.md live in `templates.md` PART B/E as appropriate | E1, E3, E4, E7, E10 |

### 4b. SCOPE-BRIEF.md (E1) — content model

Produced at Phase 2, before the G1 menu renders (closes F-C8's gap directly).
One file, generated fresh per run (not a static doc), following the existing
`templates.md` skeleton-block convention:

```
## SCOPE-BRIEF — <one-line demand summary>

### What this looks like at each size
| Size | docs/ | delivery/ | Typical session count |
|---|---|---|---|
| S | ... | ... | 1 (solo) |
| M | ... | ... | 1–2 |
| L | ... | ... | orchestrator + N squads |
(rows populated from templates.md PART C, not re-typed by hand)

### What this looks like at each shape (only the 2-3 shapes the use-case
### signal actually narrowed to — never show all 5)
Shape <N> — <name>: produces <file tree>. Fits when <use-case signal>.
Wrong when <the disqualifying signal — e.g. "you don't yet have a repo to
ground against">.

### Topology (solo / orchestrator+squads / headless) — see 4d's axis
For the recommended topology: <what sessions open, what each does, in one
line — a preview of SESSIONS.md, not the full table>.

### What this costs you
- Gates you'll be asked to clear: <G1 now, G2/G3 or one PLAN-REVIEW later,
  each with what it will ask>
- Estimated fan-out size: <N research agents / N squads>
- Recommendation: <size, shape, topology> — <why, in one sentence>

### When this is the wrong choice
<the one or two honest disqualifiers for the recommended combination — e.g.
"if this touches a live production system you haven't listed, add the
live-grounding pass before freezing, which adds a phase">
```

Grounding: `PART C` (sizing cheat-sheet, `templates.md:245-253`) and `PART D`
(shapes, `:255-332`) already have every fact this needs — SCOPE-BRIEF is a
**rendering** of existing tables into the specific combination the intake
signals point at, not new domain knowledge. This is exactly the gap the G1
screenshot (F-C8) shows: the menu names "Shape 1" but the human has to already
know what that means from having read `templates.md` themselves.

### 4c. DECISIONS.md (E3) — ruled ledger + open cards

Modeled directly on the two read field precedents (F-C9), reconciled:

```
# DECISIONS.md — <project> decision queue

## Ruled
| ID | Decision | Ruling | Effect / where it lands | Ruled by · date |
|---|---|---|---|---|
| D1 | ... | [DECIDED]/[CHANGED] ... | <epic/phase it unblocks> | <owner, date> |

## Open — recommendation attached, nobody should pick for you
| ID | Question | Recommendation | Why nobody should pick for you | Blocks |
|---|---|---|---|---|
| D4 | ... | ... | <the genuinely irreversible/vision-shaping reason> | <epic/phase> |

## Rulings carried forward from a prior run/round (if any)
<same row shape as Ruled, sourced from an earlier DECISIONS.md — never
silently dropped>

## Copy-your-rulings block
<a single fenced block the human can paste back numbered answers into, same
mechanic as the G2 "answer by number" convention already in SKILL.md:414>
```

The `[DECIDED]`/`[CHANGED]`/`[CONFIRM: owner]` tags reuse `formats.md` §1
verbatim (no new tag vocabulary). The "Open" table's `Blocks` column reuses
`formats.md` §2's blocking-table grammar. Once every Open row is ruled, the
**answered** rows promote into **GATE.md** (4's next block) as the autonomy
contract for the build phase — DECISIONS.md is the *planning-time* queue,
GATE.md is the *build-time* contract; they share row content but serve
different readers (Fernando during planning vs. the orchestrator during
build). This matches the brief's "answered queue becomes GATE.md" instruction
exactly.

### 4d. GATE.md (E7 autonomy contract) + SESSIONS.md (E4) — content models

GATE.md, modeled 1:1 on the field precedent (F-C9), generalized:

```
# GATE — <project> decisions & authorizations (the autonomy contract)

> Everything the build needs from a human, answered up front. Anything new
> the build surfaces gets appended here, and parked as
> IMPLEMENTED-NOT-VERIFIED (never guessed) only if truly blocking.

## Answered (owner: <name> · <date>)
| # | Decision / authorization | Answer |
(promoted from DECISIONS.md's Ruled table, 1:1)

## Still human, but NOT blocking the run
| # | Item | Owner | When |
(things a human still must eventually do — e.g. click a first real approval —
that do not gate the autonomous run itself)

## Standing rules the orchestrator/builder enforces
(usage-limit resilience, [REAL]-unreachable → INV never a fake green, new
genuinely-human decision → append here + conservative-path default — the
exact three rules the field precedent already carries verbatim)
```

SESSIONS.md, modeled on `00-program-plan.md §1` (F-C9), generalized beyond
"squads" to any topology:

```
# SESSIONS.md — sessions to open (exact names for /rename)

| # | Session name | Role | Reads | Opens when | Launch prompt |
|---|---|---|---|---|---|
| 1 | <slug> | Orchestrator/Solo/Squad-<N> | CONTRACT.md, GATE.md, <own PRD+epics only> | First / Wave N | (link to the exact block below) |

## Launch prompts
(one fenced block per session, the exact copy-paste text — same mechanic
KICKOFF.md already uses for its single launch prompt, just one block per row
here instead of one block total)

## Orchestrator runbook (only if topology = orchestrator+squads)
1. Dispatch  2. Verify on disk (idle ≠ delivered)  3. Merge+deploy per lane
4. Usage-limit resilience  5. <domain-specific boundary, e.g. write scope>
6. Reap
(the exact 6-step shape of the field precedent's §3 — proven, reuse verbatim,
let the domain-specific step 5 vary)
```

KICKOFF.md's reading-order list (`templates.md:150-169`) gains one line: "if
SESSIONS.md exists, each session reads only its own row" — this is the only
edit KICKOFF.md needs; its 9-block structure otherwise stays exactly as it is
(per SHARED-CONTEXT: "KICKOFF.md + its single launch prompt STAY").

### 4e. ANAMNESIS.md (E7) — the questionnaire

Runs once, in Phase 0, before pre-grounding. Batched like G2 (numbered,
answer-by-number), but earlier and about the *run's terms*, not its content:

```
## ANAMNESIS — before we start

1. Access & credentials this run may probe: <list what's found so far;
   ask which are live-testable vs off-limits>
2. Fences: anything explicitly not-to-touch? (folds straight into the DoD's
   existing "Assumptions" list, `SKILL.md:244`)
3. Naming: any existing convention for new entities/branches/sessions this
   run must match?
4. Topology preference, if you already know it (else: recommendation at G1)
5. Live-probe authorization: may this run make read-only live calls during
   live-grounding (Rule 4, `SKILL.md:80-88`)? Any calls that mutate anything,
   even dummy objects?
6. Decisions you already know the answer to (so G2/DECISIONS.md doesn't
   re-ask something you've already told us)
```

Answers seed both the DoD's Assumptions list (item 2) and DECISIONS.md's
Ruled table (item 6) directly — this questionnaire is not a new gate, it's
intake enrichment that reduces what G2/DECISIONS.md has to ask later.

### 4f. GLOSSARY.md (E10) + the first-use rule

**The rule** (new SKILL.md section, "Output discipline for humans," inserted
after `:199`):

> On first use of any acronym or ID-like token in a **human-facing surface**
> (a gate prompt, the DECISIONS.md/GATE.md rows, the Phase 10 final report),
> expand it once: `DoD (Definition of Done)`, `PRD (Product Requirements
> Document)`, and so on. IDs invented *for this run* (governance rules `G-n`,
> epic IDs `T-<EID>-NN`, waves `W0..WN`) are not universal vocabulary — carry
> a one-line legend wherever three or more appear together in one artifact
> (e.g. a STATUS.md header: "G-n = governance rule, T-<EID>-NN = test case,
> Wn = build wave — see GLOSSARY.md"). This is exactly what defuses F-C7's
> G1-vs-G-n collision: the legend, not a renamed ID grammar (renaming would be
> a non-additive machine/format change, out of scope per the hard
> constraints).

**GLOSSARY.md** — generated, seeded with the static plan-it vocabulary,
appended with this run's invented IDs:

```
# GLOSSARY.md — <project>

## plan-it vocabulary (static — same every run)
| Term | Meaning | Defined in |
|---|---|---|
| G1/G2/G3 | the three human gates (Scope/Decisions/Delivery) | SKILL.md — Autonomy posture |
| DoD | Definition of Done | SKILL.md Phase 1 |
| PRD | Product Requirements Document | templates.md PART B |
| [REAL] | test case needing a live target; never VERIFIED on a mock | formats.md — Test Contract |
| IMPLEMENTED-NOT-VERIFIED | code exists, the proving case couldn't run | formats.md §7 |
| CDP | Chrome DevTools Protocol (drives the UI half of a use-case) | formats.md §4a |
| ATDD/BDD | Acceptance Test-Driven / Behavior-Driven Development | SKILL.md — Test Contract |
| SbE / EDD | Specification by Example / Eval-Driven Development | SKILL.md — Test Contract |
| xhigh | Claude Code's highest `/effort` reasoning-level setting | SKILL.md — Autonomy posture |
| D4 | the adversarial-depth ruling (v3 field study) behind gate-check's `adversary` verb | machine.md §3 |

## This run's invented IDs (generated — appended as the run creates them)
| ID | What it names | First appears in |
|---|---|---|
(populated live: every G-n/CB-n/T-<EID>-NN/Wn this run mints, one row each,
so the handoff lint (4g) has something concrete to check against)
```

### 4g. E8 residual disposition — STATUS.md/epic-close addition

Extend `formats.md` §7's DoD ladder with a fourth rung, and extend
`templates.md`'s STATUS.md skeleton (`:171-177`)'s Status column to a closed
vocabulary instead of free text (closing the drift F-C9 shows already
happening by hand):

```
Residual disposition (closed vocabulary, one per non-100% case at epic close):
  backlog-with-reason   — deferred, with the reason inline (not a bare "TODO")
  owner-gated           — blocked on a human action named in GATE.md
  IMPLEMENTED-NOT-VERIFIED — code exists, [REAL] target unreachable this run
Rule: a case from the epic's binding Test Contract may NEVER be silently
reclassified as generic backlog — it must carry one of the three tags above,
visibly, in STATUS.md's Evidence column and the epic's own closing note.
```

This is additive to `formats.md` §7 (a new bullet under "Release DoD," not a
rewrite) and to the STATUS.md skeleton (one column constrained, not
restructured) — respects the "additive over v2/v3 core" hard constraint.

## 5. Test-contract seeds (candidate cases; how to run)

1. **SKILL.md contains the first-use rule.** `grep -c "Output discipline for
   humans" plugins/plan-it/skills/plan-it/SKILL.md` returns exactly 1 (and the
   root mirror matches). Given/when/then: given the shipped 4.0.0 SKILL.md,
   when grepped for the new section header, then it exists exactly once per
   copy.
2. **Every new template exists in templates.md with its required headings.**
   `grep -c "^# GATE\|^## GATE\|^### \`GATE.md\`"`-style check for each of
   GATE.md/SESSIONS.md/DECISIONS.md/GLOSSARY.md/SCOPE-BRIEF.md/PLAN-REVIEW.md/
   ANAMNESIS.md inside `templates.md`; assert count ≥ 1 for each of the 7 names
   and that each block contains its 2–4 required sub-headings (e.g. GATE.md's
   block must contain both "Answered" and "Standing rules").
3. **GLOSSARY seed covers every ID prefix used in the package.** Script:
   collect every `\b[A-Z]{1,4}-?\d\b`-shaped token that appears ≥2 times across
   a generated delivery package, assert each distinct *prefix* (`G`, `D`,
   `T-<EID>`, `W`, `CB`) has a corresponding row (static or generated) in that
   run's GLOSSARY.md. Given/when/then: given a completed delivery package,
   when the ID-prefix scan runs, then zero prefixes are un-glossed.
4. **Description frontmatter stays under the confirmed limit.** Once F-C2's
   1,536 figure is confirmed against primary Anthropic docs (flagged in §6 as
   an open question), a node script measures `SKILL.md`'s frontmatter
   `description` character count and fails if it exceeds the confirmed limit,
   for both the root and plugin mirror. [REAL] only in the sense that it
   needs the true limit confirmed once; the character-count check itself is
   fully offline/mechanizable.
5. **Version-quintuple-match at 4.0.0 (renamed from "triple" — 6 sites, not
   3).** `node tests/v3/version-triple-match.mjs` (or its v4 successor) with
   `EXPECTED = "4.0.0"` exits 0 across all 6 sites (F-C4) plus the
   `CHANGELOG.md` top heading. Given/when/then: given the 4.0.0 release
   commit, when the script runs, then all 6 sites + CHANGELOG agree.
6. **CHANGELOG 4.0.0 entry has the required sections.** `grep -c "^### "`
   under the `## 4.0.0` heading in `CHANGELOG.md` ≥ the same section set 3.0.0
   used (Founder mandates / Write-time invariants / Enforcement reach /
   Additive tooling / Deferred / Verification) — a structural, not content,
   check (mirrors the existing `changelog-shape` test's own approach,
   `tests/v3/changelog-shape.mjs`).
7. **README mentions the three v4 shifts.** `grep -E "anamnesis|topology|autonomous-draft"
   README.md` returns ≥1 hit for each of the three terms post-4.0.0 release —
   catches the "README never updated" failure mode CHANGELOG.md's own release
   checklist exists to prevent.
8. **docs/usage.md explains both modes.** After the 4.0.0 edit, `docs/usage.md`
   contains a section for guided mode (already exists, `docs/usage.md:15-27`)
   AND a new section for autonomous-draft mode with its own gate table (one
   PLAN-REVIEW row, not three). Mechanizable: assert both a "guided" and an
   "autonomous" heading-adjacent string exist.
9. **No `claude-*` literal in any prose.** `grep -rn "claude-[a-z0-9-]*-[0-9]"
   plugins/plan-it/skills/plan-it/ delivery/v4/` (excluding this research
   folder itself, which legitimately discusses model IDs in passing) returns
   zero hits — enforces hard constraint 4 (no hardcoded model IDs) across
   every new v4 prose file.
10. **docs/methodology.md rule count matches SKILL.md's rule count.**
    `grep -c "^### [0-9]\." docs/methodology.md` equals the count of
    `^\d\. \*\*` bullets under SKILL.md's "five non-negotiable rules" section —
    catches F-C5's pre-existing drift and prevents it recurring when v4 adds
    a 6th rule or ruling.
11. **`plan-it@plan-it` no longer resolves to stale content (owner action,
    [REAL], manual-tagged).** `manual: check /Users/macbook/.claude/settings.json`
    no longer lists `"plan-it@plan-it"` in `enabledPlugins`, OR the old
    marketplace source is confirmed to mirror `devotts`'s current content —
    this is Fernando's cleanup step (F-C3), not code, so it is explicitly
    `manual:` and excluded from the ≤30% ceiling's denominator only if the
    synthesis agrees it belongs in this package's contract at all (open
    question, §6).

Manual-tagged share: 1 of 11 (~9%) — comfortably under the ≤30% ceiling.

## 6. Contradictions / risks / open questions for synthesis

- **F-C2's 1,536-char limit is single-subagent-sourced, not independently
  confirmed against a primary Anthropic doc in this session.** The 1,738-char
  *measurement* of the current description is solid ([MEASURED], I ran the
  parse myself); the *governing limit* is [INFERRED] from one delegated
  lookup. Synthesis should either get a second confirmation or treat the
  test-contract seed (§5 item 4) as provisional on that number, not the fact
  that a cut is needed (a description that already touches ~1,700 characters
  needs trimming before any addition regardless of the exact ceiling).
- **F-C1's state-count/diagram mismatch (15 vs 17, and the diagram omitting
  `preflight`/`adversaryGate`) is Stream B's territory to confirm the cause,
  but the SKILL.md/machine.md *prose* fix is mine.** Flagging so synthesis
  assigns the fix to the right stream without duplicate work.
- **F-C7's G1-vs-G-n and W-wave-vs-W-invariant collisions are a design risk,
  not yet a defect** — no real package has visibly broken on it yet (the field
  precedent uses `G-1..G-7` for GATE.md rows and never a bare `G1` in the same
  file, so it hasn't collided in practice), but v4 deliberately introduces
  MORE per-run ID grammars (DECISIONS.md rows, GLOSSARY.md's own generated
  section) into the same package, raising the odds. The legend-line mitigation
  (4f) is proposed, not yet tested against a real generated package.
- **Whether `plan-it@plan-it`'s stale resolution (F-C3) belongs inside the
  v4 delivery package at all is a genuine open question, not just an
  owner-action footnote.** It's Fernando's settings, not code — but it is also
  directly reproducible evidence that the *install/upgrade story* for existing
  users is unverified end-to-end (a user who installed pre-3.0.1 may be
  silently stuck on stale content with no in-product signal). Whether v4 adds
  a startup self-check ("you appear to have a stale plan-it install") is a
  scope call for the decision queue, not something I should silently design in.
- **E6 (triage verdict) and E9 (named runs, archive/runs verbs, portfolio
  view) are flagged in my own touch-map only as insertion *points* in
  SKILL.md prose — I did not design their state/verb mechanics**, per the
  boundary the brief drew (Stream B owns machine states/verbs). If Stream B's
  design lands on different phase boundaries than I assumed (e.g. triage
  folds into `dodLock` rather than getting a new state), the SKILL.md phase
  numbering in my touch-map (a literal "Phase 0.5") will need renumbering to
  match whatever `machine.json` state name Stream B lands on.
- **docs/v3?** SHARED-CONTEXT.md asks me to check whether `docs/v3` exists as
  a precedent; it does not (`ls docs/` shows only `installation.md`,
  `methodology.md`, `research`, `usage.md`, `v3`, `v4` — the `v3` entry there
  is `docs/v3`, but I did not find independent content beyond what
  `delivery/v3/` already holds structurally; treating this as unresolved
  rather than asserting a finding I didn't verify the contents of).

## 7. Teammate boundaries

I did not design: the HTML manifest schema, the renderer script, or brand
token wiring (Stream A) — I only note where SKILL.md's Phase 10 "Assemble"
step needs a one-line pointer to the HTML twin, and that `assets/brand/`
(D2's ruling) does not exist yet in `plugins/plan-it/` (checked: `find
plugins/plan-it -iname "*brand*"` returns nothing) so SKILL.md's prose can't
name a concrete path for it yet. I did not design: the `machine.json` new
states/verbs for E6 (triage) or E9 (named runs, `archive`/`runs` verbs,
portfolio view), or any `gate-check.mjs` verb changes, or the exact
`.plan-it/<slug>.state.json` schema (Stream B) — I only marked the SKILL.md
prose insertion points that depend on those decisions and flagged the
renumbering risk if Stream B's boundaries land differently than assumed. I
did not independently re-verify E2's `~/.claude/skills/conclude-it/build-report.py`
(LG-5) beyond confirming it exists and is 147 lines — Stream A owns porting
it to node.

---
Absolute path: `/Users/macbook/Workspace/Devotts/plan-it/docs/v4/research/stream-C-prose.md`
